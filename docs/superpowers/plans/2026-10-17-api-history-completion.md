# Practical API history implementation plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development or superpowers:executing-plans. Follow TDD for retained product code.

**Goal:** Implement bounded API history planning, durable orchestration and compact cached serving, with honest source/admission limits.

**Architecture:** Preserve legacy pilot contracts; add configurable larger-range planning and canonical cell mapping. Use one explicit worker/lease plus existing durable quota, then store source-specific summaries for read-only provider lookup.

**Tech Stack:** TypeScript, Node filesystem/crypto, existing Zod/astronomy and ProviderQuota. No new dependency or database.

**Spec:** `docs/superpowers/specs/2026-10-17-api-history-completion-design.md` and the coordinator's explicit implementation assignment.

## Global constraints

- Own only climate providers/shared climate schema, new API-history scripts/tests and lane docs.
- Never edit shared tracker, tests/all.test.ts, planner/runtime/register or other worktrees.
- No live data/API call, credential access, download, deployment, deletion, push or old acquisition restart.
- Preserve 1991–2020, source precision, missingness, independent denominators and timezone rules.
- Focused tests/types; coordinator owns combined suite/CI and integration.

## Review focus

1. Source credit floors differ from HTTP request count; quota must reserve conservative estimated units.
2. Dateline/pole/tie mapping and selected point/zone/revision must not be manufactured by rounding returned metadata.
3. A crash after intent cannot be retried as if no request occurred; cache corruption must not produce numbers.
4. Full-period labels or a configured provider cannot bypass explicit method admission and per-bin/year guards.
5. Memory/cache/queue limits must bind real input paths, not only report constants.

## Task 1 — Pure larger-range contract and mapping

Files: new `server/providers/climate/apiHistoryPlan.ts`, new
`scripts/era5/plan-api-history.ts`, extend `openMeteoHistoryContract.ts`, new
`tests/providers/climate/api-history-plan.test.ts`.

- [x] Write failing tests: 263088 slots once, 30 default or six explicit ranges,
  78.3 estimated credits versus 90/84 integer reservations, fixed parameters,
  mapping ties/dateline/poles and generalized bounded decoder rejection.
- [x] Run focused red; implement/export `planApiHistory(point, timeZone,
  {rangeDays?})` and `mapApiHistoryPoint(point)`; preserve legacy pilot shape.
- [x] Verify focused green/type checks; hand frozen interfaces to integration.

## Task 2 — Durable worker, bounded cache and provider

Files: new climate API-history job/store/provider modules and corresponding
`api-history-jobs.test.ts` / `api-history-provider.test.ts`; modify shared climate
schema only to represent explicit hosted source admission.

- [x] Write failing tests for default offline, approval/lease/quota/intents before
  fake transport, stops/caps/uncertain restart and source-qualified cache lookup.
- [x] Implement shared single-build file lease, bounded journals/summary files,
  conservative integer quota reservation, sequential injected transport and the
  existing retained aggregate path with a 16 MiB cumulative input cap.
- [x] Implement read-only provider lookup with exact point-to-cell/zone/rules
  binding; full baseline requires explicit qualification plus existing quality
  guards. Preserve point sourceRevision in responses.
- [x] Run focused green, legacy history regression tests and type checks.

## Task 3 — Independent review and local delivery

- [x] Independent reviewer checks code/source contract and meaningful edge cases.
- [x] Resolve material findings with regressions; rerun affected checks only.
- [x] Write `docs/operations/API-HISTORY-COMPLETION.md` with exact changes,
  source links, request/credit comparison, tests/imports/integration, remaining
  live/product gates and next executable step.
- [x] Verify ownership/diff; commit locally on `codex/api-history-completion`.
  Do not push. Record commit SHA in the delivery chat/handoff identity note.
