# Offline ERA5 tile publication

Recorded October 13, 2026. This work publishes existing reviewed aggregates into an immutable schema2 layout. It does not retrieve CDS data, expand a baseline, add named-place coverage, or establish host capacity.

## Actual local publication

The existing schema1 `full-year-sample.json` was read under its required expected SHA-256 `0ac43235fa7c0585d87a4e821e25d0bb9c799a1042f329a411923a4fa0dc2580` (129,053 bytes). The builder used the original legacy validator and actual reviewed GeoNames index; it retained the 2025 sample-only period, cloud fraction units, explicit inclusive threshold tuple [0.1, 0.25, 0.5] on both manifest and each tile, `dark-cloud-v1` method, Astronomy Engine 2.1.19, original Node/ICU/timezone version string and place-index vintage. Its actual output is `.data/era5/tiles-2025-v3/` (ignored local data), with manifest SHA-256 **`9ffc58e9033984b235241525471d4e5b6571a6f1640147502b57d014c31181e8`** and explicit publication metadata timestamp `2026-10-13T17:57:20Z`.

| File | Bytes |
|---|---:|
| manifest.json | 9,915 |
| publication-report.json | 495 |
| tile-000.json | 26,262 |
| tile-001.json | 26,268 |
| tile-002.json | 26,331 |
| Total publication | 89,271 |

The three keys are `era5:10:77|Asia/Kolkata` (Munnar), `era5:10.25:77.5|Asia/Kolkata` (Kodaikanal) and `era5:32.75:79|Asia/Kolkata` (Hanle), sorted lexically for deterministic output. Actual January valid hourly-dark-time denominators remain **299, 294, 341** respectively, verified through the production reader. All results remain partial one-year historical samples. These counts are not clear-night probabilities.

The manifest preserves 57 distinct source revision records: 28 raw NetCDF hashes with revision 0001, 28 decoded-chunk hashes with revision 0001, and the original request-manifest hash. `kind` distinguishes raw, decoded and manifest; revision identifiers retain chunk identity. The separate publication report pins the entire input aggregate digest and records publication tool/runtime versions. No raw observations are rebuilt, and raw/decoded hashes are preserved evidence from the trusted input, not a claim that this converter reread every original checkpoint.

An initial local rehearsal at `tiles-2025-v1` used the fixed unit-test timestamp 18:00 UTC, ahead of the actual run clock. It is not the canonical measured publication; use the v3 digest/path above. It was retained under the no-overwrite rule rather than edited into a different artifact. The v2 layout was also retained unchanged for rollback evidence; it predates mandatory explicit threshold metadata, so the current reader rejects it and v3 is the accepted current layout.

## CLI and trust

`npx tsx scripts/era5/build-tiles.ts --input <existing-file> --expected-sha256 <reviewed-digest> --geonames <reviewed-city-index> --output <absolute-new-release-directory> --generated-at <explicit-publication-UTC-time>`

All four input/output/digest/timestamp arguments are required. Legacy conversion additionally requires its actual named-place index through `--geonames` (or an explicitly injected reviewed index for tests). The output parent must already exist and resolve to itself without a symlink path. The release directory must be new; no existing directory or manifest is overwritten. The explicit timestamp is publication metadata, not the ERA5 source issue time. Repeated conversion with identical input, timestamp and runtime yields identical tile/manifest digests.

Legacy validation checks the exact schema, original source/method/revision metadata, all aggregate bin and stored-summary invariants, original 2025 period and nearest source-cell/place-index mapping. Shared tiled schemas and semantic helpers then verify every publication tile/manifest. No serving module imports this script or its build dependencies. The CLI contains no source request or account path.

A second supported input is a strict schema2 envelope `{schemaVersion:2, manifest, tiles}` holding already aggregated tiles. Its supplied descriptors must match each embedded tile's `JSON.stringify` bytes and digest, then pass the same semantic validators. All input paths must be safe relative paths even though this converter never follows them; output paths are newly generated simple filenames. The envelope preserves its declared period/provenance/model versions, including a possible exact 1991–2020 baseline. **Only fictional multi-year fixtures were converted**; this is format support, not real baseline completion.

## Bounds and interruption

Input file reads are checksum pinned, stable-identity checked, symlink rejected and bounded to 8 MiB. The initial converter permits at most ten tiles. Individual tile/manifest bounds come from shared schemas; total serialized public output, including the hash report, is capped at 32 MiB. The process checks a ten-second cooperative deadline, and the CLI runs the work in a separate process with a ten-second hard timeout to interrupt CPU stalls. Calling the in-process function directly retains cooperative checks; use the CLI for the hard process boundary.

A sibling stage is created under the verified output parent with an exclusive publication lock. Tile files, report and manifest are written and synchronized there. A new final directory is created exclusively; tiles and report move into it, and the completed manifest is atomically renamed **last**. That manifest is the completion marker. Consumers need both its trusted digest and a validated versioned layout. The success path removes only the verified empty stage with a nonrecursive operation; it performs no computed recursive deletion.

An interrupted or failed run may leave its stage and/or an incomplete release without the final manifest. A hard kill can also leave the exclusive lock. The previous release remains usable. Inspect these paths explicitly before removing them; rerun into a new version directory. Do not resume or relabel an incomplete directory as a published release. `publication-report.json` contains only hashes, public period/runtime/source-count metadata; it does not contain local input paths, credentials or account state.

## Verification and remaining scope

Tests first failed because the new publisher module did not exist. The implemented publisher then passed nine focused tests: deterministic checksums/versions; corrupt/hash/version/missing-field rejection; duplicate/key/path/threshold semantic failures; existing-directory preservation; injected pre-manifest interruption; byte/count bounds; CPU-hang kill; fictional 30-year format preservation; absolute/symlink paths; the installed actual three-place reader counts; and missing, changed or reversed threshold tuples. These are nine test groups with multiple cases, not nine retrieved samples. The actual-source test accurately skips when the ignored reviewed artifact is absent; fictional publication validation continues on clean CI. Both source and produced artifacts are read only after successful publication.

ERA5 script TypeScript checks pass. Source revision metadata and original aggregation versions remain distinct from publication-runtime versions. The original 2025 sample's one-year, three-place limitations remain. Multi-year observations, global tiles, build budgets, measured selected-host cache/index capacity and hosted release readiness are separate gates.
