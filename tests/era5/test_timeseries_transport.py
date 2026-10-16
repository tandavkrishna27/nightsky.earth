import copy
import json
from pathlib import Path
import sys
import unittest
sys.path.insert(0, str(Path(__file__).resolve().parents[2]/'scripts/era5'))

class Tests(unittest.TestCase):
    def test_transport_emits_verified_wire_and_rejects_legacy(self):
        import timeseries_transport as t
        import timeseries_executor as s
        class Response:
            status_code=202
            def iter_content(self, size): yield json.dumps({'links':[{'rel':'monitor','href':t.BASE+'/jobs/job-1'}]}).encode()
            def close(self): pass
        class Session:
            def __init__(self): self.headers={}; self.cookies={}; self.calls=[]
            def request(self, method, url, **kwargs):
                self.calls.append((method,url,kwargs)); return Response()
            def close(self): pass
        sessions=[]
        def factory():
            x=Session(); sessions.append(x); return x
        a=t.Adapter('synthetic-token',factory)
        p=s.plan()
        self.assertEqual(a.submit(p['dataset'],p['request'],30),'job-1')
        self.assertEqual(sessions[0].calls[0][2]['json'], {'inputs':p['request']})
        self.assertFalse(sessions[0].calls[0][2]['allow_redirects'])
        self.assertNotIn('PRIVATE-TOKEN',sessions[1].headers)
        self.assertFalse(sessions[1].trust_env)
        for dataset,request in [('reanalysis-era5-single-levels',p['request']), (p['dataset'],dict(p['request'],date='1990-12-30/1990-12-30'))]:
            with self.assertRaises(ValueError): a.submit(dataset,request,30)
        self.assertEqual(len(sessions[0].calls),1)
        a.close()

    def test_plan_import_and_main_touch_no_credentials_or_network(self):
        import builtins
        import contextlib
        import io
        from unittest.mock import patch
        import timeseries_executor as s
        real_import=builtins.__import__
        def guarded(name,*a,**kw):
            if name in {'requests','cdsapi','sample_live','timeseries_transport'}:
                raise AssertionError('Network import in offline plan')
            return real_import(name,*a,**kw)
        with patch('os.getenv',side_effect=AssertionError('Credential access')), patch.dict('os.environ',{},clear=True), patch('builtins.__import__',side_effect=guarded), contextlib.redirect_stdout(io.StringIO()) as out:
            s.main([])
        self.assertEqual(json.loads(out.getvalue())['liveExecution'],'disabled')

if __name__ == '__main__': unittest.main()
