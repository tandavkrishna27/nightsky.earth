import contextlib
import importlib.util
from pathlib import Path
import tempfile
import unittest

ROOT=Path(__file__).resolve().parents[2]
def module(name):
    spec=importlib.util.spec_from_file_location(name,ROOT/'scripts/era5'/f'{name}.py')
    result=importlib.util.module_from_spec(spec); spec.loader.exec_module(result); return result
s=module('sample_executor'); v=module('sample_validate')
class Response:
    status=200; headers={}
    def blocks(self): yield b'PKunsupported ZIP'
    def close(self): pass
class Transport:
    fixture_only=True; asset_hosts={'asset.example'}
    def __init__(self): self.submissions=0; self.statuses=0
    def submit(self,*a,**kw): self.submissions+=1; return 'job-1'
    def status(self,*a,**kw): self.statuses+=1; return 'successful'
    def asset(self,*a,**kw): return 'https://asset.example/object?secret=redacted'
    def open_asset(self,*a,**kw):
        assert kw['authenticated'] is False and kw['redirects'] is False
        return Response()
class Tests(unittest.TestCase):
    def test_pinned_proposal(self):
        import json
        proposal=json.loads((ROOT/'docs/operations/data-pilot-evidence/2026-10-15-history-source-proposed-legacy-request.json').read_text())
        self.assertEqual(proposal['request'],s.plan()['request'])
    def test_unknown_submission_never_retried(self):
        class Unknown(Transport):
            def submit(self,*a,**kw): self.submissions+=1; raise TimeoutError('private upstream detail')
        with tempfile.TemporaryDirectory() as directory:
            t=Unknown()
            with self.assertRaises(TimeoutError): s.run_fixture(directory,t)
            with self.assertRaises((ValueError,FileExistsError)): s.run_fixture(directory,t,resume=True)
            self.assertEqual(t.submissions,1)
            self.assertNotIn('private',(Path(directory)/'checkpoint.json').read_text())
    def test_download_is_never_scientific_completion(self):
        with tempfile.TemporaryDirectory() as directory:
            state=s.run_fixture(directory,Transport())
            self.assertEqual(state['phase'],'downloaded-unvalidated')
            self.assertNotIn('secret',(Path(directory)/'checkpoint.json').read_text())
            with self.assertRaises(ValueError): v.validate_raw(Path(directory)/'sample.raw',state['rawSha256'])
    def test_origin_and_redirect_rejected(self):
        for url in ['http://asset.example/x','https://evil.example/x','https://user:pass@asset.example/x','https://asset.example/x#fragment']:
            with self.assertRaises(ValueError): s.asset_url(url,{'asset.example'})
        class Redirect(Transport):
            def open_asset(self,*a,**kw): r=Response(); r.status=302; return r
        with tempfile.TemporaryDirectory() as directory:
            with self.assertRaises(ValueError): s.run_fixture(directory,Redirect())
    def test_body_cap_and_interruption(self):
        class Big(Response):
            def blocks(self):
                for _ in range(33): yield b'x'*65536
        class T(Transport):
            def open_asset(self,*a,**kw): return Big()
        with tempfile.TemporaryDirectory() as directory:
            with self.assertRaises(ValueError): s.run_fixture(directory,T())
            self.assertLessEqual((Path(directory)/'sample.raw').stat().st_size,s.RAW_LIMIT)
            self.assertIn('download-uncertain',(Path(directory)/'checkpoint.json').read_text())
    def test_no_live_transport(self):
        with tempfile.TemporaryDirectory() as directory:
            with self.assertRaises(ValueError): s.run_fixture(directory,object())
    def test_queue_poll_limit_and_resume_identity(self):
        import json
        class Clock:
            now=1000
            def time(self): return self.now
            def sleep(self,seconds): self.now+=seconds
        class Queued(Transport):
            def status(self,*a,**kw): self.statuses+=1; return 'queued'
        with tempfile.TemporaryDirectory() as directory:
            c=Clock(); t=Queued()
            with self.assertRaises(ValueError): s.run_fixture(directory,t,clock=c.time,sleep=c.sleep)
            self.assertEqual(t.submissions,1); self.assertEqual(t.statuses,s.MAX_POLLS)
            with self.assertRaises(ValueError): s.run_fixture(directory,t,clock=c.time,sleep=c.sleep,resume=True)
            self.assertEqual(t.submissions,1)
            checkpoint=Path(directory)/'checkpoint.json'; state=json.loads(checkpoint.read_text()); state['identity']='changed'; checkpoint.write_text(json.dumps(state))
            with self.assertRaises(ValueError): s.run_fixture(directory,t,resume=True)
    def test_known_job_resume_has_no_second_submission(self):
        class Interrupted(Transport):
            def status(self,*a,**kw): raise KeyboardInterrupt()
        with tempfile.TemporaryDirectory() as directory:
            t=Interrupted()
            with self.assertRaises(KeyboardInterrupt): s.run_fixture(directory,t)
            import json
            checkpoint=Path(directory)/'checkpoint.json'; state=json.loads(checkpoint.read_text()); state['nextPoll']=state['started']; checkpoint.write_text(json.dumps(state))
            resumed=Transport(); result=s.run_fixture(directory,resumed,resume=True)
            self.assertEqual(resumed.submissions,0); self.assertEqual(result['jobId'],'job-1')
    def test_clock_and_final_revision(self):
        header=dict(type='header',rowCount=24,member=0,experimentVersions=['0001'],cells=[dict(cellId=c) for c in s.plan()['expectedCells']])
        rows=[dict(type='sample',atUtc=f'1990-12-30T{h:02}:00:00Z',values=[.2]*4) for h in range(24)]
        self.assertTrue(v.validate_records([header,*rows])['accepted'])
        header['experimentVersions']=['5']
        with self.assertRaises(ValueError): v.validate_records([header,*rows])
if __name__=='__main__': unittest.main()
