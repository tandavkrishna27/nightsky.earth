# H2 retained point provenance decision

16 October 2026. Offline review of retained inputs only. No provider calls, downloads, credentials, model calls, deployment or serving promotion.

**Decision: retain the 24-row point sample in quarantine. H2 scientific admission remains open.** The retained evidence does not support converting absent member/revision metadata into member zero/final `expver=0001`. The format decoder already represents this truthfully; no implementation change is warranted by this review.

## Evidence examined

[Machine-readable evidence](data-pilot-evidence/2026-10-16-h2-retained-provenance.json) pins the actual raw ZIP, public process response, retained collection/form extraction and generated request example. The raw and inner-member digests match the [previous contained decode](data-pilot-evidence/2026-10-16-weather-point-decoder.json). This review inspected all global and variable attribute names, rather than treating missing coordinate variables as the whole provenance inventory.

| Retained evidence | Supported conclusion | Admission limit |
| --- | --- | --- |
| Public process response for `reanalysis-era5-single-levels-timeseries` | A regridded ERA5 subset designed for point time series; descriptive prose discusses ERA5T and final replacement | No immutable store revision or assurance that these returned hours carry final `0001` |
| Collection/form extraction and generated request | Product category is Reanalysis; request selects total cloud cover, a point, date list and NetCDF | No explicit product-type/member/expver selector; product/process version `1.0.0` is not scientific revision |
| Actual `tcc` attributes | `GRIB_dataType=an`, `GRIB_totalNumber=0`, parameter 164 and cloud fraction metadata | Analysis type and total-number attribute alone do not bind deterministic member identity or final revision |
| Actual coordinates/variables | Only `tcc`, scalar latitude/longitude and `valid_time`; no `number` or `expver`; no expver attribute anywhere inspected | `coordinates` mentions absent number/time/step/surface names; that string cannot supply their values |
| Actual global conversion history | Converter/version and a conversion timestamp exist | History names `sst` for 2015-01-31, whereas these values are `tcc` for 1990-12-30. It is inherited metadata, not a sample-specific source binding |
| Acquisition and decoder records | Raw asset identity and 24 exact hours at the requested cell are retained | Transport identity, CRC, checksum, valid range and successful parsing do not establish scientific revision |

The inherited history is evidence against using that field as a per-observation lineage certificate. Its presence does not establish that the values are wrong. Likewise, the old observation date and catalogue discussion of final replacement do not independently prove which scientific revision this store generation used. The earlier [contract review](history-timeseries-contract-20261016.md) reports PUG homogenization; this lane found no retained original PUG body establishing a stronger product-specific revision guarantee and does not elevate that secondary summary into one.

## Exact source question needed for a format-specific contract

For DOI `10.24381/1cf1ad76`, dataset `reanalysis-era5-single-levels-timeseries`, ask the provider to establish the following in retained, citable documentation or a written response:

1. Does the store contain only deterministic high-resolution ERA5 analyses for total cloud cover, and what does absent `number` mean after homogenization? Are `GRIB_dataType=an` and `GRIB_totalNumber=0` authoritative for each returned observation or inherited template attributes?
2. For the store generation serving this pinned response, are all 1990-12-30 hours guaranteed to derive from final ERA5 `expver=0001`? Does the same guarantee apply to the entire padded 1990-12-30 through 2021-01-02 baseline? Describe ERA5T replacement, historical corrections and any mixed revisions.
3. Which immutable store/version or provenance identifier binds those assurances to returned bytes? If no per-asset scientific revision is exposed, what reproducible format-specific assurance can consumers retain? Clarify why the global history can name another variable/date.

A useful answer must bind the product/store and time range, not merely repeat the general ERA5 latency description. If authoritative product semantics establish deterministic analysis with a final-only historical horizon, a separate reviewed contract could record that assurance plus the raw digest, evidence digest, supported horizon and transformation version. It should preserve the distinction between provider-backed implicit semantics and an explicit in-file expver value. Such a contract has not been implemented or admitted here.

If that guarantee is unavailable, use the existing legacy `reanalysis-era5-single-levels` route and require observed member/revision evidence through its strict decoder. Another possible source would need its own retained final-revision assurance and bounded importer. Matching a few cloud values between routes would be a diagnostic comparison, not proof of the whole store's revision.

## Practical H3 continuation using the existing planner

Reuse [the offline production history planner](offline-production-history-planner.md), rather than creating a second schedule or accepting the quarantined day as completed coverage. Its independent half-open clock is `1990-12-30T00:00:00Z` to `2021-01-03T00:00:00Z` (263,088 hours per cell). Retain actual coordinates, explicit IANA timezone provenance and cell mappings. Unknown mapping/timezone entries must be resolved before a finite destination inventory is admitted.

The retained production inventory characterization reports 54,822 cells, 56,039 cell/zone pairs and 16,416 verified production cell-hours already present. Those counts imply 14,422,993,920 remaining hours; they establish the size of the requirement, not feasible acquisition throughput. Revalidate the actual retained decoded pins through the planner before subtracting them in any new proposal. The point quarantine contributes zero completed hours.

The next practical acquisition proposal should use a finite inventory for the actual target destination and `prefixJobs=1`. Generate and pin the existing planner output, including its exact missing month/day/hour shape and dataset identity. Its one-cell area remains provider-unproved; the first source job is a format/acceptance and cost benchmark, not authorization for the rest of the baseline. Keep one active job, zero automatic retries, a 32 MiB raw rejection ceiling, 4 MiB/800-hour decoded children and existing process containment. Any new acquisition requires its separate finite allowance; this document executes none.

Measure queue, transfer and decode elapsed time, source/decoded/scratch bytes, process RSS, missing hours and observed member/revision. Stop on provider rejection, unexpected schema, missing provenance or any bound violation. A rejected degenerate area requires a separately reviewed supported rectangle with explicit extra-cell accounting; do not silently change the planner's request. After a successful benchmark, choose a finite continuation from measured cost/throughput and published provider limits. A millions-of-jobs prefix extrapolation is not a practical worldwide plan. Compare the documented point route only after its provenance and long-series resource contract are established; the padded point baseline exceeds the legacy parent-hour ceiling.

H3 acceptance still requires real 1991–2020 observations, explicit cell/timezone coverage, baseline eligibility (including the existing 90% observations/27 qualifying years gates), retained immutable lineage, and measured build/serving fit. The historical method and missingness rules are unchanged.

## Verification

Fresh focused runs: `.data/era5/venv/Scripts/python.exe -m unittest discover -s tests/era5 -p test_point_timeseries.py` — 14 passed; `node --import tsx --test tests/providers/climate/production-history-plan.test.ts` — 6 passed. These verify existing quarantine and scheduling safeguards; they cannot resolve missing provider provenance. No code, scientific admission contract, tracker totals or completion status changed.
