# Final local credit presentation and delivery plan

> **For agentic workers:** Use superpowers:subagent-driven-development for independent implementation and review.

**Goal:** Finish the tested planning card's credit presentation and explicit startup delivery, then reconcile local acceptance without claiming hosted or all-client readiness.

**Architecture:** Keep the existing MCP Apps resource and complete ordinary text/structured evidence. Add a conservative display projection over the retained source records; the projection must not discard distinct notices. Wire the existing dependency-only card switch to a strict operator-owned startup flag. Default remains off; neither the model nor request input can enable it.

**Tech stack:** Existing TypeScript/Node/MCP/vanilla HTML and offline tests; no dependencies or provider calls.

**Spec:** `docs/operations/v1-owner-native-followup-20261019.md`, current successful native screenshot and owner-approved four-step local completion pass.

## Constraints and review focus

- No installation, live API, private configuration/accounting, deployment, website or CI/CD implementation changes.
- Preserve existing unrelated edits to data-sources.md and weather-provider-admission.md.
- Raw source records, full notices/licence links and ordinary text fallback remain intact; a static sources website is not a substitute for required adjacent credits.
- Visible duplicate identity includes all displayed names, notices, source/licence URLs and modification indicators. Same-URL different notices cannot be merged.
- Context/unavailable references must not imply numerical data was obtained. Shared source roles remain visible; unknown use is labelled conservatively.
- Missing or malformed component metadata falls back safely; no XSS/network/storage/permission expansion.
- Explicit true/false startup parsing, all supported configuration branches and resolver-only isolation need tests. A rendered card in one Codex fixture does not prove every provider/logo requirement or other host support.

## Task 1 — Source display projection (lane A)

Files: server/mcp/resultCard.ts, server/mcp/resultCardView.ts; tests/mcp/result-card*.test.ts.

- [x] Inspect plan evidence/source identity and agree a server-owned display representation retaining raw card.sources.
- [x] Add failing tests for duplicate display notices, distinct notices/rights, unavailable history references, mixed source roles and safe legacy fallback.
- [x] Implement the minimum display projection and explanatory labels. Preserve schemaVersion1 compatibility and total32KiB limit.
- [x] Run affected transport/view/credit tests and independently review.

## Task 2 — Explicit card startup delivery (lane B)

Files: server/plugin.ts; existing configured-runtime tests; new delivery operations note.

- [x] Add pure pluginPlanningCardConfiguration(env):boolean for NIGHTSKY_PLANNING_CARD_ENABLED. Undefined/false disables, true enables, other strings reject before provider/private setup.
- [x] Wire existing resultCardPrototype dependency in configured API/legacy paths. Retain resolver-only isolation and ordinary content independently of card support.
- [x] Add failing parser/wiring regressions, implement, run affected checks and independently review.
- [x] Document configuration, mixed-host/text-only limitations and later source/logo/public-host gates. Do not change the owner's runtime configuration.

## Task 3 — Integrated verification and reconciliation (coordinator)

- [x] Review integrated diff and fix material findings with scoped re-review.
- [x] Build/type-check packages/runtime, run affected tests and complete offline regression suite. Rehearse current card desktop/mobile rendering locally without external traffic; this is synthetic-parent visual evidence, alongside the retained real native screenshot.
- [x] Update tracker/matrix with criterion-level outcomes: native numerical/rendering successes, remaining text-only model-credit and hosted/source/client gates. Close only criteria actually satisfied; no count reset or another broad model/data batch.
- [ ] Commit scoped changes, push existing branch and watch exact-commit CI. No deployment.

## Plan review

Self-review: task1 owns visible identity and use labels; task2 owns operator enablement and unchanged fallback; task3 integrates, verifies and reconciles. The user already authorized execution and reviews, so no additional planning permission is needed. Source-rights and actual-host limitations are retained rather than inferred from tests.

## Execution outcome

Implementation and scoped re-review passed after fixing an overlapping native forecast-period classification regression. Full suite1,880passed/2skipped, types/build/runtime both modes and three package rehearsals pass. Desktop/mobile synthetic-parent rendering retains all notices. Final commit/push/CI is recorded in the handoff; no deployment/provider calls or installed-package changes.
