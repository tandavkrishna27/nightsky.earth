# Task 9 tiled runtime implementation plan

> For agentic workers: use superpowers:executing-plans to implement this refinement of the approved historical-statistics plan task by task.

**Goal:** Serve reviewed local ERA5 cell/timezone aggregate tiles through the existing climatology provider without retrieving any new dataset.

**Architecture:** A checksum-pinned version-2 manifest, at most 4 MiB, maps at most 10,000 supplied quarter-degree cell/timezone keys to bounded relative tile files. One tile read is admitted at a time, identical callers coalesce, and successful tiles occupy a serialized-byte-charged 32 MiB LRU. Uncached concurrent different keys fail explicitly rather than queueing. Parsed heap/RSS remains a measurement gate.

**Tech stack:** Existing TypeScript/Zod/Node filesystem/crypto and result contracts; no CDS, database or runtime astronomy imports.

## Interfaces and files

`server/providers/climate/tiledEra5.ts`: schemas, trusted bounded reads, deterministic named-place mapping, validation, cache and provider. `era5.ts`: minimal lazy checksum-verified schema dispatch preserving the existing pilot adapter. `tests/providers/climate/tiledEra5.test.ts`: fictional engineering fixtures, bounds, path safety, quality and cache evidence. This implements serving infrastructure only; actual global/baseline data remains a separate gate.

## Work

- [x] Write failing fixture tests for trusted manifest lookup and sample-only result, then implement schemas/read-only provider. Every manifest and tile declares method, period, software versions, source DOI/licence/modifications and grid metadata. Validate descriptor/tile identity and duplicate keys.
- [x] Test quarter-cell mapping and wrap/ties, wrong timezone, missing key, corrupt digest/version, oversized files and traversal; implement fail-closed path handling and bounded actual-byte reads. Symlink fixture test is explicit and skips on Windows where symlink creation is denied; Linux CI must run it.
- [x] Test 30-year masks, raw count/sum consistency, yearly monthly conservation, baseline 90%/27-year/no-bad-year gates and zero denominators; implement recomputed statistics and inherited partial quality.
- [x] Test single admitted read/coalescing/recovery and LRU byte charging/eviction; implement bounded cache without queued reads.
- [x] Run focused pilot/tiled/builder tests and typecheck; latest individual tiled run: 13 passed, one explicitly skipped symlink test; all 12 legacy tests also pass. Root integrates test imports, review and local capacity evidence. No commit, dataset acquisition, public publication or deployment in this lane.

## Runtime accounting and provenance limits

The existing factory must first discover whether its checksum-pinned file is the legacy pilot or a version-2 manifest. It performs one verified read bounded by the existing 8 MiB legacy ceiling, rejects version-2 bytes above 4 MiB before accepting the manifest, and hands those bytes to the selected provider without a second file read. Direct version-2 loading rejects files above 4 MiB before allocation. Successful tiles are charged by actual serialized bytes; parsed object overhead and transient dispatch bytes require host memory measurements.

Per-year monthly quality records must conserve the 288 aggregate bins. Thirty-bit represented/bad-year masks must agree with recorded yearly denominators and missingness; a complete year/month cannot carry a bad-bin flag, and a monthly year below 80% cannot lose its flag during aggregation. Per-year hourly source rows are deliberately absent from serving artifacts, so the runtime cannot independently reconstruct every hourly bad-year mask. That remains a checksum-pinned builder/source verification responsibility. Baseline availability additionally checks each returned bin and summary for 90% completeness, at least 27 years, and no bad-year flag. Synthetic baseline tests contain fictional data only.

Exports remain in `server/providers/climate/tiledEra5.ts` for the runtime and offline builder: strict manifest/tile schemas, semantic manifest/tile validation helpers and deterministic cell keys. The legacy parser is exported from `era5.ts` and reused unchanged by the pilot reader; callers must verify their input checksum before calling it. Actual global coverage, 1991–2020 acquisition, and constrained production-host suitability remain unproved.

Both manifest and each tile explicitly carry ordered thresholds `[0.1, 0.25, 0.5]`; missing or altered thresholds fail validation. The separate builder lane converted only the existing verified 2025 pilot into three immutable local tiles. It preserved the 57 source revision/checksum records, original software/timezone metadata and sample-only label. The earlier local format versions remain untouched; no additional reanalysis was acquired.
