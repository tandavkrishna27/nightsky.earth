"""Bounded fixture-only importer benchmark; never opens a regional extract."""
import ctypes
import json
import statistics
import tempfile
import time
from pathlib import Path

from import_candidates import convert_osm_file


def peak_rss_bytes():
    if hasattr(ctypes, "windll"):
        class Counters(ctypes.Structure):
            _fields_ = [("cb", ctypes.c_ulong), ("PageFaultCount", ctypes.c_ulong)] + [
                (name, ctypes.c_size_t) for name in (
                    "PeakWorkingSetSize", "WorkingSetSize", "QuotaPeakPagedPoolUsage",
                    "QuotaPagedPoolUsage", "QuotaPeakNonPagedPoolUsage", "QuotaNonPagedPoolUsage",
                    "PagefileUsage", "PeakPagefileUsage")]
        counters = Counters()
        counters.cb = ctypes.sizeof(counters)
        get_process = ctypes.windll.kernel32.GetCurrentProcess
        get_process.restype = ctypes.c_void_p
        read_memory = ctypes.windll.psapi.GetProcessMemoryInfo
        read_memory.argtypes = [ctypes.c_void_p, ctypes.c_void_p, ctypes.c_ulong]
        if not read_memory(get_process(), ctypes.byref(counters), counters.cb):
            raise ctypes.WinError()
        return counters.PeakWorkingSetSize
    return None  # Keep platform-specific units out of a portable report.


if __name__ == "__main__":
    fixture = Path(__file__).resolve().parents[2] / "tests/osm/fixtures/candidates.osm"
    durations = []
    with tempfile.TemporaryDirectory() as directory:
        for _ in range(20):
            start = time.perf_counter()
            summary = convert_osm_file(fixture, Path(directory) / "index.json",
                                       vintage="2026-10-09T20:21:04Z", coverage="Fixture region")
            durations.append(time.perf_counter() - start)
    print(json.dumps({"kind": "synthetic-fixture-only", "runs": len(durations),
                      "p50Seconds": statistics.median(durations),
                      "p95Seconds": sorted(durations)[18],
                      "processPeakRssBytes": peak_rss_bytes(), "lastImport": summary}, sort_keys=True))
