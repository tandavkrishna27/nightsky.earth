"""No-network contract tests for the deferred sample adapter."""
import contextlib
import io
import hashlib
import json
from pathlib import Path
import sys
import tempfile
import time
import unittest
from unittest.mock import patch
from concurrent.futures import ThreadPoolExecutor

sys.path.insert(0, str(Path(__file__).resolve().parents[2] / 'scripts' / 'era5'))
import sample_live as live
import sample_executor as core


class Response:
    status_code = 200
    headers = {}
    closed = False

    def __init__(self, body): self.body = body
    def iter_content(self, size): yield self.body
    def close(self): self.closed = True


class Session:
    def __init__(self):
        self.headers = {}; self.cookies = {}; self.calls = []; self.responses = []
    def request(self, *args, **kwargs):
        self.calls.append((args, kwargs))
        result = self.responses.pop(0)
        if isinstance(result, Exception): raise result
        return result
    def get(self, url, **kwargs): return self.request('GET', url, **kwargs)
    def close(self): pass


class LivePreparation(unittest.TestCase):
    def allowance(self, directory, output):
        path = Path(directory) / 'allowance.json'
        path.write_text(json.dumps(dict(planSha256=core.identity(), allowExecution=True,
            maxSubmissions=1, maxRawBytes=core.RAW_LIMIT, outputRoot=live.canonical_output(output))))
        return path

    def test_allowance_cannot_be_reused_for_second_output_or_uncertain_resume(self):
        with tempfile.TemporaryDirectory() as directory:
            first = Path(directory) / 'first'; second = Path(directory) / 'second'
            allowance = self.allowance(directory, first)
            live.consume_allowance(allowance, first)
            with self.assertRaises(ValueError): live.consume_allowance(allowance, second)
            with self.assertRaises(FileExistsError): live.consume_allowance(allowance, first)
            with self.assertRaises(FileNotFoundError): live.consume_allowance(allowance, first, True)

    def test_concurrent_allowance_claim_has_exactly_one_winner(self):
        with tempfile.TemporaryDirectory() as directory:
            output = Path(directory) / 'output'; allowance = self.allowance(directory, output)
            def claim(_):
                try: live.consume_allowance(allowance, output); return True
                except FileExistsError: return False
            with ThreadPoolExecutor(max_workers=2) as pool:
                self.assertEqual(sorted(pool.map(claim, range(2))), [False, True])

    def no_credentials(self, key, default=None):
        if key == 'CDSAPI_KEY': raise AssertionError('credential read')
        return default

    def adapter(self):
        sessions = [Session(), Session()]
        adapter = live.Adapter('secret-token', lambda: sessions.pop(0))
        return adapter

    def test_default_does_not_read_credentials_or_create_http(self):
        with patch.object(live.os.environ, 'get', side_effect=self.no_credentials):
            with contextlib.redirect_stdout(io.StringIO()): live.main([])

    def test_wrong_allowance_stops_before_credentials(self):
        with tempfile.TemporaryDirectory() as temp:
            allowance = Path(temp) / 'allowance.json'; allowance.write_text('{}')
            with patch.object(live.os.environ, 'get', side_effect=self.no_credentials):
                with self.assertRaises(ValueError):
                    live.main(['--execute', '--owner-allowance', str(allowance), '--output', temp])

    def test_submit_exact_contract_and_no_secret_exception(self):
        adapter = self.adapter()
        adapter.api.responses = [Response(json.dumps({'links': [{'rel': 'monitor',
            'href': live.BASE + '/jobs/abc'}]}).encode())]
        self.assertEqual(adapter.submit(core.DATASET, core.REQUEST, 3), 'abc')
        args, kwargs = adapter.api.calls[0]
        self.assertEqual(args, ('POST', live.BASE + '/processes/' + core.DATASET + '/execution'))
        self.assertEqual(kwargs['json'], {'inputs': core.REQUEST})
        self.assertFalse(kwargs['allow_redirects'])
        adapter.api.responses = [RuntimeError('secret-token https://private/?signature=secret')]
        with self.assertRaises(ValueError) as error: adapter.status('abc', 3)
        self.assertNotIn('secret', str(error.exception))

    def test_unknown_origin_stops_before_download(self):
        adapter = self.adapter()
        adapter.api.responses = [Response(json.dumps({'asset': {'value': {
            'href': 'https://unreviewed.example/body?token=secret', 'file:size': 1}}}).encode())]
        with self.assertRaises(ValueError): adapter.asset('abc', 3)
        self.assertEqual(adapter.download.calls, [])

    def test_asset_has_no_credentials_and_caps_stream(self):
        adapter = self.adapter(); adapter.asset_size = 1
        response = Response(b'xx'); adapter.download.responses = [response]
        body = adapter.open_asset('https://cds.climate.copernicus.eu/raw', 3)
        with self.assertRaises(ValueError): list(body.blocks())
        body.close()
        self.assertTrue(response.closed)
        self.assertEqual(adapter.download.headers, {})
        self.assertIsNone(adapter.download.auth)
        self.assertFalse(adapter.download.trust_env)

    def test_unknown_monitor_cannot_become_job_id(self):
        adapter = self.adapter()
        adapter.api.responses = [Response(json.dumps({'links': [{'rel': 'monitor',
            'href': 'https://evil.example/jobs/abc'}]}).encode())]
        with self.assertRaises(ValueError): adapter.submit(core.DATASET, core.REQUEST, 3)

    @unittest.skipUnless(live.os.name == 'nt', 'Windows Job containment')
    def test_actual_bounded_decoder_rejects_zip_without_completion(self):
        with tempfile.TemporaryDirectory() as directory:
            source = Path(directory) / 'sample.raw'; source.write_bytes(b'PKfake-zip-fixture')
            state = dict(deadline=time.time()+30, rawSha256=hashlib.sha256(source.read_bytes()).hexdigest(),
                         phase='downloaded-unvalidated')
            with self.assertRaises(ValueError): live.decode(directory, state)
            self.assertEqual(state['phase'], 'downloaded-unvalidated')
            self.assertFalse((Path(directory) / 'checkpoint.json').exists())

    @unittest.skipUnless(live.os.name == 'nt', 'Windows Job containment')
    def test_actual_bounded_decoder_accepts_valid_synthetic_netcdf(self):
        import netCDF4
        with tempfile.TemporaryDirectory() as directory:
            source = Path(directory) / 'sample.raw'
            with netCDF4.Dataset(source, 'w') as dataset:
                for name, length in [('valid_time',24),('latitude',2),('longitude',2)]:
                    dataset.createDimension(name, length)
                clock = dataset.createVariable('valid_time', 'i4', ('valid_time',))
                clock.units = 'hours since 1990-12-30 00:00:00'; clock[:] = list(range(24))
                dataset.createVariable('latitude','f8',('latitude',))[:] = [32,32.25]
                dataset.createVariable('longitude','f8',('longitude',))[:] = [48.75,49]
                dataset.createVariable('number','i4',())[...] = 0
                dataset.createVariable('expver','i4',())[...] = 1
                cloud = dataset.createVariable('tcc','f4',('valid_time','latitude','longitude'))
                cloud.units = '1'; cloud.standard_name = 'cloud_area_fraction'; cloud[:] = .5
            state = dict(deadline=time.time()+30, rawSha256=hashlib.sha256(source.read_bytes()).hexdigest(),
                         phase='downloaded-unvalidated')
            result = live.decode(directory, state)
            self.assertEqual(result['phase'], 'validated-sample-only')
            self.assertEqual(result['validation']['scalarCellHours'], 96)
            self.assertIn('decodeMetrics', result, 'missing bounded decoder measurements')
            self.assertGreaterEqual(result['decodeMetrics']['elapsedSeconds'], 0)
            self.assertGreater(result['decodeMetrics']['peakRssBytes'], 0)



class HeaderBounds(unittest.TestCase):
    def test_metadata_oversize_headers_stop_before_body_read(self):
        adapter = LivePreparation().adapter()
        response = Response(b'{}')
        response.headers = {'X-Oversize': 'x' * 65536}
        adapter.api.responses = [response]
        with self.assertRaises(ValueError):
            adapter.status('abc', 3)
        self.assertTrue(response.closed)

    def test_asset_oversize_headers_stop_before_body_read(self):
        adapter = LivePreparation().adapter(); adapter.asset_size = 1
        response = Response(b'x')
        response.headers = {'X-Oversize': 'x' * 65536}
        adapter.download.responses = [response]
        with self.assertRaises(ValueError):
            adapter.open_asset('https://cds.climate.copernicus.eu/raw', 3)
        self.assertTrue(response.closed)

class TransferEncodingBounds(unittest.TestCase):
    def test_encoded_asset_is_closed_before_decompression(self):
        adapter = LivePreparation().adapter(); adapter.asset_size = 1
        response = Response(b'x'); response.headers = {'Content-Encoding': 'gzip'}
        adapter.download.responses = [response]
        with self.assertRaises(ValueError):
            adapter.open_asset('https://cds.climate.copernicus.eu/raw', 3)
        self.assertTrue(response.closed)

class AdditionalHeaderBounds(unittest.TestCase):
    def test_many_small_headers_are_rejected(self):
        adapter = LivePreparation().adapter()
        response = Response(b'{}'); response.headers = {f'X-{n}': 'a' for n in range(65)}
        adapter.api.responses = [response]
        with self.assertRaises(ValueError): adapter.status('abc', 3)
        self.assertTrue(response.closed)

    def test_unencoded_small_metadata_still_parses(self):
        adapter = LivePreparation().adapter()
        response = Response(b'{"status":"running"}')
        response.headers = {'Content-Encoding': 'identity', 'Content-Length': '20'}
        adapter.api.responses = [response]
        self.assertEqual(adapter.status('abc', 3), 'running')

class ScratchEnvironment(unittest.TestCase):
    def test_decoder_temp_is_owned_and_credentials_removed(self):
        with tempfile.TemporaryDirectory() as directory:
            with patch.dict(live.os.environ, {'TEMP': 'outside', 'TMP': 'outside', 'CDSAPI_KEY': 'fixture-secret'}):
                self.assertTrue(hasattr(live, 'worker_environment'), 'bounded worker environment missing')
                env = live.worker_environment(directory, decoding=True)
            self.assertEqual(env['TEMP'], str(Path(directory).absolute()))
            self.assertEqual(env['TMP'], str(Path(directory).absolute()))
            self.assertNotIn('CDSAPI_KEY', env)
            self.assertEqual(env['OPENBLAS_NUM_THREADS'], '1')

    def test_aliased_temp_root_rejected(self):
        with tempfile.TemporaryDirectory() as directory:
            self.assertTrue(hasattr(live, 'worker_environment'), 'bounded worker environment missing')
            # Use a real Windows junction; directory symlinks require privileges.
            import subprocess
            target = Path(directory) / 'target'; target.mkdir()
            alias = Path(directory) / 'alias'
            if live.os.name == 'nt':
                result = subprocess.run(['cmd', '/c', 'mklink', '/J', str(alias), str(target)], capture_output=True)
                if result.returncode: self.skipTest('junction creation unavailable')
            else: alias.symlink_to(target, target_is_directory=True)
            try:
                with self.assertRaises(ValueError): live.worker_environment(alias, decoding=True)
            finally:
                if live.os.name == 'nt': alias.rmdir()
                else: alias.unlink()

class ParentStorageBound(unittest.TestCase):
    @unittest.skipUnless(live.os.name == 'nt', 'Windows Job containment')
    def test_parent_kills_scratch_writer_and_preserves_failure_bytes(self):
        import argparse
        real_popen = live.subprocess.Popen
        children = []
        with tempfile.TemporaryDirectory() as directory:
            output = Path(directory) / 'output'; output.mkdir()
            fixture = ('import os,time; from pathlib import Path; '
                       'Path(os.environ["TEMP"],"scratch.bin").write_bytes(b"x"*2048); time.sleep(5)')
            def spawn(command, **kwargs):
                child = real_popen([sys._base_executable, '-c', fixture], **kwargs)
                children.append(child); return child
            args = argparse.Namespace(output=str(output), resume=False)
            with patch.object(live.subprocess, 'Popen', side_effect=spawn), patch.object(core, 'TREE_LIMIT', 1024):
                with self.assertRaisesRegex(ValueError, 'Output budget exceeded'):
                    live.supervise(args)
            self.assertIsNotNone(children[0].poll())
            self.assertEqual((output / 'scratch.bin').stat().st_size, 2048)

class MeasurementReceipt(unittest.TestCase):
    @unittest.skipUnless(live.os.name == 'nt', 'Windows Job containment')
    def test_supervisor_retains_sanitized_metrics_for_local_worker(self):
        import argparse
        real_popen = live.subprocess.Popen
        with tempfile.TemporaryDirectory() as directory:
            output = Path(directory) / 'output'; output.mkdir()
            fixture = ('import os,time; from pathlib import Path; '
                       'Path(os.environ["TEMP"],"scratch.bin").write_bytes(b"x"*2048); time.sleep(.15)')
            def spawn(command, **kwargs):
                return real_popen([sys._base_executable, '-c', fixture], **kwargs)
            with patch.object(live.subprocess, 'Popen', side_effect=spawn):
                live.supervise(argparse.Namespace(output=str(output), resume=False))
            receipt = output / 'benchmark-metrics.json'
            self.assertTrue(receipt.exists(), 'missing benchmark measurement receipt')
            metrics = json.loads(receipt.read_text())
            self.assertGreater(metrics['elapsedSeconds'], 0)
            self.assertGreater(metrics['peakMainRssBytes'], 0)
            self.assertGreaterEqual(metrics['peakOutputAndScratchBytes'], 2048)
            self.assertEqual(metrics['status'], 'completed')
            self.assertNotIn('CDSAPI_KEY', receipt.read_text())

if __name__ == '__main__': unittest.main()
