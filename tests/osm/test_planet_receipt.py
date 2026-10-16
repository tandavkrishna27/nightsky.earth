import copy
from email.message import Message
import hashlib
from io import BytesIO
from contextlib import redirect_stdout, redirect_stderr
import json
import os
from pathlib import Path
import subprocess
import sys
import tempfile
import unittest
from unittest.mock import patch

sys.path.insert(0, str(Path(__file__).resolve().parents[2]/'scripts/osm'))
import planet_receipt as receipt


class Reply(BytesIO):
    def __init__(self, body, source, **changes):
        super().__init__(body)
        self.status = changes.pop('status', 200)
        self.headers = Message()
        for key, value in {'Content-Length': str(source['bytes']),
                           'ETag': source['etag'], 'x-amz-version-id': source['versionId'],
                           'Last-Modified': receipt.LAST_MODIFIED_HTTP, **changes}.items():
            if value is not None:
                self.headers[key] = value
        self.read_sizes = []

    def read(self, size=-1):
        self.read_sizes.append(size)
        return super().read(size)


class PlanetReceiptTests(unittest.TestCase):
    def allowance(self, folder):
        return dict(schemaVersion=1, action='receive-one-exact-planet',
                    source=copy.deepcopy(receipt.SOURCE), limits=dict(receipt.LIMITS),
                    attemptRoot=str(Path(folder)/'attempt'), retainedPaths=[],
                    operatorApprovalReference='synthetic test authorization only')

    def test_default_is_read_only_and_never_constructs_connection(self):
        with tempfile.TemporaryDirectory() as folder:
            root = Path(folder)/'attempt'
            with patch.object(receipt.http.client, 'HTTPSConnection', side_effect=AssertionError('network')):
                plan = receipt.preflight(root)
                with redirect_stdout(BytesIOText()):
                    self.assertEqual(receipt.main([str(root)]), 0)
                    self.assertEqual(receipt.main([]), 0)
            self.assertFalse(root.exists())
            self.assertEqual(plan['source']['bytes'], 95380942829)
            self.assertEqual(plan['networkRequests'], 0)
            self.assertFalse(plan['receiptAuthorized'])
            self.assertEqual(plan['sourceEvidence']['sha256Lf'], receipt.SOURCE_EVIDENCE_SHA256_LF)

    def test_exact_identity_and_explicit_bounded_allowance(self):
        with tempfile.TemporaryDirectory() as folder:
            good = self.allowance(folder)
            self.assertEqual(receipt.validate_allowance(good), good)
            for key in receipt.SOURCE:
                altered = copy.deepcopy(good)
                altered['source'][key] = 'changed'
                with self.subTest(key=key), self.assertRaises(ValueError):
                    receipt.validate_allowance(altered)
            for key, bad in [('bodyBytes', 1), ('wallSeconds', 86401),
                             ('connectSeconds', 31), ('freeBytes', receipt.RESERVE_BYTES-1),
                             ('evidenceBytes', 1), ('commitBytes', 4*1024**3+1),
                             ('rssBytes', True), ('maxProcesses', 2)]:
                altered = copy.deepcopy(good)
                altered['limits'][key] = bad
                with self.subTest(key=key), self.assertRaises(ValueError):
                    receipt.validate_allowance(altered)
            for key in ('action', 'operatorApprovalReference'):
                altered = copy.deepcopy(good)
                altered[key] = ''
                with self.assertRaises(ValueError):
                    receipt.validate_allowance(altered)

    def test_allowance_digest_duplicates_and_size(self):
        with tempfile.TemporaryDirectory() as folder:
            path = Path(folder)/'allowance.json'
            body = receipt.canonical(self.allowance(folder)).encode()
            path.write_bytes(body)
            digest = hashlib.sha256(body).hexdigest()
            self.assertEqual(receipt.load_allowance(path, digest)['source'], receipt.SOURCE)
            with self.assertRaisesRegex(ValueError, 'digest'):
                receipt.load_allowance(path, '0'*64)
            body = b'{"action":1,"action":2}'
            path.write_bytes(body)
            with self.assertRaisesRegex(ValueError, 'duplicate'):
                receipt.load_allowance(path, hashlib.sha256(body).hexdigest())
            body = b' '*65537
            path.write_bytes(body)
            with self.assertRaisesRegex(ValueError, 'size'):
                receipt.load_allowance(path, hashlib.sha256(body).hexdigest())

    def test_no_second_attempt_or_overlapping_retained_paths(self):
        with tempfile.TemporaryDirectory() as folder:
            value = self.allowance(folder)
            root = Path(value['attemptRoot'])
            root.mkdir()
            (root/'failed.partial').write_bytes(b'keep')
            self.assertIn('attempt-root-already-exists', receipt.preflight(root)['gates'][0])
            value['retainedPaths'] = [str(root)]
            with self.assertRaisesRegex(ValueError, 'overlapping'):
                receipt.preflight(root, value)
            value['retainedPaths'] = [folder, str(root)]
            with self.assertRaisesRegex(ValueError, 'overlapping'):
                receipt.preflight(root, value)
            self.assertEqual((root/'failed.partial').read_bytes(), b'keep')

    def test_capacity_requires_full_raw_plus_evidence_and_reserve(self):
        with tempfile.TemporaryDirectory() as folder:
            from types import SimpleNamespace
            need = receipt.RESERVE_BYTES+receipt.SOURCE['bytes']+receipt.EVIDENCE_BYTES
            with patch.object(receipt.shutil, 'disk_usage', return_value=SimpleNamespace(free=need-1)):
                self.assertIn('insufficient-live-free-disk', receipt.preflight(Path(folder)/'attempt')['gates'][0])

    def tiny_source(self, body=b'abc'):
        # Only the internal stream primitive accepts synthetic sizes. Public
        # allowance/receive entry points continue to require the 95 GB identity.
        return {**receipt.SOURCE, 'bytes': len(body),
                'md5': hashlib.md5(body, usedforsecurity=False).hexdigest()}

    def stream(self, folder, reply, source, check=lambda: None):
        path = Path(folder)/'partial'
        with path.open('xb') as output:
            result = receipt._stream_reply(reply, output, source, check)
        return result

    def test_tiny_stream_hashes_and_never_overreads(self):
        source = self.tiny_source()
        reply = Reply(b'abcUNAUTHORIZED-EXTRA', source)
        with tempfile.TemporaryDirectory() as folder:
            result = self.stream(folder, reply, source)
            self.assertEqual((Path(folder)/'partial').read_bytes(), b'abc')
        self.assertEqual(reply.read_sizes, [3])
        self.assertEqual(reply.tell(), 3)
        self.assertEqual(result['sha256'], hashlib.sha256(b'abc').hexdigest())
        self.assertEqual(result['md5'], source['md5'])

    def test_response_identity_and_framing_fail_before_body(self):
        source = self.tiny_source()
        cases = [{'status': 302}, {'status': 206}, {'Content-Length': '03'},
                 {'Content-Length': '4'}, {'ETag': 'changed'},
                 {'x-amz-version-id': 'changed'}, {'Last-Modified': 'changed'},
                 {'Content-Encoding': 'gzip'}, {'Transfer-Encoding': 'chunked'},
                 {'Content-Range': 'bytes 0-2/3'}]
        for changes in cases:
            reply = Reply(b'abc', source, **changes)
            with self.subTest(changes=changes), tempfile.TemporaryDirectory() as folder:
                with self.assertRaises(ValueError):
                    self.stream(folder, reply, source)
                self.assertEqual(reply.tell(), 0)
        for name in ('Content-Length', 'ETag', 'x-amz-version-id', 'Last-Modified', 'Content-Encoding'):
            reply = Reply(b'abc', source, **{'Content-Encoding': 'identity'})
            reply.headers[name] = reply.headers[name]
            with self.subTest(duplicate=name), self.assertRaisesRegex(ValueError, 'duplicate'):
                receipt._validate_response(reply, source)

    def test_short_body_checksum_timeout_reserve_keep_partial(self):
        source = self.tiny_source()
        for body, match in [(b'ab', 'short'), (b'bad', 'MD5')]:
            with self.subTest(body=body), tempfile.TemporaryDirectory() as folder:
                with self.assertRaisesRegex(ValueError, match):
                    self.stream(folder, Reply(body, source), source)
                self.assertEqual((Path(folder)/'partial').read_bytes(), body)
        with tempfile.TemporaryDirectory() as folder:
            def stop():
                raise TimeoutError('reserve or deadline stop')
            with self.assertRaises(TimeoutError):
                self.stream(folder, Reply(b'abc', source), source, stop)
            self.assertEqual((Path(folder)/'partial').stat().st_size, 0)

    def test_header_reader_bounds_before_unbounded_allocation(self):
        reader = receipt._HeaderReader(BytesIO(b'x'*(receipt.HEADER_BYTES+100)))
        with self.assertRaisesRegex(ValueError, 'header byte cap'):
            reader.readline(1000000)
        self.assertEqual(reader.raw.tell(), receipt.HEADER_BYTES)

    def test_header_transport_does_not_prefetch_body(self):
        body = b'abc'
        source = self.tiny_source(body)
        headers = Reply(body, source).headers
        wire = b'HTTP/1.1 200 OK\r\n'+str(headers).replace('\n', '\r\n').encode()+body
        class FakeSocket:
            def makefile(self, mode, buffering=-1):
                self.buffering = buffering
                self.file = BytesIO(wire)
                return self.file
        sock = FakeSocket()
        response = receipt._BoundedResponse(sock)
        response.begin()
        self.assertEqual(sock.buffering, 0)
        self.assertEqual(sock.file.tell(), len(wire)-len(body))
        receipt._validate_response(response, source)

    def test_failed_blocking_read_reserves_full_inflight_allowance(self):
        source = self.tiny_source()
        class BrokenReply(Reply):
            def read(self, amount):
                raise OSError('uncertain read')
        progress = {}
        with tempfile.TemporaryFile() as output:
            with self.assertRaisesRegex(OSError, 'uncertain'):
                receipt._stream_reply(BrokenReply(b'abc', source), output, source, lambda: None, progress)
        self.assertEqual(progress, dict(receivedBytesExact=None, receivedBytesUpperBound=3))

    def test_worker_rejects_late_headers_before_acceptance_or_body(self):
        reply = Reply(b'', receipt.SOURCE)
        class FakeConnection:
            def request(self, *args, **kwargs):
                pass
            def getresponse(self):
                return reply
            def close(self):
                pass
        with tempfile.TemporaryDirectory() as folder:
            with patch.object(receipt, '_require_handoff', return_value=dict(deadline=200, headerDeadline=99)):
                with patch.object(receipt.time, 'monotonic', return_value=100):
                    with patch.object(receipt.http.client, 'HTTPSConnection', return_value=FakeConnection()):
                        report = receipt._worker(folder, self.allowance(folder), '0'*64)
            self.assertEqual(report['status'], 'bounded-stop')
            self.assertIn('connection/header deadline', report['reason'])
            self.assertEqual(reply.read_sizes, [])
            self.assertFalse((Path(folder)/'response-accepted.json').exists())
            self.assertTrue((Path(folder)/'receipt-report.json').exists())

    def test_parent_rejects_late_marker_even_after_sampling_gap(self):
        with tempfile.TemporaryDirectory() as folder:
            root = Path(folder)
            receipt._write_new(root/'response-accepted.json', dict(
                source=receipt.SOURCE, status=200, headerDeadline=100,
                acceptedMonotonic=101, observedUtc=receipt.utc()))
            with self.assertRaisesRegex(TimeoutError, 'late response'):
                receipt._header_accepted(root, 100)

    def test_partial_acceptance_marker_is_pending_until_valid_complete_json(self):
        with tempfile.TemporaryDirectory() as folder:
            root = Path(folder)
            marker = root/'response-accepted.json'
            marker.write_bytes(b'{"source":')  # Concurrent exclusive publication.
            self.assertFalse(receipt._header_accepted(root, 100))
            marker.write_text(receipt.canonical(dict(source=receipt.SOURCE, status=200,
                              headerDeadline=100, acceptedMonotonic=99, observedUtc=receipt.utc())))
            self.assertTrue(receipt._header_accepted(root, 100))

    def test_inventory_checks_deadline_during_enumeration(self):
        with tempfile.TemporaryDirectory() as folder:
            root = Path(folder)
            for index in range(5):
                (root/str(index)).write_bytes(b'x')
            calls = []
            def deadline():
                calls.append(True)
                if len(calls) == 6:
                    raise TimeoutError('synthetic inventory deadline')
            with self.assertRaisesRegex(TimeoutError, 'inventory deadline'):
                receipt._inventory([root], deadline)
            self.assertEqual(len(calls), 6)

    def test_supervisor_inventory_crossing_total_deadline_is_bounded_stop(self):
        clock = [0]
        original = receipt._inventory
        calls = []
        def slow_inventory(paths, deadline_check=lambda: None):
            calls.append(True)
            if len(calls) == 2:
                clock[0] = 10  # Whole-attempt scan crossed the total deadline.
            return original(paths, deadline_check)
        with tempfile.TemporaryDirectory() as folder:
            limits = {**receipt.LIMITS, 'wallSeconds': 3, 'freeBytes': 1}
            with patch.object(receipt.time, 'monotonic', side_effect=lambda: clock[0]):
                with patch.object(receipt, '_inventory', side_effect=slow_inventory):
                    report = receipt._supervise_worker(['must-never-start'], folder, limits, [])
            self.assertEqual(report['status'], 'bounded-stop')
            self.assertIn('total receipt deadline', report['reason'])
            self.assertIsNone(report['exitCode'])
            self.assertTrue((Path(folder)/'supervisor-report.json').exists())

    def test_worker_refuses_without_containment_before_network(self):
        with tempfile.TemporaryDirectory() as folder:
            with patch.object(receipt, '_require_handoff', side_effect=RuntimeError('uncontained')):
                with patch.object(receipt.http.client, 'HTTPSConnection', side_effect=AssertionError('network')):
                    with self.assertRaisesRegex(RuntimeError, 'uncontained'):
                        receipt._worker(folder, self.allowance(folder), '0'*64)
            self.assertEqual(list(Path(folder).iterdir()), [])

    @unittest.skipUnless(os.name == 'nt', 'Windows Job enforcement')
    def test_independent_supervisor_terminates_stalled_worker_with_evidence(self):
        with tempfile.TemporaryDirectory() as folder:
            root = Path(folder)
            limits = {**receipt.LIMITS, 'connectSeconds': 1, 'wallSeconds': 3, 'freeBytes': 1}
            report = receipt._supervise_worker([sys.executable, '-c', 'import time; time.sleep(30)'], root, limits, [])
            self.assertEqual(report['status'], 'bounded-stop')
            self.assertIn('connection/header deadline', report['reason'])
            self.assertLess(report['elapsedSeconds'], 10)
            self.assertTrue((root/'termination-intent.json').exists())
            self.assertTrue((root/'supervisor-report.json').exists())

    @unittest.skipUnless(os.name == 'nt', 'Windows Job enforcement')
    def test_independent_supervisor_records_worker_failure(self):
        with tempfile.TemporaryDirectory() as folder:
            limits = {**receipt.LIMITS, 'freeBytes': 1}
            report = receipt._supervise_worker([sys.executable, '-c', 'raise SystemExit(9)'], folder, limits, [])
            self.assertEqual(report['status'], 'bounded-stop')
            self.assertEqual(report['exitCode'], 9)
            self.assertEqual(report['retainedPartialBytes'], 0)

    @unittest.skipUnless(os.name == 'nt', 'Windows Job enforcement')
    def test_exit_zero_without_transport_evidence_is_not_success(self):
        with tempfile.TemporaryDirectory() as folder:
            limits = {**receipt.LIMITS, 'freeBytes': 1}
            report = receipt._supervise_worker([sys.executable, '-c', 'pass'], folder, limits, [])
            self.assertEqual(report['status'], 'bounded-stop')
            self.assertEqual(report['exitCode'], 0)
            self.assertIn('without complete response acceptance', report['reason'])

    @unittest.skipUnless(os.name == 'nt', 'Windows Job enforcement')
    def test_real_handoff_verifies_job_and_isolated_environment_without_network(self):
        with tempfile.TemporaryDirectory() as folder:
            root = Path(folder)
            limits = {**receipt.LIMITS, 'freeBytes': 1}
            code = ("import sys,json,os;sys.path.insert(0,sys.argv[1]);import planet_receipt as p;"
                    "p._require_handoff(sys.argv[2],'0'*64,json.loads(sys.argv[3]));"
                    "assert sys.flags.isolated and sys.flags.no_site and sys.dont_write_bytecode;"
                    "assert 'PLANET_TEST_INHERITED_ENV' not in os.environ;"
                    "p._write_new(p.Path(sys.argv[2])/'handoff-verified.json',{'verified':True});"
                    "raise SystemExit(9)")
            command = [sys.executable, '-I', '-S', '-B', '-c', code,
                       str(Path(receipt.__file__).parent), str(root), json.dumps(limits)]
            with patch.dict(os.environ, {'PLANET_TEST_INHERITED_ENV': 'synthetic-value'}):
                report = receipt._supervise_worker(command, root, limits, [],
                    dict(root=str(root), allowanceSha256='0'*64))
            self.assertTrue((root/'handoff-verified.json').exists())
            self.assertEqual(report['exitCode'], 9)

    def test_actual_direct_handoff_without_pipe_refuses(self):
        code = ("import sys;sys.path.insert(0,sys.argv[1]);import planet_receipt as p;"
                "p._require_handoff(p.DEFAULT_ROOT,'0'*64,p.LIMITS)")
        process = subprocess.run([sys.executable, '-I', '-S', '-B', '-c', code,
                                  str(Path(receipt.__file__).parent)],
                                 stdin=subprocess.DEVNULL, capture_output=True, timeout=5)
        self.assertNotEqual(process.returncode, 0)
        self.assertIn(b'supervisor', process.stderr)

    @unittest.skipUnless(os.name == 'nt', 'Windows Job enforcement')
    def test_failed_termination_intent_cannot_leave_worker_alive(self):
        original = receipt._write_new
        def fail_intent(path, value):
            if Path(path).name == 'termination-intent.json':
                raise OSError('synthetic full disk')
            return original(path, value)
        with tempfile.TemporaryDirectory() as folder:
            limits = {**receipt.LIMITS, 'connectSeconds': 1, 'wallSeconds': 3, 'freeBytes': 1}
            with patch.object(receipt, '_write_new', side_effect=fail_intent):
                report = receipt._supervise_worker([sys.executable, '-c', 'import time; time.sleep(30)'], folder, limits, [])
            self.assertEqual(report['status'], 'bounded-stop')
            self.assertIsNotNone(report['exitCode'])
            self.assertLess(report['elapsedSeconds'], 10)

    def test_cli_requires_explicit_allowance_and_unsupported_worker_refuses(self):
        with tempfile.TemporaryDirectory() as folder:
            root = Path(folder)/'attempt'
            with redirect_stderr(BytesIOText()):
                with self.assertRaises(SystemExit):
                    receipt.main([str(root), '--receive'])
                with self.assertRaises(SystemExit):
                    receipt.main([str(root), '--allowance', 'missing'])
            self.assertFalse(root.exists())


class BytesIOText:
    def write(self, value):
        return len(value)

    def flush(self):
        pass


if __name__ == '__main__':
    unittest.main()
