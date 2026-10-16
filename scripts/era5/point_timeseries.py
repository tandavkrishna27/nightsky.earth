"""Offline ZIP/scalar point decoder. Separate quarantine schema; no history admission.

Run untrusted NetCDF parsing only inside a separately enforced process memory,
wall-time and process-count boundary (the retained validation uses Windows Job).
This library supplies byte/schema limits, not OS process containment.

No inferred member, revision, institution or dataset identity. Callers must bind
raw bytes, requested supplied grid point and exact UTC hourly clock.
"""
import hashlib
import io
import json
import math
import os
import tempfile
from pathlib import Path
import re
import stat
import zipfile
import netCDF4
import numpy as np

MAX_RAW_BYTES=2*1024**2
MAX_MEMBER_BYTES=64*1024**2
MAX_OUTPUT_BYTES=1024*1024
MAX_HOURS=800

def sha(body):return hashlib.sha256(body).hexdigest()

def check_ancestry(path):
    path=Path(path).absolute()
    for path in (path,*path.parents):
        info=path.lstat()
        if stat.S_ISLNK(info.st_mode) or getattr(info,'st_file_attributes',0)&1024:
            raise ValueError('Linked or reparse path')

def checked_read(source, limit):
    source=Path(source).absolute()
    check_ancestry(source)
    info=source.lstat()
    if not stat.S_ISREG(info.st_mode) or info.st_nlink!=1 or info.st_size>limit:
        raise ValueError('Source identity/size rejected')
    identity=lambda v:(v.st_dev,v.st_ino,v.st_size,v.st_mtime_ns,v.st_nlink)
    with source.open('rb') as stream:
        if identity(os.fstat(stream.fileno()))!=identity(info):raise ValueError('Source replaced')
        body=stream.read(limit+1)
        if identity(os.fstat(stream.fileno()))!=identity(info):raise ValueError('Source changed')
    if identity(source.lstat())!=identity(info) or len(body)>limit:raise ValueError('Source replaced or oversized')
    return body

def decode_point(source, expected_sha256, latitude, longitude, expected_clock, *, raw_limit=MAX_RAW_BYTES):
    if type(raw_limit) is not int or not 0<raw_limit<=MAX_RAW_BYTES:raise ValueError('Invalid raw limit')
    if not isinstance(expected_sha256,str) or not re.fullmatch('[0-9a-f]{64}',expected_sha256):raise ValueError('Explicit SHA256 required')
    source=Path(source)
    body=checked_read(source,raw_limit)
    if len(body)>raw_limit or sha(body)!=expected_sha256:raise ValueError('Raw pin differs')
    if not isinstance(expected_clock,(list,tuple)) or not 1<=len(expected_clock)<=MAX_HOURS:raise ValueError('Expected clock bound')
    for value,low,high in [(latitude,-90,90),(longitude,-180,360)]:
        if type(value) not in (int,float) or not math.isfinite(value) or not low<=value<=high or value*4!=round(value*4):raise ValueError('Expected supplied grid point')
    try:
        with zipfile.ZipFile(io.BytesIO(body)) as archive:
            entries=archive.infolist()
            if len(entries)!=1:raise ValueError('Exactly one archive member required')
            entry=entries[0];mode=entry.external_attr>>16
            if (entry.is_dir() or '/' in entry.filename or '\\' in entry.filename or ':' in entry.filename or entry.filename in ('.','..') or not entry.filename.lower().endswith('.nc') or entry.flag_bits&1 or stat.S_ISLNK(mode) or (stat.S_IFMT(mode) not in (0,stat.S_IFREG)) or entry.compress_type not in (zipfile.ZIP_STORED,zipfile.ZIP_DEFLATED) or not 0<entry.file_size<=MAX_MEMBER_BYTES or entry.file_size>max(1,entry.compress_size)*100):raise ValueError('Archive member rejected')
            with archive.open(entry) as stream:member=stream.read(MAX_MEMBER_BYTES+1)
            if len(member)!=entry.file_size:raise ValueError('Archive expansion bound')
    except (zipfile.BadZipFile,RuntimeError,NotImplementedError,EOFError) as error:raise ValueError('Invalid archive') from error
    with netCDF4.Dataset('point.nc',memory=member) as ds:
        if ds.groups or set(ds.variables)!={'tcc','valid_time','latitude','longitude'} or set(ds.dimensions)!={'valid_time'}:raise ValueError('Unreviewed point schema or provenance')
        t,c,lat,lon=(ds.variables[k] for k in ('valid_time','tcc','latitude','longitude'))
        if t.dimensions!=('valid_time',) or c.dimensions!=('valid_time',) or lat.dimensions!=() or lon.dimensions!=() or not 1<=len(t)<=MAX_HOURS or ds.dimensions['valid_time'].isunlimited():raise ValueError('Unsupported point dimensions')
        for v in (t,c,lat,lon):
            if v.dtype.kind not in 'iuf' or v.dtype.itemsize>8 or any(k in v.ncattrs() for k in ('scale_factor','add_offset')):raise ValueError('Unsupported numeric encoding')
        for v,wanted,unit in ((lat,latitude,'degrees_north'),(lon,longitude,'degrees_east')):
            data=np.ma.asarray(v[:])
            if getattr(v,'units','')!=unit or np.ma.getmaskarray(data).any() or not np.isfinite(data).all() or float(data)!=wanted:raise ValueError('Coordinate mismatch')
        units=getattr(c,'units','')
        if units not in ('1','(0 - 1)','0-1') or getattr(c,'standard_name','')!='cloud_area_fraction':raise ValueError('Expected fractional cloud cover')
        calendar=getattr(t,'calendar','')
        if calendar not in ('standard','gregorian','proleptic_gregorian'):raise ValueError('Unsupported calendar')
        time_units=getattr(t,'units','')
        if not isinstance(time_units,str) or len(time_units)>128 or not re.fullmatch(r'(seconds|hours) since \d{4}-\d{2}-\d{2}( 00:00:00)?',time_units):raise ValueError('Unsupported UTC epoch units')
        values=np.ma.asarray(t[:])
        if np.ma.getmaskarray(values).any() or not np.isfinite(values).all():raise ValueError('Missing timestamps')
        dates=netCDF4.num2date(values,units=time_units,calendar=calendar)
        stamps=[d.strftime('%Y-%m-%dT%H:%M:%SZ') for d in dates]
        if any(d.minute or d.second or d.microsecond for d in dates) or any((b-a).total_seconds()!=3600 for a,b in zip(dates,dates[1:])) or stamps!=list(expected_clock):raise ValueError('Clock differs from exact hourly request')
        rows=[]
        for stamp,value in zip(stamps,np.ma.asarray(c[:])):
            number=None if np.ma.is_masked(value) or not math.isfinite(float(value)) else float(value)
            if number is not None and not 0<=number<=1:raise ValueError('Cloud fraction outside physical range')
            rows.append(dict(type='sample',atUtc=stamp,values=[number]))
        header=dict(type='point-timeseries-header',schemaVersion='era5-point-quarantine-v1',purpose='offline-point-inspection',historicalAdmission=False,sourceSha256=expected_sha256,memberSha256=sha(member),member=None,experimentVersions=None,memberStatus='unknown-absent',revisionStatus='unknown-absent',units='fraction',sourceUnits=units,timeUnits=time_units,calendar=calendar,rowCount=len(rows),cells=[dict(latitude=latitude,longitude=longitude)],decoderVersions=dict(netCDF4=netCDF4.__version__,numpy=np.__version__))
    after=checked_read(source,raw_limit)
    if sha(after)!=expected_sha256:raise ValueError('Source changed')
    return [header,*rows]

def export_point(source,output,*args,**kwargs):
    records=decode_point(source,*args,**kwargs)
    body=(''.join(json.dumps(r,separators=(',',':'),allow_nan=False)+'\n' for r in records)).encode()
    if len(body)>MAX_OUTPUT_BYTES:raise ValueError('Output byte bound')
    output=Path(output).absolute()
    check_ancestry(output.parent)
    temporary=None
    try:
        with tempfile.NamedTemporaryFile(dir=output.parent, prefix='.point-', delete=False) as stream:
            temporary=Path(stream.name)
            stream.write(body);stream.flush();os.fsync(stream.fileno())
        # A hard link publishes complete bytes atomically and refuses existing paths.
        check_ancestry(output.parent)
        os.link(temporary,output)
    finally:
        if temporary is not None:temporary.unlink(missing_ok=True)
    return records[0]
