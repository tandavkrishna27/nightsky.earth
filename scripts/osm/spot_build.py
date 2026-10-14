"""Bounded offline reference/filter experiment; no runtime installation or network."""
import hashlib
import math
import os
from pathlib import Path

CAPS = {'referenceBytes': 4*1024*1024, 'filteredPbfBytes': 8*1024*1024,
        'filteredBytes': 4*1024*1024, 'partitionBytes': 4*1024*1024,
        'reportBytes': 1024*1024, 'candidateRows': 10000, 'auditIds': 10000,
        'selectedWayIds': 10000, 'referencedNodeIds': 1000000}


def way_point(points):
    if not points or any(p is None for p in points): return None, 'incomplete'
    if any(not math.isfinite(v) for p in points for v in p): return None, 'incomplete'
    if any(not -90 <= p[0] <= 90 or not -180 <= p[1] <= 180 for p in points): return None, 'incomplete'
    if max(p[1] for p in points)-min(p[1] for p in points) > 180: return None, 'dateline'
    if len(points) > 1 and points[0] == points[-1]: points = points[:-1]
    return (sum(p[0] for p in points)/len(points), sum(p[1] for p in points)/len(points)), None


def safe_path(path):
    path = Path(os.path.abspath(path))
    for part in (path, *path.parents):
        if part.is_symlink() or (hasattr(part, 'is_junction') and part.is_junction()):
            raise ValueError('symlink/junction path refused')
        if part.exists() and getattr(part.lstat(), 'st_file_attributes', 0) & 1024:
            raise ValueError('reparse path refused')
    if path.resolve() != path: raise ValueError('resolved path changed')
    return path


def select_source(path, source, check):
    import osmium
    from import_candidates import CandidateHandler, category_for, OSM_SOURCE
    from offline_extract import merge_rows
    handler = CandidateHandler()
    counts = dict(incompleteWays=0, datelineWays=0, selectedWays=0)
    ids = dict(incompleteWays=[], datelineWays=[])
    processor = osmium.FileProcessor(str(path), entities=osmium.osm.NODE | osmium.osm.WAY).with_locations('flex_mem')
    for entity in processor:
        check()
        tags = handler.tags_as_dict(entity.tags)
        if entity.is_node():
            if entity.location.valid(): handler.add('node', entity.id, tags, entity.location.lat, entity.location.lon)
        elif category_for(tags):
            counts['selectedWays'] += 1
            points = [(n.location.lat, n.location.lon) if n.location.valid() else None for n in entity.nodes]
            point, reason = way_point(points)
            if reason:
                key = 'datelineWays' if reason == 'dateline' else 'incompleteWays'
                counts[key] += 1
                if len(ids[key]) >= CAPS['auditIds']: raise ValueError('geometry audit ID cap exceeded')
                ids[key].append(entity.id)
            else: handler.add('way', entity.id, tags, *point)
        if len(handler.candidates) > CAPS['candidateRows']: raise ValueError('candidate cap exceeded')
    coverage = ('Partial named nodes and complete ways only; relations, incomplete ways and longitude-span >180 ways excluded. '
                'Way points are mean vertices with repeated closure removed; not entrances or corrected polygon geometry. Access and darkness unknown.')
    doc = dict(schemaVersion=1, vintage=source['expectedVintage'], coverage=coverage,
               source={**OSM_SOURCE, **source, 'vintage': source['expectedVintage']}, candidates=merge_rows([handler.candidates.values()]))
    return doc, {**counts, 'sourceIds': {k: sorted(v) for k,v in ids.items()}, 'auditIdsTruncated': False}


def build_source(source_path, output_dir, source, *, budget_check=None):
    """Return deterministic proof report for one pinned local source; raise on failure.

    budget_check is a zero-argument supervisor callback, called before/after IO
    and during selection. Exceptions propagate; failed scratch remains accounted.
    """
    output = safe_path(output_dir)
    if output.exists(): raise FileExistsError(output)
    raw = safe_path(source_path)
    if not raw.is_file(): raise ValueError('source must be a regular file')
    if output == raw or raw.is_relative_to(output): raise ValueError('source inside output')
    required = ('id','url','declaredBytes','etag','expectedVintage','licenseUrl','sourcePage')
    if any(k not in source for k in required): raise ValueError('missing source pin')
    if type(source['declaredBytes']) is not int or not 0 < source['declaredBytes'] <= 100*1024*1024: raise ValueError('invalid source size')
    check = budget_check or (lambda: None)
    check()
    import osmium
    from retained_experiment import partition_points, serialized
    def identity(): return (raw.stat().st_size, raw.stat().st_mtime_ns)
    before = identity()
    if before[0] != source['declaredBytes']: raise ValueError('source size mismatch')
    value = hashlib.sha256()
    with raw.open('rb') as stream:
        while chunk := stream.read(65536): check(); value.update(chunk)
    check()
    with osmium.io.Reader(str(raw)) as reader:
        actual = reader.header().get('osmosis_replication_timestamp')
    check()
    if actual != source['expectedVintage']: raise ValueError('source header vintage mismatch')
    if source.get('sha256') and source['sha256'] != value.hexdigest(): raise ValueError('source hash mismatch')
    output.mkdir()
    def write(name, payload, cap):
        check()
        if len(payload) > cap: raise ValueError(name+' cap exceeded')
        with (output/name).open('xb') as stream: stream.write(payload)
        check()
    reference, geometry = select_source(raw, source, check)
    reference_bytes = serialized(reference)
    write('reference.json', reference_bytes, CAPS['referenceBytes'])
    check()
    filtered = output/'filtered.osm.pbf'
    filter_stats = bounded_filter(raw, filtered, check)
    check()
    if filtered.stat().st_size > CAPS['filteredPbfBytes']: raise ValueError('filtered PBF cap exceeded')
    candidate, filtered_geometry = select_source(filtered, source, check)
    candidate_bytes = serialized(candidate)
    if reference != candidate or reference_bytes != candidate_bytes or geometry != filtered_geometry:
        raise ValueError('reference/filter equality failed')
    write('candidates.json', candidate_bytes, CAPS['filteredBytes'])
    check()
    paths = partition_points(candidate, output)
    check()
    total = sum(p.stat().st_size for p in paths)
    if total > CAPS['partitionBytes']: raise ValueError('aggregate partition cap exceeded')
    import json
    rows = []
    partitions = []
    for path in paths:
        check(); data = path.read_bytes(); check()
        part_rows = json.loads(data)['candidates']; rows.extend(part_rows)
        partitions.append(dict(path=path.name, bytes=len(data), rows=len(part_rows), sha256=hashlib.sha256(data).hexdigest()))
    from offline_extract import merge_rows
    if len(rows) != len(candidate['candidates']) or merge_rows([rows]) != candidate['candidates']: raise ValueError('partition identity/value equality failed')
    if identity() != before: raise ValueError('source changed during build')
    from collections import Counter
    categories = dict(sorted(Counter(row['category'] for row in rows).items()))
    completeness = dict(sorted(Counter(str(row['sourceCompleteness']) for row in rows).items()))
    report = dict(categoryRows=categories, completenessRows=completeness, schemaVersion=1, source=dict(source), inputBytes=before[0], inputSha256=value.hexdigest(),
                  actualVintage=actual, caps=CAPS, geometry=geometry, filter=filter_stats,
                  candidateRows=len(rows), referenceBytes=len(reference_bytes), filteredBytes=len(candidate_bytes),
                  filteredPbfBytes=filtered.stat().st_size, canonicalSha256=hashlib.sha256(candidate_bytes).hexdigest(),
                  partitions=partitions, partitionBytes=total, referenceFilteredEqual=True,
                  partitionIdentityValueEqual=True, independentGeometryProof=False, status='complete')
    write('report.json', serialized(report), CAPS['reportBytes'])
    return report


def bounded_filter(source, output, check):
    import osmium
    from import_candidates import category_for
    from retained_experiment import KEYS
    selected, refs = set(), set()
    for way in osmium.FileProcessor(str(source), entities=osmium.osm.WAY):
        check()
        if category_for({t.k:t.v for t in way.tags}):
            selected.add(way.id)
            if len(selected) > CAPS['selectedWayIds']: raise ValueError('selected way ID cap exceeded')
            for node in way.nodes:
                refs.add(node.ref)
                if len(refs) > CAPS['referencedNodeIds']: raise ValueError('referenced node ID cap exceeded')
    stats = dict(sourcePasses=3, selectedWays=len(selected), referenceIds=len(refs), writtenNodes=0, writtenWays=0)
    if output.exists(): raise FileExistsError(output)
    check()
    with osmium.SimpleWriter(str(output)) as writer:
        for node in osmium.FileProcessor(str(source), entities=osmium.osm.NODE):
            check()
            if node.id in refs or (any(k in node.tags for k in KEYS) and category_for({t.k:t.v for t in node.tags})):
                writer.add_node(node); stats['writtenNodes'] += 1
        for way in osmium.FileProcessor(str(source), entities=osmium.osm.WAY):
            check()
            if way.id in selected:
                writer.add_way(way); stats['writtenWays'] += 1
    check()
    return stats
