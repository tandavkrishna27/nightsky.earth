# Historical baseline wave

## Scope and evidence

The reviewed source footprint is unchanged: Hanle (four supplied 0.25-degree cells) and Kodaikanal/Munnar (six cells). Historical processing stays offline after source retrieval. The existing immutable 2025 release remains a one-year sample; a new historical release uses a separate directory and the current schema 2 tile provider.

The two-year pilot covers observing nights 1991-01-01 through 1992-12-31, with two UTC days before/after for local-night boundaries. Its 52 exact month/boundary requests have manifest SHA256 `d0b21e1342e46648016a47585202ce032a557f8d6a9e4c9696a7ea0822208f8a`. The matching Python and TypeScript generators agree on this digest. Only the exact 1991-01-01 through 2020-12-31 period may be labeled baseline; the two-year pilot always remains sample-only.

The first live batch was operationally capped at four new jobs, one active job, 30 minutes overall, 32 MiB per raw chunk, 512 MiB retained raw and 1 GiB scratch. The CLI hard deadline is 30 minutes per selected chunk; the four-job and overall 30-minute first-batch limits are an operator gate, not an automated multi-job runner. Each source operation runs in a child with that per-chunk hard deadline; network calls are bounded to 30 seconds and metadata to 1 MiB. A durable submission intent precedes POST. Uncertain submissions and known queued identities block another submission until reviewed recovery. Offline `reconcile` can prove a historical post-import local checkpoint against its persisted job/source identity and clear the remote ledger without network access. Never resubmit an unknown job. Credentials remain in the operator's private external CDS configuration and never enter manifests, reports, artifacts or runtime.

## Commands

Use the existing `.data/era5/venv/Scripts/python.exe` environment. `history.py plan` is offline. `prepare`, `fetch`, `resume`, and offline `reconcile` require the explicitly reviewed manifest digest; `fetch` selects exactly one chunk. The two-year default output root is `.data/era5/history-1991-1992`.

```powershell
& '.data/era5/venv/Scripts/python.exe' scripts/era5/history.py plan --start-year 1991 --end-year 1992
& '.data/era5/venv/Scripts/python.exe' scripts/era5/history.py prepare --expected-manifest-sha256 d0b21e1342e46648016a47585202ce032a557f8d6a9e4c9696a7ea0822208f8a
& '.data/era5/venv/Scripts/python.exe' scripts/era5/history.py fetch --expected-manifest-sha256 d0b21e1342e46648016a47585202ce032a557f8d6a9e4c9696a7ea0822208f8a --chunk hanle-1991-01
```

After all required chunks are complete, the offline builder requires the explicit period, reviewed digest and real build timestamp:

```powershell
npx tsx scripts/era5/build-pilot.ts --historical --root .data/era5/history-1991-1992 --start-year 1991 --end-year 1992 --expected-manifest-sha256 d0b21e1342e46648016a47585202ce032a557f8d6a9e4c9696a7ea0822208f8a --generated-at <actual-UTC-build-time>
```

It writes only `historical-envelope.json` in that root. An identical historical envelope is returned without rewriting it. Changed timestamp, index vintage, mapping, source or any other envelope content requires a separately reviewed version directory; prior bytes remain untouched. Publish this checksummed schema 2 envelope with `build-tiles.ts` to a new immutable release directory. Register a release only after source and provider review. The builder rejects missing chunks; a partial fetch is never presented as a complete two-year artifact.

The generic full-period plan has 724 requests for the same ten cells. Generating that plan grants no live bulk retrieval. The current monthly decoder retains its 800-hour, ten-cell, 32-MiB numeric and 4-MiB JSONL limits. The aggregator streams chronological chunks one at a time for each selected cell/timezone and independently generates dark-hour denominators. Missing UTC source hours remain missing eligible observations; inclusive cloud thresholds and noon-to-noon local observing dates remain unchanged. Source raw/decoded digests, exact requested timestamp membership, revision `0001`, decoder versions, astronomical version and timezone vintage are checked before publication.

## Resource gate for wider history

Proceed after a measured pilot proves actual request size, queue/download/decode time, peak memory, source revisions, gaps and chronological processing. The full baseline must satisfy the provider's existing coverage gates: 90% eligible observations and at least 27 qualifying years for relevant bins. Fictional engineering fixtures establish software behavior only. They are never a substitute for real 30-year source evidence.

Month-grouped multi-year CDS requests may reduce job count, but their disjoint source order requires a new explicitly bounded decoder and provenance design. Do not widen legacy decoder limits silently. A safe future design retains each original grouped raw source once and produces checksummed year/month partitions that retain their parent source identity; then the aggregator reads partitions chronologically. A bounded merge is another design option, but needs explicit aggregate memory limits. Validate exact requested year/month/day/hour sets, leap days, revisions and actual CDS response format before adopting either approach.

A global rollout remains behind measured storage, retrieval and CPU gates. The serving plugin reads reviewed local aggregates only; it does not call CDS, build a baseline on demand, or require a database.

## Primary source references

[CDS API setup](https://cds.climate.copernicus.eu/how-to-api) confirms modern token configuration, client version guidance and dataset terms acceptance. [ERA5 hourly single levels](https://cds.climate.copernicus.eu/datasets/reanalysis-era5-single-levels?tab=overview) documents hourly reanalysis, the supplied 0.25-degree grid, the distinction from native model resolution, final versus preliminary data and source DOI. These pages were checked during this wave.

## First batch measured results

The first four completed real CDS checkpoints were final ERA5 revision `0001`, with no missing requested UTC rows. Each was imported through source/decoded checksums and exact grid/hour validation.

| Chunk | UTC rows | Raw bytes | Decoded bytes | Queue seconds | Download seconds | Processing seconds |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| Hanle 1990 December boundary | 48 | 25,261 | 6,479 | 49.421 | 0.828 | 0.047 |
| Hanle January 1991 | 744 | 81,449 | 89,197 | 111.484 | 1.000 | 0.250 |
| Hanle January 1992 | 744 | 80,615 | 83,802 | 104.235 | 1.000 | 0.172 |
| Kodaikanal/Munnar January 1991 | 744 | 84,930 | 113,204 | 118.453 | 1.110 | 0.172 |

Decode peak memory was below 66 MiB in these checkpoints. Processing the incomplete real two-year checkpoint set with an independently generated expected clock took 0.461 seconds and peak process RSS 87,785,472 bytes. Hanle January across 1991 and 1992 had 682 eligible dark-hour samples, 680 valid samples, and two represented years. Remaining monthly source gaps stayed in the denominators; these measurements are **not** a published two-year artifact or a 30-year climate baseline. The local `measurement-report.json` records this explicitly.

The batch stopped after four of 52 planned chunks completed; all four remote ledger entries are complete and no job is queued or uncertain. Retained raw bytes were 272,255 and scratch bytes before the final measurement report were 693,965. Kodaikanal January had 590 expected / 294 valid eligible samples across the planned two years, and Munnar had 598 / 298; their missing second year remained explicit. No jobs beyond this first four-job batch are authorized by the initial resource gate. The completed checkpoint ledger is the authoritative source for current completion and retrieval timings.

## Production preparation reconciliation — 15 October 2026

This dated section supersedes earlier pending-batch language above. It is a preparation specification under [the production-data plan](../superpowers/plans/2026-10-15-v1-production-data-readiness.md), not acquisition authority. The global 1991–2020 objective and original **12 Done / 9 Partial / 6 Not started** accounting remain unchanged.

### Active release, retained evidence and missing release

| State | Exact evidence | Disposition |
| --- | --- | --- |
| Active sample | [tiles-2025-v3](climate-tiles.md), manifest `9ffc58e9033984b235241525471d4e5b6571a6f1640147502b57d014c31181e8`; three cell/timezone tiles, 2025, 89,271 publication bytes | Sample-only; not a baseline and not global. |
| Older checkpoints | Four completed monthly/boundary jobs listed above | Reuse validated bytes and source identities; exhausted allowance is not a new budget. |
| Completed grouped sample | [current report](data-pilot-wave.md) and [exact ledger](data-pilot-evidence/2026-10-15-history.json), manifest `5eb57ba09de53fd9c8881d66444e2aecf868b9640bc9e2ccaff982f132cc565d` | Both March jobs complete, 1,488 source hours each; four monthly partitions; 280,037 raw bytes and 389,121 decoded partition bytes. No runtime installation. |
| Required production release | Complete observing-night period 1991-01-01 through 2020-12-31 at admitted worldwide cells/timezones | Missing. Neither March diagnostics nor a complete two-year sample satisfies it. |

The six March place/year diagnostic rows have 279/279 expected/valid dark-hour samples each, but their request omitted adjacent February/April source hours. Do not reinterpret that diagnostic clock as complete local-night boundary coverage. ProcessingSeconds includes retrieval waiting; isolated decode CPU, worldwide queue time, compression, memory and cost are unknown.

### Candidate global strategy and scientific alternatives

The proposed reference strategy is a complete supplied 0.25-degree global grid, retaining hourly `total_cloud_cover`, final revision `0001`, and aggregating offline. Geography partitions are deterministic integer grid-index blocks; choose their dimensions only after available-machine budgets and provider limits are admitted. Assign each physical source cell exactly one owner block, represent the longitude seam once, and document polar-row semantics from the admitted source. Transport halos may overlap, but aggregation deduplicates exact cell/UTC-hour/source identities. Publication coverage is a cell inventory and residual report, never a count of named-city pilots.

| Candidate | Scientific / resource tradeoff | Decision gate |
| --- | --- | --- |
| Full supplied 0.25-degree global lattice | Preserves current nearest-supplied-cell method, including oceans/islands/polar regions; potentially large raw and computation burden. Supplied spacing is not finer native atmospheric information. | Preferred reference for scope; actual grid coordinates/count, source access limits and machine feasibility unadmitted. |
| Land plus reviewed coastal/island mask, same grid | Avoids much open-ocean processing, but coastline masks can omit islands/coastal cells and offshore destinations. | Requires exact mask/version, buffer and uncovered-query policy; not equivalent to whole-surface coverage and cannot silently replace it. |
| Coarser global supplied-grid subset | Global footprint with fewer cells; worse nearest-cell representativeness in mountain/coastal settings. A subset of existing 0.25-degree nodes still changes mapping distance. | Explicit method/claim and source admission decision. A regridded average is a different statistic; threshold after averaging is not average threshold frequency. |
| Hourly global regional shards processed sequentially | Same coverage/statistic with bounded simultaneous working set; more partitions and scheduling. | Recommended execution shape, not a provider acceptance or runtime-size guarantee. |
| Monthly mean cloud product | Smaller input but discards hour/night selection and nonlinear threshold frequencies. | Not an equivalent source for dark-cloud-v1; no substitution. |

The existing pilot producer fixes two regions/ten cells; the aggregator validates supplied quarter-degree nodes. `build-tiles.ts` currently limits input to 8 MiB, ten tiles and 32 MiB total publication. Global production therefore needs a separately reviewed bounded multi-shard producer, release index, deterministic coverage/mapping inventory and runtime admission. Increasing limits or republishing pilot schema support alone does not produce worldwide data.

Raw grid coverage and civil-time coverage are separate. Current aggregate identity is `cellId|IANA-zone`; named records supply zones, while arbitrary-point planning uses an explicit display zone, not verified geographic timezone polygons. Freeze the supported mapping/zone inventory with the gazetteer/runtime edition. A source cell may serve more than one zone; aggregate each admitted pair explicitly. A universally worldwide local-night claim still needs an admitted zone assignment route or a clearly labeled UTC context method, which would require its own method review. Do not invent an all-points timezone map.

### Frozen partition, clock and eligibility specification

1. Freeze dataset DOI `10.24381/cds.adbb2d47`, variable `total_cloud_cover` in fractional units, product reanalysis, final revision `0001`, deterministic member zero, supplied coordinates, exact request year/month/day/hour sets and decoder/runtime versions. Reject preliminary/mixed revisions and unsupported dimensions. Preserve actual source hashes and missing timestamps.
2. Partition source by owner spatial block and UTC year/month. For grouped parents select only years with identical valid month lengths; separate leap February. Preserve immutable raw parent once, checksummed parent/index/child links, exact timestamps, and sorted monthly children. Resolve overlapping retained evidence by an explicit provenance choice; conflicting revisions or values stop admission. No duplicate observations count twice.
3. Generate the eligible clock independently from source rows for each cell/zone. Use exact UTC hours; assign local observing date noon-to-noon by calendar subtraction before local noon. Include observing nights 1991-01-01–2020-12-31, including each final night's next-morning hours. The current implementation scans UTC 1990-12-30T00:00Z up to but excluding 2021-01-03T00:00Z, with a fail-closed 48-hour night-date displacement guard. Obtain December 30–31, 1990 and January 1–2, 2021 outer source days; internal month/year boundaries share contiguous neighboring partitions, never fabricated hours. Historical DST and date-line changes use pinned IANA rules. Stop on unsupported padding assumptions.
4. Eligible means modeled solar altitude at the supplied cell is <= -18 degrees, using Astronomy Engine 2.1.19 and the existing dark-cloud-v1 calculation. Bins are observing-night calendar month × UTC hour (288 bins), with per-year evidence. Do not relabel bins as local wall-clock hours. Missing/null/nonfinite source values retain expected denominators; no interpolation or zero fill. Threshold comparisons are inclusive at 0.1, 0.25 and 0.5.
5. Preserve at least 90% valid/expected eligible samples and 27 qualifying represented years in each relevant nonempty selected bin and summary. Existing implementation additionally rejects any selected-bin year or month-year below 80% completeness; retain these guards. Its yearsMask counts years with valid samples, while badYearsMask and month-year guards check annual completeness; do not describe 27 represented years alone as sufficient. No astronomical darkness is a separate state, not missing data or 0% clear. Source completeness, eligible completeness and boundary completeness get separate audit fields.
6. Only the exact full period may carry baseline-1991-2020. Publish new immutable version directories with actual build timestamp, method, grid/zone mapping, source revisions, checksums and coverage inventory. Missing regions/years stay unavailable or partial. Historical sample frequencies are neither weather forecasts nor whole-night/site probabilities.

### Full-period workload: arithmetic before capacity claims

The Gregorian 1991–2020 interval contains 10,958 days (eight leap days), hence **262,992 UTC hours**; four outer padding days add 96, yielding **263,088 source hours per full-period cell** under the current request design. This includes daytime data needed before darkness filtering; eligible dark samples are a separately computed subset depending on cell and zone.

Let C be the admitted unique source-cell count, V the number of scalar variables (proposed V=1), b bytes per decoded numeric value, P the admitted cell/zone pairs and H=263,088. Then unique uncompressed numeric values require `C × H × V × b` bytes; for illustration only b=4 gives `C × 1,052,352` bytes. This is arithmetic, not an ERA5 file-size prediction. For unequal/masked partitions use `sum(C_partition × H_partition × V × b)` after overlap deduplication. Actual C is not frozen here; source endpoint/pole conventions must be inspected before computing it.

Aggregation evaluates up to `P × H` hourly eligibility instants before optimization and stores 288 bins plus yearly coverage bookkeeping per pair. Temporary numeric arrays, JSONL encoding, coordinates/clocks, compression, parent/index metadata, source transport overlap, retained raw, staging copies, runtime tiles/indexes/cache, previous edition and rollback reserve are additional separate terms. Their coefficients must be measured; current tile bytes cannot be multiplied into a defensible global serving estimate. Record peak concurrent scratch separately from lifetime retained bytes. Free source access does not establish zero storage/compute/maintenance cost or any completion time.

### Freeze and remaining decisions

Document checks: reconciled the latest pilot report/ledger and active tiles; read `aggregate.ts`, `grouped_history.py`, `build-pilot.ts` and publication bounds. No network, CDS/account/credential actions, tests, models, data build, commit or deployment ran. This preparation freezes period, statistical gates and proposed partition semantics; it does not freeze an unmeasured machine budget.

Before acquisition decide: actual worldwide grid/mask and cell inventory; admitted zone/mapping route; available build machine/disk and raw retention/rollback budget; bounded global producer/shard publication implementation; exact request manifest and deduplication ledger; provider request acceptance and first-result stop gates; and measured serving-host admission. A smaller scope or alternate statistic requires owner decision and must retain uncovered queries honestly. The next batch specification is in [grouped history](grouped-history-wave.md#production-preparation-and-deduplicated-batch--15-october-2026).
