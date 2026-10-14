"""Capability-injected acquisition safeguards. No live network entry point."""
import hashlib
import os
import stat
import time
import urllib.request
from datetime import datetime, timezone
from pathlib import Path
import osmium
from spot_manifest import validate_source


def validate_source_header(path, source):
    reader = osmium.io.Reader(osmium.io.File(str(path), 'pbf'), osmium.osm.NOTHING)
    try:
        vintage = reader.header().get('osmosis_replication_timestamp')
    finally:
        reader.close()
    if not vintage or vintage != source['expectedVintage']:
        raise ValueError('Source PBF header vintage mismatch')
    return {'vintage':vintage, 'field':'osmosis_replication_timestamp'}


def acquire_source(source, root, *, opener=None, deadline=None, budget_check=None):
    source = validate_source(source)
    if opener is None: raise ValueError('Explicit injected opener capability required; live acquisition disabled')
    lexical_root = Path(os.path.abspath(root))
    for ancestor in (lexical_root, *lexical_root.parents):
        metadata = ancestor.lstat()
        if stat.S_ISLNK(metadata.st_mode) or getattr(metadata, 'st_file_attributes', 0) & 0x400:
            raise ValueError('Acquisition root or ancestor is a symlink/reparse point')
    root = lexical_root.resolve(strict=True)
    if not root.is_dir(): raise ValueError('Acquisition root must be an existing directory')
    final = root / (source['id']+'.osm.pbf')
    partial = root / (source['id']+'.osm.pbf.partial')
    if final.exists() or partial.exists() or final.is_symlink() or partial.is_symlink():
        raise FileExistsError('Source evidence path already exists')
    deadline = min(deadline if deadline is not None else float('inf'),time.monotonic()+60)
    budget_check = budget_check or (lambda extra: None)
    def check(extra=0):
        if time.monotonic() >= deadline: raise TimeoutError('Acquisition deadline exceeded')
        budget_check(extra)
        if time.monotonic() >= deadline: raise TimeoutError('Acquisition deadline exceeded')
    def response(method):
        check()
        request=urllib.request.Request(source['url'],method=method,headers={'Accept-Encoding':'identity'})
        reply=opener(request,timeout=min(15,max(0.001,deadline-time.monotonic())))
        return reply
    def metadata(reply):
        check()
        get_all = getattr(reply.headers, 'get_all', None)
        if get_all is not None:
            for name in ('Content-Length', 'ETag', 'Content-Encoding'):
                if len(get_all(name, [])) > 1:
                    raise ValueError(f'HTTP duplicate {name} rejected')
        length=reply.headers.get('Content-Length')
        if reply.status != 200 or reply.geturl() != source['url']: raise ValueError('HTTP status or redirect mismatch')
        if not isinstance(length,str) or not length.isascii() or not length.isdigit() or int(length) != source['declaredBytes']: raise ValueError('HTTP Content-Length mismatch')
        if reply.headers.get('ETag') != source['etag']: raise ValueError('HTTP ETag mismatch')
        if reply.headers.get('Content-Encoding') not in (None,'identity'): raise ValueError('HTTP Content-Encoding rejected')
    with response('HEAD') as reply: metadata(reply)
    check(source['declaredBytes'])
    size=0; digest=hashlib.sha256()
    with response('GET') as reply:
        metadata(reply)
        with partial.open('xb') as output:
            while True:
                check()
                chunk=reply.read(min(65536,source['declaredBytes']-size+1))
                check()
                if not chunk: break
                if size+len(chunk)>source['declaredBytes']: raise ValueError('Body byte cap exceeded')
                check(len(chunk))
                output.write(chunk); output.flush()
                size+=len(chunk); digest.update(chunk)
                check()
    if size != source['declaredBytes']: raise ValueError('Short body')
    check()
    header=validate_source_header(partial,source)
    check()
    # Promotion refuses an existing destination on both supported paths.
    if os.name == 'nt':
        partial.rename(final)  # Windows rename refuses an existing destination.
    else:
        check(size)  # Count both logical paths until staging unlink completes.
        os.link(partial,final)
        partial.unlink()
    return {'sourceId':source['id'],'path':str(final),'bytes':size,'sha256':digest.hexdigest(),'expectedVintage':source['expectedVintage'],'actualVintage':header['vintage'],'retrievedAt':datetime.now(timezone.utc).isoformat(),'etag':source['etag'],'url':source['url']}
