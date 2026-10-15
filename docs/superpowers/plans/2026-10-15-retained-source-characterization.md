# Retained source characterization implementation plan

> **For agentic workers:** Three independent implementation lanes, sequential timed workloads, task review and fresh integrated review. Parent owns scheduling, aggregate registration and delivery.

**Goal:** Measure existing retained sources through current offline pipelines and establish exactly which adapter claims are supported before new acquisition.

**Architecture:** Explicit checksum-pinned retained inputs feed isolated measurement children and immutable reports. Existing source readers, statistical aggregation and publication remain authoritative. No new source endpoint or live model is used.

**Tech Stack:** Existing Python/Node/TypeScript and installed pinned decoder/importer environments; Windows process supervision where supported; no dependency installs.

**Spec:** Owner's retained-data measurement/source-adapter wave; [completion sequence](../../operations/v1-completion-wave-sequence.md), [geography proposal](../../operations/production-geography-build-proposal.md), [history proposal](../../operations/production-history-build-proposal.md).

## Constraints

- Existing isolated `codex/plugin-v1`, baseline `1201c6da96d561cf58c47ab92c7e1c61e87a2399`.
- No dataset/provider/store metadata/network calls, account/credential inspection, model runs, deployment, submission or publication.
- Timed geography runs first; history waits for parent release. No full suites or other heavy measurements compete with timed stages. Small fixture development can proceed independently.
- Retained input pins must agree before and after measurement. No deletion of existing data or runtime artifact replacement. New measurement artifacts use exclusive ignored roots and remain counted.
- A missing clip body cannot be replaced by a sidecar called clipping proof. Reuse genuinely recorded hashes with unverified-body labels, or explicitly label synthetic control metadata and keep the mixed measurement unadmitted.
- Reports distinguish native source validation, declared lineage, unavailable data, synthetic controls, chosen benchmark timezone, actual wall/CPU/RSS/commit and logical I/O versus physical transfer. Do not infer global throughput or host fit.
- Preserve original 12 Done / 9 Partial / 6 Not started. Acquisition allowances remain consumed and unchanged.

## Lane A — geographic measurement (Tasks 0 / 8)

**Own:** `scripts/osm/measure-retained-source.py`, scoped helpers, `tests/osm/test_measure_retained_source.py`, `docs/operations/retained-geography-measurement.md`, sanitized measured JSON.

- [x] Inventory known retained Monaco/Faroe pins and native vintages; write exact finite measurement selection and limits before timed execution.
- [x] Add synthetic harness tests and existing-owner parser/supervisor reuse; distinguish measured fields from unavailable ones.
- [x] Run current raw SQLite producer and configured stream bridge, one job at a time; capture stage wall/CPU, sampled RSS/job memory, SQLite/journal/scratch/output bytes and available I/O evidence.
- [x] Preserve coverage unknown when no admitted clip geometry exists. Compare actual selected candidate facts with retained prior evidence without assuming different policies produce identical output.
- [x] Independent task review and affected rechecks.

**Envelope:** at most 30 minutes whole lane, 4 GiB new writes, 4 GiB main-process RSS / 8 GiB job commit, one heavy job, 96 GiB free reserve; choose tighter controls where practical. These are local admission limits, not global predictions.

## Lane B — historical measurement (Tasks 0 / 9)

**Own:** measurement helper/runner under `scripts/era5/`, scoped Node/Python tests, `docs/operations/retained-history-measurement.md`, sanitized measured JSON.

- [x] Pin both retained March grouped raw parents and actual monthly children; validate pure offline decoder and compare exact returned coordinates/revisions/hours/values.
- [x] Implement isolated decoder and aggregation/publication/planner measurement with explicit budgets, identity checks and CPU/wall/RSS/I/O distinctions.
- [x] After geography finishes, run two isolated decoder children and a sequential bounded aggregation/planner workload; no requests for missing months.
- [x] Use sample-only period, preserve absent-hour denominators; an explicitly chosen Asia/Kolkata benchmark zone does not verify geographic suitability of every source cell.
- [x] Independent task review and affected rechecks.

**Envelope:** whole lane at most 30 minutes, 512 MiB new files, decoder 256 MiB RSS, aggregation 384 MiB RSS, 96 GiB disk reserve. Record external sampled enforcement versus hard kernel limits accurately.

## Lane C — retained adapter evidence (Tasks 0 / 8 / 9)

**Own:** `scripts/validate-retained-source-adapters.ts`, scoped tests and `docs/operations/retained-source-adapter-validation.md`.

- [x] Implement strict explicit pinned local validation using owning formats, with fixed redacted findings and no acquisition hooks.
- [x] Verify available canonical producer/decoded metadata and actual hashes; do not equate report shape or assertions with native source revalidation.
- [x] Distinguish genuinely retained source evidence, synthetic normalized boundaries, unavailable real gbOpen bodies and unavailable ARCO/time-series responses.
- [x] Reconcile source adapter gaps against measured results and exact first-acquisition prerequisites; independent review.

## Parent integration

- [x] Verify resource snapshot and sequence timed workloads; document failed/partial measurements as evidence rather than retrying indefinitely.
- [x] Register test/type/command/CI coverage; use synthetic fixtures for CI, keep real retained-data measurements opt-in and offline.
- [x] Task reviews and fresh integrated review, fix important issues.
- [x] Run full suites/types/build/package/offline runtimes after measurements finish; update owning status and next acquisition decision accurately.
- [ ] Commit/push and watch six jobs at exact final SHA. No merge or deployment.

## Interface / conflict scan

| Pair | Contract and resolution |
| --- | --- |
| A / B | Shared machine resources only; parent serializes timed jobs and heavy verification. |
| A / C | C may inspect A's immutable measured producer output after it is complete; no circular source admission. |
| B / C | C uses actual retained decoded pins and B's native decoder comparison evidence; report validation alone never establishes raw compatibility. |
| All / parent | Shared status/config/CI centrally owned; no worker commits or source-core edits without a demonstrated need. |

## Fresh observation

Read-only at **2026-10-15T15:45:50.7245716Z**: total RAM 66,094,223,360 bytes; free RAM 16,909,008,896 bytes; 24 logical processors; C: free 311,830,781,952 of 999,185,969,152 bytes. Snapshot only, not reserved resources or a Hetzner measurement. Each measurement preflights again immediately before execution.

## Observed execution and rulings

See [retained measurement outcomes and review corrections](../../operations/retained-source-characterization-wave.md). Measurement completed with a preserved geographic deadline failure, not a completed geography build. The parent authorized one short diagnostic, then one known UTF-8 preparation correction; no core optimization or input replacement. History's known OpenBLAS startup failure received one single-thread correction with its original deadline/storage bounds preserved. Process-tree hard limits and cache containment replaced direct-child-only monitoring before the successful history run. Timing jobs were sequential. Source/admission and original ticket gates remain open; post-commit CI is recorded after observation.
