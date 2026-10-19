# Local product candidate completion implementation plan

> **For agentic workers:** Use superpowers:subagent-driven-development. Track each deliverable and preserve honest host-dependent acceptance boundaries.

**Goal:** Finish all six locally achievable product work items before infrastructure execution.

**Architecture:** Retain the current API/search-based MCP service and five packaged workflows. Fix deterministic defects at their evidence boundary, retain text-only compatibility, and verify the assembled candidate with offline and bounded model checks. Native display and public source admission cannot be inferred from a CLI run.

**Tech stack:** TypeScript, Node, MCP, existing test harness and package builders.

**Spec:** `docs/operations/v1-hosting-cross-platform-release-plan-20261019.md`, owner priority section; `v1-result-card-prototype-20261019.md`; `v1-resolver-credit-followup-20261019.md`.

## Global constraints

- No deployment, infrastructure/CI/CD implementation, installation changes, new data/provider calls, bulk data, database or credential access.
- Preserve existing uncommitted source-admission documentation; do not stage it accidentally.
- Current card remains opt-in until intended-host visual acceptance. Never claim a model must reproduce credits or can never repeat a call.
- User explicitly authorizes planning, parallel subagents, review, implementation, tests and verification; proceed without a redundant planning approval.
- Keep existing original ticket IDs and categories until their acceptance criteria actually pass.

## Review focus

- Out-of-window samples must not determine session summaries; exact provider cadence and timestamps remain unchanged.
- Missing or failed optional sources must not erase useful core results.
- Oversized/unsafe component data must fall back safely without claiming displayed credits.
- Runtime assets must match unconditional code reads without copying private/bulk data.
- Model evidence must distinguish deterministic checks, synthetic model journeys and actual native-host rendering.

## Parallel tasks

### Task 1 — Forecast-summary correctness (worker A)

Files: `server/nightsky/planner.ts` and the existing planner regression tests.

- [x] Inspect how planner summaries select cloud samples and interval overlap.
- [x] Add a failing regression for a sample outside the chosen window and relevant boundary cases.
- [x] Implement the smallest timestamp/coverage-correct summary fix, preserving structured evidence.
- [x] Run affected tests and report exact evidence for independent review.

### Task 2 — Package/runtime completeness (worker B)

Files: `Dockerfile.plugin`, existing runtime/package tests and narrowly necessary source files.

- [x] Compare unconditional runtime asset reads with the packaged container contents.
- [x] Reproduce missing event assets with a deterministic regression, correct the explicit allowlist.
- [x] Check container-engine availability. Test an actual image only if available without new downloads; otherwise record this later acceptance gate explicitly.
- [x] Verify package/runtime probes and report results for independent review.

### Task 3 — Credits and reuse boundary (worker C)

Files: `server/mcp/resultCard.ts`, `server/mcp/resultCardView.ts`, existing corresponding tests; resolver/workflow files only for demonstrated issues.

- [x] Inspect producer/view limits, safe fallback, credit delivery and exact-place reuse evidence.
- [x] Reproduce and fix deterministic defects without suppressing needed refreshes or weakening credit requirements.
- [x] Run targeted tests and record what remains model/client dependent.

### Task 4 — Exact assembly and representative acceptance (coordinator, after integration)

Files: existing package builder outputs and ignored local evidence scripts; no installed plugin mutation.

- [x] Build current Codex/Claude packages and runtime; record hashes/version and placeholder-endpoint limitation.
- [x] Run affected integration tests, types, compiled-runtime checks and full offline suite after workers settle.
- [x] Run at most one fresh bounded local model batch (maximum three cases, two turns per case, six calls per turn, 120 seconds per turn; zero provider attempts, no web, no retries). Read current generated skills rather than stale installed copies. Reuse existing accepted journeys for the rest of the matrix.
- [x] Review full answers/call traces for useful guidance, actual values, exact-time direction, reuse, forecast failure handling and credits. Record failures, not automatic repeated model trials.

### Task 5 — Independent review, final audit and candidate record

Files: this plan, `docs/operations/v1-completion-tracker.md`, `v1-remaining-ticket-release-matrix.md` and new bounded completion receipt.

- [x] Independently review the integrated changes for spec compliance, correctness and regressions; fix material findings with regressions and scoped re-review.
- [x] Record tests and the exact candidate; reconcile Tasks12B/15 honestly and retain unresolved native display/source gates.
- [x] Keep infrastructure, website release work, purchase/deployment and directory publication in the later sequence.

## Plan review

Self-review: all six requested items map to tasks 1–5: credits/reuse task3, summaries task1, assembly task2/4, conversations task4, final review/freeze task5. Independent lanes own disjoint code; integration tests and final audit wait for all three. No new capability or historical-data scope is introduced.

## Execution receipt

Tasks1–3 implementation and independent reviews completed; the summary review's preparation leak was reproduced, fixed and re-reviewed. Task4 builds/checks and finite six-turn model batch completed, but native/full-skill acceptance did not pass: child policy blocked generated workflow reads, prose credits remain abbreviated, and a Milky Way maximum/reuse failure remains. Task5 scoped code audit is clean and [the completion receipt](../../operations/v1-product-candidate-completion-20261019.md) records evidence and open gates. No blanket closure of Tasks12B/15. One model setup correction followed a zero-tool unsupported-model failure; the six-turn batch itself was not repeated.

Bounded final amendment: independent trace review found the maximum was correct in structured evidence but absent from readable target text. The final fix wave adds that text with a RED/GREEN regression and scoped review. Permit exactly one additional two-turn Milky Way confirmation using the exact generated workflow supplied through the CLI's model-instructions file, avoiding the observed file-read policy failure. Six MCP calls/120seconds per turn, zero providers/web/shell, no model retry; this is explicitly prompt-fed workflow evidence, not native skill installation or rendered-card acceptance. Preserve all prior failures and stop after this case.

Rulings: retain complete raw forecast evidence while filtering generated advice by session; preserve the explicit default-off card until native rendering acceptance; do not invent cache/cooldown behaviour or weaken source-credit tests to force a model pass. Cost if wrong: an omitted meaningful period, a delayed presentation rollout, or unresolved model inefficiency respectively. Native read/credit/maximum failures remain visible rather than being classified as accepted limitations without owner agreement.
