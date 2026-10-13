#!/usr/bin/env python3
"""Build a compact, source-linked candidate index from an OSM PBF/XML extract."""

from __future__ import annotations

import argparse
import hashlib
import json
import os
import tempfile
import time
import unicodedata
from pathlib import Path
from typing import Any

import osmium


OSM_SOURCE = {
    "name": "OpenStreetMap contributors",
    "url": "https://www.openstreetmap.org/copyright",
    "attribution": "© OpenStreetMap contributors. Data available under the Open Database License (ODbL).",
    "dataClass": "catalog",
    "product": "OpenStreetMap candidate place features",
    "licenseUrl": "https://opendatacommons.org/licenses/odbl/1-0/",
}


def clean_text(value: str | None) -> str | None:
    if not value:
        return None
    normalized = unicodedata.normalize("NFKC", value)
    normalized = " ".join("".join(" " if unicodedata.category(char).startswith("C") else char for char in normalized).split())
    if not normalized:
        return None
    chars: list[str] = []
    utf16_units = 0
    for char in normalized:
        units = 2 if ord(char) > 0xFFFF else 1
        if utf16_units + units > 160:
            break
        chars.append(char)
        utf16_units += units
    return "".join(chars)


def category_for(tags: dict[str, str]) -> str | None:
    if tags.get("leisure") == "park":
        return "park"
    if tags.get("tourism") == "viewpoint":
        return "viewpoint"
    if tags.get("boundary") == "national_park" or tags.get("leisure") == "nature_reserve" or "protect_class" in tags:
        return "protected-area"
    if tags.get("tourism") in {"camp_site", "caravan_site"}:
        return "campground"
    if tags.get("natural") == "beach":
        return "beach"
    return None


def centroid(points: list[tuple[float, float]]) -> tuple[float, float] | None:
    if len(points) > 1 and points[0] == points[-1]:
        points = points[:-1]
    if not points:
        return None
    return (sum(point[0] for point in points) / len(points), sum(point[1] for point in points) / len(points))


class CandidateHandler(osmium.SimpleHandler):
    def __init__(self) -> None:
        super().__init__()
        self.candidates: dict[tuple[str, int], dict[str, Any]] = {}

    def add(self, osm_type: str, osm_id: int, tags: dict[str, str], latitude: float, longitude: float) -> None:
        category = category_for(tags)
        name = clean_text(tags.get("name") or tags.get("name:en") or tags.get("official_name"))
        if category is None or name is None:
            return
        completeness = min(3, 1 + sum(bool(clean_text(tags.get(key))) for key in ("website", "access", "opening_hours")))
        self.candidates[(osm_type, osm_id)] = {
            "osmType": osm_type,
            "osmId": osm_id,
            "name": name,
            "category": category,
            "latitude": round(latitude, 6),
            "longitude": round(longitude, 6),
            "sourceCompleteness": completeness,
        }

    @staticmethod
    def tags_as_dict(tags: Any) -> dict[str, str]:
        return {tag.k: tag.v for tag in tags}

    def node(self, node: Any) -> None:
        if node.location.valid():
            self.add("node", node.id, self.tags_as_dict(node.tags), node.location.lat, node.location.lon)

    def way(self, way: Any) -> None:
        points = [(node.location.lat, node.location.lon) for node in way.nodes if node.location.valid()]
        center = centroid(points)
        if center:
            self.add("way", way.id, self.tags_as_dict(way.tags), *center)

    def area(self, area: Any) -> None:
        points = [
            (node.location.lat, node.location.lon)
            for ring in area.outer_rings()
            for node in ring
            if node.location.valid()
        ]
        center = centroid(points)
        if center:
            osm_type = "way" if area.from_way() else "relation"
            self.add(osm_type, area.orig_id(), self.tags_as_dict(area.tags), *center)


def convert_osm_file(input_path: Path, output_path: Path, *, vintage: str, coverage: str) -> dict[str, Any]:
    start = time.perf_counter()
    input_path = Path(input_path)
    output_path = Path(output_path)
    if not input_path.is_file():
        raise FileNotFoundError(input_path)
    if not vintage.strip() or not coverage.strip():
        raise ValueError("Both dataset vintage and coverage label are required.")

    handler = CandidateHandler()
    handler.apply_file(str(input_path), locations=True, idx="dense_file_array")
    candidates = [handler.candidates[key] for key in sorted(handler.candidates)]
    source = {**OSM_SOURCE, "vintage": vintage.strip()}
    document = {
        "schemaVersion": 1,
        "vintage": vintage.strip(),
        "coverage": coverage.strip(),
        "source": source,
        "candidates": candidates,
    }

    output_path.parent.mkdir(parents=True, exist_ok=True)
    temp_path: Path | None = None
    try:
        with tempfile.NamedTemporaryFile("w", encoding="utf-8", newline="\n", dir=output_path.parent, prefix=f"{output_path.name}.", suffix=".tmp", delete=False) as output:
            temp_path = Path(output.name)
            json.dump(document, output, ensure_ascii=False, separators=(",", ":"), sort_keys=True)
            output.write("\n")
            output.flush()
            os.fsync(output.fileno())
        os.replace(temp_path, output_path)
    finally:
        if temp_path and temp_path.exists():
            temp_path.unlink()

    digest = hashlib.sha256(output_path.read_bytes()).hexdigest()
    return {
        "candidateCount": len(candidates),
        "inputBytes": input_path.stat().st_size,
        "outputBytes": output_path.stat().st_size,
        "outputSha256": digest,
        "elapsedSeconds": round(time.perf_counter() - start, 3),
        "vintage": vintage.strip(),
        "coverage": coverage.strip(),
    }


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("input", type=Path, help="OSM .pbf or .osm XML extract")
    parser.add_argument("output", type=Path, help="Destination compact candidate JSON index")
    parser.add_argument("--vintage", required=True, help="Source extract vintage or snapshot timestamp")
    parser.add_argument("--coverage", required=True, help="Human-readable extract coverage label")
    args = parser.parse_args()
    print(json.dumps(convert_osm_file(args.input, args.output, vintage=args.vintage, coverage=args.coverage), sort_keys=True))


if __name__ == "__main__":
    main()
