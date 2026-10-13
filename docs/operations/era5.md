# ERA5 historical cloud context — local calculation wave

**Date:** 13 October 2026. **Current state:** H1–H4 are complete locally: the 2025 three-place sample is verified and the historical MCP tool is registered. H5 and multi-year/global coverage remain open. The sections below retain dated evidence from each wave; see [latest runtime evidence](era5-runtime-wave.md).

## Method reviewed for this prototype

The [historical plan](../superpowers/plans/2026-10-13-nightsky-historical-statistics.md) supplies the method: actual hourly ERA5 `tcc` fraction, nearest supplied 0.25-degree cell, actual historical Sun altitude ≤−18° with no refraction, and observing-night dates assigned by the local noon-to-noon calendar. Before noon belongs to the preceding calendar date. Runtime planning and the builder share that date rule, including arbitrary session minutes and DST.

Thresholds 10%, 25% and 50% are inclusive sensitivity choices. Frequencies count qualifying **valid hourly dark-time samples**, not continuous observing hours, sighting probabilities or the probability of an entire clear night. Monthly means and frequencies are distinct. Missing hours retain their expected denominator; masked/nonfinite values are excluded from valid counts. Finite values outside [0,1], duplicate timestamps, unsupported dimensions/calendar or malformed provenance fail the build. No physical-value tolerance or interpolation is applied.

The proposed baseline is 1991–2020. All current results are explicitly **sample-only**. Release quality remains per-bin plus summary: 90% completeness, 27 represented years and no year/bin below 80%, with per-year monthly coverage retained. These are product gates, not WMO-certified criteria. A one-month prototype cannot support seasonal recommendations.

## Existing January samples processed

| Place / GeoNames ID | Supplied cell | Expected dark samples | Valid samples | Mean modeled cloud fraction | Count at ≤25% / valid |
|---|---|---:|---:|---:|---:|
| Hanle / 1270426 | 32.75° N, 79° E | 341 | 340 | 0.500575 | 138 / 340 |
| Kodaikanal / 1266425 | 10.25° N, 77.5° E | 294 | 293 | 0.788760 | 28 / 293 |
| Munnar / 1262463 | 10° N, 77° E | 299 | 298 | 0.644441 | 60 / 298 |

Each January file lacks the February 1 dawn sample belonging to the January 31 observing night. The calculation identifies one missing eligible hour at each place. Early January 1 hours belonging to December 31 are excluded. This is a useful boundary check; these results are not a ranking or a forecast. The coarse modeled cell does not establish conditions at a mountain observing site.

Raw source checksums remain those in [source spikes](source-spikes.md). Decoded JSONL SHA256: Hanle `7d8e63254a2944165c2aae6e067c79e601b9b0bd958d07a573df77e0bc052008` (84,874 bytes); Kodaikanal–Munnar `ecfb72d1deb09fe0e2f69e85202d66c2759e4cf67da63a13ea5c0e69a99de685` (115,076 bytes). Reports are ignored `.data/era5/<GeoNames-ID>-historical-sample-report.json`, with raw/decoded checksums, original source metadata, full aggregate, coverage, index vintage, astronomy and Node/ICU/timezone versions.

## Reproduction without source requests

Use an isolated Python environment with `scripts/era5/requirements.txt`. The existing local inspection environment already has these pinned dependencies.

```powershell
.data/era5/venv/Scripts/python.exe scripts/era5/read_chunks.py .data/era5/hanle-2025-01-total-cloud-cover.nc .data/era5/hanle-2025-01.jsonl
.data/era5/venv/Scripts/python.exe scripts/era5/read_chunks.py .data/era5/kodaikanal-munnar-2025-01-total-cloud-cover.nc .data/era5/kodaikanal-munnar-2025-01.jsonl
npx tsx scripts/era5/validate-samples.ts
```

The explicit source checksums prevent silent changes. The sample runner selects the nearest sampled angular grid cell for the three reviewed records, with longitudinal distance scaled by place latitude and deterministic tie breaking. This is a bounded sample runner, not a general global cell-discovery service. Its reports contain public grid coordinates and must not be reused for private host-location hints.

## Builder bounds and checkpoint behavior

| Layer | Implemented guard |
|---|---|
| Decoder input | 32 MiB raw file; at most 800 timestamps and ten cells; decoded numeric ceiling 32 MiB checked before reading cloud values |
| Decoder reads | One hourly cell row at a time; only supported tcc dimensions and deterministic member 0 |
| Output | 4 MiB JSONL ceiling; task-owned temporary file, flush and atomic replacement only after complete validation and unchanged source checksum |
| TS parser | 4 MiB text, 800 rows, ten cells, exact row count, strict metadata/values, unique quarter-degree cells and ordered hourly instants; failed aggregation closes the source iterator |
| Aggregation | One cell/timezone key per call, at most 30 observing-night calendar years, two-day edge padding, sorted unique samples; bounded arrays rather than raw global archives |
| Checkpoint validation | Duplicate IDs, incomplete chunks and changed prior source checksums/revisions rejected; a failed decoder preserves the previous output |

This does not implement the H3 retrieval/resume orchestration or H4 runtime tile/cache system. A pilot must still measure scratch, RSS, processing time and artifact size and enforce its whole-batch limits. No CDS credentials or account access are required for fixture tests.

## Independent historical astronomy checks

Expected Sun altitudes are literals from [NASA/JPL Horizons](https://ssd-api.jpl.nasa.gov/doc/horizons.html), retrieved 13 October 2026, not values generated by the implementation engine. Queries used `COMMAND='10'`, `EPHEM_TYPE='OBSERVER'`, `CENTER='coord@399'`, `COORD_TYPE='GEODETIC'`, `SITE_COORD='79,32.75,0'`, `QUANTITIES='4'`, `APPARENT='AIRLESS'`, `TIME_TYPE='UT'`, hourly steps from 12:00 to 16:00 UTC on each date, `CSV_FORMAT='YES'`, `EXTRA_PREC='YES'`, `OBJ_DATA='NO'` and `MAKE_EPHEM='YES'`. API response signature was version 1.2. Altitude tolerance is 0.03°, matching the earlier horizon reference checks. The mask is tested on both sides of −18°; arbitrary-date accuracy is not certified.

| Date | Raw response SHA256 |
|---|---|
| 1991-01-15 | `abfee3a180398360793cfbe9a08441ea2c008f30aef0efc9d19ed0c903756b85` |
| 2000-01-15 | `d4eef143eaba681a7c8a9bb417bee5e84c27b9eb21bb5621609f5c79e75553b1` |
| 2020-01-15 | `4cf051ae834d8986e68366fb5b2291524d231031b1f13e61a74c830b242868c6` |

Raw responses and exact query URLs are in ignored `.data/era5/historical-references/`. Three small public reference queries were made; no new ERA5 request was made.

## Review and remaining work

Independent review found a calendar-month/observing-night mismatch in the planner and a not-covered state permitting positive statistics. Reproducing tests failed, then passed after a shared calendar rule and stricter absence constraints were added. The represented-year invariant was tightened in the same contract fix.

H3: bounded full-year pilot, batch/resume enforcement and measured resource report. H4: versioned runtime artifact reader and actual MCP integration. H5: host capacity, source/legal/release claims and global coverage validation. These remain open; Task 9 is Partial.

## Verification evidence

- Windows aggregate suite: 239 passed, zero failed/skipped. Clean Linux Node 24: 238 passed, zero failed, one installed GeoNames artifact smoke skipped because ignored local data is not copied into the clean build.
- Python offline decoder fixtures: five passed on Windows and Linux Python 3.12, without CDS credentials or source requests.
- TypeScript checks include the builder scripts through `tsconfig.era5.json`. Both platform builds and production health/MCP smoke checks pass; eleven tools remain registered. Linux production audit has zero findings. Existing development dependency audit findings and website build warnings remain documented in implementation status.
- CI now includes pinned ERA5 decoder dependencies and offline tests. GitHub-hosted execution is pending.
- Stream/batch fixture aggregates are exactly equal for the same chronological sample order; sums are float64 and no merge-order equivalence is claimed. Both supported longitude conventions normalize to the same supplied cell. Failure closes the source iterator and preserves any prior decoder checkpoint.

## H3 full-year pilot preparation — 13 October 2026

The fixed 2025 pilot is prepared by `scripts/era5/pilot.py`. It is an **offline staging/measurement tool**, not a downloader. Exact public CDS requests are in ignored `.data/era5/pilot-2025/manifest.json`: 24 monthly chunks across the two sampled regions, plus two boundary chunks per region covering December 30–31, 2024 and January 1–2, 2026. The regions contain four and six supplied cells, ten in total. Each region requests 8,856 hourly source instants (8,760 year hours plus 96 padding hours); the aggregator still counts only observing-night dates inside 2025.

Two existing January files have been imported and checkpointed. **2/28 chunks are verified; 26 remain.** Full-year readiness is false. No new ERA5 request was made. The complete one-year sample-only aggregate, queue/download timings and measured full-year artifact remain pending. No automatic multi-year or global build is enabled.

### Measured existing files

| Region | Raw bytes | Decoded JSONL bytes | Validation/copy/decode seconds | CPU seconds | Peak Python RSS bytes |
|---|---:|---:|---:|---:|---:|
| Hanle | 80,862 | 84,874 | 0.156 | 0.141 | 46,280,704 |
| Kodaikanal–Munnar | 84,985 | 115,076 | 0.157 | 0.156 | 46,211,072 |

Measurements are from separate Windows Python 3.12.14 imports of existing local files. Peak RSS includes Python/netCDF dependencies; it is not aggregate service RSS or a measurement on Hetzner. Both completed source chunks have 744 expected/source rows, with no missing source hours. The January observing-night result still has the separately documented dawn boundary gap until padding/following months are present. Queue and download times are deliberately null because these were already-local files.

At the second pre-ledger snapshot, retained raw bytes were 165,847 and total pilot directory bytes were 384,147. Manifest, final ledger and future operations add overhead. Scaling one month's bytes suggests a small regional pilot but is not a measured full-year, multi-year or global storage budget; do not use it to approve a larger build.

### Running the prepared pilot

```powershell
.data/era5/venv/Scripts/python.exe scripts/era5/pilot.py prepare
.data/era5/venv/Scripts/python.exe scripts/era5/pilot.py import --chunk hanle-2025-01 --source .data/era5/hanle-2025-01-total-cloud-cover.nc
.data/era5/venv/Scripts/python.exe scripts/era5/pilot.py import --chunk kodaikanal-munnar-2025-01 --source .data/era5/kodaikanal-munnar-2025-01-total-cloud-cover.nc
.data/era5/venv/Scripts/python.exe scripts/era5/pilot.py status
```

`prepare` is idempotent and rejects changed manifests. Import accepts only reviewed chunk IDs, expected cell sets and dates. Missing source timestamps remain explicit coverage counts. One writer lock prevents simultaneous imports. Completed chunks are reused only after raw and decoded checksum verification; a new source checksum cannot replace an existing checkpoint. Wrong source profiles do not create completed entries. Untracked/interrupted files and stale locks need explicit review; the tool neither treats them as completed nor deletes them automatically.

Normal `import` runs a child worker with a hard 30-minute timeout, including native decoding, checksum and publication stages. A cooperative final check also rejects overdue checkpoints. Internal `import-worker` and direct library calls exist for the wrapper/tests; operators must use `import` for the hard deadline. A timed-out process can leave a stale lock and untracked files for review; a previously atomic checkpoint must be verified by `status` before resuming. Raw chunks are capped at 32 MiB, retained raw data at 256 MiB, scratch at 1 GiB and JSONL at 4 MiB. These are local import limits; network queuing/downloading is not implemented or measured here.

Independent review found that an earlier cooperative time check could publish a checkpoint after a slow final checksum. A reproducing late-hash test failed before the fix, then passed. Another test verifies interruption of a stalled worker. All **13 offline Python decoder/pilot tests pass on Windows and Linux**. The unchanged Node application remains under the previous 239-test verification; GitHub-hosted execution is pending.

### Next source-access step

The API is preferred over repeated browser downloads for reproducible monthly retrieval and deliberate resume. Official [CDS API instructions](https://cds.climate.copernicus.eu/how-to-api) require the personal configuration outside the repository. On this machine use `C:\Users\TK\.cdsapirc`, with the URL/key fields copied privately from the signed-in account page. Never paste the token into chat or put it in source, logs, manifests or reports. The local configuration file is currently absent; licence acceptance is already verified from the earlier account setup.

After private configuration, implement/verify a bounded single-chunk fetch and retrieve one remaining chunk first. Measure its queue/download/decoding stages, validate the output, then advance serially within the pilot's batch limits. Build and compare the full-year aggregate only after all required inputs are verified. The prepared requests do not authorize paid processing or a larger baseline.

## H3 full-year wave completed — 13 October 2026

This section supersedes the preparation snapshot above. Parallel downloader and builder implementers plus independent review completed the regional **2025 sample-only pilot**. Private CDS configuration is present outside the repository and authenticated retrieval worked. Notepad's extra `.txt` extension was corrected without displaying configuration contents.

### Scope and source validation

- All **28/28 chunks** are complete: two existing January files plus 26 new CDS data jobs. Each region has 14 files and exactly **8,856 consecutive UTC source hours**, including the reviewed edge padding.
- There are **88,560 cloud fractions** across the ten supplied cells, with zero null values or missing source hours; all physical bounds, units, cells, deterministic member 0 and final source revision `0001` are verified.
- Independent review verified all raw/decoded hashes and reproduced all 36 monthly and three annual summaries using a separate direct array loop, without the builder's counting/summarizing functions. Weighted means and frequencies agree within `1e-13`.
- January is now complete: Hanle **341/341**, Kodaikanal **294/294**, Munnar **299/299** eligible dark-time samples. A literal Hanle January 31 night uses UTC hours 14–23 and February 1 00:00: 11 samples, threshold counts `[0, 0, 7]` and mean fraction `0.49971424449573865`. This independently confirms the overnight month attribution.
- The artifact retains source hashes/revisions, place-index/astronomy/timezone vintages, C3S/ECMWF attribution, ERA5 DOI, CC BY 4.0 link and explicit derived-processing disclosure. Supplied 0.25° grid spacing is distinguished from approximate 31 km native atmospheric resolution.

### Measured storage and processing

| Measurement | Actual result |
|---|---:|
| Retained raw source | 2,067,405 bytes (~1.97 MiB) |
| Decoded JSONL | 2,326,666 bytes (~2.22 MiB) |
| Full-year artifact | 129,053 bytes (~126 KiB) |
| Final prebuild directory snapshot | 4,439,046 bytes |
| Prebuild plus staged artifact estimate | 4,568,099 bytes |
| Streamed download duration, 26 new jobs | 24.421 seconds |
| Local validation/copy/decode duration, 28 chunks | 5.359 seconds |
| Largest Python import worker peak RSS | 65,900,544 bytes (~62.85 MiB) |
| Known polling intervals combined | 2,056.574 seconds; incomplete queue wall-time measure |

Queue/source preparation dominates these small imports. Two January files preexisted and have no measured download/queue timing. An interrupted August job was resumed by its recorded ID; its timer excludes earlier interrupted/offline waiting. Do not present summed polling durations as authoritative server queue time or full wall duration. Directory/staged-output figures are snapshots/estimates, not continuous peak-scratch telemetry.

| Actual build | Runtime | Wall seconds | CPU seconds | Peak process RSS |
|---|---|---:|---:|---:|
| Windows | Node 24.14.0 | 0.844 | 1.312 | 361,472,000 bytes (~344.73 MiB) |
| Linux container, capped at 2 CPU / 4 GiB | Node 24.21.0 | 0.914 | 1.267 | 462,098,432 bytes (~440.69 MiB) |

Both builds include loading the real global GeoNames artifact. All numeric annual statistics match across platforms. Artifact hashes differ because the recorded Node/ICU/timezone versions differ; determinism is tested within a fixed environment, not by erasing provenance. This measures the small offline build, not concurrent production serving, actual Hetzner capacity or global artifact fit.

Windows artifact SHA256: `0ac43235fa7c0585d87a4e821e25d0bb9c799a1042f329a411923a4fa0dc2580`.
Linux artifact SHA256: `f051949c36fc324f3d6ed872158062039225fd55a02f0736f1661836b5d8e0c0`.
The local artifact is ignored `.data/era5/pilot-2025/full-year-sample.json`; measurements are `.data/era5/pilot-2025/pilot-measurements.json`. No raw source or private configuration is committed.

### Annual sample interpretation

These describe modeled **valid hourly dark-time samples in 2025**, not entire clear nights, visibility guarantees, forecasts or a seasonal climate baseline.

| Place | Expected / valid samples | Mean cloud fraction | Samples at ≤25% cloud / valid |
|---|---:|---:|---:|
| Hanle | 3,227 / 3,227 | 0.377515 | 1,760 / 3,227 |
| Kodaikanal | 3,412 / 3,412 | 0.751733 | 441 / 3,412 |
| Munnar | 3,425 / 3,425 | 0.752937 | 540 / 3,425 |

### Retrieval/recovery and reproduction

The first serial batch stopped at the enforced 30-minute deadline with 22 chunks verified. Root confirmed the worker had exited, exactly one known queued job remained, and there were no staging/raw/decoded outputs for it. Only its task-owned stale lock was removed. `resume-known` retrieved that same recorded job by GET; it made no duplicate submission. The remaining five jobs then completed in a new bounded batch (~406.7 seconds).

The [downloader instructions](era5-downloader-wave.md) document explicit `fetch`, GET-only `resume-known` and verified `reconcile-local`. Unproven submission identities or untracked post-download files still fail closed. Sessions are scoped to one worker invocation and close on worker exit; a future long-lived API-client service would require explicit session lifecycle handling.

The [builder instructions](era5-builder-wave.md) document input validation, fixed artifact path, atomic publication and hard worker deadline. Rebuild locally without source requests:

```powershell
node --import tsx scripts/era5/build-pilot.ts
```

Final code verification: **249 Windows application tests**; clean Linux **248 passed plus one installed-artifact skip**; **33 Python tests on each platform**. Typecheck includes builder scripts. Builds, production runtime smoke (eleven tools) and Linux production dependency audit pass. Independent review has no remaining Critical/Important findings. Existing development dependency findings and website warnings are unchanged; GitHub-hosted workflow execution remains pending.

### Next baseline bounds — proposal only

For the **same ten cells/two regions**, a 1991–2020 baseline would require 720 monthly jobs plus four edge chunks: **724 jobs**. A simple linear projection from these files gives ~59,091,874 raw bytes and ~68,923,745 decoded bytes before new metadata/artifacts. These are illustrations, not measured older-year data, compression, queue-duration or global-scale results. Queueing is the likely operational constraint; validate a small older-year sample and review a separate capped retrieval plan before authorizing expansion. No baseline job was submitted.

H3 is locally complete. **H4 remains next:** bounded artifact reader, versioned historical MCP result and resolve → history → plan → compare integration. The public historical tool remains unregistered and the product still has eleven tools. One year remains sample-only even at 100% completeness. H5 host/global/release gates and the multi-year baseline remain open; Task 9 stays Partial.

## H4 completed locally — 13 October 2026

The bounded historical reader, twelfth MCP tool and shared planner/comparison integration are implemented. Actual installed three-place journey and independent 36-month/864-bin review pass. Current one-year coverage remains partial/sample-only; outside coverage is unavailable. No runtime CDS access or database. See [runtime evidence](era5-runtime-wave.md) for configuration, controls, verification and limitations. Counts remain 7 Done / 12 Partial / 8 Not started; groups 3 / 10 / 6. H5 host/release and baseline/global gates remain open.


Final Linux verification: 265 tests discovered, 263 passed, two ignored installed-artifact checks skipped, zero failures. Application/builder typechecks, build, production audit (zero findings) and production runtime smoke (12 tools) pass in the clean 2 CPU / 4 GiB container. This validates local Linux behavior, not Hetzner production headroom. Final Windows 265/265, typechecks, rebuilt production runtime and audit pass. Prior development dependency findings and website warnings remain. No database, deployment, commit, push or publication.
