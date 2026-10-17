# Historical cloud API route decision — 17 October 2026

## Decision

Choose **Open-Meteo Historical Weather, explicitly ERA5**, as the sole next API integration candidate. Implement its bounded offline request/decoder contract next. Do not restart CDS acquisition or broaden the provider search. This supersedes the earlier research document's CDS-first recommendation for this lane; it does not supersede scientific admission requirements.

**Production admission remains NO-GO.** No free hosted route has been demonstrated to satisfy the complete existing contract. Open-Meteo is a plausible transport and coverage fit; NightSky's noncommercial eligibility and source provenance remain unresolved. A working JSON response would not resolve either. If those gates fail, retain truthful unavailable history and put the explicit alternatives below to the owner. Do not shorten 1991–2020 or relabel forecast/monthly data.

Scope of this decision: current official documentation reads and repository inspection only. No weather requests, downloaded datasets, accounts, secrets, deployments or measurements. The engineering planning skill was inspected for scope/reuse guidance; this is a bounded route decision, not a claim of a completed interactive engineering review.

## Verified provider facts

Open-Meteo documents global hourly ERA5 from 1940 on 0.25° cells and instantaneous total cloud cover in percent. Its default model blend is unsuitable here. `cell_selection=nearest` avoids default land/elevation preference; `elevation=nan` disables downscaling. Response coordinates describe the selected cell. Crucially, local ISO timestamps use a fixed offset resolved at request time and ignore DST changes across the requested period; Unix timestamps are UTC instants. The application must own historical civil-time conversion. [Historical API documentation](https://open-meteo.com/en/docs/historical-weather-api).

Free hosting permits noncommercial use only, with fewer than 10,000 calls/day, 5,000/hour and 600/minute; the table also lists 300,000/month. Ads, subscriptions, commercial products and promotional activities are commercial examples. Free access to NightSky does not establish eligibility. The data licence and permission to use hosted infrastructure are separate. No availability or completeness warranty is supplied. [Terms](https://open-meteo.com/en/terms).

History on paid hosting requires Professional or higher. Requests longer than two weeks count as multiple calls, and accounting can be fractional; do not treat a thirty-year HTTP request as one call or infer a universal formula from the examples. Paid hosting is a possible owner choice, not a free solution. Attribution must credit source and modifications. [Pricing and accounting](https://open-meteo.com/en/pricing).

These statements establish documented capability, not actual baseline completeness, endpoint latency, final-only scientific revision, unchanged cloud precision or immutable lineage.

## Exact candidate request and admission boundary

Proposed request contract, **not executed**:

```text
GET https://archive-api.open-meteo.com/v1/archive
latitude=<selected point latitude>&longitude=<selected point longitude>
start_date=<partition first UTC date>&end_date=<partition final UTC date>
hourly=cloud_cover&models=era5&timezone=GMT&timeformat=unixtime
cell_selection=nearest&elevation=nan
```

Use at most 14 consecutive UTC dates per partition, one point/model/variable. Partition the padded half-open interval `[1990-12-30T00:00:00Z, 2021-01-03T00:00:00Z)` into 783 full 14-day partitions (263,088 / 336 = 783), with the final inclusive API date 2021-01-02. Confirm actual endpoint end-date inclusivity in the finite pilot; parser expectations remain exact regardless of provider behavior. No overlapping padding between partitions.

Normalize percent to fraction only after confirming `%` units and finite values in [0,100]. Null is missing, never clear. Require UTC offset zero, hourly ordered Unix seconds, equal arrays, one selected cell throughout a build, and no out-of-range timestamps or conflicting duplicates. Preserve raw bytes and hashes in a bounded evidence package when a pilot is authorized. Requested point and actual returned cell must remain distinct. Reject a non-0.25° cell rather than rounding it to manufacture compatibility.

Decode into a new source-specific quarantine envelope with `historicalAdmission:false`. The old artifact schema hardcodes parent ERA5 DOI/units and strict source provenance; Open-Meteo bytes must never be passed off as its existing deterministic final-revision records. A content hash proves retained response identity, not upstream scientific revision. Do not insert invented `number=0` or `expver=0001`.

## Preserve the scientific contract

Reuse [history-api-feasibility.md](history-api-feasibility.md) and `shared/nightsky/climate.ts`: observing nights 1991-01-01 through 2020-12-31, 263,088 padded source instants, actual grid-cell solar altitude ≤ −18°, inclusive 0.1/0.25/0.5 thresholds, independent expected denominators, represented-year and bad-year masks, 90%/27-year availability gates and 80% year-bin/year-month guards. No interpolation or missing-value fill.

Reuse `scripts/era5/aggregate.ts` for darkness and local-noon night grouping after admission. It already consumes an iterable with an independent hourly clock and records astronomy/timezone versions. Pin the runtime timezone rules for a build; a timezone name alone does not pin rules. Keep DST folds as separate UTC instants and no-darkness distinct from zero clear-hour frequency. Cache keys include actual cell, IANA zone, source receipt digest, baseline, method and astronomy/timezone versions. The same cell in two civil zones can produce different summaries.

## Delivery and bounded cost design

A cold point entails 263,088 samples and hundreds of partition requests. It belongs in an explicit bounded background build, followed by persisted derived summaries. A global preload is unnecessary. Process one partition at a time and coalesce builds for the same cell/zone key. Reuse completed summaries across users; month changes do not rebuild source history. A browser request must not wait for thirty years of retrieval and astronomy calculations.

`ClimateContextResultV2` currently accepts available, partial, unavailable and not-covered, **not pending**. During a build return unavailable with a precise building reason and no numeric statistics, or separately design a versioned job-status contract. Do not silently add pending. Point-aware `getClimatology(placeId, month, point?)` injection already exists in `server/mcp/registerTools.ts` and `server/nightsky/planner.ts`; do not duplicate it.

Proposed application ceilings (engineering choices, not provider guarantees): one upstream request in flight application-wide; one point build active; at most 2 MiB decoded JSON per 14-day response; 20-second request timeout; no automatic retry in initial pilot; stop on 429 or any unit/grid/provenance mismatch. Production planning may reserve 800 accounting units per complete point only **after** confirming the provider charges one unit for this exact 14-day shape. Until then the planner must mark accounting unverified and refuse live execution. At most one new point/day initially, below a separate 1,000-unit/day history budget shared across instances. Other Open-Meteo usage shares provider-wide limits too.

The 783-request arithmetic is a request-count bound, not a measured quota charge or latency estimate. Per-response byte limits bound a run to at most 1,566 MiB if all raw chunks hit the ceiling; this is intentionally a worst-case admission cap, not expected storage. Set a smaller aggregate pilot cap below. A persisted ledger and durable derived cache are necessary before multi-instance use; an in-memory mutex is insufficient. If persistence is disallowed, do not promise economical arbitrary-point service after eviction/restart. Infrastructure is not established as cost-free merely because hosted API access is free.

## Finite remaining evidence and owner decisions

| Gate | Exact missing evidence | Exit condition |
| --- | --- | --- |
| Hosted-use eligibility | Owner's deployment/revenue/promotional context against terms | Confirm qualifying noncommercial operation, or reject free tier. Ambiguity requires provider clarification; do not infer approval. |
| Scientific source | Provider-backed semantics for ERA5 cloud: deterministic analysis, final revisions over padded baseline, transformation/quantization, grid mapping/ties/poles, and reproducible version binding | Admit a distinct source contract only if it meets existing requirements. Otherwise owner explicitly chooses a documented source-policy change or leaves history unavailable. Paying does not solve provenance. |
| Wire and accounting | One authorized 14-day, one-point response plus exact calculated quota charge for that shape | Verify boundary dates, 336 hours, units, nulls, grid, bytes, headers and response receipt; stop if mismatch. |
| Full baseline operational fit | Later authorized one-point run after preceding gates | Exactly 263,088 expected slots; independent missingness and year guards; measured elapsed time, CPU/RSS, scratch/cache bytes, restart and quota ledger behavior within declared limits. |

First live measurement proposal, not authorization: one 14-day partition, one request, zero retries, 20 seconds, 2 MiB decoded body and 4 MiB total retained evidence; no automatic expansion. A successful small sample does not establish thirty-year completeness or speed. The subsequent full-point envelope must be explicitly reviewed using measured sizes and quota accounting; do not automatically use the worst-case 1.5 GiB ceiling as permission to download.

If noncommercial eligibility fails, owner choices are Professional hosting, separately funded self-hosting/ingestion, or unavailable history. If scientific admission fails, owner choices are provider clarification or an explicit reviewed change to provenance policy; the baseline years remain unchanged. This is a finite decision boundary, not an instruction to keep researching indefinitely.

## Alternatives closed for this wave

NASA POWER hourly history begins in 2001, so it cannot satisfy 1991–2020. [NASA hourly documentation](https://power.larc.nasa.gov/docs/services/api/temporal/hourly/). NOAA ISD supplies station cloud observations with uneven coverage and broken records; it is not this arbitrary-cell reanalysis contract. [NOAA ISD](https://www.ncei.noaa.gov/products/land-based-station/integrated-surface-database).

Monthly/daily cloud aggregates cannot reconstruct the darkness-conditioned hourly counts. Forecast archives cannot substitute for the baseline. CDS/ARCO remains the separately recorded scientific route with unresolved admission in [history-api-feasibility.md](history-api-feasibility.md); this decision starts no new CDS work. Self-hosting Open-Meteo is an infrastructure project, not a no-cost hosted API fallback.

## Next implementable unit

**Offline Open-Meteo ERA5 quarantine adapter, no runtime enablement.** Four files maximum:

1. New `server/providers/climate/openMeteoHistoryContract.ts`: pure 14-day partition/request builder; exact UTC coverage; unverified accounting marker; strict bounded decoder; source-specific receipt and admission=false.
2. New `tests/providers/climate/open-meteo-history-contract.test.ts`: synthetic fixtures only, covering percent conversion, null/missing hours, duplicate/conflicting times, wrong unit/model selection, grid drift, nonzero timezone offset, end-date boundary and oversized body.
3. New `scripts/era5/plan-open-meteo-history.ts`: dry-run only manifest reporting 783 partitions, all fixed query parameters, expected padded timestamps and blocked admission/accounting. No fetch import or transport capability.
4. Update this decision with offline verification evidence and the resulting exact next gate.

Acceptance: all 263,088 timestamps planned exactly once; no data/secret/network side effects; no source revision invented; no available historical result emitted; test fixtures explicitly synthetic; existing `dark-cloud-v1` contract unchanged. After admission, a separate unit can reuse the aggregate and existing climate injection with a durable job/cache implementation. This avoids building production transport around an unapproved source while producing useful executable work immediately.

