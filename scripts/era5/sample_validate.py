"""Strict offline validation of the fixed 24-hour legacy sample; no extraction/install.

Run in an already contained decoder worker if operating on untrusted provider bytes.
This module launches no subprocess and never admits ZIP as a NetCDF source.
"""
import hashlib
from pathlib import Path


def validate_records(records):
    records=iter(records); header=next(records)
    expected={'era5:32:48.75','era5:32:49','era5:32.25:48.75','era5:32.25:49'}
    if header.get('type')!='header' or header.get('rowCount')!=24 or header.get('member')!=0:
        raise ValueError('Unexpected sample/member')
    if set(header.get('experimentVersions',[])) not in ({'1'},{'0001'}):
        raise ValueError('Final expver 0001 required')
    cells=header.get('cells',[])
    if len(cells)!=4 or {cell['cellId'] for cell in cells}!=expected:
        raise ValueError('Unexpected sample cells')
    for hour in range(24):
        row=next(records,None)
        if row is None or row.get('type')!='sample' or row.get('atUtc')!=f'1990-12-30T{hour:02}:00:00Z':
            raise ValueError('Expected exact 24-hour clock')
        values=row.get('values',[])
        if len(values)!=4 or any(type(v) not in (float,int) or not 0<=v<=1 for v in values):
            raise ValueError('Expected 96 finite cloud fractions')
    if next(records,None) is not None: raise ValueError('Extra sample rows')
    return dict(accepted=True,hours=24,cells=4,scalarCellHours=96,member=0,expver='0001')


def validate_raw(source, expected_sha256):
    source=Path(source)
    if source.is_symlink() or source.stat().st_nlink!=1 or source.stat().st_size>2*1024**2:
        raise ValueError('Raw source identity/size rejected')
    before=hashlib.sha256(source.read_bytes()).hexdigest()
    if before!=expected_sha256: raise ValueError('Raw hash mismatch')
    with source.open('rb') as stream:
        magic=stream.read(8)
    if not (magic.startswith(b'CDF') or magic==b'\x89HDF\r\n\x1a\n'):
        raise ValueError('Unsupported body (including ZIP); preserve unaccepted')
    from read_chunks import read_chunk
    result=validate_records(read_chunk(source))
    if hashlib.sha256(source.read_bytes()).hexdigest()!=before: raise ValueError('Raw mutated')
    return dict(result,sourceSha256=before)
