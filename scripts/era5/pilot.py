"""Prepare and measure the bounded 2025 ERA5 pilot. Offline: no CDS requests.

Stages existing/browser/API-downloaded files only after source validation.
Each completed chunk has a verified raw and decoded checkpoint; no database.
"""
import argparse
import calendar
from contextlib import contextmanager
import hashlib
import json
import os
from pathlib import Path
import platform
import subprocess
import sys
import tempfile
import time
from datetime import datetime, timedelta, timezone
from read_chunks import read_chunk, export_chunk, digest, MAX_RAW_BYTES

RAW_LIMIT = 256 * 1024 * 1024
SCRATCH_LIMIT = 1024 * 1024 * 1024
BATCH_SECONDS = 1800
REGIONS = {
    "hanle": {"area": [33, 78.75, 32.75, 79], "cells": [(32.75, 78.75), (32.75, 79), (33, 78.75), (33, 79)], "placeIds": [1270426]},
    "kodaikanal-munnar": {"area": [10.25, 77, 10, 77.5], "cells": [(10, 77), (10, 77.25), (10, 77.5), (10.25, 77), (10.25, 77.25), (10.25, 77.5)], "placeIds": [1266425, 1262463]},
}

def build_plan(year=2025):
    if year != 2025:
        raise ValueError("This reviewed pilot is fixed to 2025.")
    chunks = []
    for name, region in REGIONS.items():
        periods = [(2024, 12, [30, 31], "boundary")]
        periods += [(2025, month, list(range(1, calendar.monthrange(2025, month)[1] + 1)), "month") for month in range(1, 13)]
        periods += [(2026, 1, [1, 2], "boundary")]
        for source_year, month, days, kind in periods:
            chunk_id = f"{name}-{source_year}-{month:02d}" + ("-boundary" if kind == "boundary" else "")
            chunks.append({"chunkId": chunk_id, "region": name, "expectedHours": len(days) * 24,
                "request": {"product_type": ["reanalysis"], "variable": ["total_cloud_cover"], "year": [str(source_year)], "month": [f"{month:02d}"],
                    "day": [f"{day:02d}" for day in days], "time": [f"{hour:02d}:00" for hour in range(24)],
                    "data_format": "netcdf", "download_format": "unarchived", "area": region["area"]}})
    return {"schemaVersion": 1, "year": year, "sampleKind": "sample-only", "dataset": "reanalysis-era5-single-levels", "sourceDoi": "10.24381/cds.adbb2d47",
        "observingNightStart": "2025-01-01", "observingNightEnd": "2025-12-31", "totalCells": 10, "chunks": chunks,
        "limits": {"oneActiveChunk": True, "rawChunkBytes": MAX_RAW_BYTES, "decodedNumericBytes": 32 * 1024 * 1024,
            "retainedRawBytes": RAW_LIMIT, "scratchBytes": SCRATCH_LIMIT, "batchSeconds": BATCH_SECONDS},
        "cellCoverage": {name: {"cells": [list(cell) for cell in region["cells"]], "placeIds": region["placeIds"]} for name, region in REGIONS.items()}}

def canonical(value): return json.dumps(value, sort_keys=True, separators=(",", ":"), allow_nan=False)
def plan_digest(plan): return hashlib.sha256(canonical(plan).encode()).hexdigest()

def owned(root, relative):
    root = Path(root).resolve()
    path = root / relative
    if path.is_symlink() or not path.resolve().is_relative_to(root):
        raise ValueError("Pilot path leaves its task-owned directory.")
    return path

@contextmanager
def writer_lock(root):
    lock = owned(root, ".writer.lock")
    try: descriptor = os.open(lock, os.O_CREAT | os.O_EXCL | os.O_WRONLY, 0o600)
    except FileExistsError: raise ValueError("Pilot writer already active or stale lock needs explicit review.") from None
    try:
        os.write(descriptor, str(os.getpid()).encode())
        os.close(descriptor)
        yield
    finally:
        lock.unlink(missing_ok=True)

def atomic_json(path, value):
    temporary = None
    text = canonical(value) + "\n"
    if len(text.encode()) > 4 * 1024 * 1024: raise ValueError("Pilot metadata exceeds bound.")
    try:
        with tempfile.NamedTemporaryFile(mode="w", encoding="utf-8", dir=path.parent, suffix=".tmp", delete=False) as stream:
            temporary = Path(stream.name)
            stream.write(text); stream.flush(); os.fsync(stream.fileno())
        os.replace(temporary, path)
        temporary = None
    finally:
        if temporary: temporary.unlink(missing_ok=True)

def read_json(path):
    if path.stat().st_size > 4 * 1024 * 1024: raise ValueError("Pilot metadata exceeds bound.")
    return json.loads(path.read_text(encoding="utf-8"))

def prepare(root):
    root = Path(root).resolve()
    root.mkdir(parents=True, exist_ok=True)
    for name in ["raw", "decoded"]: owned(root, name).mkdir(exist_ok=True)
    with writer_lock(root):
        plan = build_plan()
        manifest = owned(root, "manifest.json")
        if manifest.exists() and read_json(manifest) != plan: raise ValueError("Pilot manifest changed; use a separately reviewed version.")
        if not manifest.exists(): atomic_json(manifest, plan)
        ledger = owned(root, "ledger.json")
        if not ledger.exists(): atomic_json(ledger, {"schemaVersion": 1, "manifestSha256": plan_digest(plan), "entries": []})
        load_state(root)
    return plan

def load_state(root):
    plan = read_json(owned(root, "manifest.json"))
    if plan != build_plan(): raise ValueError("Unreviewed pilot manifest.")
    ledger = read_json(owned(root, "ledger.json"))
    if ledger.get("schemaVersion") != 1 or ledger.get("manifestSha256") != plan_digest(plan) or not isinstance(ledger.get("entries"), list):
        raise ValueError("Invalid pilot checkpoint ledger.")
    expected = {chunk["chunkId"] for chunk in plan["chunks"]}
    seen = set()
    for entry in ledger["entries"]:
        if entry.get("chunkId") not in expected or entry["chunkId"] in seen or entry.get("complete") is not True:
            raise ValueError("Invalid/duplicate/incomplete checkpoint.")
        seen.add(entry["chunkId"])
        for key in ["rawSha256", "decodedSha256"]:
            value = entry.get(key, "")
            if len(value) != 64 or any(character not in "0123456789abcdef" for character in value): raise ValueError("Invalid checkpoint checksum.")
    return plan, ledger

def check_inventory(root, raw_limit=RAW_LIMIT):
    root = Path(root).resolve()
    raw = scratch = 0
    for path in root.rglob("*"):
        if path.is_symlink(): raise ValueError("Pilot inventory contains a symbolic link.")
        if path.is_file():
            size = path.stat().st_size
            scratch += size
            if path.is_relative_to(owned(root, "raw")): raw += size
    if raw > raw_limit or scratch > SCRATCH_LIMIT: raise ValueError("Pilot retained-raw/scratch limit exceeded.")
    return {"retainedRawBytes": raw, "scratchBytes": scratch}

def peak_rss_bytes():
    if os.name != "nt":
        import resource
        return int(resource.getrusage(resource.RUSAGE_SELF).ru_maxrss * (1 if sys.platform == "darwin" else 1024))
    import ctypes
    from ctypes import wintypes
    class Counters(ctypes.Structure):
        _fields_ = [("cb", wintypes.DWORD), ("PageFaultCount", wintypes.DWORD)] + [(name, ctypes.c_size_t) for name in ["PeakWorkingSetSize", "WorkingSetSize", "QuotaPeakPagedPoolUsage", "QuotaPagedPoolUsage", "QuotaPeakNonPagedPoolUsage", "QuotaNonPagedPoolUsage", "PagefileUsage", "PeakPagefileUsage"]]
    counters = Counters(); counters.cb = ctypes.sizeof(counters)
    kernel = ctypes.WinDLL("kernel32", use_last_error=True)
    kernel.GetCurrentProcess.restype = wintypes.HANDLE
    psapi = ctypes.WinDLL("psapi", use_last_error=True)
    psapi.GetProcessMemoryInfo.argtypes = [wintypes.HANDLE, ctypes.POINTER(Counters), wintypes.DWORD]
    if not psapi.GetProcessMemoryInfo(kernel.GetCurrentProcess(), ctypes.byref(counters), counters.cb): raise OSError("Cannot measure process memory.")
    return int(counters.PeakWorkingSetSize)

def run_deadline_process(command, timeout_seconds=BATCH_SECONDS, output_directory=None):
    """CLI operations get a hard worker deadline, including native netCDF reads.

    Worker stdout is task-controlled JSON, capped before loading into memory.
    stderr is suppressed so a future account client cannot print credentials.
    A killed worker leaves untracked files/stale lock for explicit review.
    """
    if not 0 < timeout_seconds <= BATCH_SECONDS: raise ValueError("Invalid worker deadline.")
    with tempfile.TemporaryFile(dir=output_directory) as output:
        process = subprocess.Popen(command, stdout=output, stderr=subprocess.DEVNULL)
        try:
            process.wait(timeout=timeout_seconds)
        except subprocess.TimeoutExpired:
            process.kill()
            try: process.wait(timeout=5)
            except subprocess.TimeoutExpired: raise ValueError("Worker could not stop; review it before another batch.") from None
            raise ValueError("Pilot worker deadline exceeded; review stale lock/untracked files before resuming.") from None
        if process.returncode != 0: raise ValueError("Pilot worker rejected the chunk; review its source and checkpoint state.")
        output.seek(0)
        text = output.read(16 * 1024 + 1)
        if len(text) > 16 * 1024: raise ValueError("Pilot worker report exceeds bound.")
        return json.loads(text)

def checkpoint_existing(root, chunk_id, source):
    root = Path(root).resolve()
    with writer_lock(root):
        return _checkpoint_existing_locked(root, chunk_id, source)

def _checkpoint_existing_locked(root, chunk_id, source, *, deadline_started=None):
    root, source = Path(root).resolve(), Path(source).resolve()
    started, cpu_started = time.monotonic(), time.process_time()
    deadline_start = started if deadline_started is None else deadline_started
    lock = owned(root, ".writer.lock")
    if not lock.is_file() or lock.stat().st_size > 20 or lock.read_text() != str(os.getpid()):
        raise ValueError("Shared checkpoint helper requires this process to own the writer lock.")
    def require_time():
        if time.monotonic() - deadline_start >= BATCH_SECONDS: raise ValueError("Pilot processing batch exceeded deadline.")
    plan, ledger = load_state(root)
    chunk = next((row for row in plan["chunks"] if row["chunkId"] == chunk_id), None)
    if not chunk: raise ValueError("Chunk is outside reviewed pilot.")
    inventory = check_inventory(root)
    source_bytes = source.stat().st_size
    if source_bytes > MAX_RAW_BYTES: raise ValueError("Raw source chunk exceeds limit.")
    checksum = digest(source)
    require_time()
    existing = next((row for row in ledger["entries"] if row["chunkId"] == chunk_id), None)
    if existing:
        verify_entry(root, existing)
        require_time()
        if existing["rawSha256"] != checksum: raise ValueError("Source revision changed; do not replace completed checkpoint.")
        return existing
    if inventory["retainedRawBytes"] + source_bytes > RAW_LIMIT or inventory["scratchBytes"] + source_bytes + 4 * 1024 * 1024 > SCRATCH_LIMIT:
        raise ValueError("Insufficient pilot budget for this chunk.")
    raw = owned(root, f"raw/{chunk_id}.nc")
    decoded = owned(root, f"decoded/{chunk_id}.jsonl")
    if raw.exists() or decoded.exists(): raise ValueError("Untracked/interrupted chunk files need explicit review; not reused.")
    request = chunk["request"]
    allowed_hours = {f"{request['year'][0]}-{request['month'][0]}-{day}T{hour}:00Z" for day in request["day"] for hour in request["time"]}
    iterator = read_chunk(source)
    try:
        header = next(iterator)
        expected_cells = {tuple(cell) for cell in plan["cellCoverage"][chunk["region"]]["cells"]}
        if {(row["latitude"], row["longitude"]) for row in header["cells"]} != expected_cells: raise ValueError("Downloaded grid differs from reviewed request.")
        stamps = []
        for row in iterator:
            if time.monotonic() - deadline_start >= BATCH_SECONDS: raise ValueError("Pilot processing batch exceeded deadline.")
            if row["atUtc"] not in allowed_hours: raise ValueError("Source timestamp is outside its requested chunk.")
            stamps.append(row["atUtc"])
    finally: iterator.close()
    # Source validation happens before copying into retained pilot storage.
    temporary = None
    try:
        with tempfile.NamedTemporaryFile(dir=raw.parent, suffix=".tmp", delete=False) as output:
            temporary = Path(output.name)
            copied = 0
            with source.open("rb") as input_stream:
                for block in iter(lambda: input_stream.read(65536), b""):
                    copied += len(block)
                    if copied > MAX_RAW_BYTES or time.monotonic() - deadline_start >= BATCH_SECONDS: raise ValueError("Copy byte/time limit exceeded.")
                    output.write(block)
            output.flush(); os.fsync(output.fileno())
        if digest(temporary) != checksum: raise ValueError("Source changed during copy.")
        export_chunk(temporary, decoded)
        if time.monotonic() - deadline_start >= BATCH_SECONDS: raise ValueError("Decode batch exceeded deadline.")
        os.replace(temporary, raw); temporary = None
        measured = check_inventory(root)
        decoded_checksum = digest(decoded)
        memory_peak = peak_rss_bytes()
        require_time()
        entry = {"chunkId": chunk_id, "complete": True, "rawSha256": checksum, "decodedSha256": decoded_checksum,
            "sourceRevision": header["experimentVersions"], "sourceRows": len(stamps), "expectedRows": chunk["expectedHours"], "missingSourceHours": chunk["expectedHours"] - len(stamps),
            "rawBytes": raw.stat().st_size, "decodedBytes": decoded.stat().st_size,
            "processingSeconds": time.monotonic() - started, "cpuSeconds": time.process_time() - cpu_started, "processPeakRssBytes": memory_peak,
            "inventoryAfter": measured, "pythonVersion": platform.python_version(), "decoderVersions": header["decoderVersions"],
            "queueSeconds": None, "downloadSeconds": None, "retrievalMode": "existing-local-file"}
        ledger["entries"].append(entry)
        require_time()
        atomic_json(owned(root, "ledger.json"), ledger)
        return entry
    finally:
        if temporary: temporary.unlink(missing_ok=True)

def verify_entry(root, entry):
    for directory, suffix, key, ceiling in [("raw", "nc", "rawSha256", MAX_RAW_BYTES), ("decoded", "jsonl", "decodedSha256", 4 * 1024 * 1024)]:
        path = owned(root, f"{directory}/{entry['chunkId']}.{suffix}")
        if not path.is_file() or path.stat().st_size > ceiling or digest(path) != entry[key]: raise ValueError("Completed checkpoint missing, oversized or changed.")

def status(root):
    plan, ledger = load_state(root)
    inventory = check_inventory(root)
    for entry in ledger["entries"]: verify_entry(root, entry)
    complete = {entry["chunkId"] for entry in ledger["entries"]}
    return {"year": 2025, "sampleKind": "sample-only", "plannedChunks": len(plan["chunks"]), "completedChunks": len(complete),
        "remainingChunks": [row["chunkId"] for row in plan["chunks"] if row["chunkId"] not in complete],
        "inventory": inventory, "measuredChunks": ledger["entries"], "isFullYearReady": len(complete) == len(plan["chunks"])}

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("action", choices=["prepare", "status", "import", "import-worker"])
    parser.add_argument("--root", type=Path, default=Path(".data/era5/pilot-2025"))
    parser.add_argument("--chunk")
    parser.add_argument("--source", type=Path)
    args = parser.parse_args()
    if args.action == "prepare":
        prepare(args.root)
        result = status(args.root)
    elif args.action in {"import", "import-worker"}:
        if not args.chunk or not args.source: parser.error("import requires --chunk and --source")
        if args.action == "import":
            result = run_deadline_process([sys.executable, str(Path(__file__).resolve()), "import-worker", "--root", str(args.root.resolve()), "--chunk", args.chunk, "--source", str(args.source.resolve())], output_directory=args.root)
        else:
            result = checkpoint_existing(args.root, args.chunk, args.source)
    else: result = status(args.root)
    print(json.dumps(result, indent=2, allow_nan=False))
