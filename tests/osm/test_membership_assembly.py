import hashlib
import json
import os
from pathlib import Path
import sys
import unittest
sys.path.insert(0,str(Path(__file__).resolve().parents[2]/'scripts'/'osm'))
import test_global_source_pipeline as fixtures

class Assembly(unittest.TestCase):
    def setup_plan(self, fixture):
        source=dict(name='Synthetic',url='https://example.org',attribution='Synthetic',dataClass='catalog')
        feature=dict(type='Feature',properties=dict(regionId='region:v1:country',name='Country',countryCode='IND',adminLevel=0,boundaryRevision='fixture',sources=[source]),geometry=dict(type='Polygon',coordinates=[[[19,9],[21,9],[21,11],[19,11],[19,9]]]))
        boundary=fixture.root/'boundary.json';boundary.write_text(json.dumps(dict(type='FeatureCollection',features=[feature])))
        footprint=fixture.root/'footprints.jsonl';footprint.write_text('')
        def pin(path): return dict(path=str(path),bytes=path.stat().st_size,sha256=hashlib.sha256(path.read_bytes()).hexdigest())
        plan=dict(schemaVersion=1,boundaries=[dict(input=pin(boundary),regionIds=['region:v1:country'])],footprints=pin(footprint),membership={},stream={},catalogue={},retained=[])
        path=fixture.root/'assembly.json'
        def save():
            body=json.dumps(plan).encode();path.write_bytes(body);return hashlib.sha256(body).hexdigest()
        return plan,path,save

    @unittest.skipUnless(os.name=='nt','Windows Job integration')
    def test_raw_membership_catalogue_preserves_lineage_and_unknown_coverage(self):
        from fixture_execution import fixture_assembly_pipeline as assembly_pipeline
        fixture=fixtures.Pipeline();fixture.setUp()
        try:
            m=fixture.manifest([fixture.node(),fixture.node()]);manifest=fixture.root/'manifest.json';manifest.write_text(json.dumps(m),encoding='utf8')
            plan,path,save=self.setup_plan(fixture)
            result=assembly_pipeline(manifest,fixture.root/'job',path,save(),dict(wallSeconds=30,rssBytes=256*1024**2,commitBytes=512*1024**2,diskBytes=20000000,freeBytes=0,maxProcesses=2))
            self.assertEqual(result['status'],'complete',str(result)+str([(p.name,p.read_text()) for p in (fixture.root/'job').glob('*.stderr')]))
            row=json.loads((fixture.root/'job'/'membership'/'candidates.jsonl').read_text())
            self.assertEqual(row['regionIds'],['region:v1:country']);self.assertEqual(len(row['sources']),2)
            self.assertEqual(row['accessEvidence']['status'],'unknown')
            self.assertEqual((fixture.root/'job'/'membership'/'footprints.jsonl').read_text(),'')
            self.assertTrue((fixture.root/'job'/'assembly-complete.json').exists())
            self.assertEqual((fixture.root/'job'/'raw-manifest.json').read_bytes(),manifest.read_bytes())
            self.assertTrue((fixture.root/'job'/'normalized'/'lineage.jsonl').exists())
        finally: fixture.doCleanups()

    @unittest.skipUnless(os.name=='nt','Windows Job integration')
    def test_selected_references_plan_runs_and_records_mode(self):
        from fixture_execution import fixture_assembly_pipeline as assembly_pipeline
        fixture=fixtures.Pipeline();fixture.setUp()
        try:
            m=fixture.manifest([fixture.node()]);manifest=fixture.root/'manifest.json';manifest.write_text(json.dumps(m),encoding='utf8')
            plan,path,save=self.setup_plan(fixture);plan['geographyMode']='selected-references'
            result=assembly_pipeline(manifest,fixture.root/'job',path,save(),dict(wallSeconds=30,rssBytes=256*1024**2,commitBytes=512*1024**2,diskBytes=20000000,freeBytes=0,maxProcesses=2))
            self.assertEqual(result['status'],'complete',str(result))
            evidence=json.loads((fixture.root/'job'/'assembly-complete.json').read_text())
            self.assertEqual(evidence['producerDescriptor']['geographyMode'],'selected-references')
        finally: fixture.doCleanups()

    def test_bad_pin_and_retained_overlap_reject_before_job(self):
        from fixture_execution import fixture_assembly_pipeline as assembly_pipeline
        fixture=fixtures.Pipeline();fixture.setUp()
        try:
            m=fixture.manifest([fixture.node()]);manifest=fixture.root/'manifest.json';manifest.write_text(json.dumps(m),encoding='utf8')
            plan,path,save=self.setup_plan(fixture)
            for change in ('size','retained'):
                if change=='size': plan['boundaries'][0]['input']['bytes']=0
                else:
                    plan,path,save=self.setup_plan(fixture);plan['retained']=[str(fixture.root)]
                with self.assertRaises(ValueError): assembly_pipeline(manifest,fixture.root/'job',path,save(),{})
                self.assertFalse((fixture.root/'job').exists())
        finally: fixture.doCleanups()


    @unittest.skipUnless(os.name=='nt','Windows Job integration')
    def test_membership_failure_retains_raw_evidence_without_completion(self):
        from fixture_execution import fixture_assembly_pipeline as assembly_pipeline
        fixture=fixtures.Pipeline();fixture.setUp()
        try:
            m=fixture.manifest([fixture.node()]);manifest=fixture.root/'manifest.json';manifest.write_text(json.dumps(m),encoding='utf8')
            plan,path,save=self.setup_plan(fixture);plan['membership']={'maxComparisons':1}
            old=fixture.root/'old-failure';old.mkdir();(old/'evidence').write_bytes(b'keep')
            plan['retained']=[str(old)]
            result=assembly_pipeline(manifest,fixture.root/'job',path,save(),dict(wallSeconds=30,rssBytes=256*1024**2,commitBytes=512*1024**2,diskBytes=20000000,freeBytes=0,maxProcesses=2))
            # Preserve the actual failing stage/reason before TemporaryDirectory cleanup.
            # A raw-worker or containment failure is not the membership failure under test.
            stderr={}
            for log in (fixture.root/'job').glob('stage-*.stderr'):
                with log.open('rb') as stream:
                    stderr[log.name]=stream.read(8192).decode('utf8',errors='replace')
            evidence={name: ((fixture.root/'job'/name).stat().st_size if (fixture.root/'job'/name).is_file() else None)
                      for name in ('raw-manifest.json','normalized/complete.json','normalized/candidates.jsonl',
                                   'normalized/lineage.jsonl','normalized/exclusions.jsonl','assembly-complete.json','job-complete.json')}
            diagnostics=json.dumps(dict(report=result,stderr=stderr,evidenceBytes=evidence,rawLimits=m['limits']),sort_keys=True)
            self.assertEqual(result['status'],'bounded-stop',diagnostics)
            self.assertEqual(len(result['stages']),3,diagnostics)
            self.assertEqual([stage['exitCode'] for stage in result['stages'][:2]],[0,0],diagnostics)
            self.assertIn('Comparison budget',stderr.get('stage-2.stderr',''),diagnostics)
            self.assertTrue((fixture.root/'job'/'normalized'/'complete.json').exists())
            self.assertFalse((fixture.root/'job'/'job-complete.json').exists());self.assertFalse((fixture.root/'job'/'assembly-complete.json').exists())
            self.assertEqual((old/'evidence').read_bytes(),b'keep')
            (old/'large').write_bytes(b'x'*100000)
            with self.assertRaisesRegex(ValueError,'disk limit'):
                assembly_pipeline(manifest,fixture.root/'small-job',path,save(),dict(wallSeconds=30,rssBytes=256*1024**2,commitBytes=512*1024**2,diskBytes=50000,freeBytes=0,maxProcesses=2))
            self.assertFalse((fixture.root/'small-job').exists())
        finally: fixture.doCleanups()


    @unittest.skipUnless(os.name=='nt','Windows Job integration')
    def test_bad_content_pin_stops_inside_supervision_before_raw(self):
        from fixture_execution import fixture_assembly_pipeline as assembly_pipeline
        fixture=fixtures.Pipeline();fixture.setUp()
        try:
            m=fixture.manifest([fixture.node()]);manifest=fixture.root/'manifest.json';manifest.write_text(json.dumps(m),encoding='utf8')
            plan,path,save=self.setup_plan(fixture);plan['boundaries'][0]['input']['sha256']='0'*64
            result=assembly_pipeline(manifest,fixture.root/'job',path,save(),dict(wallSeconds=30,rssBytes=256*1024**2,commitBytes=512*1024**2,diskBytes=20000000,freeBytes=0,maxProcesses=2))
            self.assertEqual(result['status'],'bounded-stop');self.assertEqual(len(result['stages']),1)
            self.assertFalse((fixture.root/'job'/'normalized').exists());self.assertFalse((fixture.root/'job'/'job-complete.json').exists())
        finally: fixture.doCleanups()


    def test_limits_reader_rejects_growth_without_an_unbounded_read(self):
        from supervised_membership_assembly import load_limits
        from unittest.mock import patch
        from io import BytesIO
        class GrowingFile(BytesIO):
            def read(self, size=-1):
                if size<0 or size>4097: raise AssertionError('unbounded limits read')
                return super().read(size)
        fixture=fixtures.Pipeline();fixture.setUp()
        try:
            path=fixture.root/'limits.json';path.write_text('{}')
            with patch.object(Path,'open',return_value=GrowingFile(b' '*4097+b'{}')):
                with self.assertRaisesRegex(ValueError,'limits byte cap'): load_limits(path)
            self.assertEqual(load_limits(path),{})
        finally: fixture.doCleanups()


    @unittest.skipUnless(os.name=='nt','Windows Job integration')
    def test_planet_domain_runs_under_supervised_assembly_and_is_accounted(self):
        from fixture_execution import fixture_assembly_pipeline as assembly_pipeline
        fixture=fixtures.Pipeline();fixture.setUp()
        try:
            m,d,domain,bind=fixtures.planet_fixture(fixture)
            manifest=fixture.root/'manifest.json';manifest.write_text(json.dumps(m),encoding='utf8')
            plan,path,save=self.setup_plan(fixture)
            plan['sourceDomains']=[dict(sourceId=m['sources'][0]['id'],**m['sources'][0]['sourceDomain'])]
            result=assembly_pipeline(manifest,fixture.root/'planet-job',path,save(),dict(wallSeconds=30,rssBytes=256*1024**2,commitBytes=512*1024**2,diskBytes=20000000,freeBytes=0,maxProcesses=2))
            self.assertEqual(result['status'],'complete',str(result))
            complete=json.loads((fixture.root/'planet-job'/'assembly-complete.json').read_text())
            self.assertEqual(complete['producerDescriptor']['sourceDomains'],plan['sourceDomains'])
            self.assertIn('unknown',complete['sourceCoverage'])
            self.assertEqual((fixture.root/'planet-job'/'membership'/'footprints.jsonl').read_text(),'')
        finally: fixture.doCleanups()

if __name__=='__main__': unittest.main()
