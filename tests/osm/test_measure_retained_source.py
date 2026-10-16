import importlib.util
import json
from pathlib import Path
import sys
import tempfile
import unittest
sys.path.insert(0,str(Path(__file__).resolve().parents[2]/'scripts/osm'))
from fixture_execution import fixture_runtime
spec=importlib.util.spec_from_file_location('measurement',Path(__file__).resolve().parents[2]/'scripts/osm/measure-retained-source.py')
m=importlib.util.module_from_spec(spec)
spec.loader.exec_module(m)

class Measurement(unittest.TestCase):
    def test_inventory_categories_and_no_false_geometry(self):
        with tempfile.TemporaryDirectory() as tmp:
            root=Path(tmp)
            (root/'scratch.sqlite').write_bytes(b'x'*12)
            (root/'scratch.sqlite-journal').write_bytes(b'x'*3)
            (root/'candidates.jsonl').write_bytes(b'{}\n')
            self.assertEqual(m.sizes(root),dict(sqliteBytes=12,journalBytes=3,otherBytes=3,totalBytes=18))
            self.assertEqual(m.UNKNOWN_CLIP['coverage'],'unknown')
            self.assertNotIn('geometry',m.UNKNOWN_CLIP)
    def test_summary_streams_candidates_and_exclusions(self):
        with tempfile.TemporaryDirectory() as tmp:
            root=Path(tmp)
            (root/'candidates.jsonl').write_text(json.dumps(dict(placeId='place:v1:osm:node:1',category='park',regionIds=[],sources=[{'url':'https://example.org/pin'}]))+'\n')
            (root/'exclusions.jsonl').write_text('{"source":"s","reason":"unnamed"}\n')
            result=m.summarize(root)
            self.assertEqual(result['candidateRows'],1)
            self.assertEqual(result['categoryRows'],{'park':1})
            self.assertEqual(result['exclusionsBySource'],{'s':{'unnamed':1}})
            self.assertEqual(result['nonemptyRegionRows'],0)



class MeasuredPipeline(unittest.TestCase):
    @unittest.skipUnless(sys.platform=='win32','requires existing Windows Job supervisor')
    @fixture_runtime
    def test_actual_configured_producer_bridge_and_metrics(self):
        import hashlib
        with tempfile.TemporaryDirectory() as tmp:
            root=Path(tmp).resolve()
            raw=root/'source.osm'
            raw.write_text('<osm version="0.6" timestamp="2026-10-01T00:00:00Z"><node id="1" lat="10" lon="20"><tag k="name" v="Park"/><tag k="leisure" v="park"/></node></osm>')
            source=dict(id='synthetic',path=str(raw),format='xml',url='https://example.org/synthetic-261001.osm',bytes=raw.stat().st_size,sha256=hashlib.sha256(raw.read_bytes()).hexdigest(),vintage='2026-10-01T00:00:00Z',licenseUrl='https://opendatacommons.org/licenses/odbl/1-0/',attribution='© OpenStreetMap contributors',clipSha256='a'*64)
            manifest=dict(schemaVersion=1,policy='named-complete-way-v1-polar85',authorization='synthetic fixture only',sources=[source],limits=dict(sourceBytes=1000000,scratchBytes=10000000,outputBytes=1000000,rowBytes=65536,nodes=10000,candidates=10000,referencesPerWay=1000,seconds=30,freeBytes=0))
            path=root/'manifest.json'; path.write_text(json.dumps(manifest),encoding='utf8')
            result=m.measure(path,root/'job',wall_seconds=30,free_bytes=0)
            self.assertEqual(result['status'],'complete')
            self.assertEqual(result['normalized']['candidateRows'],1)
            self.assertEqual(result['sqliteRows']['nodes'],1)
            self.assertEqual(len(result['jobStageMetrics']),2)
            self.assertGreater(result['jobStageMetrics'][0]['peakJobCommitBytes'],0)
            self.assertEqual(result['normalized']['nonemptyRegionRows'],0)
            self.assertTrue((root/'job/job-complete.json').is_file())
            self.assertEqual(len(list((root/'job/catalogue').glob('catalogue-*.json'))),1)
            with self.assertRaises(FileExistsError): m.measure(path,root/'job',wall_seconds=30,free_bytes=0)
            with self.assertRaises(ValueError): m.measure(path,root/'bad',wall_seconds=1801,free_bytes=0)


if __name__=='__main__': unittest.main()
