import importlib.util
import json
import os
from pathlib import Path
import sys
import tempfile
import unittest
from unittest.mock import patch

ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(ROOT / 'scripts/osm'))


def implementation():
    assert importlib.util.find_spec('retained_experiment'), 'retained experiment implementation is missing'
    import retained_experiment
    return retained_experiment


class RetainedExperimentTest(unittest.TestCase):
    def test_filter_keeps_way_references_name_fallback_and_excludes_unrelated_objects(self):
        module = implementation()
        with tempfile.TemporaryDirectory() as folder:
            root = Path(folder)
            raw = root / 'source.osm'
            raw.write_text('<osm version="0.6"><node id="1" lat="27" lon="89"/><node id="2" lat="28" lon="90"/><node id="3" lat="29" lon="91"><tag k="name:en" v="Camp"/><tag k="tourism" v="camp_site"/></node><node id="4" lat="30" lon="92"/><way id="5"><nd ref="1"/><nd ref="2"/><tag k="official_name" v="Park"/><tag k="leisure" v="park"/></way><way id="6"><nd ref="1"/><nd ref="99"/><tag k="name" v="Incomplete"/><tag k="natural" v="beach"/></way><relation id="7"><tag k="name" v="Reserve"/><tag k="protect_class" v="1"/></relation></osm>')
            filtered = root / 'filtered.osm.pbf'
            stats = module.filter_source(raw, filtered)
            self.assertEqual(stats['writtenNodes'], 3)
            self.assertEqual(stats['writtenWays'], 2)
            self.assertEqual(stats['referenceIds'], 3)
            from offline_extract import select
            document, selection = select(filtered, vintage='fixture', region='Fixture')
            self.assertEqual([(r['osmType'], r['osmId']) for r in document['candidates']], [('node', 3), ('way', 5)])
            self.assertEqual(document['candidates'][1]['latitude'], 27.5)
            self.assertEqual(selection['incompleteWays'], 1)
            with self.assertRaises(FileExistsError): module.filter_source(raw, filtered)

    def test_partition_preserves_every_identity_and_fails_on_conflicts_or_caps(self):
        module = implementation()
        from import_candidates import OSM_SOURCE
        rows = [dict(osmType='node', osmId=i, name='Point', category='park', latitude=lat, longitude=lon, sourceCompleteness=1) for i, lat, lon in [(1, 90, 180), (2, -90, -180), (3, 0, 0), (4, 0, .1)]]
        document = dict(schemaVersion=1, vintage='fixture', coverage='Synthetic only', source=OSM_SOURCE, candidates=rows)
        with tempfile.TemporaryDirectory() as folder:
            partitions = module.partition_points(document, Path(folder), max_rows=1)
            recovered = [r for path in partitions for r in json.loads(path.read_text())['candidates']]
            self.assertEqual(sorted(r['osmId'] for r in recovered), [1, 2, 3, 4])
        with tempfile.TemporaryDirectory() as folder:
            with self.assertRaisesRegex(ValueError, 'conflicting'):
                module.partition_points(dict(document, candidates=[rows[0], dict(rows[0], name='Changed')]), Path(folder))
        with tempfile.TemporaryDirectory() as folder:
            with self.assertRaisesRegex(ValueError, 'partition limit'):
                module.partition_points(document, Path(folder), max_rows=1, max_partitions=1)

    @unittest.skipUnless(os.name == 'nt', 'Windows job supervisor experiment')
    def test_supervisor_stops_on_scratch_growth_and_preserves_input(self):
        module = implementation()
        with tempfile.TemporaryDirectory() as folder:
            root = Path(folder)
            source = root / 'retained'
            source.write_bytes(b'unchanged')
            stage = root / 'stage'
            stage.mkdir()
            code = "from pathlib import Path; import time; Path('growing').write_bytes(b'x'*65536); time.sleep(2)"
            result = module.supervise_stage(['-c', code], stage, source_bytes=9, wall_seconds=3, scratch_bytes=1024)
            self.assertEqual(result['status'], 'bounded-stop')
            self.assertEqual(result['reason'], 'scratch limit')
            self.assertEqual(source.read_bytes(), b'unchanged')

    @unittest.skipUnless(os.name == 'nt', 'Windows job supervisor experiment')
    def test_assignment_failure_kills_suspended_worker_with_bounded_wait(self):
        module = implementation()
        launched = []
        original_launch = module.subprocess.Popen
        def launch(*args, **kwargs):
            process = original_launch(*args, **kwargs)
            original_wait = process.wait
            def bounded_wait(timeout=None):
                self.assertIsNotNone(timeout, 'cleanup must never wait indefinitely')
                return original_wait(timeout=timeout)
            process.wait = bounded_wait
            launched.append((process, original_wait))
            return process
        with tempfile.TemporaryDirectory() as folder:
            try:
                with patch.object(module.subprocess, 'Popen', side_effect=launch), patch.object(module.WindowsJob, 'assign_resume', side_effect=OSError('assignment refused')):
                    result = module.supervise_stage(['-c', 'import time; time.sleep(10)'], Path(folder), source_bytes=0)
                self.assertEqual(result['status'], 'bounded-stop')
                self.assertIn('assignment refused', result['reason'])
                self.assertIsNotNone(launched[0][0].poll())
            finally:
                for process, original_wait in launched:
                    if process.poll() is None: process.kill()
                    original_wait(timeout=3)

    @unittest.skipUnless(os.name == 'nt', 'Windows job supervisor experiment')
    def test_job_memory_limit_refuses_large_allocation(self):
        module = implementation()
        with tempfile.TemporaryDirectory() as folder:
            result = module.supervise_stage(['-c', 'bytearray(400*1024*1024)'], Path(folder), source_bytes=0)
            self.assertNotEqual(result['status'], 'complete')
            self.assertNotEqual(result['exitCode'], 0)

    @unittest.skipUnless(os.name == 'nt', 'Windows job supervisor experiment')
    def test_supervisor_stops_deadline_and_blocks_descendant_processes(self):
        module = implementation()
        with tempfile.TemporaryDirectory() as folder:
            result = module.supervise_stage(['-c', 'import time; time.sleep(2)'], Path(folder), source_bytes=0, wall_seconds=.15)
            self.assertEqual(result['status'], 'bounded-stop')
            self.assertEqual(result['reason'], 'wall time limit')
        with tempfile.TemporaryDirectory() as folder:
            result = module.supervise_stage(['-c', 'import subprocess,sys; subprocess.run([sys.executable,"-c","print(1)"],check=True)'], Path(folder), source_bytes=0)
            self.assertEqual(result['status'], 'failed')
            self.assertEqual(result['processPolicy'], 'single-process Windows job; descendants refused')


if __name__ == '__main__': unittest.main()
