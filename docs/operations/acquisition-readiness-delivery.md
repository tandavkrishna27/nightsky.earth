# Acquisition readiness delivery — 16 October 2026

This wave advances S2-G3/H3 from `57da56f`. Original accounting remains **12 Done / 9 Partial / 6 Not started** until original acceptance gates are met. No dataset download, provider job, credential access, deployment or publication is part of this wave.

## Scope and dependencies

| Lane | Deliverable | Acceptance distinction |
| --- | --- | --- |
| Retained history | Reconcile the accepted padding sample against exact global ownership and preserve source lineage. | Verified padding hours do not create baseline observations; incompatible request geometries remain blocked. |
| Global executor | Connect exact grouped request inventories to bounded acquisition and monthly decoding, with offline transport/containment tests. | Implemented execution controls do not demonstrate current provider acceptance or authorize live execution. |
| Geography capacity | Fresh local capacity arithmetic and explicit stage budgets against actual code limits. | Proposed stop limits and small retained measurements do not prove planet-scale fit or Hetzner serving fit. |

Reconciliation feeds the executor. Geography planning is independent. Final release assembly still depends on actual accepted sources, coverage and measurements.

## Retained-history result

[Reconciliation](retained-history-reconciliation.md) verifies all retained decoded observations against their pinned parents and ledgers. Required retained cell-hours increase from 16,416 to 16,512; acquisition cell-hours from 25,488 to 25,584. The 96 added hours are padding only. Baseline UTC observations remain 16,368 required cell-hours. The four owners `243:457`, `243:458`, `244:457`, `244:458` (16 acquisition cells) are held back because their retained masks differ. Exact global coverage is not silently reduced: those owners remain unresolved work.

## Global executor result

[Executor contract](global-acquisition-executor.md) implements the forward-only finite request flow, exact request/source/reconciliation/runtime pins, persistent consumption receipts, streamed metadata and asset bounds, monthly decoding/lineage and an explicitly gated Windows supervisor. Default and `--plan` remain offline; CI now checks this entry point on both operating systems. The prepared unapproved prefix has 16 jobs and 363 monthly children. It has been checked against the actual reconciliation receipt and excludes all held owners.

A current provider-selection review and owner allowance are still required before any execution. The prepared packet is not either of those records. Sampling-based disk and RSS controls remain distinguished from hard process-tree commit/process limits. Actual provider compatibility, throughput and final baseline completeness remain unproved.

## Geography result

[Capacity plan](geography-capacity-plan.md) proposes 145,578,373,101 bytes of new allocations, leaving 7,840,010,259 bytes above the 128 GiB reserve at the measured snapshot. The pure evaluator rejects unsafe arithmetic, reserve violations and stage byte mismatches. This is advisory only. All producer evidence files have individual 128 MiB assembly limits; planet-domain source admission and actual planet-scale fit remain unresolved. Preparation and the small Hetzner serving host have separate acceptance gates.

## Verification

Local integrated verification: JavaScript suite 921 tests, 920 passed and one skipped, zero failures; all three TypeScript configurations passed; eight offline review cases passed with zero external attempts; plugin packaging passed. Full ERA5 Python suite: 162 tests, all passed in 15.929 seconds. Default global executor prints the offline contract. Independent task reviews found and resolved unsafe capacity subtraction, root-level reconciliation output rejection, fractional-member admission and temporary-file sampling races. Final cross-lane review passed with no additional important findings and independently verified the prepared packet, three source pins and six runtime code pins. Exact-commit CI is checked after pushing and reported with the delivery commit; none of these checks establishes live data acceptance.

CI follow-up: the first run for b860b5f passed four jobs but failed Windows Node and OSM. Node's new test cleanup compared a canonical temporary path with a lexical parent; the fixture now captures one canonical parent without changing production validation. The OSM membership-failure test stopped at two stages instead of three, with insufficient original diagnostics; its cause did not reproduce locally. Bounded report/stderr/size diagnostics and explicit expected-stage assertions were added, with resource limits unchanged. Full local OSM verification: 138 tests, four skipped, zero failures; focused assembly tests: six passed. The follow-up commit b27ee43220b9f4ba6f1a3cda31afb41a542e6f9b passed [all six CI jobs](https://github.com/tandavkrishna27/nightsky.earth/actions/runs/38929778335). Local and follow-up CI success do not explain the initial OSM failure; the additional diagnostics remain.
