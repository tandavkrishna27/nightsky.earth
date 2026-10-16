"""Bounded offline ERA5 tcc decoder. No network or account configuration.

Output JSONL: one provenance header, then hourly rows in original time order.
Masked/non-finite values are null; gaps are retained, not interpolated.
"""
import argparse
import hashlib
import json
import math
import os
from pathlib import Path
import tempfile
import netCDF4
import numpy as np

MAX_DECODED_BYTES = 32 * 1024 * 1024
MAX_RAW_BYTES = 32 * 1024 * 1024
MAX_OUTPUT_BYTES = 4 * 1024 * 1024
MAX_CELLS = 10
MAX_HOURS = 800  # one month plus bounded boundary padding

def digest(path):
    hasher = hashlib.sha256()
    with Path(path).open("rb") as stream:
        for block in iter(lambda: stream.read(65536), b""):
            hasher.update(block)
    return hasher.hexdigest()

def read_chunk(path, decoded_limit=MAX_DECODED_BYTES):
    yield from _read_chunk(path, decoded_limit, MAX_HOURS)

def read_grouped_chunk(path):
    """Explicit grouped policy: at most 30 same-month years, ten cells, 32 MiB.

    Does not widen the monthly read_chunk/export_chunk contract.
    """
    # Freeze the reviewed modern converter shape rather than infer provenance
    # from extra variables, archives, or an unexpected ensemble layout.
    with netCDF4.Dataset(path, "r") as ds:
        if set(ds.variables)!={"tcc","valid_time","latitude","longitude","number","expver"} or ds.variables['number'].dimensions!=():
            raise ValueError("Unreviewed grouped source variables/member layout.")
    yield from _read_chunk(path, MAX_DECODED_BYTES, 30 * 31 * 24)

def _read_chunk(path, decoded_limit, max_hours):
    path = Path(path)
    if not 0 < decoded_limit <= MAX_DECODED_BYTES or path.stat().st_size > MAX_RAW_BYTES:
        raise ValueError("Raw or decoded chunk bound exceeded.")
    checksum = digest(path)
    with netCDF4.Dataset(path, "r") as ds:
        time_name = "valid_time" if "valid_time" in ds.variables else "time"
        required = ["tcc", time_name, "latitude", "longitude", "number", "expver"]
        if any(name not in ds.variables for name in required):
            raise ValueError("Missing source variables or revision/member provenance.")
        t, lat, lon, cloud = (ds.variables[name] for name in [time_name, "latitude", "longitude", "tcc"])
        if cloud.dimensions != (time_name, "latitude", "longitude") or t.dimensions != (time_name,) or lat.dimensions != ("latitude",) or lon.dimensions != ("longitude",):
            raise ValueError("Unsupported source dimensions; review before decoding.")
        if not 1 <= len(t) <= max_hours or not 1 <= len(lat) * len(lon) <= MAX_CELLS:
            raise ValueError("Chunk exceeds hourly/cell bounds.")
        if cloud.size * 8 + (len(t) + len(lat) + len(lon)) * 8 > decoded_limit:
            raise ValueError("Decoded chunk exceeds byte bound.")
        if getattr(cloud, "units", "").strip() not in {"1", "(0 - 1)", "0-1"} or getattr(cloud, "standard_name", "") != "cloud_area_fraction":
            raise ValueError("Expected fractional cloud_area_fraction tcc.")
        calendar = getattr(t, "calendar", "standard")
        if calendar not in {"standard", "gregorian", "proleptic_gregorian"}:
            raise ValueError("Unsupported source calendar.")
        if ds.variables["number"].size != 1:
            raise ValueError("Only deterministic ERA5 member 0 is supported.")
        member = np.ma.asarray(ds.variables["number"][:])
        if (np.ma.getmaskarray(member).any() or member.dtype.kind not in "iuf" or
                not np.isfinite(member).all() or not (member == 0).all()):
            raise ValueError("Only unmasked finite exact ERA5 member 0 is supported.")
        expver = ds.variables["expver"]
        if expver.dimensions not in {(), (time_name,)} or expver.size > max_hours:
            raise ValueError("Unsupported source revision dimensions.")
        revisions = sorted(set(str(value) for value in np.asarray(expver[:]).reshape(-1)))
        if not revisions or any(not revision.strip() or len(revision) > 16 for revision in revisions):
            raise ValueError("Missing or invalid revision metadata.")
        coordinates = []
        for latitude in np.asarray(lat[:], dtype=float):
            for longitude in np.asarray(lon[:], dtype=float):
                if not math.isfinite(latitude) or not math.isfinite(longitude) or not -90 <= latitude <= 90 or not -180 <= longitude < 360 or latitude * 4 != round(latitude * 4) or longitude * 4 != round(longitude * 4):
                    raise ValueError("Expected supplied regular 0.25-degree grid coordinates.")
                normalized_lon = longitude if longitude <= 180 else longitude - 360
                coordinates.append({"latitude": float(latitude), "longitude": float(normalized_lon), "cellId": f"era5:{latitude:g}:{normalized_lon:g}"})
        if len({row["cellId"] for row in coordinates}) != len(coordinates):
            raise ValueError("Duplicate supplied grid cells.")
        time_values = np.ma.asarray(t[:])
        if np.ma.getmaskarray(time_values).any() or not np.isfinite(time_values).all():
            raise ValueError("Missing or nonfinite source timestamps.")
        dates = netCDF4.num2date(time_values, units=t.units, calendar=calendar)
        stamps = [date.strftime("%Y-%m-%dT%H:%M:%SZ") for date in dates]
        if any(date.minute or date.second or date.microsecond for date in dates) or any(left >= right for left, right in zip(stamps, stamps[1:])):
            raise ValueError("Duplicate, unsorted or non-hourly source timestamps.")
        yield {"type": "header", "schemaVersion": 1, "sourceSha256": checksum,
               "sourceDoi": "10.24381/cds.adbb2d47", "dataClass": "reanalysis",
               "units": "fraction", "sourceUnits": cloud.units, "timeUnits": t.units,
               "calendar": calendar, "experimentVersions": revisions,
               "member": 0, "institution": str(getattr(ds, "institution", "")),
               "gridSpacingDegrees": 0.25, "cells": coordinates,
               "decoderVersions": {"netCDF4": netCDF4.__version__, "numpy": np.__version__},
               "rowCount": len(stamps)}
        for index, stamp in enumerate(stamps):
            # Read one bounded row, rather than decompress the whole field.
            row = np.ma.asarray(cloud[index, :, :]).reshape(-1)
            values = []
            for value in row:
                if np.ma.is_masked(value) or not math.isfinite(float(value)):
                    values.append(None)
                elif not 0 <= float(value) <= 1:
                    raise ValueError("Cloud fraction outside physical [0,1] range.")
                else:
                    values.append(float(value))
            yield {"type": "sample", "atUtc": stamp, "values": values}
    if digest(path) != checksum:
        raise ValueError("Source changed during extraction; reject checkpoint.")

def export_chunk(source, output):
    source, output = Path(source).resolve(), Path(output).resolve()
    if source == output:
        raise ValueError("Output cannot replace source.")
    output.parent.mkdir(parents=True, exist_ok=True)
    temporary = None
    try:
        with tempfile.NamedTemporaryFile(mode="w", encoding="utf-8", newline="\n", dir=output.parent, prefix=output.name + ".", suffix=".tmp", delete=False) as stream:
            temporary = Path(stream.name)
            size = 0
            for record in read_chunk(source):
                line = json.dumps(record, separators=(",", ":"), allow_nan=False) + "\n"
                size += len(line.encode("utf-8"))
                if size > MAX_OUTPUT_BYTES:
                    raise ValueError("JSONL output exceeds byte bound.")
                stream.write(line)
            stream.flush()
            os.fsync(stream.fileno())
        os.replace(temporary, output)
        temporary = None
    finally:
        if temporary is not None:
            temporary.unlink(missing_ok=True)

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("source", type=Path)
    parser.add_argument("output", type=Path)
    args = parser.parse_args()
    export_chunk(args.source, args.output)
    print(json.dumps({"output": args.output.name, "bytes": args.output.stat().st_size, "sha256": digest(args.output)}))
