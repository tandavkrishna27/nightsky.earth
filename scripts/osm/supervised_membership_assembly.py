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


def _v2_capacity(plan, manifest, limits):
    pin=plan['capacityPlan']
    if not isinstance(pin,dict) or set(pin)!={'path','bytes','sha256'} or not isinstance(pin['path'],str) or not Path(pin['path']).is_absolute() or type(pin['bytes']) is not int or not 1<=pin['bytes']<=65536 or not isinstance(pin['sha256'],str) or not re.fullmatch('[a-f0-9]{64}',pin['sha256']):raise ValueError('capacity metadata pin')
    path=safe_path(pin['path'])
    with path.open('rb') as stream:body=stream.read(65537)
    if len(body)!=pin['bytes'] or hashlib.sha256(body).hexdigest()!=pin['sha256']:raise ValueError('capacity metadata size/digest mismatch')
    capacity=strict_json(body.decode('utf8'))
    if not isinstance(capacity,dict) or set(capacity)!={'schemaVersion','kind','freeBytes','reserveBytes','retainedBytes','rawSourceAlreadyRetainedBytes','allocations','limits'} or capacity['schemaVersion']!=2 or capacity['kind']!='partitioned-geography-capacity-v1':raise ValueError('capacity version/schema')
    def numbers(value):
        if isinstance(value,(int,float,bool)) and (type(value) is not int or not 0<=value<=9007199254740991):raise ValueError('capacity safe integral numbers required')
        if isinstance(value,dict):
            for item in value.values():numbers(item)
        elif isinstance(value,list):
            for item in value:numbers(item)
    numbers(capacity)
    stage=capacity.get('limits');alloc=capacity.get('allocations')
    if not isinstance(stage,dict) or set(stage)!={'raw','membership','catalogue','supervisor'} or not isinstance(alloc,dict):raise ValueError('capacity stage schema')
    if stage['raw']!=manifest['limits'] or stage['supervisor']!=limits:raise ValueError('capacity raw/supervisor controls mismatch')
    credit=capacity['rawSourceAlreadyRetainedBytes']
    if type(credit) is not int or not 0<=credit<=min(capacity['retainedBytes'],stage['raw']['sourceBytes'],sum(source['bytes'] for source in manifest['sources'])) or alloc.get('raw',-1)<stage['raw']['sourceBytes']-credit:raise ValueError('retained source credit or raw allocation')
    if plan['evidenceLayout']!=LAYOUT or manifest.get('evidenceLayout')!=LAYOUT:raise ValueError('capacity layout mismatch')
    total=plan['maxNormalizedOutputBytes'];candidate=plan['maxCandidateInputBytes']
    if type(total) is not int or not 1<=total<=MAX_OUTPUT_BYTES or type(candidate) is not int or not 1<=candidate<=total or stage['raw']['outputBytes']!=total or alloc.get('normalizedOutput')!=total or alloc.get('stagedCandidates')!=0:raise ValueError('explicit aggregate capacity mismatch')
    if not isinstance(stage['membership'],dict) or stage['membership']!={**plan['membership'],'maxCandidateInputBytes':candidate} or stage['catalogue']!=plan['catalogue']:raise ValueError('capacity downstream controls mismatch')
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
    if not isinstance(plan,dict) or type(plan.get('schemaVersion')) is not int or plan['schemaVersion'] not in (1,2):raise ValueError('assembly schema')
    if plan['schemaVersion']==2:plan=strict_json(body.decode('utf8'))
    version=plan['schemaVersion'];required={'schemaVersion','boundaries','footprints','membership','stream','catalogue','retained'}
    if version==2:required|={'evidenceLayout','maxNormalizedOutputBytes','maxCandidateInputBytes','capacityPlan'}
    if set(plan)-{'geographyMode','sourceDomains'}!=required or manifest['schemaVersion']!=version:raise ValueError('assembly layout version/schema mismatch')
    if not isinstance(plan['retained'],list) or len(plan['retained'])>100:raise ValueError('retained inventory')
    if version==2:
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
    if version==2:retained.append(capacity_path)
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
        if version==2 and len(retained)>=63 and pin['path'] not in [str(path) for path in retained]:raise ValueError('version-2 retained root cardinality exceeds 64')
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
