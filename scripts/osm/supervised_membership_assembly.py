"""Pinned offline raw -> administrative membership -> immutable catalogue assembly."""
import hashlib
import json
from pathlib import Path
import re
import sys
from global_source import validate_manifest, planet_retained_paths, admitted_raw_leases
from production_admission import verify_production_admission
from global_source_supervisor import supervise
from spot_paths import safe_path
from normalized_partitions import strict_json, LAYOUT, MAX_OUTPUT_BYTES


def _v3_controls(plan, manifest, capacity, limits):
    """Mirror the strict v3 resource/capacity coupling before the fixed gate."""
    maximum=9007199254740991;MiB=1024**2;GiB=1024**3
    def integer(value, ceiling=maximum, minimum=1):
        if type(value) is not int or not minimum<=value<=ceiling:raise ValueError('v3 explicit safe integral resource bounds required')
        return value
    def total(*values):return integer(sum(values),minimum=0)
    def fields(value, expected):
        if not isinstance(value,dict) or set(value)!=set(expected):raise ValueError('v3 strict resource fields required')
    member=plan['membership'];validation=plan['validation'];catalogue=plan['catalogue'];stream=plan['stream'];alloc=capacity['allocations']
    fields(member,('maxBoundaryBytes','maxVertices','maxTotalVertices','maxGeometryComparisons','maxRows','maxOutputBytes','maxMilliseconds'))
    bounds=dict(maxBoundaryBytes=64*MiB,maxVertices=1000000,maxTotalVertices=2000000,maxGeometryComparisons=200000000,maxRows=10000000,maxOutputBytes=64*128*MiB+128*MiB+MiB,maxMilliseconds=1800000)
    for key,ceiling in bounds.items():integer(member[key],ceiling)
    fields(validation,('maxLexicalTokens','maxOperations','maxReadBytes','maxRowsRead','controlAndAdmissionReadBytes'))
    for value in validation.values():integer(value)
    if capacity['limits']['validation']!=validation:raise ValueError('v3 exact validation capacity controls mismatch')
    fields(catalogue,('chunkRows','mergeFanIn','maxRows','fanout','maxInputRows','maxMetadataRows','maxInputBytes','maxOutputBytes','maxScratchBytes','timeoutMs'))
    for key,ceiling in dict(chunkRows=10000,mergeFanIn=16,maxRows=10000,fanout=256,maxInputRows=10000000,maxMetadataRows=10000,maxInputBytes=10*GiB,maxOutputBytes=10*GiB,maxScratchBytes=10*GiB,timeoutMs=1800000).items():integer(catalogue[key],ceiling,2 if key in ('mergeFanIn','fanout') else 1)
    fields(stream,('maxRowBytes','maxBytes','maxRows'))
    for value in stream.values():integer(value)
    fields(alloc,('raw','index','journal','normalizedOutput','boundaries','stagedCandidates','stagedBoundaries','footprints','membership','sort','catalogue','failureReports','rollback'))
    for value in alloc.values():integer(value,minimum=0)
    for key,ceiling in dict(boundaries=64*MiB,footprints=128*MiB,membership=bounds['maxOutputBytes'],sort=10*GiB,catalogue=10*GiB).items():integer(alloc[key],ceiling,0)
    fields(limits,('wallSeconds','rssBytes','commitBytes','diskBytes','freeBytes','maxProcesses'))
    for key,value in limits.items():integer(value,172800 if key=='wallSeconds' else 4 if key=='maxProcesses' else maximum,0 if key=='freeBytes' else 1)
    for key in ('freeBytes','reserveBytes','retainedBytes','rawSourceAlreadyRetainedBytes'):integer(capacity[key],minimum=0)
    raw=manifest['limits'];M=member['maxOutputBytes'];F=alloc['footprints'];G=member['maxBoundaryBytes']
    expected_read=total(4*total(plan['maxNormalizedOutputBytes'],M,F),8*MiB,3*G,validation['controlAndAdmissionReadBytes'])
    if validation['maxReadBytes']!=expected_read or validation['maxLexicalTokens']>expected_read:raise ValueError('v3 exact validation read reservation mismatch')
    if member['maxRows']>raw['candidates'] or member['maxRows']>catalogue['maxInputRows'] or member['maxTotalVertices']<member['maxVertices']:raise ValueError('v3 row/vertex capacity controls mismatch')
    publication=total(M,F)
    if catalogue['maxInputBytes']<publication or stream['maxBytes']<publication or stream['maxRows']<member['maxRows'] or stream['maxRowBytes']!=65536:raise ValueError('v3 enriched/common publication capacity mismatch')
    if alloc['membership']<M or alloc['boundaries']<G or alloc['stagedBoundaries']<alloc['boundaries'] or total(alloc['index'],alloc['journal'])<raw['scratchBytes'] or alloc['sort']<catalogue['maxScratchBytes'] or alloc['catalogue']<catalogue['maxOutputBytes']:raise ValueError('v3 stage allocation mismatch')
    if total(*(pin['input']['bytes'] for pin in plan['boundaries']))>G or plan['footprints']['bytes']>F:raise ValueError('v3 geometry/footprint pin allocation mismatch')
    incremental=total(*alloc.values())
    if limits['diskBytes']<total(incremental,capacity['retainedBytes']) or capacity['freeBytes']<total(capacity['reserveBytes'],incremental) or min(limits['freeBytes'],raw['freeBytes'])<capacity['reserveBytes'] or limits['rssBytes']>limits['commitBytes']:raise ValueError('v3 retained/reserve/supervisor capacity mismatch')
    if total(raw['seconds']*1000,member['maxMilliseconds'],catalogue['timeoutMs'])>limits['wallSeconds']*1000:raise ValueError('v3 cumulative stage deadline exceeds supervisor')


def _v2_capacity(plan, manifest, limits):
    pin=plan['capacityPlan']
    if not isinstance(pin,dict) or set(pin)!={'path','bytes','sha256'} or not isinstance(pin['path'],str) or not Path(pin['path']).is_absolute() or type(pin['bytes']) is not int or not 1<=pin['bytes']<=65536 or not isinstance(pin['sha256'],str) or not re.fullmatch('[a-f0-9]{64}',pin['sha256']):raise ValueError('capacity metadata pin')
    path=safe_path(pin['path'])
    with path.open('rb') as stream:body=stream.read(65537)
    if len(body)!=pin['bytes'] or hashlib.sha256(body).hexdigest()!=pin['sha256']:raise ValueError('capacity metadata size/digest mismatch')
    capacity=strict_json(body.decode('utf8'))
    version=plan['schemaVersion'];kind='partitioned-geography-capacity-v2' if version==3 else 'partitioned-geography-capacity-v1'
    if not isinstance(capacity,dict) or set(capacity)!={'schemaVersion','kind','freeBytes','reserveBytes','retainedBytes','rawSourceAlreadyRetainedBytes','allocations','limits'} or capacity['schemaVersion']!=version or capacity['kind']!=kind:raise ValueError('capacity version/schema')
    def numbers(value):
        if isinstance(value,(int,float,bool)) and (type(value) is not int or not 0<=value<=9007199254740991):raise ValueError('capacity safe integral numbers required')
        if isinstance(value,dict):
            for item in value.values():numbers(item)
        elif isinstance(value,list):
            for item in value:numbers(item)
    numbers(capacity)
    stage=capacity.get('limits');alloc=capacity.get('allocations')
    if not isinstance(stage,dict) or set(stage)!=({'raw','membership','catalogue','supervisor','validation'} if version==3 else {'raw','membership','catalogue','supervisor'}) or not isinstance(alloc,dict):raise ValueError('capacity stage schema')
    if stage['raw']!=manifest['limits'] or stage['supervisor']!=limits:raise ValueError('capacity raw/supervisor controls mismatch')
    credit=capacity['rawSourceAlreadyRetainedBytes']
    if type(credit) is not int or not 0<=credit<=min(capacity['retainedBytes'],stage['raw']['sourceBytes'],sum(source['bytes'] for source in manifest['sources'])) or alloc.get('raw',-1)<stage['raw']['sourceBytes']-credit:raise ValueError('retained source credit or raw allocation')
    if plan['evidenceLayout']!=LAYOUT or manifest.get('evidenceLayout')!=LAYOUT:raise ValueError('capacity layout mismatch')
    total=plan['maxNormalizedOutputBytes'];candidate=plan['maxCandidateInputBytes']
    if type(total) is not int or not 1<=total<=MAX_OUTPUT_BYTES or type(candidate) is not int or not 1<=candidate<=total or stage['raw']['outputBytes']!=total or alloc.get('normalizedOutput')!=total or alloc.get('stagedCandidates')!=0:raise ValueError('explicit aggregate capacity mismatch')
    if not isinstance(stage['membership'],dict) or stage['membership']!={**plan['membership'],'maxCandidateInputBytes':candidate} or stage['catalogue']!=plan['catalogue']:raise ValueError('capacity downstream controls mismatch')
    if version==3:_v3_controls(plan,manifest,capacity,limits)
    # The fixed TS admission gate performs the complete versioned allocation
    # evaluation and retains this exact pin before any Job can be launched.
    return path


def assembly_pipeline(manifest_path, root, plan_path, plan_sha256, limits, *, node='node', python=None, accounting_paths=(), admission_path=None, admission_sha256=None):
    manifest_path=safe_path(manifest_path); root=safe_path(root); plan_path=safe_path(plan_path)
    if manifest_path.stat().st_size>1024*1024: raise ValueError('manifest byte limit')
    with manifest_path.open('rb') as handle: manifest_body=handle.read(1024*1024+1)
    if len(manifest_body)>1024*1024: raise ValueError('manifest byte limit')
    decoded=json.loads(manifest_body)
    # V2 cardinality is checked from bounded metadata before source path/domain expansion.
    manifest=strict_json(manifest_body.decode('utf8')) if isinstance(decoded,dict) and decoded.get('schemaVersion')==2 else validate_manifest(decoded)
    if not isinstance(plan_sha256,str) or not re.fullmatch('[a-f0-9]{64}',plan_sha256): raise ValueError('assembly digest required')
    with plan_path.open('rb') as handle: body=handle.read(1024*1024+1)
    if len(body)>1024*1024 or hashlib.sha256(body).hexdigest()!=plan_sha256: raise ValueError('assembly size/digest mismatch')
    plan=json.loads(body)
    if not isinstance(plan,dict) or type(plan.get('schemaVersion')) is not int or plan['schemaVersion'] not in (1,2,3):raise ValueError('assembly schema')
    if plan['schemaVersion'] in (2,3):plan=strict_json(body.decode('utf8'))
    version=plan['schemaVersion'];required={'schemaVersion','boundaries','footprints','membership','stream','catalogue','retained'}
    if version in (2,3):required|={'evidenceLayout','maxNormalizedOutputBytes','maxCandidateInputBytes','capacityPlan'}
    if version==3:required.add('validation')
    if set(plan)-{'geographyMode','sourceDomains'}!=required or (manifest['schemaVersion'],version) not in ((1,1),(2,2),(2,3)):raise ValueError('assembly layout version/schema mismatch')
    if not isinstance(plan['retained'],list) or len(plan['retained'])>100:raise ValueError('retained inventory')
    if version in (2,3):
        if not isinstance(manifest.get('sources'),list) or not 1<=len(manifest['sources'])<=64 or any(not isinstance(source,dict) for source in manifest['sources']) or not isinstance(plan.get('boundaries'),list):raise ValueError('version-2 bounded source/boundary inventory')
        if len(plan['retained'])+len(manifest['sources'])+len(plan.get('boundaries',[]))+len(accounting_paths)+5+3*sum('sourceDomain' in source for source in manifest['sources'])>64:raise ValueError('version-2 retained root cardinality exceeds 64')
        manifest=validate_manifest(manifest)
        capacity_path=_v2_capacity(plan,manifest,limits)

    geography_mode=plan.get('geographyMode','all-nodes')
    if geography_mode not in ('all-nodes','selected-references'): raise ValueError('geography mode')
    if not isinstance(plan['boundaries'],list) or not 1<=len(plan['boundaries'])<=100: raise ValueError('boundary inventory')
    expected_domains=[dict(sourceId=s['id'],**s['sourceDomain']) for s in manifest['sources'] if 'sourceDomain' in s]
    if plan.get('sourceDomains',[])!=expected_domains: raise ValueError('assembly planet domain mismatch')
    retained=[*planet_retained_paths(manifest),manifest_path,plan_path,*[safe_path(s['path']) for s in manifest['sources']],*[safe_path(p) for p in accounting_paths]]
    if version in (2,3):retained.append(capacity_path)
    for pin in [*[s['input'] for s in plan['boundaries']],plan['footprints']]:
        if not isinstance(pin,dict) or set(pin)!=set(('path','bytes','sha256')) or not isinstance(pin['path'],str) or not Path(pin['path']).is_absolute(): raise ValueError('absolute input pin required')
        if type(pin['bytes']) is not int or not 0<=pin['bytes']<=128*1024**2 or not isinstance(pin['sha256'],str) or not re.fullmatch('[a-f0-9]{64}',pin['sha256']): raise ValueError('invalid input pin')
        path=safe_path(pin['path'])
        if not path.is_file() or path.stat().st_size!=pin['bytes']: raise ValueError('input size pin mismatch')
        retained.append(path)
    if not isinstance(plan['retained'],list) or len(plan['retained'])>100: raise ValueError('retained inventory')
    for path in plan['retained']:
        if not isinstance(path,str) or not Path(path).is_absolute(): raise ValueError('absolute retained path required')
        path=safe_path(path)
        if not path.exists(): raise ValueError('missing retained accounting path')
        retained.append(path)
    # Reject overlap before platform/limit checks and before creating any evidence.
    for i,path in enumerate(retained):
        if path==root or path.is_relative_to(root) or root.is_relative_to(path) or any(path==q or path.is_relative_to(q) or q.is_relative_to(path) for q in retained[:i]): raise ValueError('overlapping retained accounting')
    admitted=verify_production_admission(manifest_path,admission_path,admission_sha256,'preflight',
        expected_plan_path=plan_path,expected_plan_sha256=plan_sha256)
    # Shared evidence is counted once; explicit retained overlaps stay rejected.
    for pin in [admitted.get('admission',{}),*admitted.get('metadataPins',[]),*admitted.get('codePins',[])]:
        if not pin.get('path'): continue
        if version in (2,3) and len(retained)>=63 and pin['path'] not in [str(path) for path in retained]:raise ValueError('partitioned retained root cardinality exceeds 64')
        path=safe_path(pin['path'])
        if path not in retained: retained.append(path)
    commands=production_commands(manifest_path,root,plan_path,plan_sha256,manifest_body,geography_mode,node,python,
        admission_path,admission_sha256,admitted['snapshotSha256'])
    # Freeze retained files across stage transitions. On Windows these handles
    # deny writes/deletes, including through hardlink aliases, without a raw copy.
    with admitted_raw_leases([{'path':p} for p in retained if p.is_file()]):
        verify_production_admission(manifest_path,admission_path,admission_sha256,'preflight',admitted['snapshotSha256'],
            expected_plan_path=plan_path,expected_plan_sha256=plan_sha256)
        return supervise(commands,root,limits,retained=retained)


def production_commands(manifest_path,root,plan_path,plan_sha256,manifest_body,geography_mode,node,python,admission_path,admission_sha256,snapshot):
    scripts=Path(__file__).resolve().parent
    worker=[node,'--max-old-space-size=1280','--import',(scripts.parents[1]/'node_modules'/'tsx'/'dist'/'loader.mjs').as_uri(),str(scripts/'membership-assembly.ts')]
    gate=['--admission',str(admission_path),'--admission-sha256',admission_sha256,'--admission-snapshot',snapshot]
    # The staged manifest is audit evidence. The raw invocation reads the exact
    # independently admitted original pin, under the same retained-file leases.
    return [[*worker,'--prepare',str(plan_path),plan_sha256,str(manifest_path),str(len(manifest_body)),hashlib.sha256(manifest_body).hexdigest(),str(root/'raw-manifest.json'),*gate],
            [python or getattr(sys,'_base_executable',sys.executable),str(scripts/'global_source.py'),str(manifest_path),str(root/'normalized'),'--geography-mode',geography_mode,'--admission',str(admission_path),admission_sha256,'--admission-snapshot',snapshot],
            [*worker,str(plan_path),plan_sha256,str(root/'normalized'),str(root),'--manifest',str(manifest_path),*gate]]


def load_limits(path):
    with safe_path(path).open('rb') as handle: body=handle.read(4097)
    if len(body)>4096: raise ValueError('limits byte cap')
    return json.loads(body)


if __name__=='__main__':
    import argparse
    parser=argparse.ArgumentParser(description=__doc__)
    for name in ('manifest','root','plan','sha256','limits'): parser.add_argument(name)
    parser.add_argument('--admission',nargs=2,required=True,metavar=('FILE','SHA256'))
    args=parser.parse_args();path=safe_path(args.limits)
    result=assembly_pipeline(args.manifest,args.root,args.plan,args.sha256,load_limits(path),accounting_paths=[path],admission_path=args.admission[0],admission_sha256=args.admission[1])
    sys.exit(0 if result['status']=='complete' else 1)
