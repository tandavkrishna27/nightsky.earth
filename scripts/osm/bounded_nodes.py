"""Offline, supervised node-only selection from a retained OSM extract (no location cache)."""
import argparse
import ctypes
from ctypes import wintypes
import hashlib
import json
import os
from pathlib import Path
import subprocess
import sys
import time

sys.path.insert(0, str(Path(__file__).resolve().parent))
from import_candidates import CandidateHandler, OSM_SOURCE
import osmium

BOXES = {'Hanle': (78.7, 32.55, 79.2, 33.1), 'Kodaikanal': (77.25, 10.05, 77.75, 10.5), 'Munnar': (76.8, 9.85, 77.3, 10.3)}
COVERAGE = 'Partial: named candidate nodes only in Hanle, Kodaikanal and Munnar bounding boxes; excludes ways, relations and all areas outside boxes.'

def select_nodes(path, *, vintage, max_candidates=10000):
    handler = CandidateHandler()
    for node in osmium.FileProcessor(str(path), entities=osmium.osm.NODE):
        if not node.location.valid():
            continue
        lat, lon = node.location.lat, node.location.lon
        if not any(w <= lon <= e and s <= lat <= n for w, s, e, n in BOXES.values()):
            continue
        handler.add('node', node.id, handler.tags_as_dict(node.tags), lat, lon)
        if len(handler.candidates) > max_candidates:
            raise ValueError('candidate limit exceeded')
    return {'schemaVersion': 1, 'vintage': vintage, 'coverage': COVERAGE,
            'source': {**OSM_SOURCE, 'vintage': vintage},
            'candidates': [handler.candidates[key] for key in sorted(handler.candidates)]}

def rss_bytes(process):
    if os.name != 'nt':
        raise RuntimeError('This supervisor requires Windows process memory accounting.')
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

def supervise(arguments, output, *, wall_seconds=120, rss_mib=512):
    start = time.monotonic()
    peak = 0
    # Windows venv python.exe is a redirector: supervise the actual interpreter,
    # preserving this environment's package paths, so RSS/kill cover the worker.
    environment = dict(os.environ)
    environment['PYTHONPATH'] = os.pathsep.join(sys.path)
    process = subprocess.Popen([getattr(sys, '_base_executable', sys.executable), *arguments], env=environment, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    reason = None
    try:
        while process.poll() is None:
            peak = max(peak, rss_bytes(process))
            if time.monotonic() - start >= wall_seconds:
                reason = 'wall time limit'
                break
            if peak > rss_mib * 1024 * 1024:
                reason = 'RSS limit'
                break
            time.sleep(0.02)
        if reason is None:
            peak = max(peak, rss_bytes(process))
            if peak > rss_mib * 1024 * 1024:
                reason = 'RSS limit'
    finally:
        if process.poll() is None:
            process.kill()
        process.wait()
    return {'status': 'bounded-stop' if reason else ('complete' if process.returncode == 0 else 'failed'),
            'reason': reason, 'exitCode': process.returncode, 'elapsedSeconds': round(time.monotonic() - start, 3),
            'peakRssBytes': peak, 'wallLimitSeconds': wall_seconds, 'rssLimitMiB': rss_mib}

def worker(source, stage, vintage):
    # Hash and selection share the parent's wall/memory deadline. No whole-file read.
    identity = lambda: (source.stat().st_dev, source.stat().st_ino, source.stat().st_size, source.stat().st_mtime_ns)
    before = identity()
    digest = hashlib.sha256()
    with source.open('rb') as raw:
        while chunk := raw.read(1024 * 1024):
            digest.update(chunk)
    if identity() != before:
        raise ValueError('Source changed during checksum')
    document = select_nodes(source, vintage=vintage)
    if identity() != before:
        raise ValueError('Source changed during selection')
    payload = (json.dumps(document, ensure_ascii=False, sort_keys=True, separators=(',', ':')) + '\n').encode()
    if len(payload) > 2 * 1024 * 1024:
        raise ValueError('2 MiB artifact limit exceeded')
    # Worker writes only a new staged file; supervisor alone promotes after success.
    with stage.open('xb') as file:
        file.write(payload)
        file.flush()
        os.fsync(file.fileno())
    metadata = {'inputBytes': source.stat().st_size, 'inputSha256': digest.hexdigest(),
                'outputBytes': len(payload), 'outputSha256': hashlib.sha256(payload).hexdigest(),
                'candidateCount': len(document['candidates']), 'boxes': BOXES,
                'sourceUrl': 'https://download.geofabrik.de/asia/india.html',
                'vintage': vintage, 'coverage': COVERAGE}
    stage.with_suffix('.report.json').write_text(json.dumps(metadata, indent=2), encoding='utf-8')

def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('input', type=Path)
    parser.add_argument('output', type=Path)
    parser.add_argument('--vintage', required=True)
    parser.add_argument('--worker', action='store_true', help=argparse.SUPPRESS)
    args = parser.parse_args()
    if args.worker:
        worker(args.input, args.output, args.vintage)
        return
    args.output.parent.mkdir(parents=True, exist_ok=True)
    stage = args.output.with_name(args.output.name + '.' + str(time.time_ns()) + '.staged')
    started = time.monotonic()
    report = supervise([str(Path(__file__).resolve()), str(args.input), str(stage), '--vintage', args.vintage, '--worker'], args.output)
    if report['status'] == 'complete':
        if stage.stat().st_size > 2 * 1024 * 1024 or time.monotonic() - started >= 120:
            report['status'] = 'bounded-stop'
            report['reason'] = 'publication size/deadline limit'
    if report['status'] == 'complete':
        metadata = json.loads(stage.with_suffix('.report.json').read_text(encoding='utf-8'))
        # Immutable versioned artifact: refuse to replace any prior file.
        if args.output.exists():
            raise FileExistsError('Use a new versioned output path; prior artifacts are retained.')
        stage.rename(args.output)
        report.update(metadata)
    report_path = args.output.with_name(args.output.name + '.' + str(time.time_ns()) + '.run.json')
    report_path.write_text(json.dumps(report, indent=2), encoding='utf-8')
    print(json.dumps(report))
    if report['status'] != 'complete':
        raise SystemExit(1)

if __name__ == '__main__':
    main()
