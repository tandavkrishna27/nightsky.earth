import hashlib
import copy
from io import BytesIO
import os
import sys
import tempfile
from pathlib import Path
import unittest
from unittest.mock import patch
from types import SimpleNamespace
import stat

sys.path.insert(0,str(Path(__file__).resolve().parents[2]/'scripts/osm'))
import normalized_partitions as partitions


class NormalizedPartitions(unittest.TestCase):
    def test_rolls_whole_utf8_rows_at_exact_byte_boundary(self):
        rows=[dict(placeId='a',name='é'),dict(placeId='b',name='é')]
        chunks=[(partitions.canonical(row)+'\n').encode() for row in rows]
        for allowance,expected in ((sum(map(len,chunks)),1),(sum(map(len,chunks))-1,2)):
            with self.subTest(allowance=allowance),tempfile.TemporaryDirectory() as folder:
                charged=[]
                family=partitions.write_partitioned_stream(folder,'candidates',iter(rows),lambda:None,charged.append,part_limit=allowance)
                self.assertEqual(len(family['parts']),expected)
                self.assertEqual(family['bytes'],sum(charged))
                self.assertEqual(family['sha256'],hashlib.sha256(b''.join(chunks)).hexdigest())
                actual=b''.join((Path(folder)/pin['path']).read_bytes() for pin in family['parts'])
                self.assertEqual(actual,b''.join(chunks))
                self.assertEqual([p['firstRow'] for p in family['parts']],[0] if expected==1 else [0,1])
                self.assertEqual(family['parts'][-1]['lastKey'],['b'])

    def test_empty_families_and_oversized_row(self):
        with tempfile.TemporaryDirectory() as folder:
            registry=partitions.PartRegistry()
            for name in partitions.FAMILIES:
                self.assertEqual(partitions.write_partitioned_stream(folder,name,[],lambda:None,lambda n:None,registry=registry),
                                 dict(bytes=0,rows=0,sha256=hashlib.sha256(b'').hexdigest(),parts=[]))
        with tempfile.TemporaryDirectory() as folder:
            with self.assertRaisesRegex(ValueError,'part.*row|row.*part'):
                partitions.write_partitioned_stream(folder,'candidates',[dict(placeId='a')],lambda:None,lambda n:None,part_limit=1)
            self.assertEqual(list((Path(folder)/'parts').iterdir()),[])

    def test_strict_keys_and_duplicate_exclusion_occurrences(self):
        for name,rows in (('candidates',[dict(placeId='a')]*2),('lineage',[dict(placeId='a',source='s')]*2),
                          ('exclusions',[dict(source='s',id='b',reason='x'),dict(source='s',id='a',reason='x')])):
            with self.subTest(name=name),tempfile.TemporaryDirectory() as folder:
                with self.assertRaisesRegex(ValueError,'order'):
                    partitions.write_partitioned_stream(folder,name,rows,lambda:None,lambda n:None)
        rows=[dict(source='s',id='outside',reason='unnamed')]*3
        with tempfile.TemporaryDirectory() as folder:
            chunk=(partitions.canonical(rows[0])+'\n').encode()
            family=partitions.write_partitioned_stream(folder,'exclusions',rows,lambda:None,lambda n:None,part_limit=len(chunk))
            self.assertEqual(family['rows'],3);self.assertEqual(len(family['parts']),3)
            self.assertEqual(b''.join((Path(folder)/pin['path']).read_bytes() for pin in family['parts']),chunk*3)

    def test_lineage_groups_stay_together_and_never_split_an_oversized_group(self):
        rows=[dict(placeId=identity,source=source) for identity in ('a','b') for source in ('s0','s1')]
        group_bytes=sum(len((partitions.canonical(row)+'\n').encode()) for row in rows[:2])
        with tempfile.TemporaryDirectory() as folder:
            family=partitions.write_partitioned_stream(folder,'lineage',iter(rows),lambda:None,lambda n:None,part_limit=group_bytes)
            self.assertEqual([part['rows'] for part in family['parts']],[2,2])
        with tempfile.TemporaryDirectory() as folder:
            with self.assertRaisesRegex(ValueError,'part.*row|row.*part'):
                partitions.write_partitioned_stream(folder,'lineage',iter(rows),lambda:None,lambda n:None,part_limit=group_bytes-1)

    def test_shared_part_and_output_budgets_do_not_reset_for_next_family(self):
        with tempfile.TemporaryDirectory() as folder:
            registry=partitions.PartRegistry()
            rows=[dict(placeId=f'{index:03}') for index in range(64)]
            size=len((partitions.canonical(rows[0])+'\n').encode())
            partitions.write_partitioned_stream(folder,'candidates',rows,lambda:None,lambda n:None,part_limit=size,registry=registry)
            with self.assertRaisesRegex(ValueError,'64|cardinality'):
                partitions.write_partitioned_stream(folder,'exclusions',[dict(source='s',id='z',reason='unnamed')],lambda:None,lambda n:None,registry=registry)
            self.assertEqual(len(list((Path(folder)/'parts').iterdir())),64)
        with tempfile.TemporaryDirectory() as folder:
            used=[0]
            def consume(amount):
                used[0]+=amount
                if used[0]>size:raise ValueError('shared output stop')
            with self.assertRaisesRegex(ValueError,'shared output stop'):
                partitions.write_partitioned_stream(folder,'candidates',rows[:2],lambda:None,consume,part_limit=size)
        with tempfile.TemporaryDirectory() as folder:
            used[0]=0;registry=partitions.PartRegistry()
            partitions.write_partitioned_stream(folder,'candidates',rows[:1],lambda:None,consume,registry=registry)
            with self.assertRaisesRegex(ValueError,'shared output stop'):
                partitions.write_partitioned_stream(folder,'exclusions',[dict(source='s',id='outside',reason='unnamed')],lambda:None,consume,registry=registry)

    def test_bounded_file_chunks_do_not_issue_one_read_per_byte_or_probe_past_pin(self):
        class Stream(BytesIO):
            def __init__(self,payload):super().__init__(payload);self.reads=[]
            def read(self,size=-1):self.reads.append(size);return super().read(size)
        payload=b'x'*200000+b'\n';stream=Stream(payload+b'unaccounted appended bytes')
        self.assertEqual(list(partitions.partition_rows(stream,len(payload),len(payload),lambda:None)),[payload])
        self.assertEqual(sum(stream.reads),len(payload));self.assertLessEqual(max(stream.reads),65536)
        self.assertEqual(stream.tell(),len(payload));self.assertLessEqual(len(stream.reads),4)

    def fixture(self,folder):
        registry=partitions.PartRegistry();streams={}
        data=dict(candidates=[dict(placeId='a'),dict(placeId='b')],
            lineage=[dict(placeId='a',source='s'),dict(placeId='b',source='s')],
            exclusions=[dict(source='s',id='outside',reason='unnamed')]*2)
        for family in partitions.FAMILIES:
            cap=max(len((partitions.canonical(row)+'\n').encode()) for row in data[family])
            streams[family]=partitions.write_partitioned_stream(folder,family,data[family],lambda:None,lambda n:None,part_limit=cap,registry=registry)
        return streams

    def test_verifier_checks_all_families_hashes_ranges_and_exclusion_multiplicity(self):
        with tempfile.TemporaryDirectory() as folder:
            streams=self.fixture(folder)
            counts=dict(candidates=2,lineage=2,exclusions=2)
            partitions.verify_partitioned_streams(folder,streams,lambda:None,expected_counts=counts)
            for family in partitions.FAMILIES:
                bad=copy.deepcopy(streams);bad[family]['sha256']='0'*64
                with self.subTest(family=family),self.assertRaisesRegex(ValueError,'digest'):
                    partitions.verify_partitioned_streams(folder,bad,lambda:None,expected_counts=counts)
            for parts in (list(reversed(streams['candidates']['parts'])),[streams['candidates']['parts'][0]]*2):
                bad=copy.deepcopy(streams);bad['candidates']['parts']=parts
                with self.assertRaisesRegex(ValueError,'ordinal|range'):
                    partitions.verify_partitioned_streams(folder,bad,lambda:None,expected_counts=counts)
            bad=copy.deepcopy(streams);bad['exclusions']=dict(bytes=0,rows=0,sha256=hashlib.sha256(b'').hexdigest(),parts=[])
            with patch.object(partitions,'safe_path',side_effect=AssertionError('must reject before path expansion')):
                with self.assertRaisesRegex(ValueError,'frozen'):
                    partitions.verify_partitioned_streams(folder,bad,lambda:None,expected_counts=counts)

    def test_verifier_cardinality_is_rejected_before_paths_or_reads(self):
        streams={family:dict(bytes=0,rows=0,sha256=hashlib.sha256(b'').hexdigest(),parts=[]) for family in partitions.FAMILIES}
        streams['candidates']['parts']=[{}]*65
        with patch.object(partitions,'safe_path',side_effect=AssertionError('must not expand paths')):
            with self.assertRaisesRegex(ValueError,'cardinality'):
                partitions.verify_partitioned_streams('unused',streams,lambda:None)

    def test_verifier_refuses_unexpected_files_reparse_and_late_mutation(self):
        with tempfile.TemporaryDirectory() as folder:
            streams=self.fixture(folder);extra=Path(folder)/'parts'/'unlisted.jsonl';extra.write_bytes(b'')
            with self.assertRaisesRegex(ValueError,'unexpected'):
                partitions.verify_partitioned_streams(folder,streams,lambda:None)
        class Entry:
            def stat(self,follow_symlinks=True):
                self.assert_nonfollowing=not follow_symlinks
                return SimpleNamespace(st_mode=stat.S_IFREG,st_file_attributes=0x400)
        class Entries:
            def __enter__(self):return iter([Entry()])
            def __exit__(self,*args):return False
        with tempfile.TemporaryDirectory() as folder:
            streams=self.fixture(folder)
            with patch.object(partitions.os,'scandir',return_value=Entries()):
                with self.assertRaisesRegex(ValueError,'unlinked'):
                    partitions.verify_partitioned_streams(folder,streams,lambda:None)
        with tempfile.TemporaryDirectory() as folder:
            streams=self.fixture(folder);target=Path(folder)/streams['candidates']['parts'][0]['path'];original=partitions.partition_rows
            def mutate(*args):
                yield from original(*args)
                value=target.stat();os.utime(target,ns=(value.st_atime_ns,value.st_mtime_ns+1000000000))
            with patch.object(partitions,'partition_rows',side_effect=mutate):
                with self.assertRaisesRegex(ValueError,'mutation'):
                    partitions.verify_partitioned_streams(folder,streams,lambda:None)

    def test_verifier_rejects_hardlinked_duplicate_exclusion_parts(self):
        with tempfile.TemporaryDirectory() as folder:
            streams=self.fixture(folder);pins=streams['exclusions']['parts']
            first=Path(folder)/pins[0]['path'];second=Path(folder)/pins[1]['path']
            second.rename(Path(folder)/'retained-original-exclusion.jsonl')
            try:os.link(first,second)
            except OSError as error:self.skipTest(str(error))
            with self.assertRaisesRegex(ValueError,'hardlink|alias'):
                partitions.verify_partitioned_streams(folder,streams,lambda:None)


if __name__=='__main__':unittest.main()
