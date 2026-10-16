"""Bounded local diagnostic categories; never serialize upstream values."""
import json
import os
from pathlib import Path
import stat
import sample_executor as core


def supervisor_budget(root):
    """Parent snapshot tolerates only known transient names disappearing."""
    total = 0
    transient = {'checkpoint.pending', 'writer.lock', 'transport-diagnostic.pending'}
    allowed = transient | {'checkpoint.json', 'job-identity.json', 'sample.raw',
                           'transport-diagnostic.json'}
    for entry in Path(root).iterdir():
        if entry.name not in allowed:
            raise ValueError('Unexpected supervisor output')
        try:
            core.owned(root, entry.name)
            info = entry.lstat()
            if not stat.S_ISREG(info.st_mode) or info.st_nlink != 1:
                raise ValueError('Unsafe supervisor output')
            total += info.st_size
        except FileNotFoundError:
            if entry.name not in transient: raise
    if total > core.TREE_LIMIT:
        raise ValueError('Output budget exceeded')


def write_receipt(path, value, exclusive=False):
    """Only callers' fixed schemas reach this bounded local writer."""
    path = Path(path).absolute()
    target = core.owned(path.parent, path.name)
    body = json.dumps(value, sort_keys=True, allow_nan=False).encode()
    if len(body) > 2048: raise ValueError('Diagnostic cap exceeded')
    if exclusive:
        with target.open('xb') as stream:
            stream.write(body); stream.flush(); os.fsync(stream.fileno())
    else:
        temporary = core.owned(path.parent, path.stem + '.pending')
        with temporary.open('xb') as stream:
            stream.write(body); stream.flush(); os.fsync(stream.fileno())
        os.replace(temporary, target)


class DiagnosticSink:
    def __init__(self, root):
        self.path = Path(root) / 'transport-diagnostic.json'

    def __call__(self, stage, status=None, metadata_bytes=0, failure='none'):
        if stage not in {'request', 'response', 'metadata', 'failed'}: return
        if failure not in {'none', 'transport', 'http-status', 'metadata-cap', 'json', 'shape'}: return
        if status is not None and (type(status) is not int or not 100 <= status <= 599): return
        if type(metadata_bytes) is not int or not 0 <= metadata_bytes <= 1048576: return
        try:
            write_receipt(self.path, dict(stage=stage, status=status,
                metadataBytes=metadata_bytes, failure=failure))
        except Exception:
            pass  # Telemetry can never request, retry, or replace execution state.
