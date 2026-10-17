# Historical API feasibility — 17 October 2026

Task H of the [API regroom plan](../superpowers/plans/2026-10-17-api-first-v1-regroom.md), original tickets 0 and 9. This is an offline assessment of retained evidence. No new source lookup, observation request, job, download, credential access or runtime change occurred.

**Outcome: unresolved feasibility.** The CDS point route has a verified request and a real decoded response, but lacks scientific provenance admission and measured long-series limits. The strict legacy artifact route remains the admitted format fallback; its retained samples do not establish the complete baseline or operational fit. Neither history requirement nor ticket status changes. API geography does not defer history.

## Exact retained contract and evidence

The [generated request receipt](data-pilot-evidence/2026-10-16-timeseries-request-contract.json) establishes dataset `reanalysis-era5-single-levels-timeseries`, DOI `10.24381/1cf1ad76`, with this exact selection:

```json
{"variable":["total_cloud_cover"],"location":{"longitude":48.75,"latitude":32},"date":["1990-12-30/1990-12-30"],"data_format":"netcdf"}
```

Receipt example SHA-256: `e22cc3d278891a22bc02f8ca607f80c00ed6bbffaa9ec5517cbb1bf0df81faae`. This was generated without submission; a later separately acquired sample is documented in [N4 decoder evidence](n4-partitions-and-point-decoder.md). Do not repeat the older [contract note](history-timeseries-contract-20261016.md)'s historical wire-format uncertainty as current status.

The actual response is a ZIP containing one scalar-point NetCDF and 24 hourly values at the requested cell/date. The bounded decoder admits this format only to `era5-point-quarantine-v1`, with unknown member/revision and `historicalAdmission:false`. It accepts at most 800 hours, 2 MiB raw, 64 MiB expanded and 100:1 expansion; these are decoder ceilings, not provider limits or measured full-baseline costs. NetCDF selection did not imply an unwrapped NetCDF response.

The [retained provenance decision](h2-retained-provenance-decision.md) remains authoritative: absent `number`/`expver`, `GRIB_dataType=an`, `GRIB_totalNumber=0` and inherited conversion history do not establish deterministic member zero/final revision `0001`. The global history names a different variable/date. Product/process `1.0.0` is not a scientific revision. This sample contributes zero accepted historical coverage.

The [legacy response](source-resolution-delivery.md) separately proves 24 hours/four cells/96 values with explicit member zero/final `0001`. It cannot validate point-store semantics. Latest [retained reconciliation and route audit](global-history-route-audit-20261017.md) counts 16,512 retained required cell-hours, including 96 padding hours, and 14,422,993,824 remaining for the old finite global inventory. Earlier 16,416/14,422,993,920 figures predate that join. Those inventory figures describe the optional artifact route, not a mandatory API-first worldwide acquisition.

## Scientific contract preserved

Retain `dark-cloud-v1` from the [historical method](../superpowers/plans/2026-10-13-nightsky-historical-statistics.md) and existing structured climate contract:

- Reference **observing-night dates** 1991-01-01 through 2020-12-31 inclusive. Source padding is `[1990-12-30T00:00:00Z, 2021-01-03T00:00:00Z)`, 263,088 expected source timestamps per cell; unpadded UTC baseline arithmetic is 262,992. Count only samples assigned to reference nights.
- Use actual hourly instantaneous total-cloud fractions in [0,1], nearest supplied 0.25-degree cell without interpolation. Record selected point, actual cell, displacement and mapping; model resolution is approximately 31 km, distinct from supplied spacing.
- Compute Sun apparent-center altitude at the selected **grid cell**, refraction disabled, at every historical timestamp; eligibility is altitude **≤ −18°**. Do not replace this with civil night, provider `is_day`, or an arbitrary observing-site mask.
- Group by explicit IANA timezone and pinned rules: before local noon belongs to the preceding calendar date, otherwise the current date. Calendar operations preserve DST folds as separate UTC instants. Cell/zone pairs are distinct build keys. No astronomical darkness produces a distinct no-darkness result, without numeric frequency.
- Preserve independent expected/valid eligible counts, missingness and represented-year/bad-year masks. Inclusive thresholds are 0.1/0.25/0.5; aggregate by summed numerators and denominators. Mean cloud and empirical threshold frequency remain distinct. Neither is whole-night success probability or a forecast.
- Available baseline output needs existing 90% completeness and 27-year gates plus 80% bin-year/month-year guards. Concentrated gaps cannot be diluted by aggregation. Insufficient data remains partial/sample-only or unavailable as appropriate. Missing timestamps are not filled; invalid values/conflicting duplicates reject. Preserve method, source and raw-to-result lineage.

## Unresolved gates and next implementable contract

| Gate | Exact evidence still required | Concrete continuation |
| --- | --- | --- |
| Scientific provenance | Provider-backed deterministic-analysis/member semantics and final-only assurance for the entire padded horizon, bound to an immutable store/version or reproducible product-specific assurance | Resolve the three finite questions in the retained provenance decision. Keep implicit provider semantics distinct from explicit in-file expver. No value-comparison shortcut. |
| Current point service | Current supported point/date/area limits; guide/form disagreement; boundary inclusivity; nearest-cell ties/poles; active variable/units/missing conventions; actual asset origins | Freeze a distinct source contract; reuse generated request and retained response. Older guide summaries are evidence leads, not current service certification. |
| Long-series import | A 263,088-hour padded point exceeds the 800-hour quarantine decoder and 22,320-hour legacy parent cap | Design bounded streaming/partitioned import with exact timestamp coverage, duplicate/revision checks and immutable lineage. Do not merely raise caps or pass quarantined rows to the legacy parser. |
| Operational feasibility | Queue/latency, calls and fair-use terms, payload/expanded/scratch/cache bytes, peak RSS and processing time for the exact admitted shape; cold/restart and concurrent-caller behavior | Only after a separately authorized finite measurement envelope: measure one admitted point/partition, zero duplicate uncertain submissions, explicit deadlines/retries and application-wide budgets. Existing tiny-sample timings do not estimate thirty years. |
| Access and rights | Current account/token/terms applicability, attribution, cache/reuse permissions, exact host allowlist and failure behavior | Keep secrets server-side and scientific provenance separate from transport authorization. A general CC BY data license does not establish service capacity. |
| Point-aware runtime | Verified API selection-to-cell and IANA-zone evidence, supported candidate coverage, response limits and pending/timeout behavior | Preserve `ClimateContextResultV2`; planned injection is `getClimatology(placeId: string, month: number, point?: CalculationPlace): Promise<ClimateContextResultV2>`. Exact adapter modules follow source admission; implement wrong-cell/period/zone/insufficient-year/timeout fixtures before wiring. Unknown mapping returns truthful missing coverage. |

[Weather API research](api-weather-history-research-20261017.md) identifies Open-Meteo ERA5 as a conditional alternative. Admit explicit ERA5, UTC hourly total cloud, full padded period, revision/lineage and exact call accounting; resolve hosted noncommercial eligibility first. Monthly/daily means, NASA POWER's 2001 hourly start, recent forecasts and optional AOD/seeing cannot replace this contract. Other mirror candidates in the route audit remain unadmitted and require their own source/chunk/provenance contracts.

The next implementable unit is a **format-specific provenance and bounded long-series importer design**, consuming the existing request/sample evidence and producing an admission decision plus exact resource limits. Pending that decision, retain the bounded artifact reader and honest gaps. No admitted on-demand history adapter, full baseline, worldwide coverage or closed ticket is claimed here.
