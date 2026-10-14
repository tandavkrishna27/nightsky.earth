# Regional OSM serving wave

Task 8 adds an operator-selected regional provider alongside the existing flat index. No default dataset or acquisition path changes. The manifest is checksum-pinned and versioned; each entry carries a safe relative artifact path, SHA-256, exact bytes/rows, source, vintage, coverage statement and conservative candidate-point bounds. Bounds route queries; they do not assert polygon membership or complete geographic coverage.

The provider loads only radius-intersecting regions. Its spherical-cap envelope includes antimeridian and pole crossings. Exact haversine distance applies after routing. Sorting retains requested category order, distance, completeness and stable identity; the output limit applies after combining regions. Source metadata and vintage stay attached to every candidate. Equal OSM identities with equal records are deduplicated while retaining distinct source vintages. Conflicting records fail the request. Conflict checks cover loaded/intersecting regions only; this provides no global identity proof.

## Operator integration

Import `loadRegionalOsmProvider` from `server/places/regionalOsm.ts`. Supply the manifest path and mandatory `expectedSha256`. Inject the returned provider into the MCP/planner candidate-search dependency; its `search(input, {place})` accepts server-resolved coordinates. Keep provider initialization explicit; the flat index remains available until an operator opts in.

Offline assembly: `npx tsx scripts/osm/regional_manifest.ts OUTPUT ID PATH SHA256 [ID PATH SHA256 ...]`. Output must be a new directory. Assembly copies reviewed bytes into that directory and writes a manifest with derived point bounds. It never downloads data. Dateline-spanning artifacts may use broad bounds or be split into separate reviewed regions for efficient routing.

Measure: `npx tsx scripts/osm/measure_regional_serving.ts MANIFEST_PATH EXPECTED_SHA256`. Its named test coordinates are measurement cases, not runtime region configuration.

## Bounds and failure behavior

Manifest: 256 KiB, at most 32 unique regions, at most 100,000 aggregate rows. Each region: at most 4 MiB and 10,000 rows. Default cache: two regions, 8 MiB artifact bytes, 20,000 rows. Default pending/active queries: eight total, processed serially; one active load. Configured limits must be positive integers within hard ceilings. Regions larger than the configured cache budgets are refused at initialization. Artifact-byte accounting measures serialized data, not JavaScript heap bytes; measured RSS is reported separately. Query accumulation is bounded by the aggregate manifest row ceiling.

Reads enforce byte bounds, checksums and exact row counts; strict validation produces immutable rows and indexes. Canonical paths must stay within the manifest directory. Missing/corrupt/escaping or inconsistent artifacts fail closed; no prior result replaces a failed query. The cache holds immutable reviewed snapshots until eviction. Install a new version directory and new manifest hash for changes; replacing files within a reviewed version is unsupported.

Coverage always remains partial when candidates are found. Empty results report not-covered and explicitly state installed extract gaps; neither bounds nor empty results establish full radius coverage. Access, darkness, night entry and safety remain unknown. Relations/public ODbL compliance are not newly established by this work.

## Retained-artifact measurement (2026-10-14)

An ignored, new `.data/osm/regional-serving-20261014-v1` directory contains byte-identical copies of the retained reviewed artifacts. Manifest SHA-256: `c79a278ffddde390a5ce5709c9e3d9884f60be12f1c0706703837c2f681998bb` (2,173 bytes).

| Region | Rows | Artifact bytes | Vintage | SHA-256 |
|---|---:|---:|---|---|
| South India boxes | 1,327 | 201,201 | 2026-10-13T18:47:51Z | e542a89ac7094acbd02f18dd7ea559001e21a4778214379b08839e1e553265ef |
| Bhutan | 134 | 20,933 | 2026-10-12T20:21:35Z | d800a935abd54b8cda8e98d02c7e2bce50c7ca6f8e469cadfc735289704f41ff |

With a one-region cache: Bengaluru returned 10 candidates in 9.93 ms; Thimphu returned 10 in 1.62 ms; a gap request returned zero in 0.05 ms without loading; returning to Bengaluru took 5.90 ms. Three loads, two evictions, peak resident artifact size 201,201 bytes / 1,327 rows, one active load. Every returned vintage matched the corresponding retained artifact. Process peak RSS: 94,892,032 bytes. These are local measurements, not capacity or production latency guarantees.

Focused verification: 29 places tests passed (regional provider plus existing candidate and index tests); TypeScript main project check passed. Tests cover dateline/polar routing, on-demand cache eviction, mixed vintages, traversal, mismatch/corruption, pending-query overflow, equal duplicates and conflicts. The controller owns aggregate test registration, MCP integration tests and complete repository verification.
