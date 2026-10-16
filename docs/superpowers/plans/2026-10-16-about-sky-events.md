# About and Sky Events implementation plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans for implementation in this session, or superpowers:subagent-driven-development if the user selects delegation. This document is a proposal; no product implementation is authorized by this planning-only turn.

**Goal:** Create a compelling About story and a useful, sourced Sky Events calendar with honest timezone behavior and one shared event collection.

**Architecture:** About is an independent visual/content change. Calendar uses shared pure domain functions and a reviewed, bundled editorial catalogue; React renders month/list views using one preference context. Extend existing shared routing/build policy so server, client, static redirects and sitemap agree.

**Tech stack:** Existing React/TypeScript, Wouter, Intl.DateTimeFormat, CSS, Node test runner and Playwright; existing Zod available for validation. No new dependencies unless an implementation finding proves necessary and is recorded.

**Spec:** ../specs/2026-10-16-about-sky-events-design.md. Exact proposed About copy, timing rules, UI text and acceptance conditions live there.

## Global constraints

- Website worktree only. Do not inspect or modify the plugin or depend on its runtime/data.
- Preserve entrance/music, Collective, Resources, News, source/legal gates and primary ChatGPT availability behavior.
- Curated global event calendar; timezone conversion is not a local-visibility calculation.
- Exact instants/intervals require verified UTC; approximate dates retain source dates and their visible basis.
- Canonical paths /sky-events and /sky-events/:id; year-specific occurrence IDs. Top navigation remains unchanged.
- No CMS, geolocation, account, notifications, remote runtime calendar fetch, exports/subscriptions, or fabricated event data.
- Use the existing app test/build scripts. New unit files are discovered automatically by scripts/run-unit-tests.mjs.
- Remain local/noindex. No deployment, push, merge, or plugin coordination as part of execution.

## Review focus

1. Crossing local midnight changes exact event date and month, but never invents a time for an approximate peak.
2. DST and timezone aliases work even with blocked preference storage or invalid URL state.
3. Dense days, long titles, zero results and unreviewed months remain understandable at 320px and with keyboard navigation.
4. A passed meteor peak with continuing activity cannot appear as the next peak or obscure the next real upcoming event.
5. Existing meteor links, detail 404s and sitemap entries remain consistent between app, Express and generated static host rules.

## File boundaries

New shared/skyEvents.ts: discriminated domain types and record validation. New shared/skyEventTime.ts: pure timezone/date functions. New shared/skyEventQueries.ts: calendar projection and highlights. New shared/skyEventRoutes.ts: URL state and legacy destinations. New shared/skyEventCatalog.ts: real reviewed occurrence data and coverage manifest; imported by build/server/client. New client/src/content/aboutCopy.ts: About narrative. New client/src/components/sky-events/: CalendarPreferences.tsx, CalendarControls.tsx, MonthCalendar.tsx, EventList.tsx, EventCard.tsx, UpcomingEvents.tsx. New client/src/pages/SkyEvents.tsx and SkyEventDetail.tsx. New CSS files client/src/styles/about.css and sky-events.css imported by their pages. Integrate existing Home, Footer, App, About, website.ts, websiteBuild.ts, server/routes.ts and scripts/build-website.ts. Retain meteor legacy source files until compatibility tests confirm routing; avoid unrelated deletion/refactors.

## Shared contracts (locked before implementation)

`EventCategory = 'meteor-showers' | 'eclipses' | 'moon' | 'planets'`.

`EventTiming = {kind:'instant';atUtc:string;label:string;sourceId:string} | {kind:'interval';startUtc:string;endUtcExclusive:string;label:string;sourceId:string} | {kind:'approximate';startDate:string;endDateInclusive:string;basis:'UTC'|'source-calendar';basisLabel:string;label:string;sourceId:string}`.

`EventSource = {id:string;title:string;url:string;sourceTimeScale:string;conversionNote?:string}`. `SkyEvent = {id:string;title:string;category:EventCategory;synopsis:string;timing:EventTiming;activity?:EventTiming;visibility:string;equipment:string;sections:readonly {heading:string;body:string}[];question:string;sources:readonly EventSource[];lastReviewedAt:string;reviewStatus:'draft'|'reviewed'|'withdrawn'}`. Only source-reviewed UTC-normalized timing may use instant/interval. Validation rejects calendar dates that do not round-trip; timestamps require explicit Z and minute-or-better precision; formats are stored to verified precision and never displayed with invented seconds.

`CalendarState = {month:string;category:EventCategory|'all';view:'month'|'list';tz:string}`. Supported navigation years 1900–2100, not restricted to catalogue coverage. `ProjectedEvent = {event:SkyEvent;dateKeys:readonly string[];timingText:string;phase:'upcoming'|'ongoing'|'past';marker:'primary'|'activity'|'both';sortKey:string}`. Projection returns one per occurrence for a requested month; per-date marker must be derived from primary/activity date membership, not reused blindly from the month-level marker.

`CoverageMonth = {month:string;reviewedAt:string;scope:string}`. Coverage denotes editorial review of selected events, never completeness. Month labels/categories have centralized text mappings. Legacy IDs remain from existing meteorContent.ts.

### Task 1: About narrative and visual treatment

**Files:** client/src/pages/About.tsx; new client/src/content/aboutCopy.ts and styles/about.css; remove obsolete About-only export in websiteCopy.ts if unused; tests/browser/about.spec.ts.

**Interfaces:** consumes existing SEO, PluginAction and PageShell; produces unchanged /about route with seven sections from the spec.

- [ ] Write browser assertions for one H1 “Where Earth Looks Up”, plugin/first ChatGPT wording, sources and Collective links, no fabricated decade/expedition claims, no membership form, no horizontal overflow at 320/640/1440. Run `npx playwright test tests/browser/about.spec.ts`; expected FAIL against existing title/layout.
- [ ] Implement exact spec copy and dedicated image-led composition using existing assets, appropriate alt text and semantic headings. Keep motion restrained and optional. No changes to common editorial pages.
- [ ] Run the targeted browser test and `npm run check`; expected pass. Inspect desktop/mobile screenshot composition and all links, then commit `feat: tell the NightSky story on About`.

### Task 2: Time/domain engine and calendar projection

**Files:** new shared/skyEvents.ts, skyEventTime.ts, skyEventQueries.ts; tests/unit/sky-event-time.test.ts and sky-event-queries.test.ts.

**Interfaces:** `validateSkyEvents(records:unknown): SkyEvent[]` throws actionable record errors; `isSupportedZone(zone:string):boolean`; `dateKeyAt(utc:string,zone:string):string`; `resolveZone(url:string|null,saved:string|null,detected:string|null):string`; `monthCells(month:string): readonly {date:string;inMonth:boolean}[]`; `projectMonth(events:readonly SkyEvent[],month:string,zone:string,now:Date):ProjectedEvent[]`; `nextSkyEvents(events:readonly SkyEvent[],zone:string,now:Date,count:number):ProjectedEvent[]`. nextSkyEvents includes an occurrence’s current relevant date/window even if outside the current month and never emits drafts/withdrawals.

- [ ] Add failing unit cases: synthetic 2026-11-10T20:00Z is 2026-11-11 in Asia/Kolkata; negative offset crosses into previous month/year; Asia/Kathmandu quarter-hour zone; New York March/November DST transition instants; leap day 2028; midnight-exclusive interval excludes following day; approximate range unchanged by timezone. Assert invalid dates/timestamps/source links/unknown sourceId and duplicate IDs reject, non-UTC source scale cannot silently become UTC, bad zone falls back to UTC, supported aliases accepted. Run `npm run test:unit`; expected failures for missing modules/contracts.
- [ ] Implement pure functions with injected now and Intl formatToParts. Gregorian date-only calendar arithmetic uses date components, not display-string parsing or host-local midnight. Generate full Monday-start weeks, clip event spans to requested month, deduplicate activity+peak per occurrence/day. Enforce safe year bounds.
- [ ] Add cases for future primary vs ongoing activity ordering, past peak label, past-only exclusion from next list but inclusion in historical month, counts <=3, dense same-day deterministic ordering, whole-catalogue empty. Upcoming comparison uses instants or source-basis dates as appropriate; activity metadata is never used as a replacement predicted peak.
- [ ] Run all unit tests; expected pass. Commit `feat: model sky event timing and calendar projection`.

### Task 3: Source-backed catalogue and coverage

**Files:** new shared/skyEventCatalog.ts; scripts/validate-sky-events.ts; docs/website/sky-events-editorial-guide.md; docs/website/sky-events-source-audit.md; package.json validation script; tests/unit/sky-event-catalog.test.ts.

**Interfaces:** exports `skyEvents:readonly SkyEvent[]`, `coverageMonths:readonly CoverageMonth[]`; `validateCoverage(months:readonly CoverageMonth[],now:Date):string[]` returns missing current-through-next-eleven UTC calendar months. UTC defines research scope only, not visitor event placement. Build consumes catalogue in Task 6. Validate imported data at build, not on every render.

- [ ] Test source-required publication, unsupported source time scales, coverage manifest duplicates/invalid months, missing research months, draft exclusion, zero/sparse valid selection, and source review dates no later than injected now. Run unit tests; expected new-contract failures.
- [ ] Research current month plus eleven months from implementation date using primary sources. Record timing statement, scale, source URL, access/review date, broad visibility, and any unresolved disagreement per occurrence. NASA/IMO discovery links from spec are starting points; open actual relevant source material before adding a reviewed record. Write original guide text. Do not turn the old 2025/2026 arrays into new facts without review. No event quota; explicitly document months with no selected events after review.
- [ ] Add records and coverage manifest. Keep incomplete/unverified drafts private. Run `npm run validate:sky-events` (implemented as `tsx scripts/validate-sky-events.ts`) and unit tests; expected no malformed published records, and coverage completeness report. Missing research means task incomplete, not permission to claim finished. Preview can render reviewed subset; release adds feature-specific coverage blockers.
- [ ] Commit `content: curate reviewed sky events and document maintenance` once the task’s research acceptance is met.

### Task 4: Calendar state, preferences and controls

**Files:** new shared/skyEventRoutes.ts; components/sky-events/CalendarPreferences.tsx, CalendarControls.tsx; App.tsx; pages/SupportingPages.tsx (privacy preference disclosure); tests/unit/sky-event-state.test.ts; tests/browser/sky-event-state.spec.ts.

**Interfaces:** `parseCalendarState(search:string,defaults:CalendarState):CalendarState`; `calendarHref(state:CalendarState,baseSearch?:string):string`; context exposes `{tz,view,setTz,setView,resetZone}` and catches storage failures. Calendar URL controls override effective context while on calendar; explicit user selection updates URL+context. useLocation/useSearch drives history restoration. Provide search+labelled native select for timezone choice, not an untested custom combobox. `tz=UTC` is valid.

- [ ] Unit tests cover strict month/year bounds, invalid categories/view/zones, malformed URL encoding, preserved unrelated parameters, one decode/encode, URL precedence and aliases. Browser tests cover initial detection, manual override, reset, storage throwing, missing supportedValuesOf, history back/forward and persistence when navigating Home. Run relevant suites; expected fail before implementation.
- [ ] Implement URL-first state and preference context above routes without remounting music. Native controls include Previous/Next/Today, month/year selector, category and view; expose disabled year-bound buttons. Zone search changes results without history spam. Insert supported saved/browser alias in options even if not in enumeration. Header offset labelled as month-start; individual events format their own offset. UTC fallback has visible notice.
- [ ] Use lazy initial default month/view; resizing does not override explicit choices. Now refresh on focus/visibility and one minute timer; clean up on unmount. Tests fake clock over midnight and DST; inspect no duplicate listeners. `Today` uses selected zone, retains category/view.
- [ ] Update the draft privacy page to describe timezone/view preferences as local to this browser, including reset behavior; do not assert that existing server logs or other collection is absent. Browser test verifies disclosure and that resetting timezone removes its override without clearing unrelated stored values. Existing publication approvals remain required.
- [ ] Run unit and targeted browser tests plus check/check:tests; expected pass. Commit `feat: add timezone-aware calendar controls`.

### Task 5: Calendar, list, highlights and event guides

**Files:** new pages/SkyEvents.tsx, SkyEventDetail.tsx; components/sky-events/MonthCalendar.tsx, EventList.tsx, EventCard.tsx, UpcomingEvents.tsx; styles/sky-events.css; tests/browser/sky-events.spec.ts.

**Interfaces:** `UpcomingEvents({events,now,tz})` uses Task 2 nextSkyEvents and EventCard; `MonthCalendar({items,month,tz})`, `EventList({items,tz})` consume shared projected items; no duplicate timing conversion in presentation components. SkyEventDetail reads catalogue by exact occurrence ID. Back link accepts only valid canonical calendar state, never arbitrary external return URL.

- [ ] Browser fixtures with frozen time test grid/list equivalence, positive/negative timezone date relocation, approximate-date badges, current-day and category text, dense-day +N expansion focus, long titles, 320px page reflow, keyboard operation, direct detail reload, invalid ID, empty filtered/month/unreviewed states and past event labels. Fixtures are test-only via intercepted/injected provider, never production catalogue flags. Run; expected fail while pages absent.
- [ ] Implement page order and copy from spec. Desktop grid/mobile list defaults, simple table semantics, bounded internal overflow if mobile grid explicitly chosen. Upcoming cards remain clearly all categories. Detail shows original explanations, visibility limits, preparation, primary/activity timing, source/review date and contextual example question. Copy button reports clipboard failure; install CTA obeys existing release status. Eclipse preparation includes event-appropriate source-backed viewing safety, without unrelated generic warnings.
- [ ] Inspect screenshots with real content plus dense/long fixtures, 375/1440 viewports and reduced motion. Check image failure, link contrast, focus visibility and music continuation. Run targeted browser tests; expected pass. Commit `feat: browse sky events and source-backed guides`.

### Task 6: Homepage, compatibility and publication outputs

**Files:** Home.tsx, Footer.tsx, App.tsx, shared/website.ts, websiteBuild.ts, server/routes.ts, scripts/build-website.ts, MeteorShowerDetail.tsx; tests/unit/site-build.test.ts; tests/browser/site.spec.ts and host-routing.spec.ts; existing meteor tests where contract changes.

**Interfaces:** extend buildWebsiteOutputs input to consume `events:readonly SkyEvent[]` and `coverageMonths:readonly CoverageMonth[]` instead of emitting new meteor-detail URLs from reviewedMeteors. Keep legacyMeteorIds for archive routing only. `classifyPath(path:string)` imports same reviewed catalogue and exact legacy redirect map; query-independent path classification plus explicit redirect destinations. All caller changes in same task. Reuse current build release flag and factual gates unchanged, adding feature content validation and coverage blockers.

- [ ] Write tests for /sky-events 200, reviewed detail 200, unknown/draft detail 404, legacy index one-hop 301 to /sky-events?category=meteor-showers, known meteor archives 200/noindex, Experiences 410, release sitemap only reviewed canonical IDs, no query/draft/withdrawn/archive entries. Existing preview build remains noindex. Pure coverage tests use synthetic complete manifests, never mutate live operator facts. Run; expected fail on old routing.
- [ ] Mount index/detail routes before generic fallbacks; preserve all existing shell routes. Replace Home text-only meteor callout with shared three highlights and “Next in the night sky”; empty state links to calendar/resources. Footer Meteor Showers → Sky Events; no top navigation expansion. Resource links can lead to filtered calendar without changing Resource category semantics.
- [ ] Update client Redirect fallbacks, Express redirect handlers, classifyPath and generated Netlify rules to the same destinations, before SPA fallback. Retain old meteor details as noindex archives; update their action to new filtered calendar. Ensure build/server sitemap inputs use catalogue once and draft IDs never get rewrite entries. Production-shaped Express test plus generated-rule assertions; actual Netlify behavior not claimed without emulator/live verification.
- [ ] Run `npm run check`, `npm run check:tests`, `npm run test:unit`, `npm run build`, `npm run test:browser`, `npm run test:host`. Expected all pass; `npm run build:release` still rejects unresolved existing publication facts and any new incomplete event coverage. Commit `feat: integrate Sky Events across website routes and home`.

### Task 7: Final content, design and regression review

**Files:** docs/website/about-sky-events-verification.md; screenshots within docs/website; fix files only as justified by findings.

**Interfaces:** consumes all preceding tasks and the complete spec. No new feature scope.

- [ ] Read rendered About from beginning to end: understandable product, no invented history, balanced emotional/practical content, no repeated Collective copy. Audit every public event timing/visibility claim against its cited source and source-audit record. Catalogue research gaps remain explicit blockers, never silently marked complete.
- [ ] Verify homepage/calendar timezone consistency, source-basis exceptions, midnight rollover, back/forward, invalid preferences, loading/media failure, dense months and one music element across navigation. Capture desktop/mobile About, month/list calendar, empty month and event detail.
- [ ] Request one fresh-context code/design review of the implementation under requesting-code-review; review calendar domain, source audit and routing, not plugin. Reproduce/fix material findings in one test-backed pass; record remaining limitations honestly. Run appropriate full checks after functional fixes.
- [ ] Leave existing local preview available and open About/Sky Events. Report completed scope, evidence, coverage dates and remaining publication blockers. No merge/push/deploy without a separate request.

## Planning self-review

Coverage: About→Task 1; timezone/precision→2+4; reviewed events/maintenance→3; views/detail/accessibility→5; Home/legacy/sitemap→6; content/design regression→7. Interfaces: only Task 6 changes build signatures, with every caller named; one event schema and projection feed all surfaces. Risk tests are assigned to Tasks 2/4/5/6. Research precedes publishing real cards; UI may be built against synthetic test fixtures while research is incomplete, never show fixtures to visitors. No implementation task is completed by this document.

Review corrections incorporated: same-data calendar and Home; global maximum vs local circumstances; aliases and DST; source timescale; date-only preservation; ongoing activity vs future peak; no empty-calendar fake completeness; one-hop legacy redirects; preview indexability unchanged; explicit device-only storage declaration update included in verification if new preferences are implemented. Full findings in docs/website/about-sky-events-plan-review.md.
