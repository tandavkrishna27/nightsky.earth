"""Offline, source-local OSM selection. SQLite is disposable build scratch only."""
import argparse
from contextlib import contextmanager
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
from normalized_partitions import (LAYOUT,MAX_OUTPUT_BYTES,MAX_SAFE_INTEGER,MAX_DESCRIPTOR_BYTES,
    PartRegistry,write_partitioned_stream,verify_partitioned_streams,strict_json)

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


def verify_planet_domain(source, policy):
    pin=source['sourceDomain']
    if set(pin)!={'kind','path','bytes','sha256'} or pin['kind']!='planet-domain-v1' or not isinstance(pin['path'],str) or not Path(pin['path']).is_absolute(): raise ValueError('planet descriptor pin')
    def pinned(path,p):
        if type(p['bytes']) is not int or not 1<=p['bytes']<=4*1024*1024 or not isinstance(p['sha256'],str) or not re.fullmatch('[a-f0-9]{64}',p['sha256']): raise ValueError('planet evidence pin')
        path=safe_path(path)
        with path.open('rb') as f:
            before=os.fstat(f.fileno())
            if not stat.S_ISREG(before.st_mode) or before.st_size!=p['bytes']: raise ValueError('planet evidence size')
            data=f.read(p['bytes']+1);after=os.fstat(f.fileno())
        safe_path(path)
        if len(data)!=p['bytes'] or hashlib.sha256(data).hexdigest()!=p['sha256'] or (before.st_size,before.st_mtime_ns,before.st_ino)!=(after.st_size,after.st_mtime_ns,after.st_ino): raise ValueError('planet evidence digest/mutation')
        return data
    d=json.loads(pinned(pin['path'],pin))
    keys={'schemaVersion','kind','sourceUrl','edition','provider','providerWholeWorldEvidence','providerObject','raw','nativeVintage','nativeVintageEvidence','domain','selectionPolicy','coverageClaim'}
    if set(d)!=keys or d['schemaVersion']!=1 or d['kind']!='planet-domain-v1' or d['coverageClaim']!='source-domain-only' or d['domain']!={'west':-180,'south':-90,'east':180,'north':90}: raise ValueError('planet domain semantics')
    if d['sourceUrl']!=source['url'] or d['raw']!={'bytes':source['bytes'],'sha256':source['sha256']} or d['nativeVintage']!=source['vintage'] or d['selectionPolicy']!=policy: raise ValueError('planet source binding')
    if any(not isinstance(d[k],str) or not d[k].strip() or len(d[k])>4096 for k in ('edition','provider')): raise ValueError('planet provider/edition')
    obj=d['providerObject']
    if not isinstance(obj,dict) or set(obj)!={'version','etag','md5'} or any(not isinstance(obj[k],str) or not obj[k].strip() or len(obj[k])>4096 for k in obj) or not re.fullmatch('[a-f0-9]{32}',obj['md5']): raise ValueError('planet provider object')
    for key in ('providerWholeWorldEvidence','nativeVintageEvidence'):
        p=d[key]
        if not isinstance(p,dict) or set(p)!={'path','bytes','sha256'} or not isinstance(p['path'],str) or not p['path'] or len(p['path'])>240 or '\\' in p['path'] or ':' in p['path'] or any(part in ('','.','..') for part in p['path'].split('/')): raise ValueError('planet evidence path')
        data=pinned(Path(pin['path']).parent/p['path'],p)
        if key=='nativeVintageEvidence' and json.loads(data)!={'schemaVersion':1,'kind':'native-vintage-observation','raw':d['raw'],'nativeVintage':d['nativeVintage']}: raise ValueError('planet native vintage observation')
    return d


def planet_retained_paths(manifest):
    paths=[]
    for source in manifest['sources']:
        if 'sourceDomain' not in source: continue
        d=verify_planet_domain(source,manifest['policy']);path=safe_path(source['sourceDomain']['path'])
        paths.extend([path,*[safe_path(path.parent/d[k]['path']) for k in ('providerWholeWorldEvidence','nativeVintageEvidence')]])
    return list(dict.fromkeys(paths))


def validate_manifest(m):
    partitioned=m.get('schemaVersion')==2 and type(m.get('schemaVersion')) is int
    fields={'schemaVersion', 'policy', 'authorization', 'sources', 'limits'}|({'evidenceLayout'} if partitioned else set())
    if set(m) != fields or m['schemaVersion'] not in (1,2) or m['policy'] != POLICY:
        raise ValueError('manifest schema/policy')
    if m['schemaVersion']==2 and not partitioned:raise ValueError('manifest schema/policy')
    if partitioned and (m['evidenceLayout']!=LAYOUT or any(type(m['evidenceLayout'].get(key)) is not int for key in ('maxPartBytes','maxParts'))):raise ValueError('partition evidence layout')
    if not isinstance(m['authorization'], str) or not m['authorization'].strip(): raise ValueError('authorization required')
    limits = m['limits']
    if set(limits) != LIMITS or any(type(v) is not int or v < (0 if k=='freeBytes' else 1) for k,v in limits.items()): raise ValueError('explicit positive limits required')
    if partitioned and (any(value>MAX_SAFE_INTEGER for value in limits.values()) or limits['outputBytes']>MAX_OUTPUT_BYTES):raise ValueError('partition explicit safe aggregate output limit')
    if limits['rowBytes'] > 4*1024*1024 or limits['referencesPerWay'] > 100000 or limits['seconds'] > 172800: raise ValueError('unsupported limit')
    if not isinstance(m['sources'], list) or not 1 <= len(m['sources']) <= 64: raise ValueError('source count')
    ids=set(); paths=set(); total=0
    for s in m['sources']:
        if set(s) != {'id','path','format','url','bytes','sha256','vintage','licenseUrl','attribution', 'sourceDomain' if 'sourceDomain' in s else 'clipSha256'}: raise ValueError('source fields')
        if not re.fullmatch(r'[A-Za-z0-9_-]{1,80}',s['id']) or s['id'] in ids: raise ValueError('source identity')
        ids.add(s['id'])
        if not isinstance(s['path'],str) or not Path(s['path']).is_absolute(): raise ValueError('absolute source path required')
        path=safe_path(s['path'])
        if path in paths or not path.is_file(): raise ValueError('source path')
        paths.add(path)
        if s['format'] not in ('xml','pbf'): raise ValueError('source format')
        for key in (('sha256',) if 'sourceDomain' in s else ('sha256','clipSha256')):
            if not isinstance(s[key],str) or not re.fullmatch('[a-f0-9]{64}',s[key]): raise ValueError('source hash pin')
        if type(s['bytes']) is not int or s['bytes'] < 1: raise ValueError('source bytes')
        total+=s['bytes']
        if 'sourceDomain' in s: verify_planet_domain(s,m['policy'])
        if not re.fullmatch(r'\d{4}-\d\d-\d\dT\d\d:\d\d:\d\dZ',s['vintage']): raise ValueError('native vintage required')
        if not s['url'].startswith('https://') or 'latest' in s['url'].lower(): raise ValueError('exact source URL required')
        if s['licenseUrl'] != 'https://opendatacommons.org/licenses/odbl/1-0/' or s['attribution'] != '© OpenStreetMap contributors': raise ValueError('OSM rights required')
    if total>limits['sourceBytes']: raise ValueError('source byte limit')
    return m


def manifest_revision(m):
    validate_manifest(m)
    # Machine path and operational ceilings do not change geographic identity.
    identity={'policy':m['policy'],'sources':[{k:({dk:dv for dk,dv in v.items() if dk!='path'} if k=='sourceDomain' else v) for k,v in s.items() if k!='path'} for s in m['sources']]}
    if m['schemaVersion']==2:identity.update(evidenceLayout=m['evidenceLayout'])
    return 'osm-'+hashlib.sha256(canonical(identity).encode()).hexdigest()


def partition_counts(db,manifest,completed,check=lambda:None):
    """Recompute frozen table witnesses; only O(source count) Python state."""
    if not 1<=len(manifest['sources'])<=64 or type(completed) is not int or not 0<=completed<=len(manifest['sources']):raise ValueError('frozen source cardinality')
    source_ids=[source['id'] for source in manifest['sources']]
    allowed=set(source_ids[:completed])
    def bounded(query,stats=False):
        result={};check()
        for row in db.execute(query):
            check();source=row[0]
            if source not in allowed or source in result or len(result)>=len(allowed):raise ValueError('frozen unknown/duplicate source counters')
            result[source]=tuple(row[1:]) if stats else row[1]
        return result
    stats=bounded('SELECT source,selected,accepted,excluded FROM source_counts LIMIT 65',True)
    if set(stats)!=allowed:raise ValueError('frozen completed source counters')
    lineages=bounded('SELECT source,count(*) FROM lineage GROUP BY source LIMIT 65')
    exclusions=bounded('SELECT source,count(*) FROM exclusions GROUP BY source LIMIT 65')
    rows=[]
    for source in source_ids:
        selected,accepted,excluded=stats.get(source,(0,0,0));lineage=lineages.get(source,0)
        if any(type(n) is not int or not 0<=n<=MAX_SAFE_INTEGER for n in (selected,accepted,excluded,lineage)) or selected!=accepted+excluded or excluded!=exclusions.get(source,0) or accepted<lineage:raise ValueError('frozen per-source count reconciliation')
        rows.append(dict(id=source,selected=selected,accepted=accepted,excluded=excluded,lineage=lineage))
    a=db.execute('SELECT count(*) FROM candidates').fetchone()[0];l=sum(lineages.values());e=sum(exclusions.values())
    s=sum(row['selected'] for row in rows);r=sum(row['accepted'] for row in rows);d=r-l
    if not a<=l<=4*a or d<0 or s!=r+e or any(n>MAX_SAFE_INTEGER for n in (a,l,e,s,r,d)):raise ValueError('frozen global count reconciliation')
    return dict(accepted=a,lineage=l,exclusions=e,selectedOccurrences=s,acceptedOccurrences=r,duplicateAcceptedOccurrences=d,sources=rows)


def partition_descriptor(path,check):
    check();path=safe_path(path)
    with path.open('rb') as handle:
        before=os.fstat(handle.fileno())
        if not stat.S_ISREG(before.st_mode) or before.st_size>MAX_DESCRIPTOR_BYTES:raise ValueError('partition descriptor byte limit')
        payload=handle.read(before.st_size+1);after=os.fstat(handle.fileno())
    if len(payload)!=before.st_size or (before.st_dev,before.st_ino,before.st_size,before.st_mtime_ns)!=(after.st_dev,after.st_ino,after.st_size,after.st_mtime_ns):raise ValueError('partition descriptor mutation')
    safe_path(path);check();return payload,strict_json(payload.decode('utf8'))


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
    """Streaming XML/PBF records, never pyosmium's in-memory location index."""
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


@contextmanager
def admitted_raw_leases(sources):
    """Windows production holds deny-write/delete handles through all raw passes.

    Other platforms retain repeated hash/stat checks; this pipeline's production
    process containment remains Windows-only. No additional raw copy is made.
    """
    handles=[]
    if os.name=='nt':
        import ctypes
        from ctypes import wintypes
        kernel=ctypes.WinDLL('kernel32',use_last_error=True)
        kernel.CreateFileW.argtypes=[wintypes.LPCWSTR,wintypes.DWORD,wintypes.DWORD,ctypes.c_void_p,wintypes.DWORD,wintypes.DWORD,wintypes.HANDLE]
        kernel.CreateFileW.restype=wintypes.HANDLE
        kernel.CloseHandle.argtypes=[wintypes.HANDLE]
    try:
        if os.name=='nt':
            for source in sources:
                handle=kernel.CreateFileW(str(safe_path(source['path'])),0x80000000,1,None,3,0x80,None)
                if handle==ctypes.c_void_p(-1).value: raise ValueError('admitted raw write/delete lease refused')
                handles.append(handle)
        yield
    finally:
        if os.name=='nt':
            for handle in handles: kernel.CloseHandle(handle)


def build(manifest, output, *, resume=False, hook=lambda stage: None, geography_mode='all-nodes', admission_check=None, admission_snapshot=None):
    """Library primitive; production entry points must supply their checked admission.

    Admission is supplied by trusted calling code, never selected by the manifest.
    Legacy synthetic fixture calls intentionally exercise this primitive directly.
    """
    if (admission_check is None) != (admission_snapshot is None): raise ValueError('admission callback and snapshot required together')
    if admission_check is not None: admission_check('raw-before')
    if geography_mode not in ('all-nodes','selected-references'): raise ValueError('geography mode')
    m=validate_manifest(manifest); revision=manifest_revision(m); limits=m['limits']; output=safe_path(output)
    partitioned=m['schemaVersion']==2
    if any(safe_path(s['path']).is_relative_to(output) for s in m['sources']): raise ValueError('source inside output')
    if partitioned and resume and not (output/'complete.json').is_file():raise ValueError('partial partition resume refused; retain evidence and use a separately admitted new attempt')
    if output.exists() and not resume: raise FileExistsError(output)
    if not (partitioned and resume):output.mkdir(parents=True,exist_ok=resume)
    start=time.monotonic()
    guard=ResourceGuard(output,limits,start); check=guard.check
    source_witnesses={}
    def verify_sources():
        check(force=True)
        for s in m['sources']:
            if 'sourceDomain' in s: verify_planet_domain(s,m['policy'])
            p=safe_path(s['path']); before=p.stat()
            witness=(before.st_dev,before.st_ino,before.st_size,before.st_mtime_ns,before.st_ctime_ns)
            if admission_check is not None and p in source_witnesses and source_witnesses[p]!=witness: raise ValueError('admitted source changed between passes')
            source_witnesses[p]=witness
            if before.st_size!=s['bytes'] or digest(p,check)!=s['sha256']: raise ValueError('source hash/size mismatch')
            after=p.stat()
            if (before.st_ino,before.st_mtime_ns,before.st_size)!=(after.st_ino,after.st_mtime_ns,after.st_size): raise ValueError('source mutation')
        check(force=True)
    verify_sources()
    source_domains=[dict(sourceId=s['id'],**s['sourceDomain']) for s in m['sources'] if 'sourceDomain' in s]
    manifest_hash=hashlib.sha256(canonical(m).encode()).hexdigest(); dbpath=safe_path(output/'scratch.sqlite'); checkpoint=safe_path(output/'checkpoint.json')
    def checkpoint_identity(counts):
        return dict(schemaVersion=2,kind='partitioned-normalized-checkpoint-v1',manifestSha256=manifest_hash,
            catalogueRevision=revision,geographyMode=geography_mode,evidenceLayout=m['evidenceLayout'],
            completedSources=len(m['sources']),countsSha256=hashlib.sha256(canonical(counts).encode()).hexdigest(),
            **({'admissionSnapshotSha256':admission_snapshot} if admission_snapshot is not None else {}))
    if partitioned and resume:
        checkpoint_bytes,state=partition_descriptor(checkpoint,check)
        completion_bytes,done=partition_descriptor(output/'complete.json',check)
        db=sqlite3.connect(dbpath.as_uri()+'?mode=ro',uri=True)
        try:
            db.set_progress_handler(lambda:(check() or 0),1000)
            counts=partition_counts(db,m,len(m['sources']),check)
        finally:db.close()
        if set(state)!=set(checkpoint_identity(counts))|{'databaseSha256'} or any(canonical(state.get(k))!=canonical(v) for k,v in checkpoint_identity(counts).items()) or state['databaseSha256']!=digest(dbpath,check):raise ValueError('frozen checkpoint identity/digest/counts mismatch')
        identity=dict(schemaVersion=2,kind='partitioned-normalized-osm-v1',catalogueRevision=revision,
            manifestSha256=manifest_hash,policy=m['policy'],geographyMode=geography_mode,sourceDomains=source_domains,
            counts=counts,checkpoint=dict(bytes=len(checkpoint_bytes),sha256=hashlib.sha256(checkpoint_bytes).hexdigest()),
            **({'admissionSnapshotSha256':admission_snapshot} if admission_snapshot is not None else {}))
        if set(done)!=set(identity)|{'streams'} or any(canonical(done.get(k))!=canonical(v) for k,v in identity.items()):raise ValueError('frozen completion identity/counts mismatch')
        verify_partitioned_streams(output,done['streams'],check,row_limit=limits['rowBytes'],max_bytes=limits['outputBytes'],
            expected_counts=dict(candidates=counts['accepted'],lineage=counts['lineage'],exclusions=counts['exclusions']))
        verify_sources()
        if admission_check is not None:admission_check('resume')
        verify_sources()
        verify_partitioned_streams(output,done['streams'],check,row_limit=limits['rowBytes'],max_bytes=limits['outputBytes'],
            expected_counts=dict(candidates=counts['accepted'],lineage=counts['lineage'],exclusions=counts['exclusions']))
        if partition_descriptor(checkpoint,check)[0]!=checkpoint_bytes or partition_descriptor(output/'complete.json',check)[0]!=completion_bytes or digest(dbpath,check)!=state['databaseSha256']:raise ValueError('frozen completed verification mutation')
        check(force=True);return output
    completed=0
    if resume:
        state=descriptor(checkpoint)
        if state.get('geographyMode','all-nodes')!=geography_mode: raise ValueError('checkpoint geography mode mismatch')
        if state.get('admissionSnapshotSha256')!=admission_snapshot: raise ValueError('checkpoint admission identity mismatch')
        if state['manifestSha256']!=manifest_hash or state['databaseSha256']!=digest(dbpath,check): raise ValueError('checkpoint digest/manifest mismatch')
        completed=state['completedSources']
        if type(completed) is not int or not 0<=completed<=len(m['sources']): raise ValueError('checkpoint source count')
        if (output/'complete.json').exists():
            done=descriptor(output/'complete.json')
            if done.get('geographyMode','all-nodes')!=geography_mode: raise ValueError('published geography mode mismatch')
            if done.get('admissionSnapshotSha256')!=admission_snapshot: raise ValueError('published admission identity mismatch')
            if done.get('catalogueRevision')!=revision or done.get('manifestSha256')!=manifest_hash or done.get('policy')!=POLICY or set(done.get('files',{}))!={'candidates.jsonl','exclusions.jsonl','lineage.jsonl'}: raise ValueError('published identity mismatch')
            if done.get('sourceDomains',[])!=source_domains: raise ValueError('published planet domain mismatch')
            for name, pin in done['files'].items():
                if name not in ('candidates.jsonl','exclusions.jsonl','lineage.jsonl') or digest(output/name,check)!=pin['sha256'] or (output/name).stat().st_size!=pin['bytes']: raise ValueError('published digest mismatch')
            check(force=True)
            if admission_check is not None: admission_check('resume')
            return output
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
        if partitioned:
            db.executescript('CREATE TABLE source_counts(source TEXT PRIMARY KEY,selected INTEGER NOT NULL,accepted INTEGER NOT NULL,excluded INTEGER NOT NULL); CREATE INDEX lineage_source ON lineage(source);')
            db.set_progress_handler(lambda:(check() or 0),1000)
        written=0
        def consume(amount):
            nonlocal written
            if type(amount) is not int or amount<0:raise ValueError('aggregate output byte amount')
            if written+amount>limits['outputBytes']:raise ValueError(f"aggregate output byte limit: written={written}, pending={amount}, allowance={limits['outputBytes']}, deficit={written+amount-limits['outputBytes']}")
            check(amount);written+=amount
        def save(count):
            check(force=True)
            db.commit(); payload={'manifestSha256':manifest_hash,'databaseSha256':digest(dbpath,check),'completedSources':count,'catalogueRevision':revision,'geographyMode':geography_mode,**({'admissionSnapshotSha256':admission_snapshot} if admission_snapshot is not None else {})}
            if partitioned:
                counts=partition_counts(db,m,count,check)
                payload.update(schemaVersion=2,kind='partitioned-normalized-checkpoint-v1',evidenceLayout=m['evidenceLayout'],
                    countsSha256=hashlib.sha256(canonical(counts).encode()).hexdigest())
            temp=output/'checkpoint.tmp'
            encoded=canonical(payload).encode()
            if partitioned:
                if len(encoded)>MAX_DESCRIPTOR_BYTES:raise ValueError('checkpoint descriptor byte limit')
                consume(len(encoded))
            else:check(len(encoded))
            with safe_path(temp).open('xb') as f:
                f.write(encoded)
                if partitioned:f.flush();os.fsync(f.fileno())
            safe_path(temp); safe_path(checkpoint)
            os.replace(temp,checkpoint)
            check(force=True)
        if not resume: save(0)
        for index,s in enumerate(m['sources']):
            if index<completed: continue
            db.execute('BEGIN'); db.execute('DELETE FROM nodes'); node_count=0; candidate_count=db.execute('SELECT count(*) FROM candidates').fetchone()[0]
            selected_occurrences=accepted_occurrences=excluded_occurrences=0
            if geography_mode=='selected-references':
                # The disk-backed placeholder set shares the main database cap.
                # No global Python reference set or location index is retained.
                for kind, oid, tags, point, refs in entities(s,limits,check):
                    if kind=='way' and category(tags) and clean(tags.get('name') or tags.get('name:en') or tags.get('official_name')):
                        for ref in refs:
                            check()
                            db.execute('INSERT OR IGNORE INTO nodes(id) VALUES(?)',(ref,))
                check(force=True)
            last_node=None
            for kind, oid, tags, point, refs in entities(s,limits,check):
                if kind!='node' or not valid(point): continue
                node_count+=1
                if node_count>limits['nodes']: raise ValueError('node limit')
                if geography_mode=='selected-references':
                    # Sorted valid-node IDs permit exact duplicate validation for
                    # ALL valid nodes using only the immediately previous record.
                    if last_node is not None:
                        if oid<last_node[0]: raise ValueError('node order: selected-references requires nondecreasing valid-node IDs')
                        if oid==last_node[0] and tuple(point)!=last_node[1]: raise ValueError('node identity conflict')
                    last_node=(oid,tuple(point))
                    db.execute('UPDATE nodes SET lat=?,lon=? WHERE id=?',(*point,oid))
                    continue
                previous=db.execute('SELECT lat,lon FROM nodes WHERE id=?',(oid,)).fetchone()
                if previous is not None and tuple(point)!=previous: raise ValueError('node identity conflict')
                db.execute('INSERT OR IGNORE INTO nodes VALUES(?,?,?)',(oid,*point))
            check(force=True)
            for kind, oid, tags, point, refs in entities(s,limits,check):
                cat=category(tags); name=clean(tags.get('name') or tags.get('name:en') or tags.get('official_name'))
                if not cat: continue
                if partitioned:selected_occurrences+=1
                reason='relation' if kind=='relation' else 'unnamed' if not name else None
                if kind=='way' and not reason:
                    points=[db.execute('SELECT lat,lon FROM nodes WHERE id=?',(ref,)).fetchone() for ref in refs]
                    if not points or any(p is None or p[0] is None for p in points): reason='incomplete'
                    elif max(p[1] for p in points)-min(p[1] for p in points)>180: reason='dateline'
                    elif any(abs(p[0])>=85 for p in points): reason='polar'
                    else:
                        if len(points)>1 and points[0]==points[-1]: points.pop()
                        point=(sum(p[0] for p in points)/len(points),sum(p[1] for p in points)/len(points))
                if not reason and not valid(point): reason='invalid-geometry'
                identity=f'place:v1:osm:{kind}:{oid}'
                if reason:
                    if partitioned:excluded_occurrences+=1
                    db.execute('INSERT INTO exclusions VALUES(?,?,?)',(s['id'],identity,reason)); continue
                if partitioned:accepted_occurrences+=1
                body=canonical(dict(placeId=identity,name=name,category=cat,latitude=round(point[0],6),longitude=round(point[1],6),sourceCompleteness=min(3,1+sum(bool(clean(tags.get(k))) for k in ('website','access','opening_hours'))),regionIds=[],accessEvidence={'status':'unknown'},caveats=['Named nodes and complete ways only; access, darkness and mapped completeness unknown.']))
                prev=db.execute('SELECT body,vintage FROM candidates WHERE id=?',(identity,)).fetchone()
                if prev and prev!=(body,s['vintage']): raise ValueError('candidate identity conflict: '+identity)
                inserted=db.execute('INSERT OR IGNORE INTO candidates VALUES(?,?,?)',(identity,body,s['vintage'])).rowcount
                candidate_count+=inserted
                db.execute('INSERT OR IGNORE INTO lineage VALUES(?,?)',(identity,s['id']))
                if candidate_count>limits['candidates']: raise ValueError('candidate limit')
                if db.execute('SELECT count(*) FROM lineage WHERE id=?',(identity,)).fetchone()[0]>4: raise ValueError('candidate source limit')
            if partitioned:
                if selected_occurrences>MAX_SAFE_INTEGER:raise ValueError('source counter safe integer limit')
                db.execute('INSERT INTO source_counts VALUES(?,?,?,?)',(s['id'],selected_occurrences,accepted_occurrences,excluded_occurrences))
            check(force=True); save(index+1); hook('source-complete'); verify_sources(); check(force=True)
        verify_sources()
        sources={s['id']:s for s in m['sources']}; inventory={}
        if not partitioned:written=0
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
        exclusion_rows=lambda:(dict(source=s,id=i,reason=r) for s,i,r in db.execute('SELECT * FROM exclusions ORDER BY source,id,reason'))
        lineage_rows=lambda:(dict(placeId=i,source=s,sha256=sources[s]['sha256'],vintage=sources[s]['vintage'],policy=m['policy']) for i,s in db.execute('SELECT * FROM lineage ORDER BY id,source'))
        if partitioned:
            counts=partition_counts(db,m,len(m['sources']),check);registry=PartRegistry();streams={}
            def checked_rows(rows):
                for row in rows:
                    check()
                    if len((canonical(row)+'\n').encode())>limits['rowBytes']:raise ValueError('output row byte limit')
                    yield row
            for family,rows in (('candidates',candidates()),('lineage',lineage_rows()),('exclusions',exclusion_rows())):
                streams[family]=write_partitioned_stream(output,family,checked_rows(rows),check,consume,registry=registry)
            verify_partitioned_streams(output,streams,check,row_limit=limits['rowBytes'],max_bytes=limits['outputBytes'],
                expected_counts=dict(candidates=counts['accepted'],lineage=counts['lineage'],exclusions=counts['exclusions']))
        else:
            write('candidates.jsonl',candidates())
            write('exclusions.jsonl',exclusion_rows())
            write('lineage.jsonl',lineage_rows())
        verify_sources(); check()
        if admission_check is not None: admission_check('raw-after')
        if partitioned:
            frozen_counts=partition_counts(db,m,len(m['sources']),check)
            checkpoint_bytes,state=partition_descriptor(checkpoint,check)
            if counts!=frozen_counts or set(state)!=set(checkpoint_identity(counts))|{'databaseSha256'} or any(canonical(state.get(k))!=canonical(v) for k,v in checkpoint_identity(counts).items()) or state['databaseSha256']!=digest(dbpath,check):raise ValueError('frozen checkpoint identity/digest/counts mismatch')
            verify_partitioned_streams(output,streams,check,row_limit=limits['rowBytes'],max_bytes=limits['outputBytes'],
                expected_counts=dict(candidates=counts['accepted'],lineage=counts['lineage'],exclusions=counts['exclusions']))
            payload=canonical(dict(schemaVersion=2,kind='partitioned-normalized-osm-v1',catalogueRevision=revision,
                manifestSha256=manifest_hash,policy=m['policy'],geographyMode=geography_mode,sourceDomains=source_domains,
                streams=streams,counts=counts,checkpoint=dict(bytes=len(checkpoint_bytes),sha256=hashlib.sha256(checkpoint_bytes).hexdigest()),
                **({'admissionSnapshotSha256':admission_snapshot} if admission_snapshot is not None else {}))).encode()
            if len(payload)>MAX_DESCRIPTOR_BYTES:raise ValueError('completion descriptor byte limit')
            consume(len(payload))
        else:
            payload=canonical(dict(schemaVersion=1,catalogueRevision=revision,manifestSha256=manifest_hash,files=inventory,coverage='unknown; clipping metadata is not coverage',policy=m['policy'],geographyMode=geography_mode,**({'admissionSnapshotSha256':admission_snapshot} if admission_snapshot is not None else {}),**({'sourceDomains':source_domains} if source_domains else {}))).encode()
            check(len(payload))
        if partitioned:
            pending=safe_path(output/'complete.pending.json');complete=safe_path(output/'complete.json')
            with pending.open('xb') as f:f.write(payload);f.flush();os.fsync(f.fileno())
            check(force=True)
            if safe_path(complete).exists():raise FileExistsError(complete)
            safe_path(pending);os.rename(pending,complete)
        else:
            with safe_path(output/'complete.json').open('xb') as f: f.write(payload)
            check(force=True)
        return output
    finally:
        db.close()


def main(argv=None):
    parser=argparse.ArgumentParser(description=__doc__)
    parser.add_argument('manifest'); parser.add_argument('output')
    parser.add_argument('--resume',action='store_true')
    parser.add_argument('--geography-mode',choices=('all-nodes','selected-references'),default='all-nodes')
    parser.add_argument('--admission',nargs=2,required=True,metavar=('FILE','SHA256'))
    parser.add_argument('--admission-snapshot')
    args=parser.parse_args(argv)
    from production_admission import verify_production_admission, production_admission_retained_paths
    path=safe_path(args.manifest)
    checked=verify_production_admission(path,*args.admission,'raw-before',args.admission_snapshot)
    snapshot=checked['snapshotSha256']
    def admission_check(phase):
        return verify_production_admission(path,*args.admission,phase,snapshot)
    with path.open('rb') as handle:
        body=handle.read(1024*1024+1)
    if len(body)>1024*1024 or hashlib.sha256(body).hexdigest()!=checked['manifest']['sha256']:
        raise ValueError('admitted manifest mutation')
    manifest=validate_manifest(json.loads(body))
    lease_paths=[*production_admission_retained_paths(checked),*[safe_path(s['path']) for s in manifest['sources']]]
    with admitted_raw_leases([{'path':p} for p in dict.fromkeys(lease_paths)]):
        build(manifest,args.output,resume=args.resume,geography_mode=args.geography_mode,
              admission_check=admission_check,admission_snapshot=snapshot)
    return 0


if __name__=='__main__':
    main()
