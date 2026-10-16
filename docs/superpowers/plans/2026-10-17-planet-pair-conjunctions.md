# Bounded Planet-Pair Conjunctions Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add useful, explicitly partial geocentric RA-crossing planet-pair events without changing the meteor launch decision or existing solar/elongation definitions.

**Architecture:** A separate local adapter screens canonical annual inventories for all 21 Mercury–Neptune pairs. It returns sourced dated crossings plus separate unresolved coverage; the existing catalog performs final inclusive filtering, sorting and truncation. Shared strict optional metadata preserves legacy solar-alignment payloads.

**Tech Stack:** TypeScript, pinned MIT astronomy-engine 2.1.19, zod4, existing node:test/tsx suites.

**Spec:** [Fixed scientific/API/reference contract](../../operations/planet-pair-conjunction-contract.md).

## Global Constraints

- All 21 unordered Mercury–Neptune pairs; output horizon 2025–2027; request ≤366 days; final results ≤25.
- Geocentric true RA of date; light-time and aberration; no observer displacement or implied closest approach/local visibility.
- Numerical controls, budgets, coverage shape and two 60-minute source envelopes are fixed in the spec before pair outputs.
- Existing solar alignments/elongations, all nineteen retained meteor identities and pending owner selection remain unchanged.
- No new datasets/dependencies/provider jobs/API requests, shared tracker, tests/all.test.ts, tsconfig.tools.json or workflow edits. Parent commits/pushes; agents do not.

## Review Focus

- Opposite-RA/wrap zeros must not become conjunctions: synthetic rejection test in Task 1.
- Retrograde repeated roots and near-tangent candidates must not silently disappear: synthetic inventory/unresolved tests in Task 1.
- Query endpoints and year crossing must retain identical canonical event identity: Task 1 tests.
- Partial/out-of-range pair search must preserve supported solar/Moon/meteor and unsupported-class evidence: Task 1 catalog tests.
- A sourced conjunction must not imply local observing suitability: Task 2 composed-plan test.

### Task 1: Numerical RA adapter, strict schema and catalog

**Files:** Create `server/events/planetPairConjunctions.ts`; modify `shared/nightsky/events.ts`, `server/events/catalog.ts`, `tests/events/catalog.test.ts` and `tests/events/planetAlignments.test.ts` (already registered).

**Interfaces:** Produce `findPlanetPairConjunctions(start:number,end:number,source:SourceRecord): {events:SkyEvent[],coverage:PlanetPairCoverage}` and an exported pure numerical screening entry point for injected synthetic angle signals. Export `PlanetPairCoverage` and the exact strict optional metadata from the spec. Author tests before production changes so the red cycle is visible; schema, adapter and catalog are one reviewable deliverable.

- [x] Write synthetic tests for ascending/descending/wrapped/opposite roots, two close roots, exact tangency/near-miss, grid disagreement, nonfinite signal and budget exhaustion. Assert unresolved candidates are not dated events and arbitrary grids do not produce available completeness.
- [x] Add the two admitted PAGASA cases: select Venus/Jupiter pair metadata and assert `abs(Date.parse(peakUtc)-Date.parse(referenceUtc)) <= 60*60_000`, with no closest-angle assertion. Run `node --import tsx --test tests/events/planetAlignments.test.ts` and record RED before production edits.
- [x] Implement the fixed RA convention, smooth signal/discriminator, both crossing directions, canonical grids/stationary screening, one-to-one reconciliation and explicit bounds from the spec. Cache shared samples only within annual computation and bounded final annual inventories only across calls. Stable IDs include method, canonical pair and canonical instant.
- [x] Run the same focused suite to GREEN. If a reference fails, investigate definition/provenance; do not widen its envelope. Report measured warm/cold query cost and actual bounded evaluation count.

**Schema/catalog steps within Task 1:** Existing event enums/tool counts remain unchanged.

- [x] Write failing schema tests: valid pair metadata; invalid reversed/duplicate/unsupported bodies, missing instant, visibility/duration misuse, metadata on wrong event type, unknown fields; legacy solar payload remains valid.
- [x] Write failing catalog tests for default discovery, partial empty results, 2025/2027 boundaries, pair out-of-range with supported legacy solar events, mixed Moon/unsupported classes, and shared final truncation. Existing alignment-only assertions must explicitly identify legacy rows rather than accidentally testing pair names as solar alignments.
- [x] Implement schemas and integrate the separate adapter only when `planetary-conjunction` is requested. Preserve other horizons/statuses; emit distinct RA definition, unsupported closest approach, uncertified completeness and bounded unresolved evidence.
- [x] Run `node --import tsx --test tests/events/*.test.ts tests/mcp/initialize.test.ts`; inspect all failures, then rerun to GREEN. No changes to test registration.

### Task 2: Planning and skill exposure

**Files:** Parent modifies `tests/planning/optional-event-evidence.test.ts`, `server/mcp/registerTools.ts`, `docs/product/workflows/plan-sky-event.md`, `plugins/nightsky/skills/plan-sky-event/SKILL.md`; update admission/handoff records in `docs/operations`.

**Interfaces:** Existing `search_sky_events` and aggregate planner; no new MCP tool. The planner retains positive sourced pair evidence with unknown sky-event impact.

- [x] Add a failing real-catalog positive pair composed-plan test before production exposure updates; assert pair metadata and `localVisibility === 'not-evaluated'`, with unknown sky-event impact.
- [x] Explain the RA convention, all-pair/2025–2027 engineering bound, separate solar/elongation definitions, partial completeness and local visibility in MCP and canonical/exposed guidance. Do not edit generated packaged references.
- [x] Run focused planner/skill/MCP checks and package verification; require source-fact/science review and separate code/contract review of the actual diff, then address findings.

### Task 3: Delivery verification

**Files:** Parent updates the operations handoff; no shared status accounting change.

- [x] Run `npm run check`, the affected event/planner/MCP suite, `npm test`, `npm run build:plugin`, `npm run plugin:package`, `node --import tsx scripts/verify-local-plugin-packages.ts`, local doc-link and whitespace checks after implementation/review stabilizes.
- [ ] Record fresh counts, source comparison limits/qualifications, numerical coverage limits, budgets/performance and review outcomes. Commit reviewed code separately from earlier matrix/fixture deliveries; push this branch and watch exact-tip six-job CI.
- [ ] Hand off exact SHA/CI and remaining partial-coverage/meteor gates. Do not merge/rebase/integrate another branch or mark V1 complete.

Execution method is the user's already authorized existing subagent implementation with independent science/code review. No new permission gate is introduced for routine implementation choices in this bounded existing-scope task.
