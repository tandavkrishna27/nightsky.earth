"""One explicitly invoked Geofabrik regional download and externally bounded offline build."""
import argparse, hashlib, json, os, sys, time, urllib.request
from datetime import datetime, timezone
from pathlib import Path
import osmium
from import_candidates import CandidateHandler, OSM_SOURCE, centroid, category_for
from bounded_nodes import supervise

MAX_INPUT = 100 * 1024 * 1024
MAX_OUTPUT = 4 * 1024 * 1024
SOURCE = 'https://download.geofabrik.de/asia/bhutan-261012.osm.pbf'

def content_length(value):
    if value is None or not value.isdigit() or not 0 < int(value) <= MAX_INPUT:
        raise ValueError('Content-Length must be positive and at most 100 MiB')
    return int(value)

def download(path):
    if path.exists(): raise FileExistsError('Source path already exists')
    created = False
    started = time.monotonic()
    request = lambda method: urllib.request.Request(SOURCE, method=method, headers={'User-Agent': 'nightsky-earth-offline-review/1.0', 'Accept-Encoding': 'identity'})
    with urllib.request.urlopen(request('HEAD'), timeout=15) as response:
        declared = content_length(response.headers.get('Content-Length'))
    digest, size = hashlib.sha256(), 0
    try:
        with urllib.request.urlopen(request('GET'), timeout=15) as response, path.open('xb') as output:
            created = True
            if content_length(response.headers.get('Content-Length')) != declared: raise ValueError('Source size changed')
            while chunk := response.read(65536):
                size += len(chunk)
                if size > declared or size > MAX_INPUT: raise ValueError('Download byte cap exceeded')
                if time.monotonic() - started > 90: raise ValueError('Download wall cap exceeded')
                output.write(chunk); digest.update(chunk)
        if size != declared: raise ValueError('Incomplete download')
    except BaseException:
        if created: path.unlink(missing_ok=True)
        raise
    return {'sourceUrl': SOURCE, 'sourcePage': 'https://download.geofabrik.de/asia/bhutan.html', 'inputBytes': size, 'inputSha256': digest.hexdigest(), 'retrievedAt': datetime.now(timezone.utc).isoformat(), 'downloadSeconds': round(time.monotonic()-started, 3), 'licenseUrl': OSM_SOURCE['licenseUrl']}

def merge_rows(regions):
    rows = {}
    for region in regions:
        for row in region:
            key = (row['osmType'], row['osmId'])
            if key in rows and rows[key] != row: raise ValueError('conflicting cross-region OSM identity; reconcile vintages before merge')
            rows[key] = row
    return [rows[key] for key in sorted(rows)]

def select(path, *, vintage, region):
    handler = CandidateHandler()
    incomplete = 0
    # No relation assembly: only complete ways are accepted. sparse in-memory
    # locations avoid dense arrays indexed by global node IDs; supervisor caps RSS.
    processor = osmium.FileProcessor(str(path), entities=osmium.osm.NODE | osmium.osm.WAY).with_locations('flex_mem')
    for entity in processor:
        tags = handler.tags_as_dict(entity.tags)
        if entity.is_node():
            if entity.location.valid(): handler.add('node', entity.id, tags, entity.location.lat, entity.location.lon)
        elif category_for(tags):
            if not entity.nodes or any(not node.location.valid() for node in entity.nodes):
                incomplete += 1
                continue
            center = centroid([(node.location.lat, node.location.lon) for node in entity.nodes])
            if center: handler.add('way', entity.id, tags, *center)
        if len(handler.candidates) > 10000: raise ValueError('Candidate cap exceeded')
    coverage = f'Partial: named candidate nodes and complete ways in {region} extract only; relations and incomplete ways excluded. Way points are mean vertices, not entrances; access and darkness unknown.'
    return {'schemaVersion': 1, 'vintage': vintage, 'coverage': coverage, 'source': {**OSM_SOURCE, 'vintage': vintage}, 'candidates': merge_rows([handler.candidates.values()])}, {'incompleteWays': incomplete, 'relationsPolicy': 'excluded', 'wayPointPolicy': 'mean complete vertices, closing vertex removed'}

def worker(folder, vintage):
    raw = folder / 'source.osm.pbf'
    if raw.stat().st_size > MAX_INPUT: raise ValueError('Input cap exceeded')
    metadata = json.loads((folder / 'acquisition.json').read_text(encoding='utf-8'))
    identity = lambda: (raw.stat().st_size, raw.stat().st_mtime_ns)
    before = identity()
    digest = hashlib.sha256()
    with raw.open('rb') as source:
        while chunk := source.read(1024*1024): digest.update(chunk)
    if digest.hexdigest() != metadata['inputSha256']: raise ValueError('Source digest mismatch')
    document, stats = select(raw, vintage=vintage, region='Geofabrik Bhutan')
    if identity() != before: raise ValueError('Source changed during selection')
    payload = (json.dumps(document, sort_keys=True, ensure_ascii=False, separators=(',', ':'))+'\n').encode()
    if len(payload) > MAX_OUTPUT: raise ValueError('Artifact cap exceeded')
    with (folder / 'candidates.staged.json').open('xb') as output: output.write(payload)
    (folder / 'selection.json').write_text(json.dumps({**stats, 'candidateCount': len(document['candidates']), 'outputBytes': len(payload), 'outputSha256': hashlib.sha256(payload).hexdigest()}, indent=2), encoding='utf-8')

def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('mode', choices=['acquire', 'build', 'worker', 'download-worker'])
    parser.add_argument('folder', type=Path)
    parser.add_argument('--vintage', default='2026-10-12T20:21:35Z')
    args = parser.parse_args()
    if args.mode == 'worker': return worker(args.folder, args.vintage)
    if args.mode == 'download-worker':
        metadata = download(args.folder / 'source.osm.pbf')
        (args.folder / 'acquisition.json').write_text(json.dumps(metadata, indent=2), encoding='utf-8')
        return
    if args.mode == 'acquire':
        args.folder.mkdir(parents=True, exist_ok=False)
        acquisition = supervise([str(Path(__file__).resolve()), 'download-worker', str(args.folder)], args.folder / 'source.osm.pbf', wall_seconds=90, rss_mib=128)
        (args.folder / 'download-run.json').write_text(json.dumps(acquisition, indent=2), encoding='utf-8')
        if acquisition['status'] != 'complete':
            (args.folder / 'source.osm.pbf').unlink(missing_ok=True)
            (args.folder / 'acquisition.json').unlink(missing_ok=True)
            raise SystemExit(1)
    if (args.folder / 'candidates.json').exists(): raise FileExistsError('Use a new output directory')
    if (args.folder / 'candidates.staged.json').exists() or (args.folder / 'selection.json').exists(): raise FileExistsError('Staged files already exist; use a fresh build directory')
    metadata = json.loads((args.folder / 'acquisition.json').read_text(encoding='utf-8'))
    report = supervise([str(Path(__file__).resolve()), 'worker', str(args.folder), '--vintage', args.vintage], args.folder / 'candidates.json', wall_seconds=60, rss_mib=256)
    if report['status'] == 'complete':
        report.update(json.loads((args.folder / 'selection.json').read_text(encoding='utf-8')))
        (args.folder / 'candidates.staged.json').rename(args.folder / 'candidates.json')
    else:
        (args.folder / 'candidates.staged.json').unlink(missing_ok=True)
        (args.folder / 'selection.json').unlink(missing_ok=True)
    report.update(metadata)
    report['vintage'] = args.vintage
    (args.folder / 'manifest.json').write_text(json.dumps(report, indent=2), encoding='utf-8')
    print(json.dumps(report))
    if report['status'] != 'complete': raise SystemExit(1)

if __name__ == '__main__': main()
