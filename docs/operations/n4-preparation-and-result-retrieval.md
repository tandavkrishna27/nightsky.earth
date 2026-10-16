# N4 boundary preparation and existing weather result

16 October 2026. Continues the fixed G2/H2 work items. The owner authorized retained geography preparation and retrieval of the already completed weather job from the exact ECMWF asset host. No new CDS submission or deployment occurred.

## Geography changes and evidence

The importer now supports compact production identity mappings with provenance derived from the pinned Natural Earth policy. Provider keys remain separate from reviewed region IDs and country assignments. Explicit options recognize the exact CRS84 declaration and remove only consecutive identical coordinate positions, recording original provider/ring/position indices. Defaults continue to reject these transformations. Raw inputs and pins remain unchanged.

Geometry validation now uses bounding-box candidates with the existing intersection predicate and tolerance. Sorting and active-pair inspections consume the work budget; worst-case overlap still stops at that budget. No vertex, byte or production work ceiling increased.

Thirty-four focused geometry, ingestion, coverage and membership tests passed. A retained-source probe under a 2 GiB Windows Job and 60-second deadline checked the largest ring in each layer, with source hashes verified before and after:

| Layer | Positions | Counted work | Ring check time | Result |
| --- | ---: | ---: | ---: | --- |
| ADM0 | 22,908 | 384,250 | 59 ms | No self-intersection detected |
| ADM1 | 15,953 | 277,916 | 48 ms | No self-intersection detected |

Total supervised elapsed was 0.608 seconds; sampled main-process peak RSS was 461,459,456 bytes. These are two ring checks, not full topology, membership or server-capacity acceptance. The initial probe harness failed on Windows module-path syntax before reading sources; its evidence is preserved.

**G2 remains partial.** Full inputs exceed the current vertex ceiling. The downstream preparation descriptor still repeats full mappings and has a 1 MiB cap. Seven state features lack names, and country-code exceptions need reviewed semantics. Next preparation must use bounded whole-feature partitions with an exact disjoint provider inventory, compact downstream mappings and cross-partition membership checks. It must preserve every part/hole and reject omitted or duplicate regions. No fabricated names, country assignments or automatic data promotion occurred.

## Weather acquisition and actual format

A separate, single-use retrieval allowance preserved the expired original job records. The reviewed retrieval adapter admits only HTTPS `object-store.os-api.cci2.ecmwf.int`; it cannot submit or poll. It performs one metadata GET and one asset GET, with no redirects or automatic retries. Bounds are 2 MiB raw, 128 MiB scratch, 30 minutes, one worker and 512 MiB Job memory. The private token stays in the child/API session and is absent from the asset session and reports.

Retrieval succeeded in 2,250 ms: **15,028 bytes**, SHA-256 `b1ba3a848d14aea362a9af6cbbe32c79a0f8681213bde5eeb747729c47c99c56`. No new job was submitted. Original checkpoint and job-identity hashes remained unchanged.

Credential-free offline inspection used a separate 512 MiB Job and 60-second deadline. Direct NetCDF inspection initially failed because the response is a ZIP archive. Bounded archive inspection found exactly one NetCDF member, verified its CRC and extracted to a fixed local name. The member is 14,815 bytes, SHA-256 `08ab00f75baf4e8f0dad1b398f9457ae190fda8b9899bbbbfea25d74a52f3e81`.

| Field | Observed result |
| --- | --- |
| Format | ZIP containing NETCDF4 |
| Coordinates | Scalar latitude 32, longitude 48.75; requested point matches |
| Time | 24 hourly timestamps, 1990-12-30 00:00 through 23:00; 3,600-second steps |
| Calendar | proleptic_gregorian; seconds since 1970-01-01 |
| Cloud cover | `tcc(valid_time)`, float32, `cloud_area_fraction`, units `(0 - 1)` |
| Values | 24 finite, unmasked values; min 0, max 0.925628662109375 |
| Missing-value encoding | NaN fill value; none missing in this sample |
| Member/revision | No `number` or `expver` variable; semantics remain unverified |

**H2 remains partial.** Existing cloud-unit handling accepts these units, but the production decoder expects raw NetCDF with latitude/longitude dimensions and member/revision variables. It needs a separately reviewed ZIP and scalar-point time-series path; it must not invent missing member/revision provenance. The legacy fixed four-cell sample validator also does not describe this one-point result. Inspection is not production scientific admission. This one day proves neither the 1991–2020 baseline nor global coverage or acquisition throughput.

Raw data is retained in the ignored local retrieval directory. It has not been installed as serving data. Subsequent decoder work can use these retained bytes without another download.

## Review and verification

Independent reviews passed for geography and retrieval. Review caught Python site-startup exposure before retrieval; the child now starts with `-I -S -B`, covered by a regression test. Eight focused retrieval tests and all 118 ERA5 tests passed, with the full Python suite independently rerun by the coordinator. TypeScript checks and root-run focused geography checks passed. Full Node suite: 855 passed, one existing skip, zero failures. Exact-commit CI is checked after push; a local pass alone does not establish CI success.

Original acceptance remains **12 Done / 9 Partial / 6 Not started**. N4 and S2 remain in progress; S3/S4 still require actual admitted release files. Next actions are the bounded geographic partition/mapping contract and the observed weather-format decoder, followed by their existing source/science acceptance gates.
