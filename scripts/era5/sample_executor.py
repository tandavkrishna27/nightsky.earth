"""Fixed legacy sample state machine. This CLI is offline plan-only.

Transport is an explicit fixture seam, never constructed from credentials here.
Unknown submit outcomes are durable and cannot be retried by this executor.
"""
import argparse
from contextlib import contextmanager
import hashlib
import json
import math
import os
from pathlib import Path
import re
import time
from urllib.parse import urlsplit

RAW_LIMIT = 2 * 1024**2
TREE_LIMIT = 128 * 1024**2
SECONDS = 1800
POLL_SECONDS = 30
MAX_POLLS = 60
DATASET = 'reanalysis-era5-single-levels'
REQUEST = dict(product_type=['reanalysis'], variable=['total_cloud_cover'], year=['1990'],
               month=['12'], day=['30'], time=[f'{h:02}:00' for h in range(24)],
               data_format='netcdf', download_format='unarchived', area=[32.25,48.75,32,49])

def plan():
    return dict(schemaVersion=1, dataset=DATASET, request=json.loads(json.dumps(REQUEST)),
                destinationId='place:v1:geonames:12', expectedHours=24, expectedCells=[
                'era5:32:48.75','era5:32:49','era5:32.25:48.75','era5:32.25:49'],
                scalarCellHours=96, rawLimitBytes=RAW_LIMIT, newOutputLimitBytes=TREE_LIMIT,
                deadlineSeconds=SECONDS, maxSubmissions=1, maxPolls=MAX_POLLS,
                pollIntervalSeconds=POLL_SECONDS, automaticRetries=0)

def identity():
    return hashlib.sha256(json.dumps(plan(),sort_keys=True,separators=(',',':')).encode()).hexdigest()

def owned(root, name):
    root = Path(root).absolute()
    for part in [root, *root.parents]:
        if part.is_symlink() or part.is_junction():
            raise ValueError('Aliased output root rejected')
    path = root / name
    if path.parent != root or path.is_symlink() or path.is_junction():
        raise ValueError('Aliased output path rejected')
    if path.exists() and (not path.is_file() or path.stat().st_nlink != 1):
        raise ValueError('Nonregular or hardlinked output rejected')
    return path

def budget(root):
    total = 0
    for entry in Path(root).iterdir():
        owned(root, entry.name)
        total += entry.stat().st_size
    if total > TREE_LIMIT:
        raise ValueError('Output budget exceeded')
    return total

def save(root, state):
    target = owned(root,'checkpoint.json'); temp = owned(root,'checkpoint.pending')
    with temp.open('x',encoding='utf-8') as stream:
        json.dump(state,stream,sort_keys=True); stream.flush(); os.fsync(stream.fileno())
    os.replace(temp,target)

def asset_url(url, hosts):
    p = urlsplit(url)
    if p.scheme != 'https' or p.hostname not in hosts or p.username or p.password or p.fragment or p.port not in (None,443):
        raise ValueError('Unapproved asset origin')
    return url

@contextmanager
def writer_lock(root):
    lock=owned(root,'writer.lock')
    stream=lock.open('x')
    try:
        yield
    finally:
        stream.close()
        lock.unlink()


def run_fixture(root, transport, *, clock=time.time, sleep=time.sleep, resume=False):
    if getattr(transport,'fixture_only',False) is not True:
        raise ValueError('Live transport is not implemented or authorized')
    return _run(root, transport, clock=clock, sleep=sleep, resume=resume)


def _run(root, transport, *, clock=time.time, sleep=time.sleep, resume=False, contract=None, deadline_cap=None):
    """Private state machine shared by fixtures and separately gated sample_live.

    submit(dataset, request, timeout) returns ONLY an opaque job ID;
    status(id, timeout) returns queued/running/successful/failed;
    asset(id, timeout) returns a URL; open_asset(url, timeout, authenticated=False,
    redirects=False) returns a response with status, headers, blocks(), close().
    The separately gated adapter supplies the reviewed CDS wire implementation.
    """
    # Contract changes identity only; resource and state protections stay fixed.
    attempt_began = time.monotonic()
    contract_identity = identity() if contract is None else contract.identity()
    contract_plan = plan() if contract is None else contract.plan()
    if deadline_cap is not None and (type(deadline_cap) not in (int,float) or
        not math.isfinite(deadline_cap) or not 0<deadline_cap-clock()<=SECONDS):
        raise ValueError('Invalid supervisor deadline cap')
    root=Path(root).absolute(); owned(root,'checkpoint.json')
    root.mkdir(exist_ok=True); budget(root)
    with writer_lock(root):
        checkpoint=owned(root,'checkpoint.json')
        if checkpoint.exists():
            state=json.loads(checkpoint.read_text())
            if state.get('identity') != contract_identity or state.get('submissions') != 1:
                raise ValueError('Checkpoint identity mismatch')
            if (type(state.get('started')) not in (int,float) or type(state.get('deadline')) not in (int,float) or not 0 < state['deadline']-state['started'] <= SECONDS or type(state.get('polls')) is not int or not 0 <= state['polls'] <= MAX_POLLS or type(state.get('nextPoll')) not in (int,float)):
                raise ValueError('Invalid checkpoint limits')
            if not resume or state.get('phase') not in {'queued','running','successful'}:
                raise ValueError('Outcome needs independent reconciliation; never resubmit')
            if not re.fullmatch(r'[A-Za-z0-9-]{1,128}',state.get('jobId','')):
                raise ValueError('Unknown remote identity')
        else:
            if resume: raise ValueError('No checkpoint to resume')
            if any(p.name != 'writer.lock' for p in root.iterdir()): raise ValueError('Fresh output required')
            now=clock()
            deadline=min(now+SECONDS, deadline_cap) if deadline_cap is not None else now+SECONDS
            if deadline<=now: raise ValueError('Supervisor deadline exceeded')
            state=dict(identity=contract_identity,submissions=1,phase='submission-uncertain',
                       started=now,deadline=deadline,polls=0,nextPoll=now)
            save(root,state)  # durable uncertainty BEFORE submit
            left=state['deadline']-clock()
            if left<=0: raise ValueError('Supervisor deadline exceeded')
            job=transport.submit(contract_plan['dataset'],json.loads(json.dumps(contract_plan['request'])),timeout=min(30,left))
            if not isinstance(job,str) or not re.fullmatch(r'[A-Za-z0-9-]{1,128}',job):
                raise ValueError('Invalid remote identity')
            with owned(root,'job-identity.json').open('x',encoding='utf-8') as receipt:
                json.dump(dict(identity=contract_identity,jobId=job),receipt); receipt.flush(); os.fsync(receipt.fileno())
            state.update(jobId=job,phase='queued'); save(root,state)
        receipt=json.loads(owned(root,'job-identity.json').read_text())
        if receipt != dict(identity=contract_identity,jobId=state['jobId']):
            raise ValueError('Immutable job identity mismatch')
        if deadline_cap is not None and deadline_cap<state['deadline']:
            if deadline_cap<=clock(): raise ValueError('Supervisor deadline exceeded')
            state['deadline']=deadline_cap
            save(root,state)
        def remaining():
            budget(root)
            left=state['deadline']-clock()
            if left<=0: raise ValueError('Original deadline exceeded')
            return min(30,left)
        while state['phase'] != 'successful':
            remaining()
            if state['polls'] >= MAX_POLLS: raise ValueError('Poll allowance exhausted')
            delay=max(0,state['nextPoll']-clock())
            if delay: sleep(min(delay,remaining()))
            if clock()<state['nextPoll']: continue
            remaining(); state['polls']+=1; state['nextPoll']=clock()+POLL_SECONDS
            save(root,state)
            status=transport.status(state['jobId'],timeout=remaining())
            if status not in {'queued','running','successful','failed'}: raise ValueError('Unsupported remote status')
            if status=='failed': state['phase']='remote-failed'; save(root,state); raise ValueError('Remote failed')
            state['phase']=status; save(root,state)
            if status=='successful': break
        state['timings'] = dict(scope='current-attempt',
                                submitToReadySeconds=round(time.monotonic()-attempt_began, 6))
        save(root,state)
        transfer_began = time.monotonic()
        url=asset_url(transport.asset(state['jobId'],timeout=remaining()),transport.asset_hosts)
        state['phase']='download-uncertain'; save(root,state)
        response=transport.open_asset(url,timeout=remaining(),authenticated=False,redirects=False)
        path=owned(root,'sample.raw'); digest=hashlib.sha256(); size=0
        try:
            if response.status != 200: raise ValueError('Asset response rejected')
            length=response.headers.get('Content-Length')
            if length is not None and (not str(length).isdecimal() or int(length)>RAW_LIMIT): raise ValueError('Asset length rejected')
            with path.open('xb') as stream:
                for block in response.blocks():
                    remaining()
                    if not isinstance(block,bytes) or len(block)>65536 or size+len(block)>RAW_LIMIT: raise ValueError('Asset body cap exceeded')
                    stream.write(block); digest.update(block); size+=len(block)
                stream.flush(); os.fsync(stream.fileno())
            remaining()
            if not size or (length is not None and int(length)!=size): raise ValueError('Incomplete asset')
            if hashlib.sha256(path.read_bytes()).hexdigest()!=digest.hexdigest(): raise ValueError('Asset mutated')
            state.update(phase='downloaded-unvalidated',rawBytes=size,rawSha256=digest.hexdigest())
            state['timings']['transferSeconds'] = round(time.monotonic()-transfer_began, 6)
            save(root,state)
            return state
        finally: response.close()
    # A killed process can leave writer.lock; reconcile manually before recovery.

if __name__=='__main__':
    parser=argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--plan',action='store_true',help='Print fixed plan (default)')
    parser.parse_args()
    print(json.dumps(dict(plan=plan(),identity=identity(),liveExecution='separate owner-gated sample_live.py entrypoint'),indent=2))
