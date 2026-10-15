# Bounded lineage implementation and source admission

Owner authorizes subagents, local implementation/testing, docs/tickets, push and exact-SHA CI; no dataset downloads or deployment. Baseline 6baa178, existing isolated codex/plugin-v1 worktree. The reviewed schema-5 catalog/schema-6 release contract in global-history-request-inventory.md is the starting specification. Preserve all existing formats/caps and individual source pins, cross-child conflict rejection and fail-closed unknowns.

## Tasks and ownership

1. Lineage implementer: strict bounded radix lineage/membership formats, streaming external-sort publisher with explicit input/memory/scratch/output/deadline bounds, schema6 release/schema5 catalog integration, lazy provider checks/shared32MiB cache, exhaustive operator closure and focused regressions. No giant runtime union and no cap raise. Scope includes every existing source format dispatcher. Add small10001 fixture and a separately bounded complete synthetic schedule-derived scale acceptance (18,033,376 revision objects plus metadata, actual56039pair routing) with exact measurements. No network or serving artifact selection. Proposed initial heavy scale envelope: one supervised run <=20min, process memory <=2GiB, scratch+output <=16GiB, one active heavy process; inspect implementation/predicted footprint before launch, preserve failure and no automatic retry. Synthetic data only, no14bn-hour enumeration. If contract needs correction, record reason and preserve equivalent acceptance/security; do not claim full migration from small fixtures.
2. Source admission implementer: retained evidence plus <=20 explicit public metadata/documentation requests, <=8MiB aggregate/2MiB each, no retries/redirects, no geometries/datasets/account/credentials. Produce a machine-readable per-source admission decision/required notices/gaps, exact payload and clip provenance fields, conservative enforcement/validation and fixtures. Resolve source-specific conditions where evidence permits; unknowns remain quarantined. Include CDS asset-host evidence only if official public documentation establishes it; never guess/enable a CDN. Own new source-admission files/docs/tests, no lineage core edits.
3. Parent: interface/ownership coordination, independent task reviews and corrections, integration docs/ticket truth, aggregate tests/types/build/package/runtime, final fresh review, commit/push and watch all6CI jobs. Original12/9/6 counts require actual acceptance evidence before change. No deployment/data acquisition/model calls/credential reads/deletion.

## Interface and conflict scan

| Tasks | Shared interface | Ruling |
| --- | --- | --- |
|1/2|Source lineage versus source admission|Disjoint modules; admission does not imply data coverage or mutate lineage artifacts|
|1/3|Schemas/publishers/providers/operator/tests aggregate|Implementer owns lineage files; parent registers tests/CI after freeze, no concurrent core edits|
|2/3|Admission documents/status|Implementer owns new packet; parent owns consolidated status/sequence/report|
|1 self|18m lineage versus bounded children/cache|Must replace flat child unions too, test complete capacity separately from pair routing|
|2 self|No downloads versus metadata|Only explicitly bounded public metadata/docs allowed; no source bodies|
|3 self|Push already authorized|Review/test first, existing feature branch only, no merge/deploy|

## Internal resource ruling before any heavy launch

The implementer estimates about 15.4 GiB logical fixtures/trees/scratch before pessimistic lengths and audit partitions. The initial 16 GiB envelope was provisional; the parent authorizes a **32 GiB aggregate synthetic scratch/output ceiling** while retaining the **20-minute wall deadline, 2 GiB hard process-tree commit, two OS processes (Node plus transpiler helper), one active heavy proof, and 96 GiB free reserve**. Observed disk free was 279 GiB. This uses only newly generated synthetic files; it authorizes no source requests. Preserve failed/successful scratch and exact accounting; no automatic retries. Per-builder budgets remain explicit and may be smaller than the whole-job ceiling.

## Operator admission ruling

Schema5/6 offline closure must independently prove actual shard-source unions, not trust an input publisher claim. Add optional explicit operator `lineageValidation` scratch directory and bounded validation controls; new formats fail closed without it. No automatically derived writes or silent scratch allocation. Legacy operator paths remain read-only. Scratch must be fresh, path-safe, separate from pinned inputs and accounted within declared available scratch budget. Runtime remains lazy and uses pinned publisher-verified membership edges.

## Prelaunch time and runtime ruling

Before any full proof launch, the implementer extrapolates 25–45 minutes of bounded file work from the focused end-to-end run: about 510,000 lineage objects, 56,039 tiles, 5,604 shards and 1.5 million validated object reads plus sorting. The parent revises the provisional whole-job deadline to **60 minutes**, keeping 2 GiB hard tree commit, 32 GiB aggregate new synthetic disk and 96 GiB reserve. No deadline reset or retry after launch is authorized. New-format publisher/closure controls may explicitly select up to this bound; legacy limits remain unchanged. The scale worker will run as a self-contained locally built, pinned JavaScript bundle with a pinned Node executable; inherited NODE_OPTIONS/NODE_PATH are removed. Source and runtime pre/post pins remain required.

## Disk-sampling ruling before launch

Whole-tree disk inventory starts at most once per 60 seconds (and after child exit), replacing the provisional five-second interval: more than 500,000 generated files would otherwise repeat costly ancestor/link/stat work. Immediate worker fixture/publisher write budgets remain mandatory. The supervisor still hard-caps process-tree commit and the independent wall timer; disk and RSS are explicitly sampled, not claimed OS disk quotas. Keep 32 GiB logical output/scratch and 96 GiB reserve. Sample duration itself is included in elapsed time.
