"""Finite offline measurement of an explicitly supplied pinned raw manifest.

Uses the existing Windows Job supervisor and configured bridge. No acquisition.
The caller must coordinate one active heavy job and inventory retained data first.
"""
import argparse
from collections import Counter, defaultdict
from contextlib import closing
import ctypes
from ctypes import wintypes
import hashlib
import json
import os
from pathlib import Path
import shutil
import sqlite3
import sys
import time
# Future invocations: suppress owning-module bytecode outside counted job roots.
sys.dont_write_bytecode = True
import global_source_supervisor as supervisor
from global_source import canonical, manifest_revision, validate_manifest

UNKNOWN_CLIP={'coverage':'unknown','status':'no retained extraction polygon admitted','purpose':'local producer measurement only; not an extraction geometry pin'}

def sizes(root):
    result=dict(sqliteBytes=0,journalBytes=0,otherBytes=0,totalBytes=0)
    for path in Path(root).rglob('*'):
        try:
            if not path.is_file(): continue
            size=path.stat().st_size
        except FileNotFoundError: continue
        key='sqliteBytes' if path.name.endswith('.sqlite') else 'journalBytes' if path.name.endswith(('-journal','-wal','-shm')) else 'otherBytes'
        result[key]+=size; result['totalBytes']+=size
    return result

def summarize(root):
    categories=Counter(); exclusions=defaultdict(Counter); count=nonempty=0
    with (Path(root)/'candidates.jsonl').open(encoding='utf8') as rows:
        for line in rows:
            row=json.loads(line); count+=1; categories[row['category']]+=1
            nonempty+=bool(row['regionIds'])
    with (Path(root)/'exclusions.jsonl').open(encoding='utf8') as rows:
        for line in rows:
            row=json.loads(line); exclusions[row['source']][row['reason']]+=1
    return dict(candidateRows=count,categoryRows=dict(categories),nonemptyRegionRows=nonempty,exclusionsBySource={k:dict(v) for k,v in exclusions.items()})

def job_accounting(job):
    class Basic(ctypes.Structure):
        _fields_=[(n,ctypes.c_int64) for n in ('user','kernel','periodUser','periodKernel')]+[(n,wintypes.DWORD) for n in ('faults','total','active','terminated')]
    class IO(ctypes.Structure):
        _fields_=[(n,ctypes.c_uint64) for n in ('readOps','writeOps','otherOps','readBytes','writeBytes','otherBytes')]
    class Both(ctypes.Structure): _fields_=[('basic',Basic),('io',IO)]
    class Limits(ctypes.Structure):
        _fields_=[('processTime',ctypes.c_int64),('jobTime',ctypes.c_int64),('flags',wintypes.DWORD),('minimum',ctypes.c_size_t),('maximum',ctypes.c_size_t),('active',wintypes.DWORD),('affinity',ctypes.c_size_t),('priority',wintypes.DWORD),('scheduling',wintypes.DWORD)]
    class Extended(ctypes.Structure):
        _fields_=[('basic',Limits),('io',IO)]+[(n,ctypes.c_size_t) for n in ('processMemory','jobMemory','peakProcessMemory','peakJobMemory')]
    job.kernel.QueryInformationJobObject.argtypes=[wintypes.HANDLE,ctypes.c_int,ctypes.c_void_p,wintypes.DWORD,ctypes.c_void_p]
    job.kernel.QueryInformationJobObject.restype=wintypes.BOOL
    both=Both(); extended=Extended()
    for kind,value in ((8,both),(9,extended)):
        if not job.kernel.QueryInformationJobObject(job.handle,kind,ctypes.byref(value),ctypes.sizeof(value),None): raise ctypes.WinError(ctypes.get_last_error())
    return dict(jobUserCpuSeconds=both.basic.user/1e7,jobKernelCpuSeconds=both.basic.kernel/1e7,peakJobCommitBytes=extended.peakJobMemory,jobReadTransferBytes=both.io.readBytes,jobWriteTransferBytes=both.io.writeBytes)

def measure(manifest_path, root, *, python=None, wall_seconds=600, free_bytes=96*1024**3):
    """New paths only. Source and metadata preflight precedes supervised stages."""
    if type(wall_seconds) is not int or not 1<=wall_seconds<=1800: raise ValueError('measurement deadline must be 1..1800 seconds')
    root=supervisor.safe_path(root)
    if root.exists(): raise FileExistsError(root)
    manifest_path=supervisor.safe_path(manifest_path)
    if manifest_path.stat().st_size>1024*1024: raise ValueError('manifest byte limit')
    manifest=validate_manifest(json.loads(manifest_path.read_text(encoding='utf8')))
    if len({s['vintage'] for s in manifest['sources']})!=1: raise ValueError('measurement edition requires coherent native vintages')
    if manifest['limits']['seconds']>wall_seconds: raise ValueError('producer exceeds shared deadline')
    # Leave one GiB for new writes; a separate preflight inventory counts existing retained data.
    if shutil.disk_usage(root.parent).free<free_bytes+1024**3: raise ValueError('preflight reserve plus allocation')
    controls=root.with_name(root.name+'-controls')
    if controls.exists(): raise FileExistsError(controls)
    controls.mkdir()
    regions=controls/'regions.jsonl'; footprints=controls/'footprints.jsonl'
    regions.write_bytes(b''); footprints.write_bytes(b'')
    empty=dict(bytes=0,sha256=hashlib.sha256(b'').hexdigest())
    config=dict(schemaVersion=1,catalogueRevision=manifest_revision(manifest),stream=dict(maxRowBytes=65536,maxBytes=64*1024**2,maxRows=100000),catalogue=dict(chunkRows=1000,mergeFanIn=8,maxRows=1000,fanout=128,maxInputRows=100000,maxMetadataRows=10000,maxInputBytes=64*1024**2,maxOutputBytes=64*1024**2,maxScratchBytes=64*1024**2,timeoutMs=120000),files=dict(regions=empty,footprints=empty))
    config_path=controls/'build.json'; config_path.write_text(canonical(config),encoding='utf8')
    config_hash=hashlib.sha256(config_path.read_bytes()).hexdigest()
    fixed=sum(Path(s['path']).stat().st_size for s in manifest['sources'])+manifest_path.stat().st_size+config_path.stat().st_size
    limits=dict(wallSeconds=wall_seconds,rssBytes=1024**3,commitBytes=2*1024**3,diskBytes=fixed+1024**3,freeBytes=free_bytes,maxProcesses=2)
    (controls/'plan.json').write_text(canonical(dict(limits=limits,coverage='unknown; empty regions and footprints',newWriteCeilingBytes=1024**3,sourcePins=[{k:v for k,v in s.items() if k!='path'} for s in manifest['sources']])),encoding='utf8')
    metrics=[]; peaks=dict(sqliteBytes=0,journalBytes=0,otherBytes=0,totalBytes=0)
    original_job=supervisor.WindowsJob; original_rss=supervisor.rss_bytes
    class MeasuredJob(original_job):
        def close(self):
            if self.handle:
                try: metrics.append(job_accounting(self))
                finally: super().close()
    def sample(process):
        for k,v in sizes(root).items(): peaks[k]=max(peaks[k],v)
        return original_rss(process)
    supervisor.WindowsJob=MeasuredJob; supervisor.rss_bytes=sample
    began=time.monotonic()
    old_tsx_cache = os.environ.get("TSX_DISABLE_CACHE")
    os.environ["TSX_DISABLE_CACHE"] = "1"
    try:
        report=supervisor.pipeline(manifest_path,root,regions,footprints,limits,python=python,build_config=config_path,build_config_sha256=config_hash)
    finally:
        supervisor.WindowsJob=original_job; supervisor.rss_bytes=original_rss
        if old_tsx_cache is None: os.environ.pop("TSX_DISABLE_CACHE", None)
        else: os.environ["TSX_DISABLE_CACHE"] = old_tsx_cache
    result=dict(schemaVersion=1,status=report['status'],supervisor=report,jobStageMetrics=metrics,sampledFilePeaks=peaks,finalFileBytes=sizes(root),coverage='unknown; no regions or extraction footprints admitted',networkRequests=0,runtimeInstalled=False,cacheState='uncontrolled; no cold-read guarantee',backgroundHostLoad='uncontrolled',hashPassSeconds=None,hashPassNote='included within producer/bridge wall; not separately instrumented',ioNote='Windows Job transfer counters include cached and metadata I/O; not physical raw-source read volume',measurementWallSeconds=round(time.monotonic()-began,3))
    if report['status']=='complete':
        result['normalized']=summarize(root/'normalized')
        database=(root/'normalized/scratch.sqlite').as_uri()+'?mode=ro'
        with closing(sqlite3.connect(database,uri=True)) as db:
            result['sqliteRows']={table:db.execute('SELECT count(*) FROM '+table).fetchone()[0] for table in ('nodes','candidates','lineage','exclusions')}
        result['nodeCountNote']='nodes is final source table only; each source clears it before loading'
    (controls/'measurement.json').write_text(canonical(result)+'\n',encoding='utf8')
    return result

if __name__=='__main__':
    parser=argparse.ArgumentParser(description=__doc__); parser.add_argument('manifest'); parser.add_argument('root'); parser.add_argument('--python'); parser.add_argument('--seconds',type=int,default=600); args=parser.parse_args()
    result=measure(args.manifest,args.root,python=args.python,wall_seconds=args.seconds)
    print(canonical(result)); sys.exit(0 if result['status']=='complete' else 1)
