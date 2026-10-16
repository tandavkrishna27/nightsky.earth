"""Finite worldwide grouped acquisition. No arguments prints an offline contract.

Only the explicitly authorized Windows supervisor can start the live worker.
Fixture transports exercise the same durable, zero-retry state machine offline.
"""
import argparse
from contextlib import contextmanager
from datetime import datetime
import hashlib
import json
import os
from pathlib import Path
import re
import shutil
import subprocess
import sys
import time
from urllib.parse import urlsplit

MiB = 1024**2
RAW_LIMIT = 32*MiB
METADATA_LIMIT = MiB
LIMITS = dict(submissions=16, rawBytes=512*MiB, metadataBytes=32*MiB,
              outputBytes=4*1024**3, polls=20, pollSeconds=30, jobSeconds=1800,
              batchSeconds=28800, commitBytes=512*MiB, processes=2,
              rssBytes=256*MiB, freeBytes=96*1024**3)
BASE = 'https://cds.climate.copernicus.eu/api/retrieve/v1'


def canonical(value):
    # Match JS canonical JSON number rendering for quarter-degree coordinates.
    def normalize(v):
        if isinstance(v,float) and v.is_integer(): return int(v)
        if isinstance(v,list): return [normalize(x) for x in v]
        if isinstance(v,dict): return {k:normalize(x) for k,x in v.items()}
        return v
    return json.dumps(normalize(value),sort_keys=True,separators=(',',':'),allow_nan=False)


def identity(value): return hashlib.sha256(canonical(value).encode()).hexdigest()


def validate_job(row):
    ident={k:row[k] for k in ('dataset','revision','member','request')}
    if row['sha256']!=identity(ident) or ident['dataset']!='reanalysis-era5-single-levels' or ident['revision']!='0001' or type(ident['member']) is not int or ident['member']!=0:
        raise ValueError('Pinned request identity/member/revision differs')
    request=row['request']
    defaults=dict(product_type=['reanalysis'],variable=['total_cloud_cover'],data_format='netcdf',download_format='unarchived')
    if set(request)!=set(defaults)|{'year','month','day','time','area'} or any(request[k]!=v for k,v in defaults.items()): raise ValueError('Request defaults differ')
    for key, pattern, bound in [('year',r'\d{4}',30),('month',r'\d{2}',1),('day',r'\d{2}',31),('time',r'\d{2}:00',24)]:
        values=request[key]
        if not isinstance(values,list) or not 1<=len(values)<=bound or values!=sorted(set(values)) or any(not isinstance(v,str) or not re.fullmatch(pattern,v) for v in values): raise ValueError('Invalid calendar selection')
    stamps=[f'{y}-{m}-{d}T{h}:00Z' for y in request['year'] for m in request['month'] for d in request['day'] for h in request['time']]
    for stamp in stamps:
        value=datetime.fromisoformat(stamp.replace('Z','+00:00'))
        if not '1990-12-30T00:00:00Z'<=stamp<'2021-01-03T00:00:00Z': raise ValueError('Outside padded baseline')
    if len(stamps)>22320 or row['expectedHours']!=len(stamps): raise ValueError('Parent clock differs')
    n,w,s,e=request['area']
    if not (-90<=s<n<=90 and -180<=w<e<=180) or any(type(v) not in (int,float) or v*4!=round(v*4) for v in [n,w,s,e]): raise ValueError('Invalid exact area')
    if (round((n-s)*4)+1)*(round((e-w)*4)+1)>10: raise ValueError('Cell bound')
    cells={f'era5:{lat/4:g}:{lon/4:g}' for lat in range(round(s*4),round(n*4)+1) for lon in range(round(w*4),round(e*4)+1)}
    if set(row['expectedCells'])!=cells or len(row['expectedCells'])!=len(cells) or row['scalarCellHours']!=len(cells)*len(stamps): raise ValueError('Exact cell inventory differs')
    required,filler=row['requiredCells'],row['fillerCells']
    if len(set(required))+len(set(filler))!=len(required)+len(filler) or set(required)&set(filler) or set(required)|set(filler)!=cells: raise ValueError('Required/filler ownership differs')
    parts=[dict(year=y,month=request['month'][0],expectedHours=len(request['day'])*len(request['time'])) for y in request['year']]
    if row['partitions']!=parts or any(p['expectedHours']>800 for p in parts): raise ValueError('Monthly lineage differs')


def build_packet(jobs, *, source_pins, runtime_pins, asset_hosts, blocked_tiles=()):
    if not 1<=len(jobs)<=16 or len({j['sha256'] for j in jobs})!=len(jobs): raise ValueError('Finite unique prefix required')
    if not {'frozenPlan','reconciliation'}<=set(source_pins) or any(not re.fullmatch('[a-f0-9]{64}',v) for v in source_pins.values()): raise ValueError('Source pins required')
    if not runtime_pins or not asset_hosts or len(set(asset_hosts))!=len(asset_hosts): raise ValueError('Runtime and exact asset hosts required')
    for host in asset_hosts:
        if not re.fullmatch(r'[a-z0-9]+(?:[.-][a-z0-9]+)*',host): raise ValueError('Exact DNS hosts required')
    for row in jobs:
        validate_job(row)
        if row['tileId'] in blocked_tiles: raise ValueError('Unequal retained masks require explicit replan')
    seen={}
    for row in jobs:
        times=seen.setdefault(row['tileId'],set());request=row['request']
        selected={(y,m,d,h) for y in request['year'] for m in request['month'] for d in request['day'] for h in request['time']}
        if times&selected: raise ValueError('Overlapping parent clocks')
        times.update(selected)
    return json.loads(canonical(dict(schemaVersion=1,status='unapproved-nonexecuting',jobs=jobs,sourcePins=source_pins,runtimePins=runtime_pins,assetHosts=asset_hosts,limits=LIMITS)))


def validate_packet(packet):
    rebuilt=build_packet(packet['jobs'],source_pins=packet['sourcePins'],runtime_pins=packet['runtimePins'],asset_hosts=packet['assetHosts'])
    if packet!=rebuilt: raise ValueError('Packet contract differs')


def safe(path):
    path=Path(path).absolute()
    for part in [path,*path.parents]:
        if part.is_symlink() or part.is_junction(): raise ValueError('Aliased path')
        if part.exists() and part.is_file() and part.stat().st_nlink!=1: raise ValueError('Hardlinked path')
    return path


def save(path,value):
    path=safe(path); pending=safe(path.with_suffix('.pending'))
    with pending.open('x',encoding='utf-8') as out:
        out.write(canonical(value)); out.flush(); os.fsync(out.fileno())
    os.replace(pending,path)


@contextmanager
def exclusive(path):
    with safe(path).open('x') as out:
        out.write(str(os.getpid()));out.flush();os.fsync(out.fileno())
    try: yield
    finally: path.unlink()


def tree_bytes(root):
    total=0
    root=safe(root)
    def fail(error):
        if not isinstance(error,FileNotFoundError): raise error
    if root.exists():
        for parent,dirs,files in os.walk(root,followlinks=False,onerror=fail):
            safe(parent)
            for name in dirs+files:
                try:
                    path=safe(Path(parent)/name)
                    if path.is_file(): total+=path.stat().st_size
                except FileNotFoundError:
                    # Worker atomically renames metadata and publishes/removes
                    # staging files while the supervisor samples this tree.
                    # Alias, hardlink and permission errors still fail closed.
                    continue
    return total


def import_parent(root,row,path,gate):
    """Adapt validated worldwide cells to the existing private grouped importer."""
    import grouped_history as grouped
    import pilot
    validate_job(row); gate()
    chunk_id=row['sha256']
    parts=[dict(chunkId=chunk_id+'-'+p['year']+'-'+p['month'],expectedHours=p['expectedHours'],request=dict(row['request'],year=[p['year']])) for p in row['partitions']]
    chunk=dict(chunkId=chunk_id,region=row['tileId'],request=row['request'],expectedHours=row['expectedHours'],partitions=parts)
    cells=[[float(x) for x in cell.split(':')[1:]] for cell in row['expectedCells']]
    plan=dict(builderVersion='global-grouped-executor-v1',chunks=[chunk],cellCoverage={row['tileId']:dict(cells=cells)},limits=dict(retainedRawBytes=RAW_LIMIT,scratchBytes=LIMITS['outputBytes'],peakRssBytes=LIMITS['rssBytes']))
    root.mkdir()
    for name in ['raw','decoded']: (root/name).mkdir()
    pilot.atomic_json(root/'manifest.json',plan)
    pilot.atomic_json(root/'ledger.json',dict(schemaVersion=1,manifestSha256=pilot.plan_digest(plan),entries=[]))
    with pilot.writer_lock(root):
        entry=grouped.checkpoint_locked(root,chunk_id,path,approved_plan=plan,external_gate=gate)
    gate()
    return dict(entry,requestSha256=row['sha256'],tileId=row['tileId'],requiredCells=row['requiredCells'],fillerCells=row['fillerCells'])


def run_fixture(authority,output,packet,transport,*,clock=time.time,sleep=time.sleep):
    if getattr(transport,'fixture_only',False) is not True: raise ValueError('Fixture transport required')
    return _run(authority,output,packet,transport,clock=clock,sleep=sleep)


def _run(authority,output,packet,transport,*,clock=time.time,sleep=time.sleep,live=False):
    validate_packet(packet)
    authority=safe(authority); output=safe(output)
    if authority==output or authority.is_relative_to(output) or output.is_relative_to(authority): raise ValueError('Separate authority and output required')
    authority.mkdir(parents=True,exist_ok=True)
    claim=safe(authority/identity(packet)); claim.mkdir(exist_ok=True)
    with exclusive(authority/'active.lock'):
        # The claim is permanent across failed calls and alternate output roots.
        if (claim/'attempt.claim').exists(): raise ValueError('Permanent attempt claim consumed; independent reconciliation required')
        with (claim/'attempt.claim').open('x') as receipt:
            receipt.write(canonical(dict(packetSha256=identity(packet),output=str(output))));receipt.flush();os.fsync(receipt.fileno())
        if output.exists(): raise ValueError('Fresh output required')
        output.mkdir(parents=True)
        state=dict(packetSha256=identity(packet),output=str(output),started=clock(),deadline=clock()+LIMITS['batchSeconds'],submissions=0,metadataBytes=0,rawBytes=0,jobs=[])
        statepath=claim/'state.json'; save(statepath,state)
        current=None
        def gate(reservation=0):
            if clock()>=state['deadline'] or current and clock()>=current['deadline']: raise ValueError('Original shared/job deadline exceeded')
            if tree_bytes(output)+tree_bytes(claim)+reservation>LIMITS['outputBytes']: raise ValueError('Output cap exceeded')
            if live and shutil.disk_usage(output).free<LIMITS['freeBytes']: raise ValueError('Free reserve exceeded')
            return max(.001,min(30,state['deadline']-clock(),current['deadline']-clock() if current else 30))
        def metadata(response):
            size=0; body=bytearray()
            try:
                if response.status not in (200,201,202): raise ValueError('Metadata HTTP status')
                headers(response)
                for block in response.blocks():
                    gate()
                    if not isinstance(block,bytes) or len(block)>65536: raise ValueError('Metadata block bound')
                    size+=len(block);state['metadataBytes']+=len(block);save(statepath,state)
                    if size>METADATA_LIMIT or state['metadataBytes']>LIMITS['metadataBytes']: raise ValueError('Metadata budget exceeded')
                    body.extend(block)
                gate();return json.loads(body)
            finally: response.close()
        for row in packet['jobs']:
            # Include all staged/final monthly children and duplicate raw staging.
            gate((2*len(row['partitions'])+1)*4*MiB+2*RAW_LIMIT); now=clock()
            current=dict(requestSha256=row['sha256'],phase='submit-uncertain',started=now,deadline=min(state['deadline'],now+LIMITS['jobSeconds']),monotonicDeadline=time.monotonic()+LIMITS['jobSeconds'],polls=0,nextPoll=now)
            state['jobs'].append(current);state['submissions']+=1;save(statepath,state)
            reply=metadata(transport.submit(row['dataset'],row['request'],timeout=gate()))
            if getattr(transport,'wire_cds',False):
                monitors=[x.get('href') for x in reply.get('links',[]) if x.get('rel')=='monitor']
                prefix=BASE+'/jobs/'
                if len(monitors)!=1 or not isinstance(monitors[0],str) or not monitors[0].startswith(prefix): raise ValueError('Unknown monitor identity')
                job=monitors[0][len(prefix):]
            else: job=reply.get('jobId')
            if not isinstance(job,str) or not re.fullmatch('[A-Za-z0-9-]{1,128}',job): raise ValueError('Unknown job identity')
            current.update(jobId=job,phase='queued');save(statepath,state)
            while current['phase']!='successful':
                gate()
                if current['polls']>=LIMITS['polls']: raise ValueError('Poll allowance exhausted')
                while clock()<current['nextPoll']: sleep(min(current['nextPoll']-clock(),gate()))
                current['polls']+=1;current['nextPoll']=clock()+LIMITS['pollSeconds'];save(statepath,state)
                status=metadata(transport.status(job,timeout=gate())).get('status')
                if getattr(transport,'wire_cds',False): status={'accepted':'queued','rejected':'failed','dismissed':'failed','deleted':'failed'}.get(status,status)
                if status not in {'queued','running','successful','failed'}: raise ValueError('Unknown status')
                current['phase']=status;save(statepath,state)
                if status=='failed': raise ValueError('Remote failed')
            current['phase']='result-uncertain';save(statepath,state)
            result=metadata(transport.result(job,timeout=gate()))
            if getattr(transport,'wire_cds',False):
                result=dict(url=result['asset']['value']['href'],size=result['asset']['value']['file:size'])
            url,size=result['url'],result['size']; parsed=urlsplit(url)
            if parsed.scheme!='https' or parsed.hostname not in packet['assetHosts'] or parsed.username or parsed.password or parsed.fragment or parsed.port not in (None,443): raise ValueError('Unexpected asset origin')
            if type(size) is not int or not 0<size<=RAW_LIMIT or state['rawBytes']+size>LIMITS['rawBytes']: raise ValueError('Asset size budget')
            current['phase']='asset-uncertain';save(statepath,state)
            response=transport.open_asset(url,timeout=gate(),authenticated=False,redirects=False)
            raw=output/(row['sha256']+'.nc'); received=0
            try:
                headers(response)
                if response.status!=200 or response.headers.get('Content-Length')!=str(size): raise ValueError('Exact asset length required')
                with raw.open('xb') as out:
                    for block in response.blocks():
                        gate(len(block) if isinstance(block,bytes) else 0)
                        if not isinstance(block,bytes) or len(block)>65536: raise ValueError('Asset block bound')
                        received+=len(block);state['rawBytes']+=len(block);save(statepath,state)
                        if received>size or state['rawBytes']>LIMITS['rawBytes']: raise ValueError('Asset byte cap')
                        out.write(block)
                    out.flush();os.fsync(out.fileno())
                if received!=size: raise ValueError('Incomplete asset')
            finally: response.close()
            gate();current['phase']='decode-uncertain';save(statepath,state)
            current['lineage']=import_parent(output/row['sha256'],row,raw,gate)
            raw.unlink();current['phase']='complete';save(statepath,state)
        gate();state['complete']=True;save(statepath,state)
        return state


def headers(response):
    if len(response.headers)>64 or sum(len(str(k))+len(str(v))+4 for k,v in response.headers.items())>65536 or response.headers.get('Content-Encoding','identity').lower()!='identity': raise ValueError('Response headers rejected')


def run_live(*args,**kwargs):
    raise ValueError('Use the explicit reviewed-packet Windows supervisor CLI')


class LiveTransport:
    """Pinned CDS wire shape; independent sessions, no SDK discovery or retries."""
    wire_cds=True
    def __init__(self,token,session_factory):
        self.api=session_factory();self.asset=session_factory()
        for session in (self.api,self.asset):
            session.trust_env=False;session.auth=None;session.headers.clear();session.cookies.clear()
        self.api.headers['PRIVATE-TOKEN']=token
    def response(self,session,method,url,timeout,**kwargs):
        reply=session.request(method,url,timeout=(min(5,timeout),timeout),allow_redirects=False,stream=True,**kwargs)
        class Stream:
            status=reply.status_code
            headers=reply.headers
            def blocks(self): yield from reply.iter_content(65536)
            def close(self): reply.close()
        return Stream()
    def submit(self,dataset,request,timeout):
        return self.response(self.api,'POST',BASE+'/processes/'+dataset+'/execution',timeout,json={'inputs':request})
    def status(self,job,timeout): return self.response(self.api,'GET',BASE+'/jobs/'+job,timeout)
    def result(self,job,timeout): return self.response(self.api,'GET',BASE+'/jobs/'+job+'/results',timeout)
    def open_asset(self,url,timeout,authenticated=False,redirects=False):
        if authenticated or redirects: raise ValueError('Asset must be tokenless without redirects')
        # Cookies acquired from an earlier asset must not cross to another job.
        self.asset.cookies.clear()
        return self.response(self.asset,'GET',url,timeout)
    def close(self):
        self.api.close();self.asset.close()


def pinned_json(path,sha,limit=8*MiB):
    path=safe(path)
    if not path.is_file() or path.stat().st_size>limit: raise ValueError('Pinned metadata size')
    with path.open('rb') as stream: data=stream.read(limit+1)
    if len(data)>limit or hashlib.sha256(data).hexdigest()!=sha: raise ValueError('Metadata pin differs')
    return json.loads(data)


def verify_sources(packet,paths):
    if set(paths)!=set(packet['sourcePins']): raise ValueError('Every source pin needs one path')
    sources={k:pinned_json(paths[k],v) for k,v in packet['sourcePins'].items()}
    plan=sources['frozenPlan']; reconciliation=sources['reconciliation']
    if 'assetOrigin' in sources:
        origin=sources['assetOrigin']
        if origin.get('validation',{}).get('accepted') is not True or not set(packet['assetHosts'])<={'cds.climate.copernicus.eu',origin.get('assetHost')}:
            raise ValueError('Asset host differs from retained validated origin')
    if reconciliation.get('frozenPlanSha256')!=packet['sourcePins']['frozenPlan']: raise ValueError('Reconciliation plan differs')
    blocked={x['tileId'] for x in reconciliation['blockedTiles']}
    overrides={x['tileId']:x['overrides'] for x in reconciliation['updatedOverrides']}
    tiles={t['tileId']:t for t in plan['tiles']}
    templates={(t['year'][0],t['month'][0]):(i,t) for i,t in enumerate(plan['calendarTemplates'])}
    for row in packet['jobs']:
        if row['tileId'] in blocked: raise ValueError('Unequal retained masks require explicit ownership replan')
        tile=tiles[row['tileId']]
        if row['request']['area']!=tile['area'] or any(row[k]!=tile[k] for k in ['expectedCells','requiredCells','fillerCells']): raise ValueError('Frozen cell ownership differs')
        masks={o['template']:o['shapes'] for o in overrides.get(row['tileId'],tile['overrides'])}
        for part in row['partitions']:
            index,template=templates[(part['year'],part['month'])]
            shapes=masks.get(index,[dict(days=template['day'],time=template['time'])])
            if not any(s['days']==row['request']['day'] and s['time']==row['request']['time'] for s in shapes): raise ValueError('Request includes retained or unapproved hours')
    return sources


def installed_runtime():
    import platform
    import netCDF4
    import numpy
    import requests
    base=Path(__file__).resolve().parent
    files=[base/name for name in ['global_acquisition.py','grouped_history.py','read_chunks.py','pilot.py','sample_live.py']]
    files.append(base.parent/'osm'/'global_source_supervisor.py')
    return dict(python=platform.python_version(),executableSha256=hashlib.sha256(Path(sys._base_executable).read_bytes()).hexdigest(),netCDF4=netCDF4.__version__,numpy=numpy.__version__,requests=requests.__version__,code={p.name:hashlib.sha256(p.read_bytes()).hexdigest() for p in files})


def read_allowance(path,sha,packet,output):
    allowance=pinned_json(path,sha,65536)
    if set(allowance)!= {'schemaVersion','allowExecution','packetSha256','outputRoot','authorityRoot','providerAcceptance','sourcePaths'} or allowance.get('schemaVersion')!=1 or allowance.get('allowExecution') is not True or allowance.get('packetSha256')!=identity(packet) or allowance.get('outputRoot')!=str(safe(output)):
        raise ValueError('Explicit owner allowance must bind reviewed packet and output')
    authority=safe(allowance['authorityRoot'])
    if str(authority)!=allowance['authorityRoot']: raise ValueError('Absolute authority required')
    evidence=allowance['providerAcceptance']
    accepted=pinned_json(evidence['path'],evidence['sha256'],METADATA_LIMIT)
    if accepted.get('packetSha256')!=identity(packet) or accepted.get('acceptedRequestSha256')!=[j['sha256'] for j in packet['jobs']] or accepted.get('currentProviderFormReviewed') is not True: raise ValueError('Current exact request acceptance evidence required')
    verify_sources(packet,allowance['sourcePaths'])
    if packet['runtimePins']!=installed_runtime(): raise ValueError('Installed code/runtime differs from packet')
    return allowance


def worker(packet_path,packet_sha,allowance_path,allowance_sha,output):
    # This private worker is launched suspended and assigned to the Job before
    # it can read its explicit environment credential. No account config reads.
    if os.name!='nt': raise ValueError('Windows containment required')
    import ctypes
    from ctypes import wintypes
    kernel=ctypes.WinDLL('kernel32',use_last_error=True)
    kernel.GetCurrentProcess.restype=wintypes.HANDLE
    kernel.IsProcessInJob.argtypes=[wintypes.HANDLE,wintypes.HANDLE,ctypes.POINTER(wintypes.BOOL)]
    inside=wintypes.BOOL()
    if not kernel.IsProcessInJob(kernel.GetCurrentProcess(),None,ctypes.byref(inside)) or not inside.value: raise ValueError('Worker must be contained')
    packet=pinned_json(packet_path,packet_sha);validate_packet(packet)
    allowance=read_allowance(allowance_path,allowance_sha,packet,output)
    token=os.environ.get('CDSAPI_KEY')
    if not token or '\n' in token or '\r' in token: raise ValueError('Explicit environment credential required')
    import requests
    def session():
        result=requests.Session();result.mount('https://',requests.adapters.HTTPAdapter(max_retries=0));return result
    adapter=LiveTransport(token,session)
    try: _run(allowance['authorityRoot'],Path(output)/'data',packet,adapter,live=True)
    finally: adapter.close()


def supervise(packet_path,packet_sha,allowance_path,allowance_sha,output):
    """Hard Windows process-tree memory/process count and kill-on-deadline.

    Disk and free reserve are sampled, with cooperative pre-write reservations.
    The finite authority claim persists after failures; there is no resume API.
    """
    if os.name!='nt': raise ValueError('Windows Job required; no live fallback')
    packet=pinned_json(packet_path,packet_sha);validate_packet(packet)
    output=safe(output);allowance=read_allowance(allowance_path,allowance_sha,packet,output)
    authority=safe(allowance['authorityRoot'])
    if output.exists() or output==authority or output.is_relative_to(authority) or authority.is_relative_to(output): raise ValueError('Fresh separate output root required')
    # Claim the OWNER'S file location, so choosing another output or authority
    # cannot reset this allowance. Never delete this consumed receipt.
    consumed=safe(str(safe(allowance_path))+'.consumed')
    with consumed.open('x') as receipt:
        receipt.write(canonical(dict(allowanceSha256=allowance_sha,packetSha256=identity(packet),output=str(output))));receipt.flush();os.fsync(receipt.fileno())
    sys.path.insert(0,str(Path(__file__).resolve().parents[1]/'osm'))
    from global_source_supervisor import WindowsJob,rss_bytes
    output.mkdir(parents=True); authority.mkdir(parents=True,exist_ok=True)
    environment=dict(os.environ,PYTHONDONTWRITEBYTECODE='1',TEMP=str(output),TMP=str(output),TMPDIR=str(output),SQLITE_TMPDIR=str(output),OPENBLAS_NUM_THREADS='1',OMP_NUM_THREADS='1',MKL_NUM_THREADS='1',NUMEXPR_NUM_THREADS='1')
    script='import global_acquisition as g,sys;g.worker(*sys.argv[1:])'
    # Windows venv python.exe is a redirector; launch the pinned base interpreter
    # directly so RSS samples the actual worker, retaining the reviewed packages.
    environment['PYTHONPATH']=os.pathsep.join([str(Path(__file__).resolve().parent),str(Path(sys.prefix)/'Lib'/'site-packages')])
    began=time.monotonic();job=None;child=None
    def check():
        if time.monotonic()-began>=LIMITS['batchSeconds']: raise ValueError('Shared hard deadline')
        if tree_bytes(output)+tree_bytes(authority)>LIMITS['outputBytes']: raise ValueError('Sampled disk cap')
        if shutil.disk_usage(output).free<LIMITS['freeBytes']: raise ValueError('Free reserve')
        statepath=authority/identity(packet)/'state.json'
        if statepath.exists():
            state=json.loads(statepath.read_text())
            if time.time()>=state['deadline'] or state['jobs'] and (time.time()>=state['jobs'][-1]['deadline'] or time.monotonic()>=state['jobs'][-1]['monotonicDeadline']): raise ValueError('Original batch/job deadline')
    try:
        check();job=WindowsJob(LIMITS['commitBytes'],LIMITS['processes'])
        child=subprocess.Popen([sys._base_executable,'-c',script,str(safe(packet_path)),packet_sha,str(safe(allowance_path)),allowance_sha,str(output)],env=environment,cwd=output,stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL,creationflags=4)
        job.assign_resume(child)
        while child.poll() is None:
            check()
            if rss_bytes(child)>LIMITS['rssBytes']: raise ValueError('Decoder RSS admission')
            time.sleep(.02)
        check()
        if child.returncode: raise ValueError('Global worker stopped; preserve claims and reconcile')
    finally:
        if job is not None:
            try:
                job.stop()
                if child is not None:
                    if child.poll() is None: child.kill()
                    child.wait(timeout=3)
                job.drain(timeout=3)
            finally: job.close()


def main():
    parser=argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--plan',action='store_true')
    parser.add_argument('--execute',action='store_true')
    parser.add_argument('--packet');parser.add_argument('--expected-packet-sha256')
    parser.add_argument('--owner-allowance');parser.add_argument('--expected-allowance-sha256');parser.add_argument('--output')
    args=parser.parse_args()
    if args.execute:
        if args.plan or not all([args.packet,args.expected_packet_sha256,args.owner_allowance,args.expected_allowance_sha256,args.output]): parser.error('Explicit packet, allowance pins and output required')
        supervise(args.packet,args.expected_packet_sha256,args.owner_allowance,args.expected_allowance_sha256,args.output)
        return
    if any([args.packet,args.expected_packet_sha256,args.owner_allowance,args.expected_allowance_sha256,args.output]): parser.error('Execution arguments require --execute')
    print(canonical(dict(schemaVersion=1,status='offline-no-execution',limits=LIMITS,rawPerJobBytes=RAW_LIMIT,metadataPerResponseBytes=METADATA_LIMIT,live='requires reviewed packet, permanent owner allowance, provider acceptance and Windows Job supervisor')))


if __name__=='__main__':
    try: main()
    except Exception:
        print('Global acquisition stopped; preserve claims and output for independent reconciliation.',file=sys.stderr)
        sys.exit(1)
