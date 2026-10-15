# Retained historical source measurement

This opt-in experiment replays the two retained March 1991/1992 NetCDF parents through the existing pure offline decoder, compares reconstructed monthly JSONL bytes with retained partition pins, and measures the current observation aggregator, immutable release publisher and nonexecuting production-history planner. No source request, dependency installation, credential access, runtime registration or deployment occurred.

The [sanitized evidence](data-pilot-evidence/2026-10-15-retained-history.json) contains actual measurements, eighteen selected source/lock pins, runtime versions and unchanged retained input hashes. Selected code pins are **not a complete transitive import closure**. The baseline is `1201c6da96d561cf58c47ab92c7e1c61e87a2399`; the evidence identifies the exact additional harness/core bytes used during measurement even if later review changes a helper.

## Selection and fixed limits

Exactly `hanle-03-1991-1992` (four cells) and `kodaikanal-munnar-03-1991-1992` (six cells) were selected from `.data/era5/grouped-pilot-20261015-v1`. Each parent contains 1,488 source hours and two 744-hour monthly children. The planner also reuses four retained files from `.data/era5/history-1991-1992`: Hanle December 1990 boundary, January 1991/1992 and Kodaikanal/Munnar January 1991. Their raw/decoded/manifest/ledger pins are checked before and after. Missing hours are never acquired by this experiment.

The whole lane has a 1,800-second deadline, 512 MiB cumulative new-file ceiling, 96 GiB shared free-disk floor, 256 MiB decoder main RSS ceiling and 384 MiB Node main RSS ceiling. Each process tree has a hard 512 MiB commit ceiling and two active processes. Existing decoder bounds remain: 32 MiB raw/numeric, ten cells, at most 22,320 grouped hours, and 800-hour/4-MiB monthly children. Producer-specific input/output limits also remain. Children run sequentially after geography measurements; output roots must be fresh and immutable. Retained input files are never overwritten or deleted.

The supervisor reuses `global_source_supervisor.WindowsJob`: workers start suspended, join the job, and resume only after assignment. It terminates and drains the whole job before another stage; assignment failure also kills the suspended direct child. Two processes accommodate Node's existing esbuild service. Decoder children launch the existing base interpreter directly with the retained venv site-packages on explicit `PYTHONPATH`, avoiding a Windows venv launcher process so external main RSS measures the decoder runtime. No arbitrary command is exposed by the measurement CLI.

Job commit and active-process ceilings are hard Windows controls. Main RSS, disk usage/reserve and the shared deadline are sampled about every 20 ms and can overshoot between checks; scanning/scheduling can lengthen that interval. Commit and RSS are different measurements. The decoder also checks its lifetime RSS cooperatively per row; the lightweight supervisor is additional memory outside each child job. Job peak commit is queried separately. File-stat disappearance during producer rename/unlink is tolerated; other stat errors and directory-enumeration errors fail the batch.

`TSX_DISABLE_CACHE=1` disables loader caching; `TEMP`, `TMP` and `TMPDIR` point inside the accounted fresh root. Python bytecode writes are disabled before local supervisor imports and for children. `OPENBLAS_NUM_THREADS`, `OMP_NUM_THREADS`, `MKL_NUM_THREADS` and `NUMEXPR_NUM_THREADS` are explicitly `1` before decoder imports. Exact settings, preflight and selected code pins accompany the evidence.

## Adapter and scientific interpretation

Replay checks the explicit reviewed manifest/raw parent pins, actual hash/size, coordinates, deterministic member zero, `0001` revision, exact requested source clocks and monthly membership, parent provenance, retained index/partition pins and every reconstructed JSONL byte. It imports the pure `read_chunks` decoder without importing acquisition modules. The existing decoder enforces supported variables/dimensions, calendars, units, fractional values, hourly ordering and quarter-degree coordinates. A new converter layout fails; it is not silently admitted.

Ten supplied cells are paired with an explicitly selected `Asia/Kolkata` engineering benchmark zone. That choice does not verify geographic timezone suitability or establish ten named destinations. Named-place acceptance still uses the existing three named records and their recorded zones. The aggregate period is **1991-03-01 through 1992-03-31**, sample only. Its independent padded UTC clock has **9,624 hours per pair / 96,240 pair-hours**. Only **14,880 scalar source cell-hours** are supplied; missing months and boundary hours remain absent from the valid dark-hour count while entering the expected denominator. Publication does not establish a climate baseline.

The planner consumes actual retained rows and emits an `unapproved-nonexecuting` prefix. Every Cartesian proposed year/month/day/hour is enumerated to reject overlap with retained cell-hours or another proposal. A valid prefix neither approves acquisition nor establishes provider acceptance. The release is a scratch-only sample artifact; runtime provider registration and the source-3 three-place 2025 sample are unchanged.

## Actual measured results

The corrected batch took **2.421 seconds**, excluding the first failed startup and operator correction interval. It retained the original first-attempt deadline and counted both roots at every disk poll.

| Stage | Transformation wall | Main CPU | Peak main RSS | Peak tree commit | File bytes |
| --- | ---: | ---: | ---: | ---: | --- |
| Hanle raw replay | 0.231 s | 0.234 s | 54,591,488 | 41,009,152 | 136,897 raw / 175,378 JSONL |
| Kodaikanal/Munnar raw replay | 0.239 s | 0.234 s | 54,870,016 | 41,246,720 | 143,140 raw / 213,743 JSONL |
| Observation aggregation | 0.899 s | 1.031 s | 180,617,216 for Node pipeline | 257,445,888 for Node pipeline | 389,121 decoded per pass / 252,508 envelope |

External startup-inclusive child wall was 0.428 s / 0.453 s for the decoders and 1.419 s for the complete Node aggregation/release/planner process. All **four monthly partition hashes matched exactly**. Original raw, decoded, index, manifest and ledger pins remained unchanged.

Aggregation measured about **107,019 padded pair-hours per wall second** and **93,346 per main CPU second**. The decoder scalar cell-hour wall rates were about 25,785 and 37,404 per second, using a different denominator. CPU includes runtime threads and can exceed elapsed wall; Node CPU excludes the esbuild service. This is a tiny warm-cache workload on an uncontrolled shared host, not worldwide throughput evidence.

The independent dark-hour denominator was **36,302**, with **5,580 valid** and **30,722 missing** hours. The sample release has ten tiles, one shard and **258,035 bytes**. Manifest SHA: `8f3070cb1906852c102eadd1379a1c32fa57bea53a635050576434e30e192940`.

Producer preflight input accounting was **391,366 bytes**. Computed logical file reads including mapping rereads and final verification were **2,766,702 bytes**. The planner verified **25,488 retained cell-hours**; remaining target cell-hours are 2,605,392 of 2,630,880 for these ten cells. Its bounded 100-job prefix contains **72,288 proposed Cartesian cell-hours**, audited with zero retained overlaps and zero duplicates. This is not a complete request manifest.

Corrected-run preflight observed **310,886,748,160 free disk bytes**, **16,443,969,536 available physical bytes** of 66,094,223,360 and 24 logical processors. Resources were observed, not reserved. Cumulative first-plus-corrected new-file bytes before the final batch report were **1,703,592**, including **3,434 bytes** from the failed attempt. Final report serialization and the public evidence copy add small additional bytes below the ceiling.

The first attempt failed during **OpenBLAS/NumPy startup allocation under the unchanged hard 512 MiB tree commit cap**, before decoder or data-format validation. Its stopped/drained evidence remains `.data/era5/retained-measurement-20261015-v1`. The single authorized correction fixed the four thread settings to one, kept every memory ceiling and input unchanged, and used fresh `.data/era5/retained-measurement-20261015-v2`. Its `--prior-attempt` control preserved the original deadline and counted both roots. Public evidence includes the failed preflight/code selection and a fixed redacted failure description. There was no further benchmark retry.

## Measurement scope and limits

Decoder wall/CPU timers begin after interpreter/library initialization and initial input pin preflight; they include decoding, partition serialization and exact hash comparison. External wall includes startup/preflight. Lifetime RSS includes imports. Queue/download time is absent. Old grouped `processingSeconds` included waiting and was not reused as decoder throughput.

Aggregation timing includes producer validation, independent padded-clock astronomy, per-cell/zone iteration, serialization and final pin rechecks. Pair-hour rates include hours without source rows; they are neither source-row nor useful-dark-hour throughput. Producer `sourceInputBytes` covers preflight plan/decoded bytes only; logical reread counts are computed separately. Physical disk reads, cache behavior, decompression amplification, transfer/network bytes and I/O operations were not measured. No provider queue, cost, compression, worldwide storage/runtime, serving fit or host-sizing result is inferred.

There is **no actual ARCO/time-series response body** available here. That route remains unadmitted: documentation-level variable availability does not prove returned coordinates, clocks, units, revision assurance, format or read amplification. See the [production history proposal](production-history-build-proposal.md). This experiment establishes compatibility only for the two retained legacy CDS grouped NetCDF bodies and their existing monthly JSONL adapter outputs.

## Reproduction and checks

From the Windows repository root, use the existing decoder environment and a new ignored root:

```powershell
.data/era5/venv/Scripts/python.exe scripts/era5/measure_retained_process.py --repository . --batch-output .data/era5/retained-measurement-NEW
```

The runner refuses an existing root, executes the three sequential children and writes preflight, monitor and batch reports plus immutable replay/pipeline artifacts. It does not automatically retry. Only an explicitly authorized startup correction should use `--prior-attempt` with a stopped sibling root. Do not run competing benchmarks or broad test suites concurrently.

Scoped synthetic checks:

```powershell
node --import tsx --test tests/providers/climate/retained-history-measurement.test.ts
.data/era5/venv/Scripts/python.exe -m unittest discover -s tests/era5 -p test_retained_history_measurement.py
```

After measurement, **5 Python / 3 Node tests passed**. Four-hour one-cell real NetCDF-format fixtures check exact replay, immutable output refusal, raw changes and manifest clocks. Supervisor fixtures check child-tree drain, file disappearance and denied directory/stat access. Node checks cover padded-clock arithmetic and every-hour overlap/duplicate audits. Installed netCDF4 emits a NumPy 2.5 shape-setter deprecation warning during fixture writes; it remains visible and does not fail tests. The corrected actual decode run produced no such warning. Broader integration checks are owned by the parent workflow.
