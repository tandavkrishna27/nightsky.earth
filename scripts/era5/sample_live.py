"""Deferred fixed CDS sample adapter. Default invocation is entirely offline.

No SDK Client is imported or constructed. Wire shapes are pinned to the retained
ecmwf.datastores processing.py Process.submit, Job.get_remote and Results.asset.
"""
import argparse
import json
import os
from pathlib import Path
import re
import subprocess
import sys
import time
from urllib.parse import urljoin

import sample_executor as core

BASE = 'https://cds.climate.copernicus.eu/api/retrieve/v1'
# No retained evidence establishes cache host names. Any such response stops
# before fetch; widening this immutable set requires a reviewed source change.
ASSET_HOSTS = frozenset({'cds.climate.copernicus.eu'})


class Adapter:
    asset_hosts = ASSET_HOSTS

    def __init__(self, token, session_factory, diagnostic=None):
        self.diagnostic = diagnostic
        self.api = session_factory()
        self.download = session_factory()
        for session in (self.api, self.download):
            session.trust_env = False
            session.auth = None
            session.headers.clear()
            session.cookies.clear()
        self.api.headers['PRIVATE-TOKEN'] = token

    def close(self):
        self.api.close()
        self.download.close()

    def _json(self, method, path, timeout, **kwargs):
        response = None
        count = 0
        failure = 'transport'
        def emit(stage):
            if self.diagnostic is not None:
                try:
                    self.diagnostic(stage, status=None if response is None else response.status_code,
                                    metadata_bytes=count, failure=failure if stage == 'failed' else 'none')
                except Exception: pass
        deadline = time.monotonic() + timeout
        try:
            emit('request')
            response = self.api.request(method, BASE + path, timeout=(min(5, timeout), timeout),
                                        allow_redirects=False, stream=True, **kwargs)
            emit('response')
            if response.status_code not in (200, 201, 202):
                failure = 'http-status'
                raise ValueError('CDS response rejected')
            body = bytearray()
            for block in response.iter_content(65536):
                if time.monotonic() >= deadline or len(body) + len(block) > 1024 * 1024:
                    failure = 'metadata-cap'
                    raise ValueError('CDS metadata cap exceeded')
                body.extend(block)
                count = len(body)
            failure = 'json'
            value = json.loads(body)
            if not isinstance(value, dict):
                failure = 'shape'
                raise ValueError('CDS metadata rejected')
            emit('metadata')
            return value
        except Exception:
            emit('failed')
            # Never propagate requests exception text (may contain token/URL).
            raise ValueError('CDS operation failed; reconcile checkpoint') from None
        finally:
            if response is not None:
                response.close()

    def submit(self, dataset, request, timeout):
        reply = self._json('POST', '/processes/' + dataset + '/execution', timeout,
                           json={'inputs': request})
        monitors = [link['href'] for link in reply.get('links', []) if link.get('rel') == 'monitor']
        if len(monitors) != 1:
            raise ValueError('Missing unique monitor identity; reconcile submission')
        prefix = BASE + '/jobs/'
        monitor = monitors[0]
        if not isinstance(monitor, str) or not monitor.startswith(prefix):
            raise ValueError('Unexpected monitor origin; reconcile submission')
        job = monitor[len(prefix):]
        if not re.fullmatch(r'[A-Za-z0-9-]{1,128}', job):
            raise ValueError('Unexpected monitor identity; reconcile submission')
        return job

    def status(self, job, timeout):
        status = self._json('GET', '/jobs/' + job, timeout).get('status')
        return {'accepted': 'queued', 'rejected': 'failed', 'dismissed': 'failed',
                'deleted': 'failed'}.get(status, status)

    def asset(self, job, timeout):
        result_url = BASE + '/jobs/' + job + '/results'
        value = self._json('GET', '/jobs/' + job + '/results', timeout)['asset']['value']
        size = value['file:size']
        if type(size) is not int or not 0 < size <= core.RAW_LIMIT:
            raise ValueError('Result size rejected')
        self.asset_size = size
        return core.asset_url(urljoin(result_url, value['href']), ASSET_HOSTS)

    def open_asset(self, url, timeout, authenticated=False, redirects=False):
        if authenticated or redirects:
            raise ValueError('Asset policy rejected')
        core.asset_url(url, ASSET_HOSTS)
        try:
            response = self.download.get(url, timeout=(min(5, timeout), timeout),
                                         stream=True, allow_redirects=False)
        except Exception:
            raise ValueError('Asset transport failed') from None
        expected = self.asset_size
        deadline = time.monotonic() + timeout

        class Body:
            status = response.status_code
            headers = response.headers

            def blocks(self):
                total = 0
                try:
                    for block in response.iter_content(65536):
                        total += len(block)
                        if time.monotonic() >= deadline or total > expected:
                            raise ValueError('Asset size exceeded')
                        yield block
                    if total != expected:
                        raise ValueError('Asset size mismatch')
                except Exception:
                    raise ValueError('Asset stream failed; raw remains unaccepted') from None

            def close(self):
                response.close()

        return Body()


def canonical_output(output):
    root = Path(output).absolute()
    core.owned(root, 'checkpoint.json')
    return str(root.resolve())


def authorize(path, output):
    """Owner-created allowance is read before credentials or HTTP imports."""
    allowance = json.loads(Path(path).read_text(encoding='utf-8'))
    expected = {'planSha256': core.identity(), 'allowExecution': True,
                'maxSubmissions': 1, 'maxRawBytes': core.RAW_LIMIT,
                'outputRoot': canonical_output(output)}
    if allowance != expected:
        raise ValueError('Owner allowance must exactly bind fixed plan and limits')
    return expected


def consume_allowance(path, output, resume=False):
    """One exclusive durable claim per allowance; uncertainty burns the claim."""
    expected = authorize(path, output)
    allowance = Path(path).absolute()
    core.owned(allowance.parent, allowance.name)
    receipt = core.owned(allowance.parent, allowance.name + '.consumed.json')
    expected_receipt = dict(expected, phase='execution-uncertain')
    if resume:
        if json.loads(receipt.read_text(encoding='utf-8')) != expected_receipt:
            raise ValueError('Allowance consumption receipt mismatch')
        state = json.loads(core.owned(output, 'checkpoint.json').read_text())
        if state.get('identity') != core.identity() or state.get('phase') not in {'queued','running','successful'}:
            raise ValueError('Consumed uncertain allowance cannot start or resubmit')
        return
    with receipt.open('x', encoding='utf-8') as stream:
        json.dump(expected_receipt, stream, sort_keys=True)
        stream.flush()
        os.fsync(stream.fileno())


def decode(root, state):
    """Decode actual downloaded raw in suspended Windows Job, with strict caps."""
    if os.name != 'nt':
        raise ValueError('Windows Job containment required; raw remains unaccepted')
    sys.path.insert(0, str(Path(__file__).resolve().parents[1] / 'osm'))
    from global_source_supervisor import WindowsJob
    root = Path(root)
    output = core.owned(root, 'validation.json')
    environment = dict(os.environ, OPENBLAS_NUM_THREADS='1', OMP_NUM_THREADS='1',
                       MKL_NUM_THREADS='1', NUMEXPR_NUM_THREADS='1', PYTHONDONTWRITEBYTECODE='1')
    environment['PYTHONPATH'] = os.environ.get('PYTHONPATH', str(Path(sys.prefix) / 'Lib' / 'site-packages'))
    environment.pop('CDSAPI_KEY', None)
    job = WindowsJob(256 * 1024**2, 1)
    child = None
    deadline = min(state['deadline'], time.time() + 60)
    try:
        with output.open('x', encoding='utf-8') as stream:
            child = subprocess.Popen([sys._base_executable, str(Path(__file__).resolve()),
                                      '--decode-worker', str(root / 'sample.raw'),
                                      state['rawSha256']], stdout=stream,
                                     stderr=subprocess.DEVNULL, env=environment, creationflags=4)
            job.assign_resume(child)
            while child.poll() is None:
                if time.time() >= deadline or output.stat().st_size > 4096:
                    raise ValueError('Decoder bound exceeded; raw remains unaccepted')
                core.budget(root)
                time.sleep(.02)
        if child.returncode or output.stat().st_size > 4096:
            raise ValueError('Decoder rejected raw; preserve unaccepted')
        result = json.loads(output.read_text())
        if result != dict(accepted=True,hours=24,cells=4,scalarCellHours=96,
                          member=0,expver='0001',sourceSha256=state['rawSha256']):
            raise ValueError('Decoder receipt rejected')
        state.update(phase='validated-sample-only', validation=result)
        core.save(root, state)
        return state
    finally:
        try:
            job.stop()
            if child is not None:
                if child.poll() is None:
                    child.kill()
                child.wait(timeout=3)
            job.drain(timeout=3)
        finally:
            job.close()


def main(argv=None):
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--plan', action='store_true')
    parser.add_argument('--execute', action='store_true')
    parser.add_argument('--owner-allowance')
    parser.add_argument('--output')
    parser.add_argument('--resume', action='store_true')
    args = parser.parse_args(argv)
    if not args.execute:
        print(json.dumps(dict(plan=core.plan(), planSha256=core.identity(),
                              assetHosts=sorted(ASSET_HOSTS)), indent=2))
        return
    if args.plan or not args.owner_allowance or not args.output:
        raise ValueError('Execution requires owner allowance and fresh output path')
    authorize(args.owner_allowance, args.output)
    supervise(args)


def supervise(args):
    """Hard wall-clock and process-tree bounds include blocked HTTP reads."""
    if os.name != 'nt':
        raise ValueError('Windows Job containment required before credential access')
    sys.path.insert(0, str(Path(__file__).resolve().parents[1] / 'osm'))
    from global_source_supervisor import WindowsJob
    deadline = time.time() + core.SECONDS
    checkpoint = Path(args.output) / 'checkpoint.json'
    if args.resume and checkpoint.exists():
        deadline = min(deadline, json.loads(checkpoint.read_text())['deadline'])
    if deadline <= time.time():
        raise ValueError('Original deadline exceeded')
    environment = dict(os.environ, PYTHONDONTWRITEBYTECODE='1')
    environment['PYTHONPATH'] = os.pathsep.join([str(Path(__file__).resolve().parent),
                                               str(Path(sys.prefix) / 'Lib' / 'site-packages')])
    worker = ('import argparse,json,sample_live; '
              'sample_live.execute(argparse.Namespace(**json.loads(__import__("sys").argv[1])))')
    job = WindowsJob(512 * 1024**2, 2)
    child = None
    try:
        child = subprocess.Popen([sys._base_executable, '-c', worker, json.dumps(vars(args))],
                                 stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL,
                                 env=environment, creationflags=4)
        job.assign_resume(child)
        while child.poll() is None:
            if time.time() >= deadline:
                raise ValueError('Whole execution deadline exceeded; reconcile checkpoint')
            time.sleep(.02)
        if child.returncode:
            raise ValueError('Execution stopped; preserve and reconcile checkpoint')
    finally:
        try:
            job.stop()
            if child is not None:
                if child.poll() is None: child.kill()
                child.wait(timeout=3)
            job.drain(timeout=3)
        finally:
            job.close()


def execute(args):
    consume_allowance(args.owner_allowance, args.output, args.resume)
    # Explicit environment credential only; no account/config discovery or SDK.
    token = os.environ.get('CDSAPI_KEY')
    if not token or '\n' in token or '\r' in token:
        raise ValueError('Explicit CDSAPI_KEY required')
    import requests
    def session():
        value = requests.Session()
        value.mount('https://', requests.adapters.HTTPAdapter(max_retries=0))
        return value
    adapter = Adapter(token, session)
    try:
        state = core._run(args.output, adapter, resume=args.resume)
        decode(args.output, state)
    finally:
        adapter.close()


if __name__ == '__main__':
    try:
        if len(sys.argv) == 4 and sys.argv[1] == '--decode-worker':
            from sample_validate import validate_raw
            print(json.dumps(validate_raw(sys.argv[2], sys.argv[3])))
        else:
            main()
    except Exception:
        print('Sample stopped; preserve output and reconcile checkpoint before any further action.', file=sys.stderr)
        sys.exit(1)
