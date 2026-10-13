# Task 9 — NightSky historical cloud statistics detailed plan

> **For agentic workers:** Use `superpowers:subagent-driven-development` or `superpowers:executing-plans`. Steps use checkbox syntax. The owner's subsequent “lets do it” authorizes method review and local H1/H2 execution with existing samples. Larger retrieval, hosting and publication remain separate stages.

**Status:** Task 9 is Partial. Its contract, aggregation, three-place 2025 pilot and MCP integration are complete locally (internal subtasks H1–H4). Serving/release validation (H5), multi-year baseline and global coverage remain open. See [runtime evidence](../../operations/era5-runtime-wave.md).

**Numbering:** H means historical. H1–H5 subdivide Task 9 of the original execution plan; they do not replace its task numbers or identify overall development waves. User-facing progress should name Task 9 and describe the completed work first.

**Goal:** Give source-linked monthly historical cloud context for night-sky planning, with the statistic, period, sampling definition and coverage visible.

**Architecture:** Build validated aggregates off the serving host, then serve versioned, bounded, read-only artifacts through the shared MCP tools. No database, user history, raw global hourly archive or download-on-query pipeline. Missing artifacts and inadequate coverage return explicit unavailable/partial results.

**Tech stack:** Existing Node 24/TypeScript/Zod/MCP runtime and Astronomy Engine 2.1.19; isolated Python 3.12/netCDF4 for ERA5 extraction. Builder dependencies and timezone rules are pinned in the eventual build manifest.

**Spec:** [V1 product scope](../../product-scope-v1-v3.md), [Task 9 execution scope](2026-10-10-nightsky-v1-execution-ready.md), and the proposed design below. This document refines the hourly-source choice validated in [source spikes](../../operations/source-spikes.md).

## Current evidence

| Evidence | What it establishes | What remains open |
|---|---|---|
| Hanle January 2025 | 80,862 bytes; four cells; 744 contiguous hourly UTC instants; eight validation checks pass | Other months, multiple years, dark-time aggregation |
| Kodaikanal–Munnar January 2025 | 84,985 bytes; six cells; 744 hours; eight checks pass | Same gaps; nearby places can share/coarsely approximate grid cells |
| CDS account / ERA5 licence | Owner activated account and approved dataset CC BY 4.0 acceptance | Local private API configuration; reproducible account-independent public build provenance |
| Runtime astronomy | Independent 2024/2026 twilight/horizon fixtures pass | Reference checks at dates in the proposed historical period before relying on its darkness mask |
| Small-host direction | Hetzner 2 CPU / 4 GB; no database | Exact host, measured aggregate RSS/disk/rollback and operating budget |

Source: [ERA5 hourly single levels](https://cds.climate.copernicus.eu/datasets/reanalysis-era5-single-levels?tab=overview), DOI `10.24381/cds.adbb2d47`, accessed 13 October 2026. Preserve exact terms, licence, modifications and Copernicus/ECMWF attribution. These are model reanalysis fields, not observatory measurements.

## Proposed design

### 1. Source and reference period

- Recommended source: actual hourly `total_cloud_cover` (`tcc`, fraction 0–1) on the CDS-supplied 0.25-degree regular ERA5 product grid. The atmospheric model's native reduced-Gaussian grid is about 31 km; the CDS regular product is regridded, not native 0.25-degree model resolution. Record model resolution and supplied grid spacing separately. Retain source issue/revision metadata, `expver`, time units/calendar and missing-value information.
- Proposed full reference period: observing-night dates **1991-01-01 through 2020-12-31**, inclusive. This follows the familiar 1991–2020 reference period, but the resulting custom night/cloud statistic is **not a WMO-certified climate normal**. [WMO reference-period guidance](https://wmo.int/media/news/updated-30-year-reference-period-reflects-changing-climate).
- Prototype stages: existing January samples → all twelve months of one complete year for the three selected places → measured multi-year pilot. One-year results remain explicitly **sample-only**, not a released seasonal climate statistic.
- A recent-period comparison such as 2011–2025 can be evaluated later as a separately labeled product, not blended into the baseline. Changing climate and source revisions limit how well old patterns represent future conditions.
- Monthly-means-by-hour remains an alternative for a **mean-only** product. It cannot produce hourly threshold frequencies, percentiles or whole-night probabilities from a multiyear average. Do not silently substitute it for the selected hourly definition.

### 2. Location and nighttime definition

- Begin with the three verified named-place records and a deterministic nearest supplied grid cell per place. No interpolation in the first implementation. Record cell ID, supplied grid spacing, mapping method, approximate displacement, place-index vintage and timezone. Do not imply site-scale measurement or an entrance/access location.
- Use **each actual historical timestamp** and the selected grid-cell position to calculate the Sun's apparent center altitude with atmospheric refraction disabled. A sample is eligible when Sun altitude is **at or below -18 degrees**. Terrain, extinction, Moon brightness and horizon obstructions are not modeled.
- Input `tcc` is an instantaneous field sampled hourly. Output language must say **hourly dark-time samples**, not measured clear observing hours or continuous one-hour conditions.
- Define an observing-night date using the named place's IANA local calendar: a local timestamp before noon belongs to the previous local calendar date; noon and later belongs to that date. An overnight January 31 session remains January even if its dawn samples fall on February 1. Use calendar operations, not subtracting a fixed 24 hours across DST.
- Group by observing-night month and UTC sample hour, retaining the full year for coverage checks. Local DST folds are distinct UTC instants; nonexistent local hours are not fabricated. Pin and record timezone rules. A build key is **(supplied cell, IANA timezone)**; places sharing both reuse the same statistics. Same cell with different timezones requires separate grouping.
- Fetch bounded boundary padding around the selected observing-night date period so the first/last local nights are complete. At most two UTC days of padding at each edge is sufficient for the configured IANA offsets; fail if the validated timezone range violates that assumption. Count only samples assigned to reference-period observing-night dates.
- When no astronomical-darkness samples exist in a month, report **not-covered/no astronomical darkness**, with no numeric cloud-frequency value. Continuous polar darkness still uses the documented noon-to-noon calendar assignment; label the absence of a natural sunset boundary.

### 3. Statistics and exact meaning

Proposed thresholds are **10%, 25% and 50% cloud fraction**. They are product sensitivity choices, not scientifically established visibility boundaries. Show all three; do not call any threshold "clear sky" or infer that objects were visible.

For each build key / observing-night month / UTC hour:

- `expectedEligibleSamples`: expected hourly source instants passing the astronomical-darkness test, including instants whose cloud value is missing.
- `validEligibleSamples`: eligible instants with a finite cloud fraction in [0,1].
- `belowOrEqualCount[threshold]`: valid eligible instants whose fraction is at or below that threshold.
- `cloudFractionSum`: sum of the valid eligible fractions, accumulated deterministically in float64.
- `yearsWithValidSamples`: number of reference-period years represented for this bin, computed from a uint32 year bitmask (30 years) stored with the bin. Store another uint32 bitmask for represented years whose per-bin completeness is below 80%, computed from actual per-year/bin valid and expected counts during the build. Longer periods need a separately versioned representation.

Returned threshold frequency = `belowOrEqualCount / validEligibleSamples`; returned mean = `cloudFractionSum / validEligibleSamples`. Aggregate selected bins by **summing numerators/denominators**, not averaging percentages or means. Zero denominators yield a missing value, never zero cloud or a perfect score.

Do not multiply hourly frequencies into a whole-night success probability: hours and neighboring cells are correlated. Do not supply binomial confidence intervals treating hours as independent observations. Do not rank every activity with one universal sky score. This product omits seeing, transparency, Moon conditions, local skyglow, weather hazards and equipment limits; the existing planner handles available current evidence separately.

Example response wording: "In the 1991–2020 reanalysis, X% of valid hourly dark-time samples for these bins had modeled total cloud cover at or below 25%. This describes the historical sample definition, not the chance your particular night will be clear. Recheck a forecast near your date."

### 4. Missing data and release quality

| Case | Proposed behavior |
|---|---|
| Missing/masked/non-finite source cloud | Exclude from valid denominator; retain in expected count and report completeness |
| Fraction outside [0,1] | Fail the affected build chunk; review source packing/quantization instead of silently clamping |
| Duplicate UTC timestamp | Fail; investigate overlapping chunks/revisions before merging |
| Missing hourly timestamp | Preserve expected count; mark coverage partial, never fill or interpolate |
| Zero eligible dark-time samples | Not-covered with reason; no frequency/mean |
| Available artifact only covers pilot cells | Outside coverage is unavailable; nearest-cell fallback requires an explicit distance limit and label |
| Returned month or returned UTC-hour bin completeness below 90% or fewer than 27 represented years | Proposed release state partial; do not show a definitive seasonal recommendation |
| Year/month/hour concentrated gaps despite overall 90% | Partial: retain per-year monthly coverage and per-bin below-80% year masks. Any returned bin with a flagged year remains partial; do not hide it by aggregating other bins |

The 90% / 27-year / 80% checks are proposed product quality gates, not WMO rules. Apply coverage gates to each returned bin and to the summary. Selected-bin summaries inherit partial status from any selected bin with insufficient coverage or a bad-year mask; this conservative policy prevents concentrated hour gaps from being diluted. Year/day/hour coverage, missing counts and method must be inspectable. A one-year pilot always remains sample-only regardless of completeness. Physical-value tolerance must be established from actual source packing before build approval; any nonzero tolerance is versioned and reported.

### 5. Artifacts, limits and serving

- Initial builder handles at most **ten grid cells**, one month per source request, one active retrieval, decoded chunk ceiling **32 MiB**, retained raw-data ceiling **256 MiB**, total pilot scratch ceiling **1 GiB**, and an explicitly stopped processing batch of at most **30 minutes**. These are proposed local engineering limits, not authorization for a bulk download or paid worker.
- No full global hourly archive. Build by bounded cell/month batches off-host; validate, aggregate, checkpoint by deterministic chunk ID and delete only task-owned scratch after a verified checkpoint. Keep small raw verification samples and a checksum ledger. No user-state database.
- Proposed maximum single runtime tile **8 MiB**, aggregate cache **32 MiB** by bytes, one tile read at a time initially, and manifest/index metadata ceiling **4 MiB**. Missing/corrupt/oversized artifacts fail closed. These are prototype controls; target-host measurements must establish actual heap/RSS and deployment headroom.
- Each tile carries schema version, key/timezone, period, thresholds, arrays, unit semantics and digest. Manifest carries source DOI/licence/attribution, source checksums/revisions, build-software versions, astronomy/timezone versions, place-index vintage, grid mapping, coverage bounds, generated time and statistic method version.
- Retain counts and the per-bin represented-year and bad-year bitmasks as uint32 and cloud sums as float64 initially. Do not choose uint16 until overflow limits are proven. Store per-year **monthly** quality records and aggregate monthly/UTC-hour arrays; per-year hourly arrays are optional and require a new size calculation.
- A minimum core aggregate has two counts, three threshold counts, two uint32 year bitmasks and one float64 sum: **36 bytes × 12 months × 24 hours = 10,368 bytes per build key**. Per-year monthly expected/valid quality counts add **30 × 12 × 8 = 2,880 bytes**, totaling **13,248 bytes per key** before metadata/indexes/compression. Ten keys: 132,480 bytes; 10,000 keys: 132,480,000 bytes (~126.3 MiB). A full supplied regular grid including both poles has 1,038,240 coordinate cells; one timezone per cell would require **13,754,603,520 bytes (~12.8 GiB)** before headers/indexes, so it cannot be loaded whole on a 4 GB serving host. Timezone splits add keys. This is a representation estimate, not measured compression, runtime fit or build feasibility.
- No 1-degree downsampling labeled as the supplied 0.25-degree ERA5 product. Spatial aggregation and changed threshold statistics need a separate method review. A coarser grid may change the meaning of weather at mountain sites.
- Deploy manifest/tile sets atomically with a previous-version rollback. Runtime makes no CDS request. Refresh the historical artifact as an explicit versioned maintenance operation; do not update it on every user request.

### 6. MCP and planner contract proposal

- Keep the public planned tool name `get_clear_sky_climatology`; consider clearer display title "Historical cloud patterns". Input remains a resolved `placeId` and `month`, with optional selected UTC-hour bins only after their user-facing meaning is reviewed.
- Current unregistered `clearSkyClimatologyResultSchema` requires one numeric `value` and cannot represent missing denominators/multiple thresholds. Replace/refine it with an explicitly versioned structured result before registration, updating shared fixtures and planner types together. No published client migration is claimed.
- Proposed result includes availability/reason, `dataClass: reanalysis`, historical label, actual period, method version, grid resolution/mapping, represented years, expected/valid sample counts, missing fraction, source provenance, mean fraction and threshold-count/frequency rows. Mean and frequency use fraction units [0,1]; user-facing percentages multiply by 100 with distinct labels for mean cloud amount versus threshold frequency. Numeric summaries are absent when no valid samples exist. Do not expose precise host-location hints in artifact logs or results.
- `PlannerServices.getClimatology` continues to receive `placeId/month` and returns the new versioned result; planner/comparison show a historical factor separately from current MET forecasts, preserve gaps, and do not invent a winner.
- No artifact means explicit unavailable. Tool publication, workflow references and the reported registered-tool count change together only after implementation and review.

## Implementation tasks — H1–H4 implemented locally; H5 pending

### Task 9 — statistic contract (H1)

**Files:** create `shared/nightsky/climate.ts`; modify `shared/nightsky/astronomy.ts`, `server/nightsky/planner.ts`; tests `tests/providers/climate/contracts.test.ts` and existing shared/planner cases.

**Consumes:** reviewed definition above and existing result/source/place contracts. **Produces:** `ClimateContextResultV2` and strict typed input, including absent numeric values when unavailable.

- [x] Write failing tests for zero denominator, threshold ordering/bounds, numerator > denominator, finite means, unknown grid mapping, missing provenance, wrong historical label, sample-only versus 30-year baseline, and out-of-range months.
- [x] Run the focused test and verify failure for the missing contract.
- [x] Implement the strict schema and versioned migration from the unregistered legacy contract; keep all current named shared tests meaningful.
- [x] Run contract/planner tests and typecheck; review exact user-visible statistic wording.

### Task 9 — offline aggregation (H2)

**Files:** create `scripts/era5/read_chunks.py`, `scripts/era5/aggregate.ts`; tests `tests/era5/test_read_chunks.py`, `tests/providers/climate/aggregate.test.ts`.

**Consumes:** netCDF chunks + reviewed grid/timezone mapping. **Produces:** `aggregateDarkCloudSamples(samples, mapping, method): ClimateAggregate`, versioned counts/sums/quality records.

- [x] Write failing tiny-fixture tests: values 0/0.1/0.25/0.5/1 obey inclusive thresholds; masked/missing/duplicate/invalid cases; weighted sums across unequal bins; missingness concentrated in one UTC hour/one year remains partial despite good monthly completeness; Jan31/Feb1 observing-night boundary; UTC+14/UTC-12, DST fold/gap, leap day, polar zero/continuous darkness, same cell/different timezone keys.
- [x] Add independent Sun-altitude references from dates inside 1991–2020; verify the mask and sampled-instant interpretation before accepting historical output.
- [x] Verify failures, then implement bounded chunk decoding and deterministic aggregation without silently repairing timestamps or values.
- [x] Compare stream/batch outputs byte-for-byte or with a documented float-sum tolerance; test checkpoint duplicates, interrupted builds and changed source revisions. Atomic decoder outputs and checkpoint validation are implemented; full retrieval/resume orchestration belongs to H3.

### Task 9 — three-place pilot (H3)

**Files:** create `scripts/era5/pilot.py`, `docs/operations/era5.md`; raw/output only under ignored `.data/era5`.

**Consumes:** H2 + owner-configured private CDS credentials and accepted dataset terms. **Produces:** measured request/chunk ledger, complete one-year sample-only artifact and proposed multi-year cost/size/time budget.

- [x] Verify existing January samples/checksums; plan only the missing small chunks, with the declared cell/byte/scratch/time limits.
- [x] Record raw size, queue/download time, decoded memory, build time, aggregate bytes, peak scratch, missing values and source revisions; stop at any limit rather than buying capacity. Scratch is a labeled inventory/staged estimate, not continuous peak telemetry; resumed polling excludes interrupted/offline time. Actual capped batch stop and GET-only recovery passed.
- [x] Run fixtures independently of CDS and compare pilot counts against a direct manual tiny-array calculation. Independent real-data loop also reproduces all 36 monthly/three annual summaries; January boundary night checked literally.
- [x] Review evidence and the next download bounds before expanding to the full baseline; no automatic multiyear/global build. Same-region baseline proposal: 724 jobs, illustrative raw/decoded size projection; older-year validation and separately capped owner-reviewed expansion remain required.

### Task 9 — runtime reader and MCP integration (H4)

**Files:** create `server/providers/climate/era5.ts`; modify `server/mcp/registerTools.ts`, planner/comparison as needed; tests `tests/providers/climate/era5.test.ts`, `tests/mcp/climate-e2e.test.ts`, `tests/all.test.ts`.

**Consumes:** H1 result schema + reviewed H3 manifest/tiles. **Produces:** `getClearSkyClimatology(placeId, month): Promise<ClimateContextResultV2>` and the registered tool.

- [x] Write failing tests for checksums/version/bounds, single-artifact cache admission by serialized bytes (multi-tile LRU deferred), concurrent read admission, unknown place/cell, low completeness, no darkness, no artifact, deterministic results and original attribution.
- [x] Verify failures; implement read-only lookup with bounded tile/cache loading and source-specific availability reasons.
- [x] Exercise resolve → climatology → plan → compare through the actual offline MCP fixture route. Verify historical evidence remains separate from forecast values and real provider calls are unnecessary.
- [x] Run aggregate tests, typecheck, build and independent review; update workflow documentation/tool counts only when registration is ready.

### Task 9 — serving and release validation (H5)

**Files:** update `docs/operations/era5.md`, source register, implementation status, user workflows and relevant platform cases.

- [ ] Measure all enabled indexes plus climate artifacts on the selected 2 CPU / 4 GB host, including cold/warm/concurrent reads and atomic rollback; limits remain below measured capacity with headroom.
- [ ] Verify nearest-cell/timezone coverage labels and low-data states in user-facing output; test source revision/version mismatch.
- [ ] Review statistical meaning, licence/attribution, source terms, privacy/logging and explicit unsupported coverage. No global coverage claim without a measured global artifact.
- [ ] Obtain the explicit scope decision if this historical journey cannot meet its free-data, storage or scientific interpretation gates before public submission.

## Sequence and parallel work

`H1 → H2 → H3 → H4 → H5`. H4 reader design/fixture work can start alongside H3 after H1/H2 stabilize, but real artifact enablement waits for H3 evidence. Source-rights and independent historical astronomy references can run alongside H1. Website/map and hosted platform setup remain separate workstreams.

## Review focus

1. Cloud statistics conditioned on the correct historical darkness samples; no division by zero or unjustified probability claims.
2. Observing-night calendar assignment at timezone/month/year/DST boundaries and correct padding.
3. Denominator bias from missing data, per-year coverage (including exact bin year masks) and irregular/double-counted source timestamps.
4. Actual decoded/cache/heap/scratch bounds, not assuming compressed file size equals runtime memory.
5. Grid/topography/revision ambiguity, truthful partial coverage and preservation of source attribution.

## Decisions for discussion before implementation

The method and V2 contract are adopted for the local H1/H2 prototype following owner authorization and independent review. Review H3 batch limits and measured pilot evidence before expanding retrieval, and H4 runtime artifact controls before exposing the historical tool. January samples do not establish seasonal performance or global coverage. Hosting and processing spending remain separate owner decisions.
