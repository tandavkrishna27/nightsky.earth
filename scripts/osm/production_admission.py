"""Fixed local Node production-admission gate; no caller-selected policy/trust.

Raw producer and assembly invoke this before creating outputs and again before
completion/resume. Approval is a revalidated input snapshot, never a bearer token.
"""
import hashlib
import json
import os
from pathlib import Path
import re
import shutil
import subprocess
import threading

from spot_paths import safe_path

REPO = Path(__file__).resolve().parents[2]
SCRIPT = REPO/'scripts/osm/production-source-admission.ts'
LOADER = REPO/'scripts/osm/production-type-loader.mjs'
CODE_FILES = ('scripts/osm/production-source-admission.ts',
              'scripts/osm/source-admission.ts', 'scripts/osm/natural-earth-policy.ts',
              'scripts/osm/production_admission.py',
              # Repository-owned membership closure; same order as the fixed TS gate.
              'scripts/osm/membership-assembly.ts', 'scripts/osm/boundary-metadata.ts',
              'scripts/osm/partitioned-boundaries.ts', 'scripts/osm/geographic-geometry.ts',
              'scripts/osm/build-source-catalogue.ts', 'scripts/osm/source-build-config.ts',
              'scripts/osm/build-streamed-catalogue.ts', 'scripts/osm/normalized-input-bytes.ts',
              'server/places/catalogueFormat.ts', 'shared/nightsky/discovery.ts',
              'shared/nightsky/common.ts', 'shared/nightsky/places.ts',
              'scripts/osm/partitioned-assembly-plan.ts',
              'scripts/osm/partitioned-candidates.ts',
              'scripts/osm/geography-capacity-plan.ts',
              'scripts/osm/global_source.py',
              'scripts/osm/normalized_partitions.py',
              'scripts/osm/spot_paths.py',
              'scripts/osm/supervised_membership_assembly.py',
              'scripts/osm/global_source_supervisor.py')
PHASES = {'preflight', 'raw-before', 'raw-after', 'assembly-before', 'assembly-after', 'resume'}
MAX_OUTPUT = 1024**2


def _sha(value):
    if not isinstance(value, str) or not re.fullmatch('[a-f0-9]{64}', value):
        raise ValueError('production admission SHA-256 required')
    return value


def _pin(path, ceiling=1024**2):
    path = safe_path(path)
    with path.open('rb') as handle:
        before = os.fstat(handle.fileno())
        payload = handle.read(ceiling+1)
        after = os.fstat(handle.fileno())
    linked = path.stat()
    # Windows Python can expose different historical ctime semantics through
    # fstat and path.stat. Compare ctime only within the same handle API.
    identity = lambda item: (item.st_dev, item.st_ino, item.st_size, item.st_mtime_ns)
    if len(payload) > ceiling or len(payload) != before.st_size or identity(before) != identity(after) or before.st_ctime_ns != after.st_ctime_ns or identity(after) != identity(linked):
        raise ValueError('production admission code mutation/byte limit')
    return dict(path=str(path), bytes=len(payload), sha256=hashlib.sha256(payload).hexdigest())


def production_admission_retained_paths(snapshot):
    """Deduplicated exact gate evidence for caller's whole-job accounting."""
    if not isinstance(snapshot, dict) or snapshot.get('productionAdmitted') is not True:
        raise ValueError('validated production admission snapshot required')
    pins = [snapshot[key] for key in ('manifest', 'assemblyPlan', 'admission')]
    pins += snapshot.get('metadataPins', [])+snapshot.get('geometryPins', [])+snapshot.get('codePins', [])
    return list(dict.fromkeys(safe_path(pin['path']) for pin in pins))


def _run_gate(command, request):
    """Bound pipe memory and wall time, including loader/startup failures."""
    environment = {key:value for key,value in os.environ.items()
                   if key.upper() in ('SYSTEMROOT', 'WINDIR', 'TEMP', 'TMP')}
    process = subprocess.Popen(command+[request], stdin=subprocess.DEVNULL,
                               stdout=subprocess.PIPE, stderr=subprocess.PIPE,
                               cwd=REPO, env=environment)
    chunks = [bytearray(), bytearray()]
    failures = []
    def drain(index, stream, ceiling):
        try:
            while True:
                chunk = stream.read(min(65536, ceiling-len(chunks[index])+1))
                if not chunk:
                    return
                if len(chunks[index])+len(chunk) > ceiling:
                    failures.append('bounded admission subprocess output exceeded')
                    process.kill()
                    return
                chunks[index].extend(chunk)
        except Exception:
            failures.append('admission subprocess pipe failure')
            process.kill()
        finally:
            stream.close()
    threads = [threading.Thread(target=drain, args=(0,process.stdout,MAX_OUTPUT), daemon=True),
               threading.Thread(target=drain, args=(1,process.stderr,65536), daemon=True)]
    for thread in threads:
        thread.start()
    try:
        process.wait(timeout=60)
    except subprocess.TimeoutExpired:
        process.kill()
        process.wait(timeout=3)
        raise TimeoutError('production admission gate deadline')
    finally:
        for thread in threads:
            thread.join(timeout=3)
    if any(thread.is_alive() for thread in threads):
        raise RuntimeError('production admission pipe did not drain')
    if failures:
        raise ValueError(failures[0])
    return process.returncode, bytes(chunks[0]), bytes(chunks[1])


def verify_production_admission(manifest_path, admission_path, admission_sha256,
                                phase, expected_snapshot=None, *,
                                expected_plan_path=None, expected_plan_sha256=None):
    if phase not in PHASES:
        raise ValueError('unknown production admission phase')
    if not isinstance(admission_path, (str, os.PathLike)) or not os.fspath(admission_path) or admission_sha256 is None:
        raise ValueError('production admission file and SHA-256 required')
    manifest_path = safe_path(manifest_path)
    admission_path = safe_path(admission_path)
    request = dict(manifestPath=str(manifest_path), admissionPath=str(admission_path),
                   admissionSha256=_sha(admission_sha256), phase=phase)
    if expected_snapshot is not None:
        value = expected_snapshot.get('snapshotSha256') if isinstance(expected_snapshot, dict) else expected_snapshot
        request['expectedSnapshot'] = _sha(value)
    if expected_plan_path is not None:
        request['expectedPlanPath'] = str(safe_path(expected_plan_path))
    if expected_plan_sha256 is not None:
        request['expectedPlanSha256'] = _sha(expected_plan_sha256)
    # Fixed source/loader paths are never supplied by a manifest or candidate.
    code_pins = [_pin(REPO/path) for path in CODE_FILES]
    loader_pin = _pin(LOADER)
    node = shutil.which('node')
    if node is None:
        raise RuntimeError('existing local Node runtime required for production admission')
    command = [str(safe_path(node)), '--max-old-space-size=1280', '--import',
               safe_path(LOADER).as_uri(), str(safe_path(SCRIPT)), '--request']
    payload = json.dumps(request, separators=(',', ':'))
    if len(payload.encode()) > 16384:
        raise ValueError('bounded admission request required')
    exit_code, output, stderr = _run_gate(command, payload)
    if code_pins != [_pin(REPO/path) for path in CODE_FILES] or loader_pin != _pin(LOADER):
        raise ValueError('production admission executable context changed')
    try:
        result = json.loads(output)
    except (ValueError, UnicodeDecodeError):
        raise ValueError('production admission gate invalid bounded response') from None
    if exit_code or not isinstance(result, dict) or result.get('productionAdmitted') is not True:
        reason = result.get('error', 'production admission refused') if isinstance(result, dict) else 'production admission refused'
        raise ValueError(str(reason)[:1200])
    _sha(result.get('snapshotSha256'))
    if result.get('phase') != phase or result.get('codePins') != code_pins+[loader_pin]:
        raise ValueError('production admission fixed code/phase binding mismatch')
    if expected_snapshot is not None and result['snapshotSha256'] != request['expectedSnapshot']:
        raise ValueError('production admission resume snapshot changed')
    return result
