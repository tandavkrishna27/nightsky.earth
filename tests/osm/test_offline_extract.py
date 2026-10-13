import sys, tempfile, unittest
from io import BytesIO
from unittest.mock import patch, mock_open
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parents[2] / 'scripts/osm'))
import offline_extract as module

class OfflineExtractTest(unittest.TestCase):
    def test_rejects_incomplete_way_and_deduplicates_complete_identity(self):
        with tempfile.TemporaryDirectory() as folder:
            path = Path(folder) / 'sample.osm'
            path.write_text('<osm version="0.6"><node id="1" lat="27" lon="89"/><node id="2" lat="28" lon="90"/><way id="3"><nd ref="1"/><nd ref="2"/><tag k="name" v="Complete"/><tag k="leisure" v="park"/></way><way id="4"><nd ref="1"/><nd ref="9"/><tag k="name" v="Incomplete"/><tag k="leisure" v="park"/></way></osm>')
            index, stats = module.select(path, vintage='fixture', region='Fixture')
            self.assertEqual([r['osmId'] for r in index['candidates']], [3])
            self.assertEqual(stats['incompleteWays'], 1)
            self.assertEqual(index['candidates'][0]['latitude'], 27.5)
            self.assertEqual(module.merge_rows([index['candidates'], index['candidates']]), index['candidates'])
            changed = dict(index['candidates'][0], latitude=1)
            with self.assertRaisesRegex(ValueError, 'conflicting'):
                module.merge_rows([index['candidates'], [changed]])

    def test_existing_source_is_preserved_before_any_network_request(self):
        with tempfile.TemporaryDirectory() as folder:
            path = Path(folder) / 'source.osm.pbf'
            path.write_bytes(b'prior')
            with self.assertRaises(FileExistsError): module.download(path)
            self.assertEqual(path.read_bytes(), b'prior')

    def test_streamed_oversize_and_short_downloads_remove_unpublished_source(self):
        class Reply(BytesIO):
            headers = {'Content-Length': '3'}
        for body in (b'four', b'no'):
            with tempfile.TemporaryDirectory() as folder:
                path = Path(folder) / 'new.pbf'
                with patch.object(module.urllib.request, 'urlopen', side_effect=[Reply(), Reply(body)]):
                    with self.assertRaises(ValueError): module.download(path)
                self.assertFalse(path.exists())

    def test_linux_supervisor_uses_peak_resident_memory(self):
        import bounded_nodes
        class Process: pid = 123
        with patch.object(bounded_nodes.os, 'name', 'posix'), patch('builtins.open', mock_open(read_data='VmRSS: 100 kB\nVmHWM: 200 kB\n')):
            self.assertEqual(bounded_nodes.rss_bytes(Process()), 200 * 1024)

    def test_linux_exited_process_without_counters_is_not_accounting_failure(self):
        import bounded_nodes
        class Process:
            pid = 123
            def poll(self): return 0
        with patch.object(bounded_nodes.os, 'name', 'posix'), patch('builtins.open', mock_open(read_data='State: Z\n')):
            self.assertEqual(bounded_nodes.rss_bytes(Process()), 0)
        class Alive(Process):
            def poll(self): return None
        with patch.object(bounded_nodes.os, 'name', 'posix'), patch('builtins.open', mock_open(read_data='State: R\n')):
            with self.assertRaisesRegex(RuntimeError, 'unavailable'): bounded_nodes.rss_bytes(Alive())

    def test_supervisor_accounting_failure_stops_worker_and_returns_cleanup_report(self):
        import bounded_nodes
        with tempfile.TemporaryDirectory() as folder:
            output = Path(folder) / 'artifact.json'
            with patch.object(bounded_nodes, 'rss_bytes', side_effect=RuntimeError('unavailable')):
                report = bounded_nodes.supervise(['-c', 'import time; time.sleep(5)'], output)
            self.assertEqual(report['status'], 'bounded-stop')
            self.assertEqual(report['reason'], 'memory accounting unavailable')
            self.assertFalse(output.exists())

    def test_failed_accounting_report_removes_worker_staging(self):
        with tempfile.TemporaryDirectory() as folder:
            root = Path(folder)
            (root / 'acquisition.json').write_text('{}')
            def stopped(*args, **kwargs):
                (root / 'candidates.staged.json').write_text('unpublished')
                (root / 'selection.json').write_text('{}')
                return {'status': 'bounded-stop', 'reason': 'memory accounting unavailable'}
            with patch.object(module, 'supervise', side_effect=stopped), patch.object(sys, 'argv', ['offline_extract.py', 'build', folder]), patch('builtins.print'):
                with self.assertRaises(SystemExit): module.main()
            self.assertFalse((root / 'candidates.staged.json').exists())
            self.assertFalse((root / 'selection.json').exists())
            self.assertFalse((root / 'candidates.json').exists())
            self.assertTrue((root / 'manifest.json').exists())

    def test_download_requires_declared_size_below_cap(self):
        for value in (None, 'bad', '0', str(100 * 1024 * 1024 + 1)):
            with self.assertRaises(ValueError): module.content_length(value)
        self.assertEqual(module.content_length('23618779'), 23618779)

if __name__ == '__main__': unittest.main()
