"""Canonical local evidence paths; lexical escapes are refused before resolution."""
import os
from pathlib import Path
import stat


def _check_ancestors(path):
    for part in (path, *path.parents):
        # One non-following metadata lookup provides both POSIX link type and
        # Windows reparse attributes (including junctions). Separate is_symlink
        # and is_junction calls repeat the same filesystem work.
        try:
            info = part.lstat()
        except FileNotFoundError:
            continue
        if stat.S_ISLNK(info.st_mode) or getattr(info, 'st_file_attributes', 0) & 0x400:
            raise ValueError('symlink/reparse point refused')


def safe_path(value):
    raw = os.fspath(value)
    if not isinstance(raw, str):
        raise ValueError('text path required')
    path = Path(raw)
    if '..' in path.parts:
        raise ValueError('path traversal refused')
    if os.name == 'nt':
        if raw.replace('/', '\\').startswith(('\\\\?\\', '\\\\.\\')):
            raise ValueError('device namespace refused')
        if (path.drive or path.root) and not path.is_absolute():
            raise ValueError('anchored relative path refused')
        remainder = raw[len(path.drive):]
        if ':' in remainder:
            raise ValueError('alternate data stream refused')
        is_reserved = getattr(os.path, 'isreserved', None)
        if is_reserved(raw) if is_reserved is not None else path.is_reserved():
            raise ValueError('reserved device path refused')
        for part in path.parts[1:] if path.anchor else path.parts:
            if part.endswith((' ', '.')):
                raise ValueError('ambiguous Windows path component refused')
            stem = part.split('.')[0].upper()
            if stem in {'CON', 'PRN', 'AUX', 'NUL'} or stem in {
                f'{prefix}{number}' for prefix in ('COM', 'LPT') for number in range(1, 10)
            }:
                raise ValueError('reserved device component refused')
    absolute = Path(os.path.abspath(path))
    # Check the supplied spelling before resolve can hide links/junctions.
    _check_ancestors(absolute)
    # Resolution legitimately expands 8.3 aliases and existing parent spelling.
    # Every caller uses this same form for identity and containment comparisons.
    canonical = absolute.resolve()
    _check_ancestors(canonical)
    return canonical
