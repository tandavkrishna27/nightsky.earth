import json
import sys
import tempfile
import unittest
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[2] / "scripts" / "osm"))
from import_candidates import convert_osm_file


FIXTURE = Path(__file__).parent / "fixtures" / "candidates.osm"


class ImportCandidatesTest(unittest.TestCase):
    def convert(self, output: Path) -> dict:
        return convert_osm_file(
            FIXTURE,
            output,
            vintage="2026-10-09T20:21:04Z",
            coverage="Fixture region",
        )

    def test_extracts_only_named_candidate_features_with_source_identity(self):
        with tempfile.TemporaryDirectory() as folder:
            output = Path(folder) / "candidate-index.json"
            summary = self.convert(output)
            index = json.loads(output.read_text(encoding="utf-8"))

        self.assertEqual(summary["candidateCount"], 2)
        self.assertEqual([(row["osmType"], row["osmId"]) for row in index["candidates"]], [("node", 6), ("way", 8)])
        self.assertEqual([row["category"] for row in index["candidates"]], ["viewpoint", "park"])

    def test_calculates_way_candidate_center_from_pbf_geometry(self):
        with tempfile.TemporaryDirectory() as folder:
            output = Path(folder) / "candidate-index.json"
            self.convert(output)
            index = json.loads(output.read_text(encoding="utf-8"))

        park = next(row for row in index["candidates"] if row["osmId"] == 8)
        self.assertAlmostEqual(park["latitude"], 18.5209, places=4)
        self.assertAlmostEqual(park["longitude"], 73.8572, places=4)

    def test_repeated_imports_produce_identical_candidate_indexes(self):
        with tempfile.TemporaryDirectory() as folder:
            first = Path(folder) / "first.json"
            second = Path(folder) / "second.json"
            self.convert(first)
            self.convert(second)
            self.assertEqual(first.read_bytes(), second.read_bytes())


if __name__ == "__main__":
    unittest.main()
