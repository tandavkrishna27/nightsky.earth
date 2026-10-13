# Data expansion wave — 14 October 2026

Three independent implementation lanes and independent review completed against starting revision `8972227`. Existing branch/worktree: `codex/plugin-v1` / `.worktrees/plugin-v1`. No deployment, marketplace submission, public data publication or additional CDS retrieval is established by this record.

## Delivered against original tickets

| Tickets | Delivery | Still open |
|---|---|---|
| 0A / 6 | Thirteen exact NASA maxima in each of 2025 and 2026, with separate report identities and vintages. Twelve bounded CC BY GMN radiant fits, including CAP/NTA/STA/HYD. Planner aliases and real MCP calls exercise new coverage. | Full per-shower seasons, other-year calendars, missing radiant codes and continuous/grazing visibility. Aggregate NASA model files do not establish per-shower season boundaries. |
| 0B / 8 | One official 23,618,779-byte Bhutan source; 134 candidates in a 20,933-byte checksummed artifact. Two supervised builds reproduced the same digest. Complete-way policy, conflict-aware overlap deduplication, Windows/Linux monitoring and failed-stage cleanup tested. | Global scale, relations and tile assembly, candidate-specific plans, selected-host capacity and public ODbL database offer. Repository remains private. |
| 0C / 9 | Explicit grouped-year plan/decoder, immutable parent and monthly child provenance, chronological schema 2 builder, bounded acquisition seams and offline recovery. Two-year and 30-year designs each have 30 grouped jobs. | Actual grouped CDS selection/cost acceptance, first response format/resource measurements, complete real baseline and global coverage. No new source jobs executed. |
| 10A / 10B / 11C / 12A | Four new shower aliases integrated; actual MCP 2025 peak and CAP plan checked; canonical workflows/skills, frozen contracts and container/package synchronized. | Full agreed geographic/seasonal coverage, live account compatibility and official hosted validation. |

## Review and fixes

Independent event review matched all thirteen 2025 maxima against NASA Table 3 and the added fit coefficients/uncertainties against the original GMN study. Year-qualified identities, cross-year ordering and truncation retain source provenance. Full-season limitations remain explicit.

Root reproduced absent new-shower planner aliases with a failing test, then passed all eight name/code cases after integration. Actual MCP transport retains the 2025 source/vintage and exact UTC maximum; CAP gets its own bounded radiant model without inventing a season.

Spot review identified Windows-only process accounting and a Linux worker-exit race. Linux procfs accounting now distinguishes exited workers from absent live counters. Accounting failures stop/wait the worker and return a failure report so acquisition/selection staging cleanup runs. Regression tests verify unpublished files are removed and published outputs are untouched. A pre-existing source-file deletion defect was reproduced and fixed with exclusive ownership checks.

Historical review checked exact requested UTC membership, leap buckets, grid/revision bounds, parent/index/child checksums, immutable replay, malicious paths/indexes, staged publication, four durable submission intents and offline recovery. Partial publication blocks reuse and requires operator inspection. Legacy monthly decoder limits are unchanged. Overall live-batch time and selected-job gates remain operator-controlled; the CLI has a hard per-child deadline.

## Local verification

- Aggregate Node suite: 401 tests discovered; clean Linux 394 passed/seven scope skips; Windows 400 passed/one permission skip. Zero failures on either platform. Symlink behavior is exercised on Linux; Windows permission skip stays explicit.
- Python suites: fourteen OSM and forty-six ERA5 tests passed on both Windows and clean Linux. The first Linux run overlapped test-first development and saw two not-yet-implemented grouped tests fail; the frozen rerun passed all forty-six. Only the frozen run is acceptance evidence.
- All three TypeScript configurations, eight offline review sets, package lint/determinism, builds, production audit and both production runtime checks passed. Production audit reported zero vulnerabilities; this does not describe legacy development dependencies.
- Clean 2 CPU / 4 GiB Linux artifact workload: sixty requests, zero errors, zero required-artifact failures and zero external calls; peak RSS 512,212,992 bytes. Astronomy/history used Kodaikanal with the unchanged 2025 artifact; candidates used separately resolved Thimphu with the Bhutan artifact. This is local capacity evidence, not selected-host approval.
- Pinned nonroot container built and served twelve tools, actual global GeoNames resolution, ten Bhutan candidates and the exact 2025 Geminid maximum. All artifacts were read-only mounts; legacy recurring catalog and website/news routes were absent. No external provider calls.
- Rehearsal package SHA-256: `ddc843a719415776693f5bd6e64296b775af601cc9a6a20a09d856d605c3a6f3`. Example endpoint and final publisher/official-validation gates remain.

Exact pushed-revision CI conclusions belong in `ci-verification.md` after observation. Current original counts remain **8 Done / 13 Partial / 6 Not started**; this wave advances partial source tickets without declaring global/full-season/baseline completion.

## Next source request boundary

The [grouped history proposal](grouped-history-wave.md) specifies four selected jobs, one active retrieval, 128 MiB batch raw, 512 MiB retained raw, 1 GiB scratch, 256 MiB importer peak gate and thirty-minute operator batch limit. Previous four-job allowance is exhausted. Separate approval and CDS selection/cost validation precede retrieval; inspect the first response before continuing. Preparing code or a thirty-job baseline plan does not authorize that retrieval.

## Evidence

- [Events and source screening](events-season-expansion.md)
- [Offline extract and measurements](offline-extract-wave.md)
- [Grouped history design and proposal](grouped-history-wave.md)
- [Original ticket status](implementation-status.md)
- [Execution sequence](../superpowers/plans/2026-10-14-data-expansion-wave.md)
