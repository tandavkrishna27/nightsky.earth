"""Offline three-source planning and synthetic recovery rehearsal; no live CLI."""
import argparse
from contextlib import contextmanager
import hashlib
import json
import os
from pathlib import Path
import stat
import time

MIB = 1024 * 1024
JOURNAL_LIMIT = MIB

def _manifest(value=None):
    from spot_manifest import DEFAULT_MANIFEST, load_manifest, manifest_digest
    document = load_manifest(DEFAULT_MANIFEST if value is None else value)
    return document, manifest_digest(document)

def _payload(value):
    return (json.dumps(value, sort_keys=True, separators=(',', ':'))+'\n').encode()

from spot_paths import safe_path as _safe


def logical_bytes(root):
    root=_safe(root)
    total=0; entries=0
    for directory, directories, files in os.walk(root, followlinks=False):
        for name in directories+files:
            entries+=1
            if entries>1000: raise ValueError('pilot entry cap exceeded')
            item=_safe(Path(directory)/name)
            info=item.lstat()
            if stat.S_ISREG(info.st_mode):
                if info.st_nlink != 1: raise ValueError('hard-linked pilot file refused')
                total+=info.st_size
            elif not stat.S_ISDIR(info.st_mode): raise ValueError('special pilot file refused')
    return total

class Budget:
    """Cooperative admission used by injected offline operations, not a sandbox."""
    def __init__(self, root, *, max_bytes=100*MIB, clock=time.monotonic, started=None):
        if not 0 < max_bytes <= 100*MIB: raise ValueError('invalid disk envelope')
        self.root=_safe(root); self.max_bytes=max_bytes; self.clock=clock
        self.started=clock() if started is None else started
        self.deadline=self.started+900; self.requests=0; self.active=False
        self.peak_bytes=0
    def check(self, pending=0):
        if not isinstance(pending,int) or isinstance(pending,bool) or pending<0: raise ValueError('invalid pending bytes')
        if self.clock()>=self.deadline: raise TimeoutError('900 second operator deadline')
        size=logical_bytes(self.root); self.peak_bytes=max(self.peak_bytes,size)
        if size+pending>self.max_bytes: raise ValueError('whole-pilot logical disk budget exceeded')
        return size
    def request(self):
        self.check()
        if self.requests>=6: raise ValueError('six request budget exceeded')
        self.requests+=1
    @contextmanager
    def stage(self):
        if self.active: raise RuntimeError('one active stage allowed')
        self.check(); self.active=True; began=self.clock()
        try:
            yield
            if self.clock()-began>=60: raise TimeoutError('60 second stage deadline')
            self.check()
        finally: self.active=False

def _write(path, value, budget):
    path=_safe(path)
    if not path.is_relative_to(budget.root): raise ValueError('path escapes wave')
    payload=_payload(value)
    if len(payload)>JOURNAL_LIMIT: raise ValueError('journal/report exceeds 1 MiB')
    budget.check(len(payload))
    with path.open('xb') as output:
        output.write(payload); output.flush(); os.fsync(output.fileno())
    budget.check()

def _inventory(root):
    result=[]
    logical_bytes(root)
    for path in sorted(root.rglob('*')):
        if path.is_file():
            digest=hashlib.sha256()
            with path.open('rb') as raw:
                while chunk:=raw.read(MIB): digest.update(chunk)
            result.append(dict(path=path.relative_to(root).as_posix(),bytes=path.stat().st_size,sha256=digest.hexdigest()))
    return result

def plan(manifest=None):
    document,digest=_manifest(manifest)
    return dict(mode='offline-plan',manifestDigest=digest,sources=document['sources'],
                rawDeclaredBytes=sum(s['declaredBytes'] for s in document['sources']),
                limits=dict(logicalBytes=100*MIB,operatorSeconds=900,workerSeconds=60,
                            workerRssBytes=256*MIB,jobCommitBytes=256*MIB,activeWorkers=1,httpRequests=6),
                liveExecutionAvailable=False,offlineWindowsWorkerAvailable=os.name=='nt',
                prerequisites=['explicit owner acquisition authorization before any live capability injection'],
                disposition='local evidence only; no publication or runtime installation')

def run_wave(root, *, manifest=None, acquire=None, build=None, opener=None):
    """Injected offline operations only. No implied process/resource enforcement.

    An explicit opener capability can be injected for mock acquisition; every
    request counts against the six-request ceiling. CLI exposes no network.
    """
    if acquire is None and opener is not None:
        from spot_acquisition import acquire_source
        acquire=acquire_source
    if acquire is None or build is None: raise ValueError('explicit offline acquire/build injections required')
    document,pin=_manifest(manifest); root=_safe(root)
    if root.exists(): raise FileExistsError(root)
    root.mkdir(); budget=Budget(root)
    _write(root/'manifest.json',document,budget)
    _write(root/'identity.json',dict(version=1,manifestDigest=pin,root=str(root),mode='offline-injected',
                                   enforcement='cooperative; no Windows job/RSS enforcement'),budget)
    outcomes=[]; sequence=0
    def counted_opener(request, **kwargs):
        budget.request()
        return opener(request, **kwargs)
    def execute(operation, *args, **kwargs):
        if getattr(operation,'supervised',False): return operation(*args,**kwargs)
        with budget.stage(): return operation(*args,**kwargs)
    def event(source,phase,state,**extra):
        nonlocal sequence
        sequence+=1
        _write(root/f'journal-{sequence:03}.json',dict(version=1,sequence=sequence,
               manifestDigest=pin,source=source,phase=phase,state=state,**extra),budget)
    for source in document['sources']:
        folder=root/source['id']; folder.mkdir()
        try:
            event(source,'acquisition','pending')
            kwargs=dict(deadline=min(budget.deadline,budget.clock()+60),budget_check=budget.check)
            if opener is not None: kwargs['opener']=counted_opener
            acquired=execute(acquire,source,folder,**kwargs)
            source_path=_safe(Path(acquired['path']))
            if not source_path.is_relative_to(folder) or not source_path.is_file(): raise ValueError('acquisition path escapes source folder')
            if not acquired.get('synthetic'):
                if acquired.get('sourceId')!=source['id'] or acquired.get('bytes')!=source['declaredBytes'] or acquired.get('actualVintage')!=source['expectedVintage']:
                    raise ValueError('acquired source identity mismatch')
                artifact=next(x for x in _inventory(folder) if x['path']==source_path.relative_to(folder).as_posix())
                if artifact['bytes']!=acquired['bytes'] or artifact['sha256']!=acquired.get('sha256'): raise ValueError('acquired hash/length mismatch')
            event(source,'acquisition','complete',artifacts=_inventory(folder))
            event(source,'build','pending')
            built=execute(build,source_path,folder/'build',dict(source,**acquired),budget_check=budget.check)
            event(source,'build','complete',artifacts=_inventory(folder),worker=built)
            outcomes.append(dict(id=source['id'],status='complete'))
        except Exception as error:
            # No removal/retry. If writing this event cannot fit, pending remains
            # uncertain and is detected by inspection rather than declared failed.
            try: event(source,'wave','failed',error=str(error)[:1024],artifacts=_inventory(folder))
            except Exception: pass
            outcomes.append(dict(id=source['id'],status='failed',error=str(error)[:1024]))
            break
    result=dict(version=1,manifestDigest=pin,status='complete' if len(outcomes)==3 and all(x['status']=='complete' for x in outcomes) else 'failed',
                sources=outcomes,httpRequests=budget.requests,peakLogicalBytes=budget.peak_bytes,
                enforcement='Windows Job build worker' if getattr(build,'supervised',False) else 'cooperative offline injection; no Windows job/RSS enforcement',
                artifacts=_inventory(root))
    # Report length depends on its own decimal peak field. Converge before
    # exclusive creation so the recorded peak includes the report itself.
    before=budget.check()
    for _ in range(16):
        predicted=max(budget.peak_bytes,before+len(_payload(result)))
        if predicted==result['peakLogicalBytes']: break
        result['peakLogicalBytes']=predicted
    else: raise ValueError('report size did not converge')
    budget.check(len(_payload(result)))
    _write(root/'report.json',result,budget)
    if budget.peak_bytes>result['peakLogicalBytes']: raise ValueError('report final accounting changed')
    return result

def rehearse(root, manifest=None, *, supervised=False):
    def acquire(source,folder,**kwargs):
        kwargs['budget_check'](32)
        path=folder/'synthetic.json'
        payload=_payload(dict(synthetic=True,id=source['id']))
        kwargs['budget_check'](len(payload))
        with path.open('xb') as output: output.write(payload)
        return dict(path=str(path),bytes=len(payload),sha256=hashlib.sha256(payload).hexdigest(),synthetic=True)
    def build(path,folder,source,**kwargs):
        folder.mkdir(); payload=_payload(dict(synthetic=True,candidates=[],source=source['id']))
        kwargs['budget_check'](len(payload))
        with (folder/'synthetic-candidates.json').open('xb') as output: output.write(payload)
        return dict(synthetic=True)
    if supervised:
        def build(path,folder,source,**kwargs):
            folder.mkdir()
            result=supervise_worker(['--internal-worker','synthetic','--root',str(Path(root).absolute()),'--output',str(folder)],folder,kwargs['budget_check'].__self__)
            if result['status']!='complete': raise RuntimeError(str(result))
            return result
        build.supervised=True
    return run_wave(root,manifest=manifest,acquire=acquire,build=build)

def _read(path):
    if path.stat().st_size>JOURNAL_LIMIT: raise ValueError('oversize journal/report')
    try:
        result=json.loads(path.read_text(encoding='utf-8'))
        if not isinstance(result,dict): raise ValueError('checkpoint must be an object')
        return result
    except (ValueError,UnicodeError) as error: raise ValueError('corrupt checkpoint') from error

def _verify_artifacts(root, artifacts):
    if not isinstance(artifacts,list) or len(artifacts)>1000: raise ValueError('invalid artifact ledger')
    seen=set()
    for item in artifacts:
        if not isinstance(item,dict) or set(item)!={'path','bytes','sha256'}: raise ValueError('invalid artifact record')
        if not isinstance(item['path'],str) or item['path'] in seen: raise ValueError('duplicate/invalid artifact path')
        seen.add(item['path'])
        if type(item['bytes']) is not int or not 0<=item['bytes']<=100*MIB: raise ValueError('invalid artifact length')
        if not isinstance(item['sha256'],str) or len(item['sha256'])!=64 or any(c not in '0123456789abcdef' for c in item['sha256']): raise ValueError('invalid artifact digest')
        relative=Path(item['path'])
        if relative.anchor or relative.drive or relative.root or '..' in relative.parts: raise ValueError('artifact path escapes root')
        path=_safe(root/relative)
        if not path.is_relative_to(_safe(root)): raise ValueError('artifact path escapes root')
        if not path.is_file() or path.stat().st_size!=item['bytes']: raise ValueError('checkpoint artifact length mismatch')
        digest=hashlib.sha256()
        with path.open('rb') as raw:
            while chunk:=raw.read(MIB): digest.update(chunk)
        if digest.hexdigest()!=item['sha256']: raise ValueError('checkpoint artifact digest mismatch')

def inspect_wave(root, manifest=None):
    """Read-only recovery audit. Never authorizes or automatically resumes work."""
    root=_safe(root); Budget(root).check()
    document,pin=_manifest(manifest)
    if _read(root/'manifest.json')!=document: raise ValueError('manifest pin mismatch')
    identity=_read(root/'identity.json')
    if identity.get('manifestDigest')!=pin or identity.get('root')!=str(root): raise ValueError('root/manifest identity mismatch')
    pending={}; failed=False; completed=[]; cursor=0
    expected=[(source,phase,state) for source in document['sources']
              for phase in ('acquisition','build') for state in ('pending','complete')]
    journals=sorted(root.glob('journal-*.json'))
    if len(journals)>13: raise ValueError('journal count exceeded')
    for sequence,path in enumerate(journals,1):
        event=_read(path)
        if path.name!=f'journal-{sequence:03}.json' or type(event.get('sequence')) is not int or event['sequence']!=sequence or (type(event.get('version')) is not int or event['version']!=1) or event.get('manifestDigest')!=pin:
            raise ValueError('journal identity/order mismatch')
        if failed or cursor>=len(expected): raise ValueError('stage after terminal state')
        wanted_source,wanted_phase,wanted_state=expected[cursor]
        if event.get('source')!=wanted_source: raise ValueError('journal source order mismatch')
        state=event.get('state'); key=(wanted_source['id'],event.get('phase'))
        if state=='failed':
            if event.get('phase')!='wave' or not pending or not isinstance(event.get('error'),str): raise ValueError('failure without pending stage')
            failed=True; pending={}; _verify_artifacts(root/wanted_source['id'],event['artifacts'])
            continue
        if event.get('phase')!=wanted_phase or state!=wanted_state: raise ValueError('journal stage order mismatch')
        cursor+=1
        if state=='pending': pending[key]=True
        elif state=='complete':
            pending.pop(key); _verify_artifacts(root/wanted_source['id'],event['artifacts'])
            if wanted_phase=='build': completed.append(dict(id=wanted_source['id'],status='complete'))

    report_path=root/'report.json'
    if report_path.exists():
        report=_read(report_path)
        if report.get('manifestDigest')!=pin or type(report.get('version')) is not int or report['version']!=1: raise ValueError('report pin mismatch')
        if report.get('status') not in ('complete','failed'): raise ValueError('invalid report status')
        for field,maximum in (('httpRequests',6),('peakLogicalBytes',100*MIB)):
            if type(report.get(field)) is not int or not 0<=report[field]<=maximum: raise ValueError('invalid report resource field')
        if report.get('enforcement') not in ('Windows Job build worker','cooperative offline injection; no Windows job/RSS enforcement'): raise ValueError('invalid report enforcement')
        outcomes=report.get('sources')
        if not isinstance(outcomes,list) or len(outcomes)!=len(completed)+(1 if failed else 0): raise ValueError('invalid report sources')
        if outcomes[:len(completed)]!=completed: raise ValueError('report completion/source mismatch')
        if failed:
            last=outcomes[-1]
            if set(last)!={'id','status','error'} or last['id']!=document['sources'][len(completed)]['id'] or last['status']!='failed' or not isinstance(last['error'],str): raise ValueError('invalid failure outcome')
        if report['status']=='failed' and not failed: raise ValueError('failed report without failed stage')
        _verify_artifacts(root,report['artifacts'])
        if report.get('status')=='complete' and (pending or failed or cursor!=12 or len(completed)!=3): raise ValueError('invalid complete checkpoint')
    if report_path.exists():
        if report['peakLogicalBytes']<logical_bytes(root): raise ValueError('reported peak below final logical bytes')
        recorded={item['path'] for item in report['artifacts']} | {'report.json'}
        actual={item['path'] for item in _inventory(root)}
        if actual!=recorded: raise ValueError('unrecorded checkpoint files')
    return dict(status='failed' if failed else ('uncertain' if pending or not report_path.exists() else report['status']),
                manifestDigest=pin,pendingStages=[list(k) for k in pending],resumeAllowed=False,
                disposition='inspect preserved evidence; create a fresh wave after review')

def main():
    parser=argparse.ArgumentParser(description=__doc__)
    parser.add_argument('mode',choices=['plan','rehearse','inspect'],nargs='?',default='plan')
    parser.add_argument('--root',type=Path)
    parser.add_argument('--internal-worker',choices=['synthetic','build'],help=argparse.SUPPRESS)
    parser.add_argument('--output',type=Path,help=argparse.SUPPRESS)
    parser.add_argument('--record',type=Path,help=argparse.SUPPRESS)
    args=parser.parse_args()
    if args.mode=='rehearse' and os.name!='nt': parser.error('supervised rehearsal is Windows-only; Linux unsupported')
    if args.internal_worker:
        if args.root is None or args.output is None: parser.error('internal worker requires root/output')
        return worker_action(args.internal_worker,args.root,args.output,args.record)
    if args.mode=='plan': result=plan()
    else:
        if args.root is None: parser.error('--root required')
        result=rehearse(args.root,supervised=True) if args.mode=='rehearse' else inspect_wave(args.root)
    print(json.dumps(result,indent=2))



# Windows child enforcement: existing tested Job helper reused read-only. Unlike
# retained supervision, every poll walks the entire wave, including prior sources.
def supervise_worker(arguments, folder, budget, *, wall_seconds=60, rss_mib=256):
    import subprocess
    import sys
    if os.name!='nt': raise RuntimeError('Windows-only worker supervisor; Linux unsupported')
    if not 0<wall_seconds<=60 or not 0<rss_mib<=256: raise ValueError('invalid worker limits')
    folder=_safe(folder)
    if not folder.is_relative_to(budget.root) or not folder.is_dir(): raise ValueError('worker folder outside root')
    budget.check()
    from retained_experiment import WindowsJob, wait_for_directory_release
    from bounded_nodes import rss_bytes
    environment=dict(os.environ,PYTHONPATH=os.pathsep.join(sys.path),PYTHONDONTWRITEBYTECODE='1',TMP=str(folder),TEMP=str(folder))
    job=WindowsJob(rss_mib*MIB); process=None
    began=time.monotonic(); peak=0; reason=None; exit_code=None
    try:
        with budget.stage():
            process=subprocess.Popen([getattr(sys,'_base_executable',sys.executable),str(Path(__file__).absolute()),*arguments],
                    cwd=folder,env=environment,creationflags=0x4,stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL)
            job.assign_resume(process)
            while True:
                budget.check()
                peak=max(peak,rss_bytes(process))
                if time.monotonic()-began>=wall_seconds: reason='worker wall limit'
                elif peak>rss_mib*MIB: reason='worker RSS limit'
                if reason or process.poll() is not None: break
                time.sleep(.02)
    except Exception as error:
        reason='supervisor/accounting failure: '+str(error)
    finally:
        try:
            if process is not None and process.poll() is None:
                try: job.stop()
                except OSError as error: reason=reason or 'job termination failure: '+str(error)
                if process.poll() is None: process.kill()
                try: process.wait(timeout=3)
                except subprocess.TimeoutExpired: reason=reason or 'process did not stop within cleanup deadline'
            try: job.drain(timeout=3)
            except Exception as error: reason=reason or 'job drain failure: '+str(error)
            if process is not None: exit_code=process.poll()
        finally:
            job.close()
            if process is not None: process._handle.Close()
        try: wait_for_directory_release(folder,timeout=3)
        except Exception as error: reason=reason or 'directory release failure: '+str(error)
    return dict(status='bounded-stop' if reason else ('complete' if exit_code==0 else 'failed'),reason=reason,
                exitCode=exit_code,elapsedSeconds=round(time.monotonic()-began,3),peakRssBytes=peak,
                peakWholeWaveLogicalBytes=budget.peak_bytes,jobCommitBytes=rss_mib*MIB,
                workerRssBytes=rss_mib*MIB,wallSeconds=wall_seconds,pollSeconds=.02,
                processPolicy='suspended launch; assigned single-process Windows job before resume; descendants refused',
                diskPolicy='sampled whole-wave logical bytes, not hard filesystem quota')

def worker_action(mode, root, output, record=None):
    root=_safe(root); output=_safe(output); budget=Budget(root)
    if not output.is_relative_to(root) or output==root: raise ValueError('invalid worker output')
    if mode=='synthetic':
        if not output.exists(): output.mkdir()
        _write(output/'synthetic-candidates.json',dict(synthetic=True,candidates=[]),budget)
    elif mode=='build':
        document,pin=_manifest(_read(root/'manifest.json'))
        identity=_read(root/'identity.json')
        if identity.get('manifestDigest')!=pin or identity.get('root')!=str(root): raise ValueError('worker manifest/root identity mismatch')
        acquisition=_read(_safe(record))
        source=next((s for s in document['sources'] if s['id']==acquisition.get('id')),None)
        if source is None: raise ValueError('worker source outside manifest')
        for key,value in source.items():
            if acquisition.get(key)!=value: raise ValueError('worker source pin mismatch')
        raw=_safe(Path(acquisition['path']))
        if not raw.is_relative_to(root/source['id']) or not raw.is_file(): raise ValueError('worker raw outside source folder')
        if not isinstance(acquisition.get('sha256'),str) or len(acquisition['sha256'])!=64: raise ValueError('worker missing acquired digest')
        if acquisition.get('bytes')!=source['declaredBytes']: raise ValueError('worker acquired length mismatch')
        from spot_build import build_source
        build_source(raw,output,acquisition,budget_check=budget.check)
    else: raise ValueError('invalid internal action')




def supervised_build(source_path, output_dir, source, *, budget_check):
    """Run generic offline build from a pinned acquisition record under a Job."""
    budget=budget_check.__self__
    if not isinstance(budget,Budget): raise ValueError('runner Budget callback required')
    source_path=_safe(source_path); output_dir=_safe(output_dir)
    if not source_path.is_relative_to(budget.root/source['id']): raise ValueError('source outside pinned folder')
    record=source_path.parent/'worker-acquisition.json'
    _write(record,dict(source,path=str(source_path)),budget)
    # Build module exclusively creates this output directory. Worker cwd remains
    # the source folder so no precreated build directory bypasses exclusivity.
    result=supervise_worker(['--internal-worker','build','--root',str(budget.root),
                            '--output',str(output_dir),'--record',str(record)],source_path.parent,budget)
    if result['status']!='complete': raise RuntimeError('offline build worker failed: '+str(result))
    return result
supervised_build.supervised=True



if __name__=='__main__': main()
