"""Explicitly reviewed bounded historical requests; no serving-time source access."""
import argparse
from pathlib import Path
import sys
import pilot
import download

def prepare(root, start_year, end_year, expected_digest):
    plan=pilot.build_historical_plan(start_year,end_year)
    if pilot.plan_digest(plan)!=expected_digest:
        raise ValueError('Historical plan digest differs from explicit review.')
    root=Path(root).resolve()
    root.mkdir(parents=True,exist_ok=True)
    for name in ['raw','decoded']: pilot.owned(root,name).mkdir(exist_ok=True)
    with pilot.writer_lock(root):
        manifest=pilot.owned(root,'manifest.json')
        if manifest.exists() and pilot.read_json(manifest)!=plan: raise ValueError('Existing immutable historical plan differs.')
        if not manifest.exists(): pilot.atomic_json(manifest,plan)
        ledger=pilot.owned(root,'ledger.json')
        if not ledger.exists(): pilot.atomic_json(ledger,{'schemaVersion':1,'manifestSha256':expected_digest,'entries':[]})
        pilot.load_state(root,plan)
    return plan

if __name__=='__main__':
    parser=argparse.ArgumentParser()
    parser.add_argument('action',choices=['plan','prepare','fetch','resume','reconcile'])
    parser.add_argument('--root',default='.data/era5/history-1991-1992')
    parser.add_argument('--start-year',type=int,default=1991)
    parser.add_argument('--end-year',type=int,default=1992)
    parser.add_argument('--expected-manifest-sha256')
    parser.add_argument('--chunk')
    parser.add_argument('--worker',action='store_true')
    args=parser.parse_args()
    try:
        plan=pilot.build_historical_plan(args.start_year,args.end_year)
        if args.action=='plan': print(pilot.canonical({'manifest':plan,'sha256':pilot.plan_digest(plan)}))
        else:
            if not args.expected_manifest_sha256: raise ValueError('Explicit reviewed manifest digest required.')
            plan=prepare(args.root,args.start_year,args.end_year,args.expected_manifest_sha256)
            if args.action=='prepare': print(pilot.canonical({'manifestSha256':pilot.plan_digest(plan),'chunks':len(plan['chunks'])}))
            elif args.action=='reconcile':
                if not args.chunk: raise ValueError('Exactly one local checkpoint required.')
                print(pilot.canonical(download.reconcile_local(args.root,args.chunk,approved_plan=plan)))
            elif not args.worker:
                print(pilot.canonical(pilot.run_deadline_process([sys.executable,__file__,*sys.argv[1:],'--worker'],output_directory=args.root)))
            else:
                if not args.chunk: raise ValueError('Exactly one explicitly selected chunk required.')
                result=download._run_one(args.root,args.chunk,approved_plan=plan,resume=args.action=='resume')
                print(pilot.canonical(result))
    except Exception:
        print('Historical operation stopped; inspect local checkpoint state before another request.',file=sys.stderr)
        sys.exit(1)
