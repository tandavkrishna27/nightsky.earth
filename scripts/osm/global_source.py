"""Offline, source-local OSM selection. SQLite is disposable build scratch only."""
import argparse
import hashlib
import json
import math
import os
from pathlib import Path
import re
import shutil
import sqlite3
import stat
import time
import unicodedata
import xml.etree.ElementTree as ET

from spot_paths import safe_path

POLICY = 'named-complete-way-v1-polar85'
LIMITS = {'sourceBytes', 'scratchBytes', 'outputBytes', 'rowBytes', 'nodes', 'candidates', 'referencesPerWay', 'seconds', 'freeBytes'}


def canonical(value):
    return json.dumps(value, sort_keys=True, separators=(',', ':'), ensure_ascii=False, allow_nan=False)


def digest(path, check=lambda: None):
    value = hashlib.sha256()
    with safe_path(path).open('rb') as stream:
        while chunk := stream.read(65536):
            check(); value.update(chunk)
    return value.hexdigest()


def descriptor(path):
    path=safe_path(path)
    if path.stat().st_size>1024*1024: raise ValueError('descriptor byte limit')
    return json.loads(path.read_text(encoding='utf8'))


def validate_manifest(m):
    if set(m) != {'schemaVersion', 'policy', 'authorization', 'sources', 'limits'} or m['schemaVersion'] != 1 or m['policy'] != POLICY:
        raise ValueError('manifest schema/policy')
    if not isinstance(m['authorization'], str) or not m['authorization'].strip(): raise ValueError('authorization required')
    limits = m['limits']
    if set(limits) != LIMITS or any(type(v) is not int or v < (0 if k=='freeBytes' else 1) for k,v in limits.items()): raise ValueError('explicit positive limits required')
    if limits['rowBytes'] > 4*1024*1024 or limits['referencesPerWay'] > 100000 or limits['seconds'] > 172800: raise ValueError('unsupported limit')
    if not isinstance(m['sources'], list) or not 1 <= len(m['sources']) <= 64: raise ValueError('source count')
    ids=set(); paths=set(); total=0
    for s in m['sources']:
        if set(s) != {'id','path','format','url','bytes','sha256','vintage','licenseUrl','attribution','clipSha256'}: raise ValueError('source fields')
        if not re.fullmatch(r'[A-Za-z0-9_-]{1,80}',s['id']) or s['id'] in ids: raise ValueError('source identity')
        ids.add(s['id'])
        if not isinstance(s['path'],str) or not Path(s['path']).is_absolute(): raise ValueError('absolute source path required')
        path=safe_path(s['path'])
        if path in paths or not path.is_file(): raise ValueError('source path')
        paths.add(path)
        if s['format'] not in ('xml','pbf'): raise ValueError('source format')
        for key in ('sha256','clipSha256'):
            if not isinstance(s[key],str) or not re.fullmatch('[a-f0-9]{64}',s[key]): raise ValueError('source hash pin')
        if type(s['bytes']) is not int or s['bytes'] < 1: raise ValueError('source bytes')
        total+=s['bytes']
        if not re.fullmatch(r'\d{4}-\d\d-\d\dT\d\d:\d\d:\d\dZ',s['vintage']): raise ValueError('native vintage required')
        if not s['url'].startswith('https://') or 'latest' in s['url'].lower(): raise ValueError('exact source URL required')
        if s['licenseUrl'] != 'https://opendatacommons.org/licenses/odbl/1-0/' or s['attribution'] != '© OpenStreetMap contributors': raise ValueError('OSM rights required')
    if total>limits['sourceBytes']: raise ValueError('source byte limit')
    return m


def manifest_revision(m):
    validate_manifest(m)
    # Machine path and operational ceilings do not change geographic identity.
    identity={'policy':m['policy'],'sources':[{k:v for k,v in s.items() if k!='path'} for s in m['sources']]}
    return 'osm-'+hashlib.sha256(canonical(identity).encode()).hexdigest()


def clean(value):
    value=unicodedata.normalize('NFKC',value or '')
    value=' '.join(''.join(' ' if unicodedata.category(c).startswith('C') else c for c in value).split())
    return value.encode('utf-16-le')[:320].decode('utf-16-le',errors='ignore')


def category(tags):
    if tags.get('leisure')=='park': return 'park'
    if tags.get('tourism')=='viewpoint': return 'viewpoint'
    if tags.get('boundary')=='national_park' or tags.get('leisure')=='nature_reserve' or 'protect_class' in tags: return 'protected-area'
    if tags.get('tourism') in ('camp_site','caravan_site'): return 'campground'
    if tags.get('natural')=='beach': return 'beach'


def entities(source, limit, check):
    """Two-pass XML/PBF records, never pyosmium's in-memory location index."""
    if source['format']=='pbf':
        try: import osmium
        except ImportError as exc: raise ValueError('PBF requires existing optional pyosmium') from exc
        with osmium.io.Reader(str(safe_path(source['path']))) as reader:
            if reader.header().get('osmosis_replication_timestamp') != source['vintage']: raise ValueError('header vintage mismatch')
        for e in osmium.FileProcessor(str(safe_path(source['path']))):
            check()
            if e.is_node(): kind='node'; point=(e.location.lat,e.location.lon) if e.location.valid() else None; refs=[]
            elif e.is_way():
                kind='way'; point=None; refs=[]
                for n in e.nodes:
                    if len(refs)>=limit['referencesPerWay']: raise ValueError('reference limit')
                    refs.append(n.ref)
            else: kind='relation'; point=None; refs=[]
            tags={}
            for t in e.tags:
                tags[t.k]=t.v
                if len(canonical(tags).encode())>limit['rowBytes']: raise ValueError('row byte limit')
            yield kind,int(e.id),tags,point,refs
        return
    parser=ET.XMLPullParser(events=('start','end')); pending=0; root=None; tail=b''; first=True; depth=0
    with safe_path(source['path']).open('rb') as stream:
        while chunk:=stream.read(min(4096,limit['rowBytes'])):
            check(); pending+=len(chunk)
            if pending>limit['rowBytes']+4096: raise ValueError('XML row byte limit')
            probe=(tail+chunk).upper()
            if b'<!DOCTYPE' in probe or b'<!ENTITY' in probe: raise ValueError('XML declarations forbidden')
            tail=probe[-16:]; parser.feed(chunk)
            for event,e in parser.read_events():
                if event=='start':
                    depth+=1
                    if depth==2 and e.tag not in ('node','way','relation','bounds'): raise ValueError('unrecognized XML root child')
                if first:
                    first=False; root=e
                    if e.tag!='osm' or e.get('timestamp')!=source['vintage']: raise ValueError('header vintage mismatch')
                if event!='end': continue
                direct=depth==2; depth-=1
                if not direct: continue
                if len(ET.tostring(e))>limit['rowBytes']: raise ValueError('row byte limit')
                if e.tag=='bounds':
                    root.remove(e);e.clear();pending=0;continue
                kind=e.tag; tags={t.get('k'):t.get('v') for t in e.findall('tag')}; refs=[]
                for n in e.findall('nd'):
                    if len(refs)>=limit['referencesPerWay']: raise ValueError('reference limit')
                    refs.append(int(n.get('ref')))
                point=None
                if kind=='node':
                    try: point=(float(e.get('lat')),float(e.get('lon')))
                    except (ValueError,TypeError): pass
                check()
                yield kind,int(e.get('id')),tags,point,refs
                root.remove(e); e.clear(); pending=0
        parser.close()


def valid(point):
    return point is not None and all(math.isfinite(v) for v in point) and -90<=point[0]<=90 and -180<=point[1]<=180


def output_usage(output):
    """Inventory an already-canonical output; no filesystem verdict is cached.

    scandir names are supplied by the filesystem, not caller path spellings.
    Validate the shared ancestry once at either boundary, and each child with
    non-following metadata before reading its size or descending into it.
    """
    def reject_link(info):
        if stat.S_ISLNK(info.st_mode) or getattr(info,'st_file_attributes',0)&0x400:
            raise ValueError('symlink/reparse point refused')
    def ancestry():
        identities=[]
        # Check outermost first so a newly linked ancestor is rejected before
        # inspecting a descendant through it. Missing/unreadable paths fail closed.
        for path in reversed((output,*output.parents)):
            info=path.lstat(); reject_link(info)
            identities.append((info.st_dev,info.st_ino))
        return identities
    before=ancestry(); total=0; scratch=0
    identities={output:before[-1]}; pending=[output]
    while pending:
        directory=pending.pop()
        # A queued directory or one of its local ancestors may have changed
        # since enumeration. Revalidate the local chain immediately before
        # descent; identities last only for this inventory, never across checks.
        chain=[directory]
        while chain[-1]!=output: chain.append(chain[-1].parent)
        for path in reversed(chain):
            info=path.lstat(); reject_link(info)
            if (info.st_dev,info.st_ino)!=identities[path]:
                raise ValueError('output ancestry mutation')
        with os.scandir(directory) as entries:
            for entry in entries:
                info=entry.stat(follow_symlinks=False); reject_link(info)
                if stat.S_ISDIR(info.st_mode):
                    # Windows DirEntry.stat can report zero inode/device; use
                    # lstat for directory identity on both sides of the queue.
                    path=Path(entry.path);directory_info=path.lstat();reject_link(directory_info)
                    identities[path]=(directory_info.st_dev,directory_info.st_ino);pending.append(path)
                elif stat.S_ISREG(info.st_mode):
                    total+=info.st_size
                    if entry.name.startswith('scratch.sqlite'): scratch+=info.st_size
    if ancestry()!=before: raise ValueError('output ancestry mutation')
    return total,scratch


class ResourceGuard:
    """Deadline each call; filesystem inventory every 100ms or 256 calls.

    These are cooperative checkpoint bounds, not bounds on blocking I/O time.
    Pending explicit writes and phase boundaries always request a fresh scan.
    """
    def __init__(self, output, limits, start):
        self.output=output; self.limits=limits; self.start=start
        self.last_scan=None; self.calls=0

    def deadline(self):
        now=time.monotonic()
        if now-self.start>=self.limits['seconds']: raise ValueError('deadline limit')
        return now

    def check(self, pending_output=0, *, force=False):
        now=self.deadline(); self.calls+=1
        if not (force or pending_output or self.last_scan is None or self.calls>=256 or now-self.last_scan>=.1): return
        total,scratch=output_usage(self.output); limits=self.limits
        if scratch>limits['scratchBytes']: raise ValueError('scratch byte limit')
        if total-scratch+pending_output>limits['outputBytes']: raise ValueError('output/evidence byte limit')
        if total+pending_output>limits['scratchBytes']+limits['outputBytes']: raise ValueError('combined disk limit')
        if shutil.disk_usage(self.output).free<limits['freeBytes']+pending_output: raise ValueError('free reserve limit')
        self.last_scan=self.deadline(); self.calls=0


def build(manifest, output, *, resume=False, hook=lambda stage: None):
    m=validate_manifest(manifest); revision=manifest_revision(m); limits=m['limits']; output=safe_path(output)
    if any(safe_path(s['path']).is_relative_to(output) for s in m['sources']): raise ValueError('source inside output')
    if output.exists() and not resume: raise FileExistsError(output)
    output.mkdir(parents=True,exist_ok=resume); start=time.monotonic()
    guard=ResourceGuard(output,limits,start); check=guard.check
    def verify_sources():
        check(force=True)
        for s in m['sources']:
            p=safe_path(s['path']); before=p.stat()
            if before.st_size!=s['bytes'] or digest(p,check)!=s['sha256']: raise ValueError('source hash/size mismatch')
            after=p.stat()
            if (before.st_ino,before.st_mtime_ns,before.st_size)!=(after.st_ino,after.st_mtime_ns,after.st_size): raise ValueError('source mutation')
        check(force=True)
    verify_sources()
    manifest_hash=hashlib.sha256(canonical(m).encode()).hexdigest(); dbpath=safe_path(output/'scratch.sqlite'); checkpoint=safe_path(output/'checkpoint.json')
    completed=0
    if resume:
        state=descriptor(checkpoint)
        if state['manifestSha256']!=manifest_hash or state['databaseSha256']!=digest(dbpath,check): raise ValueError('checkpoint digest/manifest mismatch')
        completed=state['completedSources']
        if type(completed) is not int or not 0<=completed<=len(m['sources']): raise ValueError('checkpoint source count')
        if (output/'complete.json').exists():
            done=descriptor(output/'complete.json')
            if done.get('catalogueRevision')!=revision or done.get('manifestSha256')!=manifest_hash or done.get('policy')!=POLICY or set(done.get('files',{}))!={'candidates.jsonl','exclusions.jsonl','lineage.jsonl'}: raise ValueError('published identity mismatch')
            for name, pin in done['files'].items():
                if name not in ('candidates.jsonl','exclusions.jsonl','lineage.jsonl') or digest(output/name,check)!=pin['sha256'] or (output/name).stat().st_size!=pin['bytes']: raise ValueError('published digest mismatch')
            check(force=True); return output
        for name in ('candidates.jsonl','exclusions.jsonl','lineage.jsonl'):
            if (output/name).exists(): raise ValueError('partial output present; preserve evidence and use fresh output')
    elif dbpath.exists(): raise ValueError('unexpected scratch')
    db=sqlite3.connect(dbpath)
    try:
        db.execute('PRAGMA journal_mode=DELETE'); db.execute('PRAGMA cache_size=-2048'); db.execute('PRAGMA temp_store=FILE')
        page_size=db.execute('PRAGMA page_size').fetchone()[0]
        max_pages=limits['scratchBytes']//page_size
        if max_pages<1 or db.execute('PRAGMA page_count').fetchone()[0]>max_pages: raise ValueError('scratch byte limit')
        # Hard cap for the main database only. DELETE journal and other scratch
        # files are accounted by the bounded inventories, not by this pragma.
        db.execute(f'PRAGMA max_page_count={max_pages}')
        db.executescript('CREATE TABLE IF NOT EXISTS nodes(id INTEGER PRIMARY KEY, lat REAL, lon REAL); CREATE TABLE IF NOT EXISTS candidates(id TEXT PRIMARY KEY, body TEXT, vintage TEXT); CREATE TABLE IF NOT EXISTS lineage(id TEXT, source TEXT, PRIMARY KEY(id,source)); CREATE TABLE IF NOT EXISTS exclusions(source TEXT,id TEXT,reason TEXT); CREATE INDEX IF NOT EXISTS exclusion_order ON exclusions(source,id,reason);')
        def save(count):
            check(force=True)
            db.commit(); payload={'manifestSha256':manifest_hash,'databaseSha256':digest(dbpath,check),'completedSources':count,'catalogueRevision':revision}
            temp=output/'checkpoint.tmp'
            encoded=canonical(payload).encode();check(len(encoded))
            with safe_path(temp).open('xb') as f: f.write(encoded)
            safe_path(temp); safe_path(checkpoint)
            os.replace(temp,checkpoint)
            check(force=True)
        if not resume: save(0)
        for index,s in enumerate(m['sources']):
            if index<completed: continue
            db.execute('BEGIN'); db.execute('DELETE FROM nodes'); node_count=0; candidate_count=db.execute('SELECT count(*) FROM candidates').fetchone()[0]
            for kind, oid, tags, point, refs in entities(s,limits,check):
                if kind!='node' or not valid(point): continue
                node_count+=1
                if node_count>limits['nodes']: raise ValueError('node limit')
                previous=db.execute('SELECT lat,lon FROM nodes WHERE id=?',(oid,)).fetchone()
                if previous is not None and tuple(point)!=previous: raise ValueError('node identity conflict')
                db.execute('INSERT OR IGNORE INTO nodes VALUES(?,?,?)',(oid,*point))
            check(force=True)
            for kind, oid, tags, point, refs in entities(s,limits,check):
                cat=category(tags); name=clean(tags.get('name') or tags.get('name:en') or tags.get('official_name'))
                if not cat: continue
                reason='relation' if kind=='relation' else 'unnamed' if not name else None
                if kind=='way' and not reason:
                    points=[db.execute('SELECT lat,lon FROM nodes WHERE id=?',(ref,)).fetchone() for ref in refs]
                    if not points or any(p is None for p in points): reason='incomplete'
                    elif max(p[1] for p in points)-min(p[1] for p in points)>180: reason='dateline'
                    elif any(abs(p[0])>=85 for p in points): reason='polar'
                    else:
                        if len(points)>1 and points[0]==points[-1]: points.pop()
                        point=(sum(p[0] for p in points)/len(points),sum(p[1] for p in points)/len(points))
                if not reason and not valid(point): reason='invalid-geometry'
                identity=f'place:v1:osm:{kind}:{oid}'
                if reason:
                    db.execute('INSERT INTO exclusions VALUES(?,?,?)',(s['id'],identity,reason)); continue
                body=canonical(dict(placeId=identity,name=name,category=cat,latitude=round(point[0],6),longitude=round(point[1],6),sourceCompleteness=min(3,1+sum(bool(clean(tags.get(k))) for k in ('website','access','opening_hours'))),regionIds=[],accessEvidence={'status':'unknown'},caveats=['Named nodes and complete ways only; access, darkness and mapped completeness unknown.']))
                prev=db.execute('SELECT body,vintage FROM candidates WHERE id=?',(identity,)).fetchone()
                if prev and prev!=(body,s['vintage']): raise ValueError('candidate identity conflict: '+identity)
                inserted=db.execute('INSERT OR IGNORE INTO candidates VALUES(?,?,?)',(identity,body,s['vintage'])).rowcount
                candidate_count+=inserted
                db.execute('INSERT OR IGNORE INTO lineage VALUES(?,?)',(identity,s['id']))
                if candidate_count>limits['candidates']: raise ValueError('candidate limit')
                if db.execute('SELECT count(*) FROM lineage WHERE id=?',(identity,)).fetchone()[0]>4: raise ValueError('candidate source limit')
            check(force=True); save(index+1); hook('source-complete'); verify_sources(); check(force=True)
        verify_sources()
        sources={s['id']:s for s in m['sources']}; written=0; inventory={}
        def write(name, rows):
            nonlocal written
            check(force=True)
            p=safe_path(output/name)
            with p.open('xb',buffering=0) as f:
                for row in rows:
                    check(); chunk=(canonical(row)+'\n').encode()
                    if len(chunk)>limits['rowBytes'] or written+len(chunk)>limits['outputBytes']: raise ValueError('output row/byte limit')
                    check(len(chunk))
                    written+=len(chunk); f.write(chunk)
            inventory[name]={'bytes':p.stat().st_size,'sha256':digest(p,check)}
            check(force=True)
        def candidates():
            for identity,body in db.execute('SELECT id,body FROM candidates ORDER BY id'):
                row=json.loads(body); row['catalogueRevision']=revision; row['sources']=[]
                for sid, in db.execute('SELECT source FROM lineage WHERE id=? ORDER BY source',(identity,)):
                    s=sources[sid]
                    row['sources'].append(dict(name='OpenStreetMap contributors',url=s['url'],attribution=s['attribution'],dataClass='catalog',vintage=s['vintage'],licenseUrl=s['licenseUrl'],modified=True,product='OSM '+sid+' '+s['sha256']))
                yield row
        write('candidates.jsonl',candidates())
        write('exclusions.jsonl',(dict(source=s,id=i,reason=r) for s,i,r in db.execute('SELECT * FROM exclusions ORDER BY source,id,reason')))
        write('lineage.jsonl',(dict(placeId=i,source=s,sha256=sources[s]['sha256'],vintage=sources[s]['vintage'],policy=m['policy']) for i,s in db.execute('SELECT * FROM lineage ORDER BY id,source')))
        verify_sources(); check()
        payload=canonical(dict(schemaVersion=1,catalogueRevision=revision,manifestSha256=manifest_hash,files=inventory,coverage='unknown; clipping metadata is not coverage',policy=m['policy'])).encode()
        check(len(payload))
        with safe_path(output/'complete.json').open('xb') as f: f.write(payload)
        check(force=True)
        return output
    finally:
        db.close()


if __name__=='__main__':
    parser=argparse.ArgumentParser(description=__doc__); parser.add_argument('manifest'); parser.add_argument('output'); parser.add_argument('--resume',action='store_true'); args=parser.parse_args()
    path=safe_path(args.manifest)
    if path.stat().st_size>1024*1024: raise ValueError('manifest byte limit')
    build(json.loads(path.read_text(encoding='utf8')),args.output,resume=args.resume)
