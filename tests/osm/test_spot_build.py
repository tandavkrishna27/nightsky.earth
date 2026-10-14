import sys, tempfile, unittest
from pathlib import Path
ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(ROOT / 'scripts/osm'))

class SpotBuildTest(unittest.TestCase):
    def test_geometry_excludes_dateline_and_missing_and_removes_closure(self):
        from spot_build import way_point
        self.assertEqual(way_point([(1, 179), (1, -179)]), (None, 'dateline'))
        self.assertEqual(way_point([(90, 1), (90, 3), (90, 1)]), ((90, 2), None))
        self.assertEqual(way_point([(1, 2), None]), (None, 'incomplete'))

    def test_refuses_existing_output_before_reading_source(self):
        from spot_build import build_source
        with tempfile.TemporaryDirectory() as temp:
            root = Path(temp)
            with self.assertRaises(FileExistsError):
                build_source(root / 'missing', root, {})



class MoreGeometryTest(unittest.TestCase):
    def test_exact_180_span_is_accepted(self):
        from spot_build import way_point
        self.assertEqual(way_point([(0, -90), (0, 90)]), ((0, 0), None))

    def test_nonfinite_and_out_of_range_are_incomplete(self):
        from spot_build import way_point
        for points in ([], [(float('nan'), 1)], [(91, 1)], [(1, 181)]):
            self.assertEqual(way_point(points), (None, 'incomplete'))

    def test_refuses_symlink_component(self):
        from spot_build import safe_path
        from unittest.mock import patch
        import stat
        from types import SimpleNamespace
        # Mock the non-following metadata used by the guard, rather than the
        # redundant query removed by the performance correction.
        link=SimpleNamespace(st_mode=stat.S_IFLNK,st_file_attributes=0)
        with patch.object(Path, 'lstat', return_value=link), \
             patch.object(Path, 'resolve', side_effect=AssertionError('link must be rejected before resolve')):
            with self.assertRaises(ValueError): safe_path('fixture')

class SyntheticBuildTest(unittest.TestCase):
    @unittest.skipUnless(sys.platform == 'win32', 'Windows short-path regression')
    def test_build_accepts_safe_windows_short_path_alias(self):
        import ctypes
        from spot_build import build_source
        get_short_path = ctypes.windll.kernel32.GetShortPathNameW
        get_short_path.argtypes = [ctypes.c_wchar_p, ctypes.c_wchar_p, ctypes.c_uint32]
        get_short_path.restype = ctypes.c_uint32
        with tempfile.TemporaryDirectory(prefix='spot geometry long directory ') as temp:
            root = Path(temp).resolve()
            raw, source = self.fixture(root)
            buffer = ctypes.create_unicode_buffer(32768)
            length = get_short_path(str(root), buffer, len(buffer))
            self.assertGreater(length, 0)
            self.assertLess(length, len(buffer))
            short_root = Path(buffer.value)
            if str(short_root).casefold() == str(root).casefold():
                self.skipTest('8.3 aliases are disabled on the fixture volume')
            self.assertEqual(short_root.resolve(), root)
            report = build_source(short_root / raw.name, short_root / 'out', source)
            self.assertEqual(report['candidateRows'], 2)
            self.assertTrue((root / 'out' / 'report.json').is_file())

    def fixture(self, root, vintage='2026-10-13T20:21:31Z'):
        import osmium
        raw = root / 'source.osm.pbf'
        header = osmium.io.Header()
        if vintage: header.set('osmosis_replication_timestamp', vintage)
        with osmium.SimpleWriter(str(raw), header=header) as writer:
            for number, lat, lon in [(1, 90, 1), (2, 90, 3), (3, 1, 179), (4, 1, -179)]:
                writer.add_node(osmium.osm.mutable.Node(id=number, location=(lon, lat)))
            writer.add_node(osmium.osm.mutable.Node(id=5, location=(20, 20), tags={'name:en':'  Camp  ','tourism':'camp_site'}))
            for number, nodes in [(10,[1,2,1]), (11,[3,4]), (12,[1,999])]:
                writer.add_way(osmium.osm.mutable.Way(id=number, nodes=nodes, tags={'name':'Park','leisure':'park'}))
        source = dict(id='synthetic',url='https://example.test/pin.osm.pbf', declaredBytes=raw.stat().st_size,
                      etag='fixture',expectedVintage='2026-10-13T20:21:31Z',licenseUrl='fixture',sourcePage='fixture')
        return raw, source

    def test_repeated_build_canonical_partition_proof_and_geometry_audit(self):
        from spot_build import build_source
        with tempfile.TemporaryDirectory() as temp:
            root=Path(temp); raw, source=self.fixture(root)
            one=build_source(raw,root/'one',source); two=build_source(raw,root/'two',source)
            self.assertEqual(one,two)
            self.assertEqual(one['candidateRows'],2)
            self.assertEqual(one['geometry']['sourceIds'],{'datelineWays':[11],'incompleteWays':[12]})
            self.assertTrue(one['referenceFilteredEqual'])
            self.assertTrue(one['partitionIdentityValueEqual'])
            self.assertFalse(one['independentGeometryProof'])
            self.assertEqual((root/'one/reference.json').read_bytes(),(root/'two/candidates.json').read_bytes())

    def test_absent_or_mismatched_header_is_refused(self):
        from spot_build import build_source
        for vintage in ('', '2020-01-01T00:00:00Z'):
            with tempfile.TemporaryDirectory() as temp:
                root=Path(temp); raw,source=self.fixture(root,vintage)
                with self.assertRaisesRegex(ValueError,'vintage'): build_source(raw,root/'out',source)
                self.assertFalse((root/'out').exists())

    def test_source_hash_and_size_mismatch_refused(self):
        from spot_build import build_source
        with tempfile.TemporaryDirectory() as temp:
            root=Path(temp); raw,source=self.fixture(root)
            source['sha256']='0'*64
            with self.assertRaisesRegex(ValueError,'hash'): build_source(raw,root/'out',source)
            source['declaredBytes']+=1
            with self.assertRaisesRegex(ValueError,'size'): build_source(raw,root/'out',source)

    def test_budget_exception_propagates(self):
        from spot_build import build_source
        with tempfile.TemporaryDirectory() as temp:
            root=Path(temp); raw,source=self.fixture(root)
            def stop(): raise RuntimeError('budget')
            with self.assertRaisesRegex(RuntimeError,'budget'): build_source(raw,root/'out',source,budget_check=stop)

    def test_reference_cap_fails_with_accounted_output(self):
        from spot_build import build_source, CAPS
        from unittest.mock import patch
        with tempfile.TemporaryDirectory() as temp:
            root=Path(temp); raw,source=self.fixture(root)
            with patch.dict(CAPS,referenceBytes=1):
                with self.assertRaisesRegex(ValueError,'cap'): build_source(raw,root/'out',source)
            self.assertTrue((root/'out').is_dir())

    def test_file_and_partition_report_caps_fail(self):
        from spot_build import build_source, CAPS
        from unittest.mock import patch
        for key in ('filteredPbfBytes','filteredBytes','partitionBytes','reportBytes'):
            with self.subTest(cap=key), tempfile.TemporaryDirectory() as temp:
                root=Path(temp); raw,source=self.fixture(root)
                with patch.dict(CAPS,{key:1}):
                    with self.assertRaisesRegex(ValueError,'cap'): build_source(raw,root/'out',source)
                self.assertFalse((root/'out/report.json').exists())

    def test_filter_inequality_refused(self):
        from spot_build import build_source, select_source
        from unittest.mock import patch
        with tempfile.TemporaryDirectory() as temp:
            root=Path(temp); raw,source=self.fixture(root)
            def changed(path, pin, check):
                doc, stats=select_source(path,pin,check)
                if path.name=='filtered.osm.pbf': doc['candidates']=[]
                return doc,stats
            with patch('spot_build.select_source',side_effect=changed):
                with self.assertRaisesRegex(ValueError,'equality'): build_source(raw,root/'out',source)

    def test_budget_runs_through_source_passes(self):
        from spot_build import build_source
        with tempfile.TemporaryDirectory() as temp:
            root=Path(temp); raw,source=self.fixture(root); calls=[]
            build_source(raw,root/'out',source,budget_check=lambda: calls.append(1))
            self.assertGreater(len(calls),40)

    def test_filter_identity_cardinality_caps(self):
        from spot_build import build_source, CAPS
        from unittest.mock import patch
        for key in ('selectedWayIds','referencedNodeIds'):
            with tempfile.TemporaryDirectory() as temp:
                root=Path(temp); raw,source=self.fixture(root)
                with patch.dict(CAPS,{key:1}):
                    with self.assertRaisesRegex(ValueError,'ID cap'): build_source(raw,root/'out',source)

class SampledBuildTest(unittest.TestCase):
    fixture = SyntheticBuildTest.fixture
    def test_record_callback_separate_from_io_and_preserves_candidate_bytes(self):
        from spot_build import build_source
        with tempfile.TemporaryDirectory() as temp:
            root=Path(temp);raw,source=self.fixture(root);calls={'io':0,'scan':0}
            def io():calls['io']+=1
            def scan():calls['scan']+=1
            first=build_source(raw,root/'first',source,budget_check=io,scan_check=scan)
            second=build_source(raw,root/'second',source)
            self.assertGreater(calls['io'],10);self.assertGreater(calls['scan'],3)
            self.assertEqual(first['canonicalSha256'],second['canonicalSha256'])
            self.assertEqual((root/'first/candidates.json').read_bytes(),(root/'second/candidates.json').read_bytes())

if __name__ == '__main__': unittest.main()
