# Open-Meteo history source resolution — 17 October 2026

## Decision

Keep Open-Meteo ERA5 as the sole free hosted candidate and retain the implemented offline quarantine adapter. **Do not admit its output into the existing native ERA5 `dark-cloud-v1` artifact.** Official source inspection resolves several uncertainties, but reveals a specific precision mismatch and does not establish deployed data revision lineage. No transport, dataset request, secret, deployment, or policy relaxation is included in this decision.

The owner has established that NightSky is currently free, with no advertisements or affiliate links. These facts are settled and must not be requested again. They fit the relevant free-service examples; no paid hosting is proposed. Absence of a commercial-product or promotional purpose is a separate business fact not proved by those statements. This is a narrow condition for sustained production hosting, not grounds to repeat the settled questions or block offline work. Open-Meteo also expressly describes free-tier evaluation/prototyping. Recheck eligibility if the operating model changes. [Terms](https://open-meteo.com/en/terms), [pricing](https://open-meteo.com/en/pricing).

## Official evidence and its limits

Source inspected through GitHub's official repository API at commit `01ceed5b028fb6ac19794c3310aed5a4f7aa6d4a`. This pins the code reviewed, **not the deployed service or underlying dataset**. The findings below are code-supported inferences about that implementation. A receipt hash cannot supply the missing deployment/data attestation.

| Concern | Resolution | Remaining consequence |
| --- | --- | --- |
| Variable and deterministic product | `cloud_cover` maps to CDS `total_cloud_cover` / GRIB `tcc`; ordinary ERA5 ingestion requests `reanalysis`, distinct from the ensemble branches. | Request `models=era5` explicitly. A JSON response does not independently attest the ingestion branch. |
| Transformation | Fraction is multiplied by 100; cloud storage scalefactor is 1; ingestion writes `pfor_delta2d_int16`. | Integer-percent quantization is visible in the processing path. Dividing by 100 restores units, not lost precision. Exact threshold-equivalence to native fractions is unsupported. |
| Temporal processing | Cloud interpolation is configured as bounded Hermite (0–100). The requested ERA5 output is hourly. | Configuration alone does not prove interpolation occurred at native hourly instants, or prove no source gaps were interpolated. Do not claim either without a deployed processing attestation. |
| Grid | ERA5 is 1440 × 721, origin −90/−180, spacing 0.25°. Regular-grid lookup rounds offsets; boundary indices are clamped. | Preserve returned cell. In this code +180 selects the final column (179.75), not an automatic wrap to −180; ties round in index space. Poles retain longitude columns. Do not invent a universal geodesic-nearest/wrapping rule. |
| Scientific revisions | CDS query selects reanalysis, but the inspected cloud ingestion does not retain an `expver` lineage receipt per response. | Other branches' `expver=1` constants do not attest ERA5 cloud. Old baseline age alone is insufficient to prove all hosted data were refreshed to final revisions. |
| Accounting | `calculateQueryWeight()` sums per-location `max(1, max(V/10, (days/14)*(V/10)))`, with variables counted across domains. Free-service limiter increments this weight. | One location, model, variable and 14 days computes **1.0** at the reviewed commit. This is a documented/source-derived estimate, not a measured deployed debit. 783 partitions therefore estimate 783 units, not a quota reservation. |

Primary source links: [ERA5 variables and precision](https://github.com/open-meteo/open-meteo/blob/01ceed5b028fb6ac19794c3310aed5a4f7aa6d4a/Sources/App/Era5/Era5Variables.swift), [CDS ingestion and compression](https://github.com/open-meteo/open-meteo/blob/01ceed5b028fb6ac19794c3310aed5a4f7aa6d4a/Sources/App/Era5/DownloadEra5Command.swift), [ERA5 domain](https://github.com/open-meteo/open-meteo/blob/01ceed5b028fb6ac19794c3310aed5a4f7aa6d4a/Sources/App/Era5/Era5Domain.swift), [regular grid](https://github.com/open-meteo/open-meteo/blob/01ceed5b028fb6ac19794c3310aed5a4f7aa6d4a/Sources/App/Domains/RegularGrid.swift), [cell selection](https://github.com/open-meteo/open-meteo/blob/01ceed5b028fb6ac19794c3310aed5a4f7aa6d4a/Sources/App/Domains/Gridable.swift), [query accounting](https://github.com/open-meteo/open-meteo/blob/01ceed5b028fb6ac19794c3310aed5a4f7aa6d4a/Sources/App/Helper/Writer/ForecastApiResult.swift), [free-service rate accounting](https://github.com/open-meteo/open-meteo/blob/01ceed5b028fb6ac19794c3310aed5a4f7aa6d4a/Sources/App/Helper/Vapor/RateLimiter.swift).

## Scientific policy choice is specific

For example, a native fraction just above 0.10 can quantize to 10 percent and then pass an inclusive 0.10 threshold after decoding. Similar boundary issues exist at 0.25 and 0.50. This is a possible effect, not a measured frequency or an established rounding-error bound. A single hosted sample cannot determine how often classifications differ.

The existing policy is preserved. There are two finite ways forward: obtain provider-backed deployed processing/revision evidence sufficient for that policy, or explicitly review a **separate quantized Open-Meteo source/method identity** with the precision and provenance limitations disclosed. The latter must retain 1991–2020, astronomical darkness, independent denominators and missingness/year guards; it must not reuse native-ERA5 provenance labels. No blanket change to source policy is justified. A wire pilot is useful for transport feasibility only and cannot remove this scientific decision.

## Exact one-request pilot proposal — not executed or authorized

One non-sensitive fixed grid point, first existing partition; no location discovery request:

```text
https://archive-api.open-meteo.com/v1/archive?latitude=28.5&longitude=77.25&start_date=1990-12-30&end_date=1991-01-12&hourly=cloud_cover&models=era5&timezone=GMT&timeformat=unixtime&cell_selection=nearest&elevation=nan
```

Exactly one GET; no redirect follow, retry, automatic expansion or second request. Timeout 20 seconds, decoded body at most 2 MiB, total retained evidence at most 4 MiB. Capture request URL, retrieval UTC time, response status/headers, raw bytes, SHA-256, elapsed time and decoded size; run the existing quarantine decoder. Expect 336 ordered UTC hourly slots from 1990-12-30T00:00Z through 1991-01-12T23:00Z, percent units, zero offset and selected cell 28.5/77.25. Record null/missing hours distinctly. Stop on 429, status/redirect failure, cap, unit/grid mismatch or decoder rejection. [Historical endpoint contract](https://open-meteo.com/en/docs/historical-weather-api).

Budget estimate is 1.0 accounting unit from the pinned implementation and pricing, shared with other application usage. This is sufficient for the proposed pilot's one-unit application budget reservation and directly supersedes the earlier requirement to prove deployed debit first; it neither reserves provider quota nor resets any quota. If headers do not expose an authoritative debit, report debit as unobserved; do not spend more calls trying to measure it. The pilot neither requires nor implies scientific admission. Current authorization excludes live API requests, so this proposal remains unexecuted.

## Finite remaining limitations and implementation disposition

1. Production eligibility retains only the separate commercial/promotional-purpose condition above; free/ad-free/no-affiliate facts are resolved.
2. Scientific admission requires the explicit narrow policy choice or provider evidence; current code precision findings make native-threshold equivalence unsupported.
3. A separately authorized one-request pilot can settle wire shape, actual returned cell, response size and boundary behavior. It cannot pin hosted revision or full-baseline completeness.
4. A later explicitly authorized full-point trial would measure 263,088 expected slots, missingness, CPU/memory/storage, restart behavior and aggregate quota use. Durable job/cache/ledger work remains separate.

No runtime contract change is required by this research: its `historicalAdmission:false`, source-specific receipt and `accounting:"unverified"` remain accurate. Here “unverified” means deployed debit unverified; the source-derived 1.0 estimate is now recorded above. The grid decoder deliberately checks lattice membership and cross-partition stability rather than asserting an unverified deployed selection algorithm. No tests were added or run for these documentation-only changes.

