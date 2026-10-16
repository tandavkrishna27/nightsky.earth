"""Offline transfer fixtures: these tests never open a socket."""
import hashlib
import io
import json
import os
from pathlib import Path
import subprocess
import sys
import tempfile
import time
import unittest
from unittest.mock import Mock, patch

sys.path.insert(0,str(Path(__file__).resolve().parents[2]/'scripts/osm'))
import natural_earth_acquire as n

class Acquisition(unittest.TestCase):
    def setUp(self):
        self.temp=tempfile.TemporaryDirectory(); self.root=Path(self.temp.name)
        for child in ('raw','evidence','inspection'): (self.root/child).mkdir()
        self.body=b'{"type":"FeatureCollection","features":[]}'
        self.row=dict(name='fixture.geojson',url=n.FILES[0]['url'],bytes=len(self.body),git=hashlib.sha1(f'blob {len(self.body)}\0'.encode()+self.body).hexdigest())
    def tearDown(self): self.temp.cleanup()
    def session(self,body=None,**changes):
        class Raw(io.BytesIO):
            def read(self, amount, decode_content=False): return super().read(amount)
        response=Mock(url=self.row['url'],status_code=200,headers={},raw=Raw(self.body if body is None else body))
        for key,value in changes.items(): setattr(response,key,value)
        session=Mock()
        def get(*args,**kwargs):
            self.assertTrue((self.root/'evidence/fixture.geojson.attempt.json').exists())
            self.assertEqual(kwargs,dict(stream=True,allow_redirects=False,timeout=(30,30)))
            return response
        session.get.side_effect=get
        return session
    def test_success_hash_rename_and_durable_receipt(self):
        session=self.session(); total=[0]
        pin=n.acquire_one(session,self.row,self.root,total,time.monotonic()+60)
        self.assertEqual(pin['git'],self.row['git']); self.assertEqual(total[0],len(self.body))
        self.assertTrue((self.root/'raw/fixture.geojson').exists())
        self.assertEqual(json.loads((self.root/'evidence/fixture.geojson.result.json').read_text())['status'],'verified')
        session.get.assert_called_once()
    def test_excess_stops_exactly_expected_plus_one(self):
        total=[0]
        with self.assertRaisesRegex(ValueError,'byte ceiling'):
            n.acquire_one(self.session(self.body+b'xxxx'),self.row,self.root,total,time.monotonic()+60)
        self.assertEqual(total[0],len(self.body)+1)
        self.assertEqual((self.root/'raw/fixture.geojson.partial').stat().st_size,len(self.body)+1)
        self.assertFalse((self.root/'raw/fixture.geojson').exists())
    def test_redirect_rejected_without_body(self):
        total=[0]; session=self.session(status_code=302)
        with self.assertRaisesRegex(ValueError,'HTTP status'):
            n.acquire_one(session,self.row,self.root,total,time.monotonic()+60)
        self.assertEqual(total[0],0); session.get.assert_called_once()
    def test_changed_url_rejected(self):
        with self.assertRaisesRegex(ValueError,'effective URL'):
            n.acquire_one(self.session(url='https://evil.invalid/'),self.row,self.root,[0],time.monotonic()+60)
    def test_encoded_response_rejected(self):
        with self.assertRaisesRegex(ValueError,'encoding'):
            n.acquire_one(self.session(headers={'Content-Encoding':'gzip'}),self.row,self.root,[0],time.monotonic()+60)
    def test_header_mismatch_rejected(self):
        with self.assertRaisesRegex(ValueError,'Content-Length'):
            n.acquire_one(self.session(headers={'Content-Length':'1'}),self.row,self.root,[0],time.monotonic()+60)
    def test_short_body_quarantined(self):
        with self.assertRaisesRegex(ValueError,'identity'):
            n.acquire_one(self.session(self.body[:-1]),self.row,self.root,[0],time.monotonic()+60)
    def test_hash_mismatch_quarantined(self):
        self.row['git']='0'*40
        with self.assertRaisesRegex(ValueError,'identity'):
            n.acquire_one(self.session(),self.row,self.root,[0],time.monotonic()+60)
    def test_ledger_collision_sends_nothing(self):
        n.durable(self.root/'evidence/fixture.geojson.attempt.json',{})
        session=self.session()
        with self.assertRaises(FileExistsError): n.acquire_one(session,self.row,self.root,[0],time.monotonic()+60)
        session.get.assert_not_called()
    def test_uncertain_get_has_one_call_and_receipt(self):
        session=Mock(); session.get.side_effect=TimeoutError('fixture')
        with self.assertRaises(TimeoutError): n.acquire_one(session,self.row,self.root,[0],time.monotonic()+60)
        session.get.assert_called_once()
        self.assertEqual(json.loads((self.root/'evidence/fixture.geojson.result.json').read_text())['status'],'quarantined')
    def test_partial_read_failure_reserves_whole_inflight_allowance(self):
        response=Mock(url=self.row['url'],status_code=200,headers={})
        response.raw.read.side_effect=TimeoutError('after unknown prefix')
        session=Mock(); session.get.return_value=response
        total=[0]
        with self.assertRaises(TimeoutError): n.acquire_one(session,self.row,self.root,total,time.monotonic()+60)
        receipt=json.loads((self.root/'evidence/fixture.geojson.result.json').read_text())
        self.assertEqual(total[0],len(self.body)+1)
        self.assertIsNone(receipt['receivedBytesExact'])
    def test_inspection_is_bound_and_has_no_mapping(self):
        path=self.root/'raw/a.json'; path.write_bytes(self.body)
        report=n.inspect(path,n.identities(path))
        self.assertEqual(report['features'],0); self.assertIsNone(report['mapping'])
        path.write_bytes(b'{}')
        with self.assertRaisesRegex(ValueError,'changed'): n.inspect(path,dict(bytes=0,sha256='',git=''))
    def test_retained_metadata_pins(self): self.assertEqual(len(n.metadata()),2)
    def test_requests_redirect_preparation_never_consumes_body(self):
        import requests
        class Trap:
            _original_response=None
            def read(self,*args,**kwargs): raise AssertionError('redirect body consumed')
            def close(self): pass
        class OfflineAdapter(requests.adapters.BaseAdapter):
            def send(self,request,**kwargs):
                response=requests.Response(); response.status_code=302
                response.url=request.url; response.headers={'Location':'https://evil.invalid/','Content-Length':'999999999'}
                response.request=request; response.raw=Trap()
                return response
            def close(self): pass
        with n.fixed_session(requests) as session:
            session.mount('https://',OfflineAdapter())
            response=session.get(n.FILES[0]['url'],stream=True,allow_redirects=False)
            self.assertEqual(response.status_code,302)
            self.assertIsNone(response.next)
            response.close()
    def test_default_cli_is_offline_plan(self):
        result=subprocess.run([sys.executable,str(Path(n.__file__))],capture_output=True,text=True,timeout=10)
        self.assertEqual(result.returncode,0,result.stderr)
        self.assertEqual(json.loads(result.stdout)['mode'],'offline-plan')

    @unittest.skipUnless(os.name=='nt','native Windows Job test')
    def test_job_creation_failure_retains_report_before_any_worker(self):
        import requests
        root=self.root/'failure-run'
        with patch.object(n,'ROOT',root), patch.object(n,'metadata',return_value=[]), patch.object(n,'capacity',return_value={}), patch.object(n,'WindowsJob',side_effect=OSError('fixture construction failure')):
            self.assertEqual(n.execute('offline fixture',Path(requests.__file__).parents[1]),1)
        report=json.loads((root/'evidence/supervisor.json').read_text())
        self.assertEqual(report['status'],'quarantined'); self.assertIsNone(report['exitCode'])

    @unittest.skipUnless(os.name=='nt','native Windows Job test')
    def test_assignment_failure_kills_unassigned_suspended_child(self):
        import requests
        root=self.root/'assignment-failure-run'
        with patch.object(n,'ROOT',root), patch.object(n,'metadata',return_value=[]), patch.object(n,'capacity',return_value={}), patch.object(n.WindowsJob,'assign_resume',side_effect=OSError('fixture assignment failure')):
            self.assertEqual(n.execute('offline fixture',Path(requests.__file__).parents[1]),1)
        report=json.loads((root/'evidence/supervisor.json').read_text())
        self.assertEqual(report['status'],'quarantined'); self.assertIsNotNone(report['exitCode'])
        self.assertFalse(any((root/'evidence').glob('*.attempt.json')))

    @unittest.skipUnless(os.name=='nt','native Windows Job test')
    def test_native_inert_job_handoff_and_child_limit(self):
        # This worker only validates containment and tries a forbidden child.
        # It imports no HTTP client and receives no acquisition root.
        code="import sys,json,subprocess;sys.path.insert(0,sys.argv[1]);import natural_earth_acquire as n;n.require_handoff();blocked=False\ntry: subprocess.Popen([sys.executable,'-c','pass'])\nexcept OSError: blocked=True\nprint(json.dumps({'blocked':blocked}));sys.exit(0 if blocked else 3)"
        job=n.WindowsJob(256*n.MIB,1); process=None
        try:
            process=subprocess.Popen([getattr(sys,'_base_executable',sys.executable),'-I','-S','-B','-c',code,str(Path(n.__file__).parent)],creationflags=4,stdin=subprocess.PIPE,stdout=subprocess.PIPE,stderr=subprocess.PIPE)
            job.assign_resume(process)
            data=json.dumps(dict(parentPid=os.getpid(),packet=n.PACKET,deadline=time.monotonic()+10,root=str(self.root),requestsDir=str(self.root))).encode()
            stdout,stderr=process.communicate(data,timeout=10)
            self.assertEqual(process.returncode,0,stderr.decode())
            self.assertTrue(json.loads(stdout)['blocked'])
        finally:
            if process is not None and process.poll() is None: job.stop(); process.wait(timeout=3)
            job.drain(); job.close()
            if process is not None: process._handle.Close()

if __name__=='__main__': unittest.main()
