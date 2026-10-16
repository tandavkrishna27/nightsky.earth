"""Offline-default, exact-edition planet receipt. No network during preflight.

Receipt is a separate operator-authorized phase, never a catalogue build or
source-policy approval. Failed partials and both worker/supervisor reports stay.
"""
import argparse
from datetime import datetime, timezone
import hashlib
import http.client
import json
import math
import os
from pathlib import Path
import shutil
import ssl
import stat
import subprocess
import sys
import time
from urllib.parse import urlsplit

sys.dont_write_bytecode = True
from spot_paths import safe_path


SOURCE = dict(
    url='https://osm-planet-eu-central-1.s3.dualstack.eu-central-1.amazonaws.com/planet/pbf/2026/planet-261012.osm.pbf',
    edition='planet-261012.osm.pbf', bytes=95380942829,
    versionId='brLMq6.oGIcbk.3ciQgjtqIduCfYJMT1',
    etag='"37619b1886c62145e6a0a6b31109b300-5686"',
    md5='c51bb08eb9fc486d010aaa1a3424cabc',
    lastModified='2026-10-15T19:22:44Z')
LAST_MODIFIED_HTTP = 'Thu, 15 Oct 2026 19:22:44 GMT'
SOURCE_EVIDENCE = Path(__file__).resolve().parents[2]/'docs/operations/data-pilot-evidence/planet-identity-capacity-s3-20261016.json'
SOURCE_EVIDENCE_SHA256_LF = '98d6637d14b741be946762d561db84c3fb516411008d1f59e3c68eec75117203'
RESERVE_BYTES = 128 * 1024**3
EVIDENCE_BYTES = 1024**2
HEADER_BYTES = 65536
CHUNK_BYTES = 65536
DEFAULT_ROOT = Path(__file__).resolve().parents[2]/'.cache/planet-261012-receipt-v1'
PACKET = 'planet-261012-single-GET-receipt-v1'
LIMITS = dict(bodyBytes=SOURCE['bytes'], wallSeconds=86400,
              connectSeconds=30, freeBytes=RESERVE_BYTES,
              evidenceBytes=EVIDENCE_BYTES, commitBytes=4*1024**3,
              rssBytes=2*1024**3, maxProcesses=1)


def canonical(value):
    return json.dumps(value, sort_keys=True, separators=(',', ':'), allow_nan=False)


def utc():
    return datetime.now(timezone.utc).isoformat()


def _source_evidence():
    path = safe_path(SOURCE_EVIDENCE)
    with path.open('rb') as handle:
        payload = handle.read(65537)
    # Git text checkout CRLF is normalized solely for this retained Git pin.
    if len(payload) > 65536 or hashlib.sha256(payload.replace(b'\r\n', b'\n')).hexdigest() != SOURCE_EVIDENCE_SHA256_LF:
        raise ValueError('retained planet metadata evidence digest mismatch')
    return dict(path=str(path), sha256Lf=SOURCE_EVIDENCE_SHA256_LF)


def _retained_paths(paths):
    result = []
    for path in paths:
        if len(result)>=64:
            raise ValueError('retained accounting exceeds 64 roots')
        result.append(safe_path(path))
    evidence = safe_path(_source_evidence()['path'])
    if not any(evidence == p or evidence.is_relative_to(p) for p in result):
        if len(result)>=64:
            raise ValueError('retained source evidence exceeds 64 roots')
        result.append(evidence)
    return result


def _write_new(path, value):
    """Exclusive, flushed evidence: an existing attempt cannot be replaced."""
    payload = (canonical(value)+'\n').encode('utf8')
    if len(payload) > 65536:
        raise ValueError('evidence record limit')
    with safe_path(path).open('xb') as handle:
        handle.write(payload)
        handle.flush()
        os.fsync(handle.fileno())


def _inventory(paths, deadline_check=lambda: None):
    # Roots are the caller boundary; scandir names below them come from the
    # filesystem. Do not repeat safe_path's complete ancestor resolution for
    # every file in a retained tree. No verdict is cached between inventories.
    canonical_paths=[]
    for path in paths:
        deadline_check()
        if len(canonical_paths)>=64:raise ValueError('bounded unique retained paths required')
        canonical_paths.append(safe_path(path));deadline_check()
    paths=canonical_paths
    if len(set(paths)) != len(paths):
        raise ValueError('bounded unique retained paths required')
    for index, path in enumerate(paths):
        deadline_check()
        if not path.exists():
            raise ValueError('retained path is absent')
        if any(path.is_relative_to(other) or other.is_relative_to(path)
               for other in paths[:index]):
            raise ValueError('overlapping retained accounting')
    def regular(info):
        if stat.S_ISLNK(info.st_mode) or getattr(info,'st_file_attributes',0)&0x400:
            raise ValueError('retained symlink/reparse point refused')
        if not(stat.S_ISDIR(info.st_mode) or stat.S_ISREG(info.st_mode)):
            raise ValueError('regular file/directory required')
    def identity(info):return info.st_dev,info.st_ino
    def directory_state(info):return identity(info),info.st_size,info.st_mtime_ns
    def ancestry(path):
        result=[]
        for part in reversed((path,*path.parents)):
            deadline_check();info=part.lstat();regular(info)
            result.append((part,identity(info)))
        return result
    total=count=0
    for path in paths:
        before=ancestry(path)
        info=path.lstat();regular(info)
        if stat.S_ISREG(info.st_mode):
            total+=info.st_size
            if before!=ancestry(path) or directory_state(info)!=directory_state(path.lstat()):
                raise ValueError('retained file/root mutation')
            continue
        frames=[]
        def enter(directory,expected):
            # Validate directory ancestry at descent boundaries, not once per
            # sibling file. DirEntry can have zero inode/device on Windows;
            # actual directory identities always use lstat on both sides.
            for parent,witness in before+[(frame[0],identity(frame[1])) for frame in frames]:
                deadline_check();observed=parent.lstat();regular(observed)
                if identity(observed)!=witness:raise ValueError('retained directory ancestry mutation')
            observed=directory.lstat();regular(observed)
            if identity(observed)!=expected or not stat.S_ISDIR(observed.st_mode):
                raise ValueError('retained directory identity mutation')
            context=os.scandir(directory)
            iterator=iter(context.__enter__())
            frames.append((directory,observed,context,iterator))
        try:
            enter(path,identity(info))
            # DFS iterator frames hold one directory per depth; no list of a
            # broad directory's files or pending sibling subtrees is built.
            while frames:
                deadline_check();directory,initial,context,iterator=frames[-1]
                try:entry=next(iterator)
                except StopIteration:
                    frames.pop();context.__exit__(None,None,None)
                    after=directory.lstat();regular(after)
                    if directory_state(initial)!=directory_state(after):
                        raise ValueError('retained directory changed during enumeration')
                    continue
                count+=1
                if count>1000000:raise ValueError('retained inventory entry limit')
                deadline_check();entry_info=entry.stat(follow_symlinks=False);regular(entry_info)
                if stat.S_ISREG(entry_info.st_mode):total+=entry_info.st_size
                else:
                    child=Path(entry.path);child_info=child.lstat();regular(child_info)
                    enter(child,identity(child_info))
            if before!=ancestry(path):raise ValueError('retained root/ancestor mutation')
        finally:
            for _,_,context,_ in reversed(frames):context.__exit__(None,None,None)
    deadline_check()
    return paths, total


def validate_allowance(value):
    """Operator attestation, not an independently trusted policy approval."""
    if not isinstance(value, dict) or set(value) != {
        'schemaVersion', 'action', 'source', 'limits', 'retainedPaths',
        'attemptRoot', 'operatorApprovalReference'}:
        raise ValueError('exact allowance fields required')
    if type(value['schemaVersion']) is not int or value['schemaVersion'] != 1:
        raise ValueError('allowance schema version')
    if value['action'] != 'receive-one-exact-planet':
        raise ValueError('explicit receipt allowance required')
    if value['source'] != SOURCE or type(value['source'].get('bytes')) is not int:
        raise ValueError('exact dated source identity required')
    limits = value['limits']
    if not isinstance(limits, dict) or set(limits) != set(LIMITS):
        raise ValueError('explicit complete receipt limits required')
    for key, cap in LIMITS.items():
        number = limits[key]
        if type(number) is not int or number < 1:
            raise ValueError('integer receipt limit required: '+key)
        if key == 'freeBytes':
            if number < cap:
                raise ValueError('retained 128 GiB reserve required')
        elif key in ('bodyBytes', 'evidenceBytes', 'maxProcesses'):
            if number != cap:
                raise ValueError('fixed receipt allocation required: '+key)
        elif number > cap:
            raise ValueError('receipt limit exceeds ceiling: '+key)
    if limits['rssBytes'] > limits['commitBytes']:
        raise ValueError('RSS exceeds tree commit allowance')
    if not isinstance(value['retainedPaths'], list):
        raise ValueError('absolute retained path inventory required')
    if len(value['retainedPaths'])>64:
        raise ValueError('retained path inventory exceeds 64 roots')
    if any(
        not isinstance(path, str) or not Path(path).is_absolute()
        for path in value['retainedPaths']):
        raise ValueError('absolute retained path inventory required')
    if not isinstance(value['attemptRoot'], str) or not Path(value['attemptRoot']).is_absolute():
        raise ValueError('absolute fixed attempt root required')
    reference = value['operatorApprovalReference']
    if not isinstance(reference, str) or not 1 <= len(reference.strip()) <= 500:
        raise ValueError('operator approval reference required')
    return value


def load_allowance(path, digest):
    if not isinstance(digest, str) or len(digest) != 64 or any(c not in '0123456789abcdef' for c in digest):
        raise ValueError('explicit lowercase allowance SHA-256 required')
    path = safe_path(path)
    with path.open('rb') as handle:
        first = os.fstat(handle.fileno())
        payload = handle.read(65537)
        last = os.fstat(handle.fileno())
    if len(payload) > 65536 or first.st_size != len(payload) or (
            first.st_size, first.st_mtime_ns) != (last.st_size, last.st_mtime_ns):
        raise ValueError('allowance size/mutation')
    if hashlib.sha256(payload).hexdigest() != digest:
        raise ValueError('allowance digest mismatch')
    def pairs(items):
        result = {}
        for key, value in items:
            if key in result:
                raise ValueError('duplicate allowance field')
            result[key] = value
        return result
    return validate_allowance(json.loads(payload, object_pairs_hook=pairs))


def preflight(root, allowance=None):
    """Read-only local plan; no requests, receipt directories, or approvals."""
    root = safe_path(root)
    limits = dict(allowance['limits']) if allowance else dict(LIMITS)
    evidence = _source_evidence()
    retained, retained_bytes = _inventory(_retained_paths(allowance['retainedPaths'] if allowance else []))
    if allowance and safe_path(allowance['attemptRoot']) != root:
        raise ValueError('attempt root allowance mismatch')
    if any(root.is_relative_to(p) or p.is_relative_to(root) for p in retained):
        raise ValueError('overlapping attempt/retained accounting')
    gates = []
    if root.exists():
        gates.append('attempt-root-already-exists; retain existing evidence, no retry/resume')
    if not root.parent.is_dir():
        gates.append('attempt-parent-must-exist')
        free = None
    else:
        free = shutil.disk_usage(root.parent).free
        if free < limits['freeBytes'] + SOURCE['bytes'] + EVIDENCE_BYTES:
            gates.append('insufficient-live-free-disk-above-retained-reserve')
    if os.name != 'nt':
        gates.append('Windows-Job-containment-required-for-receipt')
    return dict(schemaVersion=1, mode='offline-preflight',
                status='blocked' if gates else 'ready-for-explicit-allowance',
                source=dict(SOURCE), sourceEvidence=evidence, limits=limits, attemptRoot=str(root),
                observedUtc=utc(), freeBytes=free, retainedLogicalBytes=retained_bytes,
                maximumAccountedBytes=retained_bytes+SOURCE['bytes']+EVIDENCE_BYTES,
                gates=gates, networkRequests=0,
                receiptAuthorized=False,
                pending=['explicit separately authorized receipt allowance',
                         'actual raw SHA-256 and native header inspection',
                         'actual source descriptor and independently trusted policy reviews',
                         'separate bounded build authorization and serving measurements'])


class _HeaderReader:
    def __init__(self, raw):
        self.raw = raw
        self.remaining = HEADER_BYTES

    def readline(self, size=-1):
        if self.remaining <= 0:
            raise ValueError('HTTP header byte cap')
        line = self.raw.readline(min(self.remaining, size) if size >= 0 else self.remaining)
        self.remaining -= len(line)
        if line and not line.endswith(b'\n'):
            raise ValueError('HTTP header byte cap')
        return line


class _BoundedResponse(http.client.HTTPResponse):
    def __init__(self, sock, *args, **kwargs):
        super().__init__(sock, *args, **kwargs)
        self.fp.close()
        # Header readline must not prefetch any body bytes before acceptance;
        # body reads must not hide an additional buffered read allowance.
        self.fp = sock.makefile('rb', buffering=0)

    def begin(self):
        raw = self.fp
        self.fp = _HeaderReader(raw)
        try:
            super().begin()
        finally:
            self.fp = raw


def _validate_response(reply, source):
    headers = reply.headers
    for key in ('Content-Length', 'ETag', 'x-amz-version-id', 'Last-Modified',
                'Content-Encoding', 'Transfer-Encoding', 'Content-Range'):
        if len(headers.get_all(key, [])) > 1:
            raise ValueError('duplicate HTTP identity/framing header: '+key)
    if reply.status != 200:
        raise ValueError('HTTP status rejected; redirects/retries disabled')
    if headers.get('Transfer-Encoding') is not None or headers.get('Content-Range') is not None:
        raise ValueError('HTTP transfer/range framing rejected')
    if headers.get('Content-Encoding') not in (None, 'identity'):
        raise ValueError('HTTP content encoding rejected')
    if headers.get('Content-Length') != str(source['bytes']):
        raise ValueError('HTTP Content-Length mismatch')
    for key, field in [('ETag', 'etag'), ('x-amz-version-id', 'versionId')]:
        if headers.get(key) != source[field]:
            raise ValueError('HTTP identity mismatch: '+key)
    if headers.get('Last-Modified') != LAST_MODIFIED_HTTP:
        raise ValueError('HTTP identity mismatch: Last-Modified')


def _stream_reply(reply, output, source, check, progress=None):
    """Exact bounded reads; no EOF probe beyond the authorized body allowance."""
    _validate_response(reply, source)
    size = 0
    sha = hashlib.sha256()
    md5 = hashlib.md5(usedforsecurity=False)
    progress = progress if progress is not None else {}
    progress.update(receivedBytesExact=0, receivedBytesUpperBound=0)
    while size < source['bytes']:
        check()
        allowance = min(CHUNK_BYTES, source['bytes']-size)
        # A failing blocking read may consume a prefix internally. Reserve its
        # full allowance until a successful return establishes the exact count.
        progress.update(receivedBytesExact=None, receivedBytesUpperBound=size+allowance)
        chunk = reply.read(allowance)
        if not isinstance(chunk, bytes) or len(chunk) > allowance:
            raise ValueError('transport violated bounded read')
        progress.update(receivedBytesExact=size+len(chunk), receivedBytesUpperBound=size+len(chunk))
        check()
        if not chunk:
            raise ValueError('short planet body')
        output.write(chunk)
        output.flush()
        size += len(chunk)
        sha.update(chunk)
        md5.update(chunk)
    output.flush()
    os.fsync(output.fileno())
    if md5.hexdigest() != source['md5']:
        raise ValueError('provider MD5 mismatch')
    return dict(bytes=size, sha256=sha.hexdigest(), md5=md5.hexdigest())


def _require_job(limits):
    if os.name != 'nt':
        raise RuntimeError('Windows Job containment required')
    import ctypes
    from ctypes import wintypes
    kernel = ctypes.WinDLL('kernel32', use_last_error=True)
    class Basic(ctypes.Structure):
        _fields_ = [('processTime',ctypes.c_int64),('jobTime',ctypes.c_int64),('flags',wintypes.DWORD),('minimum',ctypes.c_size_t),('maximum',ctypes.c_size_t),('active',wintypes.DWORD),('affinity',ctypes.c_size_t),('priority',wintypes.DWORD),('scheduling',wintypes.DWORD)]
    class IO(ctypes.Structure):
        _fields_ = [(name,ctypes.c_uint64) for name in ('readOps','writeOps','otherOps','readBytes','writeBytes','otherBytes')]
    class Extended(ctypes.Structure):
        _fields_ = [('basic',Basic),('io',IO),('processMemory',ctypes.c_size_t),('jobMemory',ctypes.c_size_t),('peakProcessMemory',ctypes.c_size_t),('peakJobMemory',ctypes.c_size_t)]
    kernel.QueryInformationJobObject.argtypes = [wintypes.HANDLE,ctypes.c_int,ctypes.c_void_p,wintypes.DWORD,ctypes.c_void_p]
    actual = Extended()
    if not kernel.QueryInformationJobObject(None,9,ctypes.byref(actual),ctypes.sizeof(actual),None):
        raise RuntimeError('verifiable worker Job required')
    if actual.basic.flags & 0x2208 != 0x2208 or actual.basic.active != 1 or actual.jobMemory != limits['commitBytes']:
        raise RuntimeError('worker Job limits rejected')


def _require_handoff(root, allowance_digest, limits):
    if os.name != 'nt':
        raise RuntimeError('Windows supervisor handoff required')
    import ctypes
    from ctypes import wintypes
    import msvcrt
    kernel = ctypes.WinDLL('kernel32', use_last_error=True)
    kernel.GetNamedPipeServerProcessId.argtypes = [wintypes.HANDLE, ctypes.POINTER(wintypes.ULONG)]
    parent = wintypes.ULONG()
    handle = msvcrt.get_osfhandle(sys.stdin.fileno())
    if not kernel.GetNamedPipeServerProcessId(wintypes.HANDLE(handle), ctypes.byref(parent)) or parent.value != os.getppid():
        raise RuntimeError('supervisor-owned pipe required')
    kernel.OpenProcess.argtypes = [wintypes.DWORD,wintypes.BOOL,wintypes.DWORD]
    kernel.OpenProcess.restype = wintypes.HANDLE
    kernel.WaitForSingleObject.argtypes = [wintypes.HANDLE,wintypes.DWORD]
    kernel.CloseHandle.argtypes = [wintypes.HANDLE]
    process = kernel.OpenProcess(0x100000, False, parent.value)
    if not process:
        raise RuntimeError('supervisor parent unavailable')
    try:
        if kernel.WaitForSingleObject(process,0) != 258:
            raise RuntimeError('supervisor parent not live')
    finally:
        kernel.CloseHandle(process)
    data = json.loads(sys.stdin.buffer.read(4097))
    if not isinstance(data,dict) or set(data) != {'parentPid','packet','deadline','headerDeadline','root','allowanceSha256','limits'}:
        raise RuntimeError('supervisor handoff fields rejected')
    if data['parentPid'] != parent.value or data['packet'] != PACKET or data['root'] != str(safe_path(root)) or data['allowanceSha256'] != allowance_digest or data['limits'] != limits:
        raise RuntimeError('supervisor handoff identity rejected')
    deadline = data['deadline']
    if type(deadline) not in (int,float) or not math.isfinite(deadline) or not 0 < deadline-time.monotonic() <= limits['wallSeconds']:
        raise RuntimeError('supervisor handoff deadline rejected')
    header_deadline = data['headerDeadline']
    if type(header_deadline) not in (int,float) or not math.isfinite(header_deadline) or not 0 < header_deadline-time.monotonic() <= limits['connectSeconds']:
        raise RuntimeError('supervisor handoff header deadline rejected')
    _require_job(limits)
    return dict(deadline=deadline, headerDeadline=header_deadline)


def _worker(root, allowance, allowance_digest):
    """Only called by the independent supervisor; private CLI requires a Job."""
    root = safe_path(root)
    limits = allowance['limits']
    handoff = _require_handoff(root, allowance_digest, limits)
    deadline = handoff['deadline']
    partial = root/(SOURCE['edition']+'.partial')
    report = dict(schemaVersion=1, status='bounded-stop', source=dict(SOURCE),
                  allowanceSha256=allowance_digest, retainedPartialBytes=0,
                  receivedBytesExact=0, receivedBytesUpperBound=0,
                  sha256=None, md5=None, nativeHeader=None, startedUtc=utc())
    connection = reply = None
    def check():
        if time.monotonic() >= deadline:
            raise TimeoutError('worker receipt deadline')
        if shutil.disk_usage(root).free < limits['freeBytes']:
            raise ValueError('worker retained reserve limit')
    try:
        check()
        # Durable intent precedes connection creation and the only request.
        _write_new(root/'request-intent.json', dict(source=SOURCE, method='GET',
                   allowanceSha256=allowance_digest, startedUtc=utc(),
                   redirects=False, retries=0, ranges=False, resume=False))
        url = urlsplit(SOURCE['url'])
        connection = http.client.HTTPSConnection(url.hostname, timeout=limits['connectSeconds'],
                                                context=ssl.create_default_context())
        connection.response_class = _BoundedResponse
        connection.request('GET', url.path, headers={
            'Accept-Encoding': 'identity', 'If-Match': SOURCE['etag'],
            'Connection': 'close'})
        reply = connection.getresponse()
        accepted = time.monotonic()
        if accepted >= handoff['headerDeadline']:
            raise TimeoutError('worker connection/header deadline')
        _validate_response(reply, SOURCE)
        _write_new(root/'response-accepted.json', dict(status=200, source=SOURCE, observedUtc=utc(),
                   acceptedMonotonic=accepted, headerDeadline=handoff['headerDeadline']))
        with reply, partial.open('xb') as output:
            try:
                hashes = _stream_reply(reply, output, SOURCE, check, report)
            finally:
                # Keep the writable handle for Windows _commit. A secondary
                # flush failure must not mask the original transport failure.
                try:
                    output.flush()
                    os.fsync(output.fileno())
                except OSError:
                    pass
        check()
        # Keep a single allocation at the partial path: the report, not rename,
        # declares transport completion. Native evidence and admission follow.
        report.update(status='transport-complete', retainedPartialBytes=hashes['bytes'],
                      sha256=hashes['sha256'], md5=hashes['md5'],
                      pending='native-header-inspection-and-source-policy-admission')
    except Exception as error:
        report['reason'] = str(error)[:1000]
        if partial.exists():
            report['retainedPartialBytes'] = partial.stat().st_size
    finally:
        if reply is not None:
            reply.close()
        if connection is not None:
            connection.close()
        report['finishedUtc'] = utc()
        _write_new(root/'receipt-report.json', report)
    return report


def _header_accepted(root, header_deadline):
    path = safe_path(root/'response-accepted.json')
    if not path.exists():
        return False
    with path.open('rb') as handle:
        payload = handle.read(65537)
    if len(payload) > 65536:
        raise ValueError('response acceptance evidence cap')
    try:
        marker = json.loads(payload)
    except json.JSONDecodeError:
        return False  # A concurrently created marker is not accepted yet.
    if not isinstance(marker, dict) or marker.get('source') != SOURCE or marker.get('status') != 200 or marker.get('headerDeadline') != header_deadline:
        raise ValueError('response acceptance identity/deadline mismatch')
    accepted = marker.get('acceptedMonotonic')
    if type(accepted) not in (int,float) or not math.isfinite(accepted) or not 0 < accepted < header_deadline:
        raise TimeoutError('supervisor late response acceptance')
    return True


def _supervise_worker(command, root, limits, retained, handoff=None):
    """Independent wall/header, memory and sampled disk/reserve containment.

    Small synthetic subprocesses exercise this boundary without a network call.
    Caller has exclusively reserved root and durably written attempt intent.
    """
    from global_source_supervisor import WindowsJob, rss_bytes, wait_for_directory_release
    root = safe_path(root)
    began = time.monotonic()
    header_deadline = began+limits['connectSeconds']
    process = job = None
    reason = None
    peak = peak_rss = 0
    header_accepted = False
    next_header_sample = began
    def deadline_check():
        nonlocal header_accepted, next_header_sample
        now = time.monotonic()
        elapsed = now-began
        if elapsed >= limits['wallSeconds']:
            raise TimeoutError('supervisor total receipt deadline')
        # Every metadata entry checks the clock. Marker I/O is sampled at the
        # watchdog cadence, and forced at the shared header deadline. Before
        # launch no worker can publish a marker. A cached acceptance never
        # replaces the mandatory direct marker/transport checks at completion.
        if process is not None and not header_accepted and (now >= next_header_sample or now >= header_deadline):
            header_accepted = _header_accepted(root, header_deadline)
            next_header_sample = now+.02
        if not header_accepted and now >= header_deadline:
            raise TimeoutError('supervisor connection/header deadline')
    disk_ceiling = SOURCE['bytes']+EVIDENCE_BYTES
    def check(current=None):
        nonlocal peak, peak_rss
        deadline_check()
        if current is None:
            current = _inventory([root, *retained], deadline_check)[1]
        peak = max(peak, current)
        if current > disk_ceiling:
            raise ValueError('supervisor whole-receipt disk limit')
        if shutil.disk_usage(root).free < limits['freeBytes']:
            raise ValueError('supervisor retained reserve limit')
        if process is not None:
            peak_rss = max(peak_rss, rss_bytes(process))
            if peak_rss > limits['rssBytes']:
                raise ValueError('supervisor RSS limit')
        deadline_check()
    try:
        # Scan retained trees once before launch. Keep their baseline separate
        # from the tiny new intent root, so root growth can never enlarge the
        # retained-only + body + evidence allowance.
        retained, initial_retained = _inventory(retained, deadline_check)
        if len(retained)+1>64:
            raise ValueError('combined receipt accounting exceeds 64 roots')
        if any(root.is_relative_to(path) or path.is_relative_to(root) for path in retained):
            raise ValueError('overlapping attempt/retained accounting')
        initial_root = _inventory([root], deadline_check)[1]
        disk_ceiling = initial_retained+SOURCE['bytes']+EVIDENCE_BYTES
        check(initial_retained+initial_root)
        job = WindowsJob(limits['commitBytes'], limits['maxProcesses'])
        # Suppress unbounded logs; all bounded evidence is written explicitly.
        environment = {k:v for k,v in os.environ.items() if k.upper() in ('SYSTEMROOT','WINDIR')}
        environment.update(TEMP=str(root), TMP=str(root))
        process = subprocess.Popen(command, cwd=root, stdin=subprocess.PIPE if handoff is not None else subprocess.DEVNULL,
                                   stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL,
                                   env=environment,
                                   creationflags=0x4)
        job.assign_resume(process)
        if handoff is not None:
            payload = canonical(dict(handoff, parentPid=os.getpid(), packet=PACKET,
                                     deadline=began+limits['wallSeconds'], headerDeadline=header_deadline, limits=limits)).encode()
            if len(payload) > 4096:
                raise ValueError('bounded supervisor handoff required')
            process.stdin.write(payload)
            process.stdin.close()
        while True:
            check()
            if process.poll() is not None:
                break
            time.sleep(.02)
        if process.returncode:
            raise ValueError('receipt worker failed: '+str(process.returncode))
        check()
        if not _header_accepted(root, header_deadline):
            raise ValueError('worker exited without complete response acceptance evidence')
        _transport_report(root)
        deadline_check()
    except Exception as error:
        reason = str(error)[:1000]
    finally:
        try:
            if process is not None and process.poll() is None:
                # Record termination intent before killing an unresponsive worker.
                try:
                    _write_new(root/'termination-intent.json', dict(reason=reason, observedUtc=utc()))
                except Exception:
                    pass  # Evidence failure must never suppress process termination.
                try:
                    if job is not None:
                        job.stop()
                finally:
                    if process.poll() is None:
                        process.kill()
                    process.wait(timeout=3)
            if job is not None:
                job.drain(timeout=3)
        finally:
            if job is not None:
                job.close()
            if process is not None:
                if process.stdin is not None:
                    process.stdin.close()
                process._handle.Close()
        if os.name == 'nt':
            wait_for_directory_release(root, timeout=3)
    partial = safe_path(root/(SOURCE['edition']+'.partial'))
    partial_bytes = partial.stat().st_size if partial.exists() else 0
    report = dict(schemaVersion=1, status='bounded-stop' if reason else 'transport-complete',
                  source=dict(SOURCE), allowanceSha256=handoff.get('allowanceSha256') if handoff else None,
                  reason=reason, exitCode=process.returncode if process else None,
                  retainedPartialBytes=partial_bytes,
                  receivedBytesExact=SOURCE['bytes'] if not reason else None,
                  receivedBytesUpperBound=SOURCE['bytes'] if (root/'request-intent.json').exists() else 0,
                  elapsedSeconds=round(time.monotonic()-began, 3),
                  peakLogicalBytes=peak, peakRssBytes=peak_rss,
                  maximumAccountedBytes=disk_ceiling, limits=limits,
                  enforcement='Windows Job hard tree commit/process count; independent total and connection/header deadlines; sampled reserve/disk/main RSS at 20ms plus inventory cost',
                  finishedUtc=utc())
    # A killed worker never supplies successful transport evidence.
    _write_new(root/'supervisor-report.json', report)
    return report


def _transport_report(root):
    path = safe_path(root/'receipt-report.json')
    with path.open('rb') as handle:
        body = handle.read(65537)
    if len(body) > 65536:
        raise ValueError('worker receipt evidence cap')
    report = json.loads(body)
    if not isinstance(report,dict) or report.get('status') != 'transport-complete' or report.get('source') != SOURCE:
        raise ValueError('worker transport completion evidence missing')
    if report.get('receivedBytesExact') != SOURCE['bytes'] or report.get('receivedBytesUpperBound') != SOURCE['bytes'] or report.get('md5') != SOURCE['md5']:
        raise ValueError('worker receipt identity/accounting mismatch')
    sha = report.get('sha256')
    if not isinstance(sha,str) or len(sha) != 64 or any(c not in '0123456789abcdef' for c in sha):
        raise ValueError('worker local SHA-256 missing')
    if safe_path(root/(SOURCE['edition']+'.partial')).stat().st_size != SOURCE['bytes']:
        raise ValueError('worker partial size mismatch')
    return report


def receive(root, allowance_path, allowance_digest):
    allowance_path = safe_path(allowance_path)
    allowance = load_allowance(allowance_path, allowance_digest)
    root = safe_path(root)
    plan = preflight(root, allowance)
    if plan['gates']:
        raise ValueError('receipt preflight blocked: '+'; '.join(plan['gates']))
    # A copied allowance is counted with retained inputs; it cannot silently
    # live under this new attempt root or disappear from logical accounting.
    retained = _retained_paths(allowance['retainedPaths'])
    if not any(allowance_path == p or allowance_path.is_relative_to(p) for p in retained):
        raise ValueError('allowance file missing from retained accounting')
    root.mkdir()  # Exclusive single attempt; never retries, resumes or overwrites.
    _write_new(root/'attempt-intent.json', dict(schemaVersion=1, source=SOURCE, sourceEvidence=_source_evidence(),
               limits=allowance['limits'], allowanceSha256=allowance_digest,
               operatorApprovalReference=allowance['operatorApprovalReference'],
               retainedPaths=[str(p) for p in retained], startedUtc=utc()))
    bootstrap = "import sys,runpy;sys.path.insert(0,sys.argv[1]);sys.argv=sys.argv[2:];runpy.run_path(sys.argv[0],run_name='__main__')"
    command = [getattr(sys, '_base_executable', sys.executable), '-I', '-S', '-B', '-c', bootstrap,
               str(Path(__file__).resolve().parent), str(Path(__file__).resolve()),
               str(root), '--_worker', '--allowance', str(allowance_path),
               '--allowance-sha256', allowance_digest]
    handoff = dict(root=str(root), allowanceSha256=allowance_digest)
    return _supervise_worker(command, root, allowance['limits'], retained, handoff)


def main(argv=None):
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('root', nargs='?', default=str(DEFAULT_ROOT), help='fixed, previously nonexistent receipt directory')
    parser.add_argument('--allowance')
    parser.add_argument('--allowance-sha256')
    parser.add_argument('--receive', action='store_true', help='requires separately authorized exact allowance')
    parser.add_argument('--_worker', action='store_true', help=argparse.SUPPRESS)
    args = parser.parse_args(argv)
    if bool(args.allowance) != bool(args.allowance_sha256):
        parser.error('allowance file and SHA-256 required together')
    if args.receive or args._worker:
        if not args.allowance or (args.receive and args._worker):
            parser.error('one explicit receipt mode and allowance required')
        if args._worker:
            allowance = load_allowance(args.allowance, args.allowance_sha256)
            if safe_path(allowance['attemptRoot']) != safe_path(args.root):
                raise ValueError('worker attempt root mismatch')
            result = _worker(args.root, allowance, args.allowance_sha256)
            return 0 if result['status'] == 'transport-complete' else 1
        result = receive(args.root, args.allowance, args.allowance_sha256)
        print(canonical(result))
        return 0 if result['status'] == 'transport-complete' else 1
    allowance = load_allowance(args.allowance, args.allowance_sha256) if args.allowance else None
    result = preflight(args.root, allowance)
    print(canonical(result))
    return 0  # Read-only plans report gates in structured JSON, not execution.


if __name__ == '__main__':
    sys.exit(main())
