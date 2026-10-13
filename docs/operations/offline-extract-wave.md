# Bounded offline extract wave

This wave proves a small offline regional build, not global coverage or production capacity. The existing 1,327-row South India regional artifact remains separate. No retained 1.7 GB India source scan or automated Overpass request was made.

## Source and reproducibility

[Geofabrik Bhutan](https://download.geofabrik.de/asia/bhutan.html) listed the dated [2026-10-12 PBF](https://download.geofabrik.de/asia/bhutan-261012.osm.pbf) at 23,618,779 bytes (about 22.5 MiB), with source data through 2026-10-12T20:21:35Z. Retrieval actually completed at 2026-10-13T20:11:46.639424+00:00. Raw source is ignored in `.data/osm/bhutan-offline-20261014-v1/source.osm.pbf`. SHA-256: `6728f46b23ab722d9713af1b4a089d7c62290d9b28baa1fcb4348cd4afd1ba87`. No usernames, user IDs or changeset IDs are included in Geofabrik's public extracts.

The compact reviewed fixture and manifest are in `tests/osm/fixtures/real-offline-bhutan/`. Artifact: **134 named candidates, 20,933 bytes**, SHA-256 `d800a935abd54b8cda8e98d02c7e2bce50c7ca6f8e469cadfc735289704f41ff`.

Run acquisition explicitly with `.data/osm/venv/Scripts/python.exe scripts/osm/offline_extract.py acquire NEW_IGNORED_DIRECTORY`. It fetches only the pinned Bhutan URL; an HTTP HEAD must declare a positive Content-Length no greater than 100 MiB. GET must declare the same size; streamed bytes cannot exceed it and final length must match. The download worker is externally supervised at 90 seconds and 128 MiB peak working set, on Windows and Linux, in addition to a 15-second socket timeout and streamed deadline checks. Failed downloads remove only files created in the new acquisition directory. Existing directories and existing source files are refused.

The measured initial acquisition preceded addition of external download supervision: 3.926 seconds, byte cap and internal deadline verified, **no measured acquisition RSS or enforced external acquisition deadline claimed for that historical run**. Future acquisitions use the external supervisor. The processing measurement below used external supervision.

Build with `.data/osm/venv/Scripts/python.exe scripts/osm/offline_extract.py build NEW_BUILD_DIRECTORY` after copying the retained source and acquisition metadata there. The worker verifies the source digest and detects source size/mtime changes while selecting. Existing published/staged output is refused. A failed worker removes unpublished staging; only successful bounded workers promote candidates.

A second supervised build of the same retained immutable source, with no new download, completed in **46.840 seconds** at **179,916,800 bytes** peak working set and reproduced the exact candidate SHA-256. `rebuild-manifest.json` retains that measurement. Both builds used 60 seconds / 256 MiB limits.

## Geometry and overlap policy

Named candidate nodes and complete ways are selected using existing candidate tag categories. Sparse in-memory node locations avoid a dense array keyed by global IDs. A selected way is rejected if any referenced coordinate is missing or invalid; the fixture test covers this. No missing vertex is silently dropped. Way representatives are the arithmetic mean of vertices, omitting a repeated closing vertex. This is neither a guaranteed interior point nor an entrance. Relations are excluded; the manifest says so. This run found zero incomplete selected ways.

Cross-region merge is keyed by `(osmType, osmId)`: identical normalized rows collapse, conflicting rows fail closed. The overlap regression passes the same regional rows twice and proves identity deduplication, then proves differing coordinates require reconciliation. It does not establish geometry completeness across arbitrary extract boundaries. This wave processes one whole regional extract and does not create geographic tiles.

Access, night opening, permission, darkness, horizon and safety remain unknown. Thimphu and Punakha fixture queries return partial coverage, source attribution, distance ordering and unknown access/way entrances. Outside the installed coverage, empty results remain `not-covered`; zero rows never establish an absence of observing places.

## Measured limits

First supervised build: **46.749 seconds**, peak working set **179,777,536 bytes**, under **60 seconds / 256 MiB**; input hashing and selection occur inside the worker deadline. A 20 ms polling supervisor kills workers exceeding limits. Windows accounting uses peak working set; Linux accounting reads `/proc/PID/status` VmHWM/VmRSS and fails closed if unavailable. These are sampled process limits with polling granularity, not an OS allocation hard cap.

Desktop runtime on Node v24.14.0: one cold artifact load **3.98 ms**, first Thimphu 50 km query **1.75 ms**, 100 warm-query p95 **0.22 ms**, ten results. A 32-request promise batch took **2.89 ms**. Eight simultaneous separate loads took **5.90 ms**; peak process RSS **79,753,216 bytes**. Promise batches share one event loop and do not prove multithreaded throughput. Reproduce with `npx tsx scripts/osm/benchmark_offline_extract.ts`; the loader pins the reviewed SHA and 4 MiB cap.

These measurements demonstrate this 134-row desktop artifact only. Global output size, denser regions, relation assembly, actual target-host baseline/concurrency and production memory remain unproven. The generic runtime loader still defaults to 512 MiB; deployment must pin a measured smaller cap and checksum. No new runtime default was selected from a small Bhutan sample.

## Verification

Focused Python tests: 14 passed, including RED/GREEN complete-way rejection, source byte declaration validation, streamed oversized/truncated-download cleanup, duplicate/conflicting identities, existing-source preservation, and Linux memory accounting, including exited-process races and accounting failure termination. Runtime fixture tests: 15 passed. Full application suite: 400 tests, 399 passed, 0 failed, 1 skipped. The skipped test is `tile symlinks cannot read even checksum-matching files outside the release directory`: this Windows host does not permit fixture symlink creation; Linux CI exercises that guard.

## License and release gate

© OpenStreetMap contributors. Source and derivative data are available under [ODbL 1.0](https://opendatacommons.org/licenses/odbl/1-0/); see [OSM attribution and copyright](https://www.openstreetmap.org/copyright). Compact fixture retention is internal review evidence. The private repository does not provide a public derivative database offer. Public unauthenticated versioned distribution and visible attribution remain release gates. No deployment, publishing or visibility change occurred.
