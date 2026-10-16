"""Owner-gated fixed time-series sample. Default and preflight are offline.

The only live worker runs inside a verified Windows Job. Raw output is always
quarantined; this module has no scientific decoder or publication path.
"""
import argparse
import ctypes
from ctypes import wintypes
import json
import importlib.util
import math
import os
from pathlib import Path
import subprocess
import sys
import sysconfig
import time

sys.path.insert(0, str(Path(__file__).resolve().parent))
import sample_executor as core
import sample_live
import timeseries_executor as contract
from timeseries_transport import Adapter

MEMORY_BYTES = 512 * 1024**2


def canonical(value):
    return json.dumps(value, sort_keys=True, separators=(',', ':'), allow_nan=False)


def allowance_template(output):
    return dict(schemaVersion=1, purpose='era5-timeseries-sample-only',
                allowExecution=True, planSha256=contract.identity(),
                dataset=contract.plan()['dataset'], request=contract.plan()['request'],
                outputRoot=sample_live.canonical_output(output), maxSubmissions=1,
                maxRawBytes=core.RAW_LIMIT, maxScratchBytes=core.TREE_LIMIT,
                maxWallSeconds=core.SECONDS, maxPolls=core.MAX_POLLS,
                pollIntervalSeconds=core.POLL_SECONDS, automaticRetries=0,
                maxProcesses=1, maxJobMemoryBytes=MEMORY_BYTES,
                scientificAdmission='unimplemented')


def read_json(path):
    path = Path(path).absolute()
    path = core.owned(path.parent, path.name)
    with path.open('rb') as stream:
        body = stream.read(65537)
    if len(body) > 65536:
        raise ValueError('Control file size exceeded')
    def unique(pairs):
        result = {}
        for key, value in pairs:
            if key in result: raise ValueError('Duplicate control field')
            result[key] = value
        return result
    return json.loads(body, object_pairs_hook=unique)


def preflight(allowance, output, resume=False):
    """Validate exact authority, output and recoverability without any I/O client."""
    expected = allowance_template(output)
    if canonical(read_json(allowance)) != canonical(expected):
        raise ValueError('Owner allowance must exactly bind time-series request and all limits')
    root = Path(expected['outputRoot'])
    claim = Path(str(Path(allowance).absolute()) + '.consumed.json')
    receipt = dict(expected, phase='execution-uncertain')
    if resume:
        if canonical(read_json(claim)) != canonical(receipt):
            raise ValueError('Time-series allowance receipt mismatch')
        state = read_json(root / 'checkpoint.json')
        if state.get('identity') != contract.identity() or state.get('phase') not in {'queued', 'running', 'successful'}:
            raise ValueError('Uncertain or terminal result requires independent reconciliation')
        if (type(state.get('started')) not in (int, float) or
            type(state.get('deadline')) not in (int, float) or
            not math.isfinite(state['started']) or not math.isfinite(state['deadline']) or
            not 0 < state['deadline'] - state['started'] <= core.SECONDS or
            state['deadline'] <= time.time()):
            raise ValueError('Original deadline invalid or exceeded')
        immutable = read_json(root / 'job-identity.json')
        if immutable != dict(identity=contract.identity(), jobId=state.get('jobId')):
            raise ValueError('Immutable remote identity mismatch')
    else:
        if claim.exists(): raise FileExistsError('Allowance already consumed; reconcile')
        if root.exists() and (not root.is_dir() or any(root.iterdir())):
            raise ValueError('Fresh output required')
    return expected


def consume_allowance(allowance, output, resume=False):
    expected = preflight(allowance, output, resume)
    if not resume:
        path = Path(allowance).absolute()
        claim = core.owned(path.parent, path.name + '.consumed.json')
        with claim.open('x', encoding='utf-8') as stream:
            json.dump(dict(expected, phase='execution-uncertain'), stream, sort_keys=True)
            stream.flush()
            os.fsync(stream.fileno())


def job_class():
    if os.name != 'nt':
        raise ValueError('Windows Job containment required before credential access')
    sys.path.insert(0, str(Path(__file__).resolve().parents[1] / 'osm'))
    from global_source_supervisor import WindowsJob
    return WindowsJob


def require_containment():
    """Inspect OS state, never trust an argv/environment containment marker."""
    if os.name != 'nt':
        raise ValueError('Windows Job containment required before credential access')
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
    kernel.QueryInformationJobObject.argtypes = [wintypes.HANDLE, ctypes.c_int,
        ctypes.c_void_p, wintypes.DWORD, ctypes.c_void_p]
    limits = Extended()
    if not kernel.QueryInformationJobObject(None, 9, ctypes.byref(limits), ctypes.sizeof(limits), None):
        raise ValueError('Worker is not in a verifiable containment job')
    if (limits.basic.flags & 0x2208 != 0x2208 or limits.basic.active != 1 or
        not 0 < limits.jobMemory <= MEMORY_BYTES):
        raise ValueError('Worker containment limits rejected')


def make_adapter(token):
    import requests
    def session():
        value = requests.Session()
        value.mount('https://', requests.adapters.HTTPAdapter(max_retries=0))
        return value
    return Adapter(token, session)


def require_runtime():
    if importlib.util.find_spec('requests') is None:
        raise ValueError('Existing interpreter requires requests; no installation authorized')


def require_handoff():
    """Require a parent-owned OS pipe, live parent and finite shared deadline.

    This capability is passed only through the supervised child's stdin; argv
    and environment flags cannot establish a supervisor relationship.
    """
    if os.name != 'nt': raise ValueError('Windows supervisor handoff required')
    import msvcrt
    try: handle = msvcrt.get_osfhandle(sys.stdin.fileno())
    except (OSError, ValueError): raise ValueError('Supervisor pipe required') from None
    kernel = ctypes.WinDLL('kernel32', use_last_error=True)
    kernel.GetNamedPipeServerProcessId.argtypes = [wintypes.HANDLE, ctypes.POINTER(wintypes.ULONG)]
    parent = wintypes.ULONG()
    if not kernel.GetNamedPipeServerProcessId(wintypes.HANDLE(handle), ctypes.byref(parent)) or parent.value != os.getppid():
        raise ValueError('Supervisor-owned pipe required')
    kernel.OpenProcess.argtypes = [wintypes.DWORD, wintypes.BOOL, wintypes.DWORD]
    kernel.OpenProcess.restype = wintypes.HANDLE
    kernel.WaitForSingleObject.argtypes = [wintypes.HANDLE, wintypes.DWORD]
    kernel.CloseHandle.argtypes = [wintypes.HANDLE]
    process = kernel.OpenProcess(0x100000, False, parent.value)
    if not process: raise ValueError('Supervisor parent unavailable')
    try:
        if kernel.WaitForSingleObject(process, 0) != 258:
            raise ValueError('Supervisor parent is not live')
    finally: kernel.CloseHandle(process)
    value = json.loads(sys.stdin.buffer.read(4097))
    if (not isinstance(value, dict) or set(value) != {'parentPid', 'planSha256', 'deadlineMonotonic', 'deadlineWall', 'sitePackages'} or
        type(value['parentPid']) is not int or value['parentPid'] != parent.value or
        value['planSha256'] != contract.identity() or
        type(value['deadlineMonotonic']) not in (int, float) or
        not math.isfinite(value['deadlineMonotonic']) or
        not 0 < value['deadlineMonotonic'] - time.monotonic() <= core.SECONDS or
        type(value['deadlineWall']) not in (int, float) or
        not math.isfinite(value['deadlineWall']) or
        not 0 < value['deadlineWall'] - time.time() <= core.SECONDS or
        not isinstance(value['sitePackages'], str)):
        raise ValueError('Supervisor identity/deadline handoff rejected')
    # Explicit path comes from supervising interpreter's sysconfig; do not run
    # site.py or .pth startup code, and do not consult PYTHONPATH.
    if value['sitePackages']: sys.path.append(value['sitePackages'])
    require_runtime()
    # Retain the parent's original wall deadline in durable core state. Clip it
    # to the parent's remaining monotonic budget in case the wall clock moved.
    return min(value['deadlineWall'], time.time() + value['deadlineMonotonic'] - time.monotonic())


def execute(allowance, output, resume=False):
    require_containment()
    deadline_cap = require_handoff()
    require_runtime()
    consume_allowance(allowance, output, resume)
    root = Path(sample_live.canonical_output(output))
    root.mkdir(exist_ok=True)
    # Optional libraries may spill scratch only into the accounted output root.
    for key in ('TEMP', 'TMP', 'TMPDIR'):
        os.environ[key] = str(root)
    token = os.environ.get('CDSAPI_KEY')
    if not token or '\n' in token or '\r' in token:
        raise ValueError('Explicit CDSAPI_KEY required')
    adapter = make_adapter(token)
    try:
        return core._run(root, adapter, resume=resume, contract=contract, deadline_cap=deadline_cap)
    finally:
        close = getattr(adapter, 'close', None)
        if close is not None: close()


def supervise(allowance, output, resume=False):
    preflight(allowance, output, resume)
    Job = job_class()
    wall_started = time.time()
    seconds = core.SECONDS
    if resume:
        seconds = min(seconds, read_json(Path(output) / 'checkpoint.json')['deadline'] - wall_started)
    wall_deadline = wall_started + seconds
    deadline = time.monotonic() + seconds
    job = Job(MEMORY_BYTES, 1)
    child = None
    try:
        argv = [sys._base_executable, '-I', str(Path(__file__).resolve()), '--worker',
                '--owner-allowance', str(Path(allowance).absolute()),
                '--output', sample_live.canonical_output(output)]
        if resume: argv.append('--resume')
        # Inherit native environment without inspecting credentials in the parent.
        child = subprocess.Popen(argv, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL,
                                 stdin=subprocess.PIPE, creationflags=4)
        job.assign_resume(child)
        child.stdin.write(json.dumps(dict(parentPid=os.getpid(), planSha256=contract.identity(),
            deadlineMonotonic=deadline, deadlineWall=wall_deadline,
            sitePackages=sysconfig.get_path('purelib'))).encode())
        child.stdin.close()
        while child.poll() is None:
            if time.monotonic() >= deadline:
                raise ValueError('Whole execution deadline exceeded; reconcile checkpoint')
            if Path(output).exists(): core.budget(output)
            time.sleep(.02)
        if time.monotonic() >= deadline:
            raise ValueError('Whole execution deadline exceeded; reconcile checkpoint')
        if child.returncode:
            raise ValueError('Execution stopped; preserve output and reconcile checkpoint')
        core.budget(output)
    finally:
        try:
            job.stop()
            if child is not None:
                if child.poll() is None: child.kill()
                child.wait(timeout=3)
            job.drain(timeout=3)
        finally:
            job.close()


def main(argv=None):
    parser = argparse.ArgumentParser(description=__doc__)
    mode = parser.add_mutually_exclusive_group()
    mode.add_argument('--plan', action='store_true')
    mode.add_argument('--preflight', action='store_true')
    mode.add_argument('--execute', action='store_true')
    mode.add_argument('--worker', action='store_true', help=argparse.SUPPRESS)
    parser.add_argument('--owner-allowance')
    parser.add_argument('--output')
    parser.add_argument('--resume', action='store_true')
    args = parser.parse_args(argv)
    if not (args.preflight or args.execute or args.worker):
        result = dict(plan=contract.plan(), planSha256=contract.identity(),
                      assetHosts=sorted(sample_live.ASSET_HOSTS),
                      liveExecution='requires exact owner allowance and Windows Job containment')
        if args.output: result['allowanceTemplate'] = allowance_template(args.output)
        print(json.dumps(result, indent=2))
        return
    if not args.owner_allowance or not args.output:
        raise ValueError('Allowance and output required')
    if args.worker: execute(args.owner_allowance, args.output, args.resume)
    elif args.execute: supervise(args.owner_allowance, args.output, args.resume)
    else:
        preflight(args.owner_allowance, args.output, args.resume)
        require_runtime()
        print(json.dumps(dict(status='offline-preflight-passed', submissionAuthorizedByPreflight=False)))


if __name__ == '__main__':
    try: main()
    except Exception:
        print('Time-series sample stopped; preserve output and reconcile allowance/checkpoint.', file=sys.stderr)
        sys.exit(1)
