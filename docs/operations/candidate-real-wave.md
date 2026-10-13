Current regional expansion evidence is in [spot-expansion-wave.md](spot-expansion-wave.md): 1,327 candidates, including ways, with deterministic offline rebuilding. The 13 October record below remains retained as earlier evidence; the regional distribution preparation follows it.

# Bounded real OSM candidate wave — 13 October 2026

Task 0B/8 remains partial, with a completed tiny real node pilot. The retained Geofabrik India PBF is 1,709,857,118 bytes, downloaded 11 October; its actual upstream snapshot timestamp remains unverified. No database, paid worker, global archive or production enablement was performed. One separately authorized small offline Overpass request is recorded below.

Both approved scans stopped without publishing a regional artifact. Run v1 reached 120.019 seconds; its 4,268,032-byte peak measured the Windows venv launcher and is not valid worker memory evidence. After correcting supervision to the actual base interpreter with existing environment package paths, run v2 reached 120.012 seconds and measured 45,502,464 bytes peak worker RSS. Neither completed hashing/selection/publication within the deadline; input checksum, candidate count, regional query and real MCP coverage remain unknown. No Python import process remained on reconciliation. Local `.data/osm/*run.json` reports preserve both outcomes. No third India scan is authorized by this record.

Smaller-source research: [Geofabrik India](https://download.geofabrik.de/asia/india.html) lists no subregion below 25 MiB (smallest North-Eastern Zone is 104 MB; Northern 213 MB and Southern 532 MB). The [OSMF core API policy](https://operations.osmfoundation.org/policies/api/) describes its API as an editing service and points read-only use toward alternatives including Overpass. [Overpass official manual](https://dev.overpass-api.de/overpass-doc/en/preface/commons.html) identifies the public endpoint and cautions against using it as an application backend. The completed request is an offline source spike only.

## Completed tiny real pilot

`scripts/osm/overpass_pilot.ts` made exactly one HTTPS POST read query to `https://overpass-api.de/api/interpreter`, no retry/fallback, with server 60-second/32-MiB limits and local 90-second/2-MiB-decoded/10,000-row limits. Query selects allowed named nodes in three smaller boxes listed in checked-in provenance. Complete JSON, source timestamp, no error/partial remark, row type and coordinates were validated before normalization/publication.

| Measurement | Result |
|---|---|
| Retrieved | 2026-10-13T17:18:03.894Z |
| Source OSM timestamp | 2026-10-13T17:17:04Z |
| Decoded reply | 10,239 bytes |
| Normalized artifact | 9,624 bytes, 59 nodes |
| Region counts | Hanle 20; Kodaikanal 14; Munnar 25 |
| Candidate categories | Campground 21; park 4; viewpoint 34 |
| Request/read/normalize time | 1.0854 seconds |
| Artifact SHA-256 | `7d07f347d8e5dfff06cdfc59a72e262b61760528bd5cac14b091f75e26f23755` |
| Reply SHA-256 | `61d45828f7df9de079a61b5be10a939c3c5a0e40ff6c726133d1bf4ee407d7f4` |

Exact minimal artifact, query, provenance and ODbL database-offer notice: `tests/osm/fixtures/real-three-boxes/`. Raw successful reply is retained locally in `.data/osm/overpass-three-boxes-20261013-v1/`; no contributor metadata is selected. The fixture directory provides the complete machine-readable derivative database separately from application-code licensing. Root authorized checking this freely licensed dataset into the repository; public service release still needs its durable active-version offer/link verified.

Two deterministic real-pilot tests normalize the installed exact records repeatably and exercise actual local HTTP MCP resolve → candidate search → named-destination plan → three-option comparison, with injected unavailable fixture weather and no external calls. All three named destinations return candidates (limited to ten at 20 km), unknown access, OSM node links and distance/completeness order. Hanle beach-only one-km request honestly returns `not-covered`, without claiming absence of suitable places. This journey plans the resolved GeoNames destinations; planning directly at OSM candidate IDs is not implemented and must not be advertised.

Desktop benchmark (`scripts/osm/benchmark_real_pilot.ts`, Node v24.14.0): checked loader 7.27 ms; first searches Hanle 2.00 ms/Kodaikanal 0.159 ms/Munnar 0.105 ms; thirty warm runs per place p50 0.175/0.137/0.103 ms and p95 0.619/0.305/0.147 ms. Process peak RSS 90,439,680 bytes. These measure this tiny Windows desktop fixture only, not the selected Linux host or all runtime indexes together.

The previous importer calls `apply_file(locations=True, idx="dense_file_array")`, builds node-location scratch and assembles areas. That is unsuitable for an unbounded India trial. Reconciliation found no active OSM import process or completed regional artifact; the PBF and prior 718-byte fixture are retained.

## Reusable bounded path

`scripts/osm/bounded_nodes.py` streams only OSM nodes through pyosmium FileProcessor, without a location index or geometry scratch. It selects named allowed candidate types inside these west/south/east/north boxes:

| Region | Box |
|---|---|
| Hanle | 78.7, 32.55, 79.2, 33.1 |
| Kodaikanal | 77.25, 10.05, 77.75, 10.5 |
| Munnar | 76.8, 9.85, 77.3, 10.3 |

This is deliberately incomplete node-only coverage: ways, relations, geometry and outside-box features are omitted. Empty node results cannot establish absence of parks or observing places. Candidate tags never establish public/night access, darkness or safety. Runtime ranking remains category preference then distance/completeness, or distance/completeness alone.

The Windows supervisor caps hash plus scan at 120 seconds, peak worker RSS at 512 MiB (polled every 20 ms), retained candidates at 10,000 and artifact payload at 2 MiB. A memory allocation can briefly exceed the RSS threshold between samples; this is a measured process monitor, not an OS memory quota. No raw-extract copy or location-cache scratch is created. Output staging is bounded to 2 MiB plus a small metadata report. Source identity/size/mtime checks surround hashing and selection. Successful artifacts use a fresh version path; prior artifacts are never overwritten. Failed/timeout runs do not publish a candidate artifact. The supervisor is Windows-only; Linux build supervision is not validated.

The loader now accepts optional `maxArtifactBytes` and `expectedSha256` arguments, checks the opened file rather than a separate path stat, and caps actual bytes read even if the file grows. A pilot must use 2 MiB and its reviewed checksum. This is not automatic production enablement.

Reproduction (from the worktree, existing environment; use a new version filename):

```powershell
.data/osm/venv/Scripts/python.exe scripts/osm/bounded_nodes.py .data/osm/india-latest.osm.pbf .data/osm/candidates-three-boxes-node-20261013-v2.json --vintage 'Retained Geofabrik India extract downloaded 2026-10-11; upstream snapshot timestamp unverified'
.data/osm/venv/Scripts/python.exe -m unittest discover -s tests/osm -p 'test_*.py'
node --import tsx --test tests/places/osmIndex.test.ts tests/places/osmCandidates.test.ts tests/places/osmMcp.test.ts
```

Tests: 6 Python cases, 19 existing TypeScript candidate/index/MCP cases, 3 offline request-bound tests and 2 real-pilot tests pass. They cover deterministic node-only bbox filtering, attribution, candidate cap, wall and memory stops, preservation of previous output, loader byte/checksum bounds, partial-response rejection, decoded-response cap, exact fixture normalization and the three-place MCP journey. New CI files are `tests/osm/overpassPilot.test.ts` and `tests/places/osmRealPilot.test.ts`.

## Public-release ODbL steps

Primary sources checked 13 October: [OSMF attribution guidelines](https://osmfoundation.org/wiki/Licence/Attribution_Guidelines), [ODbL 1.0 sections 4.2–4.6](https://opendatacommons.org/licenses/odbl/1-0/), [Geofabrik India source](https://download.geofabrik.de/asia/india.html).

The attribution guidelines require readable credit and a route to source/licence information; databases should carry notices in metadata or accompanying documentation. ODbL 4.4 requires applicable publicly used derivative databases to use ODbL-compatible terms; 4.6 requires a machine-readable offer of the database or all alterations/method, free over the internet. Internal use is distinguished under 4.5(c). This is a compliance proposal, not legal certification.

Before public candidate service or artifact distribution, conservatively treat the normalized OSM artifact as a derivative database: preserve OpenStreetMap/ODbL metadata and link visible result attribution; publish the exact versioned candidate JSON plus checksum and provenance under ODbL at a durable freely accessible download, linked beside candidate results/rights documentation. Publish the reproducible selector and coverage omissions as well. Keep this OSM database separable from GeoNames/climate data and application-code licences. Resolve Gate 0A interpretation and verify the actual public offer and host attribution before release; local build alone does not close that gate.

Remaining Task 8 gates: full region/way/relation coverage if required; direct OSM candidate planning integration; public rights/active-version offer verification; immutable deployment/version switching and rollback; selected 2-vCPU/4-GB host measurements with all indexes, disk headroom and concurrent cold/warm latency. Tiny node-pilot extraction, vintage/hash provenance, regional counts, repeatable normalization and named-destination candidate/plan/compare are complete locally. Default candidate discovery remains unavailable without an explicitly installed index.

---

# Regional data distribution preparation

The regional source response and transformed candidate database are retained under ODbL 1.0 in `tests/osm/fixtures/real-regional-wave/`. The fixture README states the independent data license, original attribution, exact source and output checksums, coverage and reproducible transformation. Software license declarations do not replace this data license.

Attribution text: **© OpenStreetMap contributors. Data available under the Open Database License (ODbL).** Link it to [OSM copyright](https://www.openstreetmap.org/copyright) and link distributed data directly to [ODbL 1.0](https://opendatacommons.org/licenses/odbl/1-0/). OSM's copyright guidance requires visible attribution and identification of the data license.

ODbL section 4.6 provides an access obligation for publicly used derivative databases/produced works. Preparation here retains the entire transformed database plus selected source response, query and transformation code; it is intended to support offering a machine-readable derivative database under the same license. This preparation is not a public distribution endpoint or a legal determination about combining independent datasets.

Before public use, the release owner should publish a stable downloadable bundle containing `candidates.json`, `response.json`, `query.ql`, `provenance.json`, the attribution/license notice and the transformation instructions/code. Its notice should identify the matching reviewed source/output SHA-256 and link to a functioning public download. Keep this database distinct from independent climate/location data so recipients can obtain the OSM derivative separately. Verify that the deployed source attribution and actual public offer refer to the installed version. No public endpoint or deployment was created in this wave.

The selected features are candidates, not permission to enter or observe at night. The source coverage says way coordinates are Overpass bounding-box centers, not entrances; access and permission are unknown. The named-place planning contract remains unchanged pending the root agent's integration decision.
