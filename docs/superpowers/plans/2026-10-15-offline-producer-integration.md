# Offline producer integration implementation plan

> **For agentic workers:** Use subagent-driven development with the owner's three parallel lanes. Parent owns shared integration, review, verification and branch delivery.

**Goal:** Connect local boundary metadata, decoded hourly history and release inventory verification to the existing immutable serving pipelines.

**Architecture:** Explicit pinned local inputs feed bounded build tools. Serving remains database-free and uses existing catalogue/history formats. Offline fixtures establish software behavior, not an admitted global edition, real historical baseline or host capacity.

**Tech Stack:** Existing Node/TypeScript/Zod and repository tests; no dependency additions or data acquisition.

**Spec:** Owner-approved next-wave direction; [preceding pipelines](../../operations/offline-pipelines-wave.md), [production decision](../../operations/production-data-decision.md), existing scientific and catalogue contracts.

## Global constraints

- Existing isolated `codex/plugin-v1` worktree, baseline `ba6e110937c7b632cd40c04d36ff4ed5e352cb22`.
- No downloads, provider/model calls, credential operations, deployment, public submission or publication.
- Synthetic and retained inputs only; original ticket accounting remains 12 Done / 9 Partial / 6 Not started until original acceptance evidence changes.
- Three disjoint implementation owners. Parent alone edits package commands, test discovery, type configuration, CI and shared status. No worker commits.
- Existing climate statistics and noon-to-noon semantics are authoritative. Missing timezone, observations, membership and coverage remain unknown.

## Task A — geographic boundary metadata

**Files:** `scripts/osm/boundary-metadata.ts`, `tests/places/boundaryMetadata.test.ts`, `docs/operations/offline-boundary-metadata.md`.

**Consumes:** pinned local GeoJSON boundaries and canonical producer records. **Produces:** validated bridge-compatible candidate memberships, region JSONL and conservative footprint metadata. No areal completeness from points; unsupported or ambiguous geometry is rejected or explicitly unknown.

- [x] Record scoped input/output design, strict source identity and resource limits.
- [x] Witness failing tests for holes, islands, borders, split dateline polygons, ambiguity, conflicting membership, checksum/path failures and budget stops.
- [x] Implement immutable bounded output and demonstrate actual existing bridge consumption.
- [x] Run focused tests and independent review; correct material findings.

## Task B — decoded observation aggregation

**Files:** `scripts/era5/build-observation-aggregates.ts`, scoped helpers, `tests/providers/climate/observation-aggregates.test.ts`, `docs/operations/offline-observation-aggregates.md`.

**Consumes:** pinned decoded hourly observations plus explicit cell/IANA-zone mapping. **Produces:** existing validated schema-2 aggregate envelopes accepted by `build-release.ts`.

- [x] Record scoped design and reuse existing aggregation/scientific validators.
- [x] Witness failing tests for multiple cells, timezones/month changes, sparse samples, duplicate/conflicting hours, corrupt inputs and resource stops.
- [x] Implement bounded processing, immutable publication and explicit provenance without changing eligibility gates.
- [x] Prove actual release publisher consumption; focused tests and independent review.

## Task C — release inventory closure

**Files:** `shared/nightsky/operator.ts`, scoped closure helper, `scripts/plugin-operator-preflight.ts`, `tests/operations/operator-preflight.test.ts`, owning operations guide.

**Consumes:** explicit operator configuration, existing catalogue/history manifests and inventory. **Produces:** read-only recursive dependency integrity findings and current/rollback rehearsal evidence. No activation or deployment.

- [x] Record strict reference closure and supported-format design.
- [x] Witness failing tests for omitted dependencies, mutation, aliases, unsafe references and cross-release conflicts.
- [x] Reuse owning loaders/validators where practical; verify byte budgets and current/rollback selection without switching mounts.
- [x] Keep host/deployment/official acceptance flags false; focused tests and independent review.

## Shared integration and delivery

- [x] Add producer commands and test/type discovery; extend offline CI as needed.
- [x] Review complete diff independently and resolve material findings.
- [x] Run full Node/Python suites, three type configurations, package/build and offline runtime checks.
- [x] Update status/owning documents with observed results and remaining data/host/client gates.
- [ ] Commit/push, then observe all six CI jobs for exact final SHA. No merge or deployment.

## Review focus

| Risk | Owner and required proof |
| --- | --- |
| Point or polygon envelope becomes false coverage | A: holes, split geometry and empty/unadmitted footprints |
| Ambiguous border gets a confident state/country | A: strict interior and ambiguity fixtures |
| Sparse/duplicate hours become a qualified baseline | B: existing eligibility reuse and duplicate tests |
| Inventory passes while referenced files are missing | C: real built manifests with dependency omission |
| Fixture resource numbers become host/global claims | Parent: measured workloads labeled separately from pending production gates |

## Interface review

| Tasks | Interface and resolution |
| --- | --- |
| A / C | A produces existing catalogue format through bridge; C reads existing published manifests, independent of boundary build internals. |
| B / C | B produces existing aggregate envelopes through existing release publisher; C reads existing root/shard/tile formats. |
| A / B | No shared files or runtime interfaces. |
| All / parent | Parent owns discovery/configuration/docs integration; workers own scoped code and tests. |

Each lane records precise signatures and supported input bounds in its owning guide before implementation. Existing source/scientific contracts resolve design choices; actual source admission remains deferred.
