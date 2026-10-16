"""Real bounded acquisition state machine with fake byte I/O, never sockets."""
import contextlib
import copy
import hashlib
import io
import json
import os
from pathlib import Path
import subprocess
import sys
import tempfile
import unittest
from unittest.mock import patch

ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(ROOT / 'scripts/era5'))
try:
    import icechunk_metadata as m
except ModuleNotFoundError:
    m = None


class Clock:
    def __init__(self): self.now = 1000.0
    def __call__(self): return self.now


class Response:
    def __init__(self, body=b'', status=200, headers=None, delay=0, clock=None):
        self.body = body
        self.status = status
        self.headers = headers if headers is not None else [('Content-Length', str(len(body))), ('ETag', '"fixed"')]
        self.at = 0
        self.closed = False
        self.clock = clock
        self.delay = delay
    def read(self, size, timeout):
        if self.clock: self.clock.now += self.delay
        block = self.body[self.at:self.at + size]
        self.at += len(block)
        return block
    def close(self): self.closed = True


class Transport:
    def __init__(self, replies): self.replies = replies; self.calls = []
    def request(self, method, url, headers, timeout):
        self.calls.append((method, url, dict(headers), timeout))
        if not self.replies: raise AssertionError('extra request')
        return self.replies.pop(0)


class MetadataTests(unittest.TestCase):
    def test_default_cli_is_nonexecuting_without_optional_imports(self):
        self.assertIsNotNone(m, 'guarded metadata executor implementation missing')
        if m is None: return
        with patch.object(m, 'DirectTLS', side_effect=AssertionError('network constructor')):
            output = io.StringIO()
            with contextlib.redirect_stdout(output): m.main([])
        result = json.loads(output.getvalue())
        self.assertIs(result['executionEligible'], False)
        self.assertIs(result['scientificAdmission'], False)
        self.assertNotIn('icechunk', sys.modules)

    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.addCleanup(self.temp.cleanup)
        self.root = Path(self.temp.name)
        self.clock = Clock()

    def approval(self):
        packet = m.build_packet({'fixture': 'a' * 64}, issued_at=1000, expires_at=1100)
        raw = m.canonical(packet)
        (self.root / 'packet.json').write_bytes(raw)
        allowance = {'schemaVersion': 1, 'decision': 'approved-metadata-only', 'allowExecution': True,
                     'packetSha256': hashlib.sha256(raw).hexdigest(), 'outputRoot': str(self.root / 'out'),
                     'expiresAt': 1100}
        body = m.canonical(allowance)
        (self.root / 'allowance.json').write_bytes(body)
        return [self.root / 'packet.json', hashlib.sha256(raw).hexdigest(), self.root / 'allowance.json',
                hashlib.sha256(body).hexdigest(), self.root / 'out']

    @unittest.skipIf(m is None, 'implementation absent in initial red run')
    def test_approval_denials_precede_transport_and_consume_once_across_outputs(self):
        args = self.approval()
        for pos in (1, 3):
            wrong = list(args); wrong[pos] = '0' * 64
            with patch.object(m, 'current_pins', return_value={'fixture': 'a' * 64}), self.assertRaises(ValueError):
                m._validate_authority(*wrong, now=self.clock())
        with patch.object(m, 'current_pins', return_value={'fixture': 'b' * 64}), self.assertRaises(ValueError):
            m._validate_authority(*args, now=self.clock())
        with patch.object(m, 'current_pins', return_value={'fixture': 'a' * 64}):
            grant = m._validate_authority(*args, now=self.clock())
            m.claim(grant)
            with self.assertRaises(FileExistsError): m.claim(grant)
            args[4] = self.root / 'other'
            with self.assertRaises(ValueError): m._validate_authority(*args, now=self.clock())

    @unittest.skipIf(m is None, 'implementation absent in initial red run')
    def test_stale_missing_or_altered_decision_is_denied(self):
        args = self.approval()
        with patch.object(m, 'current_pins', return_value={'fixture': 'a' * 64}):
            with self.assertRaises(ValueError): m._validate_authority(*args, now=1100)
            changed = json.loads(args[2].read_bytes()); changed['decision'] = 'proposed'
            args[2].write_bytes(m.canonical(changed)); args[3] = hashlib.sha256(args[2].read_bytes()).hexdigest()
            with self.assertRaises(ValueError): m._validate_authority(*args, now=1000)
        with self.assertRaises(ValueError): m.main(['--execute'])

    @unittest.skipIf(m is None, 'implementation absent in initial red run')
    def test_authority_cannot_claim_feature_certainty_or_bypass_missing_allowance(self):
        args = self.approval()
        with patch.object(m, 'current_pins', return_value={'fixture': 'a' * 64}), \
                patch.object(m, 'DirectTLS', side_effect=AssertionError('live construction')):
            grant = m.preflight(*args, now=1000)
            self.assertFalse(grant['packet']['unsupportedFeatureExclusionProved'])
            changed = json.loads(args[0].read_bytes())
            changed['unsupportedFeatureExclusionProved'] = True
            args[0].write_bytes(m.canonical(changed)); args[1] = hashlib.sha256(args[0].read_bytes()).hexdigest()
            with self.assertRaisesRegex(ValueError, 'contract differ'):
                m.preflight(*args, now=1000)
            with self.assertRaises(ValueError): m.main(['--execute'])
        self.assertFalse((self.root / 'out').exists())

    @unittest.skipIf(m is None, 'implementation absent in initial red run')
    def test_four_request_sequence_matches_etag_and_retains_intents_and_raw_bytes(self):
        raw = b'metadata'
        replies = [Response(headers=[('Content-Length', '8'), ('ETag', '"r"')]),
                   Response(raw, headers=[('Content-Length', '8'), ('ETag', '"r"')]),
                   Response(headers=[('Content-Length', '8'), ('ETag', '"s"')]),
                   Response(raw, headers=[('Content-Length', '8'), ('ETag', '"s"')])]
        transport = Transport(replies)
        self.root.joinpath('run').mkdir()
        result = m.acquire(self.root / 'run', transport, lambda body, root: '1CECHNKREP0F1RSTCMT0',
                           lambda sid, body, root: {'scientificAdmission': False},
                           deadline=1120, clock=self.clock)
        self.assertFalse(result['scientificAdmission'])
        self.assertEqual([(c[0], c[1], c[2].get('If-Match')) for c in transport.calls], [
            ('HEAD', m.REPO_URL, None), ('GET', m.REPO_URL, '"r"'),
            ('HEAD', m.BASE_URL + '/snapshots/1CECHNKREP0F1RSTCMT0', None),
            ('GET', m.BASE_URL + '/snapshots/1CECHNKREP0F1RSTCMT0', '"s"')])
        self.assertEqual((self.root / 'run/raw/repo').read_bytes(), raw)
        events = [json.loads(line) for line in (self.root / 'run/receipts.jsonl').read_bytes().splitlines()]
        self.assertEqual(sum(e['event'] == 'intent' for e in events), 4)
        self.assertEqual(sum(e['event'] == 'response' for e in events), 4)
        self.assertEqual(events[-1]['receivedBodyBytes'], 8)

    @unittest.skipIf(m is None, 'implementation absent in initial red run')
    def test_invalid_headers_status_encoding_and_lengths_stop_without_fallback(self):
        cases = [Response(status=302), Response(status=404, body=b'error'),
                 Response(headers=[('ETag', '"x"')]),
                 Response(headers=[('Content-Length', '1'), ('Content-Length', '1'), ('ETag', '"x"')]),
                 Response(headers=[('Content-Length', '1'), ('ETag', 'W/"x"')]),
                 Response(headers=[('Content-Length', '1'), ('ETag', '"x"'), ('Content-Encoding', 'gzip')]),
                 Response(headers=[('Content-Length', '1048577'), ('ETag', '"x"')]),
                 Response(headers=[('Content-Length', '1'), ('ETag', '"x"'), ('X-Long', 'a' * 32768)]),
                 Response(headers=[('Content-Length', '1'), ('ETag', '"x\r\nx"')]),
                 Response(headers=[('Content-Length', '1'), ('ETag', '"x"'), ('Transfer-Encoding', 'chunked')])]
        for n, reply in enumerate(cases):
            folder = self.root / str(n); folder.mkdir()
            transport = Transport([reply])
            with self.subTest(n=n), self.assertRaises(ValueError):
                m.acquire(folder, transport, lambda *_: '1CECHNKREP0F1RSTCMT0', lambda *_: {},
                          deadline=1120, clock=self.clock)
            self.assertEqual(len(transport.calls), 1)
            self.assertTrue(reply.closed)

    @unittest.skipIf(m is None, 'implementation absent in initial red run')
    def test_get_truncation_overflow_etag_change_and_slow_reader_stop(self):
        for n, reply in enumerate((Response(b'x'), Response(b'xxx'),
                Response(b'xx', headers=[('Content-Length', '2'), ('ETag', '"changed"')]),
                Response(b'xx', delay=31, clock=self.clock))):
            self.clock.now = 1000
            if n in (0, 1, 3): reply.headers = [('Content-Length', '2'), ('ETag', '"fixed"')]
            folder = self.root / str(n); folder.mkdir()
            transport = Transport([Response(headers=[('Content-Length', '2'), ('ETag', '"fixed"')]), reply])
            with self.subTest(n=n), self.assertRaises(ValueError):
                m.acquire(folder, transport, lambda *_: '1CECHNKREP0F1RSTCMT0', lambda *_: {},
                          deadline=1120, clock=self.clock)
            self.assertEqual(len(transport.calls), 2)

    def test_wire_header_reader_rejects_bare_lf_obsolete_folding_and_oversize_before_parse(self):
        for raw in (b'HTTP/1.1 200 OK\n', b'HTTP/1.1 200 OK\r\n folded: bad\r\n',
                    b'HTTP/1.1 200 OK\r\nX: ' + b'a' * 32768 + b'\r\n'):
            reader = m._HeaderReader(io.BytesIO(raw))
            with self.subTest(raw=raw[:35]), self.assertRaises(ValueError):
                while reader.readline(): pass

    def test_shared_aggregate_budget_is_exact_and_invalid_snapshot_stops_after_repo(self):
        body = b'x' * 1048576
        replies = []
        for _ in range(2):
            replies.extend((Response(headers=[('Content-Length', '1048576'), ('ETag', '"x"')]),
                            Response(body, headers=[('Content-Length', '1048576'), ('ETag', '"x"')])))
        folder = self.root / 'exact'; folder.mkdir()
        result = m.acquire(folder, Transport(replies), lambda *_: '1CECHNKREP0F1RSTCMT0',
                           lambda *_: {}, deadline=1120, clock=self.clock)
        self.assertEqual(result['receivedBodyBytes'], 2097152)
        folder = self.root / 'bad'; folder.mkdir()
        transport = Transport([Response(headers=[('Content-Length', '1'), ('ETag', '"x"')]),
                               Response(b'x', headers=[('Content-Length', '1'), ('ETag', '"x"')])])
        with self.assertRaises(ValueError):
            m.acquire(folder, transport, lambda *_: '../escape', lambda *_: {}, deadline=1120, clock=self.clock)
        self.assertEqual(len(transport.calls), 2)

    def test_parser_time_and_supervisor_memory_operation_and_shared_deadlines_are_enforced(self):
        folder = self.root / 'parse'; folder.mkdir()
        def slow(*_): self.clock.now += 16; return '1CECHNKREP0F1RSTCMT0'
        transport = Transport([Response(headers=[('Content-Length', '1'), ('ETag', '"x"')]),
                               Response(b'x', headers=[('Content-Length', '1'), ('ETag', '"x"')])])
        with self.assertRaises(ValueError):
            m.acquire(folder, transport, slow, lambda *_: {}, deadline=1120, clock=self.clock)
        self.assertEqual(len(transport.calls), 2)
        class Child:
            returncode = None
            def poll(self): return None
        for kind in ('rss', 'shared', 'operation'):
            self.clock.now = 1000
            phase_path = self.root / 'phase.json'
            if phase_path.exists(): phase_path.unlink()
            if kind == 'operation': m.phase(self.root, 'parse-repo', 999)
            with self.subTest(kind=kind), self.assertRaises(ValueError):
                m.monitor_worker(Child(), self.root, 999 if kind == 'shared' else 1120,
                                 lambda _: 268435457 if kind == 'rss' else 0,
                                 clock=self.clock, sleep=lambda _: None)

    def test_worker_cannot_bypass_containment_or_readiness(self):
        with patch.object(m, 'DirectTLS', side_effect=AssertionError('network constructor')):
            with self.assertRaises(ValueError): m.worker('missing', 'a' * 64, 'missing', 'b' * 64, self.root / 'out')
        with self.assertRaises(ValueError): m.DirectTLS()

    def test_exited_worker_peak_rss_is_checked_before_success(self):
        class ExitedChild:
            returncode = 0
            def poll(self): return 0
        with self.assertRaisesRegex(ValueError, 'RSS limit'):
            m.monitor_worker(ExitedChild(), self.root, 1120, lambda _: 268435457,
                             clock=self.clock, sleep=lambda _: None)


if __name__ == '__main__': unittest.main()
