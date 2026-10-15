"""Windows external process monitor for the retained-history experiment (stdlib only).

Only fixed offline replay/pipeline commands are launched. Windows Job enforces
512 MiB tree commit and two active processes; main RSS/disk/deadline are sampled.
"""
import argparse
import ctypes
from ctypes import wintypes
import json
import os
import hashlib
import platform
from pathlib import Path
import shutil
import subprocess
import sys
import time

sys.dont_write_bytecode = True
sys.path.insert(0, str(Path(__file__).resolve().parents[1]/'osm'))
from global_source_supervisor import WindowsJob, rss_bytes


def tree_bytes(root):
    total = 0
    def walk_error(error):
        raise error
    for directory, _, files in os.walk(root, onerror=walk_error):
        for name in files:
            try: total += (Path(directory)/name).stat().st_size
            except FileNotFoundError: pass  # Normal atomic producer temp-file rename/unlink.
    return total


def snapshot(output):
    class Memory(ctypes.Structure):
        _fields_ = [('length',wintypes.DWORD),('load',wintypes.DWORD)]+[(n,ctypes.c_ulonglong) for n in ['totalPhysical','availablePhysical','totalPageFile','availablePageFile','totalVirtual','availableVirtual','availableExtendedVirtual']]
    memory = Memory(); memory.length = ctypes.sizeof(memory)
    if not ctypes.windll.kernel32.GlobalMemoryStatusEx(ctypes.byref(memory)): raise OSError('Cannot measure available memory')
    disk = shutil.disk_usage(output)
    return {'unixTime':time.time(),'freeDiskBytes':disk.free,'totalDiskBytes':disk.total,'physicalMemoryTotalBytes':memory.totalPhysical,'physicalMemoryAvailableBytes':memory.availablePhysical,'logicalProcessors':__import__('os').cpu_count(),'scope':'Snapshot only; resources are not reserved'}


def job_peak_commit(job):
    class Basic(ctypes.Structure):
        _fields_ = [('processTime',ctypes.c_int64),('jobTime',ctypes.c_int64),('flags',wintypes.DWORD),('minimum',ctypes.c_size_t),('maximum',ctypes.c_size_t),('active',wintypes.DWORD),('affinity',ctypes.c_size_t),('priority',wintypes.DWORD),('scheduling',wintypes.DWORD)]
    class IO(ctypes.Structure):
        _fields_ = [(n,ctypes.c_uint64) for n in ['readOps','writeOps','otherOps','readBytes','writeBytes','otherBytes']]
    class Extended(ctypes.Structure):
        _fields_ = [('basic',Basic),('io',IO),('processMemory',ctypes.c_size_t),('jobMemory',ctypes.c_size_t),('peakProcessMemory',ctypes.c_size_t),('peakJobMemory',ctypes.c_size_t)]
    counters = Extended()
    job.kernel.QueryInformationJobObject.argtypes = [wintypes.HANDLE,ctypes.c_int,ctypes.c_void_p,wintypes.DWORD,ctypes.c_void_p]
    if not job.kernel.QueryInformationJobObject(job.handle,9,ctypes.byref(counters),ctypes.sizeof(counters),None): raise ctypes.WinError(ctypes.get_last_error())
    return counters.peakJobMemory


def monitor(command, output, deadline, memory_limit, prior=None):
    if shutil.disk_usage(output).free < 96*1024**3:
        raise ValueError('Shared disk reserve below 96 GiB')
    started = time.perf_counter(); peak = 0; tree_commit = 0; reason = None
    stdout_path, stderr_path = output/'child-stdout.json', output/'child-stderr.txt'
    environment = dict(os.environ, PYTHONDONTWRITEBYTECODE='1', PYTHONPATH=str(Path(sys.prefix)/'Lib/site-packages'), OPENBLAS_NUM_THREADS='1', OMP_NUM_THREADS='1', MKL_NUM_THREADS='1', NUMEXPR_NUM_THREADS='1', TSX_DISABLE_CACHE='1', TEMP=str(output.parent/'tmp'), TMP=str(output.parent/'tmp'), TMPDIR=str(output.parent/'tmp'))
    job = WindowsJob(512*1024*1024, 2); child = None
    try:
        with stdout_path.open('x', encoding='utf-8') as out, stderr_path.open('x', encoding='utf-8') as err:
            child = subprocess.Popen(command, stdout=out, stderr=err, env=environment, creationflags=0x4)
            job.assign_resume(child)
            while True:
                peak = max(peak, rss_bytes(child))
                tree_commit = max(tree_commit, job_peak_commit(job))
                size = tree_bytes(output.parent)+(tree_bytes(prior) if prior else 0)
                if time.time() >= deadline: reason = 'batch deadline'
                elif peak > memory_limit: reason = 'main RSS ceiling'
                elif size > 512*1024*1024: reason = 'new output ceiling'
                elif shutil.disk_usage(output).free < 96*1024**3: reason = 'shared disk reserve'
                if reason: raise ValueError('Stopped process tree: '+reason)
                if child.poll() is not None: break
                time.sleep(.02)
    finally:
        try:
            job.stop()
            if child is not None:
                if child.poll() is None: child.kill()  # Also handles assignment failure of a suspended child.
                child.wait(timeout=3)
            job.drain(timeout=3)
        finally:
            job.close()
            if child is not None: child._handle.Close()
    if child.returncode:
        raise RuntimeError('Child failed: '+stderr_path.read_text())
    result = {'wallSecondsIncludingStartup':time.perf_counter()-started,'externallyObservedPeakMainRssBytes':peak,'mainRssCeilingBytes':memory_limit,'observedJobPeakCommitBytes':tree_commit,'hardTreeCommitCeilingBytes':512*1024*1024,'hardActiveProcessCeiling':2,'pollSeconds':.02,'enforcement':'Windows Job hard tree commit/process ceilings, suspended launch before assignment/resume, whole-tree kill/drain; sampled main RSS/disk/deadline','exitCode':child.returncode,'result':json.loads(stdout_path.read_text())}
    (output/'monitor.json').write_text(json.dumps(result, indent=2)+'\n')
    return result


def batch(repository, output, prior=None):
    repository, output = Path(repository).resolve(), Path(output).resolve()
    if output.exists(): raise ValueError('Fresh batch output required')
    output.mkdir(); (output/'tmp').mkdir(); batch_started = time.perf_counter(); deadline = time.time()+1800
    previous_attempt = None
    if prior:
        prior = Path(prior).resolve()
        if prior.parent != output.parent or prior == output: raise ValueError('Prior attempt must be a distinct sibling')
        previous_preflight = json.loads((prior/'preflight.json').read_text())
        deadline = previous_preflight['resources']['unixTime']+1800
        if deadline <= time.time(): raise ValueError('Original batch deadline expired')
        previous_attempt = {'name':prior.name,'outcome':'OpenBLAS startup allocation failure under unchanged hard tree commit; before decoder/data validation','preflight':previous_preflight,'bytes':tree_bytes(prior)}
    source_paths = ['scripts/era5/measure_retained_process.py','scripts/era5/measure_retained_decode.py','scripts/era5/measure-retained-history.ts','scripts/era5/read_chunks.py','scripts/era5/chunks.ts','scripts/era5/aggregate.ts','scripts/era5/build-observation-aggregates.ts','scripts/era5/build-release.ts','scripts/era5/build-tiles.ts','scripts/era5/plan-production-history.ts','server/providers/climate/tiledEra5.ts','server/providers/climate/releaseEra5.ts','shared/nightsky/climate.ts','shared/nightsky/common.ts','scripts/osm/global_source_supervisor.py','scripts/osm/global_source.py','scripts/osm/spot_paths.py','package-lock.json']
    source_pins = [{'path':name,'sha256':hashlib.sha256((repository/name).read_bytes()).hexdigest()} for name in source_paths]
    preflight = snapshot(output)
    (output/'preflight.json').write_text(json.dumps({'resources':preflight,'originalDeadlineUnix':deadline,'priorAttemptBytes':tree_bytes(prior) if prior else 0,'fixedChildThreadSettings':{'OPENBLAS_NUM_THREADS':1,'OMP_NUM_THREADS':1,'MKL_NUM_THREADS':1,'NUMEXPR_NUM_THREADS':1},'batchSecondsLimit':1800,'newFileBytesLimit':512*1024*1024,'freeDiskFloorBytes':96*1024**3,'decoderRssCeilingBytes':256*1024*1024,'pipelineRssCeilingBytes':384*1024*1024,'hardTreeCommitCeilingBytes':512*1024*1024,'hardActiveProcessCeiling':2,'selectedSourcePins':source_pins},indent=2)+'\n')
    commands = []
    raw_pins = ['cfb197b39f6948b106e26c42485ba7fb8f8c00555edb0621ff6a504eab66604b','9587e69f729ab42e0de9efaec3f80d8423979daadeac2dadd1c812ee76710906']
    for index, chunk in enumerate(['hanle-03-1991-1992','kodaikanal-munnar-03-1991-1992']):
        commands.append(([sys._base_executable,str(repository/'scripts/era5/measure_retained_decode.py'),'--root',str(repository/'.data/era5/grouped-pilot-20261015-v1'),'--chunk',chunk,'--output',str(output/('decoded-'+str(index))),'--expected-manifest-sha256','5eb57ba09de53fd9c8881d66444e2aecf868b9640bc9e2ccaff982f132cc565d','--expected-raw-sha256',raw_pins[index]],256*1024*1024))
    node = shutil.which('node')
    if not node: raise ValueError('Existing Node runtime required')
    commands.append(([node,'--import','tsx',str(repository/'scripts/era5/measure-retained-history.ts'),str(repository),str(output/'pipeline')],384*1024*1024))
    reports = []
    for index, (command, limit) in enumerate(commands):
        monitor_output = output/('monitor-'+str(index)); monitor_output.mkdir()
        reports.append(monitor(command,monitor_output,deadline,limit,prior))
    for pin in source_pins:
        if hashlib.sha256((repository/pin['path']).read_bytes()).hexdigest() != pin['sha256']: raise ValueError('Measurement code changed during run')
    report = {'schemaVersion':1,'kind':'retained-history-offline-sample-measurement','date':'2026-10-15','baselineCommit':'1201c6da96d561cf58c47ab92c7e1c61e87a2399','selectedSourcePins':source_pins,'sourcePinScope':'Selected harness/core files and package lock; not complete transitive import closure','preflight':preflight,'originalDeadlineUnix':deadline,'priorAttempt':previous_attempt,'fixedChildThreadSettings':{'OPENBLAS_NUM_THREADS':1,'OMP_NUM_THREADS':1,'MKL_NUM_THREADS':1,'NUMEXPR_NUM_THREADS':1},'runtime':{'python':platform.python_version(),'platform':platform.system()+' '+platform.release(),'decoderLaunch':'Existing direct base interpreter with retained venv Lib/site-packages on explicit PYTHONPATH; avoids Windows venv launcher subprocess'},'batchSecondsLimit':1800,'batchWallSeconds':time.perf_counter()-batch_started,'newFileBytesLimit':512*1024*1024,'freeDiskFloorBytes':96*1024**3,'networkRequests':0,'decoder':reports[:2],'pipeline':reports[2],'newFileBytesBeforeBatchReport':tree_bytes(output)+(tree_bytes(prior) if prior else 0),'newFormatAdmission':{'ARCO/time-series':'unavailable actual response body; unadmitted; no adapter execution'},'limits':'Local retained tiny samples; warm cache and uncontrolled host load; no worldwide throughput, provider queue, transfer, cost, compression or serving fit inference'}
    (output/'batch-report.json').write_text(json.dumps(report,indent=2)+'\n')
    return report


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--repository', required=True); parser.add_argument('--batch-output', required=True)
    parser.add_argument('--prior-attempt')
    args = parser.parse_args()
    batch(args.repository,args.batch_output,args.prior_attempt)
    print('Retained-history batch complete')
