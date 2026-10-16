import hashlib
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

if __name__=='__main__': unittest.main()
