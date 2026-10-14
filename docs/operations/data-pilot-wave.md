# Bounded data pilots — 15 October 2026

Owner approved the two existing small measurement pilots after the explicit download hold. This allowance covered only the pinned three-region spot proposal and two March ERA5 grouped jobs. No retries, global expansion, active artifact installation, account changes or deployment.

## Results

| Pilot | Outcome | Measurement | Remaining gate |
|---|---|---|---|
| Monaco spots | Source admitted; supervised build stopped | One HEAD and one GET, 692,392 raw bytes, exact pinned ETag/header; build 60.044 seconds, peak worker RSS 39,616,512 bytes | No complete candidate artifact or equality proof. Diagnose build performance before a new live wave. Faroe/Fiji were not requested. |
| Hanle history | Passed grouped format/import | 1,488/1,488 requested hours, four cells, two 744-hour March partitions; 136,897 raw bytes, peak process RSS 75,386,880 bytes | Two-year March sample only, not seasonal/global baseline. |
| Kodaikanal/Munnar history | Passed grouped format/import | 1,488/1,488 requested hours, six cells, two 744-hour March partitions; 143,140 raw bytes, peak process RSS 75,132,928 bytes | Same sample limit; coarse grid is not a site measurement. |

History total raw inputs: 280,037 bytes; four decoded data partitions: 389,121 bytes. Exactly two new durable submissions, sequential; both complete. Queue times were 147.781 and 138.093 seconds, download times 1.360 and 1.109 seconds. The recorded processingSeconds begins at the retrieval deadline's start and includes waiting; it must not be presented as isolated decode CPU time. Supplied revision 0001 and the requested 0.25-degree grids were verified, with zero missing source hours. These measurements establish this sample's accepted format/cost envelope, not universal CDS limits or worldwide storage/capacity.

## Night-time statistics

Existing strict JSONL parsing and dark-cloud aggregation calculated each March year separately at the three already selected supplied cells with Asia/Kolkata observing-night dates. Thresholds are inclusive cloud fractions 0.1/0.25/0.5. Sample frequencies are not forecasts, sighting probabilities or whole-night clear probabilities. Each row remains sample-only. Adjacent February/April source hours were not requested; the diagnostic must not claim complete boundary coverage from its request design.

| Place | March year | Expected dark-hour samples | Valid dark-hour samples | Cloud fraction <=0.25 sample frequency |
|---|---:|---:|---:|---:|
| Hanle | 1991 | 279 | 279 | 26.2% |
| Hanle | 1992 | 279 | 279 | 29.4% |
| Kodaikanal | 1991 | 279 | 279 | 53.0% |
| Kodaikanal | 1992 | 279 | 279 | 72.8% |
| Munnar | 1991 | 279 | 279 | 50.5% |
| Munnar | 1992 | 279 | 279 | 73.8% |

## Evidence and preservation

- [Spot identity, bounded-stop and artifact inventory](data-pilot-evidence/2026-10-15-spots.json).
- [Grouped history imports and checksums](data-pilot-evidence/2026-10-15-history.json).
- [Historical sample statistics](data-pilot-evidence/2026-10-15-history-statistics.json).
- Local safety verification:46 spot tests/43 passed/three explicit skips;7 grouped history tests passed. Existing aggregation/parser validated actual decoded samples. No runtime source code changed.
- Active ERA5 tiles-2025-v3 manifest remains SHA-256 9ffc58e9033984b235241525471d4e5b6571a6f1640147502b57d014c31181e8. Earlier history/OSM artifacts untouched; no candidate/history sample installed.
- Automatic approval review rejected the recursive cleanup command, reporting blocked by policy without a more specific reason. No deletion ran. The disposable roots remain `.data/osm/global-pilot-20261015-v1` and `.data/era5/grouped-pilot-20261015-v1`; reports/checksums and private completed-job ledger copies are retained separately. No deletion workaround was attempted.

## Ticket disposition and next work

Counts remain 12 Done / 9 Partial / 6 Not started. Task9's actual grouped-response format/cost measurement now has evidence; the required full-period/global history and host gates remain. Task8 gains source admission evidence and a measured build-time stop; it remains Partial. Task0 global source/host decisions remain open. Do not reopen unrelated completed code tickets or claim worldwide fit from these tiny requests.

Next local task is diagnosing and fixing the spot build's measured time failure using retained Monaco data; no further source request or resource-budget increase is authorized. Then an offline rerun can test that fix before a separately scoped continuation of the held spot sources. History can inform the next coverage strategy, but this wave authorizes no further months, years or areas. Broad audit remains deferred until implementation/data integration is complete.
