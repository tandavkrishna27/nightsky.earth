"""Retained-only Windows Bhutan build/filter/point-partition measurement prototype.

No network path. Windows job forbids descendants and bounds committed memory;
RSS, deadline and combined logical scratch are additionally polled every 20 ms.
This is not a global streaming builder or a runtime catalog.
"""
import argparse
import ctypes
from ctypes import wintypes
import hashlib
import json
import math
import os
from pathlib import Path
import subprocess
import sys
import time

import osmium
from bounded_nodes import rss_bytes
from import_candidates import category_for
from offline_extract import merge_rows, select

INPUT_HASH = '6728f46b23ab722d9713af1b4a089d7c62290d9b28baa1fcb4348cd4afd1ba87'
INPUT_BYTES = 23618779
OUTPUT_HASH = 'd800a935abd54b8cda8e98d02c7e2bce50c7ca6f8e469cadfc735289704f41ff'
VINTAGE = '2026-10-12T20:21:35Z'
KEYS = ('leisure', 'tourism', 'boundary', 'protect_class', 'natural')


def digest(path):
    value = hashlib.sha256()
    with path.open('rb') as raw:
        while chunk := raw.read(1024 * 1024): value.update(chunk)
    return value.hexdigest()


def serialized(document):
    return (json.dumps(document, sort_keys=True, ensure_ascii=False, separators=(',', ':')) + '\n').encode()


def filter_source(source, output):
    """Three passes; matching nodes/ways plus complete available way references."""
    if output.exists(): raise FileExistsError(output)
    selected, references = set(), set()
    for way in osmium.FileProcessor(str(source), entities=osmium.osm.WAY):
        if category_for({t.k: t.v for t in way.tags}):
            selected.add(way.id)
            references.update(node.ref for node in way.nodes)
    stats = dict(sourcePasses=3, selectedWays=len(selected), referenceIds=len(references), writtenNodes=0, writtenWays=0)
    with osmium.SimpleWriter(str(output)) as writer:
        for node in osmium.FileProcessor(str(source), entities=osmium.osm.NODE):
            if node.id in references or (any(key in node.tags for key in KEYS) and category_for({t.k: t.v for t in node.tags})):
                writer.add_node(node)
                stats['writtenNodes'] += 1
        for way in osmium.FileProcessor(str(source), entities=osmium.osm.WAY):
            if way.id in selected:
                writer.add_way(way)
                stats['writtenWays'] += 1
    return stats


def partition_points(document, folder, *, max_rows=10000, max_bytes=4*1024*1024, max_partitions=32):
    """Small prototype: one-degree point cells, deterministic capacity chunks."""
    if not 1 <= max_rows <= 10000 or not 1 <= max_bytes <= 4*1024*1024 or not 1 <= max_partitions <= 32:
        raise ValueError('invalid partition limits')
    rows = merge_rows([document['candidates']])
    cells = {}
    for row in rows:
        lat, lon = row['latitude'], row['longitude']
        if not math.isfinite(lat) or not math.isfinite(lon) or not -90 <= lat <= 90 or not -180 <= lon <= 180:
            raise ValueError('invalid point')
        key = (min(179, math.floor(lat+90)), min(359, math.floor(lon+180)))
        cells.setdefault(key, []).append(row)
    pending = []
    for cell in sorted(cells):
        chunk = []
        for row in cells[cell]:
            proposed = chunk + [row]
            payload = serialized(dict(document, candidates=proposed))
            if chunk and (len(proposed) > max_rows or len(payload) > max_bytes):
                pending.append((cell, chunk))
                chunk = []
            chunk.append(row)
            if len(serialized(dict(document, candidates=chunk))) > max_bytes:
                raise ValueError('single row exceeds byte cap')
        if chunk: pending.append((cell, chunk))
    if len(pending) > max_partitions: raise ValueError('partition limit exceeded')
    paths = []
    for number, (cell, chunk) in enumerate(pending):
        path = folder / f'partition-{cell[0]}-{cell[1]}-{number}.json'
        with path.open('xb') as output: output.write(serialized(dict(document, candidates=chunk)))
        paths.append(path)
    return paths


def scratch_size(folder):
    total = 0
    for path in folder.rglob('*'):
        if path.is_symlink(): raise ValueError('scratch symlink refused')
        if path.is_file(): total += path.stat().st_size
    return total


class WindowsJob:
    """Single-process job prevents untracked children and kills on close."""
    def __init__(self, memory_bytes):
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
        limits.basic.active = 1
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


def supervise_stage(arguments, folder, *, source_bytes, wall_seconds=60, rss_mib=256, scratch_bytes=100*1024*1024):
    folder = folder.resolve(strict=True)
    if source_bytes + scratch_size(folder) > scratch_bytes: raise ValueError('initial scratch limit exceeded')
    environment = dict(os.environ, PYTHONPATH=os.pathsep.join(sys.path), PYTHONDONTWRITEBYTECODE='1', TMP=str(folder), TEMP=str(folder))
    job = WindowsJob(rss_mib*1024*1024)
    process = None
    start, peak, disk_peak, reason = time.monotonic(), 0, 0, None
    try:
        # Base interpreter avoids the Windows venv launcher child process.
        process = subprocess.Popen([getattr(sys, '_base_executable', sys.executable), *arguments], cwd=folder, env=environment, creationflags=0x4, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
        job.assign_resume(process)
        while True:
            peak = max(peak, rss_bytes(process))
            disk_peak = max(disk_peak, source_bytes + scratch_size(folder))
            if time.monotonic()-start >= wall_seconds: reason = 'wall time limit'
            elif peak > rss_mib*1024*1024: reason = 'RSS limit'
            elif disk_peak > scratch_bytes: reason = 'scratch limit'
            if reason or process.poll() is not None: break
            time.sleep(.02)
    except (OSError, RuntimeError, ValueError) as error:
        reason = 'supervisor/accounting failure: ' + str(error)
    finally:
        try:
            if process is not None and process.poll() is None:
                try:
                    job.stop()
                except OSError as error:
                    reason = reason or 'job termination failure: ' + str(error)
                # Assignment can fail while the process is still suspended and
                # outside the job. Kill the actual handle as a fallback.
                if process.poll() is None: process.kill()
                process.wait(timeout=3)
            job.drain(timeout=3)
        finally:
            job.close()
            if process is not None: process._handle.Close()
        wait_for_directory_release(folder, timeout=3)
    return dict(status='bounded-stop' if reason else ('complete' if process.returncode == 0 else 'failed'), reason=reason, exitCode=process.returncode if process else None,
                elapsedSeconds=round(time.monotonic()-start, 3), peakRssBytes=peak, peakCombinedLogicalScratchBytes=disk_peak,
                wallLimitSeconds=wall_seconds, rssLimitMiB=rss_mib, jobCommitLimitMiB=rss_mib, scratchLimitBytes=scratch_bytes,
                processPolicy='single-process Windows job; descendants refused', pollSeconds=.02)


def worker(mode, source, folder):
    if source.stat().st_size != INPUT_BYTES or digest(source) != INPUT_HASH: raise ValueError('retained input mismatch')
    started = time.monotonic()
    if mode == 'baseline':
        document, stats = select(source, vintage=VINTAGE, region='Geofabrik Bhutan')
        payload = serialized(document)
        if hashlib.sha256(payload).hexdigest() != OUTPUT_HASH: raise ValueError('baseline differs from retained output')
        with (folder/'baseline.json').open('xb') as output: output.write(payload)
    elif mode == 'filter':
        filtered = folder/'filtered.osm.pbf'
        stats = filter_source(source, filtered)
        document, selection = select(filtered, vintage=VINTAGE, region='Geofabrik Bhutan')
        stats.update(selection)
        payload = serialized(document)
        if hashlib.sha256(payload).hexdigest() != OUTPUT_HASH: raise ValueError('filtered output differs from retained output')
        with (folder/'filtered-candidates.json').open('xb') as output: output.write(payload)
        stats.update(filteredInputBytes=filtered.stat().st_size, filteredInputSha256=digest(filtered))
    else: raise ValueError('invalid worker mode')
    partitions = partition_points(document, folder)
    recovered = [row for path in partitions for row in json.loads(path.read_text(encoding='utf-8'))['candidates']]
    if merge_rows([recovered]) != document['candidates']: raise ValueError('partition equality mismatch')
    stats.update(candidateCount=len(document['candidates']), nodeCount=sum(r['osmType']=='node' for r in document['candidates']), wayCount=sum(r['osmType']=='way' for r in document['candidates']),
                 outputBytes=len(payload), outputSha256=hashlib.sha256(payload).hexdigest(), partitionEquality=True, partitionCount=len(partitions),
                 partitions=[dict(path=p.name,bytes=p.stat().st_size,sha256=digest(p),rows=len(json.loads(p.read_text(encoding='utf-8'))['candidates'])) for p in partitions],
                 inputSha256=INPUT_HASH, inputBytes=INPUT_BYTES, vintage=VINTAGE, workerSeconds=round(time.monotonic()-started,3))
    with (folder/'result.json').open('x', encoding='utf-8') as output: json.dump(stats, output, indent=2)


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('source', type=Path)
    parser.add_argument('staging', type=Path)
    parser.add_argument('--worker', choices=['baseline','filter'])
    args = parser.parse_args()
    source = args.source.resolve(strict=True)
    if args.worker: return worker(args.worker, source, args.staging.resolve(strict=True))
    workspace = Path(__file__).resolve().parents[2]
    allowed = (workspace/'.data/osm').resolve(strict=True)
    stage = args.staging.resolve()
    if not stage.is_relative_to(allowed) or stage == allowed or stage.exists(): raise ValueError('require fresh staging within workspace .data/osm')
    if source.stat().st_size != INPUT_BYTES: raise ValueError('retained input size mismatch')
    before = (source.stat().st_size, source.stat().st_mtime_ns)
    stage.mkdir()
    reports = []
    for mode in ('baseline','filter'):
        phase = stage/mode
        phase.mkdir()
        # Include retained input once + all accumulated experiment scratch.
        prior_bytes = scratch_size(stage)-scratch_size(phase)
        report = supervise_stage([str(Path(__file__).resolve()), str(source), str(phase), '--worker', mode], phase, source_bytes=INPUT_BYTES+prior_bytes)
        report['mode'] = mode
        report['directory'] = str(phase)
        if report['status']=='complete': report['result']=json.loads((phase/'result.json').read_text(encoding='utf-8'))
        reports.append(report)
        if report['status']!='complete': break
    summary = dict(source=str(source), inputMetadataUnchanged=before==(source.stat().st_size,source.stat().st_mtime_ns), phases=reports,
                   status='complete' if len(reports)==2 and all(r['status']=='complete' for r in reports) else 'partial',
                   finalCombinedLogicalScratchBytes=INPUT_BYTES+scratch_size(stage))
    if not summary['inputMetadataUnchanged']: raise ValueError('source metadata changed')
    report_payload = json.dumps(summary, indent=2)
    if summary['finalCombinedLogicalScratchBytes']+len(report_payload.encode()) > 100*1024*1024: raise ValueError('report would exceed scratch budget')
    with (stage/'report.json').open('x',encoding='utf-8') as output: output.write(report_payload)
    print(json.dumps(summary))
    if summary['status']!='complete': raise SystemExit(1)


if __name__=='__main__': main()
