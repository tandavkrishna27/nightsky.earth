# Global acquisition approval proposal — 16 October 2026

**Blocked proposal: the current provider form rejects rows 2 and 5. Execution remains unapproved.** See the [subsequent exact form review](weather-request-readiness.md) and [sanitized observations](data-pilot-evidence/2026-10-16-cds-form-readiness.json). The v3 packet is retained unchanged as rejected proposal evidence; it must not receive a form-reviewed flag or execution allowance. The research below predates that browser check. All remaining sections are retained historical proposal text, not current execution instructions. The new browser record confirms the form displayed existing licence acceptance; no acceptance was performed. Public documentation was inspected on 2026-10-16; no authenticated account, credentials, provider costing/constraint helper, submission, job, dataset body or browser state was accessed. This document creates neither an allowance nor a provider-acceptance record.

## Historical proposal — rejected, not executable

The earlier proposal sought approval for one attempt at the existing ordered 16-request production-input prefix, using the pinned executor and limits below, writing to a specifically reviewed new absolute output directory and durable authority directory. Unknown submission outcomes consume attempts. There is no automatic retry, regrouping, additional prefix, source substitution, deployment or global-completion authorization.

The controlling artifact is `.data/global-acquisition-preparation-20261016-v3/packet.json`, 38,304 bytes, SHA-256 `40ebd34f37fe83016e0d7ec9adb6a115daeddf75710aeb006eedfb372f59bde8`. Its [sanitized receipt](data-pilot-evidence/2026-10-16-global-acquisition-overlay-preparation-v3.json) contains all 16 ordered request hashes, six exact code hashes, executable hash and package versions. Incorporate that entire receipt by reference; do not approve a prose-equivalent regenerated packet. Any changed source, code, runtime, limit or request requires a newly pinned reviewed packet.

Source pins: frozen plan `0b296d22142fea417a71299e17009536f82b14417f33eb4b38baa2ff307d2b12`; reconciliation `a5cc2399ca627fbf23a3a776182f93235c37dab2bd639c954d7ed5d1a200a2ba`; retained asset-origin evidence `6038f89252b2144afa4dae0910ebe8b45275140addeac268d6ab201b6e872747`. Runtime: Python 3.12.14, netCDF4 1.7.3, NumPy 2.5.4, requests 2.34.2; interpreter SHA-256 `b847bb9f4e48c19f585c8bf7d8b355f3f8c6d2125717ece9c9d7e16fb9f09de8`. The added ownership-overlay pin is `3e7c22f35afa2f44e59bedafafc0226d8d4a373c163e0de63ece38cd2c8f3235`; executor code pin is `bb094c33546f2850dc9bc011e5846f6767aab7ede33c95be7abd759d300004e9`. The [overlay admission checks](history-overlay-executor.md) independently resolve the four unequal-mask owners for their unaffected clocks and admit only the exact pinned replacements for the retained day. None of those owners or replacements occurs in this unchanged ordered prefix. The earlier v1 and v2 packets remain historical evidence and has stale executor runtime pins; they are not the controlling artifacts. Further source or runtime changes require another explicit packet review.

## Exact selections and coverage

Dataset `reanalysis-era5-single-levels`, DOI `10.24381/cds.adbb2d47`; request constants are `product_type:["reanalysis"]`, `variable:["total_cloud_cover"]`, `data_format:"netcdf"`, `download_format:"unarchived"`. Request keys are precisely `area`, `data_format`, `day`, `download_format`, `month`, `product_type`, `time`, `variable`, `year`. Year/month/day/time selections are string arrays; area is numeric `[north,west,south,east]`. All rows select every UTC hour `00:00`–`23:00`; day ranges below mean explicit zero-padded arrays. Member zero and final revision `0001` are response admission requirements, not additional request keys.

Rows 1–15 use tile `100:213`, area `[-39.75,-73.5,-40,-73.25]`. Required cells are `era5:-39.75:-73.25` and `era5:-40:-73.5`; fillers are `era5:-40:-73.25` and `era5:-39.75:-73.5`. Row 16 uses tile `100:214`, area `[-39.75,-73,-40,-72.75]`, required cells `era5:-39.75:-72.75` and `era5:-40:-73`, fillers `era5:-40:-72.75` and `era5:-39.75:-73`. Each rectangle has exactly four quarter-degree nodes.

| Ordered row | Years | Month | Days | Timestamp hours | Monthly children |
| --- | --- | --- | --- | ---: | ---: |
| 1 | 1990 | 12 | 30–31 | 48 | 1 |
| 2 | 1991–2020 | 01 | 01–31 | 22,320 | 30 |
| 3 | Non-leap years in 1991–2020 | 02 | 01–28 | 14,784 | 22 |
| 4 | 1991–2020 | 03 | 01–31 | 22,320 | 30 |
| 5 | 1991–2020 | 04 | 01–30 | 21,600 | 30 |
| 6 | 1991–2020 | 05 | 01–31 | 22,320 | 30 |
| 7 | 1991–2020 | 06 | 01–30 | 21,600 | 30 |
| 8 | 1991–2020 | 07 | 01–31 | 22,320 | 30 |
| 9 | 1991–2020 | 08 | 01–31 | 22,320 | 30 |
| 10 | 1991–2020 | 09 | 01–30 | 21,600 | 30 |
| 11 | 1991–2020 | 10 | 01–31 | 22,320 | 30 |
| 12 | 1991–2020 | 11 | 01–30 | 21,600 | 30 |
| 13 | 1991–2020 | 12 | 01–31 | 22,320 | 30 |
| 14 | 1992, 1996, 2000, 2004, 2008, 2012, 2016, 2020 | 02 | 01–29 | 5,568 | 8 |
| 15 | 2021 | 01 | 01–02 | 48 | 1 |
| 16 | 1990 | 12 | 30–31 | 48 | 1 |

Total: 16 jobs, 363 monthly children, 1,052,544 scalar cell-hours, half required and half fillers. Rows 1–15 span the full padded 263,088-hour clock for one rectangle; row 16 adds only 48 padding hours for the next. Successful response acquisition alone would not establish scientific eligibility. The global target remains 236,042 named destinations, 54,822 required cells and 56,039 explicit cell/IANA-zone pairs; the prefix is not worldwide coverage. Keep the frozen zone identities, 1991–2020 local observing nights, astronomical darkness, completeness and qualifying-year gates in the [baseline plan](validated-legacy-baseline-plan.md).

## Public provider constraints: established and unknown

The current [CDS documentation](https://confluence.ecmwf.int/spaces/CKB/pages/174856258/Climate%2BData%2BStore%2BCDS%2Bdocumentation), updated 2026-04-23 and inspected 2026-10-16, lists 120,000 fields for ERA5 hourly single levels. Its table says last reviewed October 2024; the page warns that limits change with workload and apply to API requests too. It recommends smaller requests and generating requests from the dataset form. It defines Accepted as queued, not completed. CDS data are free/open subject to licences. Those statements are documentary guidance, not a current cost quote or service guarantee.

For this one-variable, one-product selection, a conventional field count is its timestamp count: at most 22,320 per parent, below that published 120,000 figure. This is an inference, not a live evaluation of CDS's cost model. Four grid cells produce at most 89,280 scalar values per prefix parent; scalar values must not be confused with fields. Valid Gregorian dates and separate leap-year February shapes establish local calendar validity, not provider acceptance of 30-year groups or current conversion limits. No public numeric concurrency, account quota, weighted-cost ceiling or queue-duration guarantee was established for these exact selections.

The [current dataset page](https://cds.climate.copernicus.eu/datasets/reanalysis-era5-single-levels?tab=download), displaying update date 2026-10-16, confirms the dataset identity and CC-BY licence. The read-only web extraction did not expose the populated form or generated request; it cannot substantiate a current-form-reviewed flag. The [official API guidance](https://cds.climate.copernicus.eu/how-to-api), inspected 2026-10-16, requires manual dataset terms acceptance and directs users to the form's generated API request. Account licence state was not inspected. Neither documentation nor the retained one-day/two-year results proves this exact prefix has been accepted.

## Immutable attempt envelope

| Resource/action | Maximum or required control |
| --- | --- |
| Jobs | 16 submissions, one active job, zero retries; one submit/result-metadata GET/asset GET per job |
| Polls | 20 per job, at least 30 seconds apart |
| Time | 30 minutes per job; 8 hours shared batch deadline |
| Raw assets | 32 MiB per job; 512 MiB cumulative, charged before writing |
| Metadata | 1 MiB per response; 32 MiB cumulative, charged before parsing |
| Local allocation | 4 GiB total new output/authority/temp files; retain 96 GiB free reserve |
| Processes | Windows Job: 512 MiB hard process-tree commit, at most two processes |
| Decoder | 256 MiB sampled RSS admission; not an OS RSS quota |
| Retrieval | Tokenless separate asset session; HTTPS exact hosts `cds.climate.copernicus.eu`, `object-store.os-api.cci2.ecmwf.int`; no redirects |

The poll allowance can expire before the 30-minute deadline; neither allowance is a promise to wait until completion. Disk checks are sampled/cooperative, not a filesystem quota. The staging reservation counts every child: `(2 × childCount + 1) × 4 MiB + 2 × 32 MiB`, maximum 308 MiB per parent. Stop on any cap, non-success/error/unknown submission outcome, unexpected host or redirect, inconsistent size/header/stream bytes, source/runtime pin change, ownership/mask mismatch, unrecognized format, wrong coordinates/clock/member/revision, or decode/publication failure. Preserve consumed claims and partial output for independent reconciliation; do not reset them by deleting files or choosing another directory. Local termination does not prove a remote queued/running job was cancelled.

## Checks required before execution approval

1. Review all 16 exact selections against the current provider form and generated request, including current cost/field validation, NetCDF/unarchived compatibility and calendar restrictions. Preserve dated sanitized evidence bound to the packet and ordered request hashes. A shape match is not evidence of provider queue acceptance. Any interactive/account access or provider costing call needs its own authorized scope; none was performed here.
2. Confirm the owner account's applicable terms, current operational suitability and whether a 20-poll/30-minute abort policy is acceptable for a shared queue. Resolve any provider rejection by preparing a new explicit manifest; never silently split requests.
3. Recheck source/runtime pins and the concrete absolute output/authority paths, fresh disk reserve, Windows containment and exclusivity immediately before launch. Reconcile any changed baseline metadata explicitly.
4. Obtain the owner's decision for this packet and envelope. Only then may the required separate allowance and truthful provider-review evidence be created under the executor contract. This proposal supplies neither. Unknown future cache hosts require a new review; the retained origin sample does not guarantee routing.

## Global feasibility and cost

The frozen grouped schedule has 373,619 parents, 9,016,688 monthly children and 26,286,148,944 scalar hours including fillers. CDS's free access removes a data purchase fee; it does not remove queue, processing, storage, transfer infrastructure or operator costs. Four bytes per scalar alone total 105,144,595,776 bytes before lineage, JSONL, indexes and staging. The finite 4 GiB envelope cannot authorize retaining that global result.

No throughput estimate follows from a successful tiny sample, a published field limit or an eight-hour local cutoff. Even every permitted poll could create up to 320 status calls in this prefix; extrapolating the same design to hundreds of thousands of jobs requires a new feasibility decision. Measure actual queue time, conversion time, raw and decoded sizes, retained lineage cost and scientific completeness before proposing continuation. The separate time-series product remains a distinct, incompletely admitted contract ([retained contract](history-timeseries-contract-20261016.md)); no free alternative has been established here as equivalent for exact quarter-degree cells, padded timestamps, final-revision proof and immutable lineage. Source and feature scope remain unchanged.
