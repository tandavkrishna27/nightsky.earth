# Global Resource Envelope Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Support an explicitly reviewed global candidate envelope by separating physical validation resources from geometry comparisons and coupling v3 row/output controls end to end.

**Architecture:** Add one typed resource session, preserve its initial start/deadline/counters through bootstrap, admission, raw verification, classification, writes, publication and final verification. Strict v3 plans/capacity/completions are separate from unchanged v1/v2; raw manifest stays v2 and final consumer stays schema2.

**Tech Stack:** Existing TypeScript/Zod/Node and Python; no packages, services or source jobs.

**Spec:** docs/operations/candidate-global-envelope-design-20261017.md, revised design af45810. Coordinator explicitly approved this design with its four mandatory coupling requirements and selected disjoint subagent execution.

## Global Constraints

- Exact matrix raw1/assembly1, raw2/assembly2/capacity2, raw2/assembly3/capacity3; no raw3.
- V1/v2 behavior/limits unchanged. Geometry <=200m, session/publisher <=30min, same full classifier/source scope and tamper protections.
- Required v3 C <= raw candidate allowance and publisher input rows <=10m; M bounded by64parts+commonmetadata and coupled enriched+regions+footprint publication inputs.
- Physical read bytes/rows, lexical tokens, validation operations, geometry comparisons and emitted writes are distinct. Same session/deadline across every pass. Bootstrap <=3MiB physical control reads, <=4m lexical/operations, <=60s, with original start and actual accounting transferred to admitted session.
- No download, inventory, cleanup, provider job, production invocation, auto-approval or serving change. Do not edit coordinator-owned test aggregator/config/workflow. No large rerun unless resource mechanism change justifies one separately finite observed test.

## Review Focus

1. Mixed versions/downgraded trusted completion reject before output (Tasks2/3).
2. Writer bytes cannot buy physical-read headroom (Tasks1/2/3).
3. Second gate/final rereads cannot reset Q, resource counters or deadline (Tasks1/3).
4. Publisher input must include enriched plus common metadata, not raw bytes (Tasks1/2/3).
5. C>1m and M>1GiB are v3-only explicit controls; actual count/EOF checks still exact (Tasks1/2/3).

---

### Task1: Resource session, reader/writer views and capacity — policy_prepare

Files: create scripts/osm/partitioned-resources.ts and tests/places/partitionedResources.test.ts; modify partitioned-candidates.ts/geography-capacity-plan.ts and owned tests. Own no other files.

Interfaces: export strict validationLimitsV3Schema and ResourceSessionV3/BootstrapResources types. Publish exact finalized signatures to root/Task2 before caller implementation. Required operations are createBootstrapResources(startedAt,signal?), bootstrap read/token/operation charges, createResourceSessionV3(limits,bootstrap), validation read/token/operation charges, geometryOperation, recordWrite(scope,bytes,rows), resourceCheckpoint. Session owns named counters, original start/deadline, distinct metadata map and signal. SharedPartitionBudget gains optional resourceSession plus accounting:'read'|'write'; preserve legacy behavior without it. Read tick routes bytes/rows to physical reads, parser tokens to lexical counter, nongeometry ticks to validation operations. Write views record distinct output counters under existing local output allowance.

- [ ] Write exact independent exhaustion/read-versus-write/bootstrap transfer/deadline tests and observe RED.
- [ ] Implement session and opt-in v3 budget views; same object through all passes.
- [ ] Add strict capacityV3Schema/evaluateGeographyCapacityV3; all explicit controls, safe R=4*(B+M+F)+8MiB+3G+Q, source retained credit, enriched+region+footprint input coupling, old v2 unchanged.
- [ ] Run owned focused tests and strict typecheck; report observed RED/GREEN, interfaces, no broad repeats.
- [ ] Freeze source for peer review; root commits integrated deliverable after independent review.

### Task2: Versioned membership/completion/bridge — independent_review

Files: boundary-metadata.ts/build-source-catalogue.ts and their existing tests only.

Consumes Task1 finalized session/charge APIs. Source interface requires resourceSession for v3 and explicit version-specific membership controls. Produce strict membership completion schema3 with separate read/write/lexical/operations/geometry totals and source identity; preserve schema1/2. Bridge validates fresh trusted pin before exact version dispatch and preserves captured final verifier.

- [ ] Write RED tests for v3 split accounting, v2 cap isolation, dynamic expected rows/output schema, completion downgrade/resource mismatch, publisher enriched+common allowance, common deadline and late verification.
- [ ] Route actual geometry parsing/BVH/containment ticks only to geometry; input reads/hashes/iteration/writes to validation/read/write operations. Boundary geometry readbacks and descriptor metadata remain metered.
- [ ] Propagate C/M/version into session, expected counts, schema3 completion and bridge; no per-part reset, publisher once, actual A exact through EOF.
- [ ] Record publisher emitted/scratch stats separately from read accounting; captured verifier uses original session and pins.
- [ ] Run owned focused tests/typecheck, report interfaces/evidence and freeze for peer review.

### Task3: Python strict compatibility and supervisory coupling — bounded_receipt

Files: supervised_membership_assembly.py and tests/osm/test_partitioned_assembly.py only. No raw producer/wire changes.

Consumes documented strict capacity3/plan3 mapping; coordinate exact fields with root/Task1. Preserve pre-expansion combined64 including attempt, original source execution and fixed production gate.

- [ ] Write RED exact matrix/unknownversion/duplicate-key/v2unchanged and v3 capacities tests before gate/Job.
- [ ] Accept only raw2/plan3/cap3 in new branch, validate controls and supervisor exact equality, source credit, finite validation bootstrap/read allowance and versioned membership controls.
- [ ] Run focused driver tests, report RED/GREEN; freeze for independent peer review.

### Task4: Root assembly/admission/bootstrap/code closure

Files: partitioned-assembly-plan.ts/membership-assembly.ts/production-source-admission.ts/production_admission.py, necessary optional accounting hooks in source-admission.ts, existing root tests.

- [ ] Add strict v3 plan parsing and exact compatibility matrix; bootstrap bounded plan/capacity/raw control discovery without output. Start timer before discovery and seed actual read/token/operation totals into v3 session.
- [ ] Thread session into both Node assembly gates and linked metadata readers; Q and total read ledger charge actual before body allocation/read. Runtime counters are not source snapshot identity.
- [ ] Meter boundary staging copy/readbacks, control re-reads/final marker writes; maintain resource read/write distinctions. One deadline from original bootstrap start.
- [ ] Bind explicit C/M/validation limits to capacity and downstream version3 source/bridge; retain all initial/intermediate/final raw/enriched checks and atomic pending marker.
- [ ] Pin new resource module in ordered TS/Python executable closure. Write meaningful adversarial matrix/bootstrap/gate/Q/final-read/exact enriched capacity tests RED then GREEN.
- [ ] Run affected focused tests/typechecks once source stable, request independent spec then quality reviews and fix concrete findings.

### Task5: Stable verification, evidence and handoff — root

- [ ] Review all scopes independently (cross-review owners), summarize fixes and material limits.
- [ ] Run appropriate stable full Node/Python integration plus direct new unregistered tests; avoid duplicate root runs if coordinator already owns integration. Existing large result stays tied to old code; rerun only a relevant explicitly bounded resource-contract check when justified, never imply global production.
- [ ] Commit/push reviewed implementation/evidence, let coordinator integrate new test imports and exact-tip six-job CI, report actual SHA/results.
- [ ] Keep actual planet identity/admission, resource fit, global source coverage and serving acceptance separate. No r2 inventory until storage-settled signal.
