# Licensed real regional wave

© OpenStreetMap contributors. The data files in this folder are available under the [Open Database License 1.0](https://opendatacommons.org/licenses/odbl/1-0/), independently of the repository software license. [OSM copyright and attribution](https://www.openstreetmap.org/copyright).

This is real public source data retained for offline deterministic rebuilding, not invented test data. `response.json` retains the selected source elements and tags, `query.ql` the precise bounded extraction, `candidates.json` the transformed database, and `provenance.json` the timestamp, bounds, hashes and measurement. `desktop-runtime.json` is a separate local measurement, not target-host acceptance.

Source vintage: 2026-10-13T18:47:51Z. 1,327 candidates: 185 nodes and 1,142 ways. Selected ways use supplied Overpass bounding-box centers. These points can be outside an irregular polygon or source selection box; they are not entrances, centroids or evidence of safe/legal nighttime access. Relations, unnamed features and the rest of the world are excluded.

Source SHA-256: `ff62e1f4fc812e12ae32bb04e4fac6c78995dc6ca09d66b1ccd306e3221efff4`.

Candidate SHA-256: `e542a89ac7094acbd02f18dd7ea559001e21a4778214379b08839e1e553265ef`.

Offline rebuild (use a new output directory each time):

```powershell
npx tsx scripts/osm/regional_wave.ts rebuild .data/osm/regional-rebuild-v3 tests/osm/fixtures/real-regional-wave/response.json ff62e1f4fc812e12ae32bb04e4fac6c78995dc6ca09d66b1ccd306e3221efff4
```

The source bytes are capped before allocation and while reading; a checksum mismatch refuses publication. A rebuild from these bytes produces the exact reviewed candidate hash. Do not remove this attribution or replace retained files in place.

## Public download status

The repository is private (verified 14 October 2026). These licensed machine-readable files prepare an exact database offer for internal development; pushing this private branch does not establish a publicly accessible free download. Before a public candidate service, publish the exact active version with checksum/provenance/ODbL notice at a durable free URL and verify unauthenticated access. No repository visibility or deployment setting was changed in this wave.
