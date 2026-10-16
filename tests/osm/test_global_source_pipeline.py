import hashlib
from contextlib import closing
import json
from pathlib import Path
import sys
import tempfile
import unittest
import importlib.util
from unittest.mock import patch
from types import SimpleNamespace

sys.path.insert(0, str(Path(__file__).resolve().parents[2] / 'scripts' / 'osm'))
from global_source import build, manifest_revision
import global_source


def planet_fixture(fixture):
    m=fixture.manifest([fixture.node()]);s=m['sources'][0]
    evidence=fixture.root/'whole-world.txt';evidence.write_bytes(b'synthetic provider evidence')
    pin=dict(path=evidence.name,bytes=evidence.stat().st_size,sha256=hashlib.sha256(evidence.read_bytes()).hexdigest())
    native=fixture.root/'native.json';native.write_text(json.dumps(dict(schemaVersion=1,kind='native-vintage-observation',raw=dict(bytes=s['bytes'],sha256=s['sha256']),nativeVintage=s['vintage'])))
    d=dict(schemaVersion=1,kind='planet-domain-v1',sourceUrl=s['url'],edition='fixture',provider='Synthetic',providerWholeWorldEvidence=pin,providerObject=dict(version='v1',etag='etag',md5='a'*32),raw=dict(bytes=s['bytes'],sha256=s['sha256']),nativeVintage=s['vintage'],nativeVintageEvidence=dict(path=native.name,bytes=native.stat().st_size,sha256=hashlib.sha256(native.read_bytes()).hexdigest()),domain=dict(west=-180,south=-90,east=180,north=90),selectionPolicy=m['policy'],coverageClaim='source-domain-only')
    path=fixture.root/'domain.json'
    def bind():
        path.write_text(json.dumps(d));s.pop('clipSha256',None);s['sourceDomain']=dict(kind='planet-domain-v1',path=str(path),bytes=path.stat().st_size,sha256=hashlib.sha256(path.read_bytes()).hexdigest())
    bind()
    return m,d,path,bind


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

    def partition_manifest(self,bodies):
        value=self.manifest(bodies);value['schemaVersion']=2
        value['evidenceLayout']=dict(kind='partitioned-jsonl-v1',maxPartBytes=134217728,maxParts=64)
        return value

    def partition_rows(self,output,done,family):
        return [json.loads(line) for pin in done['streams'][family]['parts'] for line in (output/pin['path']).read_bytes().splitlines()]

    def test_v2_source_occurrences_reconcile_frozen_complete_families(self):
        unnamed='<node id="9" lat="10" lon="20"><tag k="leisure" v="park"/></node>'
        relation='<relation id="999"><tag k="name" v="Relation"/><tag k="leisure" v="park"/></relation>'
        invalid='<node id="1" lat="100" lon="20"><tag k="name" v="Park"/><tag k="leisure" v="park"/></node>'
        manifest=self.partition_manifest([self.node()*2+unnamed*2+relation,self.node()+invalid])
        output=self.run_build(manifest,'partitioned');done=json.loads((output/'complete.json').read_text())
        self.assertEqual(set(done),{'schemaVersion','kind','catalogueRevision','manifestSha256','policy','geographyMode','sourceDomains','streams','counts','checkpoint'})
        self.assertEqual(done['schemaVersion'],2);self.assertEqual(done['kind'],'partitioned-normalized-osm-v1');self.assertEqual(done['sourceDomains'],[])
        expected=dict(accepted=1,lineage=2,exclusions=4,selectedOccurrences=7,acceptedOccurrences=3,duplicateAcceptedOccurrences=1,
            sources=[dict(id='s0',selected=5,accepted=2,excluded=3,lineage=1),dict(id='s1',selected=2,accepted=1,excluded=1,lineage=1)])
        self.assertEqual(done['counts'],expected)
        checkpoint=json.loads((output/'checkpoint.json').read_text())
        self.assertEqual(checkpoint['countsSha256'],hashlib.sha256(global_source.canonical(expected).encode()).hexdigest())
        self.assertEqual(checkpoint['completedSources'],2);self.assertEqual(checkpoint['evidenceLayout'],manifest['evidenceLayout'])
        self.assertEqual(done['checkpoint'],dict(bytes=(output/'checkpoint.json').stat().st_size,sha256=global_source.digest(output/'checkpoint.json')))
        exclusions=self.partition_rows(output,done,'exclusions')
        self.assertEqual(exclusions.count(dict(source='s0',id='place:v1:osm:node:9',reason='unnamed')),2)
        self.assertIn(dict(source='s1',id='place:v1:osm:node:1',reason='invalid-geometry'),exclusions)
        self.assertEqual(len(self.partition_rows(output,done,'candidates')),1)
        self.assertEqual(len(self.partition_rows(output,done,'lineage')),2)

    def test_v2_preserves_v1_selected_facts_and_all_original_evidence_bytes(self):
        bodies=[self.node()+'<node id="9" lat="0" lon="0"><tag k="leisure" v="park"/></node>',self.node()]
        legacy=self.manifest(bodies);old=self.run_build(legacy,'legacy-parts-parity')
        current=self.partition_manifest(bodies);new=self.run_build(current,'new-parts-parity');done=json.loads((new/'complete.json').read_text())
        self.assertNotEqual(manifest_revision(legacy),manifest_revision(current))
        for family in ('lineage','exclusions'):
            self.assertEqual(b''.join((new/pin['path']).read_bytes() for pin in done['streams'][family]['parts']),(old/(family+'.jsonl')).read_bytes())
        old_rows=[json.loads(line) for line in (old/'candidates.jsonl').read_bytes().splitlines()]
        new_rows=self.partition_rows(new,done,'candidates')
        for row in old_rows:row.pop('catalogueRevision')
        for row in new_rows:row.pop('catalogueRevision')
        self.assertEqual(old_rows,new_rows)

    def test_v2_empty_selection_and_strict_explicit_layout_budget(self):
        manifest=self.partition_manifest(['<node id="1" lat="0" lon="0"/>'])
        output=self.run_build(manifest,'empty-partitions');done=json.loads((output/'complete.json').read_text())
        for family in done['streams'].values():self.assertEqual(family,dict(bytes=0,rows=0,sha256=hashlib.sha256(b'').hexdigest(),parts=[]))
        for key,value in [('outputBytes',True),('outputBytes',9007199254740992),('outputBytes',64*134217728+2*1048576+1)]:
            bad=json.loads(json.dumps(manifest));bad['limits'][key]=value
            with self.subTest(value=value),self.assertRaises(ValueError):self.run_build(bad,'invalid-explicit-budget')
        bad=json.loads(json.dumps(manifest));bad['evidenceLayout']['maxParts']=65
        with self.assertRaises(ValueError):self.run_build(bad,'invalid-layout')

    def test_v2_partial_resume_refuses_before_any_output_mutation(self):
        manifest=self.partition_manifest([self.node(),self.node()])
        def interrupt(stage):raise InterruptedError('retain incomplete attempt')
        with self.assertRaises(InterruptedError):self.run_build(manifest,'partial-partitions',hook=interrupt)
        output=self.root/'partial-partitions';before={p.name:p.read_bytes() for p in output.iterdir() if p.is_file()}
        with self.assertRaisesRegex(ValueError,'partial.*resume|resume.*partial'):
            self.run_build(manifest,'partial-partitions',resume=True)
        self.assertEqual(before,{p.name:p.read_bytes() for p in output.iterdir() if p.is_file()})
        absent=self.root/'absent-partitions'
        with self.assertRaisesRegex(ValueError,'partial.*resume|resume.*partial'):
            self.run_build(manifest,'absent-partitions',resume=True)
        self.assertFalse(absent.exists())

    def test_v2_completed_verification_is_readonly_and_rejects_repinned_omissions(self):
        manifest=self.partition_manifest([self.node()]);output=self.run_build(manifest,'complete-partitions')
        before={str(p.relative_to(output)):(p.stat().st_mtime_ns,p.read_bytes()) for p in output.rglob('*') if p.is_file()}
        self.assertEqual(self.run_build(manifest,'complete-partitions',resume=True),output)
        self.assertEqual(before,{str(p.relative_to(output)):(p.stat().st_mtime_ns,p.read_bytes()) for p in output.rglob('*') if p.is_file()})
        done=json.loads((output/'complete.json').read_text());done['streams']['lineage']=dict(bytes=0,rows=0,sha256=hashlib.sha256(b'').hexdigest(),parts=[])
        (output/'complete.json').write_text(global_source.canonical(done))
        with self.assertRaisesRegex(ValueError,'frozen|counts|unexpected'):
            self.run_build(manifest,'complete-partitions',resume=True)

    def test_v2_rejects_boolean_counter_substitution_on_completed_verification(self):
        manifest=self.partition_manifest([self.node()]);output=self.run_build(manifest,'typed-counts')
        done=json.loads((output/'complete.json').read_text());done['counts']['accepted']=True
        (output/'complete.json').write_text(global_source.canonical(done))
        with self.assertRaisesRegex(ValueError,'identity|counts'):
            self.run_build(manifest,'typed-counts',resume=True)

    def test_v2_counts_commit_with_selection_and_conflicts_leave_no_completion(self):
        manifest=self.partition_manifest([self.node(),self.node('Changed')])
        with self.assertRaisesRegex(ValueError,'identity conflict'):
            self.run_build(manifest,'partition-conflict')
        output=self.root/'partition-conflict'
        with closing(global_source.sqlite3.connect(output/'scratch.sqlite')) as db:
            self.assertEqual(db.execute('SELECT source,selected,accepted,excluded FROM source_counts').fetchall(),[('s0',1,1,0)])
            self.assertEqual(db.execute('SELECT count(*) FROM candidates').fetchone()[0],1)
        self.assertFalse((output/'complete.json').exists())

    def test_v2_late_output_or_admission_mutation_never_completes(self):
        manifest=self.partition_manifest([self.node()]);snapshot='a'*64
        def late(phase):
            if phase=='raw-after':
                part=self.root/'late-part'/'parts'/'candidates-00000.jsonl'
                part.write_bytes(part.read_bytes().replace(b'Park',b'Dark'))
        with self.assertRaisesRegex(ValueError,'digest'):
            self.run_build(manifest,'late-part',admission_check=late,admission_snapshot=snapshot)
        self.assertFalse((self.root/'late-part'/'complete.json').exists())
        def reject(phase):
            if phase=='raw-after':raise ValueError('changed admission snapshot')
        with self.assertRaisesRegex(ValueError,'changed admission'):
            self.run_build(manifest,'late-admission',admission_check=reject,admission_snapshot=snapshot)
        self.assertFalse((self.root/'late-admission'/'complete.json').exists())

    def test_v2_budget_charges_each_checkpoint_and_reports_exact_deficit(self):
        manifest=self.partition_manifest([self.node()]);manifest['limits']['outputBytes']=1
        with self.assertRaisesRegex(ValueError,r'aggregate output.*deficit=[1-9][0-9]*'):
            self.run_build(manifest,'partition-budget')
        output=self.root/'partition-budget'
        self.assertFalse((output/'complete.json').exists());self.assertFalse((output/'checkpoint.json').exists())

    def test_v2_final_guard_failure_retains_pending_descriptor_without_completion(self):
        manifest=self.partition_manifest([self.node()]);output=self.root/'final-partition-stop';original=global_source.ResourceGuard.check
        def fail_final(guard,*args,**kwargs):
            if (output/'complete.json').exists() or (output/'complete.pending.json').exists():raise ValueError('synthetic final resource stop')
            return original(guard,*args,**kwargs)
        with patch.object(global_source.ResourceGuard,'check',fail_final):
            with self.assertRaisesRegex(ValueError,'final resource stop'):
                self.run_build(manifest,'final-partition-stop')
        self.assertFalse((output/'complete.json').exists())

    def test_v2_cross_source_native_vintage_conflict_cannot_merge(self):
        manifest=self.partition_manifest([self.node(),self.node()]);source=manifest['sources'][1]
        path=Path(source['path']);payload=path.read_bytes().replace(b'2026-10-01T00:00:00Z',b'2026-10-02T00:00:00Z');path.write_bytes(payload)
        source.update(vintage='2026-10-02T00:00:00Z',bytes=len(payload),sha256=hashlib.sha256(payload).hexdigest())
        with self.assertRaisesRegex(ValueError,'identity conflict'):
            self.run_build(manifest,'partition-vintage-conflict')
        self.assertFalse((self.root/'partition-vintage-conflict'/'complete.json').exists())

    def test_v2_second_part_abort_retains_first_part_and_refuses_resume(self):
        manifest=self.partition_manifest([self.node()+self.node().replace('id="1"','id="2"')]);output=self.root/'second-part-stop'
        original_writer=global_source.write_partitioned_stream;original_check=global_source.ResourceGuard.check
        def small_parts(*args,**kwargs):return original_writer(*args,**kwargs,part_limit=1000)
        def stop(guard,*args,**kwargs):
            if (output/'parts/candidates-00001.jsonl').exists():raise ValueError('second part global stop')
            return original_check(guard,*args,**kwargs)
        with patch.object(global_source,'write_partitioned_stream',small_parts),patch.object(global_source.ResourceGuard,'check',stop):
            with self.assertRaisesRegex(ValueError,'second part global stop'):
                self.run_build(manifest,'second-part-stop')
        self.assertGreater((output/'parts/candidates-00000.jsonl').stat().st_size,0)
        self.assertFalse((output/'complete.json').exists())
        with self.assertRaisesRegex(ValueError,'partial partition resume'):
            self.run_build(manifest,'second-part-stop',resume=True)

    def test_v2_completed_resume_rechecks_parts_inventory_and_sources_after_admission(self):
        for mode in ('part','extra','source'):
            with self.subTest(mode=mode):
                manifest=self.partition_manifest([self.node()]);name='resume-late-'+mode;snapshot='d'*64
                output=self.run_build(manifest,name,admission_check=lambda phase:None,admission_snapshot=snapshot)
                marker=(output/'complete.json').read_bytes();mtime=(output/'complete.json').stat().st_mtime_ns
                def mutate(phase):
                    if phase!='resume':return
                    if mode=='extra':(output/'parts'/'unlisted.jsonl').write_bytes(b'')
                    else:
                        target=output/'parts'/'candidates-00000.jsonl' if mode=='part' else Path(manifest['sources'][0]['path'])
                        target.write_bytes(target.read_bytes().replace(b'Park',b'Dark'))
                with self.assertRaisesRegex(ValueError,'digest|unexpected|admitted source|mutation|hash'):
                    self.run_build(manifest,name,resume=True,admission_check=mutate,admission_snapshot=snapshot)
                self.assertEqual((output/'complete.json').read_bytes(),marker)
                self.assertEqual((output/'complete.json').stat().st_mtime_ns,mtime)

    def test_v2_counter_queries_reject_unbounded_source_results_before_collecting(self):
        manifest=self.partition_manifest([self.node()])
        for mode in ('stats','lineage','exclusions','duplicate'):
            with self.subTest(mode=mode):
                consumed=[]
                def unbounded(stats=False,duplicate=False):
                    for index in range(1000):
                        consumed.append(index);source='s0' if duplicate else f'unknown-{index}'
                        yield (source,1,1,0) if stats else (source,1)
                class DB:
                    def execute(self,query):
                        if 'FROM source_counts' in query:return unbounded(True,mode=='duplicate') if mode in ('stats','duplicate') else [('s0',1,1,0)]
                        if 'FROM lineage' in query:return unbounded() if mode=='lineage' else [('s0',1)]
                        if 'FROM exclusions' in query:return unbounded() if mode=='exclusions' else []
                        return SimpleNamespace(fetchone=lambda:(1,))
                with self.assertRaisesRegex(ValueError,'frozen|source'):
                    global_source.partition_counts(DB(),manifest,1)
                self.assertLessEqual(len(consumed),65,'unknown or repeated SQL source rows must stop before allocation grows')

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

    def test_inventory_counts_nested_files_and_rechecks_after_mutation(self):
        out=self.root/'inventory'; out.mkdir(); nested=out/'nested'; nested.mkdir()
        (nested/'scratch.sqlite-journal').write_bytes(b'123')
        (nested/'evidence').write_bytes(b'12345')
        self.assertEqual(global_source.output_usage(out),(8,3))
        (nested/'scratch.sqlite-journal').unlink();(nested/'evidence').unlink();nested.rmdir()
        moved=self.root/'moved'; scan=global_source.os.scandir
        def mutate(path):
            iterator=scan(path)
            if Path(path)==out:
                out.rename(moved); out.mkdir()
            return iterator
        with patch.object(global_source.os,'scandir',side_effect=mutate):
            with self.assertRaisesRegex(ValueError,'output ancestry mutation'):
                global_source.output_usage(out)

    def test_inventory_propagates_scan_failure(self):
        out=self.root/'scan-error';out.mkdir()
        with patch.object(global_source.os,'scandir',side_effect=PermissionError('unreadable')):
            with self.assertRaises(PermissionError): global_source.output_usage(out)

    def test_inventory_rechecks_queued_directory_before_descent(self):
        out=self.root/'queued';out.mkdir();nested=out/'nested';nested.mkdir()
        (nested/'deep').mkdir()
        original=Path.lstat
        for threshold in (2,3):
            with self.subTest(replacement_at_nested_lstat=threshold):
                calls=0
                def replaced(path,*args,**kwargs):
                    nonlocal calls
                    info=original(path,*args,**kwargs)
                    if path==nested:
                        calls+=1
                        if calls>=threshold:
                            return SimpleNamespace(st_mode=info.st_mode,st_file_attributes=0x400,
                                                   st_dev=info.st_dev,st_ino=info.st_ino)
                    return info
                # First lookup pins the queued directory. Replacement is
                # reported before its own descent, or before deeper descent.
                with patch.object(Path,'lstat',replaced):
                    with self.assertRaisesRegex(ValueError,'symlink/reparse'):
                        global_source.output_usage(out)

    def test_new_nested_evidence_counts_at_next_operation(self):
        m=self.manifest([self.node()]);m['limits']['outputBytes']=2000
        def inject(stage):
            nested=self.root/'injected'/'nested';nested.mkdir()
            (nested/'extra-evidence').write_bytes(b'x'*2001)
        with self.assertRaisesRegex(ValueError,'output/evidence byte limit'):
            self.run_build(m,'injected',hook=inject)
        self.assertFalse((self.root/'injected'/'complete.json').exists())

    def test_inventory_rejects_nested_and_ancestor_links(self):
        out=self.root/'linked';out.mkdir();target=self.root/'target';target.mkdir()
        link=out/'nested'
        try: link.symlink_to(target,target_is_directory=True)
        except OSError as exc: self.skipTest(str(exc))
        with self.assertRaisesRegex(ValueError,'symlink/reparse'):
            global_source.output_usage(out)
        link.unlink();out.rmdir();out.symlink_to(target,target_is_directory=True)
        with self.assertRaisesRegex(ValueError,'symlink/reparse'):
            global_source.output_usage(out/'child')

    def test_reserve_is_checked_for_pending_checkpoint_bytes(self):
        m=self.manifest([self.node()]);m['limits']['freeBytes']=100
        usage=global_source.shutil.disk_usage(self.root)
        with patch.object(global_source.shutil,'disk_usage',return_value=type(usage)(usage.total,usage.used,100)):
            with self.assertRaisesRegex(ValueError,'free reserve'):
                self.run_build(m,'reserve')
        self.assertFalse((self.root/'reserve'/'checkpoint.json').exists())

    def test_deadline_rechecked_during_source_digest(self):
        m=self.manifest([self.node()]);m['limits']['seconds']=1
        with patch.object(global_source.time,'monotonic',side_effect=[0,1]):
            with self.assertRaisesRegex(ValueError,'deadline'):
                self.run_build(m,'deadline')
        self.assertFalse((self.root/'deadline'/'complete.json').exists())

    def test_resource_inventory_operation_and_clock_boundaries(self):
        out=self.root/'bounded';out.mkdir(); limits=self.manifest([self.node()])['limits']
        now=[0.0]
        with patch.object(global_source.time,'monotonic',side_effect=lambda:now[0]), patch.object(global_source,'output_usage',wraps=global_source.output_usage) as inventory:
            guard=global_source.ResourceGuard(out,limits,0)
            guard.check(force=True)
            for _ in range(255): guard.check()
            self.assertEqual(inventory.call_count,1)
            guard.check();self.assertEqual(inventory.call_count,2)
            now[0]=.1;guard.check();self.assertEqual(inventory.call_count,3)
            guard.check(1);self.assertEqual(inventory.call_count,4)

    def test_xml_deadline_checked_between_entities_in_one_chunk(self):
        body=''.join(f'<node id="{i}" lat="10" lon="20"/>' for i in range(20))
        m=self.manifest([body]);self.assertLess(m['sources'][0]['bytes'],4096)
        out=self.root/'xml-yield-deadline';out.mkdir();m['limits']['seconds']=1;now=[0.0]
        with patch.object(global_source.time,'monotonic',side_effect=lambda:now[0]):
            guard=global_source.ResourceGuard(out,m['limits'],0)
            records=global_source.entities(m['sources'][0],m['limits'],guard.check)
            self.addCleanup(records.close)
            self.assertEqual(next(records)[1],0)
            self.assertEqual(next(records)[1],1)
            now[0]=1
            with self.assertRaisesRegex(ValueError,'deadline'):next(records)

    def test_bounded_inventory_finds_added_bytes_and_reparse(self):
        out=self.root/'bounded-mutation';out.mkdir();limits=self.manifest([self.node()])['limits']
        limits['outputBytes']=10
        with patch.object(global_source.time,'monotonic',return_value=0):
            guard=global_source.ResourceGuard(out,limits,0);guard.check(force=True)
            (out/'extra').write_bytes(b'x'*11)
            for _ in range(255): guard.check()
            with self.assertRaisesRegex(ValueError,'output/evidence'): guard.check()
            (out/'extra').unlink()
            original=Path.lstat
            def linked(path,*args,**kwargs):
                info=original(path,*args,**kwargs)
                if path==out:return SimpleNamespace(st_mode=info.st_mode,st_file_attributes=0x400)
                return info
            with patch.object(Path,'lstat',linked):
                with self.assertRaisesRegex(ValueError,'symlink/reparse'): guard.check(force=True)

    def test_inventory_rechecks_deadline_after_scan(self):
        out=self.root/'slow-inventory';out.mkdir();limits=self.manifest([self.node()])['limits'];limits['seconds']=1
        now=[0]
        def scan(path):now[0]=1;return (0,0)
        with patch.object(global_source.time,'monotonic',side_effect=lambda:now[0]),patch.object(global_source,'output_usage',side_effect=scan):
            guard=global_source.ResourceGuard(out,limits,0)
            with self.assertRaisesRegex(ValueError,'deadline'):guard.check(force=True)

    def test_inventory_interval_starts_after_completed_scan(self):
        out=self.root/'scan-reset';out.mkdir();limits=self.manifest([self.node()])['limits'];now=[0.0]
        def scan(path):now[0]+=.2;return (0,0)
        with patch.object(global_source.time,'monotonic',side_effect=lambda:now[0]),patch.object(global_source,'output_usage',side_effect=scan) as inventory:
            guard=global_source.ResourceGuard(out,limits,0);guard.check(force=True)
            guard.check();self.assertEqual(inventory.call_count,1)
            now[0]+=.101;guard.check();self.assertEqual(inventory.call_count,2)

    def test_pending_write_reserves_missing_bytes_without_waiting(self):
        out=self.root/'pending';out.mkdir();limits=self.manifest([self.node()])['limits'];limits['outputBytes']=10;limits['freeBytes']=100
        usage=global_source.shutil.disk_usage(out)
        with patch.object(global_source.time,'monotonic',return_value=0):
            guard=global_source.ResourceGuard(out,limits,0);guard.check(force=True)
            with self.assertRaisesRegex(ValueError,'output/evidence'):guard.check(11)
            with patch.object(global_source.shutil,'disk_usage',return_value=type(usage)(usage.total,usage.used,104)):
                with self.assertRaisesRegex(ValueError,'free reserve'):guard.check(5)

    def test_bounded_scan_fails_closed_when_output_disappears(self):
        out=self.root/'missing-scan';out.mkdir();limits=self.manifest([self.node()])['limits']
        with patch.object(global_source.time,'monotonic',return_value=0):
            guard=global_source.ResourceGuard(out,limits,0);guard.check(force=True);out.rmdir()
            for _ in range(255):guard.check()
            with self.assertRaises(FileNotFoundError):guard.check()

    def test_sqlite_main_database_page_cap(self):
        m=self.manifest([self.node()]);m['limits']['scratchBytes']=4096
        with self.assertRaisesRegex((ValueError,global_source.sqlite3.DatabaseError),'scratch|full'):
            self.run_build(m,'page-cap')
        self.assertLessEqual((self.root/'page-cap'/'scratch.sqlite').stat().st_size,4096)

    def test_selective_index_fits_small_scratch_and_preserves_named_node(self):
        body=''.join(f'<node id="{i}" lat="10.1234567" lon="20.1234567"/>' for i in range(1,5001))
        body+='<node id="5001" lat="11" lon="21"><tag k="name" v="Solo"/><tag k="leisure" v="park"/></node>'
        body+='<way id="9"><nd ref="1"/><nd ref="2"/><tag k="name" v="Way"/><tag k="leisure" v="park"/></way>'
        m=self.manifest([body]);m['limits']['scratchBytes']=65536
        out=self.run_build(m,'selective',geography_mode='selected-references')
        rows=[json.loads(r) for r in (out/'candidates.jsonl').read_text().splitlines()]
        self.assertEqual([r['name'] for r in rows],['Solo','Way'])
        with global_source.sqlite3.connect(out/'scratch.sqlite') as db:
            self.assertEqual(db.execute('SELECT count(*) FROM nodes').fetchone()[0],2)
        db.close()
        self.assertLessEqual((out/'scratch.sqlite').stat().st_size,65536)
        with self.assertRaisesRegex((ValueError,global_source.sqlite3.DatabaseError),'scratch|full'):
            self.run_build(m,'all-small')

    def test_selective_output_equivalence_and_resume_mode_binding(self):
        tags='<tag k="name" v="Way"/><tag k="leisure" v="park"/>'
        body=self.node()+'<node id="1" lat="10" lon="20"/><node id="2" lat="12" lon="22"/><node id="3" lat="nan" lon="0"/><node id="4" lat="0" lon="179"/><node id="5" lat="0" lon="-179"/><node id="6" lat="89" lon="0"/>'
        for oid,refs in [(1,[1,2,1]),(2,[3]),(3,[999]),(4,[4,5]),(5,[6]),(6,[])]:
            body+=f'<way id="{oid}">'+''.join(f'<nd ref="{r}"/>' for r in refs)+tags+'</way>'
        body+='<relation id="1">'+tags+'</relation><way id="7"><nd ref="123"/><tag k="leisure" v="park"/></way>'
        m=self.manifest([body,body]);old=self.run_build(m,'all');new=self.run_build(m,'select',geography_mode='selected-references')
        for name in ('candidates.jsonl','exclusions.jsonl','lineage.jsonl'):
            self.assertEqual((old/name).read_bytes(),(new/name).read_bytes())
        self.assertEqual(self.run_build(m,'select',resume=True,geography_mode='selected-references'),new)
        with self.assertRaisesRegex(ValueError,'geography mode'):
            self.run_build(m,'select',resume=True)

    def test_selective_rejects_unselected_duplicate_conflict_and_unsorted_nodes(self):
        for label,body,reason in [
            ('conflict','<node id="1" lat="0" lon="0"/><node id="1" lat="1" lon="0"/>','node identity conflict'),
            ('unsorted','<node id="2" lat="0" lon="0"/><node id="1" lat="0" lon="0"/>','node order')]:
            with self.subTest(label=label):
                with self.assertRaisesRegex(ValueError,reason):
                    self.run_build(self.manifest([body]),label,geography_mode='selected-references')
                self.assertFalse((self.root/label/'complete.json').exists())

    def test_selective_completed_resume_rejects_changed_mode(self):
        m=self.manifest([self.node()]);out=self.run_build(m,'mode-complete',geography_mode='selected-references')
        done=json.loads((out/'complete.json').read_text());done.pop('geographyMode')
        (out/'complete.json').write_text(json.dumps(done))
        with self.assertRaisesRegex(ValueError,'geography mode'):
            self.run_build(m,'mode-complete',resume=True,geography_mode='selected-references')

    def test_legacy_checkpoint_without_mode_still_resumes(self):
        m=self.manifest([self.node()]);out=self.run_build(m,'legacy-mode')
        for name in ('checkpoint.json','complete.json'):
            payload=json.loads((out/name).read_text());payload.pop('geographyMode')
            (out/name).write_text(json.dumps(payload))
        self.assertEqual(self.run_build(m,'legacy-mode',resume=True),out)
        with self.assertRaisesRegex(ValueError,'geography mode'):
            self.run_build(m,'legacy-mode',resume=True,geography_mode='selected-references')

    def test_selective_reference_prepass_obeys_disk_and_reference_caps(self):
        tags='<tag k="name" v="Way"/><tag k="leisure" v="park"/>'
        body=''.join(f'<way id="{w}">'+''.join(f'<nd ref="{w*1000+r}"/>' for r in range(1000))+tags+'</way>' for w in range(10))
        m=self.manifest([body]);m['limits']['scratchBytes']=65536
        with self.assertRaisesRegex((ValueError,global_source.sqlite3.DatabaseError),'scratch|full'):
            self.run_build(m,'refdisk',geography_mode='selected-references')
        self.assertFalse((self.root/'refdisk'/'complete.json').exists())
        m['limits']['referencesPerWay']=999
        with self.assertRaisesRegex(ValueError,'reference limit'):
            self.run_build(m,'refcount',geography_mode='selected-references')

    def test_selective_counts_unselected_nodes_against_limit(self):
        m=self.manifest(['<node id="1" lat="0" lon="0"/><node id="2" lat="0" lon="0"/>']);m['limits']['nodes']=1
        with self.assertRaisesRegex(ValueError,'node limit'):
            self.run_build(m,'nodecap',geography_mode='selected-references')

    @unittest.skipUnless(importlib.util.find_spec('osmium'),'optional existing pyosmium unavailable')
    def test_optional_pbf_same_contract(self):
        import osmium
        m=self.manifest([self.node()]); pbf=self.root/'fixture.osm.pbf'
        header=osmium.io.Header();header.set('osmosis_replication_timestamp',m['sources'][0]['vintage'])
        with osmium.SimpleWriter(str(pbf),header=header) as writer:
            writer.add_node(osmium.osm.mutable.Node(id=1,location=(20,10),tags={'name':'Park','leisure':'park'}))
        s=m['sources'][0];s.update(path=str(pbf),format='pbf',bytes=pbf.stat().st_size,sha256=hashlib.sha256(pbf.read_bytes()).hexdigest())
        out=self.run_build(m,'pbf');self.assertEqual(json.loads((out/'candidates.jsonl').read_text())['name'],'Park')
    def test_planet_domain_is_verified_and_carried_without_coverage(self):
        m,d,path,bind=planet_fixture(self);s=m['sources'][0]
        bind();out=self.run_build(m,'planet');done=json.loads((out/'complete.json').read_text());self.assertEqual(done['sourceDomains'],[dict(sourceId=s['id'],**s['sourceDomain'])]);self.assertIn('not coverage',done['coverage']);self.assertEqual(self.run_build(m,'planet',resume=True),out)
        for field,value in [('sourceUrl','https://example.org/wrong'),('nativeVintage','2026-10-02T00:00:00Z'),('domain',dict(west=-179,south=-90,east=180,north=90)),('coverageClaim','searched-world')]:
            original=d[field];d[field]=value;bind()
            with self.assertRaisesRegex(ValueError,'planet'):self.run_build(m,'bad-'+field)
            d[field]=original
        bind();revision=manifest_revision(m);d['edition']='fixture-2';bind();self.assertNotEqual(manifest_revision(m),revision)
        with self.assertRaisesRegex(ValueError,'manifest'):self.run_build(m,'planet',resume=True)
        d['edition']='fixture';d['nativeVintage']='2026-10-02T00:00:00Z';s['vintage']=d['nativeVintage']
        native=self.root/'native.json';native.write_text(json.dumps(dict(schemaVersion=1,kind='native-vintage-observation',raw=d['raw'],nativeVintage=d['nativeVintage'])))
        d['nativeVintageEvidence'].update(bytes=native.stat().st_size,sha256=hashlib.sha256(native.read_bytes()).hexdigest());bind()
        with self.assertRaisesRegex(ValueError,'header vintage'):self.run_build(m,'actual-header')
        bind();path.write_text('{}')
        with self.assertRaisesRegex(ValueError,'planet'):self.run_build(m,'tampered-domain')

if __name__=='__main__': unittest.main()
