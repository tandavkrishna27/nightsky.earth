import hashlib
import json
from pathlib import Path
import sys
import tempfile
import unittest

sys.path.insert(0, str(Path(__file__).resolve().parents[2] / 'scripts/era5'))
import existing_result as r


class RetrievalTests(unittest.TestCase):
    def source(self, directory):
        source = Path(directory) / 'original'
        source.mkdir()
        original = Path(directory) / 'original.allowance.json'
        expected = r.sample.allowance_template(source)
        original.write_text(json.dumps(expected))
        Path(str(original) + '.consumed.json').write_text(json.dumps(dict(expected, phase='execution-uncertain')))
        (source / 'checkpoint.json').write_text(json.dumps(dict(identity=r.sample.contract.identity(),
            phase='successful', submissions=1, jobId='synthetic-job', started=1, deadline=1801)))
        (source / 'job-identity.json').write_text(json.dumps(dict(identity=r.sample.contract.identity(), jobId='synthetic-job')))
        return source, original

    def test_expired_original_stays_unchanged_separate_allowance_binds_fingerprint_and_limits(self):
        with tempfile.TemporaryDirectory() as directory:
            source, original = self.source(directory)
            old = (source / 'checkpoint.json').read_bytes()
            allowance = Path(directory) / 'retrieval.allowance.json'
            authority = r.allowance_template(source, original, Path(directory) / 'retrieval')
            allowance.write_text(json.dumps(authority))
            self.assertEqual(r.preflight(allowance), authority)
            self.assertEqual((source / 'checkpoint.json').read_bytes(), old)
            for field, value in [('maxSubmissions', 1), ('maxAssetGets', 2), ('maxWallSeconds', 1801), ('maxRawBytes', True), ('assetHost', 'evil.example')]:
                allowance.write_text(json.dumps(dict(authority, **{field: value})))
                with self.assertRaises(ValueError): r.preflight(allowance)
            allowance.write_text(json.dumps(authority))
            (source / 'checkpoint.json').write_bytes(old + b' ')
            with self.assertRaises(ValueError): r.preflight(allowance)

    def test_consumed_retrieval_authority_cannot_run_again(self):
        with tempfile.TemporaryDirectory() as directory:
            source, original = self.source(directory)
            allowance = Path(directory) / 'retrieval.allowance.json'
            allowance.write_text(json.dumps(r.allowance_template(source, original, Path(directory) / 'retrieval')))
            Path(str(allowance) + '.consumed.json').write_text('{}')
            with self.assertRaises(ValueError): r.preflight(allowance)

    def test_actual_adapter_uses_one_get_per_separate_session_without_asset_token(self):
        from test_sample_live import Session, Response
        sessions = [Session(), Session()]
        adapter = r.RetrievalAdapter('synthetic-token', lambda: sessions.pop(0))
        adapter.api.responses = [Response(json.dumps({'asset': {'value': {
            'href': 'https://' + r.HOST + '/asset?synthetic-signature', 'file:size': 15028}}}).encode())]
        adapter.download.responses = [Response(b'x' * 15028)]
        with tempfile.TemporaryDirectory() as directory:
            r.retrieve(Path(directory), 'existing', adapter, r.time.time() + 30)
        self.assertEqual(len(adapter.api.calls), 1)
        self.assertEqual(len(adapter.download.calls), 1)
        self.assertEqual(adapter.api.calls[0][0][0], 'GET')
        self.assertEqual(adapter.download.headers, {})
        self.assertFalse(adapter.download.trust_env)
        self.assertFalse(adapter.download.calls[0][1]['allow_redirects'])

    def test_worker_rejects_uncontained_before_reading_credentials(self):
        from unittest.mock import patch
        with patch.object(r.sample, 'require_containment', side_effect=ValueError('containment')):
            with patch.object(r.os.environ, 'get', side_effect=AssertionError('credential read')):
                with self.assertRaisesRegex(ValueError, 'containment'): r.worker('absent')

    def test_supervisor_disables_site_startup_and_passes_token_only_to_child(self):
        from unittest.mock import patch
        class Child:
            returncode = 0
            def poll(self): return 0
            def wait(self, **kwargs): pass
        class Job:
            def __init__(self, *args): pass
            def assign_resume(self, child): raise ValueError('inert launch stop')
            def stop(self): pass
            def drain(self, **kwargs): pass
            def close(self): pass
        with tempfile.TemporaryDirectory() as directory:
            source, original = self.source(directory)
            allowance = Path(directory) / 'retrieval.allowance.json'
            allowance.write_text(json.dumps(r.allowance_template(source, original, Path(directory) / 'retrieval')))
            config = Path(directory) / 'synthetic-config'
            config.write_text('key: synthetic-token')
            old = r.os.environ.get('CDSAPI_KEY')
            with patch.object(r.sample, 'job_class', return_value=Job), patch.object(r.subprocess, 'Popen', return_value=Child()) as launch:
                with self.assertRaisesRegex(ValueError, 'inert launch stop'): r.supervise(allowance, config)
            argv = launch.call_args.args[0]
            self.assertTrue({'-I', '-S', '-B'}.issubset(argv))
            self.assertEqual(launch.call_args.kwargs['env']['CDSAPI_KEY'], 'synthetic-token')
            self.assertEqual(r.os.environ.get('CDSAPI_KEY'), old)

    def test_one_bounded_download_is_quarantined_and_never_submits(self):
        class Body:
            status = 200
            headers = {'Content-Length': '15028'}
            def blocks(self): yield b'x' * 15028
            def close(self): self.closed = True
        class Adapter:
            def asset(self, job, timeout):
                self.job = job
                return 'https://' + r.HOST + '/opaque?synthetic-signature'
            def open_asset(self, url, timeout, **kwargs):
                self.gets = getattr(self, 'gets', 0) + 1
                return Body()
        with tempfile.TemporaryDirectory() as directory:
            adapter = Adapter()
            result = r.retrieve(Path(directory), 'job-existing', adapter, 100, clock=lambda: 1)
            self.assertEqual(adapter.gets, 1)
            self.assertEqual(result['phase'], 'downloaded-unvalidated')
            self.assertEqual(result['rawSha256'], hashlib.sha256(b'x' * 15028).hexdigest())
            text = (Path(directory) / 'retrieval-result.json').read_text()
            self.assertNotIn('synthetic-signature', text)
            self.assertNotIn('job-existing', text)

    def test_wrong_host_size_redirect_and_partial_fail_before_acceptance(self):
        for url, status, size in [('https://other.example/a', 200, 15028),
                                  ('https://' + r.HOST + '/a', 302, 15028),
                                  ('https://' + r.HOST + '/a', 200, 15027),
                                  ('https://' + r.HOST + '/a', 200, 2097153)]:
            class Body:
                headers = {}
                def blocks(self): yield b'x' * size
                def close(self): pass
            Body.status = status
            class Adapter:
                def asset(self, *args, **kwargs): return url
                def open_asset(self, *args, **kwargs): return Body()
            with tempfile.TemporaryDirectory() as directory:
                with self.assertRaises(ValueError):
                    r.retrieve(Path(directory), 'known', Adapter(), 100, clock=lambda: 1)
                self.assertFalse((Path(directory) / 'retrieval-result.json').exists())

    def test_adapter_cannot_submit_or_poll_and_only_admits_exact_https_host(self):
        adapter = r.RetrievalAdapter.__new__(r.RetrievalAdapter)
        for operation in ('submit', 'status'):
            with self.assertRaises(ValueError): getattr(adapter, operation)(None, None, None)
        for url in ['http://' + r.HOST, 'https://' + r.HOST + '.evil/a',
                    'https://user@' + r.HOST + '/a', 'https://' + r.HOST + ':444/a']:
            with self.assertRaises(ValueError): r.core.asset_url(url, r.HOSTS)


if __name__ == '__main__': unittest.main()
