"""Offline, pinned synthetic lineage proof in a bounded Windows process tree.

No network, provider data, credential lookup, installation or serving selection.
The worker also enforces immediate write budgets; disk/RSS here are sampled.
"""
import argparse
import hashlib
import json
import os
from pathlib import Path
import shutil
import subprocess
import sys
import threading
import time

sys.dont_write_bytecode = True
sys.path.insert(0, str(Path(__file__).resolve().parents[1] / 'osm'))
from global_source_supervisor import WindowsJob, rss_bytes
from spot_paths import safe_path

MEMORY = 2 * 1024**3
DISK = 32 * 1024**3
RESERVE = 96 * 1024**3
SECONDS = 3600
SCAN_SECONDS = 60


def digest(path):
    value = hashlib.sha256()
    with path.open('rb') as source:
        while block := source.read(1024 * 1024):
            value.update(block)
    return value.hexdigest()


def tree_bytes(root):
    """No alias traversal; temporary file rename/unlink races are harmless."""
    total = 0
    pending = [Path(root)]
    while pending:
        with os.scandir(pending.pop()) as entries:
            for entry in entries:
                try:
                    if entry.is_symlink() or Path(entry.path).is_junction():
                        raise ValueError('Aliased proof output')
                    if entry.is_dir(follow_symlinks=False):
                        pending.append(Path(entry.path))
                    else:
                        # DirEntry's cached Windows stat can omit link counts.
                        info = Path(entry.path).stat(follow_symlinks=False)
                        if info.st_nlink != 1:
                            raise ValueError('Hardlinked proof output')
                        total += info.st_size
                except FileNotFoundError:
                    pass
    return total


def load_config(path, expected):
    path = safe_path(Path(path).absolute())
    with path.open('rb') as source:
        before = os.fstat(source.fileno())
        body = source.read(65537)
        after = os.fstat(source.fileno())
    if (len(body) > 65536 or before.st_nlink != 1 or before.st_size != len(body)
            or (before.st_size, before.st_mtime_ns) != (after.st_size, after.st_mtime_ns)
            or hashlib.sha256(body).hexdigest() != expected):
        raise ValueError('Pinned proof configuration required')
    config = json.loads(body.decode('utf-8'))
    if set(config) != {'repository', 'node', 'output', 'pins', 'workerArguments', 'workerBundle', 'runtimePins'}:
        raise ValueError('Strict proof configuration required')
    for key in ('repository', 'node', 'output'):
        if not isinstance(config[key], str) or not Path(config[key]).is_absolute():
            raise ValueError('Absolute proof paths required')
        safe_path(config[key])
    if not isinstance(config['pins'], list) or not 1 <= len(config['pins']) <= 100:
        raise ValueError('Bounded source pins required')
    seen = set()
    root = Path(config['repository'])
    for pin in config['pins']:
        if set(pin) != {'path', 'sha256'} or not isinstance(pin['path'], str):
            raise ValueError('Strict source pin required')
        relative = Path(pin['path'])
        if relative.is_absolute() or '..' in relative.parts or ':' in pin['path'] or '\\' in pin['path']:
            raise ValueError('Relative source pin required')
        if pin['path'] in seen:
            raise ValueError('Duplicate proof pin')
        seen.add(pin['path'])
        if digest(safe_path(root / relative)) != pin['sha256']:
            raise ValueError('Proof source pin mismatch')
    worker = 'scripts/era5/verify-lineage-scale.ts'
    if worker not in seen or 'package-lock.json' not in seen:
        raise ValueError('Worker and dependency pins required')
    bundle = safe_path(config['workerBundle'])
    if not Path(config['workerBundle']).is_absolute() or not bundle.is_relative_to(root):
        raise ValueError('Explicit workspace worker bundle required')
    if not isinstance(config['runtimePins'], list) or not 2 <= len(config['runtimePins']) <= 100:
        raise ValueError('Bounded executable and bundle pins required')
    runtime_paths = set()
    runtime_bytes = 0
    for pin in config['runtimePins']:
        if set(pin) != {'path', 'sha256'} or not Path(pin['path']).is_absolute():
            raise ValueError('Absolute runtime pin required')
        actual = safe_path(pin['path'])
        identity = os.path.normcase(str(actual))
        if identity in runtime_paths:
            raise ValueError('Duplicate runtime pin')
        runtime_paths.add(identity)
        runtime_bytes += actual.stat().st_size
        if runtime_bytes > 512 * 1024**2 or digest(actual) != pin['sha256']:
            raise ValueError('Runtime pin or byte budget mismatch')
    if not {os.path.normcase(str(bundle)), os.path.normcase(str(safe_path(config['node'])))} <= runtime_paths:
        raise ValueError('Node executable and bundle must both be pinned')
    args = config['workerArguments']
    if not isinstance(args, list) or len(args) > 20 or any(not isinstance(v, str) for v in args):
        raise ValueError('Bounded explicit worker arguments required')
    # Output is supplied by the supervisor, never replaced by worker arguments.
    if any(v == '--output' or v.startswith('--output=') for v in args):
        raise ValueError('Worker cannot replace proof output')
    return config


def run(config):
    if os.name != 'nt':
        raise ValueError('Windows Job containment required')
    repository = safe_path(config['repository'])
    output = safe_path(config['output'])
    if output.exists():
        raise ValueError('Fresh proof output required; no automatic retry')
    if shutil.disk_usage(output.parent).free < RESERVE + DISK:
        raise ValueError('Proof reserve unavailable')
    output.mkdir()
    began = time.monotonic()
    # A bundled worker needs no loader/import hooks or transpiler process.
    job = None
    child = None
    expired = threading.Event()
    finished = threading.Event()
    reason = None
    peak_rss = peak_disk = 0

    def timeout():
        if not finished.wait(max(0, SECONDS - (time.monotonic() - began))):
            expired.set()
            job.stop()

    watcher = threading.Thread(target=timeout, daemon=True)
    try:
        job = WindowsJob(MEMORY, 2)
        environment = dict(os.environ, TSX_DISABLE_CACHE='1',
                           TEMP=str(output), TMP=str(output), TMPDIR=str(output),
                           PYTHONDONTWRITEBYTECODE='1')
        environment.pop('NODE_OPTIONS', None)
        environment.pop('NODE_PATH', None)
        # This proof has no credentials or provider clients and uses synthetic data.
        command = [config['node'], '--max-old-space-size=1536', config['workerBundle'],
                   '--output', str(output), *config['workerArguments']]
        with (output / 'stdout.txt').open('xb') as stdout, (output / 'stderr.txt').open('xb') as stderr:
            child = subprocess.Popen(command, cwd=repository, env=environment,
                                     stdout=stdout, stderr=stderr, creationflags=4)
            job.assign_resume(child)
            watcher.start()
            last_scan = -SCAN_SECONDS
            while True:
                elapsed = time.monotonic() - began
                if expired.is_set() or elapsed >= SECONDS:
                    raise ValueError('Proof deadline')
                peak_rss = max(peak_rss, rss_bytes(child))
                if peak_rss > MEMORY:
                    raise ValueError('Proof RSS bound')
                if elapsed - last_scan >= SCAN_SECONDS or child.poll() is not None:
                    peak_disk = max(peak_disk, tree_bytes(output))
                    last_scan = elapsed
                    if peak_disk > DISK or shutil.disk_usage(output).free < RESERVE:
                        raise ValueError('Proof disk/reserve bound')
                if child.poll() is not None:
                    if child.returncode:
                        raise ValueError('Proof worker failed; preserve output')
                    break
                time.sleep(.05)
    except Exception as error:
        reason = str(error)[:500]
    finally:
        finished.set()
        if watcher.ident is not None:
            watcher.join(timeout=3)
        # A failed cleanup never turns into an unreported success. Continue all
        # cleanup steps independently, retain the first operation failure too.
        actions = [('job termination', job.stop)] if job is not None else []
        if child is not None:
            actions += [('child termination', lambda: child.kill() if child.poll() is None else None),
                        ('child wait', lambda: child.wait(timeout=3))]
        if job is not None:
            actions += [('job drain', lambda: job.drain(timeout=3)), ('job close', job.close)]
        for label, action in actions:
            try:
                action()
            except Exception:
                reason = (reason + '; ' if reason else '') + label + ' failed'
    # Post-pins are an independent condition, not the worker's success claim.
    for pin in [*config['pins'], *config['runtimePins']]:
        try:
            unchanged = digest(safe_path(repository / pin['path'])) == pin['sha256']
        except (OSError, ValueError):
            unchanged = False
        if not unchanged:
            reason = 'Proof source changed during run'
    report = dict(status='bounded-stop' if reason else 'complete', reason=reason,
                  elapsedSeconds=round(time.monotonic() - began, 3),
                  peakRssBytes=peak_rss, peakSampledLogicalBytes=peak_disk,
                  limits=dict(wallSeconds=SECONDS, hardTreeCommitBytes=MEMORY,
                              hardActiveProcesses=2, sampledDiskBytes=DISK,
                              reserveBytes=RESERVE, diskSampleStartIntervalSeconds=SCAN_SECONDS),
                  pins=config['pins'], runtimePins=config['runtimePins'], datasetRequests=0,
                  scope='synthetic offline lineage proof; not real source coverage')
    with (output / 'supervisor-report.json').open('x', encoding='utf-8') as receipt:
        json.dump(report, receipt, indent=2)
    return report


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--config', required=True)
    parser.add_argument('--expected-config-sha256', required=True)
    args = parser.parse_args()
    result = run(load_config(args.config, args.expected_config_sha256))
    print(json.dumps(result))
    sys.exit(0 if result['status'] == 'complete' else 1)
