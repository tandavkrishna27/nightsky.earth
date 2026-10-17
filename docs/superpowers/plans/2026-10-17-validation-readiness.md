# Validation readiness implementation plan

> **For agentic workers:** Use superpowers:subagent-driven-development for the three owner-approved independent lanes; integration and whole-branch review remain coordinator-owned.

**Goal:** Resolve the recorded geography diagnosis, make history accounting executable without resetting usage, and prepare a complete local API-fixture Codex package/session.

**Architecture:** Preserve existing provider/runtime interfaces. Geography changes require confirmed evidence. History adds an explicit state-preserving operator path; normal serving never acquires history. The Codex fixture path binds the full existing package to a loopback-only service with closed synthetic providers.

**Tech Stack:** Node 24, TypeScript, existing MCP SDK and file-based quota state.

**Spec:** `docs/operations/geography-selection-result-20261017.md`, `history-annual-next-packet.md`, `assembled-experience-next-packet.md`; user-approved next-wave table in this chat.

## Global constraints

- Baseline `2b298d52f172a552ef315fe60e2b21a12f4e7812`; reuse isolated `codex/plugin-v1` worktree.
- No new provider requests, historical downloads, private ledger mutation, deployment or publication.
- No nested-model policy bypass. Native installation and actual model/owner acceptance remain distinct from fixture/package checks.
- Preserve original 27-ticket counts and six completion blocks.
- Root owns shared tracker, aggregate test imports, type-project registration and CI.

## Review focus

- Missing provider entry must not reset other providers or manufacture unused allowance.
- Migration interrupted before/after persistence must not enable replay or lose counters.
- Country search returning zero features must not be described as a parser defect or global coverage proof.
- Fixture tooling must never fall back to real providers or inherit private account configuration.
- A built package and MCP tool listing must not be recorded as native skill loading or model-answer acceptance.

## Parallel tasks

### A. Geography diagnosis

Own geography adapter/validator only for confirmed fixes, their focused tests and `docs/operations/geography-diagnosis-20261017.md`.

- [x] Compare retained zero-feature diagnostics with official query contract.
- [x] If confirmed bug: write failing regression, correct it and run affected tests. Otherwise preserve code and document the limitation and safe fallback.
- [x] Pin any alternative request as unexecuted and separately authorized; no automatic retry.

### B. History accounting

Own `server/providers/quotaState.ts`, narrowly scoped operator module/CLI and tests, annual-probe wiring, and `docs/operations/history-accounting-20261017.md`.

- [x] Specify explicit verified-usage input and stable Open-Meteo policy identity before implementing migration.
- [x] Observe failing tests for preservation, missing/corrupt state, ownership/concurrency, interruption/replay and refusal of invented allowance.
- [x] Implement minimal atomic state-preserving provider admission; default plan-only operator interface.
- [x] Bind annual probe to the actual durable quota implementation, exact approval and existing request limits.
- [x] Run focused tests and document the exact safe invocation and remaining evidence/approval inputs; do not touch the private ledger.

### C. Local Codex preparation

Own narrowly scoped fixture preparation/listener scripts and tests plus `docs/operations/codex-local-preparation-20261017.md`.

- [x] Reuse existing package and API-fixture helpers; add a small entry point only where missing.
- [x] Test loopback restriction, closed provider transport, package/endpoint identity, tool inventory and cleanup.
- [x] Build version 1.0.14 projection; retain hashes and actual local paths.
- [x] Verify fixture transport without model inference or persistent host install; document supported native-session steps and unresolved host evidence.

## Integration

- [x] Review lane changes and register new suites/type-check entry points.
- [x] Independent whole-change review; fix material findings with regression evidence.
- [x] Run aggregate tests, types and relevant package/build/runtime checks.
- [x] Update tracker and execution evidence, commit/push, observe exact-commit CI. Completed at `887cb46`; all six jobs passed in run `39026264217`.

## Execution rulings

- User explicitly chose parallel execution and authorized the wave; proceed without another planning confirmation. The inline-only portions of executing-plans do not apply to the three delegated lanes.
- Preserve plans and evidence documents; do not delete retained work to satisfy generic skill cleanup guidance.
- No live allowance carries forward from the consumed geography request.
