# NightSky.earth V1 Execution Plan

> **For agentic workers:** Use `superpowers:executing-plans` or `superpowers:subagent-driven-development` when the owner chooses an execution approach. Follow the [task sequence and dependency map](2026-10-12-nightsky-v1-sequence-and-dependency-map.md): complete prerequisites, work within the developer-ready packets, and parallelize only isolated lanes with stable interfaces. Do not deploy, submit, or publish without the owner’s explicit authorization.

**Goal:** Build the free, assistant-first NightSky.earth V1 so a person can find source-linked candidate observing places, choose a suitable time for their activity, understand what they may see, inspect the sky and weather evidence, and prepare for the outing.

**Architecture:** Keep the existing React/Vite website as the current public site and build the planning capability as a shared, read-only TypeScript MCP service. Expose focused tools and activity-specific guidance through one remote MCP endpoint; retain separate provider records, local astronomy calculations, explicit coverage gaps, and partial results. A website/map workstream may proceed in parallel, with its own scope and implementation plan; it is not part of or a dependency for plugin V1.

**V1 persistence decision (owner-confirmed 11 October 2026):** Do not add or operate a database for the NightSky plugin service. Store no accounts, saved plans, personal history, or query history. Use request-time provider calls, short-lived in-process caches that may clear on restart, local calculations, and small versioned read-only data files where required. Data files are not a database: they are replaced as complete artifacts and contain no user state. If a required catalog cannot be served safely from a compact file on the selected host, defer that capability or return an explicit partial/unsupported result; do not silently introduce PostgreSQL, SQLite, or another database. Existing website dependencies/configuration are not changed merely by this plugin decision.

**Tech stack:** Node.js 24 LTS baseline; existing TypeScript 5.6, Express 4, React 18, Vite 5, Zod 3, and `tsx`; evaluate the current stable MCP TypeScript SDK v2 packages (`@modelcontextprotocol/server` and the Express adapter) and their runtime requirements in Task 1. The v2 SDK expects Standard Schema-compatible schemas such as Zod v4; test the `zod/v4` subpath against the current app before changing existing Zod 3 consumers. Use `node:test` through `tsx` with fixture-backed tests. Verify all runtime/library combinations in the Windows/Linux CI matrix before deployment.

**Spec:** [Product scope V1–V3](../../product-scope-v1-v3.md). The earlier [core service](2026-10-10-nightsky-v1-core-service.md), [user workflows](2026-10-10-nightsky-v1-workflows.md), and [platform launch](2026-10-10-nightsky-v1-platform-launch.md) files are historical work-package notes; this document is the only execution checklist.

## Global Constraints

- The service is free to users and has no required paid data/API dependency. Hosting and data processing still cost money; the proposed $25/month recurring pilot ceiling and a separate one-off data-build budget are owner decisions to confirm before paid processing or production-host selection.
- Keep forecasts, observations, calculated astronomy, and historical climatology separate and label each with source and valid time.
- Never merge forecast models into one forecast or hide source disagreement. Explain activity-specific trade-offs with the underlying values visible.
- Public place records are candidates. They do not prove current access, night opening, safety, parking, accessibility, or a clear horizon.
- Do not use a noncommercial-only dataset unless its owner grants product-use permission. Publicly viewable social-media content is not automatically reusable.
- Do not request precise GPS/address input, social-media authorization, personal location history, spot submissions, or a community feed in V1. A host may supply optional location metadata; use it only for an explicit “near me” request, treat it as sensitive, and discard it after the request.
- Keep candidate-place discovery and full night planning in the assistant/plugin V1. The plugin does not include an interactive website map or redesign; those can proceed in a separately scoped parallel website workstream and are not a plugin-launch dependency.
- Use a permanent production MCP hostname/URL for the OpenAI package and a separate staging hostname for developer-mode checks. Freeze the full production URL before creating the real draft; never create a scratch plugin on the production hostname. The current OpenAI app-review page says an endpoint-path change can use a new version, while the current submission page says changing an existing MCP server URL is unsupported in the update flow; keep the full URL fixed unless OpenAI support clarifies the conflict.
- Test ChatGPT first, then Codex, Claude, and the feasible Gemini route. Claim support only for paths actually tested.
- A public OpenAI remote-MCP listing requires HTTPS website, privacy-policy, terms-of-service, and support URLs. The existing product site can supply the website URL; the other pages and a monitored support path must be ready before submission.
- Global availability is a goal, not a coverage guarantee. State measured data coverage and country/region gaps for each source and feature.
- The plugin service has no persistent database in V1. Provider caching is in process and bounded; cache loss on restart is acceptable. Named-place and other static reference data may be shipped as versioned files. Bulk data preparation runs off the serving request path; if its output cannot be served as a compact file within measured memory/disk limits, defer that feature rather than add a database.
- Store one host-neutral set of workflow guidance, then package or adapt it separately for each assistant. MCP tool compatibility does not imply that skills or instructions transfer unchanged.

## Review Focus

- Place ambiguity or missing host location must ask the user to clarify; never infer coordinates silently. If the user supplies coordinate-shaped text, ask for a named destination and never convert/reverse-geocode those coordinates into a place name.
- DST changes, UTC/local conversion, and polar dates must produce correct local times or an explicit no-darkness state.
- Missing, stale, malformed, throttled, or timed-out providers must produce a useful partial result with the missing source identified.
- A historical average must never be described as a specific-night forecast or clear-sky probability.
- Candidate-site records must not imply verified access, darkness, or safety when the source does not establish those facts.

## File Map

| Path | Responsibility |
|---|---|
| `shared/nightsky/` | MCP-facing input/output schemas and inferred types. Keep separate from the existing website/database schemas until compatibility is proven. |
| `server/mcp/` | MCP server construction, tool registrations, transport and protocol error handling. |
| `server/nightsky/` | Place/time/astronomy/planning domain logic and orchestration. |
| `server/places/` | Place resolution, product-managed candidate index and source links. |
| `server/events/` and `data/events/` | Versioned predictable-event catalogs and provenance. |
| `server/providers/` | Isolated weather, aurora, and historical-climate adapters. |
| `plugins/nightsky/` | Portable OpenAI plugin package, MCP configuration and five workflow skills. |
| `docs/product/workflows/` | Canonical host-neutral workflow guidance used to produce the per-host skill packages. |
| `docs/platforms/` | Host-specific setup, submission and compatibility records for ChatGPT/Codex, Claude and Gemini. |
| `tests/` | Offline contract, domain, provider, protocol and workflow scenario tests. |
| `docs/operations/` | Source rights, data spikes, host decision, privacy, provider operations and pilot measurement. |
| `client/src/pages/Privacy.tsx`, `Terms.tsx`, `Support.tsx` | Public policy and monitored support destinations required for remote-MCP directory submission. These do not define or block the separately scoped website workstream. |
| `client/src/App.tsx` | Keep existing routes; add and publish the required policy/support routes without redesigning the current product experience. |

## Execution Tasks

There are 19 numbered task groups (0–18). Groups 3, 4, 7, 10, 11, and 12 include independently reviewable lettered tasks; Task 0 contains six separately passable preflight gates.

For the complete per-task dependency order, parallel lanes, Task 0 gate breakdown, and Mermaid map, see the [V1 sequence and dependency map](2026-10-12-nightsky-v1-sequence-and-dependency-map.md). This companion map explains ordering; the task descriptions below remain the source for implementation steps and acceptance criteria.

## Delivery groups

These groups organize deliverables by capability, not by execution order. Follow the dependency-aware sequence below. A capability may be marked partial/unsupported when its data or provider gate fails; it must not block the core planner unless it blocks the shared MCP service itself.

| Group | Tasks | Deliverable and user experience | Gate / boundary |
|---|---|---|---|
| A. Decide and prove the foundation | 0–1 | Minimum source-rights/runtime decisions and a local MCP endpoint the developer can inspect. | Optional scale/data spikes and exact host setup are separate gates; local implementation does not wait on them. Hetzner is the hosting direction. No database is added. |
| B. Define and expose the service | 2–3 | Stable structured tool contracts and read-only `/mcp`; local assistant client can list and call tools. | Keep endpoint stateless; no account, database, saved plan, or query history. |
| C. Resolve places and calculate the sky | 4–6 | Named city resolution, local time, Sun/Moon/planet windows, target visibility, and supported sky events. | Compact GeoNames/event files only; explicit unsupported event classes. |
| D. Add live conditions | 7A–7B | Source-labeled forecast and short-range aurora data, with useful partial answers when providers fail. | API calls at request time; bounded in-memory cache; no durable response cache required. GEFS remains optional. |
| E. Add place discovery and historical context only if they fit | 8–9 | Candidate public places and/or months-ahead historical context, if lawful data can be prebuilt and served as versioned flat files on the chosen host. | Off-host build only. No database or separate data service in V1. If compact artifact size, memory, refresh, license, or quality checks fail, expose explicit partial/unsupported status and defer the feature. |
| F. Make complete journeys | 10A–11C | Activity-aware plans, optional comparisons, learning and astrophotography guidance, checklists, app suggestions, and host-specific workflow instructions. | The core plan uses named-place input and Tasks 4–7A; candidate search and climatology stay optional. Preserve sources, missing data, and activity-specific trade-offs; no invented universal score. |
| G. Prepare and launch | 12A–17 | Platform compatibility, public policies, Hetzner staging/production deployment, review package, owner-authorized submission, and pilot evidence. | Cross-platform support is claimed per tested route. Submission and publishing remain distinct owner-authorized steps. |
| H. Separate website work | 18 | Independent website/map scope and discovery. | Runs in parallel only when intentionally started; does not expand plugin scope by default. |

The first local end-to-end milestone is Groups B–D plus Task 10A: the assistant resolves a named place, combines local time/astronomy and supported event data with at least one live forecast, and returns an activity-aware plan. This can be exercised before spot-index feasibility is decided. Candidate search can be enabled later from Group E without changing the basic MCP architecture.

## Dependency-aware implementation sequence

Task numbers identify deliverables; this sequence identifies execution order. Optional source work must not hold up the core journey. A task may be marked partial with an explicit user-facing gap when its optional source gate does not pass.

| Sequence | Plan tasks | Work and exit condition | Blocking rule |
|---|---|---|---|
| 0. Reconcile baseline | Status audit; Task 3 regression item and data-flow note | Fix the known active-request counter leak on the 429 path, add regression coverage, and correct stale data-flow wording. Re-run local checks. | Required before hosted exposure. |
| 1. Close minimum local gates | Task 0A for enabled sources; Tasks 1–2 | Record rights for sources the baseline actually calls; prove local SDK/transport and freeze source-neutral contracts. OSM, ERA5, VIIRS, and GEFS decisions stay in their own capability gates. | Optional source research does not block local work. |
| 2. Complete service foundation | Tasks 3, 4, 5, 6, 7A, 7B | Finish stateless MCP, place/time resolution, local sky calculations, supported events, and at least one forecast path, keeping source labels and gaps. | A source without cleared rights remains disabled/unsupported. |
| 3. Deliver core planning journey | Task 10A, then Tasks 10B, 11A, 11B, 11C | Compose implemented place, astronomy/event, and live conditions into activity-aware plans; add comparisons, learning, preparation/app guidance, and host-specific workflow instructions. | Task 10A must work without candidate search or climatology; optional inputs return partial/unsupported states. |
| 4. Decide optional data capabilities | Tasks 0B–0E, 8, 9 | Run needed source/scale spikes. If approved and measured artifacts fit the no-database host, build and test them; otherwise document unsupported behavior. | Never block the local core journey or add a database to rescue scale. |
| 5. Prove assistant/platform compatibility | Tasks 3B, 3C, 4B, 12A, 12B | After host and publisher prerequisites are settled, establish staging, verify publisher and permanent URL, scan the real minimal OpenAI draft, package the tools, and test each assistant route. | Hosted work waits for exact hostnames, approved spend, publisher identity, and privacy/log controls. |
| 6. Prepare release and pilot | Tasks 13–17 | Complete policy/support content and jurisdiction review; operate staging, promote the reviewed build, prepare the listing artifact, obtain separate submission/publish authorization, then measure the invited pilot. | No production deployment, submission, or publication before its gates and owner authorization. |
| 7. Website work | Task 18 | Scope and plan the website/map separately when intentionally started. | Independent of plugin release. |

Within each sequence, independent work may proceed in parallel when it does not share files or prerequisites. The minimum local V1 journey is: named place → local time/astronomy and supported event information → source-labeled forecast → activity-aware plan with caveats and preparation. It does not require candidate search, historical climate, comparisons, a public host, or a website map.

For an evidence-based snapshot of implemented work and current checks, see [implementation status](../../operations/implementation-status.md). Update that audit as task acceptance criteria are met; do not infer completion from files existing or from the plan checkboxes alone.

### Task 0: Complete independent source, scale, and hosting gates

**Files:** Create `docs/operations/data-sources.md`, `docs/operations/source-spikes.md`, and `docs/operations/host-decision.md`.

**Consumes:** Product source inventory and the user’s confirmed free-to-user/free-data boundary. Before any paid cloud processing or production-host commitment, confirm both a recurring pilot ceiling and a separate one-off data-build budget; the proposed $25/month is not spending authorization.

**Produces:** A source disposition register plus separately reviewable measurements and decisions. These are preflight outputs, not one implementation task; no product code is required.

**Gate 0A — Source rights register (`docs/operations/data-sources.md`):** Record each exact product/dataset, license, attribution, allowed storage/derivation, geographic coverage, update cadence, request limits, operating work, and fallback. Include astronomy-library license/reference cases, eclipse elements/ΔT source, meteor-calendar reuse terms, multilingual gazetteer, timezone boundaries, and official dark-sky/land-manager sources. Record World Atlas's noncommercial restriction and that VIIRS radiance is not direct astronomical sky brightness. For OSM-derived data, classify the database relationship under ODbL and document attribution, any applicable share-alike terms, and whether a derived-database offer/publication obligation applies before ingest or publication. **Pass:** every required V1 journey has a permitted source path or an explicit unsupported/partial behavior.

**Gate 0B — OSM scale spike (`docs/operations/source-spikes.md`):** Measure one selected country/region extract as a data-build job separate from the small shared Hetzner runtime (initial target 2 vCPU/4 GB). Record source file size, object count, filtered rows, index size, build duration and machine, query p50/p95, one-off processing cost, refresh cost, and a labeled global-scale estimate. Do not download/import planet data or run a bulk build on the production request path. Produce a versioned artifact with checksum, vintage, ODbL metadata and coverage manifest; measure whether serving/loading it fits the runtime with safe memory/disk headroom. **Pass:** repeatable evidence supports the intended global baseline within the owner-approved operating/build budget. If it does not, named-place resolution can remain global, but candidate-search coverage must be reported by region and the owner must approve the narrower claim before public submission. The MCP/API service can launch without a global OSM index; candidate search remains unavailable/partial until this gate passes.

**Gate 0C — ERA5 access and statistic spike (`docs/operations/source-spikes.md`):** Retrieve a small monthly-means-by-hour sample. Record variable, coverage, resolution, size, aggregation, processing/storage estimate, registration/access requirements, retrieval limits, and known reanalysis/grid limitations relevant to the user claim. Use only statistics the product actually supplies; do not derive percentiles from a multi-year mean. **Pass:** a lawful, explainable and affordable historical-context result is specified, or months-ahead climatology is marked unsupported for the launch.

**Gate 0D — Forecast source spike (`docs/operations/source-spikes.md`):** Sample MET Norway at globally distributed coordinates and record available/missing cloud, dew point, wind and other fields by horizon. For NOAA GEFS, record decoder feasibility, issue/valid-time alignment, units, ensemble spread, caching, and operating work. Check NOAA SWPC product shape, issue/valid intervals, attribution and latitude coverage at representative locations. **Pass:** baseline forecast and aurora behavior and missing fields are documented; GEFS is either ready against explicit criteria or remains a non-blocking optional source.

**Gate 0E — Darkness-context proxy spike (`docs/operations/source-spikes.md`):** Evaluate whether NASA Black Marble/VIIRS or another permitted source can provide a useful, globally available relative ground-light-radiance context for text candidate discovery. Record exact product, license, vintage, coverage/resolution, processing, and a representative sample; distinguish emitted ground radiance from astronomical sky brightness and validate any low/medium/high bins before use. **Pass:** either specify a cautiously labeled regional radiance proxy for `get_location_context`, or explicitly leave darkness unknown and do not rank candidates as dark. This gate does not permit a Bortle/SQM or “dark sky” claim.

**Gate 0F — Hosting decision (`docs/operations/host-decision.md`):** Hetzner is the chosen hosting direction, but local implementation does not depend on purchasing or configuring a host. Before staging, select the exact Node-capable plan/region and owner-approved operating ceiling; record the separate staging hostname and permanent production hostname/full MCP URL, deploy/rollback method, cost basis, request-control design, and application/edge log redaction and retention. The existing Netlify configuration publishes `dist/public` as a static site and does not run Express. **Pass for hosted work:** these decisions are recorded; Task 3C verifies and freezes the production URL. No purchase or paid build is implied by this plan.

- [ ] Close each gate with its evidence and named decision. A failed gate blocks only the dependent capability unless it prevents the baseline MCP endpoint; record the user-facing partial/unsupported behavior before continuing. Do not incur paid build or hosting costs until the owner approves the applicable budget.

### Task 1: Prove SDK, runtime, schema, and HTTP compatibility

**Files:** Modify `package.json` and `package-lock.json`; create `docs/operations/mcp-sdk-compatibility.md` and a disposable test under `tests/mcp/transport-smoke.test.ts`.

**Consumes:** Local runtime constraints, the current `server/index.ts` middleware order, and only source-shape findings needed for the minimal smoke tool. Host-specific tests follow owner selection of a host. Gates 0B, 0C, and 0E (OSM, ERA5, VIIRS) and optional GEFS work in 0D do not block this local proof.

**Produces:** A pinned SDK/runtime decision and a minimal MCP endpoint proof. Prefer the current stable v2 SDK packages; do not use the legacy `@modelcontextprotocol/sdk` name without documenting why.

- [x] Verify the selected SDK v2 version’s Node requirement and Express 4 compatibility. Test `@modelcontextprotocol/server` with the official Express integration or the Node transport wrapper.
- [x] If using the Express adapter, test Host-header validation with a test hostname and reject unexpected Host values. Recheck the exact allowlist and reverse-proxy configuration after Task 0F selects staging and production hostnames.
- [x] Test Zod compatibility without changing `shared/schema.ts`: update Zod to a compatible 3.25+ release and import MCP schemas from `zod/v4`, or document and test a smaller equivalent boundary. Do not migrate existing database schemas unless the compatibility test proves it necessary.
- [x] Exercise one `initialize`, `tools/list`, valid `tools/call`, invalid input, and concurrent stateless requests against the selected transport.
- [x] Confirm the Express JSON/urlencoded middleware in `server/index.ts` does not consume `/mcp` request bodies before the SDK handles them. Mount the MCP route before the parser or explicitly bypass the parser for that route.
- [x] Record package versions, Node version, transport mode, route-parser handling, and the reason for the chosen integration in `docs/operations/mcp-sdk-compatibility.md`.
- [x] Pass when `tests/mcp/transport-smoke.test.ts` passes and MCP Inspector can initialize and list the smoke tool at the local route without affecting `/api/news` or the website. Do not block this local proof on production-host or recurring-budget selection.

### Task 2: Define stable structured contracts and the offline test harness

**Files:** Create `shared/nightsky/common.ts`, `places.ts`, `astronomy.ts`, `weather.ts`, `events.ts`, `planning.ts`, `index.ts`, `docs/operations/tool-contracts.md`, `tests/all.test.ts`, `tests/shared/contracts.test.ts`, and `.github/workflows/nightsky-v1-checks.yml`; add an `npm test` script to `package.json`.

**Consumes:** Task 1’s schema-library decision and product tool inventory. Define source-neutral optional result slots for forecast, aurora, candidate places, and historical context. Freeze fields and claims for an external source only after its applicable rights/shape gate passes. Gate 0C is required only if climatology is enabled; Gates 0B/0E only if candidate discovery is enabled.

**Produces:** `PlaceRef`, `TimeWindow`, `SourceRecord`, `Availability`, `WeatherForecast`, `AstronomyWindowResult`, `TargetVisibilityResult`, `EventResult`, `NightConditionsResult`, and `PlanResult` schemas and types. Every external value carries source/provenance and a data class.

- [x] Add tests named `rejectsInvalidCoordinatesInPlaceRecord`, `rejectsInvalidTimeWindow`, `resolvesTonightAcrossLocalMidnight`, `acceptsPartialWeatherWithMissingFields`, `preservesTwoForecastSources`, `rejectsHistoricalDataMarkedAsForecast`, `requiresProvenanceForExternalValues`, `rejectsOversizedComparison`, and `returnsAttributionInEveryResult`.
- [x] Define the shared minimum fields: model-visible `PlaceRef` carries a versioned ID, display name, time zone, provenance and index vintage; keep a user-named place's resolved latitude/longitude in a server-private `ResolvedPlace` record for calculations and provider calls. Public candidate records may expose their mapped coordinates and navigation links because the user needs them to identify and reach that public candidate; never echo coordinates derived from host location metadata as the user's exact location. `TimeWindow` carries UTC start/end plus IANA zone and a documented maximum query range; `SourceRecord` carries source name/link, model/product, issue/valid time, data class and vintage where available. Keep internal IDs and retrieval timestamps out of model-visible results unless they are needed for provenance or freshness decisions; justify each visible field in `tool-contracts.md`. Prefer provider issue/update and valid times; include a retrieval/check time only when the provider supplies no adequate freshness time and the user needs it, with the reason documented in `tool-contracts.md`. `Availability` distinguishes available/partial/stale/unavailable/not-covered/unknown/unsupported/out-of-horizon with a reason. Define locale-aware date/time and unit formatting; preserve source-name scripts where available, and do not promise translated source content that is not provided.
- [x] Define `WeatherForecast` as one source/model record containing time-stamped values, units, forecast lead and optional supported fields; include per-source missing-field reasons. `NightConditionsResult` is an array of forecasts, never an average.
- [x] Define `AstronomyWindowResult` with local twilight/darkness intervals and polar state; `TargetVisibilityResult` with target identity and rise/set/altitude/azimuth/Moon separation intervals; `EventResult` with event type, source/vintage, start/peak/end and local visibility state; `PlanResult` with goal, resolved place, requested window, concise summary, candidate windows, factors, sources, gaps, caveats and preparation.
- [x] Define tool-input contracts separately from output/domain types. `resolve_place` is the only resolver and accepts exactly one valid mode: a non-empty `placeQuery` for a named observing destination with the flag omitted or false, or `useApproximateHostLocation: true` with no `placeQuery`. Reject both active modes and reject neither mode. The true flag is the assistant's explicit invocation signal for a current-area request. Every other location-aware tool accepts only a versioned `placeId`. No tool schema requests latitude/longitude or a street address; reject coordinate-shaped `placeQuery` text on every route and ask for a named area instead. When the flag is true, use the host hint only for that resolution, return a named `PlaceRef`/`placeId`, never return the hint coordinates, and discard the hint after the request. If the hint is absent, return `availability: unavailable` with reason `host-location-unavailable` and ask for a named place; if the flag is absent/false, ignore host location metadata. On hosts without a documented location side channel, the flag must produce the same named-place request. `PlanObservingSessionInput` requires `placeId` and carries activity, date window, optional target/experience/equipment, locale and unit preference; `CompareOptionsInput` accepts up to five `placeId`/date/activity options.
- [x] Record per-source forecast horizons and per-field data classes. When forecast is out of horizon, the result must say “forecast not available yet” and may return historical context only as a separate result.
- [x] Set a measured structured-output size budget and per-tool result caps. Preserve provenance and caveats when trimming optional hourly detail; never silently truncate required source attribution.
- [x] Freeze the V1 tool names, descriptions, input/output fields, annotations, and result-size limits in `docs/operations/tool-contracts.md` before Task 3. Keep the current 12-tool inventory unless a feasibility finding requires an explicit owner decision.
- [x] Assert that two forecasts remain two distinct records, optional weather fields remain absent when the source lacks them, and `historical` cannot be relabeled as `forecast`.
- [x] Implement the schemas and an aggregate test entry point using `node:test` through the installed `tsx` runtime.
- [x] Add scripts `test`, `check`, and keep the existing `build`; ensure the test command is shell-independent on Windows and Linux.
- [x] Add a GitHub Actions matrix for Node.js 24 on Windows and Linux that runs `npm ci`, `npm test`, `npm run check`, and `npm run build`. On Linux, install `scripts/osm/requirements.txt` and run the OSM importer unit tests so the pinned `osmium` dependency is not silently skipped.
- [x] Pass when the CI matrix and a clean local install on both operating systems complete with zero failed tests; the contract output lists all named cases. If the project’s required GitHub Actions permissions or runner constraints are unavailable, document the equivalent reproducible CI gate.

Acceptance evidence: independent contract audit, Windows 394 passed/one permission skip, clean Linux 388 passed/seven scope skips, OSM6/ERA539 on both platforms, and all six CI jobs green at f521065 (run 38456841770). Source completeness and hosted acceptance belong to their separate tasks.

### Task 3: Implement the read-only MCP endpoint and tool registry

Closure 14 October 2026: original local acceptance independently audited and verified by current transport/Inspector, Windows/Linux suites and all six CI jobs at c20a381 (run38471282719). Source and hosted requirements remain in their owning tasks.

**Files:** Create `server/mcp/index.ts`, `server/mcp/registerTools.ts`, and `server/mcp/route.ts`; modify `server/index.ts` and `server/routes.ts` only for mounting; create `tests/mcp/initialize.test.ts`, `tool-metadata.test.ts`, and `route-body.test.ts`.

**Consumes:** Task 1 transport decision and Task 2 schemas.

**Produces:** `createNightSkyMcpServer(dependencies)` and `mountMcpRoute(app, dependencies)`; one Streamable HTTP endpoint at `/mcp`, a written data-flow/logging contract, and baseline abuse controls before any remote client is allowed to call it.

- [x] Ensure a request rejected by the rate-limit check never consumes an `activeRequests` slot, and every slot increment for an admitted request is released when its handler settles, including thrown-handler paths. Add a regression test proving rate-limited requests do not cause a later request to receive a false concurrency rejection.
- [x] Implement the registry boundary and smoke-test transport. Do not expose placeholder domain tools. Add each named tool in its owning task only after its handler and output schema pass.
- [x] For each registered tool, define Zod v4 `inputSchema` and `outputSchema`, a useful accurate description, explicit boolean `readOnlyHint`, `destructiveHint` and `openWorldHint`, and a brief rationale for the `openWorldHint` value. Do not determine `openWorldHint` only from whether the handler calls an external provider.
- [x] Set shared server instructions with the cross-tool limits in the first 512 characters: candidate places do not prove access/safety, history is not a forecast, forecast sources stay separate, missing inputs must remain unknown rather than guessed, and user-supplied coordinates must never be converted into a place name; ask for a named destination. Tell the assistant to set `useApproximateHostLocation` only when the user explicitly requests “near me” or their current area; otherwise it must provide a named destination. The server ignores host-location metadata unless this flag is true.
- [x] Return validated `structuredContent` plus concise text for the model. Test that output schemas validate the returned data and tool metadata contains no placeholder description or unsupported claim.
- [x] Represent valid-but-incomplete provider outcomes in structured results with an availability state and reason. Use protocol errors for invalid input or server faults; never include stack traces or secrets in user-visible error text.
- [x] Add route tests for `initialize`, `tools/list`, valid call, malformed JSON-RPC, invalid arguments, body-parser bypass, unexpected Host headers, required boolean annotations on every tool, and error responses without stack traces. Assert the `search_sky_events` annotation matches the live-JPL setting frozen in `tool-contracts.md`.
- [x] Define and test minimum exposure controls: source-specific timeouts, a shared cache interface with provider-approved TTLs, per-provider/global request and cost caps, bounded concurrency, and upstream backoff. Start with localhost-only access; do not expose staging until these controls and redacted logging are active.
- [x] Document the data-flow/log policy: by default, do not log full `placeQuery`, input arguments, request `_meta`, host location fields, anonymized subject/session IDs, or exact coordinates. For “near me,” the assistant must set `useApproximateHostLocation: true`; only then may the resolver use a documented host location hint in memory, return a named place, and discard the hint. If the flag is absent, ignore the hint. Use OpenAI's documented `openai/subject` only for short-lived per-user rate-limit counters on that route; do not retain raw identifiers in logs or build query histories. State operational-log and rate-counter retention; include source attribution in both `structuredContent` and concise text; maintain the complete host-metadata/upstream recipient list for the privacy page.
- [x] Keep `/api/news`, dynamic sitemap, Vite development middleware, and static website serving functional.
- [x] Pass when `npm test` passes route tests and MCP Inspector can list/call the smoke tool; malformed or oversized requests are bounded and safe, all annotations are explicit, and the server instructions begin with the required cross-tool limits.

### Task 3B: Check the hosted OpenAI connection early

**Files:** Create `docs/platforms/early-chatgpt-smoke.md` and extend `tests/platforms/host-matrix.md`.

**Consumes:** Task 0F's approved host and stable hostname, plus Task 3's protected, redacted, minimal MCP endpoint.

**Produces:** Early evidence that the selected SDK/transport and a minimal tool can connect through the planned OpenAI route, before the rest of the provider and event implementation is built.

- [ ] Use a separate staging hostname for the minimal smoke tool; do not expose provider-backed tools or user data yet. Define the actual access mechanism: use the current OpenAI connector egress allowlist where supported, keep local MCP Inspector access separate, apply strict request/size limits, and do not treat caller IP as user identity. If a client cannot reach an allowlisted staging host, record that route as untested instead of weakening the control.
- [ ] Check which ChatGPT developer/testing route is available to the intended account, then connect the smoke tool in a fresh ChatGPT session. Record date, account/region, negotiated protocol version, tool listing/call result, and limitations. Do not treat MCP Inspector success as a host connection test; test Codex in the environment that will actually call the service and record its network path separately.
- [ ] If the selected SDK version fails host interoperability, use Task 1's compatibility decision and a documented supported SDK fallback. Do not change either hostname after it is fixed in the package plan.
- [ ] Pass when the ChatGPT route completes the minimal call and Codex is either tested through its intended client path or explicitly marked pending; no claim is made for an inaccessible route. Full tool/package scans and workflow testing happen after the location resolver exists and again against production.

### Task 3C: Fix the OpenAI publisher and production endpoint before the real draft

**Files:** Create `docs/platforms/openai-publisher-and-domain.md` and update `docs/operations/host-decision.md`.

**Consumes:** Task 0F host/budget decision and Task 3B staging smoke.

**Produces:** Owner-confirmed publisher identity, eligible OpenAI organization/project, permanent production hostname and full MCP URL, and a separate staging hostname, ready before the first real package draft.

- [ ] Decide whether the verified publisher is an individual or business; verify the identity and the owner’s package-submission role before creating a plugin draft.
- [ ] Verify that the selected OpenAI organization/project has a residency configuration eligible for MCP plugin submission; current review guidance excludes EU data-residency projects. Keep this check before Task 4B.
- [ ] Verify and freeze the production HTTPS hostname/full `/mcp` URL and the separate staging hostname selected at Gate 0F. The plugin package and real draft use the production URL; staging is used only for developer-mode and pre-promotion checks.
- [ ] Confirm the production hostname can serve the exact `/.well-known/openai-apps-challenge` token path after the dashboard creates the token. Do not replace another plugin’s token at a shared challenge URL; select an eligible parent origin or a distinct hostname if needed.
- [ ] Pass when identity, project eligibility, the Gate 0F host choices, frozen full URL, publisher support contact owner, and challenge-host setup are recorded. Do not create a temporary or scratch plugin on the production hostname.

### Task 4: Implement global named-place resolution and record-based local time zones

**Scope accepted 14 October 2026:** owner approved the named-place timezone recommendation in the local-evidence wave. Coordinate-boundary lookup is deferred; previous exact wording remains in `docs/operations/v1-acceptance-audit.md` and Git history. No municipality-wide, arbitrary-point or candidate-local timezone accuracy is claimed.

**Files:** `server/places/geonames.ts`, `server/places/index.ts`, `server/nightsky/time.ts`, place/time/integration tests and source/license/runtime refresh documentation.

**Consumes:** Task2 `PlaceRef` and Task0 dataset/license decisions.

**Produces:** `resolvePlace(input): Promise<ResolvePlaceResult>`, `resolvePlaceTimeZone(placeId, index?): Promise<PlaceTimeZoneResult | undefined>`, and MCP `resolve_place`. Missing/unusable records require explicit recovery, not UTC substitution.

- [x] Retain original named-place, ambiguity, aliases, host-hint/privacy, malformed-row, stale-ID, coordinate-range and DST tests. Replace boundary membership with `resolvesIanaZoneFromNamedPlaceRecord`; verify unsupported/missing IDs and invalid zones without UTC substitution. Assert opposing civil dates across the date line, fractional offsets, two explicit UTC instants through a DST fold, named-city caveats, remote/cross-border approximate hints and rejection of candidate IDs for planning.
- [x] Build and document a versioned global gazetteer refresh carrying row-assigned IANA identifiers, source/checksum/vintage/attribution/error reporting. Document separate Node/ICU time-rule refresh and rollback. Preserve IDs downstream; no public Nominatim per keystroke.
- [x] Keep namespaced IDs, retired/incompatible-ID recovery, ambiguity and private-coordinate requirements. Subsequent tools use resolved place IDs rather than repeated names or coordinates.
- [x] Record GeoNames gazetteer and IANA/runtime-rule provenance/license obligations. Explicitly exclude timezone polygons/candidate-local assignment. Pass when mapped cases pass without UTC fallback and limitations are consistent. Production artifact installation and host capacity remain release gates.

### Task 4B: Scan the real OpenAI draft's location contract before adding the full tool set

**Files:** Create `docs/platforms/location-tool-scan.md` and update `tests/platforms/host-matrix.md`.

**Consumes:** Task 3B's staging connection proof, Task 3C's verified publisher/project/domain setup, Task 4's finished `resolve_place` tool, and the current official package/draft scan workflow.

**Produces:** An early automated-review result for the only OpenAI resolver, before other public tools are added around the same MCP server.

- [ ] Build the minimal production release with only the completed `resolve_place` handler after that same release passes staging MCP smoke, logging, and access-control checks. Before connecting the real draft or accepting scan/reviewer traffic, apply and verify production application and edge/reverse-proxy log redaction and bounded-retention settings using nonpersonal synthetic requests; record the evidence. If the host cannot meet the approved logging policy, return to Gate 0F before connecting the draft. Keep the production tool registry limited to `resolve_place` until Task 14 promotes the full V1 release.
- [ ] Create the actual branded OpenAI plugin draft with the final verified identity and permanent production MCP URL; include only the fully implemented `resolve_place` tool. Do not create a scratch plugin or use the staging URL in the package.
- [ ] After the dashboard issues the domain token, serve and verify the exact challenge on the production hostname, connect that endpoint, then run the earliest available tool scan. Keep the challenge, endpoint and publisher identity attached to this real draft.
- [x] Verify that `resolve_place` accepts exactly one of a named observing destination or `useApproximateHostLocation: true`; it rejects coordinate-shaped text on every route, ignores host hints when the flag is absent/false, and uses a documented host location hint only when the flag is true. If the hint is absent, it returns `availability: unavailable` with reason `host-location-unavailable` and asks for a named area. Test flag-without-hint, flag-with-hint, and hint-present-but-flag-false. Never persist the hint or return its coordinates.
- [ ] Record scan findings and dashboard prerequisites. If scanning is unavailable until later, preserve this same real draft and production URL, state the exact blocker, and run the one-tool scan at the earliest eligible point; do not create a second plugin or expand location-bearing fields. Any unresolved location-policy finding blocks tool expansion and submission until resolved.
- [ ] Pass when the real draft has a clean location-tool scan or a resolved, documented platform finding; the final Task 15 production scan remains required.

### Task 5: Implement deterministic astronomy and target windows

**Files:** Create `server/nightsky/astronomy.ts`, `tests/nightsky/astronomy.test.ts`, and the target catalog interfaces in `shared/nightsky/astronomy.ts`.

**Consumes:** Task 2 time/place contracts and Task 4 IANA local-time resolution.

**Produces:** `getAstronomyWindow(place, window)` and `getTargetVisibility(target, place, window)` with UTC instants and local display times; register MCP tools `get_astronomy_window` and `get_target_visibility`.

- [x] Test `calculatesTwilightAtEquatorialSite`, `calculatesTwilightAtMidLatitude`, `returnsNoAstronomicalDarknessDuringPolarSummer`, `returnsDarkWindowDuringPolarWinter`, `calculatesMoonPhaseAndAltitude`, `returnsTargetRiseSetAndAltAzSamples`, `calculatesMilkyWayCoreSeasonInBothHemispheres`, and `keepsUtcAndLocalTimesConsistentAcrossDst`.
- [x] Select and pin a maintained astronomy library only after license and date-range review. Store calculation/library version in source metadata.
- [x] Compare fixed reference cases with an authoritative ephemeris within a documented tolerance; document coordinate and time conventions.
- [x] Pass when `npm test` passes the named astronomy cases, high-latitude cases return explicit polar states, and both tools return schema-valid structured content in MCP calls.

### Task 6: Implement predictable events and supported target catalogs

Local progress 14 October 2026: thirteen original NASA maxima per year for 2025/2026, twelve bounded GMN radiant fits and planner aliases pass independent review. Full per-shower seasons and other-year/source gaps remain open; see `docs/operations/events-season-expansion.md`. The approved coverage/accuracy follow-up adds adaptive, model-conditional lunar horizon intervals and unresolved-grazing states; evidence in `docs/operations/event-accuracy-wave.md`.

**Files:** Create `server/events/catalog.ts`, versioned `data/events/*.json`, `data/targets/README.md`, and `tests/events/catalog.test.ts`; update `shared/meteorShowers.ts` only through backward-compatible exports.

**Consumes:** Task 4 place/time resolution and Task 5 astronomy calculations.

**Produces:** `searchSkyEvents(query)` and target resolution with local visibility state, source, and catalog vintage; register `search_sky_events` after its handler is complete.

- [ ] Test `findsMoonPhaseInRange`, `findsRecurringMeteorShower`, `calculatesEclipseLocalCircumstances`, `marksPartialEclipseBelowHorizon`, `marksEventBelowHorizon`, `returnsUnsupportedForUnmaintainedTransient`, `preservesCatalogSourceAndVintage`, and `listsV1UnsupportedEventClasses`.
- [ ] Audit the existing static 2025/2026 meteor records for source, time zone, peak interval, rates, reuse rights, and stale content. Keep website imports working while making the event catalog versioned and future-maintainable.
- [ ] Include calculated recurring events and selected, licensed targets. If Gate 0A approves live JPL Horizons/SBDB queries for selected dynamic comets/asteroids, `search_sky_events` reaches a public external source and must keep `openWorldHint: true`; if the live path is cut after Task 2, update `tool-contracts.md` and the annotation test in the same change, then set the final tool annotation to false before the package scan. Unavailable lookups return a linked partial result.
- [ ] Record the eclipse data source, ΔT/Earth-rotation model, terms and comparison tolerance; validate local circumstances against published reference cases. Document annual meteor-catalog refresh and provenance.
- [ ] Add a meteor-radiant source and model gate: establish redistribution rights for radiant coordinates, retain source/vintage, model radiant drift over each activity window, and test local altitude plus Moon-to-radiant separation. Until then, plans must return radiant visibility as unknown.
- [x] Explicitly list unsupported V1 classes and why: seeing/transparency forecasts (no validated V1 source), ISS/satellite passes (no maintained V1 pipeline), transient discoveries and faint-object catalogs (changing coverage/licensing/visibility work). Do not imply these are included.
- [x] Do not promise every transient discovery or locally visible event unless a maintained source and visibility calculation exist.
- [ ] Pass when `npm test` covers visible, partial, not-visible, unsupported, and no-current-source event states and `search_sky_events` returns validated structured content.

### Task 7A: Implement the short-range weather adapter

Closure 14 October 2026: original local acceptance independently audited and verified by current transport/Inspector, Windows/Linux suites and all six CI jobs at c20a381 (run38471282719). Source and hosted requirements remain in their owning tasks. `jittersScheduledRefreshes` is explicitly inapplicable: there is no scheduled-refresh daemon; demand-only expiry/304 behavior is tested. Introduce jitter tests if scheduling is later added.

**Files:** Create `server/providers/weather/types.ts`, `server/providers/weather/metNorway.ts`, and fixture tests under `tests/providers/weather/`.

**Consumes:** Task 0D source sample and Task 2 provenance/result contracts.

**Produces:** `WeatherProvider.getForecast(place, window)` with separate source/model records and the MCP tool `get_night_conditions`.

- [x] Test MET parsing with `mapsCloudAndWindFieldsWithUnits`, `keepsUnavailableFieldsMissing`, `preservesIssueAndValidTimes`, `marksStaleForecast`, `honorsExpiresBeforeRefresh`, `usesLastModifiedForConditionalFetch`, `roundsCoordinatesBeforeCacheAndRequest`, `returnsPartialOn429`, `returnsPartialOnTimeout`, `warnsOnDeprecated203Product`, `staysBelowApplicationWide20RequestsPerSecond`, `jittersScheduledRefreshes`, `rejectsMalformedPayload`, and `doesNotInventDewPoint`.
- [x] Send the required identifying User-Agent; honor `Expires` before refreshing and use the stored `Last-Modified` value with `If-Modified-Since`; round coordinates to the privacy-approved precision, never exceeding four decimals; use the shared cache with provider-approved TTLs. Enforce MET's 20 requests/second ceiling across the whole application, add jitter to scheduled refreshes, and surface HTTP 203 as a deprecation warning. Keep forecast source/model records separate. Do not call MET and ECMWF ensemble outputs independent confirmations where they share model guidance.
- [x] Add NightSky's planning value to the result: summarize each source's valid forecast steps inside the requested local astronomical-darkness interval, with Moon context and missing fields, while preserving the original source-specific forecast records. Do not return this tool as an unmodified third-party payload.
- [x] Test `returnsOutOfHorizonWithoutForecast` and confirm `get_night_conditions` indicates `out-of-horizon` instead of extrapolating weather.
- [x] Pass when `npm test` passes weather fixtures without network access and a real MCP call includes source, provider issue/update time when available, valid times, units, and missing fields. Include a retrieval/check time only when source timestamps do not give the user a usable freshness signal, and document why it is needed.
- [x] Keep NOAA GEFS a conditional enhancement behind Task 0D's decoder, time-alignment, operations, and budget criteria. If it is not ready, report the MET forecast and the unavailable second model honestly.

### Task 7B: Implement the short-horizon aurora adapter

**Files:** Create `server/providers/aurora/noaaSwpc.ts` and fixture tests under `tests/providers/aurora/`.

**Consumes:** Task 0A rights register, Task 2 provenance/result contracts, and local latitude/time handling from Tasks 4–5.

**Produces:** `getAuroraOutlook(place, window)` as a time-bounded space-weather outlook kept separate from cloud and darkness conditions; register `get_aurora_outlook`.

- [x] Test `returnsCurrentOutlookWithLatitudeContext`, `marksOutlookStale`, `reportsCoverageAtRequestedLatitude`, and `returnsUnavailableOnTimeout`; do not assume aurora is categorically impossible at low latitudes.
- [x] Preserve product issue time, valid interval, latitude/visibility limits, and source link. Explain the outlook for the user's selected location and align it to the planned night in Task 10A; keep cloud, darkness and Moon as separate evidence. Do not convert geomagnetic activity into a guaranteed sighting or act as a raw third-party pass-through.
- [x] Pass when `npm test` passes the named aurora cases and an MCP call shows the valid outlook and its limitations independently from weather.


### Task 8: Build source-linked text candidate-place discovery

Local progress 14 October 2026: 1,327 regional candidates plus a separate repeat-built 134-row Bhutan offline artifact; complete-way geometry, bounded Windows/Linux processing and cleanup verified. Global/relations/tile/public-offer/host gates remain open; see `docs/operations/offline-extract-wave.md`.

**Files:** Create `server/places/osmCandidates.ts`, `server/places/importOsm.ts`, `server/places/context.ts`, and tests `tests/places/osmCandidates.test.ts`, `importOsm.test.ts`, and `context.test.ts`.

**Consumes:** Task 0B OSM decision and Task 4 `PlaceRef`.

**Produces:** `searchObservingLocations(input)` returning candidate name/type, source ID/link, coordinates, distance estimate, dataset vintage, and explicit access evidence or `unknown`; register `search_observing_locations`. Add `getLocationContext(place)` and register `get_location_context` only with source-backed public context fields and explicit unknown values for unverified darkness/access.

- [x] Test `returnsOnlyAllowedCandidateTypes`, `includesOsmSourceLink`, `reportsImportVintage`, `keepsAccessUnknownWhenUnmapped`, `returnsNoCandidatesNearUninhabitedArea`, `usesRequestedDistanceUnits`, `capsResultCount`, `statesCandidateSortBasisWhenDarknessUnknown`, `importsRepeatably`, `preservesOdbLAttribution`, `returnsSourceLinkedPlaceContext`, `returnsUnknownForUnverifiedDarkness`, and `treatsOsmNamesAsUntrustedData`.
- [ ] Implement only a measured, read-only flat-file artifact for V1 candidate search. Do not add a database or external indexing service. Store the minimum fields needed for candidate search; record global/region coverage and refresh vintage. Cap and sanitize source-provided text, keep OSM tags in typed data fields, and never treat them as instructions. If the artifact cannot meet host memory, disk, query-latency, or refresh limits, leave candidate discovery explicitly partial/unsupported and defer it.
- [ ] Build source indexes outside the production request path. Publish versioned/checksummed artifacts with source vintage, coverage and ODbL metadata; deploy by atomic version switch and retain the last known-good artifact for rollback. Keep raw extracts and build scratch files off the serving VM's root disk. A temporary/CI build worker is optional and requires a cost check/approval before paid use.
- [ ] Benchmark the 2 vCPU/4 GB shared Hetzner target with all enabled runtime indexes loaded: peak RSS, free disk during deploy and rollback, cold/warm query latency, concurrent requests and artifact rollback. If an index does not fit with safe headroom, keep that tool explicitly unavailable/partial; adding a database or external index is outside the owner-confirmed V1 scope.
- [x] Do not rely on public Nominatim or Overpass service capacity for production-scale search. Never use an OSM candidate tag as proof of access, night opening, darkness, or safety.
- [ ] Publish ODbL attribution in every relevant result and document the source/index license plus any share-alike or derived-database offer/publication obligation that Gate 0A determines applies.
- [x] Return relative satellite-measured ground-light radiance only if Gate 0E validates its license, coverage, label and usefulness; otherwise return an explicit unknown value and never rank a place as “dark.” Never relabel radiance as sky brightness, Bortle or SQM.
- [x] When darkness is unknown, sort candidates by requested candidate-type match (when specified), then distance from the resolved search area, then source-record completeness. Return the sort basis in structured and concise text results so ordering is never presented as a darkness ranking. If no type is specified, sort by distance, then source completeness.
- [x] Pass when `npm test` passes the candidate/context cases, repeat import/query results are stable, and neither tool implies an access or darkness guarantee.

### Task 9: Deliver months-ahead historical cloud context

Local progress 14 October 2026: grouped-year decoder/partitions and chronological schema2 publication verified offline, preserving parent raw provenance and legacy monthly limits. Two-year and full-period plan designs have thirty grouped jobs, subject to CDS cost/layout acceptance. No further live retrieval authorized/executed; real baseline/global/host gates remain open. See `docs/operations/grouped-history-wave.md`.

**Files:** Create `server/providers/climate/era5.ts`, `scripts/era5/aggregate.ts`, `tests/providers/climate/era5.test.ts`, and `docs/operations/era5.md`.

**Consumes:** Task 0C CDS sample, Task 2 `ClimateContextResultV2`, and actual historical hourly Sun-altitude calculations validated under Task 5/H2. Method and staged acceptance are refined in [the historical statistics plan](2026-10-13-nightsky-historical-statistics.md).

**Produces:** `getClearSkyClimatology(place, month)` with a source-supported historical summary/statistic, actual period/product vintage, grid resolution, fraction units, `dataClass: reanalysis` and `historicalLabel: historical-not-a-forecast`. The runtime artifact gate and `get_clear_sky_climatology` registration pass locally for the reviewed three-place 2025 sample. The detailed plan's H1–H5 labels are subdivisions of this Task 9, not overall development waves. Contract, aggregation, pilot and MCP integration are complete locally; selected-host/release validation, multi-year baseline and global coverage remain open. Task 9 remains Partial.

- [x] Test `returnsMonthlyMeanByHour`, `filtersToLocalDarknessHours`, `marksSparseGridAsPartial`, `includesSourceVintageAndGridResolution`, and `neverLabelsHistoryAsForecast`.
- [x] Use the registered ERA5 monthly-means-by-hour product if the Task 0 sample supports the needed user explanation. Do not claim median/percentile distributions unless the selected source contains per-year values that justify those statistics.
- [ ] Add bounded aggregation only as an offline build that emits a small versioned read-only file. Do not add a database or durable user/provider state. If the artifact cannot meet the approved size, memory, refresh, licensing, and cost bounds, mark climatology unsupported for V1.
- [x] Return “historical pattern for this month/season,” never a particular-night clear-sky probability; advise the user to recheck a real forecast closer to the date.
- [ ] Treat inability to provide a lawful, reliable, affordable history result as a launch gate for the months-ahead claim. Mark that journey unsupported until resolved; do not silently replace it with a forecast guess.
- [x] Pass when `npm test` passes the named climate cases and the MCP result identifies the actual statistic, years, grid resolution, units, and historical label.

### Task 10A: Implement activity-aware plan orchestration

Closure 14 October 2026: original local acceptance independently audited and verified by current transport/Inspector, Windows/Linux suites and all six CI jobs at c20a381 (run38471282719). Source and hosted requirements remain in their owning tasks.

**Files:** Create `server/nightsky/planner.ts`, `tests/nightsky/planner.test.ts`, and `tests/mcp/planning-e2e.test.ts`.

**Consumes:** Completed Tasks 4–7A and the supported portion of Task 6. Task 7B aurora is optional. Tasks 8 and 9 (candidate places and climatology) are optional integrations and are not prerequisites. The planner must return a useful result when an optional service is unavailable, out of coverage, or not implemented.

**Produces:** `planObservingSession({ placeId, ...input }): Promise<PlanResult>`; the MCP tool requires a previously resolved `placeId` and does not accept `placeQuery`. Register `plan_observing_session` after the end-to-end handler passes.

- [x] Test `plansBeginnerStargazingWithPartialWeather`, `plansMeteorNightWithRadiantGapExplicit`, `plansAstrophotographyWithoutInventingSeeing`, `plansTelescopeTargetWithVisibilityWindow`, `returnsHistoricalContextForMonthAheadDate`, `returnsUsefulPlanWhenClimatologyIsUnsupported`, `asksForAmbiguousPlace`, `includesNightAccessCaveat`, and `returnsUsefulPlanWhenOneProviderFails`. Radiant altitude remains an explicit gap pending Task 6's source-rights and drift-model gate.
- [x] Add a local Streamable HTTP integration test using the real registry and fixture-injected services: initialize, resolve a named place, call the planner with the returned `placeId`, and validate the structured result. Also verify explicit unavailable/unsupported states when optional candidate/climate data is absent. No external network calls are allowed in this test.
- [x] Produce a concise summary first, then the darkness interval, per-source forecast values and valid times, missing evidence, caveats, preparation steps, and source links. Keep exact factor values accessible; do not output one unexplained universal “good sky” score. Include candidate places and historical context only when Tasks 8/9 are enabled. Otherwise return an explicit unsupported/unavailable state for each optional capability and continue the plan from the user's named destination.
- [x] Keep outputs deterministic from fixture inputs so the same scenarios can be tested in every assistant host.
- [x] Pass when `npm test` passes the planner cases, every exercised journey maps to a fixture or explicit unsupported/partial result, and the tool returns validated structured content. Full V1 journey coverage still depends on candidate/climatology feasibility and licensed meteor-radiant data; those remain separate gates.

### Task 10B: Implement side-by-side option comparison

Closure 14 October 2026: original local acceptance independently audited and verified by current transport/Inspector, Windows/Linux suites and all six CI jobs at c20a381 (run38471282719). Source and hosted requirements remain in their owning tasks.

**Files:** Create `server/nightsky/compare.ts` and `tests/nightsky/compare.test.ts`.

**Consumes:** Task 10A `PlanResult` and the provider comparison contract from Task 2.

**Produces:** `compareObservingOptions(input): Promise<CompareOptionsResult>` for up to five user-selected place/date options; register `compare_observing_options`.

- [x] Test `comparesSourcesWithoutBlending`, `keepsOptionWithMissingForecast`, `explainsActivitySpecificTradeoffs`, `preservesSourceLinksAndLocalTimes`, and `comparesFiveOptionsWithoutBlending`.
- [x] Keep all selected options in the result, including options with missing data. Do not create an unexplained winner or universal score.
- [x] Pass when `npm test` passes comparison cases and conflicts, missing providers, differing valid times and activity-specific priorities remain visible in the deterministic MCP result.

### Task 11A: Add cited sky-learning and astrophotography guidance

**Files:** Create `server/content/learning.ts` and `tests/content/learning.test.ts`.

**Consumes:** Task 6 event/safety boundary, Task 10A plan contract, and the beginner/astrophotography journeys in the product scope.

**Produces:** Concise original learning material linked to reliable, reusable sources and appropriate to the user's experience and hemisphere.

- [x] Test `explainsSkyOrientationForHemisphere`, `listsAstrophotographyLearningByExperience`, `requiresGearBeforeGivingSettings`, `includesReusableSourceCitation`, and `includesSolarEclipseEyeSafetyReference`.
- [x] Cover first-session orientation, basic target finding, first phone/camera/tripod photo, solar-eclipse eye safety from an authoritative source, and next learning steps without promising image results.
- [x] Keep camera-specific settings conditional on user-provided camera/lens/support details. Pass when tests verify citations and no gear-specific claims without sufficient inputs.

### Task 11B: Add reviewed app suggestions and preparation checklists

**Files:** Create `server/content/specialistTools.ts`, `server/content/checklists.ts`, and `tests/content/recommendations.test.ts`.

**Consumes:** Task 10A plan contract, available weather fields, and the product's app-suggestion/preparation journeys.

**Produces:** A small reviewed specialist-app catalog and activity/weather/gear-aware checklists; register the read-only MCP tool `recommend_specialist_tools`.

- [x] Test `matchesToolSuggestionToActivity`, `marksPriceAsUnknownWhenNotVerified`, `includesLastCheckedDate`, `doesNotAddAffiliateTracking`, `adaptsChecklistToWeatherAndGear`, `includesAfterDarkAccessCheck`, and `doesNotPromisePhotoSuccess`.
- [x] Store each app's purpose, supported platform, verified pricing label, source link, and `lastReviewed`; if price/platform support is not verifiable, label it unknown.
- [x] Do not add affiliate tracking or paid placement in V1. Cover telescope, meteor, family, aurora, eclipse and camera preparation. Include a brief reminder to verify land access, after-dark rules, and local conditions; use only weather fields the source actually provides.
- [x] Pass when tests verify relevance, citations, review dates, uncertainty, and no unsupported claims, and the MCP tool returns validated structured content.

### Task 11C: Author five shared workflow guides and host-specific packages

**Files:** Create the canonical workflow guidance under `docs/product/workflows/`; create OpenAI package skills under `plugins/nightsky/skills/{find-observing-place,plan-stargazing-night,plan-astrophotography,plan-sky-event,prepare-outing}/SKILL.md`; add host-neutral prompt fixtures under `tests/skills/`.

**Consumes:** Completed MCP tool inventory, Task 10A–10B contracts, and Task 11A–11B content.

**Produces:** Five canonical workflow guides plus an OpenAI-specific skill package. Other hosts receive separately tested setup/instruction material only where their product supports it; the plan does not assume one portable skill artifact.

- [x] Each skill states its purpose, minimal follow-up questions, exact tool names, sequencing, source/time handling, partial-data behavior, and unsupported cases. If the user supplies coordinates, ask them to name a destination; never convert or reverse-geocode the coordinates into a place name. Include a host-neutral fixture named `asksForNamedPlaceWhenUserGivesCoordinates` and verify that the skill guidance asks for a named destination without producing a plan.
- [x] Keep host-independent astronomy and data facts in the canonical guides; adapt any host-specific skill syntax and location behavior in the corresponding package/docs.
- [x] Cover beginner/family/urban stargazing, meteor showers, eclipses, aurora where supported, visual telescope use, astrophotography learning, and seasonal trip planning through the shared five skills; do not create duplicate provider facts in prompt files.
- [x] Test `usesPlaceResolutionBeforePlanning`, `callsEventSearchForEventPlans`, `keepsProvidersSeparateInSummary`, `asksBeforeAssumingHostLocation`, and `usesPartialResultWhenSourceUnavailable` against static and prompt fixtures.
- [x] Run `npm test` and `npm run check`; tests verify no undefined tool references and expected tool order and caveats.

### Task 12A: Prepare the OpenAI package and host test cases

**Files:** Create `plugins/nightsky/plugin.json`, `plugins/nightsky/mcp.json`, package assets, `docs/platforms/chatgpt.md`, `docs/platforms/codex.md`, and host-neutral prompt fixtures under `tests/platforms/`.

**Consumes:** Implemented MCP tools and Task 11C skills.

**Produces:** A statically validated OpenAI package draft and shared host test cases. No live-host compatibility claim is made until Task 15 tests the deployed production endpoint; staging and production are separate hosts.

- [x] Validate package manifests and exactly one configured remote MCP endpoint. Keep local-only app references/lifecycle hooks out of the public ZIP.
- [x] Validate package manifests and local MCP behavior; run MCP Inspector against the local endpoint. Do not describe a local protocol check as a live ChatGPT/Codex integration test.
- [ ] Update the real draft created in Task 4B with complete metadata and host-specific skill files by uploading a new ZIP to that same plugin record. Keep its production URL unchanged; do not create a second or skills-only plugin.
- [x] Keep OpenAI tool schemas free of raw coordinate/address fields. Verify the current ChatGPT location policy and optional `_meta["openai/userLocation"]` hint. The documented hint may include city, region, country, timezone, longitude and latitude and may be absent. The assistant sets `useApproximateHostLocation: true` only for an explicit “near me” or current-area request; NightSky uses the hint only when that flag is present, treats all fields as sensitive, does not persist/log/echo it, and asks for a named destination if it is absent. Reject coordinate-shaped `placeQuery` text on every host.
- [ ] Handle OpenAI call metadata explicitly: `openai/subject` is an anonymized per-user identifier intended for rate limiting; `openai/session` and optional organization, locale and user-agent fields may also arrive. Use only the minimum fields named in the data-flow contract; discard the rest and verify none leak into application or reverse-proxy logs.
- [x] Define repeatable test prompts for beginner, meteor, astrophotography, ambiguous-place, partial-provider, and coordinates-only scenarios; record expected tool calls, structured output signals, citations, and error behavior in `tests/platforms/host-cases.json`.
- [ ] Pass when the package draft validates, test cases are deterministic, and the host-test matrix clearly marks live checks as pending Task 15.

### Task 12B: Validate Claude and Gemini routes separately

**Files:** Create `docs/platforms/claude.md`, `docs/platforms/gemini.md`, and `tests/platforms/host-matrix.md`.

**Consumes:** The shared remote MCP endpoint from Task 3 and host-neutral prompts from Task 12A.

**Produces:** Draft connection instructions and an explicit per-host availability/feature matrix; live compatibility remains pending the Task 15 production tests.

- [x] Document Claude's custom remote-MCP setup path and the account/region/product and location-input rules to verify during Task 15. Do not infer workflow-skill portability from tool compatibility.
- [x] Record the Gemini consumer MCP availability and the separate Gemini API/NightSky-owned route. Current official Google documentation lists consumer eligibility restrictions; verify availability and location-input rules with the intended account and region during Task 15.
- [x] Record remaining host differences; do not treat MCP protocol portability as proof of marketplace or consumer-app availability.
- [ ] Pass when every claimed route has a dated successful test record and unverified paths are labeled conditional.

### Task 13: Prepare required public listing and policy pages

**Files:** Create or update `client/src/pages/Privacy.tsx`, `Terms.tsx`, and `Support.tsx`; add their routes in `client/src/App.tsx`. Keep the existing homepage and navigation design, and do not add the interactive map in V1.

**Consumes:** Task 0 source register, Task 3 data-flow/logging contract, Task 3C publisher identity, and current OpenAI remote-MCP listing requirements.

**Produces:** Accurate privacy, terms, and monitored support pages for the remote-MCP listing, alongside the existing HTTPS website URL. Before drafting, the owner must choose the individual or business publisher identity and supply or confirm the matching support destination; the listed identity must match the verified OpenAI developer identity.

- [ ] State the data sent to the MCP service and upstream providers, retention/logging behavior, third-party assistant handling, data-source terms, and contact path in plain language. Disclose that OpenAI tool-call metadata may include `openai/userLocation` (which may include longitude/latitude as well as city/region/country/timezone), anonymized `openai/subject` and `openai/session` identifiers, and optional organization, locale, and user-agent fields. Explain that the resolver uses the location hint only when `useApproximateHostLocation: true` is supplied for an explicit current-area request and the subject only for short-lived rate limiting; it discards other metadata and does not persist the hint or raw identifiers. State any retention for derived counters.
- [x] Confirm the support destination is monitored; the current Contact page is not a working support channel if it only logs submissions in the browser.
- [ ] Draft and review page content against the actual data flow, including location handling, provider recipients and transfer destinations, server/proxy-log and rate-counter retention, user controls/rights requests, OSM/source licenses, and a monitored contact path. Make the service suitable for general audiences aged 13–17 and do not target children under 13.
- [ ] Add a documented, risk-tiered jurisdiction review before publication; do not treat `publication.countries: []` as requiring an unbounded line-by-line legal survey of every country. Identify the controller/publisher, data categories and recipients, purposes and lawful bases, retention, rights-request route, and international transfers. Prioritize qualified review of the publisher's home jurisdiction and intended high-reach audiences, including EU/EEA and UK GDPR (including representative requirements), India's DPDP Act and phased Rules, Brazil's LGPD, relevant U.S. state privacy regimes, and age rules for 13–17. Record the review status, relevant obligations, transfer safeguards, and rationale for other enabled markets; recheck before material expansion. If a material obligation cannot be supported, propose an explicit allowlist for owner review. This is a planning gate, not a legal conclusion. See the official GDPR, ICO, MeitY and ANPD sources in External References.
- [ ] Treat the Task 3 data-flow and retention contract as the policy draft. Task 14 must inspect staging defaults, set actual server/proxy retention, reconcile any mismatch in privacy text, and only then deploy the public policy/support routes.
- [ ] OpenAI requires website, support, privacy-policy, and terms URLs for a public remote-MCP listing; the public publisher identity must match the verified individual or business identity.
- [ ] Deploy and verify the URLs over HTTPS in Task 14/15; this task prepares the content/routes and does not redesign the website or rewrite its product positioning.

### Task 14: Deploy the service and verify operations

**Files:** Create `docs/operations/deployment.md`, `privacy-and-telemetry.md`, `provider-failure.md`; add `server/health.ts`, `tests/operations/health.test.ts`, and `tests/operations/load-smoke.test.ts`; update `package.json`, `.replit`, or hosting configuration only for the selected host.

**Consumes:** Task 0 host decision, Task 1 local transport proof, Task 3C's distinct production and staging hostnames, completed service, and the Task 13 policy draft.

**Produces:** A tested staging release and a full V1 release promoted to the stable HTTPS production `/mcp` endpoint first created with only `resolve_place` in Task 4B; health checks, privacy-preserving logs, rollback, and source outage behavior.

- [x] Fix the current POSIX-only `NODE_ENV=...` scripts using a cross-platform command approach; add documented `npm run dev`, `npm run check`, `npm test`, and `npm run build` commands.
- [x] Add `/health` with no secrets or user coordinates. Build abuse controls from shared caching, global/per-tool request and cost ceilings, concurrency limits, and upstream backoff/circuit breakers. Do not rely on per-IP limits as the only control because assistant hosts may share egress IPs. Use OpenAI `openai/subject` only for short-lived per-user rate-limit counters on that route; do not log raw subject/session IDs, request `_meta`, location fields, complete MCP arguments, place queries or exact coordinates by default.
- [ ] Inspect staging hosting and reverse-proxy access logs. Set and document short retention for IP/request metadata and rate counters, disable unnecessary query/body/header logging, and disclose any retained metadata and purpose on the privacy page. Pilot analytics must be aggregate-only and must not reconstruct individual query histories.
- [x] Test `returnsHealthyWithoutSecrets`, `doesNotLogCoordinates`, `limitsAnonymousRequests`, and `degradesWhenProviderFails`.
- [ ] Run a bounded staging load smoke with fixture providers at the selected 2 vCPU/4 GB target. Record request mix, concurrency, throughput, p50/p95 latency, process memory and errors; set application limits below the measured stable capacity with headroom. This is a capacity measurement, not a latency SLA.
- [x] Before any remote exposure, review `npm audit --omit=dev` against the locked production dependency tree. Triage high/critical advisories for reachability and impact; apply compatible updates or document a reviewed mitigation/removal for breaking upgrades. Do not use blanket force-upgrades, and do not expose the service remotely with unresolved high/critical findings lacking an explicit recorded disposition.
- [ ] Deploy the candidate release to the separate staging hostname; verify `/health`, MCP Inspector initialize/list/call, streaming/session behavior, provider timeouts, access controls, privacy logging, and rollback. Keep the permanent production URL configured for the real OpenAI draft.
- [ ] After staging operational checks and pre-promotion smoke/regression cases pass, promote the full V1 release to the permanent production hostname; verify `/health`, the frozen MCP URL, provider behavior, and rollback. Task 15 then runs the full directory review cases against production. If any fail, fix on staging, repeat staging checks, promote again, and rerun affected production cases. Never point the real plugin draft at staging.
- [ ] After production logging and provider behavior are verified, reconcile and deploy the policy/support routes; test all four OpenAI listing URLs over HTTPS. The domain challenge is created and verified for the production hostname during Task 4B, not as a staging task.
- [ ] Measure actual monthly cost and provider request volume against the owner-confirmed budget. If the host exceeds it or cannot sustain transport behavior, stop public launch and revisit host choice.

### Task 15: Assemble the review-ready public package

**Files:** Update `plugins/nightsky/plugin.json`, `plugins/nightsky/mcp.json`, assets and `docs/platforms/chatgpt-submission.md`.

**Consumes:** The real OpenAI draft and production URL from Task 4B, the verified publisher from Task 3C, Task 13 policy pages, and the release promoted from staging by Task 14.

**Produces:** A complete package artifact ready for owner inspection, not a submitted package.

- [ ] Use the branded display name `NightSky.earth`, current listing metadata, required icon assets, versioned workflow skills, one remote MCP server URL, release notes, working website/privacy/terms/support URLs, and source/privacy explanations. Since V1 has no plugin UI and directory screenshots are not shown, provide up to three useful `defaultPrompt` examples instead of screenshots.
- [ ] Keep “free” and all other pricing, subscription, discount or promotion claims out of the public plugin title/subtitle/description. Set `publication.countries` to `[]` for the settled global intent, verify the current validator accepts it, and record platform distribution limits and source/feature coverage gaps separately. Before release, complete Task 13's jurisdiction review; if it identifies a necessary country restriction, record the reason and obtain the owner's approval before replacing the unrestricted default with an explicit allowlist.
- [ ] Prepare exactly five positive and three negative cases in the OpenAI `review.test_cases` array. Each names the prompt, expected tool sequence, and visible result; run every case before packaging. Use fixed place/date fixtures for these positive journeys: (1) casual stargazing from a named destination; include text-based candidate discovery and the no-access/no-safety caveat only if Task 8 is enabled, otherwise test a useful plan with candidate discovery explicitly unavailable; (2) a meteor-shower plan combining event timing, darkness, Moon, and available forecast; (3) a beginner asking what is visible from a named place and how to start; (4) an astrophotography plan with target/Moon timing, forecast, and gear-dependent preparation while stating unsupported seeing/transparency limits; and (5) a within-forecast-horizon comparison of two nights for a named telescope target, with source and availability labels. If Gate 0C passes, the months-ahead climatology case may replace one of these five; otherwise keep it in internal fixtures or the reviewer video, not in the submission case array.
- [ ] Before packaging, record the owner's explicit decision for any V1 journey omitted because candidate discovery (Task 8) or months-ahead historical context (Task 9) failed feasibility. A reduced review case may reflect that decision, but it does not silently change the agreed V1 scope.
- [ ] Ensure exactly three negative cases each contain one deterministic prompt: (1) guarantee an aurora sighting, (2) view a solar eclipse through sunglasses, and (3) “Find a dark spot at 12.97, 77.59.” Expected behavior for case 3 is no plan: ask for a named destination and never convert/reverse-geocode the coordinates into a place name. Test the separate host-hint-absent branch deterministically in Task 4 fixtures rather than relying on a reviewer being able to control optional host metadata. Add the unmapped-park access/safety caveat to a positive place-discovery case.
- [ ] After promoting the reviewed release, run the prepared positive/negative cases against the permanent production endpoint in fresh ChatGPT desktop and mobile sessions and Codex; test the same representative journey set through Claude and the available Gemini route, recording each route's actual network/connection path. Record device/surface, account/region limitations, date, and outcomes. Do not claim support for a route that was unavailable or untested.
- [ ] If owner-invited testers can connect to staging, run a small pre-submission usability check and record sample size and findings; otherwise record why and run the invited pilot immediately after public listing. Keep the real plugin package pointed at production throughout.
- [ ] Record an accessible reviewer video URL showing the required positive/negative cases, the supported ChatGPT surfaces, and how the service handles source gaps.
- [ ] Keep credentials/secrets out of the package. Freeze the full MCP URL (including scheme, hostname, port and path) before submission. The current OpenAI app-review and submission pages differ on endpoint-path URL changes; contact support or follow the more restrictive rule until the conflict is resolved.
- [ ] Validate the ZIP using the current official package validator and resolve all blocking findings. Keep a copy of the exact reviewed artifact and checksum.
- [ ] Pass when the artifact, test cases, video, and public links are all owner-reviewable; do not submit in this task.

### Task 16: Submit, review, and publish as separate owner-authorized actions

**Files:** Update `docs/platforms/chatgpt-submission.md` with actual status and review findings.

**Consumes:** Task 15 reviewed artifact.

**Produces:** A recorded submission result, approval state, and—only after a separate owner confirmation—published directory listing.

- [ ] Obtain the owner’s explicit authorization before submitting the package through the OpenAI directory.
- [ ] Before submission, verify the selected OpenAI organization/project and residency configuration can submit MCP plugins; the current review guidance excludes projects with EU data residency. Confirm the publisher identity is verified and matches the public policy/support pages.
- [ ] Resolve automated/manual review findings and record each correction. Do not state that approval or placement is guaranteed.
- [ ] After approval, wait for the owner’s separate instruction before selecting Publish.
- [ ] After publication, verify the listing and install/use it in fresh ChatGPT and Codex sessions. Record actual availability and platform analytics fields.

### Task 17: Run an invited pilot and record product evidence

**Files:** Create `docs/operations/pilot-measurement.md` and a dated pilot findings record.

**Consumes:** Published product and existing user journey matrix.

**Produces:** Evidence about completed plans, decisions changed, source gaps, repeat use, and a continue/change/stop recommendation for V1.

- [ ] Recruit a small mix of current astronomy-app users, beginners, meteor/event observers, and astrophotographers, including testers from different hemispheres/time zones where available. Include the owner’s own real planning use and record the current multi-app workflow as a baseline; label this a usability pilot, not a globally representative market study.
- [ ] Track only exposed measures: installations where the host reports them, successful/failed tool calls, data coverage, latency, source failures, outbound links, and voluntary plan usefulness/return feedback.
- [ ] Keep installs, activations, MCP calls, and unique people as separate metrics. Do not infer identity or retention from anonymous tool calls.
- [ ] Ask whether the plan changed their chosen place, time, activity preparation, or need to switch apps. Record observed behavior separately from stated preference.
- [ ] Pass when pilot notes report the measured journey signals, sample size, data gaps, and a clear continue/change/stop recommendation. Do not infer unique-user retention from anonymous MCP calls.

### Task 18: Open the separate website scope/design workstream

**Timing:** May begin in parallel with Tasks 0–17. This is a separate product/design workstream, not plugin V1 implementation or a release dependency. Pilot evidence can inform later website decisions and revisions, but is not required to start.

**Files:** Create `docs/product/website-workstream-brief.md` only when the owner chooses to start this discussion.

**Consumes:** Current website review and the product direction; incorporate plugin/pilot findings when they become available.

**Produces:** An owner-reviewed website brief defining the user problem, whether an interactive map is justified, data layers and evidence limits, licensing, costs, and an independently sequenced implementation plan.

- [ ] Start discovery and scope independently from plugin V1; use pilot behavior and feedback as additional evidence when available.
- [ ] Revisit data licensing, coverage, access/safety evidence, operating cost, and maintenance needs for any proposed website feature.
- [ ] Keep this scope and implementation plan independent from plugin V1; the owner may decide to defer or not build a proposed website feature.
- [ ] Pass when a separate scope/design brief is ready for discussion. Do not implement website changes as part of this task.

## MCP Tool Registration and Permissions

Register these user-facing names only when the owning handler and output schema pass. Task 3 provides the registry/transport boundary; it does not publish placeholder domain tools.

| MCP tool | Owner task | `readOnlyHint` / `destructiveHint` / `openWorldHint` | Registration condition |
|---|---|---|---|
| `resolve_place` | 4 | `true / false / false` — product-managed gazetteer and local index | Place query returns unique, ambiguous, and no-match states with source-backed results. |
| `get_astronomy_window`, `get_target_visibility` | 5 | `true / false / false` — local calculations and product-managed target catalog | Calculations and local-time outputs pass reference cases. |
| `search_sky_events` | 6 | `true / false / true` only if the released handler can query live JPL; otherwise `true / false / false` — maintained event data | Supported event classes and unsupported states have catalog provenance; final annotation must match whether live JPL lookup is enabled. If that source decision changes after Task 2, update `tool-contracts.md` and the annotation test in the same change before package scan. |
| `get_night_conditions` | 7A | `true / false / true` — makes live calls to the public forecast provider(s) | Forecast sources remain separate and preserve missing fields/times. |
| `get_aurora_outlook` | 7B | `true / false / true` — makes live calls to the public aurora provider | Outlook includes valid time and latitude limits and does not promise visibility. |
| `search_observing_locations`, `get_location_context` | 8 | `true / false / false` — product-managed OSM index and local context data | Candidate sources, vintage, uncertainty, and unknown access/darkness are explicit. Publicly derived source data alone does not make the tool open-world at call time. |
| `get_clear_sky_climatology` | 9 | `true / false / false` — product-managed ERA5 summary grid | Historical product and chosen statistic are validated and labeled `historical`. |
| `plan_observing_session` | 10A | `true / false / true` — may make live calls to public forecast/aurora providers | End-to-end scenario fixtures pass with useful partial results. |
| `compare_observing_options` | 10B | `true / false / true` — may make live calls to public forecast/aurora providers for multiple options | Conflicting sources, missing data, and activity trade-offs remain visible. |
| `recommend_specialist_tools` | 11B | `true / false / false` — bounded reviewed app catalog | Reviewed catalog includes sources and last-reviewed dates; unknown pricing stays unknown. |

The Task 0A JPL decision determines whether the live dynamic-object path is in the V1 release. Task 2 freezes `search_sky_events` to exactly one boolean annotation before registration: `openWorldHint: true` when it can query live JPL, otherwise `false`. No shipped manifest contains a conditional annotation.

**Permissions and location contract:** All V1 tools are read-only and non-destructive; the table lists explicit boolean annotations per tool based on each handler's actual external-data behavior. Do not add OAuth or account permissions for V1. `resolve_place` alone accepts exactly one of a free-text `placeQuery` for a named observing destination or `useApproximateHostLocation: true`; downstream tools use the resolved NightSky `placeId`. The assistant sets the flag only when the user explicitly requests “near me” or their current area. The server reads a documented host hint only when that flag is true, resolves it to a named place, and ignores it otherwise; on absent hints or hosts without a documented side channel, ask for a named destination. Reject coordinate-shaped query text on every host; when a user supplies coordinates, ask them to name a destination and never convert/reverse-geocode the coordinates into a place name. Public candidate-place results may include mapped candidate coordinates and navigation links; do not echo the user's resolved coordinates or host location hint as their exact current location. Disclose that the NightSky server receives the selected destination and may forward rounded provider coordinates to the named forecast source. Apply global and per-upstream request budgets; use OpenAI's anonymized subject only for short-lived per-user rate-limit counters, and do not persist raw host metadata or query histories.

**V1 tool exclusions:** `get_coastal_tides` is regional and optional in the product inventory; it is not part of the global V1 tool set. Revisit it only if the coastal-nightscape journey is selected for a later scope.

## Product Journey Coverage

| Journey | V1 path | Required evidence |
|---|---|---|
| Find a place and plan a casual sky night | `resolve_place` → `search_observing_locations` → `get_astronomy_window` → `get_night_conditions` → `plan_observing_session` | Source-linked public candidate, astronomical dark interval and Moon window, forecast valid time, ground-light context only if Gate 0E validates it, unknown access status unless independently verified, practical checklist. |
| Plan a meteor shower | `resolve_place` → `search_sky_events` → astronomy/weather → activity plan | Local event timing/radiant context, Moon, dark window, weather, source and uncertainty. |
| Learn the sky or astrophotography | `resolve_place` → plan/target tools → relevant learning skill/resources | Beginner-appropriate explanation, activity-specific guidance, no unsupported camera/seeing promise. |
| Plan telescope/target viewing | `resolve_place` → `get_target_visibility` → conditions → plan | Rise/set and altitude window, Moon context, source gaps. |
| Plan a future trip | `resolve_place` → `get_clear_sky_climatology` with calendar-month context | Historical label, dataset/product vintage and grid scale; recheck forecast closer to date. |
| Find an eclipse or aurora opportunity | `resolve_place` → event/aurora tools → local circumstances → conditions | Visibility/latitude context, valid time, explicit limits; no guaranteed sighting. |
| Compare candidate nights/places | `compare_observing_options` | Same activity factors shown side by side, models kept separate, missing data visible; retain all five options when five were requested. |

## Review Record

**Process followed:**

1. Use `superpowers:writing-plans` to turn the agreed product scope into an ordered plan with file ownership, inputs/outputs, dependencies, test cases, and pass conditions.
2. Review product value and launch order with `plan-ceo-review`; preserve the user's broad night-sky audience and end-to-end planning ambition while making data rights and demand validation explicit.
3. Review the assistant conversation, question burden, partial results, source hierarchy and location ambiguity with `plan-design-review`.
4. Review architecture, MCP schemas, provider boundaries, time handling, data licensing, failure states and deployment with `plan-eng-review`.
5. Review local setup, Windows/Linux scripts, first successful local plan, troubleshooting and host-specific setup with `plan-devex-review`.
6. Reconcile the findings, map every V1 tool and journey to an owner task, align the product-scope and roadmap documents, and check relative Markdown links.

This was a document-based application of the skills' review criteria, using decisions already made in the conversation so the user would not need to repeat scope choices. The skills' full interactive question loops were not run, and no implementation tests were run because this is a planning review. Claude reviewed multiple full-plan attachments and checked selected platform/provider claims against live sources. Its findings are treated as independent review input; external claims adopted in the plan were checked separately against official OpenAI, MET and privacy-regulation sources. The final exact-revision review found no P0/P1 issues and three P2 consistency gaps; the fixes and their follow-up confirmation are recorded below.

| Review skill | What was checked | Finding and disposition |
|---|---|---|
| CEO/product | User problem, product wedge, breadth, launch sequencing, and evidence of demand. | Preserve broad activity journeys and both discovery/planning. Position the value as cross-source decision support; validate demand with real outing plans and user feedback. Keep the map after the plugin. |
| Design | Goal-first conversation, question burden, data hierarchy, source disagreement, and partial states. | Lead with one activity-specific recommendation and candidate windows; reveal source details and caveats with the answer. Keep individual factors visible; do not use one opaque score. |
| Engineering | Existing Express/Vite/Netlify architecture, current MCP SDK, tool/schema coverage, time zones, data sources, licensing, and provider failure. | Add the SDK v2 compatibility gate; account for Express body parsing; separate static Netlify hosting from the Node MCP host; correct ERA5 statistics; make five source/hosting gates independent; map each MCP tool to its owning task; select a permanent server URL before directory submission. |
| Developer experience | Clean checkout, Windows/Linux scripts, local first result, troubleshooting, and host packaging. | Add a cross-platform `npm test`; fix POSIX-only environment assignments; include fixture-backed first plan, MCP Inspector steps, and per-platform setup records. Target a local first plan within 10 minutes after Node/npm are installed. |

### Independent Claude review and disposition

| Priority | Claude comment | Disposition in this plan |
|---|---|---|
| P0 | Candidate discovery may be weak if darkness is unknown. | Keep Gate 0E as a licensed-data/usefulness gate; without a validated proxy, return darkness as unknown and never rank candidates as dark. Task 8 now states the non-darkness sort order and reason. The owner must accept this fallback before launch. |
| P0 | OpenAI may reject raw location fields or coordinate text in tool inputs. | `resolve_place` is the only tool with a user-named `placeQuery`; all other location tools require `placeId`. The OpenAI route rejects coordinate-shaped text and uses optional coarse location metadata only for “near me.” The assistant is instructed to ask for a named place rather than convert user coordinates into a place name. Task 4B runs an early one-tool scan; any unresolved location-policy finding blocks OpenAI expansion/submission. |
| P1 | ChatGPT compatibility and automated schema findings arrive too late in the original sequence. | Task 3B tests the hosted smoke tool before the broad build; Task 4B scans the location resolver before adding the rest of the tools; Task 15 repeats full tests and scan against the production endpoint. |
| P1 | OpenAI URL guidance conflicts; identity, domain challenge, mobile coverage, project region and country availability were missing. | Freeze the full MCP URL; explicitly record the current docs conflict. Add verified publisher identity/support pages, the challenge path, project/residency check, ChatGPT mobile runs, and unrestricted country targeting aligned with the settled global intent, subject to package validation. |
| P1 | Tool safety metadata must be explicit; privacy, response minimization and telemetry need a tighter contract. | The 12-tool table sets all three booleans per tool and gives an open-world rationale. Tasks 2/14 minimize model-visible fields and define server/reverse-proxy log retention; Task 13 discloses data flows; pilot telemetry stays aggregate-only. |
| P1 | The service could look like a third-party weather/aurora pass-through; unknown-darkness ranking and optional climatology were underspecified. | Tasks 7A/7B require local-night, Moon/latitude and source-aware interpretation; Task 8 states candidate sort basis; Task 10A has a useful plan when historical context is unavailable. |
| P1 | ODbL duties, stale place IDs, untrusted OSM text, forecasts, events and cross-host checks need detail. | Gate 0A classifies applicable ODbL duties; Tasks 2, 4, 6, 8–12 cover stale-ID re-resolution, text sanitization, locale/units, forecast horizons, explicit event boundaries, and per-host packaging/tests. |
| P2 | Submission copy, mobile tests, default prompts, listing price claims, ages and MET/SDK operations needed review. | Task 15 uses `NightSky.earth`, up to three starter prompts and no pricing claims, tests mobile, and checks general-audience suitability. Task 7A covers MET's request ceiling, jitter, deprecation response, caching and coordinate limits; Tasks 1/3B check SDK interoperability and Express Host validation. |
| P2 | Other useful edge cases include polar/date-line/non-Latin/ocean/eclipses, stale data and five-option comparison. | Keep named fixtures across Tasks 4–10 and host-specific runs; explicit partial/unsupported behavior is part of each acceptance check. |

### Second Claude delta review and disposition

Claude found no remaining P0 issue in its second pass. It reported five P1 and six P2 findings against the attached revision. The plan changes below incorporate those findings; a later exact-revision confirmation is complete, as recorded in the final review section.

| Priority | Finding | Disposition in this revision |
|---|---|---|
| P1 | The early location scan lacked publisher/project/domain prerequisites and risked a disposable plugin bound to the production host. | Task 3C now establishes verified publisher identity, eligible project, permanent production URL and separate staging host before Task 4B. Task 4B creates and scans the real branded draft; the dashboard-issued challenge is served on that production host. Task 12A updates that same draft. |
| P1 | Staging and production were conflated. | Task 3B uses a separate staging hostname; Task 14 tests and promotes a release to the frozen production hostname; Task 15 runs the full review cases against production and routes failures back through staging. |
| P1 | `openWorldHint` was based on geographic breadth rather than the tool's actual external-data behavior. | The tool table now distinguishes local/product-managed datasets from live provider calls. Task 0A/Task 2 freeze a single `search_sky_events` boolean based on whether the live JPL path is enabled; no shipped manifest has a conditional annotation. |
| P1 | OpenAI sends location and anonymized identifiers in per-call `_meta`; the logging and privacy contract omitted them. | Tasks 3, 12A, 13 and 14 now name the possible fields, discard unused metadata, allow only transient “near me” use, use `openai/subject` for short-lived rate counters, and disclose all retained uses and retention. The official metadata reference was checked directly. |
| P1 | Unrestricted country targeting needed a jurisdiction/privacy review. | Keep `publication.countries: []` as the default for global intent, subject to validator and a risk-tiered jurisdiction review of the publisher's home jurisdiction and priority markets. Task 13 records the controller, lawful basis, transfers, rights requests, age/consumer rules, EU/UK representative requirements, and rationale for other enabled markets; any needed country restriction goes to the owner for approval. |
| P2 | One shared MCP endpoint made host-specific typed-coordinate support ambiguous and `openai/userAgent` is not a reliable host detector. | V1 now accepts named places on every host, rejects coordinate-shaped text everywhere, and uses only documented host location hints for explicit “near me” requests. |
| P2 | Public candidate coordinates were unclear beside private user-place coordinates. | Task 2 and the permissions contract allow mapped coordinates/navigation links for public candidate locations while keeping resolved user and host-location coordinates private. |
| P2 | Retrieval timestamps conflicted with response minimization. | Prefer provider issue/update and valid times; expose a retrieval/check time only when no provider timestamp gives a usable freshness signal and the user needs one, with the reason documented. |
| P2 | A negative review case bundled two distinct prompts. | Task 15 now defines three one-prompt negative cases and moves the unmapped-park access caveat to a positive place-discovery case. |
| P2 | Staging was called access-controlled without naming a mechanism. | Task 3B calls for the current OpenAI egress allowlist where supported, a separate local-inspector path, strict limits, and an explicit untested status when a client cannot reach the controlled staging host. |
| P2 | The plan still listed coordinate privacy as an owner decision after the OpenAI location policy was already set. | Removed that stale decision. V1 location inputs are named-place-only across hosts; host location hints are transient and disclosed. |

### Final Claude review and disposition

Claude read the 598-line revision in full and found no remaining P0 or P1 issue. It identified three P2 gaps and one stale sentence in the review record. The exact fixes are now in the plan. Claude's follow-up read confirmed all three fixes and the corrected review record, found no new material contradiction, and said Task 0 is ready. It also suggested a named coordinate-prompt fixture, which is now included in Task 11C.

| Finding | Disposition in this revision |
|---|---|
| The optional climatology example could create a sixth OpenAI review case even though the submission requires exactly five positive and three negative cases. | Task 15 fixes the `review.test_cases` array at exactly five positive and three negative cases. Climatology may replace one positive case if Gate 0C passes; otherwise it stays in internal fixtures or the video. |
| A model could turn rejected numeric coordinates into a named place and still produce a plan. | The shared server instructions, every workflow skill, the review focus, permissions contract and negative case now say to ask for a named destination and never convert/reverse-geocode user coordinates; case 3 expects no plan. |
| Production first receives scan/reviewer traffic in Task 4B, before Task 14's log review and retention setup. | Gate 0F now includes application/edge log controls. Task 4B requires applying and verifying production redaction and bounded retention with synthetic requests before connecting the real draft; an unsuitable host returns to Gate 0F. |
| The earlier review table still said Task 13 would review every enabled country. | The review disposition now describes Task 13's risk-tiered jurisdiction review and rationale for other markets. |

### Current official-source checks

| Check | Finding and effect |
|---|---|
| [Node.js release table](https://nodejs.org/en/about/previous-releases) and [end-of-life table](https://nodejs.org/en/about/eol) | Rechecked 13 October 2026: Node 20 is end-of-life; Node 24 is the current LTS baseline used by this plan. Task 1 and CI must verify the selected SDK and app on Node 24. |
| [OpenAI submission and error requirements](https://developers.openai.com/plugins/deploy/submission), [review requirements](https://developers.openai.com/plugins/deploy/app-review), and [submission errors](https://developers.openai.com/plugins/deploy/submission-errors) | Verified HTTPS website/support/privacy/terms links, a matching verified publisher, domain challenge at `/.well-known/openai-apps-challenge`, production HTTPS server, a successful current tool scan, exactly five positive/three negative cases and a demo video. The app-review and submission pages conflict about endpoint-path URL changes; the plan freezes the full URL. Projects with EU data residency cannot submit MCP plugins. |
| [OpenAI plugin guidelines](https://developers.openai.com/plugins/plugin-guidelines) | Verified privacy disclosure, controlled side-channel location guidance, avoid raw location fields, minimal model-visible results, three explicit annotation booleans, general audience including 13–17 (not targeted to under-13), no pricing claims in listing copy, no directory screenshots, and no pass-through-only connector. These drive Tasks 2–4B, 7–8, 13–15. |
| [OpenAI MCP server guide](https://developers.openai.com/plugins/build/mcp-server) and [metadata reference](https://developers.openai.com/plugins/reference) | Server instructions are used by ChatGPT/Codex with key caveats in the first 512 characters. The optional `openai/userLocation` is described as coarse, may be absent, and can include longitude/latitude as well as city, region, country and timezone; `openai/subject` is an anonymized rate-limit identifier, while `openai/session` is an anonymized conversation identifier. Task 3 and Task 13 account for receipt, use, discard and disclosure of this metadata. |
| [OpenAI publication metadata](https://developers.openai.com/plugins/deploy/submission) | `publication.countries` is an availability allowlist; `[]` removes country restrictions. Task 15 defaults to `[]` for the settled global intent, then records actual platform distribution limits and feature coverage gaps. |
| [MCP TypeScript SDK](https://github.com/modelcontextprotocol/typescript-sdk) and the current [OpenAI MCP guide](https://developers.openai.com/plugins/build/mcp-server) | SDK v2 is the stable upstream line, while OpenAI's MCP guide examples still use the v1 package. Tasks 1/3B now test the selected runtime/transport against actual OpenAI and Codex surfaces before the full tool build. |
| [MET Norway Locationforecast terms](https://api.met.no/doc/TermsOfService) and [client guide](https://api.met.no/doc/locationforecast/HowTO) | Use an identifying User-Agent, cache responses, honor `Expires`, use stored `Last-Modified` with `If-Modified-Since`, stay below 20 requests/second per application, jitter scheduled calls, cap coordinates at four decimals, and surface HTTP 203 deprecation notices. Task 7A makes these testable. |
| [OpenStreetMap ODbL use cases](https://wiki.openstreetmap.org/wiki/License/Use_Cases) | Attribution and share-alike apply according to the database relationship; Gate 0A now requires classifying applicability instead of assuming every output has the same obligation. |

## Open Decisions for Owner Review

- Confirm the proposed $25/month recurring cash ceiling and a separate one-off budget for OSM/ERA5 data preparation; neither is yet an owner-approved spend.
- At Gate 0F, choose the recurring budget and both production/staging hostnames. Before Task 3C/4B, choose the verified individual/business publisher identity and eligible OpenAI organization/project; Task 3C verifies and freezes the full production URL. Current guidance excludes EU data-residency projects from MCP plugin submission.
- Before Task 13, confirm the monitored support destination and decide the controller, lawful basis, transfer safeguards, rights-request route, and whether an EU/UK representative is required or an exception applies. Get qualified legal review where needed.
- Review the conditional launch behavior if Gate 0E finds no useful licensed global ground-light proxy: return place candidates with darkness marked unknown, and do not rank them as dark.
- Choose a sample region for the first measured OSM import; it is a feasibility sample, not a limit on the product’s intended global reach.
- Keep `publication.countries: []` as the default for the settled global intent; validate it with the current package validator and Task 13 jurisdiction review, and record platform distribution/source coverage gaps. If legal or host requirements require an allowlist, obtain owner approval for that specific restriction.
- V1 location input is named-place-only across all hosts. For an explicit “near me” request, use an optional documented host location hint only in memory, disclose the behavior, and ask for a named place if absent. If the user supplies coordinates, ask for a named destination; do not convert/reverse-geocode them or accept typed coordinates.
- Keep the full production MCP URL fixed after Task 3C. Current OpenAI app-review and submission pages differ about endpoint-path changes; keep the full URL fixed unless OpenAI support clarifies the conflict.
- Calendar export, plan sharing, saved plans, and reminders remain follow-up scope unless evidence changes that priority. Website discovery/design/build can run as a separate parallel workstream and is not part of plugin V1.
- Reconfirm the official submission requirements and any host-specific location/skill behavior immediately before implementation and public submission; platform rules can change.

## External References Used for the Plan

- [Official MCP TypeScript SDK and v2 package overview](https://github.com/modelcontextprotocol/typescript-sdk)
- [MCP SDK v2 upgrade guide and output-schema behavior](https://ts.sdk.modelcontextprotocol.io/v2/migration/upgrade-to-v2)
- [MCP SDK schema libraries and structured output](https://ts.sdk.modelcontextprotocol.io/v2/advanced/schema-libraries)
- [Zod versioning and `zod/v4` compatibility](https://zod.dev/v4/versioning)
- [OpenAI plugin submission and publication flow](https://developers.openai.com/plugins/deploy/submission)
- [OpenAI remote MCP review requirements](https://developers.openai.com/plugins/deploy/app-review)
- [OpenAI plugin privacy guidelines](https://developers.openai.com/plugins/plugin-guidelines)
- [OpenAI plugin metadata reference](https://developers.openai.com/plugins/reference)
- [GDPR text, including Article 27](https://eur-lex.europa.eu/eli/reg/2016/679) and [UK ICO representative guidance](https://ico.org.uk/for-organisations/uk-gdpr-guidance-and-resources/international-transfers/receiving-personal-information-from-the-eea/)
- [India DPDP Rules, 2025 (MeitY Gazette)](https://www.meity.gov.in/static/uploads/2025/11/53450e6e5dc0bfa85ebd78686cadad39.pdf) and [Brazil LGPD (ANPD English text)](https://www.gov.br/anpd/pt-br/centrais-de-conteudo/brazilian-data-protection-law.pdf)
- [MET Norway Locationforecast terms](https://api.met.no/doc/TermsOfService) and [client guide](https://api.met.no/doc/locationforecast/HowTO)
- [OpenStreetMap ODbL use-case guidance](https://wiki.openstreetmap.org/wiki/License/Use_Cases)
- [OpenAI plugin package guide](https://developers.openai.com/plugins/build/plugins)

## Plan Status

This plan now includes a dependency-aware implementation sequence, explicit parallel-work labels, and a dated status audit. OSM candidate discovery and ERA5 historical context do not block the local core planner, but both represent V1 journeys; if either feasibility gate fails, get an explicit owner decision on the scope gap before public release. VIIRS context and GEFS remain conditional enhancements. No database is planned. The immediate code task is the Task 3 rate-limit counter regression fix; then continue local service and core-journey work before hosted setup. Before hosted work, the owner must confirm the exact Hetzner plan/region, budget, and staging/production hostnames; before real OpenAI draft work, verify publisher identity and eligible project. Before public release, complete privacy/support and source-rights review. This plan authorizes local implementation work only; hosting spend, production deployment, submission, and publication retain their stated gates.


## Next-wave evidence update — 13 October 2026

Supersedes earlier pending Linux/importer and unbounded-cache notes: Windows/Linux Node 24 aggregate checks pass (165 tests), production audit/runtime smoke pass, and Windows/Linux importer fixtures pass (3 each). Data intervals, provider deadlines, bounded fallback cache, health/shared admission controls and candidate index reuse are implemented. See docs/operations/implementation-status.md and the three next-wave reports. Ticket counts remain 6 done / 12 partial / 9 not started. Meteor reuse, live MET contact/sample, real regional OSM artifact, ERA5 account/sample, remaining numerical astronomy references, provider budgets and hosted release gates remain open. No database, global bulk import, deployment or publication was added.


## Lanes 1 and 2 — verified 13 October 2026

Two scoped implementers and an independent reviewer completed local astronomy validation and provider operational controls. Windows and clean Linux Node 24 each pass 207 tests, typecheck, build and production runtime smoke; Linux production audit has zero findings. Task 5 acceptance boxes now pass and the ticket is locally Done. Current counts: 7 Done / 11 Partial / 9 Not started (27 headings); groups 3 / 9 / 7 (19). See implementation-status.md and astronomy-validation-wave.md/provider-controls-wave.md in docs/operations.

Ruling: count Task 5 locally complete against its explicit named cases, independent reference and MCP schema gates, with extra scientific boundaries documented rather than claiming exhaustive validation — the plan does not require every field/location/date independently certified — remaining boundaries require follow-up if product claims expand.

Ruling: provider refresh/recovery is demand driven; no scheduled refresh exists to jitter, no automatic retry is added — immediate admission bounds, cache expiry and provider cooldown prevent unbounded waiting/retry traffic — adding a scheduler later requires jitter and its own fixtures.

Ruling: replace the unused ProviderRequestControls metadata with executed shared UpstreamControls and source timeout injection — all direct/planning/comparison paths must use one runtime budget — replicas still require deployment coordination. Truly abort-ignoring transports retain occupied slots until settling to prevent unbounded background work; bounded exhaustion may require a runtime restart.

Next lane 3 needs real MET contact, a known validation region/visited places and locally configured CDS access with manually accepted dataset terms. No paid processing, persistent database, deployment, commit, push or publication was added. Meteor source/radiant reuse, real artifact scale, historical sampling and hosted/privacy gates remain open.

## Historical H4 update — 13 October 2026

Task 9 remains Partial. Its H1–H4 local dependency chain now passes: strict contract, offline aggregation, verified three-place 2025 pilot, bounded runtime reader and twelfth MCP tool integrated into plans/comparisons. H5 selected-host serving/rollback/release validation and baseline/global data coverage remain open. See `docs/operations/era5-runtime-wave.md`. Windows265/265; cleanLinux263pass/2ignoredartifactskips; application/builder typecheck, build, productionruntime12tools andproductionaudit0pass. No public host connection or deployment.

## Coverage and accuracy follow-up — 14 October 2026

Approved parallel Tasks0/6,8,13/14 work is recorded in `docs/operations/coverage-accuracy-wave.md` and its scoped plan. Adaptive lunar intervals and bounded same-vintage candidate composition/indexed queries pass independent review; CI now exercises the fixed-seed100,000-row full-scan query reference. Concrete policy/Hetzner inputs remain pending, with no invented legal or host values. Counts remain12 Done/9 Partial/6 Not started. Historical acquisition, hosting, accounts and publication gates remain separate.

## Events/regional/proxy follow-up — 14 October 2026

Approved Tasks0/6,8,3/14 work adds calculated outer-planet oppositions/explicit solar alignments, on-demand mixed-vintage regional artifacts and narrowly configured single-proxy trust with cancellation work leases. See `docs/operations/events-regional-proxy-wave.md` for reviewed acceptance and actual retained-artifact/compiled/local proxy evidence. No source/global/owner/host heading closes solely from these local results; counts12 Done/9 Partial/6 Not started.

## Original acceptance reconciliation — 14 October 2026

The owner-approved closure wave audited all 27 headings and every original checkbox. See `docs/operations/v1-acceptance-audit.md` for the exact criterion ledger and semantic test mappings, `v1-data-coverage-decisions.md` for source/global decisions, and `v1-host-policy-handoff.md` for pending operator inputs. Current strict counts: **11 Done / 10 Partial / 6 Not started**; groups remain6 Done/10 Partial/3 Not started. Task4 is reopened under unchanged boundary-interface requirements; named-city IANA zones remain implemented. Any change to that requirement needs explicit scope reconciliation.

Local completion does not establish global candidate/history coverage or actual hosted/assistant/policy acceptance. Universal relation/polygon completeness, direct candidate plans and independent certification of every supported year are not additional original gates. Checkboxes above reflect reviewed local evidence while compound missing clauses remain unchecked. No deployment, acquisition or publication in this wave.

## Data gap wave — 14 October 2026

Approved Tasks0/6/8 and Task4 recommendation work is recorded in `docs/operations/data-gap-wave.md`. Two licensed typical solar-longitude intervals are enabled as source-only reference metadata, with no date conversion/overlap/radiant-domain extension. Global build protocol remains proposed and measured worldwide coverage unknown. Task4 replacement wording is proposed only; original acceptance and counts11 Done/10 Partial/6 Not started remain unchanged. Existing CI now exercises the new metadata in its compiled regional runtime fixture. No deployment or data acquisition.

## Local evidence wave — 14 October 2026

The owner accepted named-place timezone V1 with boundary lookup deferred. Task4 wording and C1/C4 checks are reconciled using timezone-acceptance-wave.md; prior original text remains in the historical audit. Current12 Done/9 Partial/6 Not started. Local-evidence-wave.md records exact retained Bhutan filter/partition equality, bounded Windows lifecycle fixes and meteor conversion investigation with no guessed dates. Existing Python discovery includes the new tests; no source acquisitions or deployment.

## Acquisition proposal and meteor matrix — 14 October 2026

Approved preparation is documented in `docs/operations/data-acquisition-proposal.md`, `global-spot-acquisition-proposal.md`, `historical-acquisition-proposal.md` and `meteor-coverage-matrix.md`. Exact selected sources/jobs, budgets and stop conditions are proposed only. Generic new-region tooling remains a pre-acquisition prerequisite; no download authorization is inferred. Original acceptance boxes/counts12 Done/9 Partial/6 Not started stay unchanged.
