import importlib.util
import json
import os
from pathlib import Path
import sys
import tempfile
import unittest
sys.path.insert(0,str(Path(__file__).resolve().parents[2]/'scripts'/'osm'))
from global_source_supervisor import supervise
from global_source_supervisor import pipeline
import test_global_source_pipeline as fixtures


class Supervisor(unittest.TestCase):
    def test_relative_manifest_source_rejected_before_job_creation(self):
        fixture=fixtures.Pipeline(); fixture.setUp()
        try:
            m=fixture.manifest([fixture.node()]);m['sources'][0]['path']=os.path.relpath(m['sources'][0]['path'])
            manifest=fixture.root/'relative.json';manifest.write_text(json.dumps(m),encoding='utf8')
            metadata=fixture.root/'empty.jsonl';metadata.write_text('')
            with self.assertRaisesRegex(ValueError,'absolute'):
                pipeline(manifest,fixture.root/'job',metadata,metadata,{})
            self.assertFalse((fixture.root/'job').exists())
        finally: fixture.doCleanups()
    @unittest.skipUnless(os.name=='nt','Windows Job evidence only')
    def test_raw_to_pages(self):
        fixture=fixtures.Pipeline(); fixture.setUp()
        try:
            m=fixture.manifest([fixture.node()]); manifest=fixture.root/'manifest.json';manifest.write_text(json.dumps(m),encoding='utf8')
            regions=fixture.root/'regions.jsonl';regions.write_text('');footprints=fixture.root/'footprints.jsonl';footprints.write_text('')
            limits=dict(wallSeconds=15,rssBytes=256*1024**2,commitBytes=512*1024**2,diskBytes=10000000,freeBytes=0,maxProcesses=2)
            result=pipeline(manifest,fixture.root/'job',regions,footprints,limits)
            if result['status']!='complete':
                self.fail(str(result)+' '+str([(p.name,p.read_text(errors='replace')) for p in (fixture.root/'job').glob('*.stderr')]))
            self.assertEqual(len(list((fixture.root/'job'/'catalogue').glob('catalogue-*.json'))),1)
        finally: fixture.doCleanups()
    def test_limits_and_unsupported_platform_fail_closed(self):
        with tempfile.TemporaryDirectory() as d:
            with self.assertRaises(ValueError): supervise([],Path(d)/'job',dict(wallSeconds=0))
            if os.name!='nt':
                with self.assertRaisesRegex(RuntimeError,'Windows'): supervise([],Path(d)/'job',dict(wallSeconds=5,rssBytes=64*1024**2,commitBytes=64*1024**2,diskBytes=1000000,freeBytes=0,maxProcesses=2))

    @unittest.skipUnless(os.name=='nt','Windows Job evidence only')
    def test_success_and_memory_or_time_failure(self):
        with tempfile.TemporaryDirectory() as d:
            limits=dict(wallSeconds=5,rssBytes=128*1024**2,commitBytes=128*1024**2,diskBytes=1000000,freeBytes=0,maxProcesses=2)
            result=supervise([[sys.executable,'-c','print("ok")']],Path(d)/'ok',limits)
            self.assertEqual(result['status'],'complete')
            limits['wallSeconds']=1
            result=supervise([[sys.executable,'-c','import time; time.sleep(5)']],Path(d)/'slow',limits)
            self.assertEqual(result['status'],'bounded-stop')
            self.assertFalse((Path(d)/'slow'/'job-complete.json').exists())

if __name__=='__main__': unittest.main()
