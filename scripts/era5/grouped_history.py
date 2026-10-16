"""Offline grouped historical planner/importer. No implicit source requests.

One immutable parent raw file; <=800-hour JSONL partitions preserve its digest.
Existing downloader can use checkpoint_locked as its explicitly selected importer.
"""
import argparse
import calendar
import json
import os
from pathlib import Path
import shutil
import tempfile
import time
import sys
import pilot
import download
from read_chunks import read_grouped_chunk, digest, MAX_RAW_BYTES, MAX_OUTPUT_BYTES

def build_plan(start_year, end_year):
    monthly=pilot.build_historical_plan(start_year,end_year)
    groups=[]
    for region in pilot.REGIONS:
        for month in range(1,13):
            # Never ask the CDS to resolve invalid Cartesian dates such as Feb 29
            # in a non-leap year. Each request contains only valid combinations.
            buckets={}
            for year in range(start_year,end_year+1):
                buckets.setdefault(calendar.monthrange(year,month)[1],[]).append(year)
            for days, years in sorted(buckets.items()):
                parts=[c for c in monthly['chunks'] if c['region']==region and c['request']['month']==[f'{month:02d}'] and c['request']['year'][0] in map(str,years) and not c['chunkId'].endswith('-boundary')]
                request=dict(parts[0]['request'],year=list(map(str,years)))
                groups.append({'chunkId':f'{region}-{month:02d}-{years[0]}-{years[-1]}','region':region,'request':request,'expectedHours':sum(c['expectedHours'] for c in parts),'partitions':parts})
        for part in monthly['chunks']:
            if part['region']==region and part['chunkId'].endswith('-boundary'):
                groups.append(dict(part,partitions=[part]))
    return dict(monthly,builderVersion='grouped-history-v1',chunks=groups,
                limits=dict(monthly['limits'],maximumJobs=len(groups),groupedHours=22320,
                            partitionHours=800,partitionJsonlBytes=MAX_OUTPUT_BYTES,peakRssBytes=256*1024*1024))

def requested_clock(chunk):
    request=chunk['request']
    return sorted(f'{year}-{month}-{day}T{hour}:00Z' for year in request['year'] for month in request['month'] for day in request['day'] for hour in request['time'])

def prepare(root,plan,expected_digest):
    if plan!=build_plan(plan['startYear'],plan['endYear']) or pilot.plan_digest(plan)!=expected_digest:
        raise ValueError('Explicit reviewed grouped plan digest required.')
    root=Path(root).resolve();root.mkdir(parents=True,exist_ok=True)
    with pilot.writer_lock(root):
        for name in ['raw','decoded']: pilot.owned(root,name).mkdir(exist_ok=True)
        manifest=pilot.owned(root,'manifest.json')
        if manifest.exists() and pilot.read_json(manifest)!=plan: raise ValueError('Immutable grouped plan differs.')
        if not manifest.exists():pilot.atomic_json(manifest,plan)
        ledger=pilot.owned(root,'ledger.json')
        if not ledger.exists():pilot.atomic_json(ledger,{'schemaVersion':1,'manifestSha256':expected_digest,'entries':[]})
        pilot.load_state(root,plan)
    return plan

def verify_entry(root,entry):
    raw=pilot.owned(root,f"raw/{entry['chunkId']}.nc")
    index=pilot.owned(root,f"decoded/{entry['chunkId']}.json")
    for path,key,limit in [(raw,'rawSha256',MAX_RAW_BYTES),(index,'decodedSha256',MAX_OUTPUT_BYTES)]:
        if not path.is_file() or path.stat().st_size>limit or digest(path)!=entry[key]:raise ValueError('Grouped checkpoint changed.')
    if pilot.read_json(index)!=entry['partitions']:raise ValueError('Grouped partition index differs.')
    for part in entry['partitions']:
        path=pilot.owned(root,part['path'])
        if part['rawSha256']!=entry['rawSha256'] or not path.is_file() or path.stat().st_size!=part['decodedBytes'] or path.stat().st_size>MAX_OUTPUT_BYTES or digest(path)!=part['decodedSha256']:
            raise ValueError('Grouped parent/partition provenance changed.')

def import_existing(root,chunk_id,source,plan,expected_digest):
    if plan!=build_plan(plan['startYear'],plan['endYear']) or pilot.plan_digest(plan)!=expected_digest:raise ValueError('Reviewed grouped digest differs.')
    with pilot.writer_lock(root):return checkpoint_locked(root,chunk_id,source,approved_plan=plan)

def fetch_one(root,chunk_id,plan,expected_digest,*,adapter=None,resume=False):
    if plan!=build_plan(plan['startYear'],plan['endYear']) or pilot.plan_digest(plan)!=expected_digest:raise ValueError('Reviewed grouped digest differs.')
    chunk=next((c for c in plan['chunks'] if c['chunkId']==chunk_id),None)
    if chunk is None:raise ValueError('Grouped request outside reviewed plan.')
    importer=lambda *args,**kwargs:checkpoint_locked(*args,**kwargs,approved_plan=plan)
    return download._run_one(root,chunk_id,adapter,importer=importer,approved_plan=plan,resume=resume,verifier=verify_entry,maximum_submissions=4,additional_scratch_bytes=(2*len(chunk['partitions'])+1)*MAX_OUTPUT_BYTES)

def reconcile(root,chunk_id,plan,expected_digest):
    if plan!=build_plan(plan['startYear'],plan['endYear']) or pilot.plan_digest(plan)!=expected_digest:raise ValueError('Reviewed grouped digest differs.')
    return download.reconcile_local(root,chunk_id,approved_plan=plan,verifier=verify_entry)

def checkpoint_locked(root,chunk_id,source,*,approved_plan,deadline_started=None,external_gate=None):
    root=Path(root).resolve();source=Path(source).resolve()
    started=deadline_started if deadline_started is not None else time.monotonic()
    lock=pilot.owned(root,'.writer.lock')
    if not lock.is_file() or lock.read_text()!=str(os.getpid()):raise ValueError('Grouped import needs owned writer lock.')
    def gate():
        if external_gate is not None: external_gate()
        if time.monotonic()-started>=pilot.BATCH_SECONDS or pilot.peak_rss_bytes()>approved_plan['limits']['peakRssBytes']:raise ValueError('Grouped time/memory gate exceeded.')
    gate()
    plan,ledger=pilot.load_state(root,approved_plan)
    chunk=next((c for c in plan['chunks'] if c['chunkId']==chunk_id),None)
    if chunk is None:raise ValueError('Grouped request outside reviewed plan.')
    if source.stat().st_size>MAX_RAW_BYTES:raise ValueError('Grouped raw bound exceeded.')
    checksum=digest(source)
    existing=next((e for e in ledger['entries'] if e['chunkId']==chunk_id),None)
    if existing:
        verify_entry(root,existing)
        if existing['rawSha256']!=checksum:raise ValueError('Source revision changed; immutable checkpoint retained.')
        return existing
    inventory=pilot.check_inventory(root,plan['limits']['retainedRawBytes'])
    reserve=(2*len(chunk['partitions'])+1)*MAX_OUTPUT_BYTES+2*MAX_RAW_BYTES
    if inventory['retainedRawBytes']+source.stat().st_size>plan['limits']['retainedRawBytes'] or inventory['scratchBytes']+reserve>plan['limits']['scratchBytes']:raise ValueError('Grouped storage reservation exceeded.')
    targets=[pilot.owned(root,f'raw/{chunk_id}.nc'),pilot.owned(root,f'decoded/{chunk_id}.json')]+[pilot.owned(root,f"decoded/{p['chunkId']}.jsonl") for p in chunk['partitions']]
    if any(p.exists() for p in targets):raise ValueError('Interrupted/untracked grouped files need review.')
    # Stage all partitions privately; publish ledger last. Interrupted publication
    # leaves untracked files, which block reuse and require explicit reconciliation.
    with tempfile.TemporaryDirectory(dir=root,prefix='grouped-') as temporary:
        stage=Path(temporary); raw=stage/'parent.nc'
        copied=0
        with source.open('rb') as inp, raw.open('xb') as out:
            for block in iter(lambda:inp.read(65536),b''):
                gate();copied+=len(block)
                if copied>MAX_RAW_BYTES:raise ValueError('Grouped source grew beyond raw bound.')
                out.write(block)
        if digest(raw)!=checksum:raise ValueError('Raw changed during copy.')
        iterator=read_grouped_chunk(raw)
        try:
            header=next(iterator)
            if len(pilot.canonical(header).encode('utf-8'))>MAX_OUTPUT_BYTES or len(header['institution'])>200 or len(header['timeUnits'])>150:raise ValueError('Grouped header metadata exceeds partition contract.')
            cells={(r['latitude'],r['longitude']) for r in header['cells']}
            if cells!={tuple(c) for c in plan['cellCoverage'][chunk['region']]['cells']} or header['experimentVersions']!=['0001']:raise ValueError('Grouped grid/revision differs.')
            allowed=set(requested_clock(chunk)); counts={p['chunkId']:0 for p in chunk['partitions']}
            parts={p['request']['year'][0]+'-'+p['request']['month'][0]:p for p in chunk['partitions']}
            # <=30 open row files, <=744 rows each; no full cloud cube is loaded.
            for row in iterator:
                gate()
                if row['atUtc'] not in allowed:raise ValueError('Grouped timestamp outside exact request.')
                part=parts[row['atUtc'][:7]];name=part['chunkId'];counts[name]+=1
                rows_path=stage/(name+'.rows');line=json.dumps(row,separators=(',',':'),allow_nan=False)+'\n'
                if (rows_path.stat().st_size if rows_path.exists() else 0)+len(line.encode('utf-8'))>MAX_OUTPUT_BYTES:raise ValueError('Staged rows exceed partition byte bound.')
                with rows_path.open('a',encoding='utf-8',newline='\n') as out:out.write(line)
            partitions=[]
            for part in sorted(chunk['partitions'],key=lambda p:requested_clock(p)[0]):
                gate();name=part['chunkId'];rows=counts[name]
                if not 1<=rows<=800:raise ValueError('Empty/oversized partition cannot be published.')
                decoded=stage/(name+'.jsonl')
                with decoded.open('w',encoding='utf-8',newline='\n') as out:
                    out.write(json.dumps(dict(header,rowCount=rows),separators=(',',':'),allow_nan=False)+'\n')
                    with (stage/(name+'.rows')).open('r',encoding='utf-8') as inp:shutil.copyfileobj(inp,out,65536)
                    out.flush();os.fsync(out.fileno())
                if decoded.stat().st_size>MAX_OUTPUT_BYTES:raise ValueError('Partition JSONL bound exceeded.')
                partitions.append({'chunkId':name,'path':f'decoded/{name}.jsonl','rawSha256':checksum,'decodedSha256':digest(decoded),'sourceRows':rows,'expectedRows':part['expectedHours'],'missingSourceHours':part['expectedHours']-rows,'decodedBytes':decoded.stat().st_size})
            if digest(raw)!=checksum:raise ValueError('Grouped raw changed during decode.')
            index=stage/'index.json';pilot.atomic_json(index,partitions)
            entry={'chunkId':chunk_id,'complete':True,'rawSha256':checksum,'decodedSha256':digest(index),'partitions':partitions,'sourceRevision':header['experimentVersions'],'decoderVersions':header['decoderVersions'],'rawBytes':raw.stat().st_size,'decodedBytes':index.stat().st_size,'sourceRows':header['rowCount'],'expectedRows':chunk['expectedHours'],'missingSourceHours':chunk['expectedHours']-header['rowCount'],'processingSeconds':time.monotonic()-started,'processPeakRssBytes':pilot.peak_rss_bytes(),'retrievalMode':'existing-local-file'}
            gate();os.replace(raw,targets[0]);os.replace(index,targets[1])
            for part in partitions:os.replace(stage/(part['chunkId']+'.jsonl'),pilot.owned(root,part['path']))
            verify_entry(root,entry);ledger['entries'].append(entry);pilot.atomic_json(pilot.owned(root,'ledger.json'),ledger)
            return entry
        finally:iterator.close()

if __name__=='__main__':
    parser=argparse.ArgumentParser(description=__doc__)
    parser.add_argument('action',choices=['plan','prepare','import','fetch','resume','reconcile'])
    parser.add_argument('--start-year',type=int,default=1991);parser.add_argument('--end-year',type=int,default=1992)
    parser.add_argument('--root',default='.data/era5/grouped-history-1991-1992-v1');parser.add_argument('--expected-manifest-sha256');parser.add_argument('--chunk');parser.add_argument('--source')
    parser.add_argument('--worker',action='store_true')
    args=parser.parse_args();plan=build_plan(args.start_year,args.end_year)
    if args.action=='plan':print(pilot.canonical({'manifest':plan,'sha256':pilot.plan_digest(plan)}))
    elif args.action=='prepare':prepare(args.root,plan,args.expected_manifest_sha256)
    elif args.action=='reconcile':print(pilot.canonical(reconcile(args.root,args.chunk,plan,args.expected_manifest_sha256)))
    elif not args.worker:
        print(pilot.canonical(pilot.run_deadline_process([sys.executable,__file__,*sys.argv[1:],'--worker'],output_directory=args.root)))
    elif args.action=='import':print(pilot.canonical(import_existing(args.root,args.chunk,args.source,plan,args.expected_manifest_sha256)))
    else:print(pilot.canonical(fetch_one(args.root,args.chunk,plan,args.expected_manifest_sha256,resume=args.action=='resume')))
