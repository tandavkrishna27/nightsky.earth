# Offline journey readiness

The local execution-ready Tasks 10A and 10B are ready for closure after the aggregate suite includes the new MCP fixture and passes. Their original acceptance concerns deterministic orchestration and comparison, with optional candidate/history and source coverage gates explicitly separate. This document does not claim global coverage, host review, deployment, live forecasts for every location, or historical acquisition completion.

## Executable journey mapping

All rows execute through the real local Streamable HTTP MCP route in `tests/mcp/offline-journeys.test.ts`: initialize, resolve the named destination, then call `plan_observing_session`. Sydney exercises southern guidance; London exercises urban/bright targets; Tromso exercises aurora unknown states. External provider fetches are rejected, aurora/history are fixture failures, and candidate lookup is explicitly absent. The fixture adds a summer polar check and a five-option comparison with an absent future forecast.

| Product journey | New MCP assertion | Existing deeper fixture |
|---|---|---|
| Casual sky gazer | 1–3 supported visible suggestions | `journey-completion.test.ts` automatic supported targets |
| Curious beginner | NASA/ESO source, Southern Hemisphere guidance | `tests/content/learning.test.ts` |
| Family / educator | Family timed preparation | automatic target/timed steps |
| Urban observer | Jupiter geometry evidence | `astronomy.test.ts` target altitude/azimuth |
| Meteor-shower watcher | Bounded radiant samples or explicit gaps | meteor/radiant tests; planner radiant fallback |
| Milky Way photographer | Supported core target evidence | both-hemisphere season astronomy test |
| First astrophotography learner | Gear details requested, seeing unknown | cited learning guidance and gear-boundary content tests |
| Visual telescope observer | Supported Jupiter geometry | planner Saturn visibility window |
| Deep-sky imager | M31 unsupported catalog gap | planner target failure and missing catalog |
| Planet / Moon observer | Moon target geometry | Moon candidate windows use horizon geometry |
| Aurora chaser | Failed enabled provider is an explicit gap | NOAA region/horizon tests |
| Eclipse / event observer | ISO eye safety preparation | independent NASA Dallas contacts/visibility reference |
| Months-ahead traveler | Missing history and future forecast explicit | climate tests; historical context planner case |
| Re-planning after change | Fresh issue time and cloud 12→85 retained | comparison exact per-option evidence |
| Mobility/access needs | Unknown access plus verification gap | OSM/location context source boundaries |

## Acceptance audit and fixes

An enabled candidate, historical-context, aurora, or site-context service could fail while the planner described it as disabled/unsupported or silently omitted the gap. A regression first failed on the candidate factor; the fix now describes enabled-service failures as unavailable, adds explicit gaps, and preserves valid astronomy and other evidence. Nonavailable candidate and aurora responses also record their supplied reason. No provider exception detail is exposed.

Existing comparison tests cover all five named Task 10B cases, preserve every selected option, and avoid a universal score. Added conflict coverage asserts two native values (12% and 90%), different sample valid times, different source issue times, and separately visible factors. The existing four-provider, 48-sample, five-option fixtures preserve exact native evidence within the byte budget; a separate test rejects evidence above the budget explicitly. The five-option MCP check retains an option with no future weather forecast. Existing independent astronomical reference tests cover polar summer/winter, target constraints, contacts, and both-hemisphere seasons.

Focused verification: `npx tsx --test tests/mcp/offline-journeys.test.ts tests/nightsky/*.test.ts` passed 120 tests, zero failed. Root integration must add the new test to `tests/all.test.ts` and run the full suite and type check before recording final acceptance.

## Remaining limits belong to separate gates

Meteor full activity seasons and full-season radiant coverage are unavailable; bounded fit extrapolation is labeled. Deep-sky targets outside the reviewed catalog remain unsupported. Continuous Moon-above-horizon constraints, seeing/transparency forecasts, detailed imaging sequences and equipment compatibility remain explicit limits. Optional candidate records do not establish public/night access, accessibility, safety or horizon clearance. Historical-context coverage depends on a reviewed local artifact; absent history is not a forecast. These do not block the original local Tasks 10A/10B acceptance, but prevent claiming all global product data coverage complete. Manual assistant-host tests and submission review remain separate platform tickets.

## Integration-owner verification

The new suites are included in the aggregate and verification scripts in tool type checking. Frozen Windows aggregate: 431 discovered/430 passed/one permission skip; clean Linux: 431 discovered/424 passed/seven artifact/platform skips; zero failures. Fourteen OSM and forty-six ERA5 Python tests passed on both. Type checks, package/review/build/audit/runtime checks and fresh-process artifact rollback passed. Current rehearsal ZIP SHA256: `eb3cecd7b0cd48bad63830c5dce7b52e9fcce9fedf27547add183724bc245cde`; the earlier rehearsal digest above is historical. Actual Inspector listed/called the compiled resolver-only endpoint; it does not establish ChatGPT/Codex/Claude/Gemini account compatibility. Current GitHub acceptance is recorded after push/observation. No deployment or historical downloads.

## Fixture isolation correction

An exploratory run reached the default NOAA adapter before its fixture override was added. The harness was corrected to inject the unavailable aurora fixture and a rejecting external fetcher. Frozen acceptance runs use those overrides and make no external provider requests. The exploratory request is not acceptance evidence or a historical download; no CDS/account operation occurred.
