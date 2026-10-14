# Bounded historical acquisition proposal

**Goal:** Measure actual grouped ERA5 response format, cost and two-year sample statistics for the existing Hanle and Kodaikanal/Munnar footprints with at most two new jobs.

**Architecture:** Reuse the offline grouped planner and bounded acquisition/import path. Retain immutable raw parents and checksummed monthly children in a separate root. This is an owner review proposal, not acquisition authorization or a baseline release.

**Tech stack:** Existing Python grouped planner, NetCDF decoder and historical aggregator. **References:** [historical evidence](historical-baseline-wave.md), [grouped path](grouped-history-wave.md), [active tiles](climate-tiles.md). The writing-plans skill informs this packet; requested operations location and proposal-only scope supersede implementation/commit steps.

## Known evidence and excluded jobs

The sanitized legacy ledger contains four complete checkpoints: `hanle-1990-12-boundary`, `hanle-1991-01`, `hanle-1992-01`, `kodaikanal-munnar-1991-01`. Its remote ledger records all four complete, with no queued or uncertain entry. Do not submit these again or request a grouped January containing them. The other 48 legacy chunks remain incomplete. A fresh grouped root does not imply permission to duplicate legacy source coverage.

Retained raw total was 272,255 bytes and scratch 693,965 bytes before the final report. The earlier four jobs had queue times 49.421–118.453 seconds, downloads 0.828–1.110 seconds and decode peaks below 66 MiB. These monthly measurements do not predict a grouped response. Incomplete processing measured Hanle January 682 expected / 680 valid dark-hour samples over two represented years, Kodaikanal 590 / 294 and Munnar 598 / 298. Missing planned data stays missing; these are sample diagnostics.

## Exact proposed selection

Select only the first two jobs from the prior four-job grouped proposal; February/leap jobs remain deferred. Each March request spans two years and thus tests disjoint-year partitioning. Two jobs are the smallest batch exercising both four-cell and six-cell footprints; four requests are unnecessary for this question.

| Order / grouped chunk | Years | Month/days/UTC hours | Area [north, west, south, east] | Expected clocks / cells |
|---|---|---|---|---|
| 1 `hanle-03-1991-1992` | 1991, 1992 | March 01–31; every hour 00:00–23:00 | [33, 78.75, 32.75, 79] | 1,488 / 4 |
| 2 `kodaikanal-munnar-03-1991-1992` | 1991, 1992 | March 01–31; every hour 00:00–23:00 | [10.25, 77, 10, 77.5] | 1,488 / 6 |

Exact shared CDS request: dataset `reanalysis-era5-single-levels`, `product_type:["reanalysis"]`, `variable:["total_cloud_cover"]`, `year:["1991","1992"]`, `month:["03"]`, `day` is every two-digit string 01 through 31 inclusive, `time` every two-digit hour with `:00`, `data_format:"netcdf"`, `download_format:"unarchived"`. Only `area` differs. No explicit `grid` request field is added: the selected dataset supplies the 0.25-degree atmospheric reanalysis grid. Validate exact expected cells from the existing plan; do not infer native resolution or accept resampling.

The following is a locally checked selection envelope, not an input file understood by the acquisition CLI:

```json
{
  "proposalVersion": 1,
  "dataset": "reanalysis-era5-single-levels",
  "root": ".data/era5/grouped-history-1991-1992-v1",
  "startYear": 1991,
  "endYear": 1992,
  "manifestSha256": "5eb57ba09de53fd9c8881d66444e2aecf868b9640bc9e2ccaff982f132cc565d",
  "selectedChunks": ["hanle-03-1991-1992", "kodaikanal-munnar-03-1991-1992"],
  "maximumNewSubmissions": 2,
  "maximumConcurrentJobs": 1,
  "overallSeconds": 1800,
  "rawParentBytes": 33554432,
  "selectedRawTotalBytes": 67108864,
  "taskScratchBytes": 1073741824,
  "importPeakRssBytes": 268435456,
  "automaticRetries": false
}
```

Offline validation regenerated the existing 30-job two-year manifest, confirmed its exact digest, both selected chunk identities and 1,488 unique valid clocks per job, and confirmed none of their four monthly child IDs intersects completed legacy IDs. No fetch path or credentials were used. The full manifest is a software contract; its other 28 groups are not selected here. The transport enforces at most four durable submissions per root; the stricter two-job proposal and overall deadline remain operator gates, not a new automated scheduler.

## Budgets and stop rules

All following limits are proposed conservative ceilings, not measured grouped sizes or global estimates. One active job; at most two submissions; 30 minutes total including queue, transfer, import and inspection. Existing CLI imposes a separate 30-minute whole-child deadline and network operations at most 30 seconds. External supervision must use the remaining overall time, especially for job two, because the CLI's per-job deadline alone does not enforce the batch deadline. Do not start another job after expiry.

Each raw parent is at most 32 MiB, so this selection retains at most 64 MiB raw. Four final monthly JSONL children are at most 4 MiB each (16 MiB total), and each parent's partition index has a 4 MiB bound (8 MiB total). Reserve up to 88 MiB for selected retained data plus manifest/ledgers/reports; all count toward the 1 GiB root scratch limit. The existing plan's 512 MiB retained-raw ceiling is not permission to fill it. Each two-partition job's transport preflight reserves 92 MiB additional scratch: two 32 MiB raw staging/copy allowances, 8 MiB overhead and 20 MiB staged/final decoded/index allowance. Import peak RSS gate is 256 MiB, checked cooperatively; it is not an OS memory quota. Verify available disk before starting and keep prior checkpoints outside the new root untouched.

Source queue latency is separate from local deadline. Prior short queues do not establish an SLA or a minimum 24-hour waiting requirement. Local termination does not guarantee server cancellation. Persist intent/job identity; if submission is uncertain or a known job remains queued, stop and review recovery rather than submit again. No automatic retries, replacement jobs or silent splitting after cost rejection. Resume an existing identity only after explicit recovery review; this proposal grants no extra submission.

- [ ] Before an authorized run, confirm root state and existing ledgers again, then check exact selections against current CDS request constraints. Do not overwrite a nonempty or uncertain root.
- [ ] After job one, inspect actual raw format, revision `0001`, deterministic member, exact grid/clocks, parent/child digests, missing-hour counts, queue/download/decode times, raw/decoded/scratch sizes and RSS. Stop on unexpected archive/layout, extra variables/dimensions, unsupported metadata, changed source, missing entire partition, bounds or deadline violation.
- [ ] Continue to job two only after job one's checks pass within the original overall budget. Retain unsupported responses for offline review; do not broaden the decoder.
- [ ] Produce a sanitized measurement report. Compare each March year's expected versus valid dark hours and inclusive cloud thresholds 0.1/0.25/0.5 for the existing three selected cells/timezone, retaining local-night boundary gaps. Adjacent February/April source hours are absent, so complete March-night coverage cannot be assumed. No partial full-period envelope or runtime publication.

## Primary documentation and unresolved acceptance

Checked 14 October 2026: [CDS dataset overview](https://cds.climate.copernicus.eu/datasets/reanalysis-era5-single-levels?tab=overview) documents hourly reanalysis and supplied 0.25-degree atmospheric grid; [API setup](https://cds.climate.copernicus.eu/how-to-api) documents account configuration and terms acceptance, which this research did not inspect or change. [ECMWF Support](https://forum.ecmwf.int/t/limitation-change-on-netcdf-era5-requests/12477) says NetCDF allowances are smaller than GRIB and directs validation through the download form. No universal numeric cost threshold or acceptance of these selections was established here.

[Current converter documentation](https://confluence.ecmwf.int/spaces/CKB/pages/450760890/GRIB%2Bto%2BnetCDF%2Bconversion%2Bon%2Bnew%2BCDS%2Band%2BADS%2Bsystems) describes `valid_time`, latitude/longitude and scalar member/revision metadata, while warning the layout can change. A real grouped result must establish compatibility; engineering fixtures and old monthly files cannot do so. Queue completion, actual grouped bytes/RSS, source acceptance and March statistics remain unresolved.

Active `.data/era5/tiles-2025-v3/manifest.json` stays pinned to `9ffc58e9033984b235241525471d4e5b6571a6f1640147502b57d014c31181e8`. This batch cannot satisfy the 1991–2020 baseline, 90% eligible-observation and 27-qualifying-year gates, or global coverage. No CDS request, authentication/account action, download, deployment or active-manifest change occurred in preparing this proposal.
