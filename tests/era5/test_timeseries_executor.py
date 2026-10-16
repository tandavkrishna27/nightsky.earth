import importlib.util
import json
from pathlib import Path
import subprocess
import sys
import tempfile
import unittest

ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(ROOT / 'scripts/era5'))

class Tests(unittest.TestCase):
    def load(self):
        import timeseries_executor
        return timeseries_executor

    def test_fixed_verified_request_and_identity(self):
        s = self.load()
        p = s.plan()
        self.assertEqual(p['dataset'], 'reanalysis-era5-single-levels-timeseries')
        self.assertEqual(p['request'], {'variable':['total_cloud_cover'], 'location':{'longitude':48.75,'latitude':32}, 'date':['1990-12-30/1990-12-30'], 'data_format':'netcdf'})
        self.assertEqual(s.identity(), '95edd1dddef2cd942e66089f3d6f85760d5ffd8876f7f4e32a6646be794a5322')
        self.assertNotEqual(s.identity(), __import__('sample_executor').identity())
        evidence=json.loads((ROOT/'docs/operations/data-pilot-evidence/2026-10-16-timeseries-request-contract.json').read_text())
        self.assertEqual(p['request'],evidence['request'])
        p['request']['date'] = '1990-12-30/1990-12-30'
        with self.assertRaises(ValueError): s.validate_plan(p)

    def test_cli_default_offline_and_live_disabled(self):
        s = self.load()
        result = subprocess.run([sys.executable, '-I', str(ROOT/'scripts/era5/timeseries_executor.py')], capture_output=True, text=True)
        self.assertEqual(result.returncode, 0, result.stderr)
        self.assertEqual(json.loads(result.stdout)['liveExecution'], 'disabled')
        denied = subprocess.run([sys.executable, str(ROOT/'scripts/era5/timeseries_executor.py'), '--execute'], capture_output=True, text=True)
        self.assertNotEqual(denied.returncode, 0)

    def test_unknown_payload_is_unvalidated_and_request_is_exact(self):
        s = self.load()
        class T(Transport):
            def submit(self, dataset, request, **kw):
                self.testcase.assertEqual(dataset, 'reanalysis-era5-single-levels-timeseries')
                self.testcase.assertEqual(request['date'], ['1990-12-30/1990-12-30'])
                return super().submit(dataset, request, **kw)
        t = T(); t.testcase = self
        with tempfile.TemporaryDirectory() as d:
            state = s.run_fixture(d, t)
            self.assertEqual(state['phase'], 'downloaded-unvalidated')
            self.assertNotIn('validation', state)
            self.assertNotIn('expver', json.dumps(state))
            self.assertEqual(t.submissions, 1)

    def test_uncertain_submission_durable_and_never_retried(self):
        s = self.load()
        class T(Transport):
            def submit(self, *a, **kw):
                self.submissions += 1
                raise TimeoutError('synthetic uncertainty')
        t = T()
        with tempfile.TemporaryDirectory() as d:
            with self.assertRaises(TimeoutError): s.run_fixture(d, t)
            self.assertEqual(json.loads((Path(d)/'checkpoint.json').read_text())['phase'], 'submission-uncertain')
            with self.assertRaises(ValueError): s.run_fixture(d, t, resume=True)
            self.assertEqual(t.submissions, 1)

    def test_legacy_checkpoint_and_mutation_rejected(self):
        s = self.load()
        class T(Transport):
            def status(self, *a, **kw): raise KeyboardInterrupt()
        for mutation in ('identity', 'receipt'):
            with tempfile.TemporaryDirectory() as d:
                with self.assertRaises(KeyboardInterrupt): s.run_fixture(d, T())
                target = Path(d)/('checkpoint.json' if mutation == 'identity' else 'job-identity.json')
                state = json.loads(target.read_text()); state['identity'] = __import__('sample_executor').identity(); target.write_text(json.dumps(state))
                t = Transport()
                with self.assertRaises(ValueError): s.run_fixture(d, t, resume=True)
                self.assertEqual(t.submissions, 0)

    def test_known_resume_preserves_identity_and_no_second_submit(self):
        s = self.load()
        class Interrupted(Transport):
            def status(self, *a, **kw): raise KeyboardInterrupt()
        with tempfile.TemporaryDirectory() as d:
            with self.assertRaises(KeyboardInterrupt): s.run_fixture(d, Interrupted())
            target=Path(d)/'checkpoint.json'; state=json.loads(target.read_text())
            state['nextPoll']=state['started']; target.write_text(json.dumps(state))
            with self.assertRaises(ValueError): __import__('sample_executor').run_fixture(d, Transport(), resume=True)
            t=Transport(); state=s.run_fixture(d,t,resume=True)
            self.assertEqual(t.submissions,0)
            self.assertEqual(state['jobId'],'job-1')
            with self.assertRaises(ValueError): s.run_fixture(d,Transport())
            with self.assertRaises(ValueError): s.run_fixture(d,Transport(),resume=True)

    def test_nonfixture_and_nonfresh_output_never_submit(self):
        s = self.load()
        with tempfile.TemporaryDirectory() as d:
            with self.assertRaises(ValueError): s.run_fixture(d, object())
            (Path(d)/'unrelated').write_text('existing output')
            t=Transport()
            with self.assertRaises(ValueError): s.run_fixture(d,t)
            self.assertEqual(t.submissions,0)

    def test_origin_redirect_and_size_rejected(self):
        s = self.load()
        for kind in ('host', 'redirect', 'oversize'):
            class T(Transport):
                def asset(self, *a, **kw): return 'https://evil.example/a' if kind == 'host' else super().asset(*a, **kw)
                def open_asset(self, *a, **kw):
                    r = Response(); r.status = 302 if kind == 'redirect' else 200
                    r.headers = {'Content-Length':str(2*1024**2+1)} if kind == 'oversize' else {}
                    return r
            with tempfile.TemporaryDirectory() as d:
                with self.assertRaises(ValueError): s.run_fixture(d, T())

    def test_body_deadline_and_poll_bounds(self):
        s = self.load()
        for kind in ('body', 'deadline', 'poll'):
            class Clock:
                now=1000
                def time(self): return self.now
                def sleep(self, seconds): self.now += seconds
            c = Clock()
            class R(Response):
                def blocks(self):
                    if kind == 'deadline': c.now += 1801
                    for _ in range(33 if kind == 'body' else 1): yield b'x'*65536
            class T(Transport):
                def status(self, *a, **kw):
                    self.statuses += 1
                    return 'queued' if kind == 'poll' else 'successful'
                def open_asset(self, *a, **kw): return R()
            t=T()
            with tempfile.TemporaryDirectory() as d:
                with self.assertRaises(ValueError): s.run_fixture(d,t,clock=c.time,sleep=c.sleep)
                self.assertEqual(t.submissions,1)
                self.assertLessEqual(t.statuses,60)
                raw=Path(d)/'sample.raw'
                if raw.exists(): self.assertLessEqual(raw.stat().st_size,2*1024**2)

class Response:
    status=200
    headers={}
    def blocks(self): yield b'synthetic unknown scientific shape'
    def close(self): pass

class Transport:
    fixture_only=True
    asset_hosts={'asset.example'}
    def __init__(self): self.submissions=0; self.statuses=0
    def submit(self,*a,**kw): self.submissions+=1; return 'job-1'
    def status(self,*a,**kw): self.statuses+=1; return 'successful'
    def asset(self,*a,**kw): return 'https://asset.example/a'
    def open_asset(self,*a,**kw):
        if kw != dict(timeout=kw['timeout'],authenticated=False,redirects=False): raise AssertionError('asset policy')
        return Response()

if __name__ == '__main__': unittest.main()
