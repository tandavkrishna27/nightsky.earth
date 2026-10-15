# Retained source characterization wave — 15 October 2026

Baseline `1201c6da96d561cf58c47ab92c7e1c61e87a2399`, isolated `codex/plugin-v1`. Three subagents implemented the measurement/validation paths. Timed geography and history ran sequentially; full verification followed both. No new datasets, provider/store requests, dependencies, credentials, model calls, runtime installation, deployment or publication.

## Observed results

| Path | Actual result | Meaning / limit |
| --- | --- | --- |
| Current raw geographic producer | [Evidence](data-pilot-evidence/2026-10-15-retained-geography.json): stopped at **600.019 seconds**, after committing Monaco; Faroe incomplete; no normalized completion or catalogue bridge run. Both retained source hashes unchanged. | A bounded failure is preserved, not a completed two-source release. Actual PBF bytes were paired with an explicitly synthetic clipping control and empty regions/footprints. No real coverage or source admission. |
| Geographic diagnostic | Corrected ten-second instrumented partial workload: `check()` **9.728 of 10.050 cumulative seconds**; ancestor validation and `lstat` dominate its call tree. | Concrete evidence of expensive per-entity filesystem validation. Overlapping cumulative times are not additive. Aborted/instrumented work is not a global throughput estimate. |
| Retained ERA5 decoder | [Evidence](data-pilot-evidence/2026-10-15-retained-history.json): both March 1991/1992 raw parents reproduced **all four retained monthly JSONL partitions byte-for-byte**. | Native legacy format compatibility is established for these exact parents, cells, hours, versions and decoder environment. ARCO/time-series has no retained response and remains unadmitted. |
| Historical aggregation / publication | Ten explicitly selected cell/zone pairs, **96,240 padded pair-hours**; aggregation **0.899 s wall / 1.031 s main CPU**. Expected dark hours **36,302**, valid **5,580**, missing **30,722**. Immutable sample release: ten tiles, one shard. | Sample period is 1991-03-01–1992-03-31 with missing intervening months preserved. Asia/Kolkata is an explicit engineering zone choice, not geographic verification of every source cell. No real 30-year baseline, provider timing, global ETA or host fit follows. |
| Production-history planner | One hundred nonexecuting request proposals; **72,288 Cartesian cell-hours audited**, zero retained-hour overlaps. | Proposal generation and retained-hour subtraction pass this actual-input check. No requests submitted and no allowance reset. |
| Retained adapter checks | Pinned actual Bhutan regional OSM and Hanle January 2025 ERA5 checks both returned `validated-lineage`. | These reopen and pin local bodies and compare owning contracts/retained metadata. Their `sourceAdmitted:false` and `nativeParserRerun:false` remain false. Actual canonical completion is unavailable after the geographic deadline; gbOpen and ARCO remain unadmitted. |

Guides: [geography measurement](retained-geography-measurement.md), [history measurement](retained-history-measurement.md), [adapter contracts and observed checks](retained-source-adapter-validation.md). Native measurement artifacts remain in exclusive ignored roots; public JSON contains sanitized identities and observations.

## Failed attempts and scope corrections

- The original geographic stop and hot journal remain untouched. Read-only SQLite inspection refused recovery; no original recovery write or counts were invented. The sampled main PID was a venv redirector, so its RSS does not describe the actual producer tree. Job CPU/peak committed memory and logical I/O are labeled separately. The executed harness identity was reconstructed, not independently pinned at launch; core source fingerprints and source post-hashes are retained. Future cache/bytecode controls are explicitly not attributed to that original run.
- The first short geographic diagnostic stopped before parsing because Windows-default decoding corrupted the attribution. The parent authorized one known-cause UTF-8 correction in a fresh root. Both attempts remain preserved; the corrected profile is the cost evidence.
- The first historical batch stopped during OpenBLAS startup under its existing memory limit, before raw replay. One explicitly authorized correction set four numerical-library thread controls to one. The corrected batch took **2.421 s**, kept the original 1,800-second authorization window, and counted both attempt roots against the same 512 MiB allocation. No memory allowance increase or input change.
- History review corrected process-tree containment for the TypeScript loader/helper, scoped temporary storage, disabled transformation caches, propagated directory enumeration errors, and prevented monitor bytecode writes outside scratch. Hard 512 MiB job commit/two-process controls are distinct from sampled main RSS. Main CPU metrics exclude loader helper CPU; selected source and lock pins are not a complete import closure.
- Adapter review found that duplicate attribution `[A,A]` could conceal lineage `{A,B}`. An exact one-to-one source/lineage match now rejects that repinned case and accepts `[A,B]`.

Three task reviews and a fresh integrated review approved the corrected implementation and evidence boundaries. No core geographic producer optimization was included; its measured bottleneck remains a concrete next task.

## Final local verification

| Check | Observed result |
| --- | --- |
| Complete Node aggregate | **794 discovered / 793 passed / one existing permission skip / zero failed** |
| Pinned OSM Python suite | **92 discovered / 89 passed / three existing skips / zero failed** |
| Pinned ERA5 Python suite | **51 passed / zero failed** |
| Three TypeScript configurations | Pass |
| Website/service/standalone plugin build | Pass; existing website build warnings remain |
| Public rehearsal and both local package validators | Pass; no installation/publication |
| Eight offline review sets and production/full/resolver/compiled-regional runtimes | Pass; zero upstream attempts in these workloads |
| Actual retained adapter CLI and focused fixture tests | Both actual entries pass; eight adapter plus three history Node fixtures pass |

New Python tests are discovered by existing two-OS suites; new Node fixtures and validator type checking are registered. Real retained measurements are opt-in, not invoked in CI; CI uses generated tiny fixtures. Existing native NetCDF/NumPy dependency deprecation warnings in synthetic file assignment are disclosed, with no global suppression or scientific output changes. Exact pushed SHA/CI outcome is recorded after observation in the ignored wave ledger and delivery response.

## Decision and next work

**Do not advance to a larger geographic acquisition yet.** First optimize the producer's expensive per-entity filesystem checking with separately reviewed bounds, cancellation, mutation and reserve semantics, then rerun a finite retained-data acceptance through actual completion and the bridge. Preserve this failed baseline and diagnostic for comparison. A performance fix must not remove source identity or resource safety.

The retained legacy historical path now has actual decoder/aggregation/planner measurements, with sample quality gaps retained. New time-series access still requires an exact source-format/revision contract and an approved bounded response before native admission. Complete historical-grid serving remains above the current 10,000-pair release cap. Real clipping/boundary editions, complete geographic residuals, worldwide baseline, selected host/client and official launch gates remain open.

Original accounting remains **12 Done / 9 Partial / 6 Not started**. This wave closes its measurement/validation subtasks, not the uncompleted production data or public launch criteria. Website stays separate.
