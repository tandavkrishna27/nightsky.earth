# Regional candidate expansion evidence

The offline regional wave contains **1,327 named candidates**, including **185 nodes and 1,142 ways**, compared with the earlier 59-node three-box pilot. It demonstrates a bounded repeatable regional artifact; it does not establish global candidate completeness. Runtime continues to use only the local index.

## Retained source and measurements

Evidence lives in `tests/osm/fixtures/real-regional-wave/`. Source vintage is 2026-10-13T18:47:51Z and retrieval time is 2026-10-13T18:49:09.337Z (the machine date presented to this wave was 2026-10-14 in Asia/Calcutta). `provenance.json` records the actual UTC timestamps without relabeling them.

| Box | South, west, north, east |
| --- | --- |
| Bengaluru | 12.6, 77.2, 13.4, 78 |
| Nilgiris | 11, 76.3, 11.8, 77.1 |
| Kochi | 9.5, 76, 10.3, 76.8 |
| Chennai | 12.7, 79.9, 13.5, 80.4 |

Source reply: 569,376 bytes, SHA-256 `ff62e1f4fc812e12ae32bb04e4fac6c78995dc6ca09d66b1ccd306e3221efff4`. Normalized artifact: 201,201 bytes, SHA-256 `e542a89ac7094acbd02f18dd7ea559001e21a4778214379b08839e1e553265ef`. Acquisition wall time: 24.917 seconds. Measured desktop Node peak RSS: 104,206,336 bytes. Server declaration: 60 seconds, 128 MiB; client: 90-second deadline, 4 MiB decoded response/artifact bound, 10,000 source-element bound. The server declaration does not measure actual server RSS. Local RSS was measured, not enforced by an OS process limit.

The first 32 MiB server declaration returned an explicit out-of-memory remark at query line 8. It published no candidates. Two diagnostic requests exposed an HTTP 406 without the application's User-Agent and the same 32 MiB runtime error with it. The distinct 128 MiB v2 probe then succeeded. There is no automatic retry/fallback loop. Prior failed query/diagnostics remain in `.data/osm/south-india-wave-20261014-v1/`; no country PBF scan was rerun.

Offline rebuilds reproduce the exact normalized hash; source-checksum mismatches and partial replies fail closed. Existing output directories are refused. Acquisition is explicitly invoked with `npx tsx scripts/osm/regional_wave.ts acquire NEW_VERSION_DIRECTORY`; it makes one request and does not run in the MCP service. See the fixture README for a trusted offline rebuild command.

## Runtime desktop measurement

`npx tsx scripts/osm/benchmark_regional_wave.ts` loads the trusted artifact with a 4 MiB byte cap and expected SHA-256. Node v24.14.0 measured 7.65 ms load time and 98,222,080-byte peak RSS. Four 20 km queries returned the requested ten candidates each. Across 30 warm runs per query, p95 was 1.14 ms Bengaluru, 0.51 ms Udhagamandalam, 0.63 ms Kochi and 0.50 ms Chennai. The first Bengaluru call took 3.38 ms. These are desktop evidence, not acceptance for a production memory budget or concurrent traffic. The local loader's generic default remains 512 MiB; deployment should pin this reviewed hash and a suitably small byte cap.

## Coverage interpretation and global feasibility

Only named nodes and ways with the selected park, reserve, viewpoint, campground, protected-area and beach tags are selected. [Overpass output documentation](https://dev.overpass-api.de/overpass-doc/en/targets/formats.html) describes the supplied center as the middle of the feature bounding box. It is not an entrance and may lie outside the feature. Names and tags are untrusted source text. Accessibility, nighttime permission, horizon, darkness and physical safety remain unknown. Relations and unnamed candidates are excluded.

The [public Overpass manual](https://dev.overpass-api.de/overpass-doc/en/preface/commons.html) identifies stitching world-wide bounding boxes and relying on public instances as an application backend as problematic. This wave therefore authorizes no automated planet scraping. Sustainable broad coverage requires an offline extract pipeline on an appropriately budgeted build machine, or separately operated infrastructure, followed by measured versioned regional artifacts.

On the research date, [Planet OSM](https://planet.openstreetmap.org/) listed an 89 GB weekly PBF and 167 GB compressed XML. [Geofabrik India](https://download.geofabrik.de/asia/india.html) listed a roughly 1.6 GB India PBF and 532 MB Southern Zone. The retained India PBF is exactly 1,709,857,118 bytes; two earlier supervised whole-extract scans stopped at 120 seconds. This wave did not download those larger files. The compact regional result does not establish a global size/processing bound: density, selected tags, relation geometry, tile duplication and object overhead differ by region. A production global flat JSON index remains unproven within the no-database host budget.

Next acceptance evidence should use one smaller offline extract, bounded processing with external wall/RSS supervision, complete way geometry policy, cross-tile deduplication, per-region provenance and target-host cold/load/concurrency measurements. Keep unavailable/partial results outside reviewed coverage; zero candidates there cannot mean no observing sites exist.

## Distribution gate

Repository visibility was checked: it is private. The retained derivative data and notices are internal, prepared artifacts; no public database-download offer is established by this push. Public hosting/unauthenticated versioned access and visible attribution remain release gates. Repository visibility was not changed.
