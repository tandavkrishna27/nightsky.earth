"""Local-only Icechunk 2.x descriptor inspection. No cloud storage factories.

The optional official parser is imported only after object bounds and hashes pass.
Raw receipts and decompressed derivatives have distinct identities. Neither is
scientific admission. Callers must externally contain untrusted native parsing.
"""
import hashlib
import json
import math
from pathlib import Path
import re
import sys

MiB = 1024**2
OBJECT_LIMIT = MiB
EXPANDED_LIMIT = 16 * MiB
MAGIC = 'ICE🧊CHUNK'.encode('utf-8')
ALPHABET = '0123456789ABCDEFGHJKMNPQRSTVWXYZ'
DESCRIPTORS = tuple('single/temporal/' + name + '/zarr.json' for name in
                    ('tcc', 'valid_time', 'latitude', 'longitude', 'status/expver', 'status/tcc'))


def digest(body):
    return hashlib.sha256(body).hexdigest()


def snapshot_id(value):
    if (not isinstance(value, str) or not re.fullmatch('[0-9A-HJKMNP-TV-Z]{20}', value)
            or ALPHABET.index(value[-1]) % 16):
        raise ValueError('Noncanonical 96-bit Crockford snapshot ID')
    return value


def strict_json(raw, *, byte_limit=MiB, entry_budget=None):
    if not isinstance(raw, bytes) or len(raw) > byte_limit:
        raise ValueError('JSON byte limit')
    try: text = raw.decode('utf-8')
    except UnicodeError as exc: raise ValueError('Invalid JSON UTF-8') from exc
    # Bound lexical nesting before the recursive standard-library decoder runs.
    depth = 0
    quoted = escaped = False
    for ch in text:
        if quoted:
            if escaped: escaped = False
            elif ch == '\\': escaped = True
            elif ch == '"': quoted = False
        elif ch == '"': quoted = True
        elif ch in '[{':
            depth += 1
            if depth > 32: raise ValueError('JSON depth limit')
        elif ch in ']}': depth -= 1
    def pairs(items):
        result = {}
        for key, value in items:
            if key in result: raise ValueError('Duplicate JSON field')
            result[key] = value
        return result
    def finite(token):
        value = float(token)
        if not math.isfinite(value): raise ValueError('Nonfinite JSON number')
        return value
    def invalid(token): raise ValueError('Nonfinite JSON constant')
    try: value = json.loads(text, object_pairs_hook=pairs, parse_constant=invalid, parse_float=finite)
    except (RecursionError, UnicodeError) as exc: raise ValueError('Malformed JSON') from exc
    pending = [value]
    entries = 0
    remaining = entry_budget[0] if entry_budget is not None else 100000
    while pending:
        item = pending.pop()
        if isinstance(item, (dict, list)):
            entries += len(item)
            if entries > remaining: raise ValueError('JSON entry limit')
            pending.extend(item.values() if isinstance(item, dict) else item)
    if entry_budget is not None: entry_budget[0] -= entries
    return value


def inspect_header(raw, kind, expected_sha256, expected_length):
    if (kind not in ('repo', 'snapshot') or not isinstance(raw, bytes)
            or type(expected_length) is not int or len(raw) != expected_length
            or not 39 < len(raw) <= OBJECT_LIMIT or digest(raw) != expected_sha256):
        raise ValueError('Object hash, length or kind binding rejected')
    if raw[:12] != MAGIC or raw[36] != 2 or raw[37] != (6 if kind == 'repo' else 1) or raw[38] not in (0, 1):
        raise ValueError('Unsupported Icechunk header/version/type/compression')
    try: raw[12:36].decode('utf-8')
    except UnicodeError as exc: raise ValueError('Invalid implementation name') from exc
    return dict(magic=MAGIC.hex(), writtenBy=raw[12:36].decode('utf-8').rstrip(' '),
                specVersion=raw[36], fileType=raw[37], compression=raw[38], headerBytes=39)


def prepare_object(raw, kind, expected_sha256, expected_length):
    header = inspect_header(raw, kind, expected_sha256, expected_length)
    expanded_object = raw
    if raw[38] == 1:
        try:
            from compression.zstd import ZstdDecompressor, DecompressionParameter
            decoder = ZstdDecompressor(options={DecompressionParameter.window_log_max: 24})
            expanded = decoder.decompress(raw[39:], max_length=EXPANDED_LIMIT + 1)
            if len(expanded) > EXPANDED_LIMIT:
                raise ValueError('Zstd expanded byte limit')
            if not decoder.eof or decoder.unused_data:
                raise ValueError('Zstd truncated, trailing or multiple frames')
            expanded_object = raw[:38] + b'\x00' + expanded
        except Exception as exc:
            raise ValueError('Bounded stdlib Zstd unavailable or invalid') from exc
    if len(expanded_object) - 39 > EXPANDED_LIMIT: raise ValueError('Expanded byte limit')
    # 2.3.0's native reader rejects compression=0. Never give it an untrusted
    # compressed frame: regenerate a trusted frame only after bounded expansion.
    try:
        from compression.zstd import compress
        native = raw[:38] + b'\x01' + compress(expanded_object[39:])
    except ImportError as exc: raise ValueError('Bounded stdlib Zstd required') from exc
    return dict(rawBytes=raw, rawSha256=digest(raw), rawLength=len(raw),
                originalHeader=header,
                expandedBytes=expanded_object, expandedSha256=digest(expanded_object),
                expandedLength=len(expanded_object),
                nativeBytes=native, nativeSha256=digest(native), nativeLength=len(native),
                transformation='bounded-expansion-then-trusted-stdlib-zstd-frame')


def safe_path(path):
    path = Path(path).absolute()
    # Reject Windows reparse points, symlinks and lexical normalization ambiguities.
    if '..' in path.parts or path.resolve() != path:
        raise ValueError('Noncanonical or linked local path')
    for item in (path, *path.parents):
        if item.exists() and (item.is_symlink() or item.is_junction()):
            raise ValueError('Linked quarantine path')
    return path


def write_exclusive(path, body):
    import os
    path = safe_path(path)
    with path.open('xb') as stream:
        stream.write(body)
        stream.flush()
        os.fsync(stream.fileno())


class OfflineRepository:
    """Known-format offline fixture inspection; unsupported features unproved.

    One fresh local root, one repo, one exact snapshot, fixed descriptors. This
    local capability is insufficient for live readiness or scientific admission.
    """
    def __init__(self, root, raw, expected_sha256, expected_length):
        bound = prepare_object(raw, 'repo', expected_sha256, expected_length)
        self.root = safe_path(root)
        self.root.mkdir()  # Exclusive ownership; existing directories are rejected.
        (self.root / 'originals').mkdir()
        (self.root / 'expanded').mkdir()
        (self.root / 'local').mkdir()
        self.evidence = {'repo': self._materialize(bound, 'repo')}
        self._repo = None
        self.main_id = None
        self._session = None
        self._json_entries = [100000]

    def _materialize(self, bound, key):
        raw_path = self.root / 'originals' / key
        expanded_path = self.root / 'expanded' / key
        local_path = self.root / 'local' / key
        if '/' in key:
            raw_path.parent.mkdir()
            expanded_path.parent.mkdir()
            local_path.parent.mkdir()
        write_exclusive(raw_path, bound['rawBytes'])
        write_exclusive(expanded_path, bound['expandedBytes'])
        write_exclusive(local_path, bound['nativeBytes'])
        return {k: v for k, v in bound.items() if not k.endswith('Bytes')}

    def resolve_main(self):
        if self.main_id is not None: raise ValueError('Main may be resolved only once')
        try:
            import icechunk as ic
            from importlib.metadata import version
            if version('icechunk') != '2.3.0' or version('zarr') != '3.1.6':
                raise ValueError('Unreviewed optional parser version')
            self.parser_versions = dict(icechunk=version('icechunk'), zarr=version('zarr'),
                                        python='.'.join(map(str, sys.version_info[:3])))
            config = ic.RepositoryConfig(
                max_concurrent_requests=1, max_concurrent_decodes=1,
                get_partial_values_concurrency=1, virtual_chunk_containers={},
                manifest=ic.ManifestConfig(preload=ic.ManifestPreloadConfig(
                    max_total_refs=0, max_arrays_to_scan=0,
                    preload_if=ic.ManifestPreloadCondition.false())))
            self._repo = ic.Repository.open(ic.local_filesystem_storage(str(self.root / 'local')),
                                           config=config, authorize_virtual_chunk_access={})
            if self._repo.authorized_virtual_container_prefixes:
                raise ValueError('Virtual authorization rejected')
            # Known-only API check. It does NOT expose unknown stored IDs or opaque
            # extensions; output must retain the explicit interpretation limit.
            for flag in self._repo.feature_flags():
                if (flag.id, flag.name) not in ((3, 'move_node'), (4, 'create_tag'), (5, 'delete_tag')):
                    raise ValueError('Unsupported repository feature')
            self.main_id = snapshot_id(self._repo.lookup_branch('main'))
            return self.main_id
        except Exception as exc:
            raise ValueError('Official local repo parser rejected metadata') from exc

    def descriptor(self, key):
        if key not in DESCRIPTORS or self._session is None:
            raise ValueError('Only fixed descriptor keys at the verified snapshot are allowed')
        from zarr.core.buffer import default_buffer_prototype
        import asyncio
        value = asyncio.run(self._session.store.get(key, prototype=default_buffer_prototype()))
        if value is None: raise ValueError('Required descriptor missing')
        result = strict_json(value.to_bytes(), entry_budget=self._json_entries)
        if (not isinstance(result, dict) or result.get('zarr_format') != 3
                or result.get('node_type') != 'array'):
            raise ValueError('Unsupported descriptor format/type')
        return result

    def inspect_snapshot(self, sid, raw, expected_sha256, expected_length):
        snapshot_id(sid)
        if sid != self.main_id or self._session is not None:
            raise ValueError('Snapshot identity differs or already inspected')
        bound = prepare_object(raw, 'snapshot', expected_sha256, expected_length)
        self.evidence['snapshot'] = self._materialize(bound, 'snapshots/' + sid)
        try:
            info = self._repo.inspect_snapshot(sid)
            if info.get('id') != sid: raise ValueError('Internal snapshot identity differs')
            self._session = self._repo.readonly_session(snapshot_id=sid)
            descriptors = {key: self.descriptor(key) for key in DESCRIPTORS}
        except Exception as exc:
            raise ValueError('Official local snapshot parser rejected metadata') from exc
        return dict(schemaVersion=1, mainSnapshotId=sid, objects=self.evidence,
                    parserVersions=self.parser_versions,
                    descriptors=descriptors, scientificAdmission=False,
                    unsupportedFeatureExclusionProved=False,
                    interpretation='bounded-observational-metadata-as-interpreted-by-icechunk-2.3.0',
                    status='bounded-metadata-interpretation')


if __name__ == '__main__':
    raise SystemExit('Use icechunk_metadata.py; this module performs local parsing only')
