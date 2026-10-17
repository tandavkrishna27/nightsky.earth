import importlib.util
import json
import os
from pathlib import Path
import stat
import sys
import tempfile
import time
from contextlib import ExitStack
from types import SimpleNamespace
import unittest
from unittest.mock import patch

sys.path.insert(0,str(Path(__file__).resolve().parents[2]/'scripts/osm'))
path=Path(__file__).resolve().parents[2]/'scripts/osm/prepare-planet-receipt-packet.py'
spec=importlib.util.spec_from_file_location('prepare_planet_receipt_packet',path)
packet=importlib.util.module_from_spec(spec);spec.loader.exec_module(packet)
import planet_receipt as receiver


class PlanetReceiptPacketTests(unittest.TestCase):
    def fixture(self,folder):
        root=Path(folder);data=root/'data';data.mkdir();cache=root/'cache';cache.mkdir()
        (data/'original.osm.pbf').write_bytes(b'raw')
        (data/'boundary.geojson').write_bytes(b'boundary')
        runtime=data/'venv';runtime.mkdir();(runtime/'runtime.bin').write_bytes(b'runtime')
        scratch=data/'scratch.sqlite';scratch.write_bytes(b'scratch')
        failed=data/'failed';failed.mkdir();(failed/'body.partial').write_bytes(b'partial')
        (data/'rollback').mkdir();(data/'rollback'/'edition.json').write_bytes(b'old')
        machine=dict(observedUtc='2026-10-16T23:00:00Z',platform='synthetic',
            disk=dict(path=str(root),totalBytes=1024**4,freeBytes=receiver.RESERVE_BYTES+receiver.SOURCE['bytes']+receiver.EVIDENCE_BYTES+1024**3),
            memory=dict(totalPhysicalBytes=64*1024**3,availablePhysicalBytes=32*1024**3,totalPageFileBytes=96*1024**3,availablePageFileBytes=48*1024**3))
        return root,data,cache,machine

    def test_inventory_exact_nonoverlapping_lengths_and_categories_without_content_reads(self):
        with tempfile.TemporaryDirectory() as folder:
            root,data,cache,machine=self.fixture(folder)
            with patch.object(Path,'open',side_effect=AssertionError('no content read')):
                inventory=packet.inventory_roots([data])
            self.assertEqual(inventory['logicalBytes'],35)
            self.assertEqual(inventory['files'],6)
            record=inventory['records'][0]
            self.assertEqual(record['categories']['runtime-allocation']['logicalBytes'],7)
            self.assertEqual(record['categories']['scratch-or-journal']['logicalBytes'],7)
            self.assertEqual(record['categories']['partial-failure-or-diagnostic']['logicalBytes'],7)
            self.assertEqual(sum(item['logicalBytes'] for item in record['categories'].values()),35)
            self.assertFalse(inventory['reservation']);self.assertFalse(inventory['atomicFilesystemSnapshot'])

    def test_draft_has_all_exact_bounds_but_no_runnable_approval(self):
        with tempfile.TemporaryDirectory() as folder:
            root,data,cache,machine=self.fixture(folder)
            inventory=packet.inventory_roots([data])
            observation,draft=packet.build_documents(inventory,machine,dict(path='synthetic retained metadata',sha256Lf='0'*64),
                cache/'planet-261012-receipt',root/'inventory.json',root/'draft.json')
            self.assertEqual(draft['proposedAllowance']['source'],receiver.SOURCE)
            self.assertEqual(draft['proposedAllowance']['limits'],receiver.LIMITS)
            self.assertEqual(draft['proposedAllowance']['source']['bytes'],95380942829)
            self.assertIsNone(draft['authorization']);self.assertIsNone(draft['proposedAllowance']['operatorApprovalReference'])
            self.assertFalse(draft['executionAllowed'])
            with self.assertRaises(ValueError):receiver.validate_allowance(draft)
            with self.assertRaisesRegex(ValueError,'operator approval reference required'):
                receiver.validate_allowance(draft['proposedAllowance'])
            self.assertFalse((cache/'planet-261012-receipt').exists())
            self.assertIsNone(draft['sourceObservation']['rawSha256']);self.assertIsNone(draft['sourceObservation']['nativeVintage'])

    def test_self_byte_lengths_converge_without_self_hash_pins_and_capacity_no_double_allocation(self):
        with tempfile.TemporaryDirectory() as folder:
            root,data,cache,machine=self.fixture(folder)
            inventory=packet.inventory_roots([data])
            observation,draft=packet.build_documents(inventory,machine,dict(path='fixture',sha256Lf='0'*64),
                cache/'receipt',root/'inventory.json',root/'draft.json')
            lengths=[len(packet.canonical(observation).encode()),len(packet.canonical(draft).encode())]
            self.assertEqual([item['bytes'] for item in observation['preparationArtifacts']],lengths)
            self.assertTrue(all(set(item)=={'path','bytes'} for item in observation['preparationArtifacts']))
            self.assertEqual(draft['capacity']['supervisorMaximumAccountedBytes'],35+sum(lengths)+receiver.SOURCE['bytes']+receiver.EVIDENCE_BYTES)
            self.assertEqual(draft['capacity']['headroomAfterPreparationRawEvidenceAndReserveBytes'],1024**3-sum(lengths))

    def test_entry_deadline_depth_overlap_and_receiver_root_count_bounds(self):
        with tempfile.TemporaryDirectory() as folder:
            root,data,cache,machine=self.fixture(folder)
            with self.assertRaisesRegex(ValueError,'entry limit'):packet.inventory_roots([data],max_entries=1)
            with self.assertRaisesRegex(TimeoutError,'deadline'):
                packet.inventory_roots([data],max_seconds=1,clock=iter([0,2]).__next__)
            nested=data/'a'/'b';nested.mkdir(parents=True)
            with self.assertRaisesRegex(ValueError,'depth'):packet.inventory_roots([data],max_depth=1)
            with self.assertRaisesRegex(ValueError,'overlapping'):packet.inventory_roots([data,data/'a'])
            with self.assertRaisesRegex(ValueError,'64'):packet.inventory_roots([data]*65)

    def test_output_overwrite_attempt_overlap_and_existing_attempt_are_visible(self):
        with tempfile.TemporaryDirectory() as folder:
            root,data,cache,machine=self.fixture(folder)
            inventory=packet.inventory_roots([data])
            with self.assertRaisesRegex(ValueError,'overlaps'):
                packet.build_documents(inventory,machine,{},data/'receipt',root/'inventory.json',root/'draft.json')
            existing=cache/'receipt';existing.mkdir()
            with self.assertRaisesRegex(FileExistsError,'attempt.*exists'):
                packet.build_documents(inventory,machine,{},existing,root/'inventory.json',root/'draft.json')
            (root/'draft.json').write_text('{}')
            with self.assertRaises(FileExistsError):
                packet.build_documents(inventory,machine,{},cache/'new-receipt',root/'inventory.json',root/'draft.json')

    def test_symlink_is_never_followed(self):
        with tempfile.TemporaryDirectory() as folder:
            root=Path(folder);data=root/'data';data.mkdir();outside=root/'outside';outside.mkdir()
            link=data/'linked'
            try:link.symlink_to(outside,target_is_directory=True)
            except OSError as error:self.skipTest(str(error))
            with self.assertRaisesRegex(ValueError,'symlink|reparse'):packet.inventory_roots([data])

    def test_reparse_metadata_is_refused_without_following_or_opening_content(self):
        class Entry:
            def stat(self,follow_symlinks=True):
                if follow_symlinks:raise AssertionError('must not follow reparse metadata')
                return SimpleNamespace(st_mode=stat.S_IFREG,st_file_attributes=0x400)
        class Entries:
            def __enter__(self):return iter([Entry()])
            def __exit__(self,*args):return False
        with tempfile.TemporaryDirectory() as folder:
            with patch.object(packet.os,'scandir',return_value=Entries()):
                with self.assertRaisesRegex(ValueError,'reparse'):
                    packet.inventory_roots([folder])

    def test_preparation_code_never_constructs_network_connection(self):
        with tempfile.TemporaryDirectory() as folder:
            root,data,cache,machine=self.fixture(folder)
            with patch.object(receiver.http.client,'HTTPSConnection',side_effect=AssertionError('network')):
                observation,draft=packet.build_documents(packet.inventory_roots([data]),machine,{},
                    cache/'receipt',root/'inventory.json',root/'draft.json')
            self.assertEqual(observation['networkRequests'],0)
            self.assertFalse(observation['rawBodyAcquired'])

    def test_prepare_requires_distinct_geography_checkout_before_discovery(self):
        with tempfile.TemporaryDirectory() as folder:
            plugin=Path(folder)/'plugin-v1';plugin.mkdir();(plugin/'.cache').mkdir()
            with patch.object(packet,'REPO',plugin),patch.object(packet,'PLUGIN',plugin):
                with patch.object(packet.os,'scandir',side_effect=AssertionError('must refuse before discovery')) as discovery:
                    with patch.object(packet,'inventory_roots',side_effect=AssertionError('must refuse before inventory')) as inventory:
                        with self.assertRaisesRegex(ValueError,'distinct geography checkout.*geography-readiness'):
                            packet.prepare()
            discovery.assert_not_called();inventory.assert_not_called()

    def preparation_fixture(self,folder):
        root=Path(folder);repo=root/'geography';plugin=root/'plugin-v1'
        cache=repo/'.cache';cache.mkdir(parents=True)
        for index in range(100):
            child=cache/f'child-{index}';child.mkdir();(child/'retained').write_bytes(b'x')
        recovery=cache/'recovery';recovery.mkdir();(recovery/'index.bak').write_bytes(b'backup!')
        (plugin/'.data').mkdir(parents=True);(plugin/'.data'/'raw').write_bytes(b'raw')
        (plugin/'.cache').mkdir();(plugin/'.cache'/'failure').write_bytes(b'failure')
        boundaries=repo/'docs/operations/natural-earth-admission';boundaries.mkdir(parents=True)
        (boundaries/'boundary').write_bytes(b'ne')
        evidence=repo/'docs/operations/data-pilot-evidence';evidence.mkdir()
        history=tuple(evidence/f'v1-{index}.json' for index in range(3))
        for item in history:item.write_bytes(b'h')
        review=evidence/'prior-review.json';review.write_bytes(b'r')
        stops=tuple(evidence/f'stop-{index}.json' for index in range(3))
        for item in stops:item.write_bytes(b'stop')
        source=evidence/'source.json';source.write_bytes(b'meta')
        machine=dict(observedUtc='2026-10-17T00:00:00Z',platform='synthetic',
            disk=dict(path=str(repo),totalBytes=1024**4,freeBytes=receiver.RESERVE_BYTES+receiver.SOURCE['bytes']+receiver.EVIDENCE_BYTES+1024**3),memory={})
        values=dict(REPO=repo,PLUGIN=plugin,ATTEMPT=repo/'.planet-261012-receipt-20261017-r2',
            INVENTORY=evidence/'inventory-r2.json',DRAFT=evidence/'draft-r2.json',
            HISTORICAL_PREPARATION=history,PRIOR_REVIEW=review,PRIOR_PREPARATION_STOPS=stops)
        return repo,cache,source,machine,values

    def test_prepare_counts_whole_cache_with_over_64_children_and_all_prior_evidence_once(self):
        with tempfile.TemporaryDirectory() as folder:
            repo,cache,source,machine,values=self.preparation_fixture(folder)
            with ExitStack() as stack:
                stack.enter_context(patch.multiple(packet,create=True,**values))
                stack.enter_context(patch.object(packet,'machine_snapshot',return_value=machine))
                stack.enter_context(patch.object(receiver,'_source_evidence',return_value=dict(path=str(source),sha256Lf='0'*64)))
                stack.enter_context(patch.object(receiver.http.client,'HTTPSConnection',side_effect=AssertionError('no network')))
                observation,draft=packet.prepare()
            records=observation['inventory']['records'];paths=[Path(item['path']) for item in records]
            self.assertEqual(observation['inventory']['logicalBytes'],139)
            self.assertEqual(sum(item['logicalBytes'] for item in records if Path(item['path'])==cache.resolve()),107)
            self.assertEqual(paths.count(cache.resolve()),1)
            self.assertFalse(any(path!=cache.resolve() and path.is_relative_to(cache.resolve()) for path in paths))
            for prior in (*values['HISTORICAL_PREPARATION'],values['PRIOR_REVIEW'],*values['PRIOR_PREPARATION_STOPS'],source):
                self.assertEqual(paths.count(prior.resolve()),1)
            attempt=Path(draft['proposedAllowance']['attemptRoot'])
            self.assertFalse(any(attempt==path or attempt.is_relative_to(path) or path.is_relative_to(attempt) for path in paths))
            self.assertFalse(attempt.exists());self.assertEqual(len(paths)+3,15)
            self.assertFalse(draft['executionAllowed']);self.assertIsNone(draft['authorization'])

    def test_prepare_refuses_preexisting_external_attempt_before_inventory(self):
        with tempfile.TemporaryDirectory() as folder:
            repo,cache,source,machine,values=self.preparation_fixture(folder)
            values['ATTEMPT'].mkdir();(values['ATTEMPT']/'body.partial').write_bytes(b'failed raw')
            with patch.multiple(packet,create=True,**values),patch.object(packet,'inventory_roots',side_effect=AssertionError('must refuse before inventory')):
                with self.assertRaisesRegex(FileExistsError,'attempt.*exists'):
                    packet.prepare()

    def test_prepare_rechecks_cache_identity_after_all_roots_are_scanned(self):
        with tempfile.TemporaryDirectory() as folder:
            repo,cache,source,machine,values=self.preparation_fixture(folder)
            original=packet.inventory_roots
            def mutate_after_scan(roots,**kwargs):
                result=original(roots,**kwargs)
                (cache/'late-child').mkdir()
                os.utime(cache,ns=(1_000_000_000,1_000_000_000))
                return result
            with patch.multiple(packet,create=True,**values),patch.object(packet,'inventory_roots',side_effect=mutate_after_scan),patch.object(receiver,'_source_evidence',return_value=dict(path=str(source))):
                with self.assertRaisesRegex(ValueError,'cache.*changed'):
                    packet.prepare()

    def test_inventory_mutation_stop_names_the_changed_directory(self):
        with tempfile.TemporaryDirectory() as folder:
            root,data,cache,machine=self.fixture(folder)
            data=packet.safe_path(data)
            scandir=packet.os.scandir
            class Entries:
                def __init__(self,path):self.path=Path(path);self.handle=scandir(path)
                def __enter__(self):return self.handle.__enter__()
                def __exit__(self,*args):
                    result=self.handle.__exit__(*args)
                    if self.path==data:os.utime(data,ns=(1_000_000_000,1_000_000_000))
                    return result
            with patch.object(packet.os,'scandir',side_effect=Entries):
                with self.assertRaisesRegex(ValueError,'directory changed during enumeration') as stopped:
                    packet.inventory_roots([data])
            self.assertIn(str(data.resolve()),str(stopped.exception))

    @unittest.skipUnless(os.name=='nt','Windows native directory identity')
    def test_windows_directory_size_change_without_native_mutation_is_accepted(self):
        with tempfile.TemporaryDirectory() as folder:
            root=Path(folder).resolve();lstat=Path.lstat;scandir=packet.os.scandir;enumerated=False
            def observed(path,*args,**kwargs):
                info=lstat(path,*args,**kwargs)
                if path!=root:return info
                return SimpleNamespace(st_mode=info.st_mode,st_dev=info.st_dev,st_ino=info.st_ino,
                    st_size=0 if enumerated else 4096,st_mtime_ns=info.st_mtime_ns,
                    st_file_attributes=info.st_file_attributes)
            class Entries:
                def __init__(self,path):self.handle=scandir(path)
                def __enter__(self):return self.handle.__enter__()
                def __exit__(self,*args):
                    nonlocal enumerated
                    result=self.handle.__exit__(*args);enumerated=True;return result
            with patch.object(Path,'lstat',observed),patch.object(packet.os,'scandir',side_effect=Entries):
                inventory=packet.inventory_roots([root])
            self.assertEqual(inventory['logicalBytes'],0)
            self.assertEqual(inventory['directories'],1)

    @unittest.skipUnless(os.name=='nt','Windows native directory identity')
    def test_windows_native_identity_detects_spaced_child_changes_with_restored_write_time_and_replacement(self):
        with tempfile.TemporaryDirectory() as folder:
            root=Path(folder);directory=root/'retained';directory.mkdir()
            def separate_timestamp(previous):
                # Native timestamps have filesystem/clock granularity. Exercise
                # known distinct ticks; this is not proof against every rapid
                # mutation within a timestamp quantum or an atomic snapshot.
                deadline=time.monotonic()+2
                while time.time_ns()<=previous[3]+100_000_000:
                    if time.monotonic()>=deadline:self.fail('native timestamp separation deadline')
                    time.sleep(0.005)
            info=directory.lstat();initial=packet._entry_identity(directory,info,lambda:None)
            separate_timestamp(initial)
            child=directory/'child';child.write_bytes(b'tiny')
            child_closed=packet._entry_identity(directory,directory.lstat(),lambda:None)
            self.assertNotEqual(initial,child_closed)
            os.utime(directory,ns=(info.st_atime_ns,info.st_mtime_ns))
            added=packet._entry_identity(directory,directory.lstat(),lambda:None)
            self.assertEqual(directory.lstat().st_mtime_ns,info.st_mtime_ns)
            self.assertNotEqual(initial,added)
            separate_timestamp(added)
            renamed=child.rename(directory/'renamed')
            rename_closed=packet._entry_identity(directory,directory.lstat(),lambda:None)
            self.assertNotEqual(added,rename_closed)
            os.utime(directory,ns=(info.st_atime_ns,info.st_mtime_ns))
            after_rename=packet._entry_identity(directory,directory.lstat(),lambda:None)
            self.assertNotEqual(added,after_rename)
            separate_timestamp(after_rename)
            renamed.rename(root/'retained-moved-file')
            removal_closed=packet._entry_identity(directory,directory.lstat(),lambda:None)
            self.assertNotEqual(after_rename,removal_closed)
            os.utime(directory,ns=(info.st_atime_ns,info.st_mtime_ns))
            after_removal=packet._entry_identity(directory,directory.lstat(),lambda:None)
            self.assertNotEqual(after_rename,after_removal)
            directory.rename(root/'old-directory');directory.mkdir()
            os.utime(directory,ns=(info.st_atime_ns,info.st_mtime_ns))
            replacement=packet._entry_identity(directory,directory.lstat(),lambda:None)
            self.assertNotEqual(after_removal[:2],replacement[:2])

    @unittest.skipUnless(os.name=='nt','Windows native directory identity')
    def test_windows_native_directory_identity_refuses_unsafe_or_unbound_metadata_and_query_failure(self):
        with tempfile.TemporaryDirectory() as folder:
            directory=Path(folder);info=directory.lstat()
            metadata=packet._windows_directory_metadata(directory,lambda:None)
            for change in (dict(directory=False),dict(deletePending=True),dict(attributes=0x410),
                    dict(volume=info.st_dev+1,legacyVolume=info.st_dev+1),
                    dict(fileId=info.st_ino+1,legacyFileId=info.st_ino+1),
                    dict(writeNs=info.st_mtime_ns+100),dict(changeNs=0)):
                with self.subTest(change=change),patch.object(packet,'_windows_directory_metadata',return_value={**metadata,**change}):
                    with self.assertRaises(ValueError):packet._entry_identity(directory,info,lambda:None)
            with patch.object(packet,'_windows_directory_metadata',side_effect=OSError('native query failed')):
                with self.assertRaisesRegex(OSError,'native query failed'):
                    packet._entry_identity(directory,info,lambda:None)
            regular=directory/'regular';regular.write_bytes(b'kept')
            first=packet._entry_identity(regular,regular.lstat(),lambda:None)
            regular.write_bytes(b'kept and enlarged')
            self.assertNotEqual(first,packet._entry_identity(regular,regular.lstat(),lambda:None))

    def test_r2_preparation_retains_all_v1_evidence_once_with_distinct_outputs(self):
        captured=[]
        def inventory(roots,**kwargs):captured.extend(roots);raise RuntimeError('synthetic roots captured')
        with tempfile.TemporaryDirectory() as folder:
            root=Path(folder);(root/'.cache').mkdir()
            canonical_cache=packet.safe_path(root/'.cache')
            with patch.object(packet,'REPO',root),patch.object(receiver,'_source_evidence',return_value=dict(path=str(root/'source.json'))),patch.object(packet,'inventory_roots',side_effect=inventory):
                with self.assertRaisesRegex(RuntimeError,'synthetic roots captured'):
                    packet.prepare()
        history=tuple(packet.HISTORICAL_PREPARATION)
        self.assertEqual(len(history),3)
        self.assertTrue(all(captured.count(path)==1 for path in history))
        self.assertTrue(all('-r2.json' in str(path) for path in (packet.INVENTORY,packet.DRAFT,packet.COMPATIBILITY)))
        self.assertFalse(set(history)&{packet.INVENTORY,packet.DRAFT,packet.COMPATIBILITY})
        self.assertEqual(captured.count(canonical_cache),1)
        self.assertEqual(len(captured)+2+1,18)

    def test_preparation_reserves_attempt_root_slot_in_combined_64_root_limit(self):
        with tempfile.TemporaryDirectory() as folder:
            root,data,cache,machine=self.fixture(folder)
            records=[dict(path=str(root/f'retained-{index}')) for index in range(62)]
            with self.assertRaisesRegex(ValueError,'attempt.*64'):
                packet.build_documents(dict(records=records,logicalBytes=0),machine,{},
                    cache/'receipt',root/'inventory.json',root/'draft.json')

    def test_prepare_shared_deadline_starts_before_path_resolution_or_source_read(self):
        with patch.object(packet,'safe_path',side_effect=AssertionError('deadline must stop before resolution')):
            with patch.object(receiver,'_source_evidence',side_effect=AssertionError('no evidence read')):
                with self.assertRaisesRegex(TimeoutError,'deadline'):
                    packet.prepare(clock=iter([0,31]).__next__)

    def test_root_canonicalization_is_bounded_before_full_input_consumption(self):
        consumed=[]
        def roots():
            for index in range(100):
                consumed.append(index);yield Path(f'/synthetic/{index}')
        with patch.object(packet,'safe_path',side_effect=lambda value:value) as resolve:
            with self.assertRaisesRegex(ValueError,'64'):
                packet.inventory_roots(roots())
        self.assertEqual(len(consumed),65)
        self.assertEqual(resolve.call_count,64)

    def test_receiver_compatibility_probe_is_metadata_only_and_reports_bounded_failure(self):
        with tempfile.TemporaryDirectory() as folder:
            root=Path(folder);(root/'data').write_bytes(b'tiny')
            with patch.object(receiver.http.client,'HTTPSConnection',side_effect=AssertionError('network')):
                report=packet.probe_receiver_inventory([str(root)],4)
            self.assertEqual(report['status'],'compatible-observation')
            self.assertEqual(report['actualRetainedLogicalBytes'],4)
            self.assertFalse(report['retainedAllocationChangedSinceObservation'])
            def stalled(paths,deadline_check):deadline_check()
            with patch.object(receiver,'_inventory',side_effect=stalled):
                failed=packet.probe_receiver_inventory([str(root)],4,clock=iter([0,0,30,30]).__next__)
            self.assertEqual(failed['status'],'bounded-stop')
            self.assertIsNone(failed['actualRetainedLogicalBytes'])
            self.assertIsNone(failed['retainedAllocationChangedSinceObservation'])
            self.assertEqual(failed['networkRequests'],0);self.assertFalse(failed['allowanceUsed'])

    def test_probe_rejects_unbounded_or_nontext_roots_before_receiver_resolution(self):
        with patch.object(receiver,'_inventory',side_effect=AssertionError('no receiver traversal')):
            for paths in ([str(Path.cwd())]*65,[],[Path.cwd()],['relative'],['']):
                with self.subTest(paths=paths[:1]):
                    with self.assertRaisesRegex(ValueError,'1 to 64 absolute text paths'):
                        packet.probe_receiver_inventory(paths,0)


if __name__=='__main__':unittest.main()
