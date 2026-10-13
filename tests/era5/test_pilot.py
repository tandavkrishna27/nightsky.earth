import importlib.util
from pathlib import Path
import sys
import tempfile
import unittest
import json
import time
from unittest.mock import patch
import netCDF4
import numpy as np

def hanle_fixture(path):
    with netCDF4.Dataset(path, "w") as ds:
        for name, size in [("valid_time", 2), ("latitude", 2), ("longitude", 2)]: ds.createDimension(name, size)
        t = ds.createVariable("valid_time", "f8", ("valid_time",)); t.units = "hours since 2025-01-01 00:00:00"; t[:] = [0, 1]
        ds.createVariable("latitude", "f8", ("latitude",))[:] = [32.75, 33]
        ds.createVariable("longitude", "f8", ("longitude",))[:] = [78.75, 79]
        cloud = ds.createVariable("tcc", "f8", ("valid_time", "latitude", "longitude")); cloud.units = "1"; cloud.standard_name = "cloud_area_fraction"; cloud[:] = 0.25
        ds.createVariable("number", "i4").assignValue(0)
        ds.createVariable("expver", str, ("valid_time",))[:] = np.array(["0001", "0001"], dtype=object)

SCRIPT_DIR = Path(__file__).resolve().parents[2] / "scripts/era5"
sys.path.insert(0, str(SCRIPT_DIR))
import pilot
from test_read_chunks import fixture

class PilotTests(unittest.TestCase):
    def test_plan_covers_one_year_with_disjoint_edge_padding(self):
        plan = pilot.build_plan(2025)
        self.assertEqual(len(plan["chunks"]), 28)
        self.assertEqual(plan["totalCells"], 10)
        for region in ["hanle", "kodaikanal-munnar"]:
            chunks = [row for row in plan["chunks"] if row["region"] == region]
            self.assertEqual(sum(row["expectedHours"] for row in chunks), 8760 + 96)
            self.assertEqual(chunks[0]["request"]["day"], ["30", "31"])
            self.assertEqual(chunks[-1]["request"]["day"], ["01", "02"])
        self.assertEqual(next(row for row in plan["chunks"] if row["chunkId"] == "hanle-2025-02")["expectedHours"], 672)

    def test_prepare_is_idempotent_and_rejects_changed_manifest(self):
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory) / "pilot"
            pilot.prepare(root)
            self.assertEqual(pilot.prepare(root)["year"], 2025)
            manifest = root / "manifest.json"
            data = json.loads(manifest.read_text())
            data["year"] = 2026
            manifest.write_text(json.dumps(data))
            with self.assertRaises(ValueError): pilot.prepare(root)

    def test_writer_lock_and_inventory_bounds_fail_closed(self):
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory) / "pilot"
            pilot.prepare(root)
            with pilot.writer_lock(root):
                with self.assertRaises(ValueError):
                    with pilot.writer_lock(root): pass
            (root / "raw" / "example.nc").write_bytes(b"x" * 20)
            with self.assertRaises(ValueError): pilot.check_inventory(root, raw_limit=10)

    def test_wrong_grid_or_date_never_creates_a_completed_checkpoint(self):
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory) / "pilot"
            source = Path(directory) / "bad.nc"
            pilot.prepare(root)
            fixture(source)
            with self.assertRaises(ValueError): pilot.checkpoint_existing(root, "hanle-2025-01", source)
            self.assertEqual(pilot.status(root)["completedChunks"], 0)
            self.assertFalse(list((root / "raw").glob("*.nc")))

    def test_unsafe_paths_and_untracked_files_are_not_reused(self):
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory) / "pilot"
            pilot.prepare(root)
            with self.assertRaises(ValueError): pilot.checkpoint_existing(root, "../escape", root / "anything")
            (root / "raw" / "hanle-2025-01.nc").write_text("untracked source")
            self.assertEqual(pilot.status(root)["completedChunks"], 0)

    def test_valid_resume_preserves_checkpoint_and_reports_missing_hours(self):
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory) / "pilot"
            source = Path(directory) / "source.nc"
            pilot.prepare(root); hanle_fixture(source)
            first = pilot.checkpoint_existing(root, "hanle-2025-01", source)
            self.assertEqual(first["missingSourceHours"], 742)
            self.assertEqual(pilot.checkpoint_existing(root, "hanle-2025-01", source), first)
            self.assertEqual(pilot.status(root)["completedChunks"], 1)
            with netCDF4.Dataset(source, "a") as ds: ds.variables["tcc"][:] = 0.5
            with self.assertRaises(ValueError): pilot.checkpoint_existing(root, "hanle-2025-01", source)

    def test_late_digest_cannot_publish_an_overdue_checkpoint(self):
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory) / "pilot"
            source = Path(directory) / "source.nc"
            pilot.prepare(root); hanle_fixture(source)
            original = pilot.digest
            def delayed(path):
                if str(path).endswith(".jsonl"): time.sleep(1.1)
                return original(path)
            plan = pilot.build_plan()
            with patch.object(pilot, "build_plan", return_value=plan), patch.object(pilot, "BATCH_SECONDS", 1), patch.object(pilot, "digest", delayed):
                with self.assertRaises(ValueError): pilot.checkpoint_existing(root, "hanle-2025-01", source)
            self.assertEqual(pilot.status(root)["completedChunks"], 0)

    def test_worker_deadline_interrupts_a_stalled_process(self):
        started = time.monotonic()
        with self.assertRaises(ValueError): pilot.run_deadline_process([sys.executable, "-c", "import time;time.sleep(10)"], timeout_seconds=0.05)
        self.assertLess(time.monotonic() - started, 3)

    def test_downloader_can_checkpoint_under_one_existing_lock(self):
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory) / "pilot"
            source = Path(directory) / "source.nc"
            pilot.prepare(root); hanle_fixture(source)
            with pilot.writer_lock(root):
                entry = pilot._checkpoint_existing_locked(root, "hanle-2025-01", source, deadline_started=time.monotonic())
                self.assertTrue(entry["complete"])
                self.assertTrue((root / ".writer.lock").exists())
            self.assertEqual(pilot.status(root)["completedChunks"], 1)

    def test_download_time_counts_against_shared_processing_deadline(self):
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory) / "pilot"
            source = Path(directory) / "source.nc"
            pilot.prepare(root); hanle_fixture(source)
            with pilot.writer_lock(root):
                with self.assertRaises(ValueError):
                    pilot._checkpoint_existing_locked(root, "hanle-2025-01", source, deadline_started=time.monotonic() - pilot.BATCH_SECONDS - 1)
            self.assertEqual(pilot.status(root)["completedChunks"], 0)

if __name__ == "__main__": unittest.main()
