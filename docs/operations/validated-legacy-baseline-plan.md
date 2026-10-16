# Validated legacy global baseline plan — 16 October 2026

**Preparation only; all acquisition limits remain proposed and unapproved.** This advances the existing worldwide named-destination baseline by regrouping its real frozen request inventory. No dataset download, provider submission, credentials, deployment or publication is authorized. No additional regional format pilot is proposed.

The [source resolution delivery](source-resolution-delivery.md) and [validation receipt](data-pilot-evidence/legacy-weather-result-validation-20261016.json) establish one 25,261-byte legacy NetCDF response: 24 UTC hours, four exact cells, 96 finite fractions, member zero and final `expver=0001`. Its date, **1990-12-30**, is outside the baseline. It contributes zero baseline dates. Existing March 1991/1992 parents separately establish the grouped legacy format for two same-month years at four/six cells. Neither result proves acceptance of 30-year groups, worldwide throughput, or ARCO provenance.

## Global scope and fixed inputs

The [frozen inventory](data-pilot-evidence/2026-10-15-history-production-inventory.json) has **236,042 named destinations, 54,822 required quarter-degree cells, 56,039 cell/IANA-zone pairs and 394 zones**. The inventory manifest SHA-256 is `82ab5ef0be1cba9e1b184df95d4db1468e64ba458d12b7d32069912f28206675`; retained verification is `373d0ce9e803efe0828ce24651c91a0858be62e96a491ee634508bca19351276`. Coverage means the exact named-cell/zone set worldwide, not every grid node, ocean, arbitrary coordinate or timezone polygon.

The existing global compact plan is `.data/history-global-proposed-20261015-v1.json`, **7,098,093 bytes**, SHA-256 `0b296d22142fea417a71299e17009536f82b14417f33eb4b38baa2ff307d2b12`. The regrouping reads this pinned metadata only; no retained dataset bodies are needed. Its 24,908 disjoint nondegenerate rectangles contain 99,914 acquisition cells, including 45,092 explicit fillers. These exact rectangle inventories are retained without alteration. Cells are quarter-degree supplied nodes; no coarsening or interpolation is introduced.

| Existing schedule quantity | Frozen value |
| --- | ---: |
| Required source cell-hours | 14,423,010,336 |
| Verified retained required cell-hours | 16,416 |
| Remaining required cell-hours | 14,422,993,920 |
| Retained hours across all acquisition cells | 25,488 |
| Remaining acquisition cell-hours including fillers | 26,286,148,944 |
| Separate year/month requests | 9,016,688 |
| Required versus acquisition cells | 54,822 / 99,914 |

The filler cost remains **11,863,155,024 scalar hours**, about 82.3% beyond required missing hours. Temporal grouping reduces jobs, not this spatial overhead. Optimizing spatial ownership would require a separate exact subtraction audit; it is not silently mixed into this improvement. Retained regional January/March data and the active three-place 2025 runtime are not a completed global baseline.

## Concrete grouped schedule

`groupLegacyCalendarRequests` in `scripts/era5/plan-production-history.ts` now lazily groups the frozen global plan, holding one tile's calendar shapes at a time. It preserves exact required/filler identities and each existing retained-hour override. For each tile it groups only identical **month + day set + UTC-hour set**, sorts years ascending, and splits at explicit **30 years / 22,320 timestamp hours**. February leap and non-leap classes remain separate. Boundary shapes remain separate whenever their day/hour sets differ from baseline months. No retained sample is reacquired by merging different missing-hour shapes.

Every output carries the exact area, cells, year/month/day/time arrays, dataset, member/revision requirements, canonical request hash, monthly child list and scalar count. The status is always `unapproved-nonexecuting` and provider acceptance is explicitly unproved for the proposed group. These local limits come from the existing grouped decoder: **22,320 timestamps, ten cells, 32 MiB raw/numeric, 800-hour and 4 MiB monthly child**. They are not asserted provider request limits. The older monthly global expander's conservative 22,320 scalar-hour guard is not the grouped decoder's timestamp bound. The new path is explicitly selected and does not weaken the monthly path.

The exact full-inventory result and the first sixteen complete request identities are recorded in [grouped global evidence](data-pilot-evidence/2026-10-16-grouped-global-baseline-plan.json). Actual regrouping produced **373,619 parent requests**, a **24.13-fold reduction / 95.86% fewer submissions**, with **9,016,688 monthly decoded partitions** and **26,286,148,944 scalar hours** unchanged. The largest parent has **22,320 timestamps and 133,920 scalar values** (six cells). Prospective raw-plus-decoded revision objects become **9,390,307**, before retained and new metadata/index pins. Raw parent count falls while monthly child count does not. No future content hashes are fabricated.

The ordered request-identity SHA-256 is `e8f0e7cf03bfaf960acc4b0a48979046ec64d5cff521f979e89a44c1612e9883`. This digest commits all canonical requests in deterministic order; the full schedule need not be materialized as hundreds of thousands of JSON rows. The unchanged planner source pin used for the successful run is `2e0a06c2ff234e3dc7f34b521e53c4f8ab80848146e3332ee7d365c80a753914`.

## Exact scientific eligibility and timezone policy

Dataset: `reanalysis-era5-single-levels`. Request defaults: `product_type=[reanalysis]`, `variable=[total_cloud_cover]`, `data_format=netcdf`, `download_format=unarchived`. Each request uses its pinned nondegenerate `[north, west, south, east]` area; expected returned coordinates must equal that rectangle's cell list. Require deterministic member zero and final `expver=0001` from actual response metadata. These are admission requirements, not invented CDS request fields.

All required source cells are exactly the frozen inventory's 54,822 cells. All baseline years are **1991–2020**, all twelve months, all valid calendar days, all UTC hours `00:00` through `23:00`, after actual retained subtraction. The independent padded clock is **1990-12-30T00:00:00Z inclusive to 2021-01-03T00:00:00Z exclusive**, 263,088 hours per cell: 262,992 baseline UTC hours plus 96 padding hours. A complete request envelope does not establish valid observations.

Keep each named record's explicit IANA zone, GeoNames edition `geonames-cities500-2026-10-11+hanle-v1`, and verified timezone runtime `2025c`. Execution must pin its installed rules; no zone may be inferred from longitude, country or nearest city. Shared source cells can have multiple independently aggregated zones. Filler cells acquire no additional named coverage or automatic zone assignments. Geographic suitability for arbitrary supplied zones remains unverified.

Aggregation retains [dark-cloud-v1 requirements](production-history-build-proposal.md): local observing nights 1991-01-01 through 2020-12-31, noon to next noon, observing-night month × UTC-hour bins, Astronomy Engine 2.1.19, solar altitude at or below −18°, inclusive cloud thresholds 0.1/0.25/0.5, independently generated eligible-hour denominators, 90% completeness, at least 27 qualifying years and existing 80% bin-year/month-year guards. Missing, null and invalid values are not filled. Full-period local-night boundary support and actual quality gates must pass before a baseline label.

## Retained subtraction and new sample

Subtract actual verified `(cell, UTC hour)` observations, including retrieved nulls; deduplicate identical overlaps and reject conflicts. Preserve every parent and decoded child pin. Do not subtract requested envelopes, filenames or declared completeness. A rectangle must have identical retained time masks across its cells before expressing missing Cartesian day/time shapes. The helper rejects overlapping shapes, duplicate overrides, invalid dates, source-template escapes, invalid geometry and repeated acquisition ownership.

The newer Iranian sample is absent from the frozen global plan. Its four-cell rectangle is `[32.25,48.75,32,49]`; the named target is `place:v1:geonames:12`, cell `era5:32:48.75`, explicit zone `Asia/Tehran`. It is **padding only**. Do not simply add 96 to global required-cell subtraction: only 24 correspond to that stated target, while the other cells' required membership and global rectangle ownership need an actual inventory join. Before any acquisition packet is finalized, admit its pinned decoded lineage and reconcile its rectangle against the frozen ownership. If it creates unequal masks within a larger rectangle, stop and explicitly split/replan that ownership. The new full grouped evidence deliberately preserves the prior snapshot; it is not yet a ready-to-submit schedule with the latest sample incorporated.

## Proposed finite continuation from the global schedule

Propose the first **16 grouped requests**, **1,052,544 scalar hours and 363 monthly children**, in the evidence as one finite production-input prefix, subject to reconciliation above and current provider-form acceptance of those exact selections. This is a prefix of global completion, not another stand-alone regional experiment. The complete identities are inspectable before authorization; no automatic continuation, splitting, retry or allowance reset follows from the proposal. Later prefix size depends on measured actual queue/bytes/build behavior and a new decision, not extrapolation from a day.

Proposed limits: **16 submissions total, one active job, zero retries, 32 MiB raw per job, 512 MiB cumulative asset bytes, 1 MiB per metadata response and 32 MiB cumulative metadata bodies; at most 20 polls/job at intervals of at least 30 seconds; one submit, one result metadata GET and one asset GET/job; 30-minute job deadline and 8-hour shared batch deadline.** Stop earlier on any cap, error, unknown format, unexpected origin, coordinates, timestamp, member or revision. Proposed local envelope: **4 GiB total new raw/decoded/index/temp/log files, 512 MiB hard contained process-tree commit, two processes, 256 MiB decoder RSS admission, 96 GiB free disk reserve**. Grouped jobs can emit up to 30 monthly children, so reservations must count all staging/final children, not one four-MiB file. Existing grouped checkpoint reservation formula `(2 × childCount + 1) × 4 MiB + 2 × 32 MiB` is at most **308 MiB** per parent; cumulative retained output still counts toward the batch ceiling.

These are proposed stop/admission limits, not forecasts or claims that the current executor already enforces every one. A future concrete execution packet must pin the final reconciled request list, code/runtime and source metadata; validate actual current provider cost constraints; bind the reviewed grouped importer to these worldwide tile inventories (the current grouped importer is tied to its original regional plan); enforce byte charging, exclusive attempt claims, shared deadlines, tokenless exact-host/size asset retrieval and full-tree containment. Creating another output root cannot reset consumed authorization. This offline task does not inspect credentials or launch that executor.

## Measured sizes and unresolved global feasibility

Measured legacy response: 25,261 raw bytes; decode 0.203 seconds, sampled worker RSS 42,029,056 bytes. Retained two-year March parents: 136,897 bytes for four cells and 143,140 for six cells; four monthly children total 389,121 bytes. Ten-pair sample release: 258,035 bytes. These specific [retained measurements](retained-history-measurement.md) do not predict global transfer, compression or throughput.

Arithmetic lower bound for the unchanged proposed acquisition: **105,144,595,776 bytes** for four-byte scalar values alone. JSONL, coordinates, headers, compressed source files, indexes, lineage, temporary files and filesystem allocation add or change storage costs. Actual 30-year raw response sizes, provider queue/cost limits, full build wall time, operator closure cost and serving-host fit remain unmeasured. Grouping offers fewer jobs while increasing bytes/work per parent; a provider rejection must lead to an explicit smaller regrouped manifest, never silent job multiplication.

A single release child still admits **10,000 cell/zone pairs**. The 56,039-pair global inventory therefore needs multiple children. Schema-5/schema-6 hierarchy now supports up to 256 such children with bounded lineage and a 32 MiB retained-buffer cache. The [synthetic proof](bounded-era5-lineage.md) exercised six children, 5,604 shards and 18,033,393 pins, but did not establish real source-to-shard attribution, scientific coverage, full-scale operator closure, real tile sizes, whole-process serving RSS or deployment. Grouping changes raw/metadata lineage cardinalities; actual grouped parent-to-child attribution and every source pin must survive publication. The existing flat 10,000-source union is not a valid global shortcut.

## Offline validation and reproduction

Final focused verification passed **14/14 tests** and the ERA5 TypeScript configuration passed. No planner source changed after the measured run.

The focused command is `node --import tsx --test tests/providers/climate/production-history-plan.test.ts tests/providers/climate/global-history-plan.test.ts`; `npx tsc -p tsconfig.era5.json --noEmit` checks the planner types. Tests compare expanded grouped versus the original monthly expander's Cartesian hour sets with retained exclusions, reject overlap, preserve leap February and padding, and exercise explicit caps and geometry. The full offline evidence run hashes the 7,098,093-byte input against the frozen pin before parsing, calls `groupLegacyCalendarRequests(plan,{maxYearsPerRequest:30,maxSourceHoursPerRequest:22320})`, counts parents/partitions/scalars, hashes ordered request identities and checks code bytes are unchanged before writing. It completed in **93.223 seconds**, with **336,838,656-byte peak process RSS**, within its cooperative five-minute deadline. These describe schedule computation only. A preliminary multi-variant counting run was stopped without publishing evidence while review hardened validation; no count from that earlier run is used. No provider call, dataset-body read, global solar computation or scientific throughput benchmark is included.

To reproduce counts from the same retained compact plan, save this as a temporary `.mjs` at the repository root and run `node --import tsx <filename>.mjs`. It reads only the pinned compact schedule and prints a summary; it cannot submit requests. The input pin identifies the reviewed plan schema and contents; the grouping helper is not an independent arbitrary-inventory admission API.

```js
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {groupLegacyCalendarRequests} from './scripts/era5/plan-production-history.ts';
const bytes = readFileSync('.data/history-global-proposed-20261015-v1.json');
if (createHash('sha256').update(bytes).digest('hex') !==
    '0b296d22142fea417a71299e17009536f82b14417f33eb4b38baa2ff307d2b12') throw Error('Input pin');
const plan = JSON.parse(bytes), began = performance.now(), digest = createHash('sha256');
let parents = 0, children = 0, scalars = 0;
for (const row of groupLegacyCalendarRequests(plan, {maxYearsPerRequest:30, maxSourceHoursPerRequest:22320})) {
  if (performance.now() - began > 300000) throw Error('Five-minute deadline');
  parents++; children += row.partitions.length; scalars += row.scalarCellHours;
  digest.update(row.sha256 + '\n');
}
if (children !== 9016688 || scalars !== 26286148944) throw Error('Coverage differs');
console.log({parents, children, scalars, identitySha256:digest.digest('hex')});
```
