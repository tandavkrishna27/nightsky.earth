import importlib.util
import json
from pathlib import Path
import tempfile
import unittest
import netCDF4
import numpy as np

MODULE = Path(__file__).resolve().parents[2] / "scripts/era5/read_chunks.py"
spec = importlib.util.spec_from_file_location("read_chunks", MODULE)
reader = importlib.util.module_from_spec(spec)
spec.loader.exec_module(reader)

def fixture(path, values=(0.1, 0.5), times=(0, 1), units="1", calendar="standard"):
    with netCDF4.Dataset(path, "w") as ds:
        ds.createDimension("valid_time", 2)
        ds.createDimension("latitude", 1)
        ds.createDimension("longitude", 1)
        t = ds.createVariable("valid_time", "f8", ("valid_time",))
        t.units = "hours since 2025-01-01 00:00:00"
        t.calendar = calendar
        t[:] = times
        ds.createVariable("latitude", "f8", ("latitude",))[:] = [0]
        ds.createVariable("longitude", "f8", ("longitude",))[:] = [0]
        cloud = ds.createVariable("tcc", "f8", ("valid_time", "latitude", "longitude"), fill_value=-999)
        cloud.units = units
        cloud.standard_name = "cloud_area_fraction"
        cloud[:] = np.asarray(values).reshape(2, 1, 1)
        ds.createVariable("number", "i4").assignValue(0)
        ds.createVariable("expver", str, ("valid_time",))[:] = np.array(["0001", "0001"], dtype=object)
        ds.institution = "ECMWF"

class ReaderTests(unittest.TestCase):
    def test_stream_preserves_values_units_and_source_hash(self):
        with tempfile.TemporaryDirectory() as directory:
            path = Path(directory) / "source.nc"
            fixture(path)
            records = list(reader.read_chunk(path))
            self.assertEqual(records[0]["schemaVersion"], 1)
            self.assertEqual(records[1]["values"], [0.1])
            self.assertEqual(records[2]["atUtc"], "2025-01-01T01:00:00Z")
            self.assertEqual(len(records[0]["sourceSha256"]), 64)
            self.assertEqual(records[0]["experimentVersions"], ["0001"])

    def test_bad_units_time_range_calendar_and_decoded_bound(self):
        with tempfile.TemporaryDirectory() as directory:
            path = Path(directory) / "source.nc"
            for kwargs in [{"units": "%"}, {"times": (0, 0)}, {"times": (0, 0.5)}, {"values": (0, 1.1)}, {"calendar": "360_day"}]:
                fixture(path, **kwargs)
                with self.assertRaises(ValueError):
                    list(reader.read_chunk(path))
            fixture(path)
            with self.assertRaises(ValueError):
                list(reader.read_chunk(path, decoded_limit=1))

    def test_missing_nonfinite_and_hour_gaps_are_explicit(self):
        with tempfile.TemporaryDirectory() as directory:
            path = Path(directory) / "source.nc"
            fixture(path, values=(-999, float("nan")), times=(0, 2))
            records = list(reader.read_chunk(path))
            self.assertEqual(records[1]["values"], [None])
            self.assertEqual(records[2]["values"], [None])
            self.assertEqual(records[2]["atUtc"], "2025-01-01T02:00:00Z")

    def test_invalid_export_keeps_previous_checkpoint(self):
        with tempfile.TemporaryDirectory() as directory:
            source = Path(directory) / "source.nc"
            output = Path(directory) / "chunk.jsonl"
            output.write_text("old checkpoint", encoding="utf-8")
            fixture(source, values=(0, 2))
            with self.assertRaises(ValueError):
                reader.export_chunk(source, output)
            self.assertEqual(output.read_text(), "old checkpoint")
            fixture(source)
            reader.export_chunk(source, output)
            self.assertEqual(json.loads(output.read_text().splitlines()[0])["type"], "header")

    def test_east_and_west_longitude_source_conventions(self):
        with tempfile.TemporaryDirectory() as directory:
            path = Path(directory) / "source.nc"
            for longitude in [-120.25, 239.75]:
                fixture(path)
                with netCDF4.Dataset(path, "a") as ds:
                    ds.variables["longitude"][:] = [longitude]
                header = next(reader.read_chunk(path))
                self.assertEqual(header["cells"][0]["longitude"], -120.25)

if __name__ == "__main__":
    unittest.main()
