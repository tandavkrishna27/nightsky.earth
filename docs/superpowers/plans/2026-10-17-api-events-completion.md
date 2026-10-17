# API event evidence and assembled workflow readiness implementation plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development or superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Make supported event evidence and the four ordinary planning journeys useful without inventing missing source facts or silently reducing meteor scope.

**Architecture:** Extend the existing source-qualified civil guidance contract with inspected original facts. Keep annual guidance, year-specific published maxima, UTC events and bounded radiant models separate. Synchronize the five canonical workflows and packaged skills and verify offline journeys; retain explicit search handoffs and actual host/source gates.

**Tech Stack:** TypeScript, Zod 4, Node test runner/tsx, pinned Astronomy Engine, existing Markdown-to-skill generator.

**Spec:** [Current planning-flow baseline](../../operations/planning-flows-wave-20261017.md), [original product scope](../../product-scope-v1-v3.md), and the coordinator's bounded lane assignment on 17 October 2026.

## Global constraints

- All nineteen retained identities remain; the thirteen-shower matrix is proposed comparison only, not approved scope reduction.
- Global, free, API/search-based product; no exhaustive owned catalogue, planet build or database prerequisite.
- No deployment, publication, paid endpoints, credential access, authenticated/live data API calls, new dataset downloads or deletion.
- Public primary-source documentation research is allowed; do not reopen failed IMO routes or consumed live allowances.
- Own event code/schema/tests, plugin skills, canonical workflows and lane docs. Planner shared integration is coordinator-owned; provide exact guidance if needed.
- Do not edit `tests/all.test.ts`, the shared tracker or other worktrees. No branch push; coordinator runs combined suite and CI.

## Review focus

- Calendar clock text belonging to Moon or visibility must never become a meteor maximum.
- Conflicting source forecasts retain their separate identities, definitions and uncertainty rather than being averaged.
- A missing peak or full-season model must leave usable selected-session astronomy/weather evidence available.
- Civil dates must not acquire inferred UTC midnight, zone or requested-window overlap.
- Optional host search must produce a cited follow-up route without becoming fabricated provider data or a required host capability.

## Task 1 — Original source facts and strict civil contract

Files: `server/events/meteorCivilGuidance.ts`, `shared/nightsky/events.ts`, existing event catalog tests and `docs/operations/API-EVENTS-SOURCE-ADMISSION.md`. Preserve existing rows and add only directly inspected original IGN facts. Add explicit unspecified maximum time basis where the original gives only a date. Keep the row/result bounds finite and reject mismatched identities/dates and duplicate rows.

- [x] Add focused failing assertions for new factual rows and forbidden UTC/clock inference.
- [x] Implement the minimal contract and field-level attributed values.
- [x] Run the relevant existing event tests; record source locators, rights and source conflicts.

## Task 2 — Event integration and inventory consistency

Files: `server/events/catalog.ts`, `server/events/meteorCoverage.ts`, `tests/events/meteorCoverage.test.ts` and integration assertions in existing event tests. Reuse civil guidance once per result; describe actual returned rows and source-specific clock precision without hard-coded two-row claims. Expose civil references in the offline inventory as context while complete activity support remains missing.

- [x] Add failing assertions that admitted civil context is visible without upgrading complete activity support or creating UTC peaks.
- [x] Implement context/integration changes and run focused event checks.
- [x] Independently inspect source-agent changes against actual source evidence and the contract.

## Task 3 — Workflows and four assembled journeys

Files: five `docs/product/workflows/*.md`, matching generated `plugins/nightsky/skills/*/SKILL.md`, existing `tests/skills/*.test.ts` and `docs/operations/API-EVENTS-WORKFLOW-READINESS.md`.

- [x] Add meaningful regressions for ordinary stargazing, meteor planning, astrophotography and learning under incomplete event evidence.
- [x] Remove false blanket stops and stale NASA-only timing claims; preserve evidence domains, unknowns, source links and optional source-search handoff.
- [x] Regenerate using the existing workflow generator and run focused checks.

## Task 4 — Independent review and lane delivery

- [x] Assemble a diff package from baseline `bc8de008bc60d6b47f8422cf15787584d16e2698` for independent spec/quality review.
- [x] Resolve material findings and run covering tests, all three TypeScript checks, plugin build/package verification and affected local links/whitespace checks.
- [ ] Commit the reviewed lane result locally and write `docs/operations/API-EVENTS-COMPLETION.md` with exact SHA, evidence, test-import instructions, remaining gates and next executable step. Do not push or run the combined suite/CI.

## Progress and rulings

Task 1 complete: five admitted IGN civil rows, no UTC/model changes; source-agent 27 focused checks and three TS projects passed. Task 2 complete: identity/context RED cases reproduced then passed; dynamic catalog caveats distinguish source clock bases. Task 3 complete: five new offline journey cases and five synchronized skills; workflow-agent 65 skill/package checks passed. Parent fresh affected verification: 119 passed, zero failed/skipped. Coordinator-owned planner dispatch/formatting and redundant unsupported sampling are documented integration dependencies, not claimed lane fixes. No scope reduction or scientific-completeness ruling is made by this plan; the original useful-qualified-result acceptance is preserved. Source admission and actual host/release acceptance remain separate.

Final independent review: source/science/spec pass; one workflow claim about a nonexistent returned matrix was corrected in all ten files and scoped re-review passed. Parent verification: 119 + 45 focused tests passed, followed by the strengthened 10-case identity/inventory rerun; all three TS projects, plugin build, package generation and deterministic Codex/Claude verification passed. Eight local document links/fragments resolved; whitespace checks passed. Root planner integration remains explicit, including one unsupported sample and unsupported-versus-outside-model wording.
