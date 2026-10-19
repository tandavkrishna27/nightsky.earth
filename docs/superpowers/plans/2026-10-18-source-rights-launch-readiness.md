# Source and Rights Launch Readiness Plan

> **For agentic workers:** Use this plan task-by-task; keep unrelated existing worktree edits intact.

**Goal:** Remove unsupported meteor-date reuse from the public website calendar and record actionable source conditions for the currently free NightSky service.

**Architecture:** The website calendar will use the admitted, year-specific NASA MEO peak instants only, with the source precision and scope stated in each event. The source register and plugin operations record will distinguish provider access from data-license permission, preserve OSM lineage, and keep uncertain providers out of public activation.

**Tech Stack:** TypeScript/React, Node test runner, Markdown source and release records.

**Spec:** User approved the research recommendations in this conversation; NASA MEO admitted source records and official provider terms are the evidence.

## Global Constraints

- Preserve all unrelated uncommitted worktree changes.
- Do not alter credentials, provider accounts, hosting, or deploy anything.
- Do not imply that the free user-facing product has no license conditions.
- Do not present meteor maxima as activity intervals, visual rates, or local visibility guarantees.

## Review Focus

- Calendar rows must match exact report maxima and omit non-admitted AMS-derived ranges.
- Source attribution must retain report vintage and minute-precision UT caveat.
- 7Timer noncommercial limitation must remain explicit.
- OSM attribution and possible ODbL offer/share-alike obligations must not be reduced to attribution alone.
- OpenWeather license fit must remain a release gate; WeatherAPI trial status must not be called Free before verified transition.

### Task 1: Replace AMS meteor ranges with admitted NASA MEO peaks

**Files:** `shared/skyEventCatalog.ts`, `shared/skyEventCoverage.ts`, `tests/fixtures/major-event-evidence.json`, `tests/unit/major-events.test.ts`, `docs/website/sky-events-source-audit.md`, `docs/website/source-and-rights-register.md`, `client/src/content/releaseFacts.ts`

- [x] Update tests to require exact NASA MEO UT peak instants for the eight non-daytime 2026–2027 showers in the covered window and to reject AMS runtime sources/date ranges.
- [x] Remove unsupported AMS-derived shower entries and required IDs; preserve unrelated events and existing reviewed work.
- [x] Replace the source audit and release register disposition with the NASA MEO peak-only boundary.
- [x] Run focused tests and website build.

### Task 2: Record provider and OSM operating decisions

**Files:** Plugin `docs/operations/data-sources.md`, `docs/operations/weather-provider-admission.md`; website `docs/website/source-and-rights-register.md`, privacy source facts if required.

- [x] Record 7Timer as free noncommercial use only, with operator notification and a review-before-monetization gate.
- [x] Record WeatherAPI's documented trial-to-Free date and its actual Free limits/attribution; verify account transition remains pending.
- [x] Keep OpenWeather disabled from public admission until written license clarification for the exact Free product and proprietary plugin distribution.
- [x] Record OSM index attribution, lineage, and a concrete machine-readable ODbL fulfillment path; keep publication gated until actual artifact and legal classification are confirmed.
- [x] Run the relevant documentation/source tests and inspect the complete diff.
