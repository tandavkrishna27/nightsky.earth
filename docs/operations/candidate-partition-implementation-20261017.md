# Bounded candidate partitions — implementation evidence, 17 October 2026

This implements the exact reviewed [partition design](candidate-partition-merge-design-20261017.md), SHA-256 `a0d3fb2a72310ddf3090b69a26580c9cfe4a885807443ee5eb33d5f2e5ffbad3`. It supplies a path past the old single-file candidate ceiling. It does not establish global source selection, throughput, accepted-object count, capacity fit, source authority, or a completed production build.

## Invocation and wire

Version 1 is preserved, including its historical 385 MiB proposal packets. Version 2 requires an exact capacity-plan pin, an explicit finite aggregate normalized-output budget, and the fixed `partitioned-jsonl-v1` layout: at most 64 total raw parts across candidates/lineage/exclusions, each at most 128 MiB. Checkpoint and completion metadata consume the same aggregate. The TypeScript reader checks the full Python wire, composite ordering, whole lineage groups, exclusion duplicates, per-source and global counts, concatenation hashes, exact part inventory and immutable source/descriptor witnesses. No aggregate default or per-family allowance is inferred.

The producer emits final parts directly from its existing SQLite selection/deduplication. Version-2 partial resume is refused; completed verification is read-only and revalidates every source, part, descriptor and database witness after its final admission callback. Failed roots remain retained and unaccepted.

One membership session loads the full known/unresolved boundary inventory and builds one BVH. Parts share row/work/deadline accounting. Enrichment rolls its own bounded parts, then a virtual concatenation feeds one publisher invocation. The final consumer remains schema 2. No combined candidate file or candidate staging copy is created. A trusted fresh membership descriptor pin must be checked before bridge version dispatch; caller-supplied completion bytes cannot downgrade into the legacy branch.

## Capacity and final acceptance

Capacity v2 names every stage allocation and all exact raw, membership, catalogue and supervisor controls. Required `rawSourceAlreadyRetainedBytes` has no default. It cannot exceed retained bytes, the raw allowance, or the actual pinned source inventory; the raw incremental allocation must cover the remainder. This counts a received source once, while keeping full retained coexistence in the supervisor disk ceiling. This is arithmetic support for a later explicitly reviewed invocation, not approval of any actual source budget.

The admission's existing 32 MiB distinct metadata allocation continues into partition verification. Code, geometry and JSONL bodies retain their separate accounting. Physical verification reads have one finite ledger of `4*(raw aggregate + membership output + admitted footprint bytes)+8 MiB`; this reserves bounded repeated hash passes and does not increase logical output allocations. Membership still permits at most one million candidates, 200 million checks, 30 minutes and 1 GiB output. The publisher consumes the remaining shared deadline and work allowance. The supervisor reserves one of its 64 accounting roots for the attempt before path expansion and Job creation.

Both executable snapshots now pin 25 local dependencies, including the new helpers and changed producer/drivers. Fixed source review authority remains unchanged. Final assembly rechecks raw and enriched inventories/bodies after admission, then writes a pending marker and atomically renames it. A physical publisher root from a late failure is retained evidence; acceptance still requires both assembly and supervisor completion.

## Review and verification

Implementation used disjoint producer, contract/capacity, membership/bridge and assembly/admission tasks, followed by independent spec and quality review. Review corrections include late completed-producer mutation, bounded database source counters, fresh membership identity, downgrade dispatch, shared descriptor allocation, elapsed-time reporting, attempt-root cardinality and final enriched-body revalidation. Each blocking finding received a targeted regression before correction.

Stable-code focused verification: 99/99 TypeScript tests passed across the six affected contract/capacity/membership/bridge/assembly/admission files. Full OSM Python: 239 run, 234 passed, five existing privilege/optional-dependency skips, zero failures in the worktree-owned Python 3.14 environment. All three `npm run check` projects and explicit strict typechecks of new/root TypeScript tests passed. Diff checks passed. Independent spec and quality reviews have no remaining actionable findings.

New `tests/places/partitionedCandidates.test.ts` is run directly (14 tests); `tests/places/partitionedLargeContract.test.ts` is opt-in and remains unrun at this implementation commit. Neither is registered in the shared aggregator here; the coordinator owns that edit. The existing aggregate passed: **1,007 run, 1,001 passed, six skips, zero failures**. Its imports did not yet include the 14 new reader tests or the opt-in test. The coordinator subsequently registered both files and owns combined integration verification.

## Single large contract observation

At implementation tip `e470872747c0b85297be9dead273aa13c259f645`, the opt-in test ran **once**, passed in 28.5 seconds and retained its complete synthetic attempt. [Machine-readable evidence](data-pilot-evidence/candidate-partition-contract-20261017.json) records controls, metadata pins and the exact test SHA.

| Observed item | Result |
|---|---:|
| Accepted synthetic candidates | 16,000 |
| Raw candidate family | 150,064,000 bytes, two bounded parts |
| Raw lineage / exclusions | 13,248,000 / 232 bytes |
| All raw output plus descriptors | 163,315,131 bytes of explicit 268,435,456-byte allowance |
| Enriched candidate family | 150,260,000 bytes, two bounded parts |
| Membership output / session work | 150,264,625 bytes / 7,527,212 checks |
| Shared final verification reads / work | 1,241,081,302 bytes / 28,053,328 checks |
| Publisher input / scratch / output | 155,288,355 / 629,197,554 / 160,260,384 bytes |
| Final spatial / ID rows | 16,000 / 16,000 |
| Known / unknown country | 4,000 / 12,000 |

All candidate facts, four source attributions, original caveats, unknown access and evidence counters survived. The fixture contains strict interior, outside, border and unresolved competitor cases. There is one schema-2 catalogue root, one common region, no footprints, no combined candidate file and no staged candidate copy. Raw selection and the production supervisor did not run. Long reserved source URLs make this a serialization/ownership contract test, not representative global density or throughput evidence. No RSS/commit peak was measured; elapsed time is observational.

Final exact-tip CI is reported with the pushed evidence tip; a previous commit's green result is not substituted.

## Remaining execution gates

No dataset was downloaded and no provider job, receiver, production Job, serving install, cleanup or deployment ran. Owner cleanup remains pending; no r2 inventory/probe was generated. The exact planet body, source approval and native-vintage/domain evidence remain absent. Independent node/row/work/time/capacity stops may still prevent a global build. Long synthetic source URLs in the large contract fixture test serialization/partition ownership; they are not a world-size estimate. Acceptance totals remain coordinator-owned.
