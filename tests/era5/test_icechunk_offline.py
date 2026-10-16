"""Offline metadata fixtures; never fetch source objects or observation chunks."""
import hashlib
import importlib.util
import json
import os
from pathlib import Path
import sys
import tempfile
import subprocess
import time
import unittest
from unittest.mock import patch
from contextlib import ExitStack

ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(ROOT / 'scripts/era5'))
try:
    import icechunk_offline as p
except ModuleNotFoundError:
    p = None


class BoundaryTests(unittest.TestCase):
    def test_parser_is_available_without_optional_import(self):
        self.assertIsNotNone(p, 'bounded offline parser implementation missing')

    @unittest.skipIf(p is None, 'implementation absent in initial red run')
    def test_strict_json_rejects_duplicate_nonfinite_deep_and_entry_overflow(self):
        for raw in (b'{"a":1,"a":2}', b'{"v":NaN}', b'{"v":1e999}',
                    b'[' * 33 + b'0' + b']' * 33,
                    b'[' + b'0,' * 100000 + b'0]'):
            with self.subTest(raw=raw[:40]), self.assertRaises(ValueError):
                p.strict_json(raw)
        self.assertEqual(p.strict_json(b'{"v":[1,true,null]}'), {'v': [1, True, None]})

    def test_json_entry_budget_is_shared_across_descriptors(self):
        budget = [100000]
        raw = b'[' + b'0,' * 50000 + b'0]'
        p.strict_json(raw, entry_budget=budget)
        with self.assertRaises(ValueError): p.strict_json(raw, entry_budget=budget)

    @unittest.skipIf(p is None, 'implementation absent in initial red run')
    def test_snapshot_id_rejects_aliases_path_escape_and_noncanonical_padding(self):
        self.assertEqual(p.snapshot_id('1CECHNKREP0F1RSTCMT0'), '1CECHNKREP0F1RSTCMT0')
        for bad in ('../repo', 'a' * 20, 'I' * 20, '0' * 19 + '1', '0' * 21, '0' * 19 + 'Z'):
            with self.subTest(bad=bad), self.assertRaises(ValueError): p.snapshot_id(bad)

    @unittest.skipIf(p is None, 'implementation absent in initial red run')
    def test_header_and_hash_binding_precede_native_parser(self):
        good = 'ICE🧊CHUNK'.encode() + b'fixture'.ljust(24, b' ') + bytes([2, 6, 0]) + b'payload'
        header = p.inspect_header(good, 'repo', hashlib.sha256(good).hexdigest(), len(good))
        self.assertEqual(header['fileType'], 6)
        for raw in (good[:38], b'bad' + good[3:], good[:36] + bytes([1, 6, 0]) + good[39:],
                    good[:37] + bytes([2, 0]) + good[39:], good[:38] + b'\x02' + good[39:],
                    good + b'x' * 1048576):
            with self.subTest(raw=raw[:40]), self.assertRaises(ValueError):
                p.inspect_header(raw, 'repo', hashlib.sha256(raw).hexdigest(), len(raw))
        for sha, length in (('0' * 64, len(good)), (hashlib.sha256(good).hexdigest(), len(good) - 1)):
            with self.assertRaises(ValueError): p.inspect_header(good, 'repo', sha, length)

    @unittest.skipIf(p is None or importlib.util.find_spec('compression') is None, 'Python 3.14 zstd unavailable')
    def test_zstd_expansion_truncation_and_multiple_frames_are_rejected(self):
        from compression import zstd
        head = 'ICE🧊CHUNK'.encode() + b'fixture'.ljust(24, b' ') + bytes([2, 6, 1])
        for payload in (zstd.compress(b'0' * (16777216 + 1)), zstd.compress(b'hello')[:-1],
                        zstd.compress(b'hello') + zstd.compress(b'other'), zstd.compress(b'hello') + b'junk', b'junk'):
            raw = head + payload
            with self.assertRaises(ValueError): p.prepare_object(raw, 'repo', hashlib.sha256(raw).hexdigest(), len(raw))
        raw = head + zstd.compress(b'hello')
        bound = p.prepare_object(raw, 'repo', hashlib.sha256(raw).hexdigest(), len(raw))
        self.assertEqual(bound['expandedBytes'][38:], b'\x00hello')
        self.assertNotEqual(bound['rawSha256'], bound['expandedSha256'])


class NativeChildTests(unittest.TestCase):
    @unittest.skipUnless(os.name == 'nt' and sys.version_info[:3] == (3, 14, 3)
                         and (ROOT / '.data/icechunk-metadata-deps/icechunk').is_dir(),
                         'approved Python3.14.3 optional target / Windows containment unavailable')
    def test_official_parser_in_sanitized_contained_child(self):
        sys.path.insert(0, str(ROOT / 'scripts/osm'))
        from global_source_supervisor import WindowsJob, rss_bytes
        with tempfile.TemporaryDirectory() as temp:
            temp = str(Path(temp).resolve())
            env = {'SYSTEMROOT': os.environ['SYSTEMROOT'], 'TEMP': temp, 'TMP': temp,
                   'USERPROFILE': temp, 'APPDATA': temp, 'LOCALAPPDATA': temp, 'HOME': temp,
                   'OPENBLAS_NUM_THREADS': '1', 'OMP_NUM_THREADS': '1', 'MKL_NUM_THREADS': '1',
                   'RAYON_NUM_THREADS': '1', 'TOKIO_WORKER_THREADS': '1', 'ZARR_CONFIG': '{}'}
            boot = ('import sys,runpy;sys.path[:0]=sys.argv[1:4];'
                    'sys.argv=[sys.argv[4],"--native"];runpy.run_path(sys.argv[0],run_name="__main__")')
            job = WindowsJob(512 * 1024**2, 2)
            child = None
            log = (Path(temp) / 'native-tests.log').open('w+b')
            try:
                child = subprocess.Popen([sys._base_executable, '-I', '-S', '-B', '-c', boot,
                    str(ROOT / 'scripts/era5'), str(ROOT / '.data/icechunk-metadata-deps'),
                    str(ROOT / '.data/weather-py314/Lib/site-packages'), str(Path(__file__).resolve())],
                    env=env, cwd=temp, stdout=log, stderr=subprocess.STDOUT, creationflags=4)
                job.assign_resume(child)
                deadline = time.monotonic() + 45
                while child.poll() is None:
                    if time.monotonic() >= deadline or rss_bytes(child) > 256 * 1024**2:
                        self.fail('native fixture deadline/RSS limit')
                    time.sleep(.02)
                log.seek(0)
                output = log.read().decode('utf-8', errors='replace')
                self.assertEqual(child.returncode, 0, output)
                trace = output.split('NATIVE_ACCESS_START', 1)[1].split('NATIVE_ACCESS_END', 1)[0]
                self.assertIn('Downloading snapshot', trace)
                self.assertIn('00000000000000000000', trace)
                self.assertNotIn('Downloading manifest', trace)
                self.assertNotIn('Downloading chunk', trace)
            finally:
                job.stop()
                if child is not None: child.wait(timeout=3)
                job.drain(); job.close()
                log.close()


@unittest.skipUnless('--native' in sys.argv, 'native fixtures execute only in contained optional child')
class OfficialFixtures(unittest.TestCase):
    def setUp(self):
        import icechunk
        import zarr
        self.ic = icechunk
        self.zarr = zarr
        self.temp = tempfile.TemporaryDirectory()
        self.addCleanup(self.temp.cleanup)
        self.root = Path(self.temp.name).resolve()
        self.repo = icechunk.Repository.create(icechunk.local_filesystem_storage(str(self.root / 'fixture')),
                                             spec_version=2, authorize_virtual_chunk_access={})
        session = self.repo.writable_session('main')
        group = zarr.group(store=session.store)
        for name in ('tcc', 'valid_time', 'latitude', 'longitude', 'status/expver', 'status/tcc'):
            group.create_array('single/temporal/' + name, shape=(2,), chunks=(2,), dtype='f4',
                               attributes={'fixture': 'metadata-only'})
        self.sid = session.commit('empty arrays only')
        self.raw = (self.root / 'fixture/repo').read_bytes()
        self.snapshot = (self.root / 'fixture/snapshots' / self.sid).read_bytes()

    def test_repo_only_resolves_main_then_fixed_descriptors_without_manifests(self):
        parser = p.OfflineRepository(self.root / 'quarantine', self.raw, p.digest(self.raw), len(self.raw))
        self.assertEqual(parser.resolve_main(), self.sid)
        self.assertEqual(list((parser.root / 'local').iterdir()), [parser.root / 'local/repo'])
        result = parser.inspect_snapshot(self.sid, self.snapshot, p.digest(self.snapshot), len(self.snapshot))
        self.assertFalse(result['scientificAdmission'])
        self.assertEqual(result['descriptors']['single/temporal/tcc/zarr.json']['attributes'],
                         {'fixture': 'metadata-only'})
        self.assertEqual(len(result['descriptors']), 6)
        self.assertEqual({path.relative_to(parser.root / 'local').as_posix()
                          for path in (parser.root / 'local').rglob('*') if path.is_file()},
                         {'repo', 'snapshots/' + self.sid})
        self.assertEqual((parser.root / 'originals/repo').read_bytes(), self.raw)
        with self.assertRaises(ValueError): parser.resolve_main()
        with self.assertRaises(ValueError): parser.descriptor('single/temporal/tcc/c/0')

    def test_bad_native_offsets_and_wrong_snapshot_identity_fail(self):
        raw = self.raw[:38] + b'\x00' + b'\xff' * 64
        parser = p.OfflineRepository(self.root / 'bad', raw, p.digest(raw), len(raw))
        with self.assertRaises(ValueError): parser.resolve_main()
        parser = p.OfflineRepository(self.root / 'good', self.raw, p.digest(self.raw), len(self.raw))
        parser.resolve_main()
        with self.assertRaises(ValueError):
            parser.inspect_snapshot('0' * 20, self.snapshot, p.digest(self.snapshot), len(self.snapshot))
        wrong = (self.root / 'fixture/snapshots/1CECHNKREP0F1RSTCMT0').read_bytes()
        with self.assertRaisesRegex(ValueError, 'Official local snapshot parser'):
            parser.inspect_snapshot(self.sid, wrong, p.digest(wrong), len(wrong))

    def test_uncompressed_native_limitation_and_trusted_frame_payload_equivalence(self):
        from compression import zstd
        bound = p.prepare_object(self.raw, 'repo', p.digest(self.raw), len(self.raw))
        self.assertEqual(zstd.decompress(bound['nativeBytes'][39:]), bound['expandedBytes'][39:])
        self.assertEqual(bound['nativeBytes'][38], 1)
        self.assertEqual(bound['expandedBytes'][38], 0)
        local = self.root / 'none'; local.mkdir()
        (local / 'repo').write_bytes(bound['expandedBytes'])
        with self.assertRaisesRegex(Exception, 'invalid compression algorithm'):
            self.ic.Repository.open(self.ic.local_filesystem_storage(str(local)), authorize_virtual_chunk_access={})
        self.assertNotIn('user_data', self.repo.inspect_snapshot(self.sid)['nodes'][0])

    def test_contained_job_overrides_persisted_preload_and_has_no_virtual_authorization(self):
        import icechunk_metadata as metadata
        metadata.require_containment()
        parser = p.OfflineRepository(self.root / 'quarantine', self.raw, p.digest(self.raw), len(self.raw))
        parser.resolve_main()
        self.assertEqual(parser._repo.authorized_virtual_container_prefixes, set())
        self.assertEqual(parser._repo.config.virtual_chunk_containers, {})
        self.assertEqual(parser._repo.config.manifest.preload.max_total_refs, 0)
        self.assertEqual(parser._repo.config.manifest.preload.max_arrays_to_scan, 0)
        # Read-only metadata access succeeds with neither manifests nor chunks present.
        result = parser.inspect_snapshot(self.sid, self.snapshot, p.digest(self.snapshot), len(self.snapshot))
        self.assertEqual(result['descriptors']['single/temporal/latitude/zarr.json']['shape'], [2])

    def test_real_official_parser_with_fake_byte_transport_uses_only_two_objects(self):
        import icechunk_metadata as metadata
        sys.path.insert(0, str(ROOT / 'tests/era5'))
        from test_icechunk_metadata import Response, Transport
        responses = []
        for body in (self.raw, self.snapshot):
            headers = [('Content-Length', str(len(body))), ('ETag', '"fixture"')]
            responses.extend((Response(headers=headers), Response(body, headers=headers)))
        transport = Transport(responses)
        folder = self.root / 'transport'; folder.mkdir()
        parser = None
        def resolve(body, root):
            nonlocal parser
            parser = p.OfflineRepository(root / 'quarantine', body, p.digest(body), len(body))
            return parser.resolve_main()
        def inspect(sid, body, root):
            return parser.inspect_snapshot(sid, body, p.digest(body), len(body))
        result = metadata.acquire(folder, transport, resolve, inspect, deadline=time.monotonic() + 120)
        self.assertEqual(result['mainSnapshotId'], self.sid)
        self.assertEqual(result['receivedBodyBytes'], len(self.raw) + len(self.snapshot))
        self.assertEqual(len(transport.calls), 4)
        self.assertFalse(result['unsupportedFeatureExclusionProved'])

    def test_trace_attempted_snapshot_access_including_missing_metadata_positive_control(self):
        from icechunk.store import IcechunkStore
        attempted = []
        original = IcechunkStore.get
        async def observed(store, key, *args, **kwargs):
            attempted.append(key)
            if key not in ('single/temporal/tcc/zarr.json', 'single/temporal/valid_time/zarr.json',
                    'single/temporal/latitude/zarr.json', 'single/temporal/longitude/zarr.json',
                    'single/temporal/status/expver/zarr.json', 'single/temporal/status/tcc/zarr.json'):
                raise AssertionError('forbidden attempted store key: ' + key)
            return await original(store, key, *args, **kwargs)
        self.ic.set_logs_filter('trace')
        print('NATIVE_ACCESS_START', file=sys.stderr, flush=True)
        try:
            with ExitStack() as guards:
                guards.enter_context(patch.object(IcechunkStore, 'get', observed))
                for name in ('s3_storage', 'gcs_storage', 'azure_storage', 'http_storage',
                             's3_store', 'gcs_store', 'azure_store', 'http_store'):
                    if hasattr(self.ic, name):
                        guards.enter_context(patch.object(self.ic, name,
                            side_effect=AssertionError('forbidden cloud factory: ' + name)))
                parser = p.OfflineRepository(self.root / 'quarantine', self.raw, p.digest(self.raw), len(self.raw))
                parser.resolve_main()
                result = parser.inspect_snapshot(self.sid, self.snapshot, p.digest(self.snapshot), len(self.snapshot))
            self.assertEqual(attempted, ['single/temporal/tcc/zarr.json', 'single/temporal/valid_time/zarr.json',
                    'single/temporal/latitude/zarr.json', 'single/temporal/longitude/zarr.json',
                    'single/temporal/status/expver/zarr.json', 'single/temporal/status/tcc/zarr.json'])
            self.assertEqual(result['parserVersions'], {'icechunk': '2.3.0', 'zarr': '3.1.6', 'python': '3.14.3'})
            # Missing *metadata* positive control: no data/chunk key is requested.
            with self.assertRaises(Exception): parser._repo.inspect_snapshot('0' * 20)
        finally:
            print('NATIVE_ACCESS_END', file=sys.stderr, flush=True)
            self.ic.set_logs_filter('warn')


if __name__ == '__main__':
    if '--native' in sys.argv:
        unittest.main(argv=[sys.argv[0]], defaultTest='OfficialFixtures')
    else:
        # The native suite executes only in the isolated contained child above.
        suite = unittest.TestSuite(unittest.defaultTestLoader.loadTestsFromTestCase(cls)
                                   for cls in (BoundaryTests, NativeChildTests))
        raise SystemExit(not unittest.TextTestRunner(verbosity=2).run(suite).wasSuccessful())
