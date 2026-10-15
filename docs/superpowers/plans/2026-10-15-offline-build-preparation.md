# Offline build preparation implementation plan

> **For agentic workers:** Use three parallel subagents, task reviews and a fresh integrated review; parent owns shared registration, verification and delivery.

**Goal:** Make bounded catalogue configuration, conservative geographic coverage preparation and deduplicated historical request planning executable offline.

**Architecture:** Pinned local inputs feed immutable build/preparation outputs. Existing runtime and scientific contracts remain authoritative. Request proposals remain unapproved metadata, and synthetic coverage never becomes an admitted global edition.

**Tech Stack:** Existing TypeScript/Zod/Python and repository test harness; no new dependencies or external source access.

**Spec:** [Approved production build decision](../../operations/production-data-build-decision.md) and its geography/history packets. Owner authorized this three-lane implementation and asked for the following-wave sequence.

## Constraints and interfaces

- Existing isolated `codex/plugin-v1`, baseline `10c1034628634ae88380cd221c9076d393f5ab0f`.
- No downloads, provider/store metadata/API calls, account/credential operations, model calls, deployment, submission or publication.
- Synthetic and retained inputs only. No installed artifact changes or original ticket completion credit from fixtures.
- A owns existing bridge/supervisor and their focused tests; B owns new coverage preparation; C owns new history planner. Parent alone edits test aggregate, package scripts, type configuration, CI and shared status.
- Existing hard limits remain unchanged. CLI configuration exposes bounded existing APIs; it does not certify a worldwide build or raise a publication cap.
- B emits strict RegionRef boundary metadata and existing `full-cell` footprints plus residuals. Cells crossing unproved union seams or invalid geometry remain unclaimed. Hole/island/dateline evidence must survive.
- C consumes checksum-pinned actual decoded partitions and explicit geographic/timezone mappings. Missing hours remain required; duplicate source coverage is never requested twice. Source revision/value conflicts stop planning.
- The baseline is 1991–2020, padded UTC interval 1990-12-30T00:00Z to before 2021-01-03T00:00Z, 263,088 hours per cell. No timezone guesses or new statistical method.

## Task A — explicit build controls (Tasks 0 / 8)

**Files:** `scripts/osm/build-source-catalogue.ts`, scoped config helper, `global_source_supervisor.py`, focused existing/new tests and owning guide.

- [x] Design strict pinned configuration and compatible old CLI path; validate budgets/paths before output creation.
- [x] Witness RED/GREEN for actual configured bridge and supervisor child execution, unknown keys, changed config pins and limits.
- [x] Preserve coherent catalogue revision, immutable output and existing recovery behavior; document unsupported multi-publication composition.
- [x] Focused tests and independent task review.

## Task B — geographic preparation (Task 8)

**Files:** `scripts/osm/prepare-geographic-coverage.ts`, scoped helpers, `tests/places/geographicCoverage.test.ts`, owning guide.

- [x] Design pinned explicit provider-ID/RegionRef mapping and extraction geometry contracts.
- [x] Witness RED/GREEN for strict normalization, holes/islands/split dateline, concavity, hole wholly inside a cell, missing coverage/residuals, pins/mutation and resource stops.
- [x] Emit conservative full-cell footprints and counted residual audit with source provenance; reject unsupported geometry rather than dropping it.
- [x] Prove existing boundary producer/catalogue bridge compatibility; independent review.

## Task C — history mapping and subtraction (Task 9)

**Files:** `scripts/era5/plan-production-history.ts`, scoped helpers, `tests/providers/climate/production-history-plan.test.ts`, owning guide.

- [x] Design strict explicit mapping inventory, validated retained input coverage and compact UTC interval representation.
- [x] Witness RED/GREEN for shared physical cells/multiple zones, nearest-grid mapping rules, retained-hour subtraction and conflicts, deterministic finite proposals, malformed pins/paths/budgets.
- [x] Generate immutable non-executing request proposal with canonical identity, cost counts and remaining coverage; preserve consumed allowances.
- [x] Prove no source calls and exact partition/hour membership; focused tests and independent review.

## Integration and delivery

- [x] Register commands/tests/types/CI without duplicate suites or dependencies.
- [x] Independent task reviews, fixes and fresh integrated review.
- [x] Full Node/Python suites, types/build/package/offline runtime checks; document observed evidence and limits.
- [x] Update owning status and [following-wave sequence](../../operations/v1-completion-wave-sequence.md).
- [ ] Push branch and watch all six jobs for exact final SHA. No merge or deployment.

## Interface / conflict scan

| Pair | Shared contract and finding |
| --- | --- |
| A / B | B outputs existing producer/regions/footprints format; A continues to consume it. Shared files are not edited by B. |
| A / C | Independent build domains; no runtime or file dependency. |
| B / C | Geographic source admission and history mapping remain separate; no unverified timezone from boundary membership. |
| All / parent | Shared registration and status owned centrally. Full build resource use is measured sequentially, not inferred by summing independent fixture results. |

## Review focus

Wrong effective defaults or unpinned config; false cell coverage around holes/seams; source-field loss during normalization; missing/duplicate retained hours and conflicting revisions; request proposals mistaken for submitted/approved jobs. Each lane's tests must cover its relevant failure class.

## Execution evidence

See [final local verification and reviewed corrections](../../operations/offline-build-preparation-wave.md). Initial geography tests followed implementation; no initial RED is claimed. Its CRS regression and the build numeric-parity regression have witnessed RED/GREEN. Post-commit push/CI outcomes are recorded separately after observation.
