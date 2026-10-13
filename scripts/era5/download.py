"""One explicitly selected reviewed ERA5 chunk, with no automatic retry.

CLI fetch provides the hard whole-worker deadline. Credentials stay in the
operator's external .cdsapirc. Library entry points are fixture seams only.
"""
import argparse
import json
import os
from pathlib import Path
import re
import sys
import time
from urllib.parse import urlsplit
import pilot

MAX_RAW_BYTES = 32 * 1024 * 1024
BODY_BYTES = 1024 * 1024


def https_url(url):
    parts = urlsplit(url)
    if parts.scheme != 'https' or not parts.hostname or parts.username or parts.password or parts.fragment:
        raise ValueError('Invalid HTTPS source; review required.')
    return url


def remaining(started):
    value = pilot.BATCH_SECONDS - (time.monotonic() - started)
    if value <= 0: raise ValueError('Whole retrieval deadline exceeded; review required.')
    return value


def bounded_response(response, ceiling, started):
    try:
        if not 200 <= response.status_code < 300: raise ValueError('Upstream response rejected; review required.')
        length = response.headers.get('Content-Length')
        if length is not None and (not length.isdecimal() or int(length) > ceiling):
            raise ValueError('Upstream response size rejected; review required.')
        data = bytearray()
        for block in response.iter_content(chunk_size=65536):
            remaining(started)
            if len(data) + len(block) > ceiling: raise ValueError('Upstream response body exceeds bound; review required.')
            data.extend(block)
        remaining(started)
        return bytes(data)
    finally: response.close()


class CDSAdapter:
    """Modern token CDS client, with bounded metadata and separate asset session.

    cdsapi 0.7.7 dispatches a modern token to ECMWF LegacyClient. Its default
    retries/downloads are unsuitable here; restrict retries and replace the
    metadata Session with a bounded implementation. Asset requests carry no key.
    """
    def __init__(self, started):
        import requests
        import cdsapi
        from cdsapi.api import get_url_key_verify
        url, key, _ = get_url_key_verify(None, None, True)
        if url.rstrip('/') != 'https://cds.climate.copernicus.eu/api' or ':' in key:
            raise ValueError('Modern CDS configuration required; review required.')
        class MetadataSession(requests.Session):
            def request(self, method, url, **kwargs):
                https_url(url)
                if urlsplit(url).hostname != 'cds.climate.copernicus.eu':
                    raise ValueError('Unexpected metadata host; review required.')
                kwargs.update(stream=True, allow_redirects=False, verify=True,
                              timeout=min(30, remaining(started)))
                response = super().request(method, url, **kwargs)
                body = bounded_response(response, BODY_BYTES, started)
                response._content = body
                response._content_consumed = True
                return response
        self.started = started
        self.session = MetadataSession()
        self.asset_session = requests.Session()
        silent = lambda *args, **kwargs: None
        self.client = cdsapi.Client(url=url, key=key, verify=True, quiet=True,
            progress=False, debug=False, retry_max=1, timeout=30, delete=False,
            wait_until_complete=False, session=self.session,
            info_callback=silent, warning_callback=silent, error_callback=silent,
            debug_callback=silent)
    def submit(self, dataset, request): return self.client.retrieve(dataset, request)
    def resume(self, request_id):
        return self.client.client.get_remote(request_id)
    def open_download(self, url, started):
        https_url(url)
        return self.asset_session.get(url, stream=True, allow_redirects=False,
            verify=True, timeout=min(30, remaining(started)))


def remote_state(root, plan, *, allow_unresolved=False):
    path = pilot.owned(root, 'remote-ledger.json')
    value = pilot.read_json(path) if path.exists() else {
        'schemaVersion':1, 'manifestSha256':pilot.plan_digest(plan), 'entries':[]}
    if set(value) != {'schemaVersion','manifestSha256','entries'} or value['schemaVersion'] != 1 or value['manifestSha256'] != pilot.plan_digest(plan) or not isinstance(value['entries'],list):
        raise ValueError('Invalid retrieval ledger; review required.')
    seen = set()
    ids = {row['chunkId'] for row in plan['chunks']}
    for row in value['entries']:
        if not isinstance(row,dict) or row.get('chunkId') not in ids or row['chunkId'] in seen or row.get('state') not in {'submitting','queued','downloading','importing','uncertain','complete'}:
            raise ValueError('Invalid retrieval entry; review required.')
        seen.add(row['chunkId'])
        if row['state'] != 'complete' and not allow_unresolved: raise ValueError('Outstanding remote request needs explicit review before another fetch.')
    return path, value


def _run_one(root, chunk_id, adapter=None, *, importer=None, resume=False, approved_plan=None):
    root = Path(root).resolve()
    started = time.monotonic()
    with pilot.writer_lock(root):
        plan, ledger = pilot.load_state(root, approved_plan)
        chunk = next((row for row in plan['chunks'] if row['chunkId'] == chunk_id), None)
        if chunk is None: raise ValueError('Chunk outside reviewed manifest; review required.')
        completed = next((row for row in ledger['entries'] if row['chunkId'] == chunk_id),None)
        if completed:
            pilot.verify_entry(root,completed)
            return completed
        path, remote = remote_state(root,plan,allow_unresolved=resume)
        entry=next((row for row in remote['entries'] if row['chunkId']==chunk_id),None)
        if resume:
            unresolved=[row for row in remote['entries'] if row['state']!='complete']
            if entry is None or len(unresolved)!=1 or entry['state'] not in {'queued','uncertain'}:
                raise ValueError('No sole queued known job to resume; review required.')
            request_id=entry.get('requestId')
            if not isinstance(request_id,str) or not re.fullmatch(r'[A-Za-z0-9-]{1,128}',request_id):
                raise ValueError('Remote identity unknown; review required.')
            if entry.get('failurePhase') in {'downloading','importing'} or entry.get('stagedRawSha256'):
                raise ValueError('Post-download state needs explicit reconciliation/review.')
            for relative in [f'raw/{chunk_id}.nc',f'decoded/{chunk_id}.jsonl']:
                if pilot.owned(root,relative).exists():
                    raise ValueError('Untracked source/checkpoint needs explicit review.')
        elif entry is not None:
            raise ValueError('Remote/local checkpoint disagreement; review required.')
        raw_limit=pilot.RAW_LIMIT if approved_plan is None else plan['limits']['retainedRawBytes']
        inventory = pilot.check_inventory(root,raw_limit)
        # Reserve raw staging plus retained copy and bounded decoded/metadata overhead.
        if inventory['retainedRawBytes'] + MAX_RAW_BYTES > raw_limit or inventory['scratchBytes'] + 2*MAX_RAW_BYTES + 8*1024*1024 > pilot.SCRATCH_LIMIT:
            raise ValueError('Insufficient retrieval budget; review required.')
        staging = pilot.owned(root, f'{chunk_id}.download')
        if staging.exists(): raise ValueError('Interrupted staging file needs explicit review.')
        # Configuration/constructor can make bounded catalogue GETs, but no submission.
        if adapter is None:
            try: adapter = CDSAdapter(started)
            except Exception: raise ValueError('Private CDS configuration/client unavailable; review required.') from None
        if not resume:
            entry = {'chunkId':chunk_id, 'state':'submitting'}
            remote['entries'].append(entry)
            pilot.atomic_json(path,remote)  # Durable intent BEFORE the non-idempotent POST.
        def save(state):
            entry['state']=state
            pilot.atomic_json(path,remote)
        try:
            remaining(started)
            submit_start=time.monotonic()
            if resume:
                job=adapter.resume(entry['requestId'])
                if job.request_id!=entry['requestId']:
                    raise ValueError('Recovered job identity differs; review required.')
                entry['resumeSeconds']=time.monotonic()-submit_start
            else:
                job=adapter.submit(plan['dataset'],chunk['request'])
                entry['submitSeconds']=time.monotonic()-submit_start
            request_id=job.request_id
            if not isinstance(request_id,str) or not re.fullmatch(r'[A-Za-z0-9-]{1,128}',request_id):
                raise ValueError('Invalid remote request identifier; review required.')
            entry['requestId']=request_id
            save('queued')
            queue_start=time.monotonic()
            while True:
                remaining(started)
                state=job.status
                remaining(started)
                if state == 'successful': break
                if state not in {'accepted','running'}: raise ValueError('Remote status needs explicit review.')
                time.sleep(min(2,remaining(started)))
            entry['queueSeconds']=entry.get('queueSeconds',0)+time.monotonic()-queue_start
            result=job.get_results()
            url=https_url(result.location)
            size=result.content_length
            if type(size) is not int or not 0 < size <= MAX_RAW_BYTES:
                raise ValueError('Raw source size rejected; review required.')
            save('downloading')
            download_start=time.monotonic()
            response=adapter.open_download(url,started)
            try:
                if response.status_code != 200: raise ValueError('Asset response rejected; review required.')
                declared=response.headers.get('Content-Length')
                if declared is not None and (not declared.isdecimal() or int(declared)!=size):
                    raise ValueError('Asset size differs; review required.')
                count=0
                with staging.open('xb') as output:
                    for block in response.iter_content(chunk_size=65536):
                        remaining(started)
                        count+=len(block)
                        if count > size or count > MAX_RAW_BYTES: raise ValueError('Raw stream exceeds bound; review required.')
                        output.write(block)
                    output.flush(); os.fsync(output.fileno())
                remaining(started)
                if count!=size: raise ValueError('Incomplete source body; review required.')
            finally: response.close()
            entry['downloadSeconds']=time.monotonic()-download_start
            entry['stagedRawSha256']=pilot.digest(staging)
            remaining(started)
            save('importing')
            importer=importer or (lambda *args, **kwargs: pilot._checkpoint_existing_locked(*args, **kwargs, approved_plan=approved_plan))
            result=importer(root,chunk_id,staging,deadline_started=started)
            remaining(started)
            result=dict(result, retrievalMode='cds-api',submitSeconds=entry.get('submitSeconds'),
                queueSeconds=entry['queueSeconds'],downloadSeconds=entry['downloadSeconds'])
            # Publish retrieval timing into completed local ledger, if real importer.
            _, updated=pilot.load_state(root, approved_plan)
            for row in updated['entries']:
                if row['chunkId']==chunk_id: row.update(result)
            pilot.atomic_json(pilot.owned(root,'ledger.json'),updated)
            save('complete')
            staging.unlink()
            return result
        except Exception:
            entry['failurePhase']=entry['state']
            save('uncertain')
            staging.unlink(missing_ok=True)
            raise ValueError('Retrieval stopped; remote request/checkpoints need explicit review before resuming.') from None


def fetch_one(root, chunk_id, adapter=None, *, importer=None):
    return _run_one(root,chunk_id,adapter,importer=importer)


def resume_known(root, chunk_id, adapter=None, *, importer=None):
    """Recover only the persisted known job; never make another submission."""
    return _run_one(root,chunk_id,adapter,importer=importer,resume=True)


def reconcile_local(root, chunk_id, *, approved_plan=None):
    """Resolve only a proven post-download local publication, without network."""
    root=Path(root).resolve()
    with pilot.writer_lock(root):
        plan,ledger=pilot.load_state(root,approved_plan)
        path,remote=remote_state(root,plan,allow_unresolved=True)
        entry=next((row for row in remote['entries'] if row['chunkId']==chunk_id),None)
        local=next((row for row in ledger['entries'] if row['chunkId']==chunk_id),None)
        if entry is None or local is None or entry['state'] not in {'importing','uncertain'}:
            raise ValueError('No matching post-download checkpoint to reconcile; review required.')
        request_id=entry.get('requestId')
        checksum=entry.get('stagedRawSha256')
        if not isinstance(request_id,str) or not re.fullmatch(r'[A-Za-z0-9-]{1,128}',request_id) or checksum!=local['rawSha256']:
            raise ValueError('Remote request/source identity cannot be proven; review required.')
        pilot.verify_entry(root,local)
        entry['state']='complete'
        entry['reconciledLocal']=True
        pilot.atomic_json(path,remote)
        return entry


def main():
    parser=argparse.ArgumentParser(description=__doc__)
    parser.add_argument('action',choices=['fetch','fetch-worker','resume-known','resume-worker','reconcile-local'])
    parser.add_argument('--root',type=Path,default=Path('.data/era5/pilot-2025'))
    parser.add_argument('--chunk',required=True)
    args=parser.parse_args()
    try:
        if args.action=='reconcile-local':
            result=reconcile_local(args.root,args.chunk)
        elif args.action in {'fetch','resume-known'}:
            result=pilot.run_deadline_process([sys.executable,str(Path(__file__).resolve()),'resume-worker' if args.action=='resume-known' else 'fetch-worker',
                '--root',str(args.root.resolve()),'--chunk',args.chunk],output_directory=args.root)
        elif args.action=='resume-worker': result=resume_known(args.root,args.chunk)
        else: result=fetch_one(args.root,args.chunk)
        print(json.dumps(result,allow_nan=False))
    except Exception:
        print('Retrieval stopped; review local lock, remote ledger and checkpoints before resuming.',file=sys.stderr)
        return 1
    return 0
if __name__=='__main__': sys.exit(main())
