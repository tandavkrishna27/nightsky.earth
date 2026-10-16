"""Bounded anonymous Icechunk metadata preparation; default CLI is offline.

Live requests require a fresh operator-pinned packet/allowance and verified
Windows Job supervision. Interpretation is limited to Icechunk2.3.0 metadata;
unknown-feature exclusion and scientific admission remain unproved. Never
invoke --execute as a readiness check.
"""
import argparse
import ctypes
from ctypes import wintypes
import hashlib
import http.client
import json
import math
import os
from pathlib import Path
import re
import ssl
import subprocess
import sys
import time

import icechunk_offline as offline

ROOT = Path(__file__).resolve().parents[2]
BASE_URL = 'https://earthmover-icechunk-era5.s3.us-east-1.amazonaws.com/icechunkV2'
REPO_URL = BASE_URL + '/repo'
HOST = 'earthmover-icechunk-era5.s3.us-east-1.amazonaws.com'
LIMITS = dict(requests=4, objectBytes=1048576, aggregateBodyBytes=2097152,
              headerBytes=32768, httpSeconds=30, parseSeconds=15, wallSeconds=120,
              rssBytes=268435456, jobCommitBytes=536870912, activeProcesses=2,
              expandedBytes=16777216, redirects=0, retries=0)
INTERPRETATION_LIMITATIONS = ('official-api-does-not-expose-unknown-feature-flags-or-reserved-extensions',)


def canonical(value):
    return json.dumps(value, sort_keys=True, separators=(',', ':'), allow_nan=False).encode('utf-8')


def hash_file(path):
    result = hashlib.sha256()
    with offline.safe_path(path).open('rb') as stream:
        while block := stream.read(65536): result.update(block)
    return result.hexdigest()


def tree_pin(root, *, skip_site=False):
    root = offline.safe_path(root)
    if not root.is_dir(): raise ValueError('Pinned dependency/runtime directory absent')
    rows = []
    for path in sorted(root.rglob('*')):
        relative = path.relative_to(root)
        if '__pycache__' in relative.parts or (skip_site and 'site-packages' in relative.parts): continue
        offline.safe_path(path)
        if path.is_file(): rows.append((relative.as_posix(), path.stat().st_size, hash_file(path)))
    return offline.digest(canonical(rows))


def current_pins():
    """Read code/runtime bytes only; do not import parser or read user config."""
    target = ROOT / '.data/icechunk-metadata-deps'
    lane = ROOT / '.data/weather-py314/Lib/site-packages'
    base = Path(sys.base_prefix)
    if sys.version_info[:3] != (3, 14, 3): raise ValueError('Approved Python 3.14.3 required')
    code_paths = ('scripts/era5/icechunk_metadata.py', 'scripts/era5/icechunk_offline.py',
                  'scripts/osm/global_source_supervisor.py', 'scripts/osm/global_source.py',
                  'scripts/osm/spot_paths.py')
    reused = [*sorted(lane.glob('numpy*')), lane / 'typing_extensions.py',
              *sorted(lane.glob('typing_extensions-*.dist-info'))]
    if len(reused) < 4: raise ValueError('Approved reused dependencies absent')
    return dict(code={name: hash_file(ROOT / name) for name in code_paths},
                pythonVersion=sys.version, executable=hash_file(sys._base_executable),
                pythonDll=hash_file(base / 'python314.dll'), stableDll=hash_file(base / 'python3.dll'),
                stdlib=tree_pin(base / 'Lib', skip_site=True), nativeStdlib=tree_pin(base / 'DLLs'),
                dependencies=tree_pin(target),
                reused={p.name: tree_pin(p) if p.is_dir() else hash_file(p) for p in reused},
                dependencyRoot=str(target), laneRoot=str(lane), baseRoot=str(base))


def build_packet(pins, *, issued_at, expires_at):
    return dict(schemaVersion=1, purpose='icechunk-fixed-metadata-only',
                executionEligible=False, scientificAdmission=False, pins=pins,
                issuedAt=issued_at, expiresAt=expires_at, limits=LIMITS,
                repoUrl=REPO_URL, snapshotUrlTemplate=BASE_URL + '/snapshots/{ID}',
                descriptors=list(offline.DESCRIPTORS), branch='main',
                format='Icechunk-2.x-official-2.3.0', scientificReads=0,
                unsupportedFeatureExclusionProved=False,
                interpretation='bounded-observational-metadata-as-interpreted-by-icechunk-2.3.0',
                interpretationLimitations=list(INTERPRETATION_LIMITATIONS))


def pinned_json(path, expected_sha256, limit=1048576):
    if not isinstance(expected_sha256, str) or not re.fullmatch('[0-9a-f]{64}', expected_sha256):
        raise ValueError('Trusted operator-supplied byte hash required')
    path = offline.safe_path(path)
    with path.open('rb') as stream: raw = stream.read(limit + 1)
    if len(raw) > limit or offline.digest(raw) != expected_sha256: raise ValueError('Pinned control bytes differ')
    return offline.strict_json(raw, byte_limit=limit)


def _validate_authority(packet_path, packet_sha, allowance_path, allowance_sha, output, *, now=None):
    now = time.time() if now is None else now
    packet = pinned_json(packet_path, packet_sha)
    if not isinstance(packet, dict): raise ValueError('Packet must be an object')
    issued = packet.get('issuedAt'); expires = packet.get('expiresAt')
    if (type(issued) not in (int, float) or type(expires) not in (int, float)
            or not math.isfinite(issued) or not math.isfinite(expires)
            or not issued <= now < expires or not 0 < expires - issued <= 3600):
        raise ValueError('Fresh packet with at most one-hour validity required')
    pins = current_pins()
    if packet != build_packet(pins, issued_at=issued, expires_at=expires):
        raise ValueError('Packet code/runtime/dependency pins or contract differ')
    output = offline.safe_path(output)
    allowance = pinned_json(allowance_path, allowance_sha, 65536)
    if not isinstance(allowance, dict): raise ValueError('Allowance must be an object')
    end = allowance.get('expiresAt')
    expected = dict(schemaVersion=1, decision='approved-metadata-only', allowExecution=True,
                    packetSha256=packet_sha, outputRoot=str(output), expiresAt=end)
    if (allowance != expected or type(end) not in (int, float) or not math.isfinite(end)
            or not now < end <= expires):
        raise ValueError('Explicit approved allowance must byte-bind packet and output')
    if output.exists(): raise ValueError('Fresh nonexistent output root required')
    claim_path = output.parent / '.icechunk-allowance-claims' / (allowance_sha + '.json')
    if claim_path.exists(): raise FileExistsError('Allowance consumed; independent review required')
    return dict(packet=packet, packetSha256=packet_sha, allowanceSha256=allowance_sha,
                allowancePath=str(offline.safe_path(allowance_path)), outputRoot=str(output),
                claimPath=str(claim_path))


def preflight(*args, **kwargs):
    return _validate_authority(*args, **kwargs)


def claim(grant):
    root = offline.safe_path(grant['outputRoot'])
    claim_path = offline.safe_path(grant['claimPath'])
    claim_path.parent.mkdir(exist_ok=True)
    offline.write_exclusive(claim_path, canonical(dict(grant, phase='execution-uncertain')))
    root.mkdir()
    offline.write_exclusive(root / 'authorization.json', canonical(grant))


def append_event(root, event):
    with offline.safe_path(Path(root) / 'receipts.jsonl').open('ab') as stream:
        stream.write(canonical(event) + b'\n'); stream.flush(); os.fsync(stream.fileno())


def phase(root, name, deadline):
    pending = Path(root) / 'phase.pending'
    offline.write_exclusive(pending, canonical(dict(phase=name, deadlineMonotonic=deadline)))
    os.replace(pending, Path(root) / 'phase.json')


def checked_headers(pairs):
    result = {}
    count = 2
    for name, value in pairs:
        if (not isinstance(name, str) or not re.fullmatch("[!#$%&'*+.^_`|~0-9A-Za-z-]+", name)
                or not isinstance(value, str) or any(ord(ch) < 32 or ord(ch) == 127 for ch in value)):
            raise ValueError('Malformed response header')
        count += len(name.encode('latin1')) + len(value.encode('latin1')) + 4
        if count > LIMITS['headerBytes']: raise ValueError('Response header byte limit')
        key = name.lower()
        if key in result: raise ValueError('Duplicate/conflicting response header')
        result[key] = value
    if result.get('content-encoding', 'identity').lower() != 'identity' or 'transfer-encoding' in result:
        raise ValueError('Only declared identity encoding is supported')
    text = result.get('content-length', '')
    if not re.fullmatch('0|[1-9][0-9]{0,9}', text): raise ValueError('Declared Content-Length required')
    length = int(text)
    if not 0 < length <= LIMITS['objectBytes']: raise ValueError('Object declared byte limit')
    etag = result.get('etag', '')
    if not re.fullmatch('"[!#-~]{1,256}"', etag): raise ValueError('Strong bounded ETag required')
    return result, length, etag


def acquire(root, transport, resolve_repo, inspect_snapshot, *, deadline, clock=time.monotonic):
    """Real serial state machine; transport and local parser are I/O boundaries.

    The live caller supplies an external supervisor watching phase deadlines.
    No retries or fallback objects are defined. Every request has a durable intent.
    """
    root = offline.safe_path(root)
    (root / 'raw').mkdir()
    received = requests = 0
    def gate(end):
        remaining = min(deadline, end) - clock()
        if remaining <= 0: raise ValueError('Original shared/operation deadline exceeded')
        return min(30, remaining)
    def request(method, url, expected=None):
        nonlocal received, requests
        if requests >= 4: raise ValueError('Request allowance exhausted')
        if url != REPO_URL:
            if not url.startswith(BASE_URL + '/snapshots/'): raise ValueError('Unapproved metadata URL')
            offline.snapshot_id(url.removeprefix(BASE_URL + '/snapshots/'))
        end = min(deadline, clock() + 30)
        timeout = gate(end)
        phase(root, 'http', end)
        requests += 1
        append_event(root, dict(event='intent', request=requests, method=method, url=url,
                               at=time.time(), deadlineMonotonic=end))
        headers = {'Accept-Encoding': 'identity'}
        if expected: headers['If-Match'] = expected[1]
        reply = None
        body = bytearray()
        header_pairs = []
        try:
            reply = transport.request(method, url, headers, timeout)
            gate(end)
            header_pairs = list(reply.headers)
            parsed, length, etag = checked_headers(header_pairs)
            if reply.status != 200: raise ValueError('Unexpected HTTP status; no redirects or retries')
            if expected and (length, etag) != expected: raise ValueError('HEAD/GET length or ETag changed')
            if method == 'GET':
                while True:
                    allowed = min(LIMITS['objectBytes'] - len(body), LIMITS['aggregateBodyBytes'] - received)
                    # Respect both received-byte budgets. The HTTP response's
                    # declared-length framing completes exactly at Content-Length;
                    # no unbudgeted sentinel read is used at the hard cap.
                    block = reply.read(min(65536, max(0, allowed), length + 1 - len(body)), gate(end))
                    received += len(block)
                    body.extend(block)
                    gate(end)
                    if received > LIMITS['aggregateBodyBytes'] or len(body) > length:
                        raise ValueError('Received body byte budget/declared length exceeded')
                    if not block: break
                if len(body) != length: raise ValueError('Truncated metadata object')
            append_event(root, dict(event='response', request=requests, status=reply.status,
                headers=header_pairs, declaredLength=length, etag=etag, receivedBodyBytes=len(body),
                aggregateBodyBytes=received, sha256=offline.digest(body), at=time.time()))
            return (length, etag), bytes(body)
        except Exception as exc:
            append_event(root, dict(event='stopped', request=requests,
                status=getattr(reply, 'status', None), receivedBodyBytes=len(body),
                aggregateBodyBytes=received, sha256=offline.digest(body), at=time.time(),
                reason=type(exc).__name__, scientificAdmission=False))
            raise
        finally:
            if reply is not None: reply.close()
    def get_object(url, key):
        expected, _ = request('HEAD', url)
        _, body = request('GET', url, expected)
        path = root / 'raw' / key
        if '/' in key: path.parent.mkdir()
        offline.write_exclusive(path, body)
        return body
    repo = get_object(REPO_URL, 'repo')
    parse_end = min(deadline, clock() + 15)
    phase(root, 'parse-repo', parse_end); gate(parse_end)
    sid = offline.snapshot_id(resolve_repo(repo, root))
    gate(parse_end)
    snapshot = get_object(BASE_URL + '/snapshots/' + sid, 'snapshots/' + sid)
    parse_end = min(deadline, clock() + 15)
    phase(root, 'parse-snapshot', parse_end); gate(parse_end)
    result = inspect_snapshot(sid, snapshot, root)
    gate(parse_end)
    result['scientificAdmission'] = False
    result['receivedBodyBytes'] = received
    offline.write_exclusive(root / 'metadata-evidence.json', canonical(result))
    phase(root, 'complete', deadline)
    return result


class _HeaderReader:
    def __init__(self, stream): self.stream = stream; self.bytes = 0; self.done = False
    def readline(self, size=-1):
        if self.done: return self.stream.readline(size)
        remaining = LIMITS['headerBytes'] - self.bytes
        value = self.stream.readline(min(size if size >= 0 else remaining + 1, remaining + 1))
        self.bytes += len(value)
        if self.bytes > LIMITS['headerBytes']: raise ValueError('Wire header byte limit')
        if value and (not value.endswith(b'\r\n') or value.startswith((b' ', b'\t'))):
            raise ValueError('Malformed/folded wire header line')
        if value == b'\r\n': self.done = True
        return value
    def __getattr__(self, name): return getattr(self.stream, name)


class _CappedResponse(http.client.HTTPResponse):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.fp = _HeaderReader(self.fp)
    def _read_status(self):
        status = super()._read_status()
        if status[1] == 100: raise ValueError('Interim HTTP responses unsupported')
        return status


class DirectTLS:
    """Direct stdlib TLS, no SDK, requests, proxy, netrc or credential chain."""
    def __init__(self):
        require_containment()
    def request(self, method, url, headers, timeout):
        require_containment()
        if method not in ('HEAD', 'GET'): raise ValueError('Unsupported HTTP method')
        if url != REPO_URL:
            offline.snapshot_id(url.removeprefix(BASE_URL + '/snapshots/'))
            if url != BASE_URL + '/snapshots/' + url.rsplit('/', 1)[1]: raise ValueError('Unapproved URL')
        connection = http.client.HTTPSConnection(HOST, timeout=timeout, context=ssl.create_default_context())
        connection.response_class = _CappedResponse
        try:
            connection.request(method, url.removeprefix('https://' + HOST), headers=headers)
            response = connection.getresponse()
        except BaseException:
            connection.close(); raise
        class Reply:
            status = response.status
            headers = response.getheaders()
            def read(self, size, timeout):
                if connection.sock is not None: connection.sock.settimeout(timeout)
                return response.read1(size)
            def close(self): response.close(); connection.close()
        return Reply()


def require_containment():
    """Query actual current Job limits; no argument/env marker establishes them."""
    if os.name != 'nt': raise ValueError('Windows Job required')
    class Basic(ctypes.Structure):
        _fields_ = [('processTime', ctypes.c_int64), ('jobTime', ctypes.c_int64),
                    ('flags', wintypes.DWORD), ('minimum', ctypes.c_size_t),
                    ('maximum', ctypes.c_size_t), ('active', wintypes.DWORD),
                    ('affinity', ctypes.c_size_t), ('priority', wintypes.DWORD),
                    ('scheduling', wintypes.DWORD)]
    class IO(ctypes.Structure):
        _fields_ = [(name, ctypes.c_uint64) for name in
                    ('readOps', 'writeOps', 'otherOps', 'readBytes', 'writeBytes', 'otherBytes')]
    class Extended(ctypes.Structure):
        _fields_ = [('basic', Basic), ('io', IO), ('processMemory', ctypes.c_size_t),
                    ('jobMemory', ctypes.c_size_t), ('peakProcessMemory', ctypes.c_size_t),
                    ('peakJobMemory', ctypes.c_size_t)]
    kernel = ctypes.WinDLL('kernel32', use_last_error=True)
    kernel.QueryInformationJobObject.argtypes = [wintypes.HANDLE, ctypes.c_int, ctypes.c_void_p,
                                                wintypes.DWORD, ctypes.c_void_p]
    limits = Extended()
    if not kernel.QueryInformationJobObject(None, 9, ctypes.byref(limits), ctypes.sizeof(limits), None):
        raise ValueError('Actual containment Job cannot be verified')
    if (limits.basic.flags & 0x2208 != 0x2208 or limits.basic.active != 2
            or not 0 < limits.jobMemory <= LIMITS['jobCommitBytes']
            or limits.basic.flags & (0x800 | 0x1000)):
        raise ValueError('Containment Job limits rejected')


def require_handoff(packet_sha):
    """OS-owned stdin pipe proves a live supervisor; shared deadline cannot reset."""
    if os.name != 'nt': raise ValueError('Windows supervisor required')
    import msvcrt
    try: handle = msvcrt.get_osfhandle(sys.stdin.fileno())
    except (OSError, ValueError): raise ValueError('Supervisor pipe required') from None
    kernel = ctypes.WinDLL('kernel32', use_last_error=True)
    kernel.GetNamedPipeServerProcessId.argtypes = [wintypes.HANDLE, ctypes.POINTER(wintypes.ULONG)]
    parent = wintypes.ULONG()
    if (not kernel.GetNamedPipeServerProcessId(wintypes.HANDLE(handle), ctypes.byref(parent))
            or parent.value != os.getppid()): raise ValueError('Supervisor-owned pipe required')
    value = offline.strict_json(sys.stdin.buffer.read(4097), byte_limit=4096)
    if (not isinstance(value, dict) or set(value) != {'parentPid', 'packetSha256', 'deadline'}
            or value['parentPid'] != parent.value or value['packetSha256'] != packet_sha
            or type(value['deadline']) not in (int, float) or not math.isfinite(value['deadline'])
            or not 0 < value['deadline'] - time.monotonic() <= 120):
        raise ValueError('Supervisor handoff identity/deadline rejected')
    kernel.OpenProcess.argtypes = [wintypes.DWORD, wintypes.BOOL, wintypes.DWORD]
    kernel.OpenProcess.restype = wintypes.HANDLE
    kernel.WaitForSingleObject.argtypes = [wintypes.HANDLE, wintypes.DWORD]
    kernel.CloseHandle.argtypes = [wintypes.HANDLE]
    process = kernel.OpenProcess(0x100000, False, parent.value)
    if not process: raise ValueError('Supervisor parent unavailable')
    try:
        if kernel.WaitForSingleObject(process, 0) != 258: raise ValueError('Supervisor parent exited')
    finally: kernel.CloseHandle(process)
    return value['deadline']


def sanitized_environment(root):
    """Allowlist native system rooting only, dedicated config/temp, fixed threads."""
    temp = offline.safe_path(Path(root) / 'private')
    temp.mkdir()
    return dict(SYSTEMROOT=os.environ['SYSTEMROOT'], WINDIR=os.environ['SYSTEMROOT'],
                TEMP=str(temp), TMP=str(temp), TMPDIR=str(temp), HOME=str(temp), USERPROFILE=str(temp),
                APPDATA=str(temp), LOCALAPPDATA=str(temp), XDG_CONFIG_HOME=str(temp),
                OPENBLAS_NUM_THREADS='1', OMP_NUM_THREADS='1', MKL_NUM_THREADS='1',
                NUMEXPR_NUM_THREADS='1', RAYON_NUM_THREADS='1', TOKIO_WORKER_THREADS='1',
                ZARR_CONFIG='{}')


def worker(packet_path, packet_sha, allowance_path, allowance_sha, output):
    require_containment()
    deadline = require_handoff(packet_sha)
    # Revalidate byte pins after launch, without treating existing output as new authority.
    root = offline.safe_path(output)
    grant = pinned_json(root / 'authorization.json', hash_file(root / 'authorization.json'))
    expected = dict(grant, phase='execution-uncertain')
    if offline.strict_json(offline.safe_path(grant['claimPath']).read_bytes()) != expected:
        raise ValueError('Permanent consumed allowance receipt differs')
    packet = pinned_json(packet_path, packet_sha)
    allowance = pinned_json(allowance_path, allowance_sha, 65536)
    now = time.time()
    if (packet != build_packet(current_pins(), issued_at=packet['issuedAt'], expires_at=packet['expiresAt'])
            or not packet['issuedAt'] <= now < min(packet['expiresAt'], allowance['expiresAt'])
            or allowance != dict(schemaVersion=1, decision='approved-metadata-only', allowExecution=True,
                packetSha256=packet_sha, outputRoot=str(root), expiresAt=allowance['expiresAt'])
            or grant['packetSha256'] != packet_sha or grant['allowanceSha256'] != allowance_sha
            or grant['outputRoot'] != str(root)):
        raise ValueError('Worker code/runtime/packet/allowance identity differs')
    sys.path.extend([str(ROOT / '.data/icechunk-metadata-deps'),
                     str(ROOT / '.data/weather-py314/Lib/site-packages')])
    local = None
    def resolve(raw, folder):
        nonlocal local
        local = offline.OfflineRepository(folder / 'quarantine', raw, offline.digest(raw), len(raw))
        return local.resolve_main()
    def inspect(sid, raw, folder):
        return local.inspect_snapshot(sid, raw, offline.digest(raw), len(raw))
    return acquire(root, DirectTLS(), resolve, inspect, deadline=deadline)


def monitor_worker(child, root, deadline, rss, *, clock=time.monotonic, sleep=time.sleep):
    while child.poll() is None:
        now = clock()
        if now >= deadline: raise ValueError('Whole-operation deadline exceeded')
        phase_path = Path(root) / 'phase.json'
        if phase_path.exists():
            state = offline.strict_json(phase_path.read_bytes(), byte_limit=4096)
            if now >= state['deadlineMonotonic']: raise ValueError('HTTP/parse operation deadline exceeded')
        if rss(child) > LIMITS['rssBytes']: raise ValueError('Worker RSS limit exceeded')
        sleep(.02)
    # The retained Windows process handle exposes peak working set after exit;
    # a short-lived worker must not escape admission between running samples.
    if rss(child) > LIMITS['rssBytes']: raise ValueError('Worker RSS limit exceeded')
    if clock() >= deadline or child.returncode: raise ValueError('Contained worker stopped; review receipts')


def supervise(packet_path, packet_sha, allowance_path, allowance_sha, output):
    began = time.monotonic()
    grant = preflight(packet_path, packet_sha, allowance_path, allowance_sha, output)
    if os.name != 'nt': raise ValueError('Windows Job required; no live fallback')
    sys.path.insert(0, str(ROOT / 'scripts/osm'))
    from global_source_supervisor import WindowsJob, rss_bytes
    deadline = began + 120
    if time.monotonic() >= deadline: raise ValueError('Preflight exhausted shared deadline')
    claim(grant)
    root = offline.safe_path(output)
    environment = sanitized_environment(root)
    job = WindowsJob(LIMITS['jobCommitBytes'], LIMITS['activeProcesses'])
    child = None
    try:
        boot = ('import sys;sys.path.insert(0,sys.argv.pop(1));'
                'import icechunk_metadata;icechunk_metadata.main(sys.argv[1:])')
        argv = [sys._base_executable, '-I', '-S', '-B', '-c', boot, str(ROOT / 'scripts/era5'),
                '--worker', '--packet', str(offline.safe_path(packet_path)),
                '--expected-packet-sha256', packet_sha, '--allowance', str(offline.safe_path(allowance_path)),
                '--expected-allowance-sha256', allowance_sha, '--output', str(root)]
        with (root / 'worker.log').open('xb') as log:
            child = subprocess.Popen(argv, env=environment, cwd=root, stdout=log, stderr=log,
                                     stdin=subprocess.PIPE, creationflags=4)
            job.assign_resume(child)
            child.stdin.write(canonical(dict(parentPid=os.getpid(), packetSha256=packet_sha, deadline=deadline)))
            child.stdin.close()
            monitor_worker(child, root, deadline, rss_bytes)
        append_event(root, dict(event='supervisor-complete', at=time.time(), scientificAdmission=False))
    finally:
        try:
            job.stop()
            if child is not None: child.wait(timeout=3)
            job.drain(timeout=3)
        finally: job.close()


def main(argv=None):
    parser = argparse.ArgumentParser(description=__doc__)
    mode = parser.add_mutually_exclusive_group()
    mode.add_argument('--prepare-packet', action='store_true')
    mode.add_argument('--preflight', action='store_true')
    mode.add_argument('--execute', action='store_true')
    mode.add_argument('--worker', action='store_true', help=argparse.SUPPRESS)
    parser.add_argument('--packet'); parser.add_argument('--expected-packet-sha256')
    parser.add_argument('--allowance'); parser.add_argument('--expected-allowance-sha256')
    parser.add_argument('--output')
    args = parser.parse_args(argv)
    if args.prepare_packet:
        now = time.time()
        print(canonical(build_packet(current_pins(), issued_at=now, expires_at=now + 3600)).decode())
        return
    if not (args.preflight or args.execute or args.worker):
        print(canonical(dict(status='offline-no-execution', executionEligible=False,
            scientificAdmission=False, limits=LIMITS, repoUrl=REPO_URL,
            snapshotUrlTemplate=BASE_URL + '/snapshots/{ID}',
            unsupportedFeatureExclusionProved=False,
            interpretation='bounded-observational-metadata-as-interpreted-by-icechunk-2.3.0',
            interpretationLimitations=list(INTERPRETATION_LIMITATIONS),
            required='fresh trusted byte-pinned packet, approved allowance and Windows Job containment')).decode())
        return
    values = (args.packet, args.expected_packet_sha256, args.allowance,
              args.expected_allowance_sha256, args.output)
    if not all(values): raise ValueError('Explicit operator-supplied packet/allowance hashes and output required')
    if args.worker: worker(*values)
    elif args.execute: supervise(*values)
    else:
        preflight(*values)
        print(canonical(dict(status='offline-preflight-passed', executionEligible=False)).decode())


if __name__ == '__main__':
    try: main()
    except Exception as exc:
        print('Metadata preparation stopped: ' + type(exc).__name__ + '; retain receipts for review.', file=sys.stderr)
        raise SystemExit(1)
