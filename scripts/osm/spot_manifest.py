"""Exact offline pilot manifest; these pins convey no retrieval authorization."""
import copy
import hashlib
import json
from pathlib import Path

_VINTAGE = '2026-10-13T20:21:31Z'
_LICENSE = 'https://opendatacommons.org/licenses/odbl/1-0/'
PINNED_SOURCES = [
    dict(id=identifier, url=f'https://download.geofabrik.de/{region}/{identifier}-261013.osm.pbf', declaredBytes=size, etag=etag, expectedVintage=_VINTAGE, licenseUrl=_LICENSE, sourcePage=f'https://download.geofabrik.de/{region}/{identifier}.html')
    for identifier, region, size, etag in [
        ('monaco','europe',692392,'"a90a8-65dc12ca110ea"'),
        ('faroe-islands','europe',7735542,'"7608f6-65dc12240bee5"'),
        ('fiji','australia-oceania',17249749,'"10735d5-65dc043e799ab"'),
    ]
]
DEFAULT_MANIFEST = {'version':1, 'sources':copy.deepcopy(PINNED_SOURCES)}
# Private canonical contract does not change when callers mutate public examples.
_PINNED = json.dumps(DEFAULT_MANIFEST, sort_keys=True, separators=(',',':'))

def validate_source(source):
    pins = json.loads(_PINNED)['sources']
    if not isinstance(source, dict) or source not in pins or any(type(source[k]) is not type(pin[k]) for pin in pins if pin == source for k in pin):
        raise ValueError('Source must match an exact pinned source profile')
    return copy.deepcopy(source)

def load_manifest(value):
    if isinstance(value, (str, Path)):
        value = json.loads(Path(value).read_text(encoding='utf-8'))
    if value != json.loads(_PINNED) or not isinstance(value,dict) or type(value.get('version')) is not int:
        raise ValueError('Manifest must match the exact ordered three-source contract')
    for source in value['sources']: validate_source(source)
    return copy.deepcopy(value)

def manifest_digest(manifest):
    return hashlib.sha256(json.dumps(load_manifest(manifest),sort_keys=True,separators=(',',':'),ensure_ascii=False).encode()).hexdigest()
