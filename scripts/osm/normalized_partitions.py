"""Bounded direct JSONL partitions. No selection, source authority or resume."""
import hashlib
import json
import os
from pathlib import Path
import re
import stat

from spot_paths import safe_path

MAX_PART_BYTES=134217728
MAX_PARTS=64
MAX_DESCRIPTOR_BYTES=1048576
MAX_ROW_BYTES=4*1024*1024
MAX_SAFE_INTEGER=9007199254740991
MAX_OUTPUT_BYTES=MAX_PART_BYTES*MAX_PARTS+2*MAX_DESCRIPTOR_BYTES
LAYOUT=dict(kind='partitioned-jsonl-v1',maxPartBytes=MAX_PART_BYTES,maxParts=MAX_PARTS)
FAMILIES=('candidates','lineage','exclusions')


def canonical(value):
    return json.dumps(value,sort_keys=True,separators=(',',':'),ensure_ascii=False,allow_nan=False)


def strict_json(payload):
    def pairs(items):
        result={}
        for key,value in items:
            if key in result:raise ValueError('duplicate partition metadata field')
            result[key]=value
        return result
    return json.loads(payload,object_pairs_hook=pairs)


def key_for(family,row):
    fields={'candidates':('placeId',),'lineage':('placeId','source'),'exclusions':('source','id','reason')}[family]
    if not isinstance(row,dict) or any(not isinstance(row.get(key),str) or not row[key] for key in fields):
        raise ValueError('partition row key required')
    return tuple(row[key] for key in fields)


def ordered(family,previous,key):
    if previous is not None and (key<previous or key==previous and family!='exclusions'):
        raise ValueError('partition row order')


class PartRegistry:
    """One registry per export, shared by all three families."""
    def __init__(self):self.parts=0;self.families=set()
    def begin(self,family):
        if family not in FAMILIES or family in self.families:raise ValueError('unique partition family required')
        self.families.add(family)
    def reserve(self):
        if self.parts>=MAX_PARTS:raise ValueError('partition cardinality exceeds 64')
        self.parts+=1


def write_partitioned_stream(output,family,rows,check,consume,part_limit=MAX_PART_BYTES,registry=None):
    """Write canonical rows from a cursor; consume charges each byte before write.

    Lower part limits are an injectable library test seam, never a manifest or
    CLI override. A lineage ID's at most four source rows stay in one part.
    """
    if type(part_limit) is not int or not 1<=part_limit<=MAX_PART_BYTES:raise ValueError('partition byte limit')
    registry=registry if registry is not None else PartRegistry();registry.begin(family)
    output=safe_path(output);directory=safe_path(output/'parts');check();directory.mkdir(exist_ok=True)
    parts=[];total=total_rows=0;family_hash=hashlib.sha256();handle=None;pin=None;part_hash=None
    def finish():
        nonlocal handle,pin
        if handle is None:return
        handle.flush();os.fsync(handle.fileno());handle.close();handle=None
        pin['sha256']=part_hash.hexdigest();parts.append(pin);pin=None;check()
    def emit(group):
        nonlocal handle,pin,part_hash,total,total_rows
        amount=sum(len(chunk) for _,chunk in group)
        if amount>part_limit:raise ValueError('partition row/group exceeds part byte limit')
        if handle is not None and pin['bytes']+amount>part_limit:finish()
        if handle is None:
            check();registry.reserve()
            name=f'parts/{family}-{len(parts):05}.jsonl'
            handle=safe_path(output/name).open('xb',buffering=0);part_hash=hashlib.sha256()
            pin=dict(ordinal=len(parts),path=name,bytes=0,sha256='',firstRow=total_rows,rows=0,
                     firstKey=list(group[0][0]),lastKey=list(group[-1][0]))
        for key,chunk in group:
            check();consume(len(chunk));handle.write(chunk)
            part_hash.update(chunk);family_hash.update(chunk)
            pin['bytes']+=len(chunk);pin['rows']+=1;pin['lastKey']=list(key)
            total+=len(chunk);total_rows+=1
            if max(total,total_rows)>MAX_SAFE_INTEGER:raise ValueError('partition safe integer limit')
    previous=None;group=[]
    try:
        for row in rows:
            check();key=key_for(family,row);ordered(family,previous,key)
            chunk=(canonical(row)+'\n').encode('utf8')
            if len(chunk)>MAX_ROW_BYTES:raise ValueError('partition row byte limit')
            if family=='lineage':
                if group and key[0]!=group[0][0][0]:emit(group);group=[]
                if len(group)>=4:raise ValueError('lineage source cardinality')
                group.append((key,chunk))
            else:emit([(key,chunk)])
            previous=key
        if group:emit(group)
        finish();check()
        return dict(bytes=total,rows=total_rows,sha256=family_hash.hexdigest(),parts=parts)
    finally:
        if handle is not None:handle.flush();os.fsync(handle.fileno());handle.close()


def _number(value,minimum=0,maximum=MAX_SAFE_INTEGER):
    if type(value) is not int or not minimum<=value<=maximum:raise ValueError('partition safe integer limit')


def _sha(value):
    if not isinstance(value,str) or not re.fullmatch('[a-f0-9]{64}',value):raise ValueError('partition SHA-256 required')


def partition_rows(handle,length,row_limit,check):
    """Bounded raw reads without FileIO.readline's byte-at-a-time I/O."""
    pending=bytearray();remaining=length
    while remaining:
        check();search=len(pending);chunk=handle.read(min(65536,remaining))
        if not chunk:raise ValueError('partition short file')
        remaining-=len(chunk);pending.extend(chunk);start=0
        while True:
            end=pending.find(b'\n',search)
            if end<0:break
            check()
            if end+1-start>row_limit:raise ValueError('partition row byte/newline limit')
            yield bytes(memoryview(pending)[start:end+1])
            start=end+1;search=start
        if start:del pending[:start]
        if len(pending)>row_limit:raise ValueError('partition row byte/newline limit')
    if pending:raise ValueError('partition final newline required')


def verify_partitioned_streams(output,streams,check,*,row_limit=MAX_ROW_BYTES,expected_counts=None,max_bytes=MAX_OUTPUT_BYTES):
    """Read-only complete-family verification, with a single aggregate ledger.

    Referenced paths are expanded only after cardinality/schema validation.
    This checks physical inventory and original concatenated bytes, not digest
    concatenations. The producer supplies independently recomputed SQL counts.
    """
    if not isinstance(streams,dict) or set(streams)!=set(FAMILIES):raise ValueError('complete partition families required')
    _number(row_limit,1,MAX_ROW_BYTES);_number(max_bytes,1,MAX_OUTPUT_BYTES)
    count=0;declared_bytes=0;expected=set()
    for family in FAMILIES:
        stream=streams[family]
        if not isinstance(stream,dict) or set(stream)!={'bytes','rows','sha256','parts'} or not isinstance(stream['parts'],list):raise ValueError('partition family fields')
        count+=len(stream['parts'])
        if count>MAX_PARTS:raise ValueError('partition cardinality exceeds 64')
        _number(stream['bytes']);_number(stream['rows']);_sha(stream['sha256']);declared_bytes+=stream['bytes']
        first=0
        for ordinal,pin in enumerate(stream['parts']):
            check()
            if not isinstance(pin,dict) or set(pin)!={'ordinal','path','bytes','sha256','firstRow','rows','firstKey','lastKey'}:raise ValueError('partition pin fields')
            _number(pin['ordinal']);_number(pin['bytes'],1,MAX_PART_BYTES);_number(pin['rows'],1);_number(pin['firstRow']);_sha(pin['sha256'])
            name=f'parts/{family}-{ordinal:05}.jsonl'
            if pin['ordinal']!=ordinal or pin['path']!=name or pin['firstRow']!=first:raise ValueError('partition ordinal/path/row range')
            width=1 if family=='candidates' else 2 if family=='lineage' else 3
            if any(not isinstance(key,list) or len(key)!=width or any(not isinstance(value,str) or not value for value in key) for key in (pin['firstKey'],pin['lastKey'])):raise ValueError('partition pin key')
            first+=pin['rows'];expected.add(name)
        if first!=stream['rows'] or sum(pin['bytes'] for pin in stream['parts'])!=stream['bytes']:raise ValueError('partition aggregate counts')
        if expected_counts is not None and stream['rows']!=expected_counts[family]:raise ValueError('partition frozen row counts')
    if declared_bytes>max_bytes:raise ValueError('partition aggregate byte limit')
    output=safe_path(output);directory=safe_path(output/'parts');seen=set()
    with os.scandir(directory) as entries:
        for entry in entries:
            check()
            if len(seen)>=MAX_PARTS:raise ValueError('partition physical cardinality')
            info=entry.stat(follow_symlinks=False)
            if not stat.S_ISREG(info.st_mode) or getattr(info,'st_file_attributes',0)&0x400:raise ValueError('regular unlinked partition required')
            name='parts/'+entry.name
            if name not in expected:raise ValueError('unexpected partition file')
            seen.add(name)
    if seen!=expected:raise ValueError('missing partition file')
    for family in FAMILIES:
        stream=streams[family];family_hash=hashlib.sha256();previous=None;actual_rows=actual_bytes=0;lineage_id=None;lineage_rows=0
        for pin in stream['parts']:
            check();path=safe_path(output/pin['path']);path_before=path.stat();part_hash=hashlib.sha256();rows=amount=0;first_key=last_key=None
            with path.open('rb',buffering=0) as handle:
                before=os.fstat(handle.fileno())
                if not stat.S_ISREG(before.st_mode) or before.st_size!=pin['bytes']:raise ValueError('partition byte pin')
                if before.st_nlink!=1:raise ValueError('partition hardlink alias refused')
                for chunk in partition_rows(handle,before.st_size,row_limit,check):
                    row=strict_json(chunk.decode('utf8'));key=key_for(family,row);ordered(family,previous,key)
                    if chunk!=(canonical(row)+'\n').encode('utf8'):raise ValueError('partition canonical row bytes')
                    if family=='lineage':
                        if rows==0 and lineage_id==key[0]:raise ValueError('lineage group split across parts')
                        lineage_rows=lineage_rows+1 if lineage_id==key[0] else 1;lineage_id=key[0]
                        if lineage_rows>4:raise ValueError('lineage source cardinality')
                    previous=key;first_key=key if first_key is None else first_key;last_key=key
                    part_hash.update(chunk);family_hash.update(chunk);amount+=len(chunk);rows+=1
                after=os.fstat(handle.fileno())
            final=safe_path(path).stat()
            # Windows handle/path stat APIs can expose different ctime
            # semantics. Compare each API's ctime to its own initial witness.
            witness=lambda value:(value.st_dev,value.st_ino,value.st_size,value.st_mtime_ns)
            if len({witness(path_before),witness(before),witness(after),witness(final)})!=1 or before.st_ctime_ns!=after.st_ctime_ns or path_before.st_ctime_ns!=final.st_ctime_ns:raise ValueError('partition mutation')
            if rows!=pin['rows'] or list(first_key or ())!=pin['firstKey'] or list(last_key or ())!=pin['lastKey'] or part_hash.hexdigest()!=pin['sha256']:raise ValueError('partition row/key/digest pin')
            actual_rows+=rows;actual_bytes+=amount
        if (actual_rows,actual_bytes,family_hash.hexdigest())!=(stream['rows'],stream['bytes'],stream['sha256']):raise ValueError('partition family digest/counts')
    check()
