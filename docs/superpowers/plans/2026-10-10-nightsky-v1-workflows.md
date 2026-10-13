# NightSky.earth V1 Planning Workflows and Website Plan

> **Historical work-package notes:** Use [the V1 execution plan](2026-10-10-nightsky-v1-execution-ready.md) as the sole implementation checklist. Website entry-page, plan-share, and calendar-file tasks below are superseded and are not V1 launch work.

**Goal:** Turn the core MCP data into clear, activity-aware plans for the user's night, learning, equipment and practical preparation.

**Architecture:** Keep recommendations and activity decision logic in a deterministic planning/content layer, then let each host's model present the structured result. V1 returns the plan in the assistant conversation. Website discovery/design is a separate workstream that may proceed in parallel with plugin V1.

**Tech stack:** Existing TypeScript/React/Vite/Express/Zod and Node test runner. Use existing Wouter routing and UI components. Keep calendar and share generation client-side and add no account or location-history storage.

**Spec:** [Product scope](../../product-scope-v1-v3.md). This plan depends on [core service contracts](2026-10-10-nightsky-v1-core-service.md) and follows the [master plan](2026-10-10-nightsky-v1-implementation-reviewed.md).

## Global constraints

- Each activity uses its own relevant factors; do not collapse weather or sky conditions into an unexplained universal score.
- Keep source, valid time, time zone, data class, missing data and uncertainty in every user-visible plan.
- Offer learning tied to the chosen place/date and user gear. Settings are starting points only when supplied equipment supports them.
- No guarantees of site access, safety, horizon, seeing, transparency or successful photographs.
- No accounts, server-side plan saving, automatic reminders or interactive map.

## Review focus

- Beginner and expert plans use different target explanations and factors.
- Meteor, astrophotography, eclipse, aurora and telescope plans include their specific visibility inputs.
- Partial weather or unsupported data leads to an honest useful plan, not a generic failure or guess.
- A shared plan URL does not reveal exact coordinates by default.
- Calendar times are correct across IANA zones and daylight-saving transitions.

## File responsibilities

| Path | Responsibility |
|---|---|
| server/nightsky/planner.ts | Compose core place, event, astronomy and provider services into a user-goal result. |
| server/nightsky/compare.ts | Compare user-selected places/nights with per-source values and activity factors. |
| server/content/learning.ts | Original cited learning guidance for beginner and first astrophotography journeys. |
| server/content/specialistTools.ts | Manually reviewed app/tool directory with platform, current pricing evidence and review date. |
| server/content/checklists.ts | Activity/weather/gear-aware packing and preparation content. |
| client/src/pages/Assistant.tsx | Product explanation and host-specific setup links. |
| client/src/pages/PlanShare.tsx | Read-only share page from user-chosen URL parameters. |
| client/src/App.tsx and client/src/components/Navigation.tsx | Route and link the product page and share page into the existing website. |
| client/src/lib/calendar.ts | Local iCalendar generation. |
| tests/nightsky/ and tests/content/ | Deterministic scenario/content checks using core service fixtures. |

## Tasks

### Task 1: Define plan and comparison contracts from the journey matrix

**Files:** Add planning and comparison schemas in shared/nightsky/planning.ts; create tests/nightsky/planning-contracts.test.ts.

- [ ] Write schema tests for activity type, named place/date range, optional target/experience/equipment, multiple forecasts, source gaps, calendar export and selected-option comparison.
- [ ] Define PlanObservingSessionInput with activity, either a resolved PlaceRef or placeQuery, TimeWindow, optional TargetRef, skillLevel, equipment and userConstraints. Activity is one of beginner_stargazing, family_education, urban_stargazing, meteor_shower, astrophotography, deep_sky_imaging, visual_telescope, planetary_moon, aurora, eclipse, seasonal_trip or replan.
- [ ] Define PlanResult with status, activity, place, window, summary, candidateWindows[{startUtc,endUtc,localStart,localEnd,rationale,factors}], events, forecasts, factors, sources, caveats and followUpQuestions. Each factor has name, value, units, sourceRef or calculated marker, validAt and availability; there is no universal score.
- [ ] Define CompareOptionsInput as activity plus up to five user-selected place/window pairs; CompareOptionsResult returns every option, its source records, differences, missing data and activity-specific explanations.
- [ ] Define optional export payloads: a calendar payload with title/startUtc/endUtc/timeZone/locationLabel, and a versioned share snapshot with createdAt/placeLabel/activity/window/summary/factors/events/source summaries. Exact coordinates are omitted unless explicitly opted in.
- [ ] Implement the schemas and preserve source-specific weather rather than calculating a provider winner.
- [ ] Run the contract tests and npm run check.

### Task 2: Implement the beginner, family and urban observing plan

**Files:** Create server/nightsky/planner.ts; create tests/nightsky/planner.test.ts; register plan_observing_session in server/mcp.

**Interface:** planObservingSession(input: PlanObservingSessionInput): Promise<PlanResult> resolves place, darkness, Moon, easy target visibility, available forecast sources and preparation context for these activities. It asks follow-up questions only for missing inputs that change the answer.

- [ ] Write scenario fixtures for a casual beginner tonight, a family/educator one-hour session, an urban observer who stays near home, ambiguous place and no host location.
- [ ] Implement activity-specific data assembly and a partial-result state that identifies unavailable fields while preserving valid calculations.
- [ ] Verify unsupported source/event states remain explicit and that no result claims a location is safe/open or an exposure will succeed.
- [ ] Run planner tests and one MCP Inspector call for each of these activity types.

### Task 3: Implement meteor, eclipse and aurora event plans

**Files:** Extend server/nightsky/planner.ts; create tests/nightsky/event-plans.test.ts; register or extend plan_observing_session.

- [ ] Write independent fixtures for meteor shower, eclipse, aurora, event below horizon, stale aurora feed and unavailable forecast.
- [ ] For meteor plans, include local shower activity/peak, radiant altitude, darkness, Moon and hourly conditions; label ZHR as idealized.
- [ ] For eclipse plans, include local contacts and above-horizon visibility; include an authoritative solar eye-safety source.
- [ ] For aurora plans, keep SWPC forecast/observations separate from darkness and weather; never make a binary sighting guarantee.
- [ ] Run the event-plan tests and verify partial results retain the event timeline.

### Task 4: Implement astrophotography and telescope plans

**Files:** Extend server/nightsky/planner.ts; create tests/nightsky/photography-plans.test.ts and tests/nightsky/telescope-plans.test.ts.

- [ ] Write cases for first Milky Way photo, Galactic Center window, user-supplied camera/lens/tripod, deep-sky target list and visual telescope session.
- [ ] Use target altitude/azimuth, darkness, Moon separation and available cloud/wind/dew/aerosol fields appropriate to the stated activity.
- [ ] Omit seeing, transparency, horizon, camera compatibility and exposure claims when supporting inputs/data are unavailable.
- [ ] Run tests and verify gear-specific starting settings appear only when the user supplied enough equipment context.

### Task 5: Implement side-by-side options and months-ahead planning

**Files:** Create server/nightsky/compare.ts and tests/nightsky/compare.test.ts; extend tests/nightsky/planner.test.ts.

- [ ] Test two source feeds with conflicting values and different valid times; both must remain separately visible.
- [ ] Test comparisons where one place/date lacks a forecast or event window; show the gap rather than drop the option.
- [ ] Implement compareObservingOptions(input: CompareOptionsInput): Promise<CompareOptionsResult> for a small user-selected set of dates/places, explaining activity-specific trade-offs from underlying values.
- [ ] Test planning beyond the forecast horizon; include ERA5 only as historical context and prompt for a later forecast recheck.
- [ ] Run tests and verify output preserves source links, local times and unavailable values.

### Task 6: Add learning and guided astrophotography content

**Files:** Create server/content/learning.ts and tests/content/learning.test.ts.

- [ ] Write cases for beginner sky orientation, 2–3 visible targets and a first phone/DSLR/tripod photo session.
- [ ] Create concise original guidance with citations to reusable learning sources; keep explanations tied to place/date and hemisphere.
- [ ] Require camera/lens/support inputs before giving gear-specific starting settings; explain adjustment after a test frame.
- [ ] Run tests for claims, citation presence and missing-gear follow-up behavior.

### Task 7: Add specialist app suggestions

**Files:** Create server/content/specialistTools.ts, data/content/specialist-tools.json and tests/content/specialistTools.test.ts; register recommend_specialist_tools.

- [ ] Add reviewed app records with platform, purpose, activity fit, pricing label only when verified, source URL and lastReviewed date.
- [ ] Test no stale price claim, no platform claim without a current source, and a short relevant list for astronomy, astrophotography and aurora.
- [ ] Run content tests and provide the source review procedure.

### Task 8: Add activity-aware outing checklists and navigation handoff

**Files:** Create server/content/checklists.ts and tests/content/checklists.test.ts.

- [ ] Write checklist fixtures for cold/wind/dew, meteor watching, telescope observing, camera session and family outing; keep gear inputs optional.
- [ ] Use only supported forecast fields and explain when conditions are unavailable.
- [ ] Include an external directions link only; do not provide a drive-time or road-safety promise.
- [ ] Run checklist tests for unsupported conditions and partial weather.

### Task 9: Generate a local calendar file

**Files:** Create client/src/lib/calendar.ts and tests/client/calendar.test.ts.

- [ ] Verify how the local ChatGPT test surface handles an assistant-generated calendar artifact. Keep the website download route as the dependable file path; the assistant may also present the calendar payload or link when its host supports it.
- [ ] Test event/window serialization, UTC timestamps, local event display, daylight-saving boundaries, escaping and missing optional location.
- [ ] Generate the .ics download in the browser from the calendar payload on the PlanShare route; do not store or send it to a server.
- [ ] Run tests and manually inspect a generated file in at least one calendar app.

### Task 10: Add private-by-default plan sharing

**Files:** Create client/src/pages/PlanShare.tsx and tests/client/plan-share.test.ts; add route in client/src/App.tsx.

- [ ] Test a link with no coordinates, a link with explicit coordinate inclusion, malformed input, unsupported data and payloads larger than the URL limit.
- [ ] Build a read-only snapshot URL from the plan's versioned share payload; exact coordinates are omitted unless the user explicitly opts in. Show creation time and source issue/retrieval times so viewers know it is a snapshot.
- [ ] Limit the encoded payload to 6 KB. If it exceeds the limit, explain that a link cannot be created; do not silently remove provenance or caveats.
- [ ] Keep all shared parameters in the URL/client and do not add server persistence or tracking identifiers.
- [ ] Verify the page displays source/vintage and limitations from the original plan and offers a fresh-plan link separately.

### Task 11: Add the assistant-first website entry page and update stale product copy

**Files:** Create client/src/pages/Assistant.tsx; modify client/src/App.tsx, client/src/components/Navigation.tsx, README.md and relevant home-page copy; add privacy, terms and support URLs/pages in the platform plan.

- [ ] Trace current landing-page content and keep existing site routes working.
- [ ] Build a responsive information page explaining the planning use cases, free data/source policy, limits and per-platform connection steps. Reuse design_guidelines.md, Navigation and existing accessible UI patterns.
- [ ] Provide clear ChatGPT-first setup and tested Claude/Gemini availability; do not show a working-install claim for an unverified route.
- [ ] Keep the page free of an interactive map and account/permission requirements.
- [ ] Update README's old premium/community product description and local setup steps to match the assistant-first V1.
- [ ] Update navigation/home copy so existing Community and Experiences pages are not described as capabilities of the V1 planner.
- [ ] Verify keyboard use, mobile layout, accessible names and route/navigation behavior in a browser.

## Workflow acceptance

- Every launch-required row in the product-scope journey matrix has a fixture in Task 2 or a documented unsupported/partial fallback.
- Outputs are useful when called directly without a skill and when a skill guides tool sequencing.
- Beginner explanations, app recommendations, calendar output and link sharing have explicit source/privacy boundaries.
- Run npm test, npm run check and npm run build after the final integrated workflow task.
