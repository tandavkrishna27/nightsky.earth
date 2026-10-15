# Offline production pipelines implementation plan

> **For agentic workers:** Use subagent-driven development with the owner's three parallel lanes; parent owns shared integration and final review. No downloads or deployment.

**Goal:** Deliver a usable offline raw-source/catalogue path, multi-shard historical release path and standalone operator preflight in one integrated engineering wave.

**Architecture:** Bulk processing runs outside the serving host. Temporary SQLite indexes are build scratch only; immutable checksummed JSON files remain the database-free serving format. Existing climate method and catalogue schemas remain authoritative. Missing worldwide boundaries, input admission and actual baseline data stay explicit.

**Tech stack:** Existing TypeScript/Node/Zod, Python standard library and already pinned optional pyosmium. No new dependencies or data/provider requests.

**Spec:** [Approved preparation plan](2026-10-15-v1-production-data-readiness.md), [integrated decision](../../operations/production-data-decision.md), and its linked three owning packets. Owner explicitly requested a larger implementation wave and parallel subagents.

## Constraints and interfaces

- Work only in existing `codex/plugin-v1` worktree; baseline `4e01ce269dfb9accabf6fa5a5424816b851c0b35`. No source acquisition, new accounts, credential inspection, model calls, deployment, submission or publication.
- Synthetic fixtures and existing retained inputs only. No real global coverage, resource fit or baseline completion claim from code/tests. Original ticket counts remain 12 Done / 9 Partial / 6 Not started.
- Each lane owns its new modules/tests/doc; parent alone owns aggregate imports, package commands, type configurations, CI and cross-lane runtime wiring. No worker commits while shared edits are in flight.
- Geography's producer emits bounded canonical JSONL for `buildStreamedCatalogue` with the existing `StreamedCatalogueInput`: `catalogueRevision`, async `candidates`, `regions`, `footprints`. Metadata is supplied and validated, not inferred from selected-point bounds. Reject unsupported incomplete/dateline/polar ways with an explicit audit; no implicit relation coverage.
- History exports `createReleaseEra5ClimateProvider(options: Era5ClimateProviderOptions & {maxManifestBytes?, maxShardCacheEntries?, onTileRead?})`. Explicit new environment pair: `NIGHTSKY_ERA5_RELEASE_MANIFEST` / `NIGHTSKY_ERA5_RELEASE_SHA256`; mutually exclusive with actual legacy `NIGHTSKY_CLIMATE_ARTIFACT` / `NIGHTSKY_CLIMATE_SHA256`.
- Parent provides `climateArtifactConfiguration(environment)` and `selectConfiguredClimateProvider(index, environment)` in `server/providers/climate/configuration.ts`, then wires route/direct tool/standalone startup. Legacy no-configuration remains unavailable; explicit malformed/conflicting release selection fails closed.
- Operations reads an explicit strict operator JSON, not ambient environment or private settings; returns redacted finding codes with `hostChecksPerformed:false` and `deploymentReady:false`. Config/artifact checks perform no network, mount switch or deployment.
- Resume verifies exact source/policy/descriptor identities and completed output hashes; it cannot append to a published edition, duplicate observations or install incomplete work. No automatic recursive cleanup.

## Task A — raw geography to immutable catalogue

**Own:** `scripts/osm/global_source*.py`, `scripts/osm/build-source-catalogue.ts`, `tests/osm/test_global_source*.py`, `tests/places/sourceCatalogue.test.ts`, `docs/operations/offline-global-source-pipeline.md`.

**Produces:** strict local source manifest; bounded raw XML/PBF producer with disk-backed node/reference and identity/lineage handling; audited exclusions; immutable JSONL/checkpoints; bounded supervisor; schema-checked async bridge to existing paged builder.

- [x] Write and witness failing tests for incomplete ways, identical/conflicting duplicates and source lineage, malformed metadata, pinned hash/size and mutation, paths/symlinks, resource/deadline stops and verified resume.
- [x] Implement source-local producer and supervisor without broadening pilot pins or importing unreviewed relation geometry. PBF uses existing optional parser; XML fixtures require no new dependency.
- [x] Implement bounded JSONL bridge and prove a produced catalogue can be loaded/queried using existing reader; ensure cancellation closes readers and no point bounding box becomes admitted footprint evidence.
- [x] Run focused Python/Node tests; document capability limits and measured fixture bounds. Independent task review before integration acceptance.

## Task B — historical shards, root publication and serving

**Own:** `scripts/era5/build-release.ts` and scoped helpers; `server/providers/climate/releaseEra5.ts`, compatible changes to `era5.ts`; `tests/providers/climate/release-publication.test.ts`; `docs/operations/offline-history-release.md`.

**Produces:** immutable multi-shard publication with explicit cell/timezone coverage and validated existing tiles, verified resumable checkpoints, root completion manifest last, bounded lazy serving and coherent method/period/source lineage. Root schema v3 initially caps 1,000 shards/10,000 pairs/4 MiB; each shard retains existing ten-tile publication bound. These are engineering limits, not worldwide capacity.

- [x] Witness failing tests for more than ten synthetic tiles across shards, deterministic publication, missing/duplicate keys, changed source/method/period and checksum/path failures.
- [x] Implement sequential bounded input processing, immutable shard output, verified checkpoint recovery and final-root publication. Reuse validated aggregation/statistics; do not manufacture observations or lift quality gates.
- [x] Implement lazy shard/tile serving with bounded aggregate cache and coalesced reads; prove mapped and uncovered queries preserve provenance/unknowns, and interrupted roots cannot serve.
- [x] Run focused tests including corruption, interrupted resume, concurrent reads and byte accounting; independent task review.

## Task C — explicit operator configuration and preflight

**Own:** `shared/nightsky/operator.ts` if needed; `scripts/plugin-operator-preflight.ts`; `config/plugin-operator.example.json`; `tests/operations/operator-preflight.test.ts`; `docs/operations/plugin-operator-preflight.md`.

**Produces:** strict redacted plugin-specific template and read-only CLI/library checking actual runtime contracts, current/rollback artifact tuples, bounded file integrity and combined disk/reserve evidence. Unknown owner/host inputs remain visible; offline validation cannot authorize deployment.

- [x] Witness failing tests for full/resolver mode requirements, unsafe URLs/hosts/proxy trust, malformed/conflicting climate selection, secret keys and redacted errors.
- [x] Implement schema, explicit-file CLI and bounded contained artifact verification; never read ambient credentials or execute selected topology.
- [x] Validate current/rollback coexistence, resource/reserve accounting, immutable selections, missing/mutated/symlink artifacts and clearly non-deployable example behavior.
- [x] Run focused tests and document offline findings versus owner inputs and real-host gates; independent task review.

## Parent integration and review

- [x] Witness configuration integration RED/GREEN for new pair, absent configuration, malformed pair and conflict with either legacy key; wire actual MCP route, direct server and startup.
- [x] Register new tests in `tests/all.test.ts`, include new script modules in relevant type checks and add CI-specific offline pipeline steps where aggregate discovery alone is insufficient. Existing Python discovery covers new OSM tests on both OSes.
- [x] Review each frozen lane, fix material findings, then independently review the integrated diff and runtime boundaries. Keep any unresolved scientific/source gates explicit.
- [x] Run the complete local Node suite, pinned Python suites, all type checks, build/package/runtime checks and affected end-to-end fixtures; no model/source calls.
- [x] Update original owning docs/status and execution evidence accurately.
- [ ] Commit/push the branch and observe all six CI jobs on the exact final SHA; result is recorded after commit in the ignored ledger and delivery response. No merge or deployment.

## Review focus

| Risk | Owner / evidence |
| --- | --- |
| Disk-backed preparation is mistaken for a runtime database or bounded fixtures for global fit | A docs and parent evidence separate build scratch, serving format and actual capacity. |
| Duplicate identity/observations or resumed partial output silently changes release | A/B exact identity, hash, immutable checkpoint and conflict regressions. |
| Multi-shard cache or concurrent loads multiplies supposedly bounded memory | B checks aggregate byte/reader/in-flight limits, not just per-shard settings. |
| New climate env exists in preflight but not actual route/direct startup | Parent contract and runtime tests use exact legacy and new names with conflict checks. |
| A valid template/offline check becomes a deployment/coverage approval | C result always retains host/deployment flags and separate acquisition/client gates. |

## Execution record

See [assembled evidence and remaining gates](../../operations/offline-pipelines-wave.md). All three task reviews and final integrated review approve the corrected implementation. Fresh local suites/types/builds/packages/runtimes pass. The push/CI step remains pending at source-document preparation time and is tracked externally to avoid claiming an unobserved result. No original ticket count or source/host authority changes.
