# H2 production source decision

16 October 2026. Public documentation research and local contract review only. No dataset acquisition, credential access, provider contact, deployment, runtime admission change or commit.

**Disposition: retain the point sample in quarantine; prefer the existing legacy route for the next bounded acquisition benchmark. Keep CDS time-series/ARCO as the leading scale candidate, with a narrower provenance question.** Missing `number` is an expected transformation, not independent evidence of an ensemble mix. The documentation does not establish the historical revision of this particular ARCO store. H2 remains open; the evidence supports revising the reasoning, not promoting the sample.

## Primary evidence and its limits

Public sources were inspected on 16 October 2026. Links below identify the exact official pages and relevant sections. These are documentary citations, not a newly retained immutable evidence bundle.

1. [Current ECMWF ARCO/time-series Product User Guide, page 505390919](https://confluence.ecmwf.int/spaces/CKB/pages/505390919/ERA5%2Bhourly%2BAnalysis%2BReady%2BCloud%2BOptimised%2BARCO%2Bdata%2Bon%2Bsingle%2Blevels%2Bfrom%2B1940%2Bto%2Bpresent%2BProduct%2BUser%2BGuide%2BPUG), last modified 5 August 2026: Introduction identifies the geo-chunked store as the time-series source. Methodology describes GRIB ingestion and removal of `number`, `step`, `surface` and `valid_time`. Table 1 includes total cloud cover, fraction 0–1. The access section provides geo- and time-chunked Zarr choices and authenticated access. The time-series section describes nearest-grid selection, NetCDF/CSV conversion and a 5° area limit, while warning of weaker operational support and changing formats. Daily-update prose addresses new data, without specifying a historical replacement/backfill algorithm or immutable snapshot identifier. This is direct product evidence; it does not explicitly identify deterministic HRES selection or the original `expver` of historical chunks.
2. [Current ERA5 data documentation, page 76414402](https://confluence.ecmwf.int/spaces/CKB/pages/76414402/ERA5%2Bdata%2Bdocumentation), sections Data update frequency, Data format, Data organisation: final ERA5 overwrites ERA5T on CDS after roughly two months. GRIB distinguishes final `0001` from preliminary `0005`; homogeneous NetCDF may not expose that distinction. HRES and EDA are separate products/streams; CDS provides analyses when available. **Inference:** these semantics make final HRES the normal expectation for a 1991–2020 historical CDS reanalysis request. They do not explicitly describe the secondary ARCO store's refresh procedure. A final revision label also does not mean a permanent immutable byte version.
3. [CDS time-series catalogue, DOI 10.24381/1cf1ad76](https://cds.climate.copernicus.eu/datasets/reanalysis-era5-single-levels-timeseries?tab=overview): global hourly point-oriented coverage from 1940, atmospheric grid 0.25°, NetCDF/CSV and daily updates. It discusses ERA5T and later final release. **Inference:** hourly quarter-degree atmospheric data and the reanalysis-only local form strongly support HRES interpretation, but the catalogue's generic ensemble paragraph is not an explicit member-selection contract.

Search hits also exposed [PUG historical version 5, March 2025](https://confluence.ecmwf.int/pages/viewpage.action?pageId=514296174) and [version 18, July 2026](https://confluence.ecmwf.int/pages/viewpage.action?pageId=704944501). Both explicitly identify themselves as old versions; their current-version links converge on page 505390919. Do not present the old experimental warning or old variable list as the current catalogue state. An apparent PDF PUG URL failed to open (502), and its search extraction concerned monthly regional series; it was not used to establish this contract. No report body was downloaded locally.

## What should change in the local reasoning

The [retained review](h2-retained-provenance-decision.md) correctly preserves unknown provenance. However, demanding an in-file member coordinate for every future format would reject an intentional provider transformation. A format-specific contract can encode provider-backed deterministic product semantics separately from observed metadata. It must not claim that member zero was read from the file; HRES is also not the EDA control member merely because local normalization calls it zero.

Likewise, an immutable provider snapshot ID is desirable, but is not a universal prerequisite for reproducible local science. A retained raw-byte digest, exact request, acquisition time, documentary evidence, transformation version and coverage manifest can make the acquired artifact reproducible even if a subsequent provider request changes. This does not repair an unknown scientific revision. Do not confuse artifact identity, experiment revision and store snapshot identity.

The actual retained sample's inherited conversion history names another variable/date; it cannot certify the sample's source generation. That anomaly does not demonstrate incorrect cloud values. Its 24 rows remain zero admitted baseline coverage. The distinction between a credible HRES inference and a provider-backed final-revision guarantee is material.

## Precise outstanding provider question

No message has been sent. If no stronger published source is found, ask:

> For total_cloud_cover in the surface geo-chunked ARCO store underlying DOI 10.24381/1cf1ad76, does the complete interval 1990-12-30 00:00 UTC through 2021-01-02 23:00 UTC contain only deterministic HRES analyses derived from final ERA5 expver=0001? How are ERA5T replacement and later historical corrections propagated to existing chunks, and does this guarantee apply to the store used by the retained 16 October 2026 response? Which generation identifier, change log, or dated product-level assurance can consumers retain when number/expver are absent?

A product-wide dated guarantee plus local byte pins may be sufficient; a bespoke guarantee for every observation is unnecessary. If the provider cannot bind the retained response, admit only newly acquired artifacts under a reviewed prospective contract. A matching one-day legacy comparison would diagnose differences, not establish all-store lineage.

## Production choices

| Route | Proposed role | Practical constraint |
| --- | --- | --- |
| Existing legacy CDS single-level reanalysis | Immediate finite benchmark using existing strict admission | Conservative one-cell monthly scheduling is unmeasured; degenerate area acceptance remains unresolved. Observe revision/member evidence rather than default it. GRIB is a future alternative if NetCDF suppresses required metadata, requiring its own importer contract. |
| CDS point time-series | Leading sparse-destination bulk-history candidate after provenance resolution | Long-series decoding/streaming and resource containment still need a separate contract; current parent ceiling cannot hold the padded baseline. |
| Direct official ARCO geo-chunked access | Potential chunk reuse across nearby inventory cells | Same provenance question as its time-series frontend; new authenticated transport, chunk manifests, decompression bounds and actual read amplification need measurement. |
| ARCO time-chunked or bounded legacy spatial tiles | Candidate for dense/global processing | Excess cells, duplicate hours and storage must be explicitly budgeted; no throughput or cost result exists here. |
| Monthly/daily aggregate replacement | Not suitable for the existing hourly historical method | Aggregation loses the hourly values needed for local-night selection, missingness and eligibility gates. A different source/method requires a separate scientific decision. |

The ARCO alternatives follow the current PUG's documented layouts; their performance ranking is an engineering hypothesis, not measured throughput. A full global grid is unnecessary for a finite named-destination product, while a named-destination inventory is not proof of arbitrary-coordinate global coverage.

## Bounded benchmark design awaiting pinned execution envelope

Reuse the [offline history planner](offline-production-history-planner.md) and revalidate actual retained decoded pins before subtraction. Supply a finite target inventory with resolved coordinates, cell mapping and IANA timezone provenance; pin its hash. Generate `prefixJobs=1` and retain the exact missing month/day/hour shape. This designs a single legacy format/acceptance/cost benchmark. It is not ready for acquisition approval or download: the planner pins request shape, not an executable network envelope.

Proposed bounds are one active job, zero automatic retries, a 32 MiB raw rejection ceiling and 4 MiB/800-hour decoded children. Before execution can be reviewed, pin the exact output paths and cumulative path/output budget, hard wall-clock deadline, submission/request/poll counts and intervals, HTTP response/header bounds, per-request timeout, process RSS/CPU limits, aggregate scratch/decompressed-byte ceiling, and containment/termination behavior. Bind these to the exact request and allowance identity. Existing process containment must be verified against that envelope. The offline planner input/output/time limits are not network, download or worker-process limits. Measure queue, transfer, decode duration, raw/decoded/scratch bytes, RSS, returned cells, missing timestamps and observed revision/member. Stop on unsupported area, schema/provenance failure or a bound violation. A rejected one-cell area requires a separately specified supported rectangle and extra-cell accounting; do not silently expand it.

Only after provenance and importer review should a separately bounded time-series benchmark use one cell and a modest interval such as one year. Do not jump to 263,088 hours: the existing 22,320-hour parent cap is smaller. A subsequent full-baseline proposal needs a streaming monthly importer and measured resource envelope. For direct Zarr, first freeze the exact metadata/chunk request set and compressed/decompressed limits; a lazy array call is not itself a network bound.

The retained characterization is 54,822 cells and 56,039 cell/zone pairs, 263,088 required timestamps per cell, with 16,416 verified hours and 14,422,993,920 remaining hours. Those are local requirement counts, not provider feasibility. At four bytes per scalar the remaining values alone are about 57.69 GB decimal, excluding timestamps, masks, lineage, compression, duplicate transfer and build intermediates. Neither millions of monthly jobs nor one long request per cell has demonstrated practical completion time. Resolve the source contract, benchmark finite jobs, then choose a finite continuation from actual throughput and provider limits. Keep the 90% observation and 27 qualifying-year gates and measured serving/build-fit requirements.

## Review outcome

Only this decision document was written. Documentary inspection supports narrowing H2 to product-selection confirmation and historical ARCO replacement semantics. It does not close H2/H3, alter runtime contracts or authorize acquisition. No tests were needed for this documentation-only research lane.

