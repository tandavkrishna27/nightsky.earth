"""Fixed N4 quarantine acquisition. Default is an offline plan; no mapping or promotion.

Only the supervised --execute path imports requests. Never invoke --worker directly.
"""
import argparse
import ctypes
from ctypes import wintypes
import hashlib
import json
import math
import os
from pathlib import Path
import shutil
import subprocess
import sys
import time
from datetime import datetime, timezone

from spot_paths import safe_path
from global_source_supervisor import WindowsJob, rss_bytes

MIB = 1024 ** 2
GIB = 1024 ** 3
REPO = Path(__file__).resolve().parents[2]
ROOT = REPO / '.cache/s2-geography-acquisition-20261016'
PACKET = 'N4-natural-earth-v5.1.1-20261016-fixed-two-GET'
COMMIT = '9380cca83db5f9aef52d5e762765100745f84b27'
FILES = [dict(name='ne_10m_admin_0_countries.geojson', bytes=13287234, git='5ebc66e25fc1af01edaebe9375c546655e04cf1e'),
         dict(name='ne_10m_admin_1_states_provinces.geojson', bytes=40726851, git='4a8438f98ac7dfec7dc1739b1eaf91398ad33f22')]
for row in FILES:
    row['url'] = f"https://raw.githubusercontent.com/nvkelso/natural-earth-vector/{COMMIT}/geojson/{row['name']}"

def utc():
    return datetime.now(timezone.utc).isoformat()

def durable(path, value):
    data = (json.dumps(value, sort_keys=True, ensure_ascii=True) + '\n').encode()
    if len(data) > MIB: raise ValueError('evidence file exceeds 1 MiB')
    with safe_path(path).open('xb') as out:
        out.write(data); out.flush(); os.fsync(out.fileno())

def identities(path):
    size = path.stat().st_size
    sha = hashlib.sha256(); git = hashlib.sha1(f'blob {size}\0'.encode())
    with path.open('rb') as inp:
        before = os.fstat(inp.fileno())
        for chunk in iter(lambda: inp.read(65536), b''):
            sha.update(chunk); git.update(chunk)
        after = os.fstat(inp.fileno())
    if (before.st_size, before.st_mtime_ns) != (after.st_size, after.st_mtime_ns):
        raise ValueError('input mutation')
    return dict(bytes=size, sha256=sha.hexdigest(), git=git.hexdigest())

def metadata():
    expected = [('natural-earth-v5.1.1-geojson-listing.json', 251677, '85bd94a4e6cc3cd95cf9e54af5b6da1d8b9699b55ddefb229cc968d607c7af0a'),
                ('natural-earth-v5.1.1-license.txt', 4636, '2631b5b39b6d1acc56de75235109b5af2dbb4b0ac5a127b6f06185977247fd4b')]
    result = []
    for name, size, digest in expected:
        path = safe_path(REPO / 'docs/operations' / name)
        actual = identities(path)
        if actual['bytes'] != size or actual['sha256'] != digest: raise ValueError('retained metadata pin mismatch')
        result.append(dict(path=str(path), **actual))
    listing = json.loads(Path(result[0]['path']).read_text(encoding='utf8'))
    for row in FILES:
        matches = [r for r in listing if r.get('path') == 'geojson/' + row['name']]
        if len(matches) != 1 or matches[0].get('size') != row['bytes'] or matches[0].get('sha') != row['git']:
            raise ValueError('listing row mismatch')
    return result

def capacity():
    class Memory(ctypes.Structure):
        _fields_ = [('length', wintypes.DWORD), ('load', wintypes.DWORD)] + [(n, ctypes.c_uint64) for n in ('totalPhysical','availablePhysical','totalPage','availablePage','totalVirtual','availableVirtual','extended')]
    state = Memory(); state.length = ctypes.sizeof(state)
    if not ctypes.windll.kernel32.GlobalMemoryStatusEx(ctypes.byref(state)): raise ctypes.WinError()
    if state.availablePhysical < 4 * GIB or state.availablePage < 6 * GIB: raise ValueError('RAM/commit reserve insufficient')
    free = shutil.disk_usage(safe_path(ROOT.parent)).free
    if free < 2 * GIB + 256 * MIB: raise ValueError('disk reserve insufficient')
    return dict(availablePhysical=state.availablePhysical, availableCommit=state.availablePage, freeDisk=free)

def acquire_one(session, row, root, aggregate, deadline):
    """Single irreversible attempt; ledger is durable before calling get."""
    start = time.monotonic()
    partial = safe_path(root / 'raw' / (row['name'] + '.partial'))
    receipt = dict(manifest=row, startUtc=utc(), startMonotonic=start, status='attempt-intent-uncertain-until-result')
    durable(root / 'evidence' / (row['name'] + '.attempt.json'), receipt)
    count = 0; response = None; uncertain_read=False
    try:
        with partial.open('xb') as out:
            response = session.get(row['url'], stream=True, allow_redirects=False, timeout=(30, 30))
            durable(root/'evidence'/(row['name']+'.headers.json'),dict(utc=utc(),monotonic=time.monotonic()))
            if response.url != row['url'] or response.status_code != 200: raise ValueError('HTTP status/effective URL rejected')
            if response.headers.get('Content-Encoding', 'identity').lower() != 'identity': raise ValueError('encoding rejected')
            length = response.headers.get('Content-Length')
            if length is not None and (not length.isdecimal() or int(length) != row['bytes']): raise ValueError('Content-Length mismatch')
            while True:
                if time.monotonic() >= min(deadline, start + 600): raise ValueError('transfer deadline')
                # Read at most the first excess byte; account rejected/partial bytes too.
                remaining = min(row['bytes'] + 1 - count, 48 * MIB + 1 - count, 64 * MIB + 1 - aggregate[0])
                if remaining <= 0: raise ValueError('transfer byte ceiling')
                allowance=min(65536,remaining)
                # Reserve the entire in-flight read before blocking. A transport
                # error can consume a prefix internally without returning it.
                aggregate[0]+=allowance
                try: chunk = response.raw.read(allowance, decode_content=False)
                except Exception:
                    count+=allowance; uncertain_read=True
                    raise
                aggregate[0]-=allowance-len(chunk)
                if not chunk: break
                count += len(chunk)
                out.write(chunk)
                if count > row['bytes'] or count > 48 * MIB or aggregate[0] > 64 * MIB: raise ValueError('transfer byte ceiling')
            out.flush(); os.fsync(out.fileno())
        actual = identities(partial)
        if actual['bytes'] != row['bytes'] or actual['git'] != row['git']: raise ValueError('body identity mismatch')
        destination = safe_path(root / 'raw' / row['name'])
        if destination.exists(): raise ValueError('destination collision')
        partial.rename(destination)
        receipt.update(status='verified', identity=actual)
        return actual
    except Exception as error:
        receipt.update(status='quarantined', error=type(error).__name__ + ': ' + str(error)[:400])
        raise
    finally:
        if response is not None: response.close()
        receipt.update(endUtc=utc(), receivedBytesUpperBound=count, receivedBytesExact=None if uncertain_read else count,
                       accounting='conservative full in-flight read reservation' if uncertain_read else 'exact returned body bytes',
                       aggregateReceivedBytesUpperBound=aggregate[0], elapsedSeconds=time.monotonic()-start)
        if response is not None:
            receipt.update(httpStatus=response.status_code, effectiveUrl=response.url,
                           headers={k: str(response.headers[k])[:256] for k in ('Content-Length','Content-Encoding','Content-Type','ETag') if k in response.headers})
        durable(root / 'evidence' / (row['name'] + '.result.json'), receipt)

def inspect(path, pin):
    if identities(path) != pin: raise ValueError('input changed before inspection')
    def reject_constant(value): raise ValueError('nonfinite JSON')
    body = json.loads(path.read_text(encoding='utf-8', errors='strict'), parse_constant=reject_constant)
    if not isinstance(body, dict) or body.get('type') != 'FeatureCollection' or not isinstance(body.get('features'), list): raise ValueError('FeatureCollection required')
    features = body['features']
    if len(features) > 100000: raise ValueError('feature ceiling')
    properties = {}; geometry = {}; positions = 0
    def walk(value, depth=0):
        nonlocal positions
        if depth > 10 or not isinstance(value, list): raise ValueError('coordinate structure')
        if value and isinstance(value[0], (int, float)):
            if len(value) < 2 or any(type(n) not in (int, float) for n in value): raise ValueError('position structure')
            positions += 1
            if positions > 10000000: raise ValueError('position ceiling')
        else:
            for child in value: walk(child, depth+1)
    for feature in features:
        if not isinstance(feature, dict) or feature.get('type') != 'Feature' or not isinstance(feature.get('properties'), dict): raise ValueError('feature/properties required')
        if len(feature['properties']) > 1024: raise ValueError('property ceiling')
        for key, value in feature['properties'].items():
            if len(key) > 256: raise ValueError('property name ceiling')
            entry = properties.setdefault(key, {})
            kind = type(value).__name__; entry[kind] = entry.get(kind, 0) + 1
        geo = feature.get('geometry')
        if not isinstance(geo, dict) or geo.get('type') not in ('Polygon', 'MultiPolygon'): raise ValueError('polygon geometry required')
        kind = geo['type']; geometry[kind] = geometry.get(kind, 0) + 1
        walk(geo.get('coordinates'))
    if len(properties) > 1024: raise ValueError('property inventory ceiling')
    return dict(identity=pin, features=len(features), properties=properties, geometryTypes=geometry, positions=positions,
                status='inspection-only-mapping-review-required', mapping=None)

def fixed_session(requests):
    class FixedSession(requests.Session):
        # requests otherwise prepares Response.next by consuming redirect bodies
        # even when allow_redirects=False. Disable all redirect discovery.
        def get_redirect_target(self, response): return None
    return FixedSession()

def worker(root, requests_dir, whole_deadline):
    # Base interpreter has no site imports; only the explicitly selected installed package tree.
    sys.path.insert(0, str(safe_path(requests_dir)))
    import requests
    import urllib3
    durable(root/'evidence/transport-runtime.json',dict(requests=requests.__version__,urllib3=urllib3.__version__,requestsPath=str(Path(requests.__file__).resolve()),urllib3Path=str(Path(urllib3.__file__).resolve()),utc=utc()))
    aggregate = [0]; pins = []
    transfer_deadline = min(whole_deadline, time.monotonic()+1200)
    with fixed_session(requests) as session:
        session.trust_env = False; session.headers.clear()
        session.headers.update({'Accept-Encoding': 'identity', 'User-Agent': PACKET})
        session.auth = None; session.proxies.clear(); session.cookies.clear()
        adapter = requests.adapters.HTTPAdapter(max_retries=0)
        session.mount('https://', adapter)
        for row in FILES:
            if time.monotonic() >= transfer_deadline: raise ValueError('acquisition deadline')
            session.cookies.clear()
            pins.append(acquire_one(session, row, root, aggregate, transfer_deadline))
    durable(root/'evidence/measured-manifest.json', [dict(manifest=row, identity=pin) for row,pin in zip(FILES,pins)])
    for row,pin in zip(FILES,pins):
        if time.monotonic() >= whole_deadline: raise ValueError('inspection deadline')
        durable(root/'inspection'/(row['name']+'.json'), inspect(safe_path(root/'raw'/row['name']),pin))
    durable(root/'evidence/inspection-complete.json', dict(status='stopped-for-mapping-review', utc=utc()))

def current_memory(process=None):
    class Counters(ctypes.Structure):
        _fields_ = [('cb',wintypes.DWORD),('faults',wintypes.DWORD)] + [(n,ctypes.c_size_t) for n in ('peak','working','poolpeak','pool','nonpoolpeak','nonpool','pagefile','pagepeak','private')]
    counters=Counters(); counters.cb=ctypes.sizeof(counters)
    kernel=ctypes.WinDLL('kernel32'); kernel.GetCurrentProcess.restype=wintypes.HANDLE
    query=ctypes.WinDLL('psapi').GetProcessMemoryInfo
    query.argtypes=[wintypes.HANDLE,ctypes.c_void_p,wintypes.DWORD]
    handle=kernel.GetCurrentProcess() if process is None else wintypes.HANDLE(int(process._handle))
    if not query(handle,ctypes.byref(counters),counters.cb): raise ctypes.WinError()
    return counters.working,counters.private

def require_containment():
    """Verify limits of the actual worker Job (adapted from timeseries_sample)."""
    class Basic(ctypes.Structure):
        _fields_ = [('processTime',ctypes.c_int64),('jobTime',ctypes.c_int64),('flags',wintypes.DWORD),('minimum',ctypes.c_size_t),('maximum',ctypes.c_size_t),('active',wintypes.DWORD),('affinity',ctypes.c_size_t),('priority',wintypes.DWORD),('scheduling',wintypes.DWORD)]
    class IO(ctypes.Structure):
        _fields_ = [(n,ctypes.c_uint64) for n in ('readOps','writeOps','otherOps','readBytes','writeBytes','otherBytes')]
    class Extended(ctypes.Structure):
        _fields_ = [('basic',Basic),('io',IO),('processMemory',ctypes.c_size_t),('jobMemory',ctypes.c_size_t),('peakProcessMemory',ctypes.c_size_t),('peakJobMemory',ctypes.c_size_t)]
    kernel=ctypes.WinDLL('kernel32',use_last_error=True)
    kernel.QueryInformationJobObject.argtypes=[wintypes.HANDLE,ctypes.c_int,ctypes.c_void_p,wintypes.DWORD,ctypes.c_void_p]
    limits=Extended()
    if not kernel.QueryInformationJobObject(None,9,ctypes.byref(limits),ctypes.sizeof(limits),None): raise ValueError('verifiable worker Job required')
    if limits.basic.flags & 0x2208 != 0x2208 or limits.basic.active != 1 or not 0<limits.jobMemory<4*GIB: raise ValueError('worker Job limits rejected')

def require_handoff():
    """Require parent's live OS pipe and bounded deadline, not an argv claim."""
    if os.name!='nt': raise ValueError('Windows supervisor handoff required')
    import msvcrt
    handle=msvcrt.get_osfhandle(sys.stdin.fileno())
    kernel=ctypes.WinDLL('kernel32',use_last_error=True)
    kernel.GetNamedPipeServerProcessId.argtypes=[wintypes.HANDLE,ctypes.POINTER(wintypes.ULONG)]
    parent=wintypes.ULONG()
    if not kernel.GetNamedPipeServerProcessId(wintypes.HANDLE(handle),ctypes.byref(parent)) or parent.value!=os.getppid(): raise ValueError('supervisor-owned pipe required')
    kernel.OpenProcess.argtypes=[wintypes.DWORD,wintypes.BOOL,wintypes.DWORD]; kernel.OpenProcess.restype=wintypes.HANDLE
    kernel.WaitForSingleObject.argtypes=[wintypes.HANDLE,wintypes.DWORD]; kernel.CloseHandle.argtypes=[wintypes.HANDLE]
    process=kernel.OpenProcess(0x100000,False,parent.value)
    if not process: raise ValueError('supervisor parent unavailable')
    try:
        if kernel.WaitForSingleObject(process,0)!=258: raise ValueError('supervisor parent not live')
    finally: kernel.CloseHandle(process)
    data=json.loads(sys.stdin.buffer.read(4097))
    if not isinstance(data,dict) or set(data)!={'parentPid','packet','deadline','root','requestsDir'} or data['parentPid']!=parent.value or data['packet']!=PACKET: raise ValueError('handoff identity rejected')
    deadline=data['deadline']
    if type(deadline) not in (int,float) or not math.isfinite(deadline) or not 0<deadline-time.monotonic()<=1800: raise ValueError('handoff deadline rejected')
    require_containment()
    return data

def execute(receipt, requests_dir):
    began=time.monotonic(); deadline=began+1800
    if os.name != 'nt': raise ValueError('Windows Job required')
    if not receipt or len(receipt) > 1000: raise ValueError('owner receipt required')
    root = safe_path(ROOT)
    if root.exists(): raise ValueError('fixed root already exists; reviewed new root required')
    pins = metadata(); available = capacity()
    requests_dir = safe_path(requests_dir)
    if not (requests_dir/'requests/__init__.py').is_file(): raise ValueError('existing requests package required')
    root.mkdir()
    for name in ('raw','inspection','prepared','evidence'): (root/name).mkdir()
    durable(root/'evidence/authorization.json', dict(packet=PACKET, ownerReceipt=receipt, utc=utc(), root=str(root), metadata=pins, capacity=available, python=sys.version, executable=sys.executable, requestsDir=str(requests_dir), manifest=FILES))
    durable(root/'evidence/frozen-request-ledger.json', dict(attempts=FILES, maximumAttempts=2, noRetry=True))
    parent_rss,parent_commit=current_memory()
    job=None; process=None; reason=None; peak_rss=peak_disk=peak_commit=0
    try:
        job=WindowsJob(4*GIB-parent_commit-64*MIB,1)
        # -I -S avoids inherited Python path/site hooks. Bootstrap adds only this source directory.
        bootstrap="import sys,runpy;sys.path.insert(0,sys.argv[1]);sys.argv=sys.argv[2:];runpy.run_path(sys.argv[0],run_name='__main__')"
        command=[getattr(sys,'_base_executable',sys.executable),'-I','-S','-B','-c',bootstrap,str(Path(__file__).parent),str(Path(__file__).resolve()),'--worker']
        env={k:v for k,v in os.environ.items() if k.upper() in ('SYSTEMROOT','WINDIR','PATH')}
        env.update(TEMP=str(root),TMP=str(root),PYTHONDONTWRITEBYTECODE='1')
        process=subprocess.Popen(command,cwd=root,env=env,creationflags=0x4,stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL,stdin=subprocess.PIPE)
        job.assign_resume(process)
        process.stdin.write(json.dumps(dict(parentPid=os.getpid(),packet=PACKET,deadline=deadline,root=str(root),requestsDir=str(requests_dir))).encode())
        process.stdin.close()
        while True:
            size=0; categories={name:0 for name in ('raw','inspection','prepared','evidence')}
            for parent, dirs, files in os.walk(root,followlinks=False):
                for name in dirs+files:
                    item=safe_path(Path(parent)/name)
                    if item.is_file():
                        try: amount=item.stat().st_size
                        except FileNotFoundError:
                            # The sole worker renames only .partial to its fixed final.
                            # Count the final immediately rather than dropping its bytes.
                            if item.parent!=root/'raw' or not item.name.endswith('.partial'): raise
                            replacement=safe_path(item.with_suffix(''))
                            if replacement.name not in {r['name'] for r in FILES}: raise
                            amount=replacement.stat().st_size
                        size+=amount
                        category=item.relative_to(root).parts[0]
                        if category in categories: categories[category]+=amount
            if any(categories[k]>v*MIB for k,v in dict(raw=64,inspection=32,prepared=128,evidence=32).items()): raise ValueError('category disk ceiling')
            parent_rss,parent_now_commit=current_memory()
            _,worker_commit=current_memory(process)
            peak_commit=max(peak_commit,parent_now_commit+worker_commit)
            if parent_now_commit>parent_commit+64*MIB: raise ValueError('parent commit allowance')
            peak_disk=max(peak_disk,size); peak_rss=max(peak_rss,rss_bytes(process)+parent_rss)
            if size > 256*MIB or peak_rss > 2*GIB: raise ValueError('disk/RSS ceiling')
            if shutil.disk_usage(root).free < 2*GIB: raise ValueError('free disk reserve')
            if time.monotonic() >= deadline: raise ValueError('whole-run deadline')
            for row in FILES:
                attempt=root/'evidence'/(row['name']+'.attempt.json')
                result=root/'evidence'/(row['name']+'.result.json')
                if attempt.exists() and not result.exists():
                    # Creation/fsync may be observed mid-write: fail closed once readable.
                    try: intent=json.loads(attempt.read_text())
                    except json.JSONDecodeError: continue
                    if not (root/'evidence'/(row['name']+'.headers.json')).exists() and time.monotonic()-intent['startMonotonic']>=30: raise ValueError('parent connect/headers deadline')
                    if time.monotonic()-intent['startMonotonic']>=600: raise ValueError('parent GET deadline')
            if not (root/'evidence/measured-manifest.json').exists() and time.monotonic()-began>=1200: raise ValueError('parent acquisition deadline')
            if process.poll() is not None: break
            time.sleep(.02)
        if process.returncode: raise ValueError('worker failed; retained attempt evidence may be uncertain')
    except Exception as error: reason=type(error).__name__+': '+str(error)[:400]
    finally:
        try:
            if process is not None and process.poll() is None:
                # Assignment can fail with the child still suspended outside Job.
                # Kill that exact child as well as the Job, then wait for exit.
                try:
                    if job is not None: job.stop()
                finally:
                    if process.poll() is None: process.kill()
                    process.wait(timeout=3)
            if job is not None: job.drain(timeout=3)
        finally:
            if job is not None: job.close()
            if process is not None:
                if process.stdin is not None: process.stdin.close()
                process._handle.Close()
        durable(root/'evidence/supervisor.json',dict(status='quarantined' if reason else 'stopped-for-mapping-review', reason=reason, peakTreeRss=peak_rss, peakSampledTreePrivateCommit=peak_commit, peakDisk=peak_disk, elapsedSeconds=time.monotonic()-began, exitCode=process.returncode if process else None, enforcement='hard job commit below 4 GiB minus parent allowance / one worker; sampled tree RSS/commit and disk 20ms; parent deadline and job kill/drain', utc=utc()))
    return 1 if reason else 0

def main():
    parser=argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--execute',action='store_true'); parser.add_argument('--approval-packet'); parser.add_argument('--owner-receipt'); parser.add_argument('--requests-dir')
    parser.add_argument('--worker',action='store_true',help=argparse.SUPPRESS)
    args=parser.parse_args()
    if args.worker:
        # Worker is only admitted when its fixed fresh root contains the parent's receipt.
        handoff=require_handoff()
        root=safe_path(handoff['root'])
        if root != safe_path(ROOT) or not (root/'evidence/authorization.json').is_file(): raise ValueError('supervised worker required')
        try: worker(root,handoff['requestsDir'],handoff['deadline']); return 0
        except Exception as error:
            durable(root/'evidence/worker-failure.json',dict(error=type(error).__name__+': '+str(error)[:400],utc=utc()))
            return 1
    if not args.execute:
        print(json.dumps(dict(mode='offline-plan',packet=PACKET,root=str(ROOT),manifest=FILES),indent=2)); return 0
    if args.approval_packet != PACKET or not args.requests_dir: parser.error('fixed approval packet, owner receipt and requests directory required')
    return execute(args.owner_receipt,args.requests_dir)

if __name__ == '__main__':
    sys.exit(main())
