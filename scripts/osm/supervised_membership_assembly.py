"""Pinned offline raw -> administrative membership -> immutable catalogue assembly."""
import hashlib
import json
from pathlib import Path
import re
import sys
from global_source import validate_manifest
from global_source_supervisor import supervise
from spot_paths import safe_path


def assembly_pipeline(manifest_path, root, plan_path, plan_sha256, limits, *, node='node', python=None, accounting_paths=()):
    manifest_path=safe_path(manifest_path); root=safe_path(root); plan_path=safe_path(plan_path)
    if manifest_path.stat().st_size>1024*1024: raise ValueError('manifest byte limit')
    with manifest_path.open('rb') as handle: manifest_body=handle.read(1024*1024+1)
    if len(manifest_body)>1024*1024: raise ValueError('manifest byte limit')
    manifest=validate_manifest(json.loads(manifest_body))
    if not isinstance(plan_sha256,str) or not re.fullmatch('[a-f0-9]{64}',plan_sha256): raise ValueError('assembly digest required')
    with plan_path.open('rb') as handle: body=handle.read(1024*1024+1)
    if len(body)>1024*1024 or hashlib.sha256(body).hexdigest()!=plan_sha256: raise ValueError('assembly size/digest mismatch')
    plan=json.loads(body)
    if not isinstance(plan,dict) or set(plan)!=set(('schemaVersion','boundaries','footprints','membership','stream','catalogue','retained')) or type(plan['schemaVersion']) is not int or plan['schemaVersion']!=1: raise ValueError('assembly schema')
    if not isinstance(plan['boundaries'],list) or not 1<=len(plan['boundaries'])<=100: raise ValueError('boundary inventory')
    retained=[manifest_path,plan_path,*[safe_path(s['path']) for s in manifest['sources']],*[safe_path(p) for p in accounting_paths]]
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
    scripts=Path(__file__).resolve().parent
    worker=[node,'--max-old-space-size=1280','--import',(scripts.parents[1]/'node_modules'/'tsx'/'dist'/'loader.mjs').as_uri(),str(scripts/'membership-assembly.ts')]
    # Validate the complete TypeScript plan under the same containment before raw parsing.
    commands=[[*worker,'--prepare',str(plan_path),plan_sha256,str(manifest_path),str(len(manifest_body)),hashlib.sha256(manifest_body).hexdigest(),str(root/'raw-manifest.json')],
              [python or getattr(sys,'_base_executable',sys.executable),str(scripts/'global_source.py'),str(root/'raw-manifest.json'),str(root/'normalized')],
              [*worker,str(plan_path),plan_sha256,str(root/'normalized'),str(root)]]
    return supervise(commands,root,limits,retained=retained)


def load_limits(path):
    with safe_path(path).open('rb') as handle: body=handle.read(4097)
    if len(body)>4096: raise ValueError('limits byte cap')
    return json.loads(body)


if __name__=='__main__':
    import argparse
    parser=argparse.ArgumentParser(description=__doc__)
    for name in ('manifest','root','plan','sha256','limits'): parser.add_argument(name)
    args=parser.parse_args();path=safe_path(args.limits)
    result=assembly_pipeline(args.manifest,args.root,args.plan,args.sha256,load_limits(path),accounting_paths=[path])
    sys.exit(0 if result['status']=='complete' else 1)
