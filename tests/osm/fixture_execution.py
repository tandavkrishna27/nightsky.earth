"""Test-owned launchers for tiny synthetic engine fixtures, never production CLI approval."""
from functools import wraps
from pathlib import Path
import hashlib
import json
import sys
from unittest.mock import patch

SCRIPTS=Path(__file__).resolve().parents[2]/'scripts/osm'
sys.path.insert(0,str(SCRIPTS))


def raw_fixture_command(command):
    if len(command)>1 and Path(command[1]).name=='global_source.py':
        return [command[0],str(Path(__file__).resolve()),'raw',*command[2:]]
    return command


def fixture_runtime(function):
    """A Python test seam; there is deliberately no production CLI bypass flag."""
    @wraps(function)
    def wrapped(*args,**kwargs):
        import global_source_supervisor as module
        original=module.supervise
        def launch(commands,*values,**options):
            return original([raw_fixture_command(c) for c in commands],*values,**options)
        with patch.object(module,'supervise',side_effect=launch), patch.object(module,'require_admitted_assembly_route',return_value=None):
            return function(*args,**kwargs)
    return wrapped


def fixture_assembly_pipeline(*args,**kwargs):
    import supervised_membership_assembly as module
    def commands(manifest,root,plan,plan_hash,body,geography,node,python,*unused):
        worker=[node,'--max-old-space-size=1280','--import',(SCRIPTS.parents[1]/'node_modules/tsx/dist/loader.mjs').as_uri(),str(Path(__file__).with_name('fixture_membership_launcher.ts'))]
        return [[*worker,'--prepare',str(plan),plan_hash,str(manifest),str(len(body)),hashlib.sha256(body).hexdigest(),str(root/'raw-manifest.json')],
                [python or getattr(sys,'_base_executable',sys.executable),str(Path(__file__).resolve()),'raw',str(root/'raw-manifest.json'),str(root/'normalized'),'--geography-mode',geography],
                [*worker,str(plan),plan_hash,str(root/'normalized'),str(root)]]
    snapshot={'snapshotSha256':'f'*64,'metadataPins':[],'codePins':[]}
    with patch.object(module,'verify_production_admission',return_value=snapshot), patch.object(module,'production_commands',side_effect=commands):
        return module.assembly_pipeline(*args,**kwargs)


if __name__=='__main__':
    import argparse
    from global_source import build
    parser=argparse.ArgumentParser(description=__doc__)
    parser.add_argument('mode',choices=['raw']);parser.add_argument('manifest');parser.add_argument('output')
    parser.add_argument('--geography-mode',default='all-nodes',choices=['all-nodes','selected-references'])
    args=parser.parse_args()
    body=Path(args.manifest).read_bytes()
    if len(body)>1024*1024: raise ValueError('fixture manifest cap')
    manifest=json.loads(body)
    # Fixture launcher cannot be used for a planet body or a provider source.
    if any(s['format']!='xml' or s['bytes']>1024*1024 or not s['url'].startswith('https://example.org/') for s in manifest['sources']):
        raise ValueError('tiny reserved-domain XML fixture required')
    build(manifest,args.output,geography_mode=args.geography_mode)
