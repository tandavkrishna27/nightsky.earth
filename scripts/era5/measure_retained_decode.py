"""Offline grouped raw replay. Imports only the existing pure NetCDF decoder.

Fresh output directory required. No downloader, account or network imports.
"""
import argparse
import hashlib
import json
import os
from pathlib import Path
import time
from read_chunks import read_grouped_chunk, digest


def peak_rss():
    if os.name != 'nt':
        import resource
        import sys
        return resource.getrusage(resource.RUSAGE_SELF).ru_maxrss * (1 if sys.platform == 'darwin' else 1024)
    import ctypes
    from ctypes import wintypes
    class Counters(ctypes.Structure):
        _fields_ = [('cb', wintypes.DWORD), ('PageFaultCount', wintypes.DWORD)] + [(n, ctypes.c_size_t) for n in ['PeakWorkingSetSize','WorkingSetSize','QuotaPeakPagedPoolUsage','QuotaPagedPoolUsage','QuotaPeakNonPagedPoolUsage','QuotaNonPagedPoolUsage','PagefileUsage','PeakPagefileUsage']]
    c = Counters(); c.cb = ctypes.sizeof(c)
    kernel = ctypes.WinDLL('kernel32', use_last_error=True)
    kernel.GetCurrentProcess.restype = wintypes.HANDLE
    psapi = ctypes.WinDLL('psapi', use_last_error=True)
    psapi.GetProcessMemoryInfo.argtypes = [wintypes.HANDLE, ctypes.POINTER(Counters), wintypes.DWORD]
    if not psapi.GetProcessMemoryInfo(kernel.GetCurrentProcess(), ctypes.byref(c), c.cb):
        raise OSError('Cannot measure RSS')
    return c.PeakWorkingSetSize


def clock(request):
    return sorted(f'{y}-{m}-{d}T{h}:00Z' for y in request['year'] for m in request['month'] for d in request['day'] for h in request['time'])


def replay(root, chunk_id, output, expected_manifest=None, expected_raw=None):
    root, output = Path(root).resolve(), Path(output).resolve()
    if output.exists():
        raise ValueError('Fresh output directory required')
    manifest_path, ledger_path = root/'manifest.json', root/'ledger.json'
    manifest_bytes, ledger_bytes = manifest_path.read_bytes(), ledger_path.read_bytes()
    manifest, ledger = json.loads(manifest_bytes), json.loads(ledger_bytes)
    if expected_manifest is not None and ledger['manifestSha256'] != expected_manifest:
        raise ValueError('Explicit manifest pin differs')
    canonical = json.dumps(manifest, sort_keys=True, separators=(',', ':'), allow_nan=False).encode()
    if hashlib.sha256(canonical).hexdigest() != ledger['manifestSha256']:
        raise ValueError('Manifest pin differs')
    chunk = next(c for c in manifest['chunks'] if c['chunkId'] == chunk_id)
    entry = next(c for c in ledger['entries'] if c['chunkId'] == chunk_id and c['complete'])
    if expected_raw is not None and entry['rawSha256'] != expected_raw:
        raise ValueError('Explicit raw pin differs')
    raw = root/'raw'/(chunk_id+'.nc')
    if digest(raw) != entry['rawSha256'] or raw.stat().st_size != entry['rawBytes']:
        raise ValueError('Raw pin differs')
    retained = {}
    for part in entry['partitions']:
        path = root/part['path']
        if path.resolve().parent != (root/'decoded').resolve() or digest(path) != part['decodedSha256'] or path.stat().st_size != part['decodedBytes'] or part['rawSha256'] != entry['rawSha256']:
            raise ValueError('Retained partition pin differs')
        retained[part['chunkId']] = path
    output.mkdir()
    started, cpu_started = time.perf_counter(), time.process_time()
    def gate():
        if time.perf_counter()-started > 1800 or peak_rss() > 256*1024*1024:
            raise ValueError('Decoder cooperative resource gate')
    iterator = iter(read_grouped_chunk(raw))
    header = next(iterator)
    if header['sourceSha256'] != entry['rawSha256'] or header['experimentVersions'] != ['0001'] or header['member'] != 0:
        raise ValueError('Source revision/member pin differs')
    supplied = {(c['latitude'], c['longitude']) for c in header['cells']}
    if supplied != {tuple(c) for c in manifest['cellCoverage'][chunk['region']]['cells']}:
        raise ValueError('Source coordinates differ')
    rows_by_month = {}
    actual_clock = []
    for row in iterator:
        gate()
        actual_clock.append(row['atUtc'])
        rows_by_month.setdefault(row['atUtc'][:7], []).append(row)
    if actual_clock != clock(chunk['request']):
        raise ValueError('Actual source clock differs from exact request')
    parts = []
    for spec in chunk['partitions']:
        name = spec['chunkId']; month = clock(spec['request'])[0][:7]
        rows = rows_by_month[month]
        if [r['atUtc'] for r in rows] != clock(spec['request']) or not 1 <= len(rows) <= 800:
            raise ValueError('Partition clock differs')
        path = output/(name+'.jsonl')
        with path.open('x', encoding='utf-8', newline='\n') as stream:
            for record in [dict(header, rowCount=len(rows)), *rows]:
                stream.write(json.dumps(record, separators=(',', ':'), allow_nan=False)+'\n')
        if path.stat().st_size > 4*1024*1024 or digest(path) != digest(retained[name]):
            raise ValueError('Raw replay differs from retained JSONL bytes')
        parts.append({'id':name, 'sha256':digest(path), 'bytes':path.stat().st_size, 'rows':len(rows)})
    gate()
    wall, cpu = time.perf_counter()-started, time.process_time()-cpu_started
    if digest(raw) != entry['rawSha256'] or manifest_path.read_bytes() != manifest_bytes or ledger_path.read_bytes() != ledger_bytes:
        raise ValueError('Retained source changed')
    for name, path in retained.items():
        expected = next(p['decodedSha256'] for p in entry['partitions'] if p['chunkId'] == name)
        if digest(path) != expected:
            raise ValueError('Retained partition changed')
    return {'id':chunk_id, 'rawSha256':entry['rawSha256'], 'rawBytes':raw.stat().st_size,
            'cells':len(header['cells']), 'sourceHours':len(actual_clock), 'scalarCellHours':len(actual_clock)*len(header['cells']),
            'wallSeconds':wall, 'cpuSeconds':cpu, 'scalarCellHoursPerWallSecond':len(actual_clock)*len(header['cells'])/wall,
            'scalarCellHoursPerCpuSecond':len(actual_clock)*len(header['cells'])/cpu if cpu else None,
            'logicalRawHashBytes':4*raw.stat().st_size, 'actualPhysicalReadBytes':None,
            'processPeakRssBytes':peak_rss(), 'partitions':parts,
            'decoderVersions':header['decoderVersions'], 'revision':header['experimentVersions'], 'byteIdentical':True,
            'readBytesMeaning':'raw file size is logical input bytes; decoder hashes raw before/after, physical OS/cache IO not measured'}


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--root', required=True); parser.add_argument('--chunk', required=True); parser.add_argument('--output', required=True)
    parser.add_argument('--expected-manifest-sha256', required=True); parser.add_argument('--expected-raw-sha256', required=True)
    args = parser.parse_args()
    print(json.dumps(replay(args.root, args.chunk, args.output, args.expected_manifest_sha256, args.expected_raw_sha256), separators=(',', ':')))
