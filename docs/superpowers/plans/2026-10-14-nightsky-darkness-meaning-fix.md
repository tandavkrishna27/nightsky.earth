# Requested-window darkness correction

> Execute with subagents, test-first regressions and a focused code review. Broad acceptance audit stays deferred by the owner.

Goal: close the concrete Task5/10A Hanle meaning defect, with source/version/interval attribution intact.

## Approved scope and design

Owner approved the next wave correcting astronomy and planner meanings, testing locally, pushing and observing CI. No new data downloads, provider/model requests, installation/upload, accounts, deployment, website or database work.

This is a pre-publication structured-output correction. Replace misleading polarState with required darknessState enum full-window / partial-window / none / unknown. Classify only the requested window using the existing clipped calculated intervals: one interval covers complete window =>full-window; zero intervals =>none; otherwise=>partial-window. Do not infer geographic polar night/day or an unrequested24-hour solar condition.

Replace twilightIntervals with solarThresholdIntervals. Each row retains kind civil / nautical / astronomical and UTC/local endpoints, and adds sunAltitudeThresholdDegrees exactly -6 / -12 / -18 with a schema consistency refinement. Descriptions and calculation caveats say nested Sun-below-threshold intervals, clipped to requested window, not exclusive twilight phases. Existing library, threshold calculations, sampled geometric horizon and target conventions remain scoped to their current evidence. No new true-geographic polar-classification service.

This changes private pre-release JSON fields, not tool names/inputs. All checked-in callers/fixtures/schema references must migrate; legacy keys must be absent in fresh responses and rejected by strict output schema. Owner approval to correct meanings is the binding scope; exact field names are a routine implementation choice recorded here.

## Parallel ownership

| Lane | Owns | Consumes/produces |
|---|---|---|
| Astronomy | server/nightsky/astronomy.ts, shared/nightsky/astronomy.ts; tests/nightsky/astronomy.test.ts, reference-horizon.test.ts, tests/shared/contracts.test.ts | getAstronomyWindow returns new darknessState / solarThresholdIntervals with exact threshold annotation; no polarState/twilightIntervals. |
| Planner | server/nightsky/planner.ts; tests/nightsky/planner.test.ts,compare.test.ts; tests/mcp/offline-journeys.test.ts | Uses agreed new fields; requested-session language and conditional factors; no geographic polar claims. Await astronomy implementation for final integrated tests. |
| Focused reviewer | read-only source/tests/plan | Review semantics, boundary intervals, payload contract and existing-case preservation. No broad27-ticket audit. |
| Root | tests/mcp/darkness-meaning.test.ts, tests/all.test.ts; workflow/skill reference refresh, pending-authoring guard, status/ticket closure, CI/commit/push | Actual transport lists new schema and returns corrected Hanle plan; verifies source calculations, fixture failure gaps and current original acceptance. |

## Regression requirements

- Hanle15October2026 20:00–00:00 local: full-window, all three nested threshold intervals can span session; no polar classification. Expanded24h Hanle: partial-window with bounded astronomy/night endpoints.
- Equatorial and mid-latitude daylight subwindows: none; ordinary full-dark subwindows: full-window. No latitude-based special casing.
- Existing Arctic/Antarctic summer/winter cases: none/full-window where calculated; no loss of returned dark intervals or source attribution.
- Partial windows, UTC/local/fractional offset and DST conversions remain correct; preserve fixed authoritative reference tolerances and current horizon limitations.
- Threshold kind/numeric mismatch rejected, legacy-only fields rejected; schema descriptions carry requested-window/nested/clipped meanings.
- Planner beginner, photography, meteor, no-darkness, unavailable/unknown, comparison and all15offline journeys: factors describe supplied session state, no Polar factor or polar-night/day assertion from shortwindow. Unknown weather/access/history preserved.
- Actual MCP initialize/list/resolve/astronomy/plan path: new schema fields and strict corrected structured result, no provider attempts; direct and composed interval agreement.

## Sequence

- [x] Astronomy lane writes failing regressions, observes RED, implements schema/calculation migration and focused GREEN.
- [x] Planner lane writes failing regressions, observes RED, implements state/factor/fixture migration and focused GREEN after astronomy dependency ready.
- [x] Root adds actual MCP regression and source/skill/workflow contract refresh; removes stale pending-field authoring assertions but keeps installed-model gate deferred.
- [x] Focused review, fix any actionable findings; no broad audit.
- [x] Fresh full Node/tests/types/public+localpackages/8reviewsets/build/runtimes and meaningful Hanle original-defect checks.
- [x] Close only5.C4/10A.C3/C5 if evidence passes; restore12Done/9Partial/6NotStarted, groups6/10/3 and160boxes92checked68open. Hosted/model/source gates remain.
- [ ] Scoped commit/push existing codex/plugin-v1 branch and observe all six exact-head CI jobs; record evidence.

## Decision record

Ruling: remove private pre-release geographic-looking fields instead of keeping a misleading compatibility alias; no installed/released plugin has been accepted. All repository fixtures and package guidance migrate together. Schema/result correctness is checked without claiming a model followed it; further installed-plugin/model testing remains deferred as requested.
