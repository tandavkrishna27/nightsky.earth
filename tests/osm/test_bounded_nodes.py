import importlib.util
from pathlib import Path
import tempfile
import unittest
from unittest.mock import patch

ROOT = Path(__file__).resolve().parents[2]
spec = importlib.util.spec_from_file_location('bounded_nodes', ROOT / 'scripts/osm/bounded_nodes.py')
module = importlib.util.module_from_spec(spec)
spec.loader.exec_module(module)


class BoundedNodesTest(unittest.TestCase):
    def test_region_filter_is_node_only_repeatable_and_attributed(self):
        with tempfile.TemporaryDirectory() as folder:
            raw = Path(folder) / 'sample.osm'
            raw.write_text('<osm version="0.6"><node id="1" lat="10.2" lon="77.4"><tag k="name" v="Park"/><tag k="leisure" v="park"/></node><node id="2" lat="18" lon="73"><tag k="name" v="Outside"/><tag k="leisure" v="park"/></node><way id="3"><tag k="leisure" v="park"/><tag k="name" v="Way"/></way></osm>')
            first = module.select_nodes(raw, vintage='fixture', max_candidates=10)
            self.assertEqual(first, module.select_nodes(raw, vintage='fixture', max_candidates=10))
            self.assertEqual([c['osmId'] for c in first['candidates']], [1])
            self.assertIn('nodes only', first['coverage'])
            self.assertIn('ODbL', first['source']['attribution'])
            with self.assertRaisesRegex(ValueError, 'candidate limit'):
                module.select_nodes(raw, vintage='fixture', max_candidates=0)

    def test_supervisor_timeout_preserves_existing_output(self):
        with tempfile.TemporaryDirectory() as folder:
            output = Path(folder) / 'prior.json'
            output.write_text('prior')
            with patch.object(module, 'rss_bytes', return_value=1024):
                report = module.supervise(['-c', 'import time; time.sleep(5)'], output, wall_seconds=0.1, rss_mib=512)
            self.assertEqual(report['status'], 'bounded-stop')
            self.assertEqual(output.read_text(), 'prior')

    def test_supervisor_memory_limit_terminates_worker(self):
        with tempfile.TemporaryDirectory() as folder:
            with patch.object(module, 'rss_bytes', return_value=513 * 1024 * 1024):
                report = module.supervise(['-c', 'import time; time.sleep(5)'], Path(folder) / 'absent', wall_seconds=5, rss_mib=512)
            self.assertEqual(report['reason'], 'RSS limit')
            self.assertEqual(report['status'], 'bounded-stop')

if __name__ == '__main__':
    unittest.main()
