"""Offline supervisor accounting and secret-free diagnostics."""
import json
from pathlib import Path
import sys
import tempfile
import unittest
from unittest.mock import patch
sys.path.insert(0, str(Path(__file__).resolve().parents[2] / 'scripts/era5'))
import timeseries_sample as live
import sample_executor as core


class Tests(unittest.TestCase):
    def test_real_requests_does_not_preconsume_redirect_body(self):
        import requests
        class Transport(requests.adapters.BaseAdapter):
            def send(self, request, **kwargs):
                response = requests.Response()
                response.status_code = 302
                response.headers['location'] = 'https://example.invalid/private'
                response.request = request
                response.raw = None
                return response
            def close(self): pass
        adapter = live.make_adapter('synthetic-token')
        adapter.api.mount('https://', Transport())
        response = adapter.api.request('GET', 'https://example.invalid/no-network',
                                       stream=True, allow_redirects=False)
        self.assertFalse(response._content_consumed)
        adapter.close()

    def test_parent_tolerates_atomic_pending_disappearance(self):
        with tempfile.TemporaryDirectory() as directory:
            pending = Path(directory) / 'checkpoint.pending'
            pending.write_bytes(b'abc')
            original = Path.stat
            def racing(path, *args, **kwargs):
                if path == pending:
                    pending.unlink()
                    raise FileNotFoundError('atomic rename')
                return original(path, *args, **kwargs)
            with patch.object(Path, 'stat', racing):
                try:
                    live.supervisor_budget(directory)
                except (AttributeError, FileNotFoundError):
                    self.fail('parent accounting stopped on a legitimate atomic disappearance')

    def test_parent_rejects_overflow_unexpected_and_hardlinks(self):
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            (root / 'surprise').write_text('x')
            with self.assertRaises(ValueError): live.supervisor_budget(root)
            (root / 'surprise').unlink()
            (root / 'sample.raw').write_bytes(b'123')
            with patch.object(core, 'TREE_LIMIT', 2):
                with self.assertRaises(ValueError): live.supervisor_budget(root)
            import os
            os.link(root / 'sample.raw', root / 'checkpoint.json')
            with self.assertRaises(ValueError): live.supervisor_budget(root)

    def test_preflight_failure_retains_safe_supervisor_result(self):
        with tempfile.TemporaryDirectory() as directory:
            allowance = Path(directory) / 'allowance.json'
            output = Path(directory) / 'output'
            with patch.object(live, 'preflight', side_effect=ValueError('synthetic-token https://private/path')):
                with self.assertRaises(ValueError): live.supervise(allowance, output)
            receipt = Path(str(allowance) + '.supervisor-result.json')
            self.assertTrue(receipt.exists())
            value = json.loads(receipt.read_text())
            self.assertEqual(value['outcome'], 'stopped')
            self.assertEqual(value['stage'], 'preflight')
            self.assertNotIn('synthetic-token', receipt.read_text())
            self.assertNotIn('https:', receipt.read_text())

    def test_transport_failure_only_serializes_fixed_categories(self):
        import timeseries_transport as transport
        from timeseries_diagnostics import DiagnosticSink
        class Session:
            def __init__(self): self.headers = {}; self.cookies = {}
            def request(self, *args, **kwargs):
                raise RuntimeError('synthetic-token https://private/path')
            def close(self): pass
        with tempfile.TemporaryDirectory() as directory:
            sink = DiagnosticSink(Path(directory))
            adapter = transport.Adapter('synthetic-token', Session, diagnostic=sink)
            with self.assertRaises(ValueError): adapter._json('POST', '/never-requested', 1)
            body = (Path(directory) / 'transport-diagnostic.json').read_text()
            self.assertNotIn('synthetic-token', body)
            self.assertNotIn('https:', body)
            self.assertEqual(json.loads(body)['failure'], 'transport')


if __name__ == '__main__': unittest.main()
