"""Offline sequential Windows Job supervisor; no acquisition or runtime installation.
OS primitives adapted verbatim from retained_experiment.WindowsJob and bounded_nodes.rss_bytes,
kept here dependency-free so synthetic XML does not require optional pyosmium.
"""
import math
import hashlib
import re
import ctypes
from ctypes import wintypes
import json
import os
from pathlib import Path
import shutil
import subprocess
import sys
import time
from global_source import canonical
from spot_paths import safe_path

class WindowsJob:
    """Single-process job prevents untracked children and kills on close."""
    def __init__(self, memory_bytes, max_processes):
        if os.name != 'nt': raise RuntimeError('Windows-only experiment supervisor')
        class Basic(ctypes.Structure):
            _fields_ = [('processTime', ctypes.c_int64), ('jobTime', ctypes.c_int64), ('flags', wintypes.DWORD), ('minimum', ctypes.c_size_t), ('maximum', ctypes.c_size_t), ('active', wintypes.DWORD), ('affinity', ctypes.c_size_t), ('priority', wintypes.DWORD), ('scheduling', wintypes.DWORD)]
        class IO(ctypes.Structure):
            _fields_ = [(name, ctypes.c_uint64) for name in ('readOps','writeOps','otherOps','readBytes','writeBytes','otherBytes')]
        class Extended(ctypes.Structure):
            _fields_ = [('basic', Basic), ('io', IO), ('processMemory', ctypes.c_size_t), ('jobMemory', ctypes.c_size_t), ('peakProcessMemory', ctypes.c_size_t), ('peakJobMemory', ctypes.c_size_t)]
        self.kernel = ctypes.WinDLL('kernel32', use_last_error=True)
        self.kernel.CreateJobObjectW.argtypes = [ctypes.c_void_p, wintypes.LPCWSTR]
        self.kernel.CreateJobObjectW.restype = wintypes.HANDLE
        self.kernel.SetInformationJobObject.argtypes = [wintypes.HANDLE, ctypes.c_int, ctypes.c_void_p, wintypes.DWORD]
        self.kernel.AssignProcessToJobObject.argtypes = [wintypes.HANDLE, wintypes.HANDLE]
        self.kernel.TerminateJobObject.argtypes = [wintypes.HANDLE, wintypes.UINT]
        self.kernel.CloseHandle.argtypes = [wintypes.HANDLE]
        self.handle = self.kernel.CreateJobObjectW(None, None)
        if not self.handle: raise ctypes.WinError(ctypes.get_last_error())
        limits = Extended()
        # ACTIVE_PROCESS (0x8), JOB_MEMORY (0x200), KILL_ON_CLOSE (0x2000).
        limits.basic.flags = 0x8 | 0x200 | 0x2000
        limits.basic.active = max_processes
        limits.jobMemory = memory_bytes
        if not self.kernel.SetInformationJobObject(self.handle, 9, ctypes.byref(limits), ctypes.sizeof(limits)):
            self.close()
            raise ctypes.WinError(ctypes.get_last_error())

    def assign_resume(self, process):
        if not self.kernel.AssignProcessToJobObject(self.handle, wintypes.HANDLE(int(process._handle))):
            raise ctypes.WinError(ctypes.get_last_error())
        resume = ctypes.WinDLL('ntdll').NtResumeProcess
        resume.argtypes = [wintypes.HANDLE]
        resume.restype = ctypes.c_long
        if resume(wintypes.HANDLE(int(process._handle))) != 0: raise RuntimeError('cannot resume assigned worker')

    def stop(self):
        if not self.kernel.TerminateJobObject(self.handle, 1): raise ctypes.WinError(ctypes.get_last_error())

    def drain(self, timeout=3):
        class Accounting(ctypes.Structure):
            _fields_ = [(name, ctypes.c_int64) for name in ('user','kernel','periodUser','periodKernel')] + [(name,wintypes.DWORD) for name in ('faults','total','active','terminated')]
        self.kernel.QueryInformationJobObject.argtypes = [wintypes.HANDLE, ctypes.c_int, ctypes.c_void_p, wintypes.DWORD, ctypes.c_void_p]
        deadline = time.monotonic()+timeout
        while True:
            accounting = Accounting()
            if not self.kernel.QueryInformationJobObject(self.handle, 1, ctypes.byref(accounting), ctypes.sizeof(accounting), None):
                raise ctypes.WinError(ctypes.get_last_error())
            if accounting.active == 0: return
            if time.monotonic() >= deadline: raise RuntimeError('job did not drain within cleanup deadline')
            time.sleep(.01)

    def close(self):
        if self.handle:
            self.kernel.CloseHandle(self.handle)
            self.handle = None

def wait_for_directory_release(folder, timeout=3):
    # A signalled terminated process can still briefly retain its cwd handle.
    # Request DELETE access without deleting: success proves compatible sharing.
    kernel = ctypes.WinDLL('kernel32', use_last_error=True)
    kernel.CreateFileW.argtypes = [wintypes.LPCWSTR, wintypes.DWORD, wintypes.DWORD, ctypes.c_void_p, wintypes.DWORD, wintypes.DWORD, wintypes.HANDLE]
    kernel.CreateFileW.restype = wintypes.HANDLE
    kernel.CloseHandle.argtypes = [wintypes.HANDLE]
    deadline = time.monotonic()+timeout
    while True:
        handle = kernel.CreateFileW(str(folder), 0x10000, 7, None, 3, 0x02000000, None)
        if handle != ctypes.c_void_p(-1).value:
            kernel.CloseHandle(handle)
            return
        error = ctypes.get_last_error()
        if error != 32 or time.monotonic() >= deadline: raise ctypes.WinError(error)
        time.sleep(.01)

def rss_bytes(process):
    if os.name != 'nt':
        # Linux build machines expose peak/current resident memory via procfs.
        # Exit can race the poll; no further growth is possible after exit.
        try:
            with open(f'/proc/{process.pid}/status', encoding='ascii') as status:
                values = {line.split(':', 1)[0]: int(line.split()[1]) * 1024
                          for line in status if line.startswith(('VmHWM:', 'VmRSS:'))}
        except FileNotFoundError:
            if process.poll() is not None: return 0
            raise RuntimeError('Linux process memory accounting unavailable')
        if not values:
            if process.poll() is not None: return 0
            raise RuntimeError('Linux process memory accounting unavailable')
        return max(values.values())
    class Counters(ctypes.Structure):
        _fields_ = [('cb', wintypes.DWORD), ('faults', wintypes.DWORD)] + [(name, ctypes.c_size_t) for name in ('peak', 'working', 'poolpeak', 'pool', 'nonpoolpeak', 'nonpool', 'pagefile', 'pagepeak')]
    counters = Counters()
    counters.cb = ctypes.sizeof(counters)
    query = ctypes.WinDLL('psapi').GetProcessMemoryInfo
    query.argtypes = [wintypes.HANDLE, ctypes.c_void_p, wintypes.DWORD]
    query.restype = wintypes.BOOL
    if not query(wintypes.HANDLE(int(process._handle)), ctypes.byref(counters), counters.cb):
        raise ctypes.WinError()
    return counters.peak


def supervise(commands, root, limits, *, retained=()):
    """One job, sequential single-process stages. Disk/RSS are sampled, commit hard capped.

    commands are explicit local argv lists, never a shell. The caller must include
    every source, metadata, rollback and failure directory in retained/root.
    No supported-platform fallback silently drops OS enforcement.
    """
    keys={'wallSeconds','rssBytes','commitBytes','diskBytes','freeBytes','maxProcesses'}
    if set(limits)!=keys or any(type(n) is not int or n<(0 if k=='freeBytes' else 1) for k,n in limits.items()): raise ValueError('explicit supervisor limits required')
    if limits['wallSeconds']>172800 or limits['rssBytes']>limits['commitBytes'] or limits['maxProcesses']>4: raise ValueError('unsupported supervisor limits')
    if os.name!='nt': raise RuntimeError('Windows Job supervisor only; unsupported platform refuses execution')
    if not commands or len(commands)>8 or any(not isinstance(c,list) or not c or any(not isinstance(v,str) for v in c) for c in commands): raise ValueError('bounded explicit stage argv required')
    root=safe_path(root)
    retained=[safe_path(p) for p in retained]
    if any(p==root or p.is_relative_to(root) or root.is_relative_to(p) for p in retained): raise ValueError('overlapping retained/root accounting')
    if len(set(retained))!=len(retained): raise ValueError('duplicate retained accounting')
    for i,p in enumerate(retained):
        if any(p.is_relative_to(q) or q.is_relative_to(p) for q in retained[:i]): raise ValueError('overlapping retained accounting')
    began=time.monotonic(); peak_disk=peak_rss=0; stages=[]; reason=None
    def check():
        nonlocal peak_disk
        size=0
        for p in [root,*retained]:
            p=safe_path(p)
            if not p.exists(): continue
            if p.is_file(): size+=p.stat().st_size; continue
            for parent,dirs,files in os.walk(p,followlinks=False):
                for name in dirs+files:
                    item=safe_path(Path(parent)/name)
                    try:
                        if item.is_file(): size+=item.stat().st_size
                    except FileNotFoundError:
                        pass  # SQLite may remove a rollback journal between enumeration and stat.
        peak_disk=max(size,peak_disk)
        if size>limits['diskBytes']: raise ValueError('whole-job disk limit')
        if shutil.disk_usage(root if root.exists() else root.parent).free<limits['freeBytes']: raise ValueError('whole-job reserve limit')
        if time.monotonic()-began>=limits['wallSeconds']: raise ValueError('whole-job deadline limit')
    check()
    root.mkdir()
    try:
        check()
        for index,command in enumerate(commands):
            stage_began=time.monotonic()
            stage=dict(stage=index,exitCode=None,elapsedSeconds=0);stages.append(stage)
            check()
            job=WindowsJob(limits['commitBytes'],limits['maxProcesses']); process=None
            try:
                environment=dict(os.environ,PYTHONDONTWRITEBYTECODE='1',TEMP=str(root),TMP=str(root),SQLITE_TMPDIR=str(root))
                with (root/f'stage-{index}.stdout').open('xb') as stdout, (root/f'stage-{index}.stderr').open('xb') as stderr:
                    process=subprocess.Popen(command,cwd=root,env=environment,creationflags=0x4,stdout=stdout,stderr=stderr)
                    job.assign_resume(process)
                    while True:
                        check(); peak_rss=max(peak_rss,rss_bytes(process))
                        if peak_rss>limits['rssBytes']: raise ValueError('whole-job RSS limit')
                        if process.poll() is not None: break
                        time.sleep(.02)
                    if process.returncode: raise ValueError('stage failed: '+str(process.returncode))
                    stage['exitCode']=process.returncode
            finally:
                try:
                    if process is not None and process.poll() is None:
                        job.stop(); process.wait(timeout=3)
                    job.drain(timeout=3)
                finally:
                    job.close()
                    if process is not None: process._handle.Close()
                try: wait_for_directory_release(root,timeout=3)
                finally:
                    stage['elapsedSeconds']=round(time.monotonic()-stage_began,3)
                    stage['exitCode']=process.returncode if process else None
        check()
    except Exception as error: reason=str(error)[:1000]
    report=dict(status='bounded-stop' if reason else 'complete',reason=reason,stages=stages,elapsedSeconds=round(time.monotonic()-began,3),peakRssBytes=peak_rss,peakLogicalBytes=peak_disk,limits=limits,
                enforcement='Windows Job hard tree commit and active-process ceiling; sampled main RSS/disk/reserve at 20ms; shared deadline for all stages',platform=sys.platform)
    payload=(canonical(report)+'\n').encode()
    # A reporting failure cannot create a success marker.
    if peak_disk+len(payload)>limits['diskBytes']: raise ValueError('report disk limit; evidence retained')
    with (root/'job-report.json').open('xb') as f: f.write(payload)
    if not reason:
        check()
        marker=b'{"status":"complete"}\n'
        if peak_disk+len(marker)>limits['diskBytes']: raise ValueError('completion disk limit')
        with (root/'job-complete.json').open('xb') as f: f.write(marker)
    return report


def load_build_config(path, sha256):
    """Mirror the bridge strict v1 controls before any job/output creation."""
    path=safe_path(path)
    if not isinstance(sha256,str) or not re.fullmatch('[a-f0-9]{64}',sha256): raise ValueError('build config digest required')
    with path.open('rb') as handle:
        initial=os.fstat(handle.fileno()); body=handle.read(65537); final=os.fstat(handle.fileno())
    if len(body)>65536 or initial.st_size!=len(body) or (initial.st_size,initial.st_mtime_ns)!=(final.st_size,final.st_mtime_ns): raise ValueError('build config size/mutation')
    if hashlib.sha256(body).hexdigest()!=sha256: raise ValueError('build config digest mismatch')
    def integer_number(token):
        # JSON has one number type. Match JavaScript's finite safe integer
        # semantics for integral decimal/exponent spellings, while excluding
        # booleans through the existing exact-type checks below.
        number=float(token)
        if not math.isfinite(number) or not number.is_integer() or abs(number)>9007199254740991:
            raise ValueError('finite safe integral build config number required')
        return int(number)
    def invalid_constant(token):
        raise ValueError('nonfinite build config number refused')
    config=json.loads(body,parse_int=integer_number,parse_float=integer_number,parse_constant=invalid_constant)
    def exact(value, keys):
        if not isinstance(value,dict) or set(value)!=set(keys): raise ValueError('unknown/missing build config fields')
    exact(config,('schemaVersion','catalogueRevision','stream','catalogue','files'))
    if type(config['schemaVersion']) is not int or config['schemaVersion']!=1: raise ValueError('build config version')
    ceilings={'stream':dict(maxRowBytes=4*1024**2,maxBytes=10*1024**3,maxRows=10000000), 'catalogue':dict(chunkRows=10000,mergeFanIn=16,maxRows=10000,fanout=256,maxInputRows=10000000,maxMetadataRows=10000,maxInputBytes=10*1024**3,maxOutputBytes=10*1024**3,maxScratchBytes=10*1024**3,timeoutMs=1800000)}
    for section, caps in ceilings.items():
        values=config[section]
        if not isinstance(values,dict) or set(values)-set(caps): raise ValueError('unknown build controls')
        for key,value in values.items():
            if type(value) is not int or not (2 if key in ('mergeFanIn','fanout') else 1)<=value<=caps[key]: raise ValueError('invalid '+key)
    if not isinstance(config['catalogueRevision'],str) or not 1<=len(config['catalogueRevision'].strip())<=100: raise ValueError('invalid catalogueRevision')
    config['catalogueRevision']=config['catalogueRevision'].strip()
    exact(config['files'],('regions','footprints'))
    for pin in config['files'].values():
        exact(pin,('bytes','sha256'))
        if type(pin['bytes']) is not int or not 0<=pin['bytes']<=10*1024**3 or not isinstance(pin['sha256'],str) or not re.fullmatch('[a-f0-9]{64}',pin['sha256']): raise ValueError('invalid metadata pin')
    return config

def verify_metadata_pin(path, pin, stream):
    maximum=stream.get('maxBytes',128*1024**2)
    if path.stat().st_size!=pin['bytes'] or pin['bytes']>maximum: raise ValueError('metadata size/pin limit')
    digest=hashlib.sha256()
    with path.open('rb') as handle:
        initial=os.fstat(handle.fileno())
        for chunk in iter(lambda:handle.read(65536),b''): digest.update(chunk)
        final=os.fstat(handle.fileno())
    if (initial.st_size,initial.st_mtime_ns)!=(final.st_size,final.st_mtime_ns) or digest.hexdigest()!=pin['sha256']: raise ValueError('metadata mutation/digest mismatch')

def pipeline(manifest_path, root, regions, footprints, limits, *, node='node', python=None, build_config=None, build_config_sha256=None):
    """Complete local raw → normalized → paged stages under one deadline/accounting."""
    from global_source import validate_manifest
    manifest_path=safe_path(manifest_path); root=safe_path(root); regions=safe_path(regions); footprints=safe_path(footprints)
    if manifest_path.stat().st_size>1024*1024: raise ValueError('manifest byte limit')
    m=validate_manifest(json.loads(manifest_path.read_text(encoding='utf8')))
    retained_config=[]; bridge_controls=[]
    if (build_config is None)!=(build_config_sha256 is None): raise ValueError('config path and digest required together')
    if build_config is not None:
        from global_source import manifest_revision
        config=load_build_config(build_config,build_config_sha256)
        if config['catalogueRevision']!=manifest_revision(m): raise ValueError('build config revision mismatch')
        verify_metadata_pin(regions,config['files']['regions'],config['stream'])
        verify_metadata_pin(footprints,config['files']['footprints'],config['stream'])
        retained_config=[safe_path(build_config)]
        bridge_controls=['--config',str(retained_config[0]),build_config_sha256]
    scripts=Path(__file__).resolve().parent
    commands=[[python or getattr(sys,'_base_executable',sys.executable),str(scripts/'global_source.py'),str(manifest_path),str(root/'normalized')],
              [node,'--import',(scripts.parents[1]/'node_modules'/'tsx'/'dist'/'loader.mjs').as_uri(),str(scripts/'build-source-catalogue.ts'),str(root/'normalized'),str(regions),str(footprints),str(root/'catalogue'),*bridge_controls]]
    return supervise(commands,root,limits,retained=[manifest_path,regions,footprints,*retained_config,*[safe_path(s['path']) for s in m['sources']]])


if __name__=='__main__':
    import argparse
    p=argparse.ArgumentParser(description=__doc__);p.add_argument('manifest');p.add_argument('root');p.add_argument('regions');p.add_argument('footprints');p.add_argument('limits');p.add_argument('--config',nargs=2,metavar=('FILE','SHA256'));a=p.parse_args()
    limit_path=safe_path(a.limits)
    if limit_path.stat().st_size>4096: raise ValueError('limits byte cap')
    result=pipeline(a.manifest,a.root,a.regions,a.footprints,json.loads(limit_path.read_text()),build_config=a.config[0] if a.config else None,build_config_sha256=a.config[1] if a.config else None)
    sys.exit(0 if result['status']=='complete' else 1)
