"""Finite retrieval of a previously successful job; never submit or poll.

Separate authority/output preserves the expired original allowance/checkpoint.
Signed URLs exist only in worker memory. Default CLI is offline.
"""
import argparse
import hashlib
import json
import os
from pathlib import Path
import re
import subprocess
import sys
import sysconfig
import time

sys.path.insert(0, str(Path(__file__).resolve().parent))
import sample_executor as core
import sample_live
import timeseries_sample as sample
from timeseries_diagnostics import write_receipt

HOST = 'object-store.os-api.cci2.ecmwf.int'
HOSTS = frozenset({HOST})
EXPECTED_BYTES = 15028


class RetrievalAdapter(sample_live.Adapter):
    asset_hosts = HOSTS

    def submit(self, *args, **kwargs):
        raise ValueError('Retrieval grants no submissions')

    def status(self, *args, **kwargs):
        raise ValueError('Retrieval grants no polling')

    def asset(self, *args, **kwargs):
        url = super().asset(*args, **kwargs)
        if self.asset_size != EXPECTED_BYTES:
            raise ValueError('Existing result size changed')
        return url


def source_identity(source, original_allowance):
    """Validate retained successful identity without renewing original authority."""
    source = Path(source).absolute()
    expected = sample.allowance_template(source)
    if sample.canonical(sample.read_json(original_allowance)) != sample.canonical(expected):
        raise ValueError('Original allowance binding changed')
    if sample.canonical(sample.read_json(str(original_allowance) + '.consumed.json')) != sample.canonical(dict(expected, phase='execution-uncertain')):
        raise ValueError('Original consumption receipt mismatch')
    snapshots = {}
    for name in ('checkpoint.json', 'job-identity.json'):
        with core.owned(source, name).open('rb') as stream:
            body = stream.read(65537)
        if len(body) > 65536: raise ValueError('Original control size exceeded')
        def unique(pairs):
            result = {}
            for key, value in pairs:
                if key in result: raise ValueError('Duplicate original control field')
                result[key] = value
            return result
        snapshots[name] = (json.loads(body, object_pairs_hook=unique), hashlib.sha256(body).hexdigest())
    state = snapshots['checkpoint.json'][0]
    job = snapshots['job-identity.json'][0]
    if (state.get('identity') != sample.contract.identity() or state.get('phase') != 'successful'
        or state.get('submissions') != 1 or not re.fullmatch(r'[A-Za-z0-9-]{1,128}', state.get('jobId', ''))
        or job != dict(identity=sample.contract.identity(), jobId=state['jobId'])):
        raise ValueError('Known successful job required')
    fingerprints = {name: item[1] for name, item in snapshots.items()}
    return state['jobId'], fingerprints


def allowance_template(source, original_allowance, output):
    _, fingerprints = source_identity(source, original_allowance)
    return dict(schemaVersion=1, purpose='existing-era5-result-retrieval-only',
                allowExecution=True, planSha256=sample.contract.identity(),
                sourceRoot=sample_live.canonical_output(source), sourceSha256=fingerprints,
                originalAllowance=str(Path(original_allowance).absolute()),
                outputRoot=sample_live.canonical_output(output), assetHost=HOST,
                expectedBytes=EXPECTED_BYTES, maxSubmissions=0, maxPolls=0,
                maxMetadataGets=1, maxAssetGets=1, automaticRetries=0,
                redirects=False, maxRawBytes=core.RAW_LIMIT,
                maxScratchBytes=core.TREE_LIMIT, maxWallSeconds=core.SECONDS,
                maxProcesses=1, maxJobMemoryBytes=sample.MEMORY_BYTES)


def preflight(allowance):
    authority = sample.read_json(allowance)
    expected = allowance_template(authority['sourceRoot'], authority['originalAllowance'], authority['outputRoot'])
    if sample.canonical(authority) != sample.canonical(expected):
        raise ValueError('Retrieval allowance mismatch')
    root = Path(authority['outputRoot'])
    if root.exists() or Path(str(allowance) + '.consumed.json').exists():
        raise ValueError('Retrieval authority already used or output exists')
    return authority


def retrieve(root, job, adapter, deadline, *, clock=time.time):
    root = Path(root)
    def remaining():
        core.budget(root)
        left = deadline - clock()
        if left <= 0: raise ValueError('Retrieval deadline exceeded')
        return min(30, left)
    url = core.asset_url(adapter.asset(job, timeout=remaining()), HOSTS)
    # Durable uncertainty precedes the only asset GET; there is no resume path.
    write_receipt(root / 'asset-get-consumed.json', dict(phase='download-uncertain', maxAssetGets=1), exclusive=True)
    response = adapter.open_asset(url, timeout=remaining(), authenticated=False, redirects=False)
    digest = hashlib.sha256()
    size = 0
    try:
        if response.status != 200: raise ValueError('Asset HTTP status rejected')
        length = response.headers.get('Content-Length')
        if length is not None and (not str(length).isdecimal() or int(length) != EXPECTED_BYTES):
            raise ValueError('Asset length rejected')
        encoding = response.headers.get('Content-Encoding')
        if encoding not in (None, 'identity'): raise ValueError('Encoded asset rejected')
        with core.owned(root, 'sample.raw').open('xb') as stream:
            for block in response.blocks():
                remaining()
                if not isinstance(block, bytes) or len(block) > 65536 or size + len(block) > min(core.RAW_LIMIT, EXPECTED_BYTES):
                    raise ValueError('Raw body bound exceeded')
                stream.write(block); digest.update(block); size += len(block)
            stream.flush(); os.fsync(stream.fileno())
        remaining()
        if size != EXPECTED_BYTES: raise ValueError('Incomplete existing result')
        result = dict(phase='downloaded-unvalidated', newSubmissions=0, metadataGets=1,
                      assetGets=1, assetHost=HOST, rawBytes=size, rawSha256=digest.hexdigest())
        write_receipt(root / 'retrieval-result.json', result, exclusive=True)
        return result
    finally:
        response.close()


def worker(allowance):
    sample.require_containment()
    deadline = sample.require_handoff()
    authority = sample.read_json(allowance)
    expected = allowance_template(authority['sourceRoot'], authority['originalAllowance'], authority['outputRoot'])
    if sample.canonical(authority) != sample.canonical(expected): raise ValueError('Changed authority')
    claim = sample.read_json(str(allowance) + '.consumed.json')
    if claim.get('authoritySha256') != hashlib.sha256(sample.canonical(authority).encode()).hexdigest():
        raise ValueError('Claim mismatch')
    deadline = min(deadline, claim['deadline'])
    if deadline <= time.time(): raise ValueError('Retrieval deadline exceeded')
    root = Path(authority['outputRoot'])
    root.mkdir()
    for key in ('TEMP', 'TMP', 'TMPDIR'): os.environ[key] = str(root)
    token = os.environ.get('CDSAPI_KEY')
    if not token or any(c in token for c in '\r\n'): raise ValueError('Credential missing')
    # Reuse the reviewed no-redirect session factory, replacing only the adapter.
    seed = sample.make_adapter(token)
    adapter = RetrievalAdapter.__new__(RetrievalAdapter)
    adapter.api, adapter.download, adapter.diagnostic = seed.api, seed.download, None
    try:
        job, _ = source_identity(authority['sourceRoot'], authority['originalAllowance'])
        retrieve(root, job, adapter, deadline)
    finally:
        adapter.close()


def supervise(allowance, config):
    authority = preflight(allowance)
    job = sample.job_class()(sample.MEMORY_BYTES, 1)
    started = time.monotonic()
    wall = time.time() + core.SECONDS
    deadline = started + core.SECONDS
    child = None
    try:
        write_receipt(str(allowance) + '.consumed.json', dict(
            authoritySha256=hashlib.sha256(sample.canonical(authority).encode()).hexdigest(),
            started=time.time(), deadline=wall, phase='retrieval-uncertain'), exclusive=True)
        config = Path(config).absolute()
        core.owned(config.parent, config.name)
        if config.stat().st_size > 4096: raise ValueError('Private configuration rejected')
        keys = [line.split(':', 1)[1].strip() for line in config.read_text(encoding='utf-8-sig').splitlines()
                if line.strip().startswith('key:')]
        if len(keys) != 1 or not keys[0] or any(c in keys[0] for c in '\r\n'):
            raise ValueError('Private configuration rejected')
        environment = dict(os.environ, CDSAPI_KEY=keys[0], PYTHONDONTWRITEBYTECODE='1')
        child = subprocess.Popen([sys._base_executable, '-I', '-S', '-B', str(Path(__file__).resolve()),
                    '--worker', '--allowance', str(Path(allowance).absolute())],
                    stdin=subprocess.PIPE, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL,
                    env=environment, creationflags=4)
        del environment, keys
        job.assign_resume(child)
        child.stdin.write(json.dumps(dict(parentPid=os.getpid(), planSha256=sample.contract.identity(),
            deadlineMonotonic=deadline, deadlineWall=wall, sitePackages=sysconfig.get_path('purelib'))).encode())
        child.stdin.close()
        while child.poll() is None:
            if time.monotonic() >= deadline: raise ValueError('Retrieval deadline exceeded')
            root = Path(authority['outputRoot'])
            if root.exists(): core.budget(root)
            time.sleep(.02)
        if child.returncode or time.monotonic() >= deadline: raise ValueError('Retrieval stopped')
        core.budget(authority['outputRoot'])
    finally:
        try:
            job.stop()
            if child is not None:
                if child.poll() is None: child.kill()
                child.wait(timeout=3)
            job.drain(timeout=3)
        finally:
            job.close()
            write_receipt(str(allowance) + '.supervisor.json', dict(
                elapsedMilliseconds=int((time.monotonic() - started) * 1000),
                childReturnCode=None if child is None else child.returncode), exclusive=True)


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--worker', action='store_true', help=argparse.SUPPRESS)
    parser.add_argument('--execute', action='store_true')
    parser.add_argument('--allowance', required=True)
    parser.add_argument('--private-config')
    args = parser.parse_args()
    if args.worker: worker(args.allowance)
    elif args.execute:
        if not args.private_config: raise ValueError('Explicit private config path required')
        supervise(args.allowance, args.private_config)
    else:
        preflight(args.allowance)
        print('Existing-result offline preflight passed')


if __name__ == '__main__':
    try: main()
    except Exception:
        print('Existing-result retrieval stopped; preserve receipts and original checkpoint.', file=sys.stderr)
        sys.exit(1)
