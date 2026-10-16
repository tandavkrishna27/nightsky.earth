# Bounded Candidate Partitions Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Remove the single-file128 MiB assembly barrier with complete bounded evidence and one unchanged consumer root, supporting explicit reviewed finite aggregate invocation budgets.

**Architecture:** One existing SQLite selection exports all three evidence families directly into immutable ordered parts. One membership session consumes candidates under a shared ledger and one publisher consumes enriched parts as a virtual stream. Legacy v1 is preserved.

**Tech Stack:** Python3.14/stdlib SQLite; Node24/TypeScript/existing zod4 and catalogue builders. No new dependencies.

**Spec:** `docs/operations/candidate-partition-merge-design-20261017.md`, SHA256 `a0d3fb2a72310ddf3090b69a26580c9cfe4a885807443ee5eb33d5f2e5ffbad3`, approved by root coordinator and two independent reviewers.

## Global Constraints

- Physical parts <=134217728 bytes; raw max64 entries across all three families; enriched max64 entries; each descriptor <=1048576 bytes; capacity-plan metadata <=65536 bytes; shared admission metadata32 MiB.
- Version2 aggregate is explicit finite positive safe integral, equal manifest.outputBytes/plan.maxNormalizedOutputBytes/reviewed capacity raw allocation. Candidate input aggregate<=that total. No default385 MiB, no auto escalation. Old packets remain unchanged.
- All membership parts share max1M rows/200M checks/1800000ms/1GiB output,64KiB emitted rows; boundaries64MiB,1M vertices/shard,2M total. One catalogue invocation preserves configured publisher limits and existing schema2 consumer format.
- Complete candidate, lineage and exclusion families, including exclusion duplicate occurrences; exact source/body/vintage conflicts; all known/unresolved boundaries; no geographic narrowing, no source copy/download, no inventory/deletion/deployment.
- V2 refuses partial resume; completed verification is read-only. Failed roots/parts are retained unaccepted evidence; both assembly and supervisor final markers are required.
- Source authority remains fixed; candidate metadata cannot grant source/capacity execution permission. Existing actual planet source admission is absent.

## Review Focus

- Missing/repeated/reordered parts or repinned omitted evidence must not pass complete-family verification (Tasks1–2).
- Exclusions outside accepted ID ranges and identical exclusions remain preserved (Tasks1–2).
- A second part cannot reset global work/time/rows/output; abort and late mutation produce no accepted completion (Tasks3–5).
- Changed producer/classifier/helper/schema code or controls invalidates the exact admission snapshot (Task5).
- Physical late-failure catalogue roots remain unaccepted without both final markers; consumer format unchanged (Tasks4–6).

## Shared Wire Contract

`PartPin={ordinal,path,bytes,sha256,firstRow,rows,firstKey:string[],lastKey:string[]}`; `StreamFamily={bytes,rows,sha256,parts:PartPin[]}`. Exact family names: candidates,lineage,exclusions. Fixed part paths: parts/<family>-00000.jsonl. Keys: candidate [placeId], lineage [placeId,source], exclusion [source,id,reason]. Empty family parts=[]/bytes=rows=0/sha256(empty). Last key ordering is strict for candidates and lineage; nondecreasing for exclusions. No full candidate arrays.

Raw completion v2 has exact fields: schemaVersion:2, kind:'partitioned-normalized-osm-v1', catalogueRevision, manifestSha256, policy, geographyMode, sourceDomains (array even empty), streams (three exact families), counts, checkpoint:{bytes,sha256}, and admissionSnapshotSha256 only when library admission was supplied (production requires it). `checkpoint` references fixed checkpoint.json. Counts: `{accepted,lineage,exclusions,selectedOccurrences,acceptedOccurrences,duplicateAcceptedOccurrences,sources:[{id,selected,accepted,excluded,lineage}]}` in manifest source order. A/L/E and S/R/E/D reconciliation per spec. Checkpoint binds final completedSources/databaseSha256/counter digest/layout. Raw manifest v2 exact fields add evidenceLayout to existing v1 fields; layout strict `{kind:'partitioned-jsonl-v1',maxPartBytes:134217728,maxParts:64}`. All family bodies retain old canonical bytes.

## Task1: Python direct producer export — bounded_receipt

**Files:** new scripts/osm/normalized_partitions.py, tests/osm/test_normalized_partitions.py; modify global_source.py and test_global_source_pipeline.py only.
**Interfaces:** global_source.build retains signature and reads layout from validated manifest; expose writer `write_partitioned_stream(output, family, rows, check, consume, part_limit=134217728, registry=None)` or coordinate an equivalent exact helper signature with root before integration. `consume(n)` charges aggregate output including descriptors. Wire output is fixed above; no changes to selection facts.
- [ ] Write small RED tests for rolling, ordering/empty streams/budget/cardinality/exclusion duplicates and v2 selected-source counter reconciliation.
- [ ] Implement direct SQL-cursor rolling, strict v2 manifest/identity, transactional source counters and frozen completion witnesses; refuse partial v2 resume before output mutation.
- [ ] Run focused writer/producer tests; report exact results and self-review, no commit until controller integration review.

## Task2: TS partition verification + capacity — policy_prepare

**Files:** new scripts/osm/partitioned-candidates.ts, tests/places/partitionedCandidates.test.ts; modify geography-capacity-plan.ts and geographyCapacityPlan.test.ts only.
**Interfaces:** export strict part/family/raw-completion schemas/types, `verifyNormalizedPartitions(root,completionPin,expected,budget):Promise<VerifiedProducer>`, `iteratePartitionedCandidates(producer,budget):AsyncIterable<CatalogueCandidate>`, family reader/writer primitives needed by membership bridge. Publish exact types/signatures to root early. Verification binds source map, snapshot, checkpoint, counts, all families/digests/order and candidate-lineage join. Export strict capacityV2 schema+validator from existing capacity module, explicit aggregate/coupled allocation arithmetic with no default. Do not edit boundary, bridge or admission files.
- [ ] Write RED tests for omitted/reordered/extra/repinned evidence, duplicate lineage vs preserved exclusion duplicates, unsafe/over-budget capacity and no default385.
- [ ] Implement shared-budget iterators, strict descriptors and exact family/counter verification with bounded buffers and no planet-sized sets.
- [ ] Run focused TS tests; report API/test evidence, no commit until controller integration review.

## Task3: Shared membership session — controller

**Files:** boundary-metadata.ts, boundaryMetadata.test.ts, membership-assembly.ts, membershipAssembly.test.ts.
**Interfaces:** refactor one internal classification session consuming AsyncIterable<CatalogueCandidate>; v1 adapter preserves behavior. V2 loads geometry/BVH once, consumes Task2 iterator, rolls enriched parts and emits one common region inventory/strict completion under one shared ledger; no staged candidate copies.
- [ ] RED tests for two-part global row/work/output exhaustion, missing completion on abort/mutation, unchanged boundary semantics.
- [ ] Implement minimum session/descriptor wiring; focused parity and assembly tests.

## Task4: Virtual final merge — controller

**Files:** build-source-catalogue.ts, sourceCatalogue.test.ts.
**Interfaces:** accept membership completion v2, verify/iterate all enriched parts into one existing buildStreamedCatalogue invocation; regions/footprints once; global inputA reconciliation before accepted result.
- [ ] RED tests for repeated part IDs hidden by publisher dedup, skipped parts, changed rows and consumer query parity.
- [ ] Implement virtual stream without merged file or per-part publisher; focused bridge tests.

## Task5: Admission + driver — controller

**Files:** production-source-admission.ts, production_admission.py, supervised_membership_assembly.py and existing admission/supervisor tests.
- [ ] RED strict schema/capacity mismatch/newhelper-code mutation/partial-resume/prelaunch64-root tests.
- [ ] Add matching v2 branches, capacity pin/limits checks and all new local executable pins in identical order; retain human/source execution boundary and lease/snapshot checks.
- [ ] Focused production and Python integration, independent reviewer covers tasks1–5 in generated diff package; resolve findings and scoped re-review.

## Task6: Contract limit test + release evidence — controller with independent_review

- [ ] Once small cases stabilize, run ONE finite >128MiB synthetic complete-family/end-to-end consumer contract test under explicit aggregate and unchanged per-part limits. No source body acquisition or inventory. Record actual bytes/rows/caps/results; do not call it worldwide evidence.
- [ ] Typechecks, meaningful focused tests and one full appropriate verification pass; independent whole-change review.
- [ ] Separate reviewed implementation commits, handoff/capacity/design documentation, normal branch push; watch all six CI jobs on the exact final tip. No shared tracker/aggregator/workflow edits; coordinator owns imports.

## Execution Notes

User explicitly authorizes disjoint subagent work and controller integration; retained agents are reused to preserve approved contract context. Plan artifacts do not grant data acquisition or actual build execution. Root coordinator already approved the exact linked spec and said proceed; no duplicate permission request is required for this plan decomposition.
