import hashlib
import importlib.util
import json
import ntpath
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
            # CI keeps temporary fixtures on C: and the repository on D:.
            # Deliberately form a source-relative basename without consulting cwd.
            with self.assertRaises(ValueError):
                ntpath.relpath(r'C:\runner-temp\fixture\0.osm',r'D:\a\repo')
            self.assertEqual(ntpath.relpath(r'C:\runner-temp\fixture\0.osm',r'C:\runner-temp\fixture'),'0.osm')
            m=fixture.manifest([fixture.node()]);m['sources'][0]['path']=os.path.relpath(m['sources'][0]['path'],start=fixture.root)
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
            from global_source import manifest_revision
            config_path=fixture.root/'build.json';body=(Path(__file__).with_name('source-build-controls-numbers.json').read_text().replace('test-v1',manifest_revision(m))).encode();config_path.write_bytes(body)
            result=pipeline(manifest,fixture.root/'job',regions,footprints,limits,build_config=config_path,build_config_sha256=hashlib.sha256(body).hexdigest())
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


class BuildConfiguration(unittest.TestCase):
    def test_strict_pin_and_controls(self):
        import hashlib
        from global_source_supervisor import load_build_config
        with tempfile.TemporaryDirectory() as d:
            path=Path(d)/'build.json'
            value=dict(schemaVersion=1,catalogueRevision='test-v1',stream={},catalogue={'timeoutMs':1800001},files={})
            body=json.dumps(value).encode();path.write_bytes(body)
            with self.assertRaisesRegex(ValueError,'timeoutMs'):
                load_build_config(path,hashlib.sha256(body).hexdigest())

    def test_integral_json_numbers_match_bridge_and_reject_other_numbers(self):
        from global_source_supervisor import load_build_config
        original=Path(__file__).with_name('source-build-controls-numbers.json').read_bytes()
        with tempfile.TemporaryDirectory() as d:
            path=Path(d)/'build.json';path.write_bytes(original)
            value=load_build_config(path,hashlib.sha256(original).hexdigest())
            self.assertIs(type(value['schemaVersion']),int)
            self.assertIs(type(value['files']['regions']['bytes']),int)
            for section in ('stream','catalogue'):
                self.assertTrue(all(type(number) is int for number in value[section].values()))
            for token in ('true','1.5','9007199254740992','1e400','NaN','Infinity','-Infinity'):
                for field in ('"schemaVersion":1.0','"chunkRows":1.0','"bytes":0.0'):
                    body=original.replace(field.encode(),(field.split(':')[0]+':'+token).encode());path.write_bytes(body)
                    with self.assertRaises(ValueError): load_build_config(path,hashlib.sha256(body).hexdigest())

    def test_config_rejection_before_job(self):
        fixture=fixtures.Pipeline(); fixture.setUp()
        try:
            from global_source import manifest_revision
            m=fixture.manifest([fixture.node()]); manifest=fixture.root/'manifest.json';manifest.write_text(json.dumps(m),encoding='utf8')
            metadata=fixture.root/'metadata.jsonl';metadata.write_text('')
            empty=dict(bytes=0,sha256=hashlib.sha256(b'').hexdigest())
            config=dict(schemaVersion=1,catalogueRevision=manifest_revision(m),stream={},catalogue={},files=dict(regions=empty,footprints=empty))
            path=fixture.root/'build.json'
            for patch in [dict(command=['anything']),dict(stream={'maxRows':True}),dict(catalogue={'timeoutMs':1800001}),dict(catalogueRevision='wrong'),dict(files=dict(regions=dict(bytes=1,sha256=empty['sha256']),footprints=empty))]:
                body=json.dumps(dict(config,**patch)).encode();path.write_bytes(body)
                with self.assertRaises(ValueError): pipeline(manifest,fixture.root/'job',metadata,metadata,{},build_config=path,build_config_sha256=hashlib.sha256(body).hexdigest())
                self.assertFalse((fixture.root/'job').exists())
            path.write_bytes(b'{}')
            with self.assertRaisesRegex(ValueError,'digest'): pipeline(manifest,fixture.root/'job',metadata,metadata,{},build_config=path,build_config_sha256='0'*64)
        finally: fixture.doCleanups()


if __name__=='__main__': unittest.main()
