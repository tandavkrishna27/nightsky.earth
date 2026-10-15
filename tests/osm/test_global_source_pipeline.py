import hashlib
import json
from pathlib import Path
import sys
import tempfile
import unittest
import importlib.util

sys.path.insert(0, str(Path(__file__).resolve().parents[2] / 'scripts' / 'osm'))
from global_source import build, manifest_revision


class Pipeline(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.TemporaryDirectory()
        self.addCleanup(self.tmp.cleanup)
        self.root = Path(self.tmp.name)

    def manifest(self, bodies):
        sources = []
        for i, body in enumerate(bodies):
            raw = self.root / f'{i}.osm'
            raw.write_text('<osm version="0.6" timestamp="2026-10-01T00:00:00Z">'+body+'</osm>')
            sources.append(dict(id=f's{i}', path=str(raw), format='xml', url=f'https://example.org/{i}-261001.osm',
                                bytes=raw.stat().st_size, sha256=hashlib.sha256(raw.read_bytes()).hexdigest(),
                                vintage='2026-10-01T00:00:00Z', licenseUrl='https://opendatacommons.org/licenses/odbl/1-0/',
                                attribution='© OpenStreetMap contributors', clipSha256='a'*64))
        return dict(schemaVersion=1, policy='named-complete-way-v1-polar85', authorization='local synthetic only', sources=sources,
                    limits=dict(sourceBytes=1000000, scratchBytes=10000000, outputBytes=1000000, rowBytes=65536,
                                nodes=10000, candidates=10000, referencesPerWay=1000, seconds=30, freeBytes=0))

    def node(self, name='Park'):
        return f'<node id="1" lat="10" lon="20"><tag k="name" v="{name}"/><tag k="leisure" v="park"/></node>'

    def run_build(self, manifest, name='out', **kwargs):
        return build(manifest, self.root/name, **kwargs)

    def test_duplicate_lineage_and_resume(self):
        m=self.manifest([self.node(), self.node()]); out=self.run_build(m)
        rows=[json.loads(s) for s in (out/'candidates.jsonl').read_text().splitlines()]
        self.assertEqual(len(rows),1); self.assertEqual(len(rows[0]['sources']),2)
        self.assertEqual(rows[0]['catalogueRevision'],manifest_revision(m))
        self.assertEqual(self.run_build(m,resume=True),out)
        with self.assertRaises(FileExistsError): self.run_build(m)
        (out/'candidates.jsonl').write_text('corrupted\n')
        with self.assertRaisesRegex(ValueError,'digest'): self.run_build(m,resume=True)

    def test_conflict_incomplete_dateline_polar_relations(self):
        with self.assertRaisesRegex(ValueError,'conflict'): self.run_build(self.manifest([self.node(),self.node('Other')]))
        body='<node id="2" lat="89" lon="0"/><node id="3" lat="0" lon="179"/><node id="4" lat="0" lon="-179"/>'
        tags='<tag k="name" v="Way"/><tag k="leisure" v="park"/>'
        body+=f'<way id="1"><nd ref="999"/>{tags}</way><way id="2"><nd ref="3"/><nd ref="4"/>{tags}</way><way id="3"><nd ref="2"/>{tags}</way><relation id="1">{tags}</relation>'
        out=self.run_build(self.manifest([body]),'geometry')
        self.assertEqual((out/'candidates.jsonl').read_text(),'')
        reasons=[json.loads(s)['reason'] for s in (out/'exclusions.jsonl').read_text().splitlines()]
        self.assertEqual(sorted(reasons),['dateline','incomplete','polar','relation'])

    def test_hash_budgets_and_interruption(self):
        m=self.manifest([self.node()]); m['sources'][0]['sha256']='0'*64
        with self.assertRaisesRegex(ValueError,'hash'): self.run_build(m)
        m=self.manifest([self.node()]); m['limits']['nodes']=0
        with self.assertRaises(ValueError): self.run_build(m,'budget')
        m=self.manifest([self.node(), self.node()])
        def interrupt(stage):
            if stage=='source-complete': raise InterruptedError('stop')
        with self.assertRaises(InterruptedError): self.run_build(m,'resume',hook=interrupt)
        self.assertFalse((self.root/'resume'/'complete.json').exists())
        out=self.run_build(m,'resume',resume=True)
        self.assertEqual(len((out/'candidates.jsonl').read_text().splitlines()),1)

    def test_mutation_and_policy_change_rejected(self):
        m=self.manifest([self.node()])
        def mutate(stage):
            if stage=='source-complete': Path(m['sources'][0]['path']).write_text('changed')
        with self.assertRaises(ValueError): self.run_build(m,hook=mutate)

    def test_complete_way_closure_and_strict_manifest(self):
        body='<node id="1" lat="10" lon="20"/><node id="2" lat="12" lon="22"/><way id="3"><nd ref="1"/><nd ref="2"/><nd ref="1"/><tag k="name" v="Way"/><tag k="leisure" v="park"/></way>'
        m=self.manifest([body]); out=self.run_build(m)
        row=json.loads((out/'candidates.jsonl').read_text())
        self.assertEqual((row['latitude'],row['longitude']),(11,21))
        self.assertEqual(row['regionIds'],[])
        self.assertIn('not coverage',json.loads((out/'complete.json').read_text())['coverage'])
        m['policy']='changed'
        with self.assertRaises(ValueError): self.run_build(m,'changed')

    def test_wrong_vintage_source_budget_output_budget_and_resume_pins(self):
        m=self.manifest([self.node()]); m['sources'][0]['vintage']='2026-10-02T00:00:00Z'
        with self.assertRaisesRegex(ValueError,'vintage'): self.run_build(m,'vintage')
        m=self.manifest([self.node()]); m['limits']['sourceBytes']=1
        with self.assertRaisesRegex(ValueError,'source byte'): self.run_build(m,'sourcecap')
        m=self.manifest([self.node()]); m['limits']['outputBytes']=1
        with self.assertRaisesRegex(ValueError,'output'): self.run_build(m,'outputcap')
        self.assertFalse((self.root/'outputcap'/'complete.json').exists())
        m=self.manifest([self.node()]); out=self.run_build(m,'pin'); m['authorization']='changed'
        with self.assertRaisesRegex(ValueError,'manifest'): self.run_build(m,'pin',resume=True)

    def test_reparse_paths_and_reference_cap(self):
        m=self.manifest([self.node()]); m['sources'][0]['path']=str(self.root/'..'/'escape.osm')
        with self.assertRaises(ValueError): self.run_build(m,'escape')
        m=self.manifest(['<way id="2"><nd ref="1"/><nd ref="1"/></way>']);m['limits']['referencesPerWay']=1
        with self.assertRaisesRegex(ValueError,'reference'): self.run_build(m,'refs')

    def test_interleaved_unknown_root_extensions_rejected_and_bounds_released(self):
        m=self.manifest(['<extension data="x"/>'+self.node()+'<extension data="y"/>'])
        with self.assertRaisesRegex(ValueError,'root child'): self.run_build(m,'extensions')
        # Thousands of tiny metadata siblings remain a streaming input, not retained root children.
        m=self.manifest([('<bounds minlat="0" maxlat="1" minlon="0" maxlon="1"/><node id="1" lat="0" lon="0"/>')*2000])
        m['limits']['rowBytes']=256
        import tracemalloc
        tracemalloc.start()
        try:
            out=self.run_build(m,'bounds'); peak=tracemalloc.get_traced_memory()[1]
        finally: tracemalloc.stop()
        self.assertLess(peak,2*1024*1024)
        self.assertEqual((out/'candidates.jsonl').read_text(),'')

    def test_all_evidence_bytes_fit_output_allowance_before_publication(self):
        m=self.manifest(['<node id="1" lat="0" lon="0"/>']); m['limits']['outputBytes']=1
        with self.assertRaisesRegex(ValueError,'output'): self.run_build(m,'tiny-evidence')
        out=self.root/'tiny-evidence'
        actual=sum(p.stat().st_size for p in out.iterdir() if p.is_file() and not p.name.startswith('scratch.sqlite'))
        self.assertLessEqual(actual,1)
        self.assertFalse((out/'complete.json').exists())
        m=self.manifest(['<node id="1" lat="0" lon="0"/>']);m['limits']['outputBytes']=700
        with self.assertRaisesRegex(ValueError,'output'): self.run_build(m,'marker-evidence')
        out=self.root/'marker-evidence'
        actual=sum(p.stat().st_size for p in out.iterdir() if p.is_file() and not p.name.startswith('scratch.sqlite'))
        self.assertLessEqual(actual,700)
        self.assertFalse((out/'complete.json').exists())
        m=self.manifest(['<node id="1" lat="0" lon="0"/>']);m['limits']['outputBytes']=1400
        out=self.run_build(m,'evidence')
        physical=sum(p.stat().st_size for p in out.iterdir() if p.is_file())
        scratch=sum(p.stat().st_size for p in out.iterdir() if p.name.startswith('scratch.sqlite'))
        self.assertLessEqual(physical-scratch,m['limits']['outputBytes'])
        self.assertLessEqual(physical,m['limits']['scratchBytes']+m['limits']['outputBytes'])

    @unittest.skipUnless(importlib.util.find_spec('osmium'),'optional existing pyosmium unavailable')
    def test_optional_pbf_same_contract(self):
        import osmium
        m=self.manifest([self.node()]); pbf=self.root/'fixture.osm.pbf'
        header=osmium.io.Header();header.set('osmosis_replication_timestamp',m['sources'][0]['vintage'])
        with osmium.SimpleWriter(str(pbf),header=header) as writer:
            writer.add_node(osmium.osm.mutable.Node(id=1,location=(20,10),tags={'name':'Park','leisure':'park'}))
        s=m['sources'][0];s.update(path=str(pbf),format='pbf',bytes=pbf.stat().st_size,sha256=hashlib.sha256(pbf.read_bytes()).hexdigest())
        out=self.run_build(m,'pbf');self.assertEqual(json.loads((out/'candidates.jsonl').read_text())['name'],'Park')

if __name__=='__main__': unittest.main()
