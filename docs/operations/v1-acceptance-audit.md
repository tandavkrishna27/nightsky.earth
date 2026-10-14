# V1 original acceptance audit — 14 October 2026

Audited worktree `.worktrees/plugin-v1`, branch `codex/plugin-v1`, source revision `6e4cf4ca18f57f04ea53bdca81569bfb2ac4be82`. This is the original-wording audit snapshot; later accepted dispositions are recorded at the end. Only this audit file was owned by its audit lane. All 27 original headings and every original checkbox are reproduced below with stable identities. Task 0 has six independent gates in addition to its closing checkbox. The wording is retained so compound requirements are not hidden by a short label. Named fixture clauses have their own subordinate ledger.

`satisfied` means the required local implementation/evidence is present and reviewed; it is not a fresh full-suite pass claim. `partial` means some required clauses remain. `open` means required external/implementation evidence is absent. `conditional-NA` means the original condition is currently not enabled; it is not removal of a required journey. The controller owns final Windows/Linux/CI verification. Historical test results are identified in `docs/operations/ci-verification.md` (latest recorded implementation `7e7bf400`, Windows464/Ubuntu461 passed, differing explicit artifact skips). No tests, deployment, retrieval, account changes, external messages, commit or push were performed in this audit.

Applicable instruction search found no repository/ancestor AGENTS.md. Read review and verification-before-completion skills; applied acceptance-by-criterion/evidence-before-claims. No nested agents or runtime edits.

## Historical corrections to the pre-reconciliation closure matrix

- Task 4 is **Partial under the unchanged original wording**: named-city IANA lookup is implemented, but `resolvesIanaZoneAtBoundary` and coordinate-to-boundary production interface are absent. `source-spikes.md` explicitly excludes timezone polygons. Do not implement a new polygon service solely to satisfy a stale sentence: first reconcile the named-place-only scope through an explicit reviewed disposition. A test name alias cannot prove polygon accuracy.
- Task 6 all-years independent certification is **scope creep**. The original requirement is selected fixed authoritative reference cases, documented tolerance and explicit unsupported boundaries. Supported bounded calculations with unknown grazing cases do not require certifying every year/location. Complete licensed meteor seasons and drift throughout claimed windows are genuine remaining product/source requirements; NASA maxima and GMN fit windows are not seasons.
- Task 8 completeness of every OSM relation/polygon membership is **scope creep** as a universal blocker. The original requires measured candidate types, provenance, access/darkness unknown, repeatable artifacts and intended global baseline or owner-approved regional/unsupported scope. Relations may be needed to achieve that measured coverage, but universal geometry completeness is not stated. Direct candidate plans also are not an original Task8 acceptance: planner explicitly requires resolved named `placeId`.
- Task 0D is locally satisfied against its actual baseline sampling condition: distributed MET (including later Arctic/ocean evidence) and SWPC shape/time/limits are documented. GEFS remains optional. Global forecast accuracy certification and selected-host operation are not 0D blockers.
- Task 0E current unknown/no-darkness-ranking branch satisfies the stated fallback. Proxy acquisition/calibration is conditional future work, not mandatory before local or public unknown output. Keep the required public scope disclosure/owner decision.
- Source/global coverage for candidates and historical months-ahead journeys remains genuine. Tasks0B/8/9/15 require approved narrower/unsupported scope if feasibility fails. Do not silently count regional/sample-only artifacts as global product completion.

## Task 0 independent gate clause ledger

### 0A — partial

**Gate 0A — Source rights register (`docs/operations/data-sources.md`):** Record each exact product/dataset, license, attribution, allowed storage/derivation, geographic coverage, update cadence, request limits, operating work, and fallback. Include astronomy-library license/reference cases, eclipse elements/ΔT source, meteor-calendar reuse terms, multilingual gazetteer, timezone boundaries, and official dark-sky/land-manager sources. Record World Atlas's noncommercial restriction and that VIIRS radiance is not direct astronomical sky brightness. For OSM-derived data, classify the database relationship under ODbL and document attribution, any applicable share-alike terms, and whether a derived-database offer/publication obligation applies before ingest or publication. **Pass:** every required V1 journey has a permitted source path or an explicit unsupported/partial behavior.

Evidence: docs/operations/data-sources.md; source-spikes.md; host-decision.md; events-season-expansion.md; historical-baseline-wave.md.

Exact enabled-source products/licenses/attribution and permitted partial states are recorded. Astronomy/GeoNames/MET/SWPC/ERA5/NASA peak/GMN paths exist. Required remaining: concrete ODbL database classification and offer duties before candidate publication; full meteor season source/radiant coverage; finish exact source register fields/refresh dispositions. Boundary polygons are not shipped; do not invent their data rights. World Atlas/VIIRS meaning and official land-manager links are exclusion/candidate context, not access guarantees.

### 0B — partial

**Gate 0B — OSM scale spike (`docs/operations/source-spikes.md`):** Measure one selected country/region extract as a data-build job separate from the small shared Hetzner runtime (initial target 2 vCPU/4 GB). Record source file size, object count, filtered rows, index size, build duration and machine, query p50/p95, one-off processing cost, refresh cost, and a labeled global-scale estimate. Do not download/import planet data or run a bulk build on the production request path. Produce a versioned artifact with checksum, vintage, ODbL metadata and coverage manifest; measure whether serving/loading it fits the runtime with safe memory/disk headroom. **Pass:** repeatable evidence supports the intended global baseline within the owner-approved operating/build budget. If it does not, named-place resolution can remain global, but candidate-search coverage must be reported by region and the owner must approve the narrower claim before public submission. The MCP/API service can launch without a global OSM index; candidate search remains unavailable/partial until this gate passes.

Evidence: docs/operations/data-sources.md; source-spikes.md; host-decision.md; events-season-expansion.md; historical-baseline-wave.md.

Selected India/Bhutan extracts, object/filtered rows, source bytes, artifact hashes/vintage, repeat builds and local timings exist in offline-extract/spot-scaling waves. Remaining: complete global estimate/refresh and owner-approved build/operating budget, intended global baseline or explicitly approved regional public claim, actual selected-host safe disk/RSS fit. Global planet import is forbidden and not required.

### 0C — partial

**Gate 0C — ERA5 access and statistic spike (`docs/operations/source-spikes.md`):** Retrieve a small monthly-means-by-hour sample. Record variable, coverage, resolution, size, aggregation, processing/storage estimate, registration/access requirements, retrieval limits, and known reanalysis/grid limitations relevant to the user claim. Use only statistics the product actually supplies; do not derive percentiles from a multi-year mean. **Pass:** a lawful, explainable and affordable historical-context result is specified, or months-ahead climatology is marked unsupported for the launch.

Evidence: docs/operations/data-sources.md; source-spikes.md; host-decision.md; events-season-expansion.md; historical-baseline-wave.md.

Owner-selected hourly samples supersede monthly-means-only method; variable/grid/units/access/size/limitations and offline statistic are documented in source-spikes/H1–H4. Remaining: lawful reliable agreed release baseline/global claim and approved processing/refresh/host fit, or explicit launch-unsupported scope decision. New retrieval is not authorized; do not count pipeline tests as acquired baseline.

### 0D — satisfied

**Gate 0D — Forecast source spike (`docs/operations/source-spikes.md`):** Sample MET Norway at globally distributed coordinates and record available/missing cloud, dew point, wind and other fields by horizon. For NOAA GEFS, record decoder feasibility, issue/valid-time alignment, units, ensemble spread, caching, and operating work. Check NOAA SWPC product shape, issue/valid intervals, attribution and latitude coverage at representative locations. **Pass:** baseline forecast and aurora behavior and missing fields are documented; GEFS is either ready against explicit criteria or remains a non-blocking optional source.

Evidence: docs/operations/data-sources.md; source-spikes.md; host-decision.md; events-season-expansion.md; historical-baseline-wave.md.

MET distributed shapes/missing fields/horizons and expiry-respecting refreshes documented in source-spikes/events-weather-coverage-wave; SWPC JSON/issue/valid/latitude limitations sampled. GEFS decoder/time/units/spread/cache/operations are not ready and explicitly optional/unavailable. Hosted budgets/accuracy calibration belong to their actual criteria; no independent second-model claim.

### 0E — satisfied

**Gate 0E — Darkness-context proxy spike (`docs/operations/source-spikes.md`):** Evaluate whether NASA Black Marble/VIIRS or another permitted source can provide a useful, globally available relative ground-light-radiance context for text candidate discovery. Record exact product, license, vintage, coverage/resolution, processing, and a representative sample; distinguish emitted ground radiance from astronomical sky brightness and validate any low/medium/high bins before use. **Pass:** either specify a cautiously labeled regional radiance proxy for `get_location_context`, or explicitly leave darkness unknown and do not rank candidates as dark. This gate does not permit a Bortle/SQM or “dark sky” claim.

Evidence: docs/operations/data-sources.md; source-spikes.md; host-decision.md; events-season-expansion.md; historical-baseline-wave.md.

Current get_location_context explicit unknown darkness plus typed/distance/completeness sorting and radiance caveat satisfy fallback. VIIRS exact sample/bins/calibration only required if enabling proxy. Public chosen fallback/scope decision remains to record; no Bortle/SQM promise.

### 0F — open

**Gate 0F — Hosting decision (`docs/operations/host-decision.md`):** Hetzner is the chosen hosting direction, but local implementation does not depend on purchasing or configuring a host. Before staging, select the exact Node-capable plan/region and owner-approved operating ceiling; record the separate staging hostname and permanent production hostname/full MCP URL, deploy/rollback method, cost basis, request-control design, and application/edge log redaction and retention. The existing Netlify configuration publishes `dist/public` as a static site and does not run Express. **Pass for hosted work:** these decisions are recorded; Task 3C verifies and freezes the production URL. No purchase or paid build is implied by this plan.

Evidence: docs/operations/data-sources.md; source-spikes.md; host-decision.md; events-season-expansion.md; historical-baseline-wave.md.

Hetzner direction and local deploy/control recipes exist. Exact plan/region/staging+production hostnames/full URL, approved ceilings, actual cost and app/edge retention are missing. Owner says choices exist but has not supplied/verifiably recorded them. No hosting decision closes from a local container.

## Task 0: Complete independent source, scale, and hosting gates

Evidence bundle: docs/operations/data-sources.md; source-spikes.md; host-decision.md; events-season-expansion.md; historical-baseline-wave.md.

### 0.C1 — partial

Original execution-plan line 119: Close each gate with its evidence and named decision. A failed gate blocks only the dependent capability unless it prevents the baseline MCP endpoint; record the user-facing partial/unsupported behavior before continuing. Do not incur paid build or hosting costs until the owner approves the applicable budget.

Disposition: 0A–0F are independently audited below. Close only dependent gates, not the entire task from local artifacts.

## Task 1: Prove SDK, runtime, schema, and HTTP compatibility

Evidence bundle: package.json; server/mcp/route.ts; tests/mcp/transport-smoke.test.ts; docs/operations/mcp-sdk-compatibility.md; offline-operations-readiness.md.

### 1.C1 — satisfied

Original execution-plan line 129: Verify the selected SDK v2 version’s Node requirement and Express 4 compatibility. Test `@modelcontextprotocol/server` with the official Express integration or the Node transport wrapper.

Disposition: Required local behavior is implemented in the evidence bundle; named tests/contract behavior listed below. Final full-suite evidence remains controller-owned.

### 1.C2 — satisfied

Original execution-plan line 130: If using the Express adapter, test Host-header validation with a test hostname and reject unexpected Host values. Recheck the exact allowlist and reverse-proxy configuration after Task 0F selects staging and production hostnames.

Disposition: Local Host rejection is tested; rechecking actual allowlists/proxy is an explicitly later hosted condition under 0F/3B/14.

### 1.C3 — satisfied

Original execution-plan line 131: Test Zod compatibility without changing `shared/schema.ts`: update Zod to a compatible 3.25+ release and import MCP schemas from `zod/v4`, or document and test a smaller equivalent boundary. Do not migrate existing database schemas unless the compatibility test proves it necessary.

Disposition: Required local behavior is implemented in the evidence bundle; named tests/contract behavior listed below. Final full-suite evidence remains controller-owned.

### 1.C4 — satisfied

Original execution-plan line 132: Exercise one `initialize`, `tools/list`, valid `tools/call`, invalid input, and concurrent stateless requests against the selected transport.

Disposition: Required local behavior is implemented in the evidence bundle; named tests/contract behavior listed below. Final full-suite evidence remains controller-owned.

### 1.C5 — satisfied

Original execution-plan line 133: Confirm the Express JSON/urlencoded middleware in `server/index.ts` does not consume `/mcp` request bodies before the SDK handles them. Mount the MCP route before the parser or explicitly bypass the parser for that route.

Disposition: Required local behavior is implemented in the evidence bundle; named tests/contract behavior listed below. Final full-suite evidence remains controller-owned.

### 1.C6 — satisfied

Original execution-plan line 134: Record package versions, Node version, transport mode, route-parser handling, and the reason for the chosen integration in `docs/operations/mcp-sdk-compatibility.md`.

Disposition: Required local behavior is implemented in the evidence bundle; named tests/contract behavior listed below. Final full-suite evidence remains controller-owned.

### 1.C7 — satisfied

Original execution-plan line 135: Pass when `tests/mcp/transport-smoke.test.ts` passes and MCP Inspector can initialize and list the smoke tool at the local route without affecting `/api/news` or the website. Do not block this local proof on production-host or recurring-budget selection.

Disposition: Required local behavior is implemented in the evidence bundle; named tests/contract behavior listed below. Final full-suite evidence remains controller-owned.

## Task 2: Define stable structured contracts and the offline test harness

Evidence bundle: shared/nightsky/*.ts; tests/shared/contracts.test.ts; tests/shared/format.test.ts; tests/mcp/result-budget.test.ts; .github/workflows/nightsky-v1-checks.yml; docs/operations/ci-verification.md.

### 2.C1 — satisfied

Original execution-plan line 145: Add tests named `rejectsInvalidCoordinatesInPlaceRecord`, `rejectsInvalidTimeWindow`, `resolvesTonightAcrossLocalMidnight`, `acceptsPartialWeatherWithMissingFields`, `preservesTwoForecastSources`, `rejectsHistoricalDataMarkedAsForecast`, `requiresProvenanceForExternalValues`, `rejectsOversizedComparison`, and `returnsAttributionInEveryResult`.

Disposition: Required local behavior is implemented in the evidence bundle; named tests/contract behavior listed below. Final full-suite evidence remains controller-owned.

| Named subcriterion | Disposition | Concrete fixture / required remaining evidence |
|---|---|---|
| 2.C1.T1 `rejectsInvalidCoordinatesInPlaceRecord` | satisfied | tests/shared/contracts.test.ts |
| 2.C1.T2 `rejectsInvalidTimeWindow` | satisfied | tests/shared/contracts.test.ts |
| 2.C1.T3 `resolvesTonightAcrossLocalMidnight` | satisfied | tests/shared/contracts.test.ts |
| 2.C1.T4 `acceptsPartialWeatherWithMissingFields` | satisfied | tests/shared/contracts.test.ts |
| 2.C1.T5 `preservesTwoForecastSources` | satisfied | tests/shared/contracts.test.ts |
| 2.C1.T6 `rejectsHistoricalDataMarkedAsForecast` | satisfied | tests/shared/contracts.test.ts |
| 2.C1.T7 `requiresProvenanceForExternalValues` | satisfied | tests/shared/contracts.test.ts |
| 2.C1.T8 `rejectsOversizedComparison` | satisfied | tests/shared/contracts.test.ts |
| 2.C1.T9 `returnsAttributionInEveryResult` | satisfied | tests/shared/contracts.test.ts |

### 2.C2 — satisfied

Original execution-plan line 146: Define the shared minimum fields: model-visible `PlaceRef` carries a versioned ID, display name, time zone, provenance and index vintage; keep a user-named place's resolved latitude/longitude in a server-private `ResolvedPlace` record for calculations and provider calls. Public candidate records may expose their mapped coordinates and navigation links because the user needs them to identify and reach that public candidate; never echo coordinates derived from host location metadata as the user's exact location. `TimeWindow` carries UTC start/end plus IANA zone and a documented maximum query range; `SourceRecord` carries source name/link, model/product, issue/valid time, data class and vintage where available. Keep internal IDs and retrieval timestamps out of model-visible results unless they are needed for provenance or freshness decisions; justify each visible field in `tool-contracts.md`. Prefer provider issue/update and valid times; include a retrieval/check time only when the provider supplies no adequate freshness time and the user needs it, with the reason documented in `tool-contracts.md`. `Availability` distinguishes available/partial/stale/unavailable/not-covered/unknown/unsupported/out-of-horizon with a reason. Define locale-aware date/time and unit formatting; preserve source-name scripts where available, and do not promise translated source content that is not provided.

Disposition: Required local behavior is implemented in the evidence bundle; named tests/contract behavior listed below. Final full-suite evidence remains controller-owned.

### 2.C3 — satisfied

Original execution-plan line 147: Define `WeatherForecast` as one source/model record containing time-stamped values, units, forecast lead and optional supported fields; include per-source missing-field reasons. `NightConditionsResult` is an array of forecasts, never an average.

Disposition: Required local behavior is implemented in the evidence bundle; named tests/contract behavior listed below. Final full-suite evidence remains controller-owned.

### 2.C4 — satisfied

Original execution-plan line 148: Define `AstronomyWindowResult` with local twilight/darkness intervals and polar state; `TargetVisibilityResult` with target identity and rise/set/altitude/azimuth/Moon separation intervals; `EventResult` with event type, source/vintage, start/peak/end and local visibility state; `PlanResult` with goal, resolved place, requested window, concise summary, candidate windows, factors, sources, gaps, caveats and preparation.

Disposition: Required local behavior is implemented in the evidence bundle; named tests/contract behavior listed below. Final full-suite evidence remains controller-owned.

### 2.C5 — satisfied

Original execution-plan line 149: Define tool-input contracts separately from output/domain types. `resolve_place` is the only resolver and accepts exactly one valid mode: a non-empty `placeQuery` for a named observing destination with the flag omitted or false, or `useApproximateHostLocation: true` with no `placeQuery`. Reject both active modes and reject neither mode. The true flag is the assistant's explicit invocation signal for a current-area request. Every other location-aware tool accepts only a versioned `placeId`. No tool schema requests latitude/longitude or a street address; reject coordinate-shaped `placeQuery` text on every route and ask for a named area instead. When the flag is true, use the host hint only for that resolution, return a named `PlaceRef`/`placeId`, never return the hint coordinates, and discard the hint after the request. If the hint is absent, return `availability: unavailable` with reason `host-location-unavailable` and ask for a named place; if the flag is absent/false, ignore host location metadata. On hosts without a documented location side channel, the flag must produce the same named-place request. `PlanObservingSessionInput` requires `placeId` and carries activity, date window, optional target/experience/equipment, locale and unit preference; `CompareOptionsInput` accepts up to five `placeId`/date/activity options.

Disposition: Required local behavior is implemented in the evidence bundle; named tests/contract behavior listed below. Final full-suite evidence remains controller-owned.

### 2.C6 — satisfied

Original execution-plan line 150: Record per-source forecast horizons and per-field data classes. When forecast is out of horizon, the result must say “forecast not available yet” and may return historical context only as a separate result.

Disposition: Required local behavior is implemented in the evidence bundle; named tests/contract behavior listed below. Final full-suite evidence remains controller-owned.

### 2.C7 — satisfied

Original execution-plan line 151: Set a measured structured-output size budget and per-tool result caps. Preserve provenance and caveats when trimming optional hourly detail; never silently truncate required source attribution.

Disposition: Required local behavior is implemented in the evidence bundle; named tests/contract behavior listed below. Final full-suite evidence remains controller-owned.

### 2.C8 — satisfied

Original execution-plan line 152: Freeze the V1 tool names, descriptions, input/output fields, annotations, and result-size limits in `docs/operations/tool-contracts.md` before Task 3. Keep the current 12-tool inventory unless a feasibility finding requires an explicit owner decision.

Disposition: Required local behavior is implemented in the evidence bundle; named tests/contract behavior listed below. Final full-suite evidence remains controller-owned.

### 2.C9 — satisfied

Original execution-plan line 153: Assert that two forecasts remain two distinct records, optional weather fields remain absent when the source lacks them, and `historical` cannot be relabeled as `forecast`.

Disposition: Required local behavior is implemented in the evidence bundle; named tests/contract behavior listed below. Final full-suite evidence remains controller-owned.

### 2.C10 — satisfied

Original execution-plan line 154: Implement the schemas and an aggregate test entry point using `node:test` through the installed `tsx` runtime.

Disposition: Required local behavior is implemented in the evidence bundle; named tests/contract behavior listed below. Final full-suite evidence remains controller-owned.

### 2.C11 — satisfied

Original execution-plan line 155: Add scripts `test`, `check`, and keep the existing `build`; ensure the test command is shell-independent on Windows and Linux.

Disposition: Required local behavior is implemented in the evidence bundle; named tests/contract behavior listed below. Final full-suite evidence remains controller-owned.

### 2.C12 — satisfied

Original execution-plan line 156: Add a GitHub Actions matrix for Node.js 24 on Windows and Linux that runs `npm ci`, `npm test`, `npm run check`, and `npm run build`. On Linux, install `scripts/osm/requirements.txt` and run the OSM importer unit tests so the pinned `osmium` dependency is not silently skipped.

Disposition: Required local behavior is implemented in the evidence bundle; named tests/contract behavior listed below. Final full-suite evidence remains controller-owned.

### 2.C13 — satisfied

Original execution-plan line 157: Pass when the CI matrix and a clean local install on both operating systems complete with zero failed tests; the contract output lists all named cases. If the project’s required GitHub Actions permissions or runner constraints are unavailable, document the equivalent reproducible CI gate.

Disposition: Required local behavior is implemented in the evidence bundle; named tests/contract behavior listed below. Final full-suite evidence remains controller-owned.

## Task 3: Implement the read-only MCP endpoint and tool registry

Evidence bundle: server/mcp/{index,route,registerTools,metadata}.ts; server/requestLogging.ts; tests/mcp/{route-body,initialize,tool-metadata,metadata-adapter,metadata-privacy,provider-controls,transport-smoke}.test.ts; docs/operations/mcp-data-flow-and-logging.md.

### 3.C1 — satisfied

Original execution-plan line 171: Ensure a request rejected by the rate-limit check never consumes an `activeRequests` slot, and every slot increment for an admitted request is released when its handler settles, including thrown-handler paths. Add a regression test proving rate-limited requests do not cause a later request to receive a false concurrency rejection.

Disposition: Required local behavior is implemented in the evidence bundle; named tests/contract behavior listed below. Final full-suite evidence remains controller-owned.

### 3.C2 — satisfied

Original execution-plan line 172: Implement the registry boundary and smoke-test transport. Do not expose placeholder domain tools. Add each named tool in its owning task only after its handler and output schema pass.

Disposition: Required local behavior is implemented in the evidence bundle; named tests/contract behavior listed below. Final full-suite evidence remains controller-owned.

### 3.C3 — satisfied

Original execution-plan line 173: For each registered tool, define Zod v4 `inputSchema` and `outputSchema`, a useful accurate description, explicit boolean `readOnlyHint`, `destructiveHint` and `openWorldHint`, and a brief rationale for the `openWorldHint` value. Do not determine `openWorldHint` only from whether the handler calls an external provider.

Disposition: Required local behavior is implemented in the evidence bundle; named tests/contract behavior listed below. Final full-suite evidence remains controller-owned.

### 3.C4 — satisfied

Original execution-plan line 174: Set shared server instructions with the cross-tool limits in the first 512 characters: candidate places do not prove access/safety, history is not a forecast, forecast sources stay separate, missing inputs must remain unknown rather than guessed, and user-supplied coordinates must never be converted into a place name; ask for a named destination. Tell the assistant to set `useApproximateHostLocation` only when the user explicitly requests “near me” or their current area; otherwise it must provide a named destination. The server ignores host-location metadata unless this flag is true.

Disposition: Required local behavior is implemented in the evidence bundle; named tests/contract behavior listed below. Final full-suite evidence remains controller-owned.

### 3.C5 — satisfied

Original execution-plan line 175: Return validated `structuredContent` plus concise text for the model. Test that output schemas validate the returned data and tool metadata contains no placeholder description or unsupported claim.

Disposition: Required local behavior is implemented in the evidence bundle; named tests/contract behavior listed below. Final full-suite evidence remains controller-owned.

### 3.C6 — satisfied

Original execution-plan line 176: Represent valid-but-incomplete provider outcomes in structured results with an availability state and reason. Use protocol errors for invalid input or server faults; never include stack traces or secrets in user-visible error text.

Disposition: Required local behavior is implemented in the evidence bundle; named tests/contract behavior listed below. Final full-suite evidence remains controller-owned.

### 3.C7 — satisfied

Original execution-plan line 177: Add route tests for `initialize`, `tools/list`, valid call, malformed JSON-RPC, invalid arguments, body-parser bypass, unexpected Host headers, required boolean annotations on every tool, and error responses without stack traces. Assert the `search_sky_events` annotation matches the live-JPL setting frozen in `tool-contracts.md`.

Disposition: Required local behavior is implemented in the evidence bundle; named tests/contract behavior listed below. Final full-suite evidence remains controller-owned.

### 3.C8 — satisfied

Original execution-plan line 178: Define and test minimum exposure controls: source-specific timeouts, a shared cache interface with provider-approved TTLs, per-provider/global request and cost caps, bounded concurrency, and upstream backoff. Start with localhost-only access; do not expose staging until these controls and redacted logging are active.

Disposition: Required local behavior is implemented in the evidence bundle; named tests/contract behavior listed below. Final full-suite evidence remains controller-owned.

### 3.C9 — satisfied

Original execution-plan line 179: Document the data-flow/log policy: by default, do not log full `placeQuery`, input arguments, request `_meta`, host location fields, anonymized subject/session IDs, or exact coordinates. For “near me,” the assistant must set `useApproximateHostLocation: true`; only then may the resolver use a documented host location hint in memory, return a named place, and discard the hint. If the flag is absent, ignore the hint. Use OpenAI's documented `openai/subject` only for short-lived per-user rate-limit counters on that route; do not retain raw identifiers in logs or build query histories. State operational-log and rate-counter retention; include source attribution in both `structuredContent` and concise text; maintain the complete host-metadata/upstream recipient list for the privacy page.

Disposition: Required local behavior is implemented in the evidence bundle; named tests/contract behavior listed below. Final full-suite evidence remains controller-owned.

### 3.C10 — satisfied

Original execution-plan line 180: Keep `/api/news`, dynamic sitemap, Vite development middleware, and static website serving functional.

Disposition: Required local behavior is implemented in the evidence bundle; named tests/contract behavior listed below. Final full-suite evidence remains controller-owned.

### 3.C11 — satisfied

Original execution-plan line 181: Pass when `npm test` passes route tests and MCP Inspector can list/call the smoke tool; malformed or oversized requests are bounded and safe, all annotations are explicit, and the server instructions begin with the required cross-tool limits.

Disposition: Required local behavior is implemented in the evidence bundle; named tests/contract behavior listed below. Final full-suite evidence remains controller-owned.

## Task 3B: Check the hosted OpenAI connection early

Evidence bundle: docs/platforms/early-chatgpt-smoke.md; tests/platforms/host-matrix.md; docs/operations/host-decision.md.

### 3B.C1 — open

Original execution-plan line 191: Use a separate staging hostname for the minimal smoke tool; do not expose provider-backed tools or user data yet. Define the actual access mechanism: use the current OpenAI connector egress allowlist where supported, keep local MCP Inspector access separate, apply strict request/size limits, and do not treat caller IP as user identity. If a client cannot reach an allowlisted staging host, record that route as untested instead of weakening the control.

Disposition: Prepared procedure/template is not the required observed action. Requires owner/source/host/account/real-world gate stated in the original criterion; no action authorized by this audit.

### 3B.C2 — open

Original execution-plan line 192: Check which ChatGPT developer/testing route is available to the intended account, then connect the smoke tool in a fresh ChatGPT session. Record date, account/region, negotiated protocol version, tool listing/call result, and limitations. Do not treat MCP Inspector success as a host connection test; test Codex in the environment that will actually call the service and record its network path separately.

Disposition: Prepared procedure/template is not the required observed action. Requires owner/source/host/account/real-world gate stated in the original criterion; no action authorized by this audit.

### 3B.C3 — open

Original execution-plan line 193: If the selected SDK version fails host interoperability, use Task 1's compatibility decision and a documented supported SDK fallback. Do not change either hostname after it is fixed in the package plan.

Disposition: Prepared procedure/template is not the required observed action. Requires owner/source/host/account/real-world gate stated in the original criterion; no action authorized by this audit.

### 3B.C4 — open

Original execution-plan line 194: Pass when the ChatGPT route completes the minimal call and Codex is either tested through its intended client path or explicitly marked pending; no claim is made for an inaccessible route. Full tool/package scans and workflow testing happen after the location resolver exists and again against production.

Disposition: Prepared procedure/template is not the required observed action. Requires owner/source/host/account/real-world gate stated in the original criterion; no action authorized by this audit.

## Task 3C: Fix the OpenAI publisher and production endpoint before the real draft

Evidence bundle: docs/platforms/openai-publisher-and-domain.md; docs/operations/policy-host-wave.md; host-decision.md.

### 3C.C1 — open

Original execution-plan line 204: Decide whether the verified publisher is an individual or business; verify the identity and the owner’s package-submission role before creating a plugin draft.

Disposition: Prepared procedure/template is not the required observed action. Requires owner/source/host/account/real-world gate stated in the original criterion; no action authorized by this audit.

### 3C.C2 — open

Original execution-plan line 205: Verify that the selected OpenAI organization/project has a residency configuration eligible for MCP plugin submission; current review guidance excludes EU data-residency projects. Keep this check before Task 4B.

Disposition: Prepared procedure/template is not the required observed action. Requires owner/source/host/account/real-world gate stated in the original criterion; no action authorized by this audit.

### 3C.C3 — open

Original execution-plan line 206: Verify and freeze the production HTTPS hostname/full `/mcp` URL and the separate staging hostname selected at Gate 0F. The plugin package and real draft use the production URL; staging is used only for developer-mode and pre-promotion checks.

Disposition: Prepared procedure/template is not the required observed action. Requires owner/source/host/account/real-world gate stated in the original criterion; no action authorized by this audit.

### 3C.C4 — open

Original execution-plan line 207: Confirm the production hostname can serve the exact `/.well-known/openai-apps-challenge` token path after the dashboard creates the token. Do not replace another plugin’s token at a shared challenge URL; select an eligible parent origin or a distinct hostname if needed.

Disposition: Prepared procedure/template is not the required observed action. Requires owner/source/host/account/real-world gate stated in the original criterion; no action authorized by this audit.

### 3C.C5 — open

Original execution-plan line 208: Pass when identity, project eligibility, the Gate 0F host choices, frozen full URL, publisher support contact owner, and challenge-host setup are recorded. Do not create a temporary or scratch plugin on the production hostname.

Disposition: Prepared procedure/template is not the required observed action. Requires owner/source/host/account/real-world gate stated in the original criterion; no action authorized by this audit.

## Task 4: Implement place resolution and local time zones

Evidence bundle: server/places/{geonames,index}.ts; server/nightsky/time.ts; scripts/refresh-geonames.ts; scripts/geonames-supplement.ts; tests/places/geonames.test.ts; tests/nightsky/time.test.ts; docs/operations/geonames-index.md; source-spikes.md.

### 4.C1 — partial

Original execution-plan line 218: Test `returnsUniquePlaceMatch`, `returnsAmbiguousMatchesWithoutChoosing`, `returnsNoMatch`, `requiresCountryQualifierWhenNeeded`, `matchesNonLatinAliasesWhenAvailable`, `rejectsCoordinateTextOnEveryHost`, `resolvesExplicitHostHintToNamedPlace`, `returnsLocationUnavailableWhenHintAbsent`, `ignoresHostHintWithoutFlag`, `rejectsMalformedGazetteerRow`, `resolvesIanaZoneAtBoundary`, `resolvesZoneAcrossDateLine`, `rejectsOutOfRangeCoordinates`, `returnsStalePlaceIdWithReresolvePath`, and `formatsLocalTimeAcrossDst`.

Disposition: Most named fixtures exist; resolvesIanaZoneAtBoundary is absent. rejectsOutOfRangeCoordinates is covered by schema validation rather than a like-named place fixture. The produced coordinate-to-zone interface is replaced by named-place zones without explicit acceptance reconciliation.

| Named subcriterion | Disposition | Concrete fixture / required remaining evidence |
|---|---|---|
| 4.C1.T1 `returnsUniquePlaceMatch` | satisfied | tests/places/geonames.test.ts |
| 4.C1.T2 `returnsAmbiguousMatchesWithoutChoosing` | satisfied | tests/places/geonames.test.ts |
| 4.C1.T3 `returnsNoMatch` | satisfied | tests/places/geonames.test.ts |
| 4.C1.T4 `requiresCountryQualifierWhenNeeded` | satisfied | tests/places/geonames.test.ts |
| 4.C1.T5 `matchesNonLatinAliasesWhenAvailable` | satisfied | tests/places/geonames.test.ts |
| 4.C1.T6 `rejectsCoordinateTextOnEveryHost` | satisfied | tests/places/geonames.test.ts |
| 4.C1.T7 `resolvesExplicitHostHintToNamedPlace` | satisfied | tests/places/geonames.test.ts |
| 4.C1.T8 `returnsLocationUnavailableWhenHintAbsent` | satisfied | tests/places/geonames.test.ts |
| 4.C1.T9 `ignoresHostHintWithoutFlag` | satisfied | tests/places/geonames.test.ts |
| 4.C1.T10 `rejectsMalformedGazetteerRow` | satisfied | tests/places/geonames.test.ts |
| 4.C1.T11 `resolvesIanaZoneAtBoundary` | partial | Absent original behavior: named GeoNames zone lookup replaces boundary lookup; reviewed year-specific peaks replace recurring meteor seasons. See required scope/source gap. |
| 4.C1.T12 `resolvesZoneAcrossDateLine` | satisfied | tests/places/geonames.test.ts |
| 4.C1.T13 `rejectsOutOfRangeCoordinates` | satisfied | tests/shared/contracts.test.ts rejectsInvalidCoordinatesInPlaceRecord uses resolvedPlaceSchema with latitude91/longitude181. Private-record coordinate range validation is satisfied; timezone polygon boundary resolution remains explicitly partial. |
| 4.C1.T14 `returnsStalePlaceIdWithReresolvePath` | satisfied | tests/places/geonames.test.ts |
| 4.C1.T15 `formatsLocalTimeAcrossDst` | satisfied | tests/nightsky/time.test.ts |

### 4.C2 — satisfied

Original execution-plan line 219: Build a versioned gazetteer/time-zone refresh process with source, vintage, attribution and error reporting. Do not call public Nominatim once per user keystroke. Make `resolve_place` return the `placeId` used by subsequent tools; do not repeat the free-text location on plan, forecast, astronomy, or candidate-search calls.

Disposition: Versioned GeoNames pipeline and timezone fields/attribution exist; geographic polygon refresh is not implemented. This row is satisfied for named-place refresh only, subject to the explicit boundary discrepancy in 4.C1/C4.

### 4.C3 — satisfied

Original execution-plan line 220: Use namespaced place IDs tied to source identity and index vintage. On retired or incompatible IDs, return `stale`/`not-found` plus a re-resolve path. Preserve ambiguity for clarification; keep coordinates in server-private resolution records and expose them only if a later user-facing task demonstrably needs them.

Disposition: Versioned IDs and stale behavior are implemented; resolved coordinates remain private.

### 4.C4 — partial

Original execution-plan line 221: Record time-zone boundary data and its license/attribution obligations in the source register. Pass when `npm test` passes the place/time cases and no failed time-zone lookup silently falls back to UTC.

Disposition: No silent UTC fallback; IANA/GeoNames sources recorded. Original boundary dataset/coordinate lookup requirement is not fulfilled; source-spikes explicitly excludes timezone polygons. Resolve scope explicitly before restoring Done.

## Task 4B: Scan the real OpenAI draft's location contract before adding the full tool set

Evidence bundle: server/plugin.ts; server/mcp/registerTools.ts; tests/mcp/resolver-only.test.ts; docs/platforms/location-tool-scan.md; docs/operations/offline-operations-readiness.md.

### 4B.C1 — open

Original execution-plan line 231: Build the minimal production release with only the completed `resolve_place` handler after that same release passes staging MCP smoke, logging, and access-control checks. Before connecting the real draft or accepting scan/reviewer traffic, apply and verify production application and edge/reverse-proxy log redaction and bounded-retention settings using nonpersonal synthetic requests; record the evidence. If the host cannot meet the approved logging policy, return to Gate 0F before connecting the draft. Keep the production tool registry limited to `resolve_place` until Task 14 promotes the full V1 release.

Disposition: Prepared procedure/template is not the required observed action. Requires owner/source/host/account/real-world gate stated in the original criterion; no action authorized by this audit.

### 4B.C2 — open

Original execution-plan line 232: Create the actual branded OpenAI plugin draft with the final verified identity and permanent production MCP URL; include only the fully implemented `resolve_place` tool. Do not create a scratch plugin or use the staging URL in the package.

Disposition: Prepared procedure/template is not the required observed action. Requires owner/source/host/account/real-world gate stated in the original criterion; no action authorized by this audit.

### 4B.C3 — open

Original execution-plan line 233: After the dashboard issues the domain token, serve and verify the exact challenge on the production hostname, connect that endpoint, then run the earliest available tool scan. Keep the challenge, endpoint and publisher identity attached to this real draft.

Disposition: Prepared procedure/template is not the required observed action. Requires owner/source/host/account/real-world gate stated in the original criterion; no action authorized by this audit.

### 4B.C4 — satisfied

Original execution-plan line 234: Verify that `resolve_place` accepts exactly one of a named observing destination or `useApproximateHostLocation: true`; it rejects coordinate-shaped text on every route, ignores host hints when the flag is absent/false, and uses a documented host location hint only when the flag is true. If the hint is absent, it returns `availability: unavailable` with reason `host-location-unavailable` and asks for a named area. Test flag-without-hint, flag-with-hint, and hint-present-but-flag-false. Never persist the hint or return its coordinates.

Disposition: The exact resolver mode/hint/coordinate contract is already exercised locally in shared schemas, metadata-adapter and resolver-only transport fixtures. Actual official scan and client side channel remain 4B.C1–3/C5–6, not a reason to leave this executable criterion unchecked.

### 4B.C5 — open

Original execution-plan line 235: Record scan findings and dashboard prerequisites. If scanning is unavailable until later, preserve this same real draft and production URL, state the exact blocker, and run the one-tool scan at the earliest eligible point; do not create a second plugin or expand location-bearing fields. Any unresolved location-policy finding blocks tool expansion and submission until resolved.

Disposition: Prepared procedure/template is not the required observed action. Requires owner/source/host/account/real-world gate stated in the original criterion; no action authorized by this audit.

### 4B.C6 — open

Original execution-plan line 236: Pass when the real draft has a clean location-tool scan or a resolved, documented platform finding; the final Task 15 production scan remains required.

Disposition: Prepared procedure/template is not the required observed action. Requires owner/source/host/account/real-world gate stated in the original criterion; no action authorized by this audit.

## Task 5: Implement deterministic astronomy and target windows

Evidence bundle: server/nightsky/astronomy.ts; shared/nightsky/astronomy.ts; tests/nightsky/{astronomy,reference-astronomy,reference-horizon}.test.ts; tests/mcp/initialize.test.ts; docs/operations/astronomy-validation-wave.md.

### 5.C1 — satisfied

Original execution-plan line 246: Test `calculatesTwilightAtEquatorialSite`, `calculatesTwilightAtMidLatitude`, `returnsNoAstronomicalDarknessDuringPolarSummer`, `returnsDarkWindowDuringPolarWinter`, `calculatesMoonPhaseAndAltitude`, `returnsTargetRiseSetAndAltAzSamples`, `calculatesMilkyWayCoreSeasonInBothHemispheres`, and `keepsUtcAndLocalTimesConsistentAcrossDst`.

Disposition: Required local behavior is implemented in the evidence bundle; named tests/contract behavior listed below. Final full-suite evidence remains controller-owned.

| Named subcriterion | Disposition | Concrete fixture / required remaining evidence |
|---|---|---|
| 5.C1.T1 `calculatesTwilightAtEquatorialSite` | satisfied | tests/nightsky/astronomy.test.ts |
| 5.C1.T2 `calculatesTwilightAtMidLatitude` | satisfied | tests/nightsky/astronomy.test.ts |
| 5.C1.T3 `returnsNoAstronomicalDarknessDuringPolarSummer` | satisfied | tests/nightsky/astronomy.test.ts |
| 5.C1.T4 `returnsDarkWindowDuringPolarWinter` | satisfied | tests/nightsky/astronomy.test.ts |
| 5.C1.T5 `calculatesMoonPhaseAndAltitude` | satisfied | tests/nightsky/astronomy.test.ts |
| 5.C1.T6 `returnsTargetRiseSetAndAltAzSamples` | satisfied | tests/nightsky/astronomy.test.ts |
| 5.C1.T7 `calculatesMilkyWayCoreSeasonInBothHemispheres` | satisfied | tests/nightsky/astronomy.test.ts |
| 5.C1.T8 `keepsUtcAndLocalTimesConsistentAcrossDst` | satisfied | tests/nightsky/astronomy.test.ts |

### 5.C2 — satisfied

Original execution-plan line 247: Select and pin a maintained astronomy library only after license and date-range review. Store calculation/library version in source metadata.

Disposition: Required local behavior is implemented in the evidence bundle; named tests/contract behavior listed below. Final full-suite evidence remains controller-owned.

### 5.C3 — satisfied

Original execution-plan line 248: Compare fixed reference cases with an authoritative ephemeris within a documented tolerance; document coordinate and time conventions.

Disposition: Required local behavior is implemented in the evidence bundle; named tests/contract behavior listed below. Final full-suite evidence remains controller-owned.

### 5.C4 — satisfied

Original execution-plan line 249: Pass when `npm test` passes the named astronomy cases, high-latitude cases return explicit polar states, and both tools return schema-valid structured content in MCP calls.

Disposition: Required local behavior is implemented in the evidence bundle; named tests/contract behavior listed below. Final full-suite evidence remains controller-owned.

## Task 6: Implement predictable events and supported target catalogs

Evidence bundle: server/events/{catalog,meteorPeaks,meteorRadiants,intervalVisibility,planetAlignments}.ts; data/events/meteor-*.json; tests/events/{catalog,meteorPeaks,meteorRadiants,localHorizon,planetAlignments}.test.ts; docs/operations/events-season-expansion.md; docs/operations/{event-accuracy,planet-events}-wave.md; docs/operations/meteor-radiant-feasibility.md.

### 6.C1 — partial

Original execution-plan line 261: Test `findsMoonPhaseInRange`, `findsRecurringMeteorShower`, `calculatesEclipseLocalCircumstances`, `marksPartialEclipseBelowHorizon`, `marksEventBelowHorizon`, `returnsUnsupportedForUnmaintainedTransient`, `preservesCatalogSourceAndVintage`, and `listsV1UnsupportedEventClasses`.

Disposition: See 6 clause dispositions below: local supported events/reference fixtures exist; licensed complete meteor activity and maintained recurrence are missing. Do not infer full acceptance from schema-valid peak-only partial results.

| Named subcriterion | Disposition | Concrete fixture / required remaining evidence |
|---|---|---|
| 6.C1.T1 `findsMoonPhaseInRange` | satisfied | tests/events/catalog.test.ts |
| 6.C1.T2 `findsRecurringMeteorShower` | partial | Absent original behavior: named GeoNames zone lookup replaces boundary lookup; reviewed year-specific peaks replace recurring meteor seasons. See required scope/source gap. |
| 6.C1.T3 `calculatesEclipseLocalCircumstances` | satisfied | tests/events/catalog.test.ts |
| 6.C1.T4 `marksPartialEclipseBelowHorizon` | satisfied | tests/events/catalog.test.ts |
| 6.C1.T5 `marksEventBelowHorizon` | satisfied | tests/events/catalog.test.ts |
| 6.C1.T6 `returnsUnsupportedForUnmaintainedTransient` | satisfied | tests/events/catalog.test.ts |
| 6.C1.T7 `preservesCatalogSourceAndVintage` | satisfied | tests/events/catalog.test.ts |

### 6.C2 — partial

Original execution-plan line 262: Audit the existing static 2025/2026 meteor records for source, time zone, peak interval, rates, reuse rights, and stale content. Keep website imports working while making the event catalog versioned and future-maintainable.

Disposition: See 6 clause dispositions below: local supported events/reference fixtures exist; licensed complete meteor activity and maintained recurrence are missing. Do not infer full acceptance from schema-valid peak-only partial results.

### 6.C3 — partial

Original execution-plan line 263: Include calculated recurring events and selected, licensed targets. If Gate 0A approves live JPL Horizons/SBDB queries for selected dynamic comets/asteroids, `search_sky_events` reaches a public external source and must keep `openWorldHint: true`; if the live path is cut after Task 2, update `tool-contracts.md` and the annotation test in the same change, then set the final tool annotation to false before the package scan. Unavailable lookups return a linked partial result.

Disposition: See 6 clause dispositions below: local supported events/reference fixtures exist; licensed complete meteor activity and maintained recurrence are missing. Do not infer full acceptance from schema-valid peak-only partial results.

### 6.C4 — partial

Original execution-plan line 264: Record the eclipse data source, ΔT/Earth-rotation model, terms and comparison tolerance; validate local circumstances against published reference cases. Document annual meteor-catalog refresh and provenance.

Disposition: See 6 clause dispositions below: local supported events/reference fixtures exist; licensed complete meteor activity and maintained recurrence are missing. Do not infer full acceptance from schema-valid peak-only partial results.

### 6.C5 — partial

Original execution-plan line 265: Add a meteor-radiant source and model gate: establish redistribution rights for radiant coordinates, retain source/vintage, model radiant drift over each activity window, and test local altitude plus Moon-to-radiant separation. Until then, plans must return radiant visibility as unknown.

Disposition: See 6 clause dispositions below: local supported events/reference fixtures exist; licensed complete meteor activity and maintained recurrence are missing. Do not infer full acceptance from schema-valid peak-only partial results.

### 6.C6 — satisfied

Original execution-plan line 266: Explicitly list unsupported V1 classes and why: seeing/transparency forecasts (no validated V1 source), ISS/satellite passes (no maintained V1 pipeline), transient discoveries and faint-object catalogs (changing coverage/licensing/visibility work). Do not imply these are included.

Disposition: Unsupported classes and limitations are explicit in catalog/tool/contracts/workflow guidance; no every-transient or universal local-visibility promise is made.

### 6.C7 — satisfied

Original execution-plan line 267: Do not promise every transient discovery or locally visible event unless a maintained source and visibility calculation exist.

Disposition: Unsupported classes and limitations are explicit in catalog/tool/contracts/workflow guidance; no every-transient or universal local-visibility promise is made.

### 6.C8 — partial

Original execution-plan line 268: Pass when `npm test` covers visible, partial, not-visible, unsupported, and no-current-source event states and `search_sky_events` returns validated structured content.

Disposition: See 6 clause dispositions below: local supported events/reference fixtures exist; licensed complete meteor activity and maintained recurrence are missing. Do not infer full acceptance from schema-valid peak-only partial results.

## Task 7A: Implement the short-range weather adapter

Evidence bundle: server/providers/weather/metNorway.ts; server/providers/upstreamControls.ts; tests/providers/weather/{metNorway,metPeriods}.test.ts; tests/providers/providerOperational.test.ts; tests/mcp/offline-resilience.test.ts; docs/operations/offline-resilience-readiness.md; source-spikes.md.

### 7A.C1 — satisfied

Original execution-plan line 280: Test MET parsing with `mapsCloudAndWindFieldsWithUnits`, `keepsUnavailableFieldsMissing`, `preservesIssueAndValidTimes`, `marksStaleForecast`, `honorsExpiresBeforeRefresh`, `usesLastModifiedForConditionalFetch`, `roundsCoordinatesBeforeCacheAndRequest`, `returnsPartialOn429`, `returnsPartialOnTimeout`, `warnsOnDeprecated203Product`, `staysBelowApplicationWide20RequestsPerSecond`, `jittersScheduledRefreshes`, `rejectsMalformedPayload`, and `doesNotInventDewPoint`.

Disposition: All applicable named fixture behavior is implemented. jittersScheduledRefreshes is conditional-NA: no scheduler exists; demand-driven expiry/304/backoff is tested. Never use this ruling to exempt a future scheduler.

| Named subcriterion | Disposition | Concrete fixture / required remaining evidence |
|---|---|---|
| 7A.C1.T1 `mapsCloudAndWindFieldsWithUnits` | satisfied | Equivalent assertions inspected in tests/providers/weather/metNorway.test.ts: native cloud/wind units, source/valid times, undefined dewpoint/missingFields, rounded request URL, actual If-Modified-Since header, expiry cache hit with no fetch, stale429 fallback, malformed/timeout and out-of-horizon with no forecast. tests/mcp/offline-resilience.test.ts adds current304/stale/expiry/outage/deadline checks; offline-resilience-readiness.md maps this original behavior. |
| 7A.C1.T2 `keepsUnavailableFieldsMissing` | satisfied | Equivalent assertions inspected in tests/providers/weather/metNorway.test.ts: native cloud/wind units, source/valid times, undefined dewpoint/missingFields, rounded request URL, actual If-Modified-Since header, expiry cache hit with no fetch, stale429 fallback, malformed/timeout and out-of-horizon with no forecast. tests/mcp/offline-resilience.test.ts adds current304/stale/expiry/outage/deadline checks; offline-resilience-readiness.md maps this original behavior. |
| 7A.C1.T3 `preservesIssueAndValidTimes` | satisfied | Equivalent assertions inspected in tests/providers/weather/metNorway.test.ts: native cloud/wind units, source/valid times, undefined dewpoint/missingFields, rounded request URL, actual If-Modified-Since header, expiry cache hit with no fetch, stale429 fallback, malformed/timeout and out-of-horizon with no forecast. tests/mcp/offline-resilience.test.ts adds current304/stale/expiry/outage/deadline checks; offline-resilience-readiness.md maps this original behavior. |
| 7A.C1.T4 `marksStaleForecast` | satisfied | Equivalent assertions inspected in tests/providers/weather/metNorway.test.ts: native cloud/wind units, source/valid times, undefined dewpoint/missingFields, rounded request URL, actual If-Modified-Since header, expiry cache hit with no fetch, stale429 fallback, malformed/timeout and out-of-horizon with no forecast. tests/mcp/offline-resilience.test.ts adds current304/stale/expiry/outage/deadline checks; offline-resilience-readiness.md maps this original behavior. |
| 7A.C1.T5 `honorsExpiresBeforeRefresh` | satisfied | Equivalent assertions inspected in tests/providers/weather/metNorway.test.ts: native cloud/wind units, source/valid times, undefined dewpoint/missingFields, rounded request URL, actual If-Modified-Since header, expiry cache hit with no fetch, stale429 fallback, malformed/timeout and out-of-horizon with no forecast. tests/mcp/offline-resilience.test.ts adds current304/stale/expiry/outage/deadline checks; offline-resilience-readiness.md maps this original behavior. |
| 7A.C1.T6 `usesLastModifiedForConditionalFetch` | satisfied | Equivalent assertions inspected in tests/providers/weather/metNorway.test.ts: native cloud/wind units, source/valid times, undefined dewpoint/missingFields, rounded request URL, actual If-Modified-Since header, expiry cache hit with no fetch, stale429 fallback, malformed/timeout and out-of-horizon with no forecast. tests/mcp/offline-resilience.test.ts adds current304/stale/expiry/outage/deadline checks; offline-resilience-readiness.md maps this original behavior. |
| 7A.C1.T7 `roundsCoordinatesBeforeCacheAndRequest` | satisfied | Equivalent assertions inspected in tests/providers/weather/metNorway.test.ts: native cloud/wind units, source/valid times, undefined dewpoint/missingFields, rounded request URL, actual If-Modified-Since header, expiry cache hit with no fetch, stale429 fallback, malformed/timeout and out-of-horizon with no forecast. tests/mcp/offline-resilience.test.ts adds current304/stale/expiry/outage/deadline checks; offline-resilience-readiness.md maps this original behavior. |
| 7A.C1.T8 `returnsPartialOnTimeout` | satisfied | Equivalent assertions inspected in tests/providers/weather/metNorway.test.ts: native cloud/wind units, source/valid times, undefined dewpoint/missingFields, rounded request URL, actual If-Modified-Since header, expiry cache hit with no fetch, stale429 fallback, malformed/timeout and out-of-horizon with no forecast. tests/mcp/offline-resilience.test.ts adds current304/stale/expiry/outage/deadline checks; offline-resilience-readiness.md maps this original behavior. |
| 7A.C1.T9 `jittersScheduledRefreshes` | conditional-NA | Demand-only refresh; no scheduler. Expiry/304/upstream cooldown fixtures cover actual path. |
| 7A.C1.T10 `rejectsMalformedPayload` | satisfied | Equivalent assertions inspected in tests/providers/weather/metNorway.test.ts: native cloud/wind units, source/valid times, undefined dewpoint/missingFields, rounded request URL, actual If-Modified-Since header, expiry cache hit with no fetch, stale429 fallback, malformed/timeout and out-of-horizon with no forecast. tests/mcp/offline-resilience.test.ts adds current304/stale/expiry/outage/deadline checks; offline-resilience-readiness.md maps this original behavior. |
| 7A.C1.T11 `doesNotInventDewPoint` | satisfied | Equivalent assertions inspected in tests/providers/weather/metNorway.test.ts: native cloud/wind units, source/valid times, undefined dewpoint/missingFields, rounded request URL, actual If-Modified-Since header, expiry cache hit with no fetch, stale429 fallback, malformed/timeout and out-of-horizon with no forecast. tests/mcp/offline-resilience.test.ts adds current304/stale/expiry/outage/deadline checks; offline-resilience-readiness.md maps this original behavior. |

| 7A.C1.T12 `returnsPartialOn429` | satisfied | metNorway.test.ts cached429 stale fallback; offline-resilience.test.ts cold outage remains partial unknown, never silently fresh. |
| 7A.C1.T13 `warnsOnDeprecated203Product` | satisfied | metNorway.test.ts HTTP203 deprecation warning with retained forecast. |
| 7A.C1.T14 `staysBelowApplicationWide20RequestsPerSecond` | satisfied | providerOperational.test.ts/upstreamControls.test.ts actual shared MET cap; all orchestration shares control budget. |

### 7A.C2 — satisfied

Original execution-plan line 281: Send the required identifying User-Agent; honor `Expires` before refreshing and use the stored `Last-Modified` value with `If-Modified-Since`; round coordinates to the privacy-approved precision, never exceeding four decimals; use the shared cache with provider-approved TTLs. Enforce MET's 20 requests/second ceiling across the whole application, add jitter to scheduled refreshes, and surface HTTP 203 as a deprecation warning. Keep forecast source/model records separate. Do not call MET and ECMWF ensemble outputs independent confirmations where they share model guidance.

Disposition: Required local behavior is implemented in the evidence bundle; named tests/contract behavior listed below. Final full-suite evidence remains controller-owned.

### 7A.C3 — satisfied

Original execution-plan line 282: Add NightSky's planning value to the result: summarize each source's valid forecast steps inside the requested local astronomical-darkness interval, with Moon context and missing fields, while preserving the original source-specific forecast records. Do not return this tool as an unmodified third-party payload.

Disposition: Required local behavior is implemented in the evidence bundle; named tests/contract behavior listed below. Final full-suite evidence remains controller-owned.

### 7A.C4 — satisfied

Original execution-plan line 283: Test `returnsOutOfHorizonWithoutForecast` and confirm `get_night_conditions` indicates `out-of-horizon` instead of extrapolating weather.

Disposition: Required local behavior is implemented in the evidence bundle; named tests/contract behavior listed below. Final full-suite evidence remains controller-owned.

| Named subcriterion | Disposition | Concrete fixture / required remaining evidence |
|---|---|---|
| 7A.C4.T1 `returnsOutOfHorizonWithoutForecast` | satisfied | Equivalent assertions inspected in tests/providers/weather/metNorway.test.ts: native cloud/wind units, source/valid times, undefined dewpoint/missingFields, rounded request URL, actual If-Modified-Since header, expiry cache hit with no fetch, stale429 fallback, malformed/timeout and out-of-horizon with no forecast. tests/mcp/offline-resilience.test.ts adds current304/stale/expiry/outage/deadline checks; offline-resilience-readiness.md maps this original behavior. |

### 7A.C5 — satisfied

Original execution-plan line 284: Pass when `npm test` passes weather fixtures without network access and a real MCP call includes source, provider issue/update time when available, valid times, units, and missing fields. Include a retrieval/check time only when source timestamps do not give the user a usable freshness signal, and document why it is needed.

Disposition: Required local behavior is implemented in the evidence bundle; named tests/contract behavior listed below. Final full-suite evidence remains controller-owned.

### 7A.C6 — conditional-NA

Original execution-plan line 285: Keep NOAA GEFS a conditional enhancement behind Task 0D's decoder, time-alignment, operations, and budget criteria. If it is not ready, report the MET forecast and the unavailable second model honestly.

Disposition: GEFS optional decoder/budget gate has not passed; MET-only output and unavailable independent second source are explicit. GEFS enablement remains future conditional work.

## Task 7B: Implement the short-horizon aurora adapter

Evidence bundle: server/providers/aurora/noaaSwpc.ts; tests/providers/aurora/noaaSwpc.test.ts; tests/mcp/offline-resilience.test.ts; docs/operations/provider-controls-wave.md; source-spikes.md.

### 7B.C1 — satisfied

Original execution-plan line 295: Test `returnsCurrentOutlookWithLatitudeContext`, `marksOutlookStale`, `reportsCoverageAtRequestedLatitude`, and `returnsUnavailableOnTimeout`; do not assume aurora is categorically impossible at low latitudes.

Disposition: Required local behavior is implemented in the evidence bundle; named tests/contract behavior listed below. Final full-suite evidence remains controller-owned.

| Named subcriterion | Disposition | Concrete fixture / required remaining evidence |
|---|---|---|
| 7B.C1.T1 `returnsCurrentOutlookWithLatitudeContext` | satisfied | Equivalent assertions inspected in tests/providers/aurora/noaaSwpc.test.ts: current geographic band/grid value/no probability, old observation stale, low latitude not impossible, provider AbortError unavailable. |
| 7B.C1.T2 `marksOutlookStale` | satisfied | Equivalent assertions inspected in tests/providers/aurora/noaaSwpc.test.ts: current geographic band/grid value/no probability, old observation stale, low latitude not impossible, provider AbortError unavailable. |
| 7B.C1.T3 `reportsCoverageAtRequestedLatitude` | satisfied | Equivalent assertions inspected in tests/providers/aurora/noaaSwpc.test.ts: current geographic band/grid value/no probability, old observation stale, low latitude not impossible, provider AbortError unavailable. |
| 7B.C1.T4 `returnsUnavailableOnTimeout` | satisfied | Equivalent assertions inspected in tests/providers/aurora/noaaSwpc.test.ts: current geographic band/grid value/no probability, old observation stale, low latitude not impossible, provider AbortError unavailable. |

### 7B.C2 — satisfied

Original execution-plan line 296: Preserve product issue time, valid interval, latitude/visibility limits, and source link. Explain the outlook for the user's selected location and align it to the planned night in Task 10A; keep cloud, darkness and Moon as separate evidence. Do not convert geomagnetic activity into a guaranteed sighting or act as a raw third-party pass-through.

Disposition: Required local behavior is implemented in the evidence bundle; named tests/contract behavior listed below. Final full-suite evidence remains controller-owned.

### 7B.C3 — satisfied

Original execution-plan line 297: Pass when `npm test` passes the named aurora cases and an MCP call shows the valid outlook and its limitations independently from weather.

Disposition: Required local behavior is implemented in the evidence bundle; named tests/contract behavior listed below. Final full-suite evidence remains controller-owned.

## Task 8: Build source-linked text candidate-place discovery

Evidence bundle: server/places/{importOsm,osmCandidates,regionalOsm,context}.ts; scripts/osm/; tests/places/{importOsm,osmCandidates,context,osmIndex,regionalOsm,osmRealPilot}.test.ts; tests/mcp/{regional-installed,regional-provider,regional-data-journey}.test.ts; docs/operations/{offline-extract,regional-serving,spot-scaling}-wave.md; docs/operations/artifact-rollback.md; data-sources.md.

### 8.C1 — satisfied

Original execution-plan line 310: Test `returnsOnlyAllowedCandidateTypes`, `includesOsmSourceLink`, `reportsImportVintage`, `keepsAccessUnknownWhenUnmapped`, `returnsNoCandidatesNearUninhabitedArea`, `usesRequestedDistanceUnits`, `capsResultCount`, `statesCandidateSortBasisWhenDarknessUnknown`, `importsRepeatably`, `preservesOdbLAttribution`, `returnsSourceLinkedPlaceContext`, `returnsUnknownForUnverifiedDarkness`, and `treatsOsmNamesAsUntrustedData`.

Disposition: Allowed types/source/vintage/unknown access and darkness/untrusted text/stable query fixtures implement this original local behavior. Candidate serving is regional and does not close 0B global/scope approval.

| Named subcriterion | Disposition | Concrete fixture / required remaining evidence |
|---|---|---|
| 8.C1.T1 `returnsOnlyAllowedCandidateTypes` | satisfied | tests/places/osmCandidates.test.ts |
| 8.C1.T2 `includesOsmSourceLink` | satisfied | tests/places/osmCandidates.test.ts |
| 8.C1.T3 `reportsImportVintage` | satisfied | tests/places/osmCandidates.test.ts |
| 8.C1.T4 `keepsAccessUnknownWhenUnmapped` | satisfied | tests/places/osmCandidates.test.ts |
| 8.C1.T5 `returnsNoCandidatesNearUninhabitedArea` | satisfied | tests/places/osmCandidates.test.ts |
| 8.C1.T6 `usesRequestedDistanceUnits` | satisfied | tests/places/osmCandidates.test.ts |
| 8.C1.T7 `capsResultCount` | satisfied | tests/places/osmCandidates.test.ts |
| 8.C1.T8 `statesCandidateSortBasisWhenDarknessUnknown` | satisfied | tests/places/osmCandidates.test.ts |
| 8.C1.T9 `importsRepeatably` | satisfied | tests/places/importOsm.test.ts |
| 8.C1.T10 `preservesOdbLAttribution` | satisfied | tests/places/importOsm.test.ts |
| 8.C1.T11 `returnsSourceLinkedPlaceContext` | satisfied | tests/places/context.test.ts |
| 8.C1.T12 `returnsUnknownForUnverifiedDarkness` | satisfied | tests/places/context.test.ts |
| 8.C1.T13 `treatsOsmNamesAsUntrustedData` | satisfied | tests/places/osmCandidates.test.ts |

### 8.C2 — partial

Original execution-plan line 311: Implement only a measured, read-only flat-file artifact for V1 candidate search. Do not add a database or external indexing service. Store the minimum fields needed for candidate search; record global/region coverage and refresh vintage. Cap and sanitize source-provided text, keep OSM tags in typed data fields, and never treat them as instructions. If the artifact cannot meet host memory, disk, query-latency, or refresh limits, leave candidate discovery explicitly partial/unsupported and defer it.

Disposition: Compact measured regional artifacts, local integrity/rollback and result attribution exist. Actual host fit, approved release distribution/ODbL classification and global coverage or approved narrowing remain open; no public offer evidenced.

### 8.C3 — partial

Original execution-plan line 312: Build source indexes outside the production request path. Publish versioned/checksummed artifacts with source vintage, coverage and ODbL metadata; deploy by atomic version switch and retain the last known-good artifact for rollback. Keep raw extracts and build scratch files off the serving VM's root disk. A temporary/CI build worker is optional and requires a cost check/approval before paid use.

Disposition: Compact measured regional artifacts, local integrity/rollback and result attribution exist. Actual host fit, approved release distribution/ODbL classification and global coverage or approved narrowing remain open; no public offer evidenced.

### 8.C4 — open

Original execution-plan line 313: Benchmark the 2 vCPU/4 GB shared Hetzner target with all enabled runtime indexes loaded: peak RSS, free disk during deploy and rollback, cold/warm query latency, concurrent requests and artifact rollback. If an index does not fit with safe headroom, keep that tool explicitly unavailable/partial; adding a database or external index is outside the owner-confirmed V1 scope.

Disposition: Local 2CPU/4GiB container capacity and rollback are useful rehearsals, not the original selected Hetzner target with deploy/free-disk/rollback measurement. Host configuration/authorization required.

### 8.C5 — satisfied

Original execution-plan line 314: Do not rely on public Nominatim or Overpass service capacity for production-scale search. Never use an OSM candidate tag as proof of access, night opening, darkness, or safety.

Disposition: Allowed types/source/vintage/unknown access and darkness/untrusted text/stable query fixtures implement this original local behavior. Candidate serving is regional and does not close 0B global/scope approval.

### 8.C6 — partial

Original execution-plan line 315: Publish ODbL attribution in every relevant result and document the source/index license plus any share-alike or derived-database offer/publication obligation that Gate 0A determines applies.

Disposition: Compact measured regional artifacts, local integrity/rollback and result attribution exist. Actual host fit, approved release distribution/ODbL classification and global coverage or approved narrowing remain open; no public offer evidenced.

### 8.C7 — satisfied

Original execution-plan line 316: Return relative satellite-measured ground-light radiance only if Gate 0E validates its license, coverage, label and usefulness; otherwise return an explicit unknown value and never rank a place as “dark.” Never relabel radiance as sky brightness, Bortle or SQM.

Disposition: Current context explicitly leaves darkness unknown and does not rank by darkness. VIIRS sample/calibration is optional if unknown behavior is retained; public conditional-scope decision remains recorded with 0E.

### 8.C8 — satisfied

Original execution-plan line 317: When darkness is unknown, sort candidates by requested candidate-type match (when specified), then distance from the resolved search area, then source-record completeness. Return the sort basis in structured and concise text results so ordering is never presented as a darkness ranking. If no type is specified, sort by distance, then source completeness.

Disposition: Allowed types/source/vintage/unknown access and darkness/untrusted text/stable query fixtures implement this original local behavior. Candidate serving is regional and does not close 0B global/scope approval.

### 8.C9 — satisfied

Original execution-plan line 318: Pass when `npm test` passes the candidate/context cases, repeat import/query results are stable, and neither tool implies an access or darkness guarantee.

Disposition: Allowed types/source/vintage/unknown access and darkness/untrusted text/stable query fixtures implement this original local behavior. Candidate serving is regional and does not close 0B global/scope approval.

## Task 9: Deliver months-ahead historical cloud context

Evidence bundle: server/providers/climate/{era5,tiledEra5}.ts; scripts/era5/; tests/providers/climate/*.test.ts; tests/mcp/{climate-e2e,climate-installed,climate-tiled-installed}.test.ts; docs/operations/{era5-runtime,historical-baseline,grouped-history}-wave.md.

### 9.C1 — satisfied

Original execution-plan line 330: Test `returnsMonthlyMeanByHour`, `filtersToLocalDarknessHours`, `marksSparseGridAsPartial`, `includesSourceVintageAndGridResolution`, and `neverLabelsHistoryAsForecast`.

Disposition: Reviewed sample, hourly darkness aggregation, schema2 and real installed-artifact MCP fixtures cover local statistic/provenance/historical labels. The changed hourly method is explicitly recorded; sample-only coverage remains visible.

| Named subcriterion | Disposition | Concrete fixture / required remaining evidence |
|---|---|---|
| 9.C1.T1 `returnsMonthlyMeanByHour` | satisfied | Equivalent reviewed hourly method: tests/providers/climate/era5.test.ts deterministic weighted monthly statistics/24bins, sparse-bin partial; aggregate.test.ts independently referenced Sun darkness mask and local-night/DST; contracts.test.ts actual period/provenance/historical semantics. Owner-selected hourly source supersedes monthly-means wording in H1–H4/source-spikes; no monthly-means or forecast claim. |
| 9.C1.T2 `filtersToLocalDarknessHours` | satisfied | Equivalent reviewed hourly method: tests/providers/climate/era5.test.ts deterministic weighted monthly statistics/24bins, sparse-bin partial; aggregate.test.ts independently referenced Sun darkness mask and local-night/DST; contracts.test.ts actual period/provenance/historical semantics. Owner-selected hourly source supersedes monthly-means wording in H1–H4/source-spikes; no monthly-means or forecast claim. |
| 9.C1.T3 `marksSparseGridAsPartial` | satisfied | Equivalent reviewed hourly method: tests/providers/climate/era5.test.ts deterministic weighted monthly statistics/24bins, sparse-bin partial; aggregate.test.ts independently referenced Sun darkness mask and local-night/DST; contracts.test.ts actual period/provenance/historical semantics. Owner-selected hourly source supersedes monthly-means wording in H1–H4/source-spikes; no monthly-means or forecast claim. |
| 9.C1.T4 `includesSourceVintageAndGridResolution` | satisfied | Equivalent reviewed hourly method: tests/providers/climate/era5.test.ts deterministic weighted monthly statistics/24bins, sparse-bin partial; aggregate.test.ts independently referenced Sun darkness mask and local-night/DST; contracts.test.ts actual period/provenance/historical semantics. Owner-selected hourly source supersedes monthly-means wording in H1–H4/source-spikes; no monthly-means or forecast claim. |
| 9.C1.T5 `neverLabelsHistoryAsForecast` | satisfied | Equivalent reviewed hourly method: tests/providers/climate/era5.test.ts deterministic weighted monthly statistics/24bins, sparse-bin partial; aggregate.test.ts independently referenced Sun darkness mask and local-night/DST; contracts.test.ts actual period/provenance/historical semantics. Owner-selected hourly source supersedes monthly-means wording in H1–H4/source-spikes; no monthly-means or forecast claim. |

### 9.C2 — satisfied

Original execution-plan line 331: Use the registered ERA5 monthly-means-by-hour product if the Task 0 sample supports the needed user explanation. Do not claim median/percentile distributions unless the selected source contains per-year values that justify those statistics.

Disposition: Hourly ERA5 was owner-selected and documented in 0C/H1–H4 method refinement; do not demand superseded monthly-means storage. Actual yearly values support counts/statistics only inside supplied sample.

### 9.C3 — partial

Original execution-plan line 332: Add bounded aggregation only as an offline build that emits a small versioned read-only file. Do not add a database or durable user/provider state. If the artifact cannot meet the approved size, memory, refresh, licensing, and cost bounds, mark climatology unsupported for V1.

Disposition: Bounded offline immutable files and no database are implemented; actual global/baseline artifact, approved refresh/build costs and selected-host disk/memory fit remain unproved.

### 9.C4 — satisfied

Original execution-plan line 333: Return “historical pattern for this month/season,” never a particular-night clear-sky probability; advise the user to recheck a real forecast closer to the date.

Disposition: Reviewed sample, hourly darkness aggregation, schema2 and real installed-artifact MCP fixtures cover local statistic/provenance/historical labels. The changed hourly method is explicitly recorded; sample-only coverage remains visible.

### 9.C5 — partial

Original execution-plan line 334: Treat inability to provide a lawful, reliable, affordable history result as a launch gate for the months-ahead claim. Mark that journey unsupported until resolved; do not silently replace it with a forecast guess.

Disposition: Uncovered historical periods/places stay unsupported, but complete agreed months-ahead/global journey or explicit owner-approved omission remains required. Existing sample-only data does not fulfill release coverage.

### 9.C6 — satisfied

Original execution-plan line 335: Pass when `npm test` passes the named climate cases and the MCP result identifies the actual statistic, years, grid resolution, units, and historical label.

Disposition: Reviewed sample, hourly darkness aggregation, schema2 and real installed-artifact MCP fixtures cover local statistic/provenance/historical labels. The changed hourly method is explicitly recorded; sample-only coverage remains visible.

## Task 10A: Implement activity-aware plan orchestration

Evidence bundle: server/nightsky/planner.ts; tests/nightsky/{planner,journey-completion,meteor-planning}.test.ts; tests/mcp/{planning-e2e,offline-journeys,climate-e2e}.test.ts; docs/operations/offline-journey-readiness.md.

### 10A.C1 — satisfied

Original execution-plan line 347: Test `plansBeginnerStargazingWithPartialWeather`, `plansMeteorNightWithRadiantGapExplicit`, `plansAstrophotographyWithoutInventingSeeing`, `plansTelescopeTargetWithVisibilityWindow`, `returnsHistoricalContextForMonthAheadDate`, `returnsUsefulPlanWhenClimatologyIsUnsupported`, `asksForAmbiguousPlace`, `includesNightAccessCaveat`, and `returnsUsefulPlanWhenOneProviderFails`. Radiant altitude remains an explicit gap pending Task 6's source-rights and drift-model gate.

Disposition: Required local behavior is implemented in the evidence bundle; named tests/contract behavior listed below. Final full-suite evidence remains controller-owned.

| Named subcriterion | Disposition | Concrete fixture / required remaining evidence |
|---|---|---|
| 10A.C1.T1 `plansBeginnerStargazingWithPartialWeather` | satisfied | tests/nightsky/planner.test.ts |
| 10A.C1.T2 `plansMeteorNightWithRadiantGapExplicit` | satisfied | tests/nightsky/planner.test.ts |
| 10A.C1.T3 `plansAstrophotographyWithoutInventingSeeing` | satisfied | tests/nightsky/planner.test.ts |
| 10A.C1.T4 `plansTelescopeTargetWithVisibilityWindow` | satisfied | tests/nightsky/planner.test.ts |
| 10A.C1.T5 `returnsHistoricalContextForMonthAheadDate` | satisfied | tests/nightsky/planner.test.ts |
| 10A.C1.T6 `returnsUsefulPlanWhenClimatologyIsUnsupported` | satisfied | tests/nightsky/planner.test.ts |
| 10A.C1.T7 `asksForAmbiguousPlace` | satisfied | tests/nightsky/planner.test.ts |
| 10A.C1.T8 `includesNightAccessCaveat` | satisfied | tests/nightsky/planner.test.ts |
| 10A.C1.T9 `returnsUsefulPlanWhenOneProviderFails` | satisfied | tests/nightsky/planner.test.ts |

### 10A.C2 — satisfied

Original execution-plan line 348: Add a local Streamable HTTP integration test using the real registry and fixture-injected services: initialize, resolve a named place, call the planner with the returned `placeId`, and validate the structured result. Also verify explicit unavailable/unsupported states when optional candidate/climate data is absent. No external network calls are allowed in this test.

Disposition: Required local behavior is implemented in the evidence bundle; named tests/contract behavior listed below. Final full-suite evidence remains controller-owned.

### 10A.C3 — satisfied

Original execution-plan line 349: Produce a concise summary first, then the darkness interval, per-source forecast values and valid times, missing evidence, caveats, preparation steps, and source links. Keep exact factor values accessible; do not output one unexplained universal “good sky” score. Include candidate places and historical context only when Tasks 8/9 are enabled. Otherwise return an explicit unsupported/unavailable state for each optional capability and continue the plan from the user's named destination.

Disposition: Required local behavior is implemented in the evidence bundle; named tests/contract behavior listed below. Final full-suite evidence remains controller-owned.

### 10A.C4 — satisfied

Original execution-plan line 350: Keep outputs deterministic from fixture inputs so the same scenarios can be tested in every assistant host.

Disposition: Required local behavior is implemented in the evidence bundle; named tests/contract behavior listed below. Final full-suite evidence remains controller-owned.

### 10A.C5 — satisfied

Original execution-plan line 351: Pass when `npm test` passes the planner cases, every exercised journey maps to a fixture or explicit unsupported/partial result, and the tool returns validated structured content. Full V1 journey coverage still depends on candidate/climatology feasibility and licensed meteor-radiant data; those remain separate gates.

Disposition: Required local behavior is implemented in the evidence bundle; named tests/contract behavior listed below. Final full-suite evidence remains controller-owned.

## Task 10B: Implement side-by-side option comparison

Evidence bundle: server/nightsky/compare.ts; tests/nightsky/compare.test.ts; tests/mcp/offline-journeys.test.ts; tests/mcp/result-budget.test.ts; docs/operations/offline-journey-readiness.md.

### 10B.C1 — satisfied

Original execution-plan line 363: Test `comparesSourcesWithoutBlending`, `keepsOptionWithMissingForecast`, `explainsActivitySpecificTradeoffs`, `preservesSourceLinksAndLocalTimes`, and `comparesFiveOptionsWithoutBlending`.

Disposition: Required local behavior is implemented in the evidence bundle; named tests/contract behavior listed below. Final full-suite evidence remains controller-owned.

| Named subcriterion | Disposition | Concrete fixture / required remaining evidence |
|---|---|---|
| 10B.C1.T1 `comparesSourcesWithoutBlending` | satisfied | tests/nightsky/compare.test.ts |
| 10B.C1.T2 `keepsOptionWithMissingForecast` | satisfied | tests/nightsky/compare.test.ts |
| 10B.C1.T3 `explainsActivitySpecificTradeoffs` | satisfied | tests/nightsky/compare.test.ts |
| 10B.C1.T4 `preservesSourceLinksAndLocalTimes` | satisfied | tests/nightsky/compare.test.ts |
| 10B.C1.T5 `comparesFiveOptionsWithoutBlending` | satisfied | tests/nightsky/compare.test.ts |

### 10B.C2 — satisfied

Original execution-plan line 364: Keep all selected options in the result, including options with missing data. Do not create an unexplained winner or universal score.

Disposition: Required local behavior is implemented in the evidence bundle; named tests/contract behavior listed below. Final full-suite evidence remains controller-owned.

### 10B.C3 — satisfied

Original execution-plan line 365: Pass when `npm test` passes comparison cases and conflicts, missing providers, differing valid times and activity-specific priorities remain visible in the deterministic MCP result.

Disposition: Required local behavior is implemented in the evidence bundle; named tests/contract behavior listed below. Final full-suite evidence remains controller-owned.

## Task 11A: Add cited sky-learning and astrophotography guidance

Evidence bundle: server/content/learning.ts; tests/content/learning.test.ts; tests/nightsky/journey-completion.test.ts; docs/operations/data-sources.md.

### 11A.C1 — satisfied

Original execution-plan line 375: Test `explainsSkyOrientationForHemisphere`, `listsAstrophotographyLearningByExperience`, `requiresGearBeforeGivingSettings`, `includesReusableSourceCitation`, and `includesSolarEclipseEyeSafetyReference`.

Disposition: Required local behavior is implemented in the evidence bundle; named tests/contract behavior listed below. Final full-suite evidence remains controller-owned.

| Named subcriterion | Disposition | Concrete fixture / required remaining evidence |
|---|---|---|
| 11A.C1.T1 `explainsSkyOrientationForHemisphere` | satisfied | tests/content/learning.test.ts |
| 11A.C1.T2 `listsAstrophotographyLearningByExperience` | satisfied | tests/content/learning.test.ts |
| 11A.C1.T3 `requiresGearBeforeGivingSettings` | satisfied | tests/content/learning.test.ts |
| 11A.C1.T4 `includesReusableSourceCitation` | satisfied | tests/content/learning.test.ts |
| 11A.C1.T5 `includesSolarEclipseEyeSafetyReference` | satisfied | tests/content/learning.test.ts |

### 11A.C2 — satisfied

Original execution-plan line 376: Cover first-session orientation, basic target finding, first phone/camera/tripod photo, solar-eclipse eye safety from an authoritative source, and next learning steps without promising image results.

Disposition: Required local behavior is implemented in the evidence bundle; named tests/contract behavior listed below. Final full-suite evidence remains controller-owned.

### 11A.C3 — satisfied

Original execution-plan line 377: Keep camera-specific settings conditional on user-provided camera/lens/support details. Pass when tests verify citations and no gear-specific claims without sufficient inputs.

Disposition: Required local behavior is implemented in the evidence bundle; named tests/contract behavior listed below. Final full-suite evidence remains controller-owned.

## Task 11B: Add reviewed app suggestions and preparation checklists

Evidence bundle: server/content/{specialistTools,checklists}.ts; tests/content/recommendations.test.ts; tests/mcp/initialize.test.ts; docs/operations/data-sources.md.

### 11B.C1 — satisfied

Original execution-plan line 387: Test `matchesToolSuggestionToActivity`, `marksPriceAsUnknownWhenNotVerified`, `includesLastCheckedDate`, `doesNotAddAffiliateTracking`, `adaptsChecklistToWeatherAndGear`, `includesAfterDarkAccessCheck`, and `doesNotPromisePhotoSuccess`.

Disposition: Required local behavior is implemented in the evidence bundle; named tests/contract behavior listed below. Final full-suite evidence remains controller-owned.

| Named subcriterion | Disposition | Concrete fixture / required remaining evidence |
|---|---|---|
| 11B.C1.T1 `matchesToolSuggestionToActivity` | satisfied | tests/content/recommendations.test.ts |
| 11B.C1.T2 `marksPriceAsUnknownWhenNotVerified` | satisfied | tests/content/recommendations.test.ts |
| 11B.C1.T3 `includesLastCheckedDate` | satisfied | tests/content/recommendations.test.ts |
| 11B.C1.T4 `doesNotAddAffiliateTracking` | satisfied | tests/content/recommendations.test.ts |
| 11B.C1.T5 `adaptsChecklistToWeatherAndGear` | satisfied | tests/content/recommendations.test.ts |
| 11B.C1.T6 `includesAfterDarkAccessCheck` | satisfied | tests/content/recommendations.test.ts |
| 11B.C1.T7 `doesNotPromisePhotoSuccess` | satisfied | tests/content/recommendations.test.ts |

### 11B.C2 — satisfied

Original execution-plan line 388: Store each app's purpose, supported platform, verified pricing label, source link, and `lastReviewed`; if price/platform support is not verifiable, label it unknown.

Disposition: Required local behavior is implemented in the evidence bundle; named tests/contract behavior listed below. Final full-suite evidence remains controller-owned.

### 11B.C3 — satisfied

Original execution-plan line 389: Do not add affiliate tracking or paid placement in V1. Cover telescope, meteor, family, aurora, eclipse and camera preparation. Include a brief reminder to verify land access, after-dark rules, and local conditions; use only weather fields the source actually provides.

Disposition: Required local behavior is implemented in the evidence bundle; named tests/contract behavior listed below. Final full-suite evidence remains controller-owned.

### 11B.C4 — satisfied

Original execution-plan line 390: Pass when tests verify relevance, citations, review dates, uncertainty, and no unsupported claims, and the MCP tool returns validated structured content.

Disposition: Required local behavior is implemented in the evidence bundle; named tests/contract behavior listed below. Final full-suite evidence remains controller-owned.

## Task 11C: Author five shared workflow guides and host-specific packages

Evidence bundle: docs/product/workflows/; plugins/nightsky/skills/; tests/skills/workflows.test.ts; tests/skills/asksForNamedPlaceWhenUserGivesCoordinates.md; tests/platforms/package.test.ts.

### 11C.C1 — satisfied

Original execution-plan line 400: Each skill states its purpose, minimal follow-up questions, exact tool names, sequencing, source/time handling, partial-data behavior, and unsupported cases. If the user supplies coordinates, ask them to name a destination; never convert or reverse-geocode the coordinates into a place name. Include a host-neutral fixture named `asksForNamedPlaceWhenUserGivesCoordinates` and verify that the skill guidance asks for a named destination without producing a plan.

Disposition: Required local behavior is implemented in the evidence bundle; named tests/contract behavior listed below. Final full-suite evidence remains controller-owned.

| Named subcriterion | Disposition | Concrete fixture / required remaining evidence |
|---|---|---|
| 11C.C1.T1 `asksForNamedPlaceWhenUserGivesCoordinates` | satisfied | tests/platforms/host-cases.test.ts; tests/skills/workflows.test.ts |

### 11C.C2 — satisfied

Original execution-plan line 401: Keep host-independent astronomy and data facts in the canonical guides; adapt any host-specific skill syntax and location behavior in the corresponding package/docs.

Disposition: Required local behavior is implemented in the evidence bundle; named tests/contract behavior listed below. Final full-suite evidence remains controller-owned.

### 11C.C3 — satisfied

Original execution-plan line 402: Cover beginner/family/urban stargazing, meteor showers, eclipses, aurora where supported, visual telescope use, astrophotography learning, and seasonal trip planning through the shared five skills; do not create duplicate provider facts in prompt files.

Disposition: Required local behavior is implemented in the evidence bundle; named tests/contract behavior listed below. Final full-suite evidence remains controller-owned.

### 11C.C4 — satisfied

Original execution-plan line 403: Test `usesPlaceResolutionBeforePlanning`, `callsEventSearchForEventPlans`, `keepsProvidersSeparateInSummary`, `asksBeforeAssumingHostLocation`, and `usesPartialResultWhenSourceUnavailable` against static and prompt fixtures.

Disposition: Required local behavior is implemented in the evidence bundle; named tests/contract behavior listed below. Final full-suite evidence remains controller-owned.

| Named subcriterion | Disposition | Concrete fixture / required remaining evidence |
|---|---|---|
| 11C.C4.T1 `usesPlaceResolutionBeforePlanning` | satisfied | tests/skills/workflows.test.ts |
| 11C.C4.T2 `callsEventSearchForEventPlans` | satisfied | tests/skills/workflows.test.ts |
| 11C.C4.T3 `keepsProvidersSeparateInSummary` | satisfied | tests/skills/workflows.test.ts |
| 11C.C4.T4 `asksBeforeAssumingHostLocation` | satisfied | tests/skills/workflows.test.ts |
| 11C.C4.T5 `usesPartialResultWhenSourceUnavailable` | satisfied | tests/skills/workflows.test.ts |

### 11C.C5 — satisfied

Original execution-plan line 404: Run `npm test` and `npm run check`; tests verify no undefined tool references and expected tool order and caveats.

Disposition: Required local behavior is implemented in the evidence bundle; named tests/contract behavior listed below. Final full-suite evidence remains controller-owned.

## Task 12A: Prepare the OpenAI package and host test cases

Evidence bundle: plugins/nightsky/{plugin,mcp}.json; scripts/build-plugin-package.ts; tests/platforms/{package,host-cases,review-cases}.test.ts; tests/platforms/host-cases.json; docs/operations/local-package-readiness.md; docs/platforms/host-matrix.md.

### 12A.C1 — satisfied

Original execution-plan line 414: Validate package manifests and exactly one configured remote MCP endpoint. Keep local-only app references/lifecycle hooks out of the public ZIP.

Disposition: Local manifests/one remote endpoint, Inspector evidence, coordinate contract and deterministic prompts exist. This finding does not assert actual hosted metadata, official validator or draft acceptance.

### 12A.C2 — satisfied

Original execution-plan line 415: Validate package manifests and local MCP behavior; run MCP Inspector against the local endpoint. Do not describe a local protocol check as a live ChatGPT/Codex integration test.

Disposition: Local manifests/one remote endpoint, Inspector evidence, coordinate contract and deterministic prompts exist. This finding does not assert actual hosted metadata, official validator or draft acceptance.

### 12A.C3 — open

Original execution-plan line 416: Update the real draft created in Task 4B with complete metadata and host-specific skill files by uploading a new ZIP to that same plugin record. Keep its production URL unchanged; do not create a second or skills-only plugin.

Disposition: No real draft/verified endpoint: same-record ZIP update requires 3C/4B actual platform work.

### 12A.C4 — satisfied

Original execution-plan line 417: Keep OpenAI tool schemas free of raw coordinate/address fields. Verify the current ChatGPT location policy and optional `_meta["openai/userLocation"]` hint. The documented hint may include city, region, country, timezone, longitude and latitude and may be absent. The assistant sets `useApproximateHostLocation: true` only for an explicit “near me” or current-area request; NightSky uses the hint only when that flag is present, treats all fields as sensitive, does not persist/log/echo it, and asks for a named destination if it is absent. Reject coordinate-shaped `placeQuery` text on every host.

Disposition: Local manifests/one remote endpoint, Inspector evidence, coordinate contract and deterministic prompts exist. This finding does not assert actual hosted metadata, official validator or draft acceptance.

### 12A.C5 — partial

Original execution-plan line 418: Handle OpenAI call metadata explicitly: `openai/subject` is an anonymized per-user identifier intended for rate limiting; `openai/session` and optional organization, locale and user-agent fields may also arrive. Use only the minimum fields named in the data-flow contract; discard the rest and verify none leak into application or reverse-proxy logs.

Disposition: Application metadata discard/redaction and bounded counters tested; actual edge/proxy log inspection still requires host.

### 12A.C6 — satisfied

Original execution-plan line 419: Define repeatable test prompts for beginner, meteor, astrophotography, ambiguous-place, partial-provider, and coordinates-only scenarios; record expected tool calls, structured output signals, citations, and error behavior in `tests/platforms/host-cases.json`.

Disposition: Local manifests/one remote endpoint, Inspector evidence, coordinate contract and deterministic prompts exist. This finding does not assert actual hosted metadata, official validator or draft acceptance.

### 12A.C7 — partial

Original execution-plan line 420: Pass when the package draft validates, test cases are deterministic, and the host-test matrix clearly marks live checks as pending Task 15.

Disposition: Static rehearsal validates and matrix marks live checks pending. Final actual endpoint/identity draft is absent; local lint is not official validation.

## Task 12B: Validate Claude and Gemini routes separately

Evidence bundle: docs/platforms/{claude,gemini,host-workflow-guide}.md; tests/platforms/host-matrix.md; docs/operations/offline-operations-readiness.md.

### 12B.C1 — satisfied

Original execution-plan line 430: Document Claude's custom remote-MCP setup path and the account/region/product and location-input rules to verify during Task 15. Do not infer workflow-skill portability from tool compatibility.

Disposition: Separate route/account/region instructions and conditional matrix prepared; claimed live compatibility not asserted.

### 12B.C2 — satisfied

Original execution-plan line 431: Record the Gemini consumer MCP availability and the separate Gemini API/NightSky-owned route. Current official Google documentation lists consumer eligibility restrictions; verify availability and location-input rules with the intended account and region during Task 15.

Disposition: Separate route/account/region instructions and conditional matrix prepared; claimed live compatibility not asserted.

### 12B.C3 — satisfied

Original execution-plan line 432: Record remaining host differences; do not treat MCP protocol portability as proof of marketplace or consumer-app availability.

Disposition: Separate route/account/region instructions and conditional matrix prepared; claimed live compatibility not asserted.

### 12B.C4 — open

Original execution-plan line 433: Pass when every claimed route has a dated successful test record and unverified paths are labeled conditional.

Disposition: No dated successful intended-client connection records; actual account/surface/region gate.

## Task 13: Prepare required public listing and policy pages

Evidence bundle: client/src/pages/{Privacy,Terms,Support}.tsx; client/src/App.tsx; tests/operations/policies.test.ts; docs/operations/{policy-preparation,policy-host-wave,mcp-data-flow-and-logging}.md.

### 13.C1 — partial

Original execution-plan line 443: State the data sent to the MCP service and upstream providers, retention/logging behavior, third-party assistant handling, data-source terms, and contact path in plain language. Disclose that OpenAI tool-call metadata may include `openai/userLocation` (which may include longitude/latitude as well as city/region/country/timezone), anonymized `openai/subject` and `openai/session` identifiers, and optional organization, locale, and user-agent fields. Explain that the resolver uses the location hint only when `useApproximateHostLocation: true` is supplied for an explicit current-area request and the subject only for short-lived rate limiting; it discards other metadata and does not persist the hint or raw identifiers. State any retention for derived counters.

Disposition: Routes/plain-language draft and actual data-flow facts exist. Exact verified legal name, qualified risk-tiered jurisdiction/transfer review, actual edge retention and HTTPS links remain unproved.

### 13.C2 — satisfied

Original execution-plan line 444: Confirm the support destination is monitored; the current Contact page is not a working support channel if it only logs submissions in the browser.

Disposition: Owner-confirmed monitored nightsky.earth2026@gmail.com and actual mail link, recorded in policy/operations preparation; do not use old browser-only Contact form as evidence.

### 13.C3 — partial

Original execution-plan line 445: Draft and review page content against the actual data flow, including location handling, provider recipients and transfer destinations, server/proxy-log and rate-counter retention, user controls/rights requests, OSM/source licenses, and a monitored contact path. Make the service suitable for general audiences aged 13–17 and do not target children under 13.

Disposition: Routes/plain-language draft and actual data-flow facts exist. Exact verified legal name, qualified risk-tiered jurisdiction/transfer review, actual edge retention and HTTPS links remain unproved.

### 13.C4 — partial

Original execution-plan line 446: Add a documented, risk-tiered jurisdiction review before publication; do not treat `publication.countries: []` as requiring an unbounded line-by-line legal survey of every country. Identify the controller/publisher, data categories and recipients, purposes and lawful bases, retention, rights-request route, and international transfers. Prioritize qualified review of the publisher's home jurisdiction and intended high-reach audiences, including EU/EEA and UK GDPR (including representative requirements), India's DPDP Act and phased Rules, Brazil's LGPD, relevant U.S. state privacy regimes, and age rules for 13–17. Record the review status, relevant obligations, transfer safeguards, and rationale for other enabled markets; recheck before material expansion. If a material obligation cannot be supported, propose an explicit allowlist for owner review. This is a planning gate, not a legal conclusion. See the official GDPR, ICO, MeitY and ANPD sources in External References.

Disposition: Routes/plain-language draft and actual data-flow facts exist. Exact verified legal name, qualified risk-tiered jurisdiction/transfer review, actual edge retention and HTTPS links remain unproved.

### 13.C5 — partial

Original execution-plan line 447: Treat the Task 3 data-flow and retention contract as the policy draft. Task 14 must inspect staging defaults, set actual server/proxy retention, reconcile any mismatch in privacy text, and only then deploy the public policy/support routes.

Disposition: Routes/plain-language draft and actual data-flow facts exist. Exact verified legal name, qualified risk-tiered jurisdiction/transfer review, actual edge retention and HTTPS links remain unproved.

### 13.C6 — partial

Original execution-plan line 448: OpenAI requires website, support, privacy-policy, and terms URLs for a public remote-MCP listing; the public publisher identity must match the verified individual or business identity.

Disposition: Routes/plain-language draft and actual data-flow facts exist. Exact verified legal name, qualified risk-tiered jurisdiction/transfer review, actual edge retention and HTTPS links remain unproved.

### 13.C7 — partial

Original execution-plan line 449: Deploy and verify the URLs over HTTPS in Task 14/15; this task prepares the content/routes and does not redesign the website or rewrite its product positioning.

Disposition: Routes/plain-language draft and actual data-flow facts exist. Exact verified legal name, qualified risk-tiered jurisdiction/transfer review, actual edge retention and HTTPS links remain unproved.

## Task 14: Deploy the service and verify operations

Evidence bundle: server/{plugin,health,requestLogging}.ts; Dockerfile.plugin; tests/operations/{health,load-smoke,capacity,artifact-rollback,requestLogging}.test.ts; tests/mcp/local-proxy.test.ts; docs/operations/{deployment,privacy-and-telemetry,host-decision,local-proxy-wave,artifact-rollback}.md.

### 14.C1 — satisfied

Original execution-plan line 459: Fix the current POSIX-only `NODE_ENV=...` scripts using a cross-platform command approach; add documented `npm run dev`, `npm run check`, `npm test`, and `npm run build` commands.

Disposition: Local cross-platform commands, health/privacy/abuse/provider failure fixtures and locked production-audit evidence exist; actual host operations remain later rows. Re-run integrated checks before claiming current revision passes.

### 14.C2 — satisfied

Original execution-plan line 460: Add `/health` with no secrets or user coordinates. Build abuse controls from shared caching, global/per-tool request and cost ceilings, concurrency limits, and upstream backoff/circuit breakers. Do not rely on per-IP limits as the only control because assistant hosts may share egress IPs. Use OpenAI `openai/subject` only for short-lived per-user rate-limit counters on that route; do not log raw subject/session IDs, request `_meta`, location fields, complete MCP arguments, place queries or exact coordinates by default.

Disposition: Local cross-platform commands, health/privacy/abuse/provider failure fixtures and locked production-audit evidence exist; actual host operations remain later rows. Re-run integrated checks before claiming current revision passes.

### 14.C3 — open

Original execution-plan line 461: Inspect staging hosting and reverse-proxy access logs. Set and document short retention for IP/request metadata and rate counters, disable unnecessary query/body/header logging, and disclose any retained metadata and purpose on the privacy page. Pilot analytics must be aggregate-only and must not reconstruct individual query histories.

Disposition: Requires actual selected staging/production host: observed logs/retention, target capacity/TLS/streaming/rollback, authorized promotion, HTTPS policy URLs or actual cost/volume. Local rehearsal is not this evidence.

### 14.C4 — satisfied

Original execution-plan line 462: Test `returnsHealthyWithoutSecrets`, `doesNotLogCoordinates`, `limitsAnonymousRequests`, and `degradesWhenProviderFails`.

Disposition: Local cross-platform commands, health/privacy/abuse/provider failure fixtures and locked production-audit evidence exist; actual host operations remain later rows. Re-run integrated checks before claiming current revision passes.

| Named subcriterion | Disposition | Concrete fixture / required remaining evidence |
|---|---|---|
| 14.C4.T1 `returnsHealthyWithoutSecrets` | satisfied | Equivalent assertions inspected: tests/operations/health.test.ts health readiness redacts failures; tests/operations/requestLogging.test.ts fixed route/status/duration omits body; tests/operations/load-smoke.test.ts anonymous/global limit and recovery; tests/mcp/offline-resilience.test.ts provider outage preserves useful partial unknown output. Actual hosted logs/load belong to14.C3/C5/C7. |
| 14.C4.T2 `doesNotLogCoordinates` | satisfied | Equivalent assertions inspected: tests/operations/health.test.ts health readiness redacts failures; tests/operations/requestLogging.test.ts fixed route/status/duration omits body; tests/operations/load-smoke.test.ts anonymous/global limit and recovery; tests/mcp/offline-resilience.test.ts provider outage preserves useful partial unknown output. Actual hosted logs/load belong to14.C3/C5/C7. |
| 14.C4.T3 `limitsAnonymousRequests` | satisfied | Equivalent assertions inspected: tests/operations/health.test.ts health readiness redacts failures; tests/operations/requestLogging.test.ts fixed route/status/duration omits body; tests/operations/load-smoke.test.ts anonymous/global limit and recovery; tests/mcp/offline-resilience.test.ts provider outage preserves useful partial unknown output. Actual hosted logs/load belong to14.C3/C5/C7. |
| 14.C4.T4 `degradesWhenProviderFails` | satisfied | Equivalent assertions inspected: tests/operations/health.test.ts health readiness redacts failures; tests/operations/requestLogging.test.ts fixed route/status/duration omits body; tests/operations/load-smoke.test.ts anonymous/global limit and recovery; tests/mcp/offline-resilience.test.ts provider outage preserves useful partial unknown output. Actual hosted logs/load belong to14.C3/C5/C7. |

### 14.C5 — open

Original execution-plan line 463: Run a bounded staging load smoke with fixture providers at the selected 2 vCPU/4 GB target. Record request mix, concurrency, throughput, p50/p95 latency, process memory and errors; set application limits below the measured stable capacity with headroom. This is a capacity measurement, not a latency SLA.

Disposition: Requires actual selected staging/production host: observed logs/retention, target capacity/TLS/streaming/rollback, authorized promotion, HTTPS policy URLs or actual cost/volume. Local rehearsal is not this evidence.

### 14.C6 — satisfied

Original execution-plan line 464: Before any remote exposure, review `npm audit --omit=dev` against the locked production dependency tree. Triage high/critical advisories for reachability and impact; apply compatible updates or document a reviewed mitigation/removal for breaking upgrades. Do not use blanket force-upgrades, and do not expose the service remotely with unresolved high/critical findings lacking an explicit recorded disposition.

Disposition: Local cross-platform commands, health/privacy/abuse/provider failure fixtures and locked production-audit evidence exist; actual host operations remain later rows. Re-run integrated checks before claiming current revision passes.

### 14.C7 — open

Original execution-plan line 465: Deploy the candidate release to the separate staging hostname; verify `/health`, MCP Inspector initialize/list/call, streaming/session behavior, provider timeouts, access controls, privacy logging, and rollback. Keep the permanent production URL configured for the real OpenAI draft.

Disposition: Requires actual selected staging/production host: observed logs/retention, target capacity/TLS/streaming/rollback, authorized promotion, HTTPS policy URLs or actual cost/volume. Local rehearsal is not this evidence.

### 14.C8 — open

Original execution-plan line 466: After staging operational checks and pre-promotion smoke/regression cases pass, promote the full V1 release to the permanent production hostname; verify `/health`, the frozen MCP URL, provider behavior, and rollback. Task 15 then runs the full directory review cases against production. If any fail, fix on staging, repeat staging checks, promote again, and rerun affected production cases. Never point the real plugin draft at staging.

Disposition: Requires actual selected staging/production host: observed logs/retention, target capacity/TLS/streaming/rollback, authorized promotion, HTTPS policy URLs or actual cost/volume. Local rehearsal is not this evidence.

### 14.C9 — open

Original execution-plan line 467: After production logging and provider behavior are verified, reconcile and deploy the policy/support routes; test all four OpenAI listing URLs over HTTPS. The domain challenge is created and verified for the production hostname during Task 4B, not as a staging task.

Disposition: Requires actual selected staging/production host: observed logs/retention, target capacity/TLS/streaming/rollback, authorized promotion, HTTPS policy URLs or actual cost/volume. Local rehearsal is not this evidence.

### 14.C10 — open

Original execution-plan line 468: Measure actual monthly cost and provider request volume against the owner-confirmed budget. If the host exceeds it or cannot sustain transport behavior, stop public launch and revisit host choice.

Disposition: Requires actual selected staging/production host: observed logs/retention, target capacity/TLS/streaming/rollback, authorized promotion, HTTPS policy URLs or actual cost/volume. Local rehearsal is not this evidence.

## Task 15: Assemble the review-ready public package

Evidence bundle: plugins/nightsky/plugin.json; tests/platforms/review-cases.test.ts; scripts/build-plugin-package.ts; docs/platforms/chatgpt-submission.md; docs/operations/local-package-readiness.md; offline-operations-readiness.md.

### 15.C1 — partial

Original execution-plan line 478: Use the branded display name `NightSky.earth`, current listing metadata, required icon assets, versioned workflow skills, one remote MCP server URL, release notes, working website/privacy/terms/support URLs, and source/privacy explanations. Since V1 has no plugin UI and directory screenshots are not shown, provide up to three useful `defaultPrompt` examples instead of screenshots.

Disposition: Local branded package/asset/case/secret checks exist where applicable; final identity/production URL, official validation, actual assistant desktop/mobile cases, scope decisions and accessible real reviewer video remain required. Test fixture outcomes are not host outcomes.

### 15.C2 — partial

Original execution-plan line 479: Keep “free” and all other pricing, subscription, discount or promotion claims out of the public plugin title/subtitle/description. Set `publication.countries` to `[]` for the settled global intent, verify the current validator accepts it, and record platform distribution limits and source/feature coverage gaps separately. Before release, complete Task 13's jurisdiction review; if it identifies a necessary country restriction, record the reason and obtain the owner's approval before replacing the unrestricted default with an explicit allowlist.

Disposition: Local branded package/asset/case/secret checks exist where applicable; final identity/production URL, official validation, actual assistant desktop/mobile cases, scope decisions and accessible real reviewer video remain required. Test fixture outcomes are not host outcomes.

### 15.C3 — partial

Original execution-plan line 480: Prepare exactly five positive and three negative cases in the OpenAI `review.test_cases` array. Each names the prompt, expected tool sequence, and visible result; run every case before packaging. Use fixed place/date fixtures for these positive journeys: (1) casual stargazing from a named destination; include text-based candidate discovery and the no-access/no-safety caveat only if Task 8 is enabled, otherwise test a useful plan with candidate discovery explicitly unavailable; (2) a meteor-shower plan combining event timing, darkness, Moon, and available forecast; (3) a beginner asking what is visible from a named place and how to start; (4) an astrophotography plan with target/Moon timing, forecast, and gear-dependent preparation while stating unsupported seeing/transparency limits; and (5) a within-forecast-horizon comparison of two nights for a named telescope target, with source and availability labels. If Gate 0C passes, the months-ahead climatology case may replace one of these five; otherwise keep it in internal fixtures or the reviewer video, not in the submission case array.

Disposition: Local branded package/asset/case/secret checks exist where applicable; final identity/production URL, official validation, actual assistant desktop/mobile cases, scope decisions and accessible real reviewer video remain required. Test fixture outcomes are not host outcomes.

### 15.C4 — open

Original execution-plan line 481: Before packaging, record the owner's explicit decision for any V1 journey omitted because candidate discovery (Task 8) or months-ahead historical context (Task 9) failed feasibility. A reduced review case may reflect that decision, but it does not silently change the agreed V1 scope.

Disposition: Local branded package/asset/case/secret checks exist where applicable; final identity/production URL, official validation, actual assistant desktop/mobile cases, scope decisions and accessible real reviewer video remain required. Test fixture outcomes are not host outcomes.

### 15.C5 — partial

Original execution-plan line 482: Ensure exactly three negative cases each contain one deterministic prompt: (1) guarantee an aurora sighting, (2) view a solar eclipse through sunglasses, and (3) “Find a dark spot at 12.97, 77.59.” Expected behavior for case 3 is no plan: ask for a named destination and never convert/reverse-geocode the coordinates into a place name. Test the separate host-hint-absent branch deterministically in Task 4 fixtures rather than relying on a reviewer being able to control optional host metadata. Add the unmapped-park access/safety caveat to a positive place-discovery case.

Disposition: Local branded package/asset/case/secret checks exist where applicable; final identity/production URL, official validation, actual assistant desktop/mobile cases, scope decisions and accessible real reviewer video remain required. Test fixture outcomes are not host outcomes.

### 15.C6 — open

Original execution-plan line 483: After promoting the reviewed release, run the prepared positive/negative cases against the permanent production endpoint in fresh ChatGPT desktop and mobile sessions and Codex; test the same representative journey set through Claude and the available Gemini route, recording each route's actual network/connection path. Record device/surface, account/region limitations, date, and outcomes. Do not claim support for a route that was unavailable or untested.

Disposition: Local branded package/asset/case/secret checks exist where applicable; final identity/production URL, official validation, actual assistant desktop/mobile cases, scope decisions and accessible real reviewer video remain required. Test fixture outcomes are not host outcomes.

### 15.C7 — open

Original execution-plan line 484: If owner-invited testers can connect to staging, run a small pre-submission usability check and record sample size and findings; otherwise record why and run the invited pilot immediately after public listing. Keep the real plugin package pointed at production throughout.

Disposition: Local branded package/asset/case/secret checks exist where applicable; final identity/production URL, official validation, actual assistant desktop/mobile cases, scope decisions and accessible real reviewer video remain required. Test fixture outcomes are not host outcomes.

### 15.C8 — open

Original execution-plan line 485: Record an accessible reviewer video URL showing the required positive/negative cases, the supported ChatGPT surfaces, and how the service handles source gaps.

Disposition: Local branded package/asset/case/secret checks exist where applicable; final identity/production URL, official validation, actual assistant desktop/mobile cases, scope decisions and accessible real reviewer video remain required. Test fixture outcomes are not host outcomes.

### 15.C9 — partial

Original execution-plan line 486: Keep credentials/secrets out of the package. Freeze the full MCP URL (including scheme, hostname, port and path) before submission. The current OpenAI app-review and submission pages differ on endpoint-path URL changes; contact support or follow the more restrictive rule until the conflict is resolved.

Disposition: Local branded package/asset/case/secret checks exist where applicable; final identity/production URL, official validation, actual assistant desktop/mobile cases, scope decisions and accessible real reviewer video remain required. Test fixture outcomes are not host outcomes.

### 15.C10 — open

Original execution-plan line 487: Validate the ZIP using the current official package validator and resolve all blocking findings. Keep a copy of the exact reviewed artifact and checksum.

Disposition: Local branded package/asset/case/secret checks exist where applicable; final identity/production URL, official validation, actual assistant desktop/mobile cases, scope decisions and accessible real reviewer video remain required. Test fixture outcomes are not host outcomes.

### 15.C11 — partial

Original execution-plan line 488: Pass when the artifact, test cases, video, and public links are all owner-reviewable; do not submit in this task.

Disposition: Local branded package/asset/case/secret checks exist where applicable; final identity/production URL, official validation, actual assistant desktop/mobile cases, scope decisions and accessible real reviewer video remain required. Test fixture outcomes are not host outcomes.

## Task 16: Submit, review, and publish as separate owner-authorized actions

Evidence bundle: docs/platforms/chatgpt-submission.md (prepared status only; no actual submission/publication evidence).

### 16.C1 — open

Original execution-plan line 498: Obtain the owner’s explicit authorization before submitting the package through the OpenAI directory.

Disposition: Prepared procedure/template is not the required observed action. Requires owner/source/host/account/real-world gate stated in the original criterion; no action authorized by this audit.

### 16.C2 — open

Original execution-plan line 499: Before submission, verify the selected OpenAI organization/project and residency configuration can submit MCP plugins; the current review guidance excludes projects with EU data residency. Confirm the publisher identity is verified and matches the public policy/support pages.

Disposition: Prepared procedure/template is not the required observed action. Requires owner/source/host/account/real-world gate stated in the original criterion; no action authorized by this audit.

### 16.C3 — open

Original execution-plan line 500: Resolve automated/manual review findings and record each correction. Do not state that approval or placement is guaranteed.

Disposition: Prepared procedure/template is not the required observed action. Requires owner/source/host/account/real-world gate stated in the original criterion; no action authorized by this audit.

### 16.C4 — open

Original execution-plan line 501: After approval, wait for the owner’s separate instruction before selecting Publish.

Disposition: Prepared procedure/template is not the required observed action. Requires owner/source/host/account/real-world gate stated in the original criterion; no action authorized by this audit.

### 16.C5 — open

Original execution-plan line 502: After publication, verify the listing and install/use it in fresh ChatGPT and Codex sessions. Record actual availability and platform analytics fields.

Disposition: Prepared procedure/template is not the required observed action. Requires owner/source/host/account/real-world gate stated in the original criterion; no action authorized by this audit.

## Task 17: Run an invited pilot and record product evidence

Evidence bundle: docs/operations/pilot-measurement.md; pilot-findings-template.md (templates only; no actual participant observations).

### 17.C1 — open

Original execution-plan line 512: Recruit a small mix of current astronomy-app users, beginners, meteor/event observers, and astrophotographers, including testers from different hemispheres/time zones where available. Include the owner’s own real planning use and record the current multi-app workflow as a baseline; label this a usability pilot, not a globally representative market study.

Disposition: Prepared procedure/template is not the required observed action. Requires owner/source/host/account/real-world gate stated in the original criterion; no action authorized by this audit.

### 17.C2 — open

Original execution-plan line 513: Track only exposed measures: installations where the host reports them, successful/failed tool calls, data coverage, latency, source failures, outbound links, and voluntary plan usefulness/return feedback.

Disposition: Prepared procedure/template is not the required observed action. Requires owner/source/host/account/real-world gate stated in the original criterion; no action authorized by this audit.

### 17.C3 — open

Original execution-plan line 514: Keep installs, activations, MCP calls, and unique people as separate metrics. Do not infer identity or retention from anonymous tool calls.

Disposition: Prepared procedure/template is not the required observed action. Requires owner/source/host/account/real-world gate stated in the original criterion; no action authorized by this audit.

### 17.C4 — open

Original execution-plan line 515: Ask whether the plan changed their chosen place, time, activity preparation, or need to switch apps. Record observed behavior separately from stated preference.

Disposition: Prepared procedure/template is not the required observed action. Requires owner/source/host/account/real-world gate stated in the original criterion; no action authorized by this audit.

### 17.C5 — open

Original execution-plan line 516: Pass when pilot notes report the measured journey signals, sample size, data gaps, and a clear continue/change/stop recommendation. Do not infer unique-user retention from anonymous MCP calls.

Disposition: Prepared procedure/template is not the required observed action. Requires owner/source/host/account/real-world gate stated in the original criterion; no action authorized by this audit.

## Task 18: Open the separate website scope/design workstream

Evidence bundle: execution plan Task18 and separate website workstream boundary (no owner-reviewed brief evidenced).

### 18.C1 — open

Original execution-plan line 528: Start discovery and scope independently from plugin V1; use pilot behavior and feedback as additional evidence when available.

Disposition: Prepared procedure/template is not the required observed action. Requires owner/source/host/account/real-world gate stated in the original criterion; no action authorized by this audit.

### 18.C2 — open

Original execution-plan line 529: Revisit data licensing, coverage, access/safety evidence, operating cost, and maintenance needs for any proposed website feature.

Disposition: Prepared procedure/template is not the required observed action. Requires owner/source/host/account/real-world gate stated in the original criterion; no action authorized by this audit.

### 18.C3 — open

Original execution-plan line 530: Keep this scope and implementation plan independent from plugin V1; the owner may decide to defer or not build a proposed website feature.

Disposition: Prepared procedure/template is not the required observed action. Requires owner/source/host/account/real-world gate stated in the original criterion; no action authorized by this audit.

### 18.C4 — open

Original execution-plan line 531: Pass when a separate scope/design brief is ready for discussion. Do not implement website changes as part of this task.

Disposition: Prepared procedure/template is not the required observed action. Requires owner/source/host/account/real-world gate stated in the original criterion; no action authorized by this audit.

## Count and controller edit ledger

Coverage: 27 of 27 original headings; 160 of 160 original checkboxes; six independent Task0 gates; 112 named fixture subcriteria. All criterion text above is retained from the original plan. These counts do not pretend each paragraph contains only one substantive clause. Compound clauses are disposed by the detailed explanations.

Ledger row counts: {"satisfied": 200, "partial": 33, "open": 43, "conditional-NA": 2}. Strict original-heading recommendation: 11 Done / 10 Partial / 6 Not started, solely changing Task4 from provisional Done. An explicit named-place scope reconciliation can restore 12/9/6; neither matrix is a global/public launch claim.

Unchecked original boxes that can now be checked locally include Task6.C6/C7, Task8.C1/C5/C7/C8/C9, Task9.C1/C2/C4/C6, Task12A.C1/C2/C4/C6, Task12B.C1/C2/C3, Task13.C2, Task14.C1/C2/C4/C6 and Task4B.C4. Leave partial compound boxes unchecked with their exact remaining clause stated; checking local boxes does not close a source/host heading.

Local unresolved implementation/scope gaps: Task4 original boundary interface/fixture mismatch; Task6 complete activity-window catalog and licensed model coverage/maintained recurrence; global candidate and historical release artifacts after approved source/host gates. Externally gated evidence: source-rights/ODbL and meteor seasons, historical acquisition authorization, budgets/identity/project/hostnames/legal review, real host/log/capacity, actual assistant paths/scans/validator/video/submission/publication/pilot. Optional/future: GEFS, VIIRS if darkness stays unknown, transient sources, website Task18, all-years numerical certification, universal relations completeness, scheduled jitter until a scheduler exists.

```json
{
  "headingRecommendations": {
    "Done": [
      "1",
      "10A",
      "10B",
      "11A",
      "11B",
      "11C",
      "2",
      "3",
      "5",
      "7A",
      "7B"
    ],
    "Partial": [
      "0",
      "4",
      "6",
      "8",
      "9",
      "12A",
      "12B",
      "13",
      "14",
      "15"
    ],
    "Not started": [
      "16",
      "17",
      "18",
      "3B",
      "3C",
      "4B"
    ]
  },
  "originalCheckboxRecommendations": [
    {
      "id": "0.C1",
      "status": "partial",
      "checkbox": false
    },
    {
      "id": "1.C1",
      "status": "satisfied",
      "checkbox": true
    },
    {
      "id": "1.C2",
      "status": "satisfied",
      "checkbox": true
    },
    {
      "id": "1.C3",
      "status": "satisfied",
      "checkbox": true
    },
    {
      "id": "1.C4",
      "status": "satisfied",
      "checkbox": true
    },
    {
      "id": "1.C5",
      "status": "satisfied",
      "checkbox": true
    },
    {
      "id": "1.C6",
      "status": "satisfied",
      "checkbox": true
    },
    {
      "id": "1.C7",
      "status": "satisfied",
      "checkbox": true
    },
    {
      "id": "2.C1",
      "status": "satisfied",
      "checkbox": true
    },
    {
      "id": "2.C2",
      "status": "satisfied",
      "checkbox": true
    },
    {
      "id": "2.C3",
      "status": "satisfied",
      "checkbox": true
    },
    {
      "id": "2.C4",
      "status": "satisfied",
      "checkbox": true
    },
    {
      "id": "2.C5",
      "status": "satisfied",
      "checkbox": true
    },
    {
      "id": "2.C6",
      "status": "satisfied",
      "checkbox": true
    },
    {
      "id": "2.C7",
      "status": "satisfied",
      "checkbox": true
    },
    {
      "id": "2.C8",
      "status": "satisfied",
      "checkbox": true
    },
    {
      "id": "2.C9",
      "status": "satisfied",
      "checkbox": true
    },
    {
      "id": "2.C10",
      "status": "satisfied",
      "checkbox": true
    },
    {
      "id": "2.C11",
      "status": "satisfied",
      "checkbox": true
    },
    {
      "id": "2.C12",
      "status": "satisfied",
      "checkbox": true
    },
    {
      "id": "2.C13",
      "status": "satisfied",
      "checkbox": true
    },
    {
      "id": "3.C1",
      "status": "satisfied",
      "checkbox": true
    },
    {
      "id": "3.C2",
      "status": "satisfied",
      "checkbox": true
    },
    {
      "id": "3.C3",
      "status": "satisfied",
      "checkbox": true
    },
    {
      "id": "3.C4",
      "status": "satisfied",
      "checkbox": true
    },
    {
      "id": "3.C5",
      "status": "satisfied",
      "checkbox": true
    },
    {
      "id": "3.C6",
      "status": "satisfied",
      "checkbox": true
    },
    {
      "id": "3.C7",
      "status": "satisfied",
      "checkbox": true
    },
    {
      "id": "3.C8",
      "status": "satisfied",
      "checkbox": true
    },
    {
      "id": "3.C9",
      "status": "satisfied",
      "checkbox": true
    },
    {
      "id": "3.C10",
      "status": "satisfied",
      "checkbox": true
    },
    {
      "id": "3.C11",
      "status": "satisfied",
      "checkbox": true
    },
    {
      "id": "3B.C1",
      "status": "open",
      "checkbox": false
    },
    {
      "id": "3B.C2",
      "status": "open",
      "checkbox": false
    },
    {
      "id": "3B.C3",
      "status": "open",
      "checkbox": false
    },
    {
      "id": "3B.C4",
      "status": "open",
      "checkbox": false
    },
    {
      "id": "3C.C1",
      "status": "open",
      "checkbox": false
    },
    {
      "id": "3C.C2",
      "status": "open",
      "checkbox": false
    },
    {
      "id": "3C.C3",
      "status": "open",
      "checkbox": false
    },
    {
      "id": "3C.C4",
      "status": "open",
      "checkbox": false
    },
    {
      "id": "3C.C5",
      "status": "open",
      "checkbox": false
    },
    {
      "id": "4.C1",
      "status": "partial",
      "checkbox": false
    },
    {
      "id": "4.C2",
      "status": "satisfied",
      "checkbox": true
    },
    {
      "id": "4.C3",
      "status": "satisfied",
      "checkbox": true
    },
    {
      "id": "4.C4",
      "status": "partial",
      "checkbox": false
    },
    {
      "id": "4B.C1",
      "status": "open",
      "checkbox": false
    },
    {
      "id": "4B.C2",
      "status": "open",
      "checkbox": false
    },
    {
      "id": "4B.C3",
      "status": "open",
      "checkbox": false
    },
    {
      "id": "4B.C4",
      "status": "satisfied",
      "checkbox": true
    },
    {
      "id": "4B.C5",
      "status": "open",
      "checkbox": false
    },
    {
      "id": "4B.C6",
      "status": "open",
      "checkbox": false
    },
    {
      "id": "5.C1",
      "status": "satisfied",
      "checkbox": true
    },
    {
      "id": "5.C2",
      "status": "satisfied",
      "checkbox": true
    },
    {
      "id": "5.C3",
      "status": "satisfied",
      "checkbox": true
    },
    {
      "id": "5.C4",
      "status": "satisfied",
      "checkbox": true
    },
    {
      "id": "6.C1",
      "status": "partial",
      "checkbox": false
    },
    {
      "id": "6.C2",
      "status": "partial",
      "checkbox": false
    },
    {
      "id": "6.C3",
      "status": "partial",
      "checkbox": false
    },
    {
      "id": "6.C4",
      "status": "partial",
      "checkbox": false
    },
    {
      "id": "6.C5",
      "status": "partial",
      "checkbox": false
    },
    {
      "id": "6.C6",
      "status": "satisfied",
      "checkbox": true
    },
    {
      "id": "6.C7",
      "status": "satisfied",
      "checkbox": true
    },
    {
      "id": "6.C8",
      "status": "partial",
      "checkbox": false
    },
    {
      "id": "7A.C1",
      "status": "satisfied",
      "checkbox": true
    },
    {
      "id": "7A.C2",
      "status": "satisfied",
      "checkbox": true
    },
    {
      "id": "7A.C3",
      "status": "satisfied",
      "checkbox": true
    },
    {
      "id": "7A.C4",
      "status": "satisfied",
      "checkbox": true
    },
    {
      "id": "7A.C5",
      "status": "satisfied",
      "checkbox": true
    },
    {
      "id": "7A.C6",
      "status": "conditional-NA",
      "checkbox": true
    },
    {
      "id": "7B.C1",
      "status": "satisfied",
      "checkbox": true
    },
    {
      "id": "7B.C2",
      "status": "satisfied",
      "checkbox": true
    },
    {
      "id": "7B.C3",
      "status": "satisfied",
      "checkbox": true
    },
    {
      "id": "8.C1",
      "status": "satisfied",
      "checkbox": true
    },
    {
      "id": "8.C2",
      "status": "partial",
      "checkbox": false
    },
    {
      "id": "8.C3",
      "status": "partial",
      "checkbox": false
    },
    {
      "id": "8.C4",
      "status": "open",
      "checkbox": false
    },
    {
      "id": "8.C5",
      "status": "satisfied",
      "checkbox": true
    },
    {
      "id": "8.C6",
      "status": "partial",
      "checkbox": false
    },
    {
      "id": "8.C7",
      "status": "satisfied",
      "checkbox": true
    },
    {
      "id": "8.C8",
      "status": "satisfied",
      "checkbox": true
    },
    {
      "id": "8.C9",
      "status": "satisfied",
      "checkbox": true
    },
    {
      "id": "9.C1",
      "status": "satisfied",
      "checkbox": true
    },
    {
      "id": "9.C2",
      "status": "satisfied",
      "checkbox": true
    },
    {
      "id": "9.C3",
      "status": "partial",
      "checkbox": false
    },
    {
      "id": "9.C4",
      "status": "satisfied",
      "checkbox": true
    },
    {
      "id": "9.C5",
      "status": "partial",
      "checkbox": false
    },
    {
      "id": "9.C6",
      "status": "satisfied",
      "checkbox": true
    },
    {
      "id": "10A.C1",
      "status": "satisfied",
      "checkbox": true
    },
    {
      "id": "10A.C2",
      "status": "satisfied",
      "checkbox": true
    },
    {
      "id": "10A.C3",
      "status": "satisfied",
      "checkbox": true
    },
    {
      "id": "10A.C4",
      "status": "satisfied",
      "checkbox": true
    },
    {
      "id": "10A.C5",
      "status": "satisfied",
      "checkbox": true
    },
    {
      "id": "10B.C1",
      "status": "satisfied",
      "checkbox": true
    },
    {
      "id": "10B.C2",
      "status": "satisfied",
      "checkbox": true
    },
    {
      "id": "10B.C3",
      "status": "satisfied",
      "checkbox": true
    },
    {
      "id": "11A.C1",
      "status": "satisfied",
      "checkbox": true
    },
    {
      "id": "11A.C2",
      "status": "satisfied",
      "checkbox": true
    },
    {
      "id": "11A.C3",
      "status": "satisfied",
      "checkbox": true
    },
    {
      "id": "11B.C1",
      "status": "satisfied",
      "checkbox": true
    },
    {
      "id": "11B.C2",
      "status": "satisfied",
      "checkbox": true
    },
    {
      "id": "11B.C3",
      "status": "satisfied",
      "checkbox": true
    },
    {
      "id": "11B.C4",
      "status": "satisfied",
      "checkbox": true
    },
    {
      "id": "11C.C1",
      "status": "satisfied",
      "checkbox": true
    },
    {
      "id": "11C.C2",
      "status": "satisfied",
      "checkbox": true
    },
    {
      "id": "11C.C3",
      "status": "satisfied",
      "checkbox": true
    },
    {
      "id": "11C.C4",
      "status": "satisfied",
      "checkbox": true
    },
    {
      "id": "11C.C5",
      "status": "satisfied",
      "checkbox": true
    },
    {
      "id": "12A.C1",
      "status": "satisfied",
      "checkbox": true
    },
    {
      "id": "12A.C2",
      "status": "satisfied",
      "checkbox": true
    },
    {
      "id": "12A.C3",
      "status": "open",
      "checkbox": false
    },
    {
      "id": "12A.C4",
      "status": "satisfied",
      "checkbox": true
    },
    {
      "id": "12A.C5",
      "status": "partial",
      "checkbox": false
    },
    {
      "id": "12A.C6",
      "status": "satisfied",
      "checkbox": true
    },
    {
      "id": "12A.C7",
      "status": "partial",
      "checkbox": false
    },
    {
      "id": "12B.C1",
      "status": "satisfied",
      "checkbox": true
    },
    {
      "id": "12B.C2",
      "status": "satisfied",
      "checkbox": true
    },
    {
      "id": "12B.C3",
      "status": "satisfied",
      "checkbox": true
    },
    {
      "id": "12B.C4",
      "status": "open",
      "checkbox": false
    },
    {
      "id": "13.C1",
      "status": "partial",
      "checkbox": false
    },
    {
      "id": "13.C2",
      "status": "satisfied",
      "checkbox": true
    },
    {
      "id": "13.C3",
      "status": "partial",
      "checkbox": false
    },
    {
      "id": "13.C4",
      "status": "partial",
      "checkbox": false
    },
    {
      "id": "13.C5",
      "status": "partial",
      "checkbox": false
    },
    {
      "id": "13.C6",
      "status": "partial",
      "checkbox": false
    },
    {
      "id": "13.C7",
      "status": "partial",
      "checkbox": false
    },
    {
      "id": "14.C1",
      "status": "satisfied",
      "checkbox": true
    },
    {
      "id": "14.C2",
      "status": "satisfied",
      "checkbox": true
    },
    {
      "id": "14.C3",
      "status": "open",
      "checkbox": false
    },
    {
      "id": "14.C4",
      "status": "satisfied",
      "checkbox": true
    },
    {
      "id": "14.C5",
      "status": "open",
      "checkbox": false
    },
    {
      "id": "14.C6",
      "status": "satisfied",
      "checkbox": true
    },
    {
      "id": "14.C7",
      "status": "open",
      "checkbox": false
    },
    {
      "id": "14.C8",
      "status": "open",
      "checkbox": false
    },
    {
      "id": "14.C9",
      "status": "open",
      "checkbox": false
    },
    {
      "id": "14.C10",
      "status": "open",
      "checkbox": false
    },
    {
      "id": "15.C1",
      "status": "partial",
      "checkbox": false
    },
    {
      "id": "15.C2",
      "status": "partial",
      "checkbox": false
    },
    {
      "id": "15.C3",
      "status": "partial",
      "checkbox": false
    },
    {
      "id": "15.C4",
      "status": "open",
      "checkbox": false
    },
    {
      "id": "15.C5",
      "status": "partial",
      "checkbox": false
    },
    {
      "id": "15.C6",
      "status": "open",
      "checkbox": false
    },
    {
      "id": "15.C7",
      "status": "open",
      "checkbox": false
    },
    {
      "id": "15.C8",
      "status": "open",
      "checkbox": false
    },
    {
      "id": "15.C9",
      "status": "partial",
      "checkbox": false
    },
    {
      "id": "15.C10",
      "status": "open",
      "checkbox": false
    },
    {
      "id": "15.C11",
      "status": "partial",
      "checkbox": false
    },
    {
      "id": "16.C1",
      "status": "open",
      "checkbox": false
    },
    {
      "id": "16.C2",
      "status": "open",
      "checkbox": false
    },
    {
      "id": "16.C3",
      "status": "open",
      "checkbox": false
    },
    {
      "id": "16.C4",
      "status": "open",
      "checkbox": false
    },
    {
      "id": "16.C5",
      "status": "open",
      "checkbox": false
    },
    {
      "id": "17.C1",
      "status": "open",
      "checkbox": false
    },
    {
      "id": "17.C2",
      "status": "open",
      "checkbox": false
    },
    {
      "id": "17.C3",
      "status": "open",
      "checkbox": false
    },
    {
      "id": "17.C4",
      "status": "open",
      "checkbox": false
    },
    {
      "id": "17.C5",
      "status": "open",
      "checkbox": false
    },
    {
      "id": "18.C1",
      "status": "open",
      "checkbox": false
    },
    {
      "id": "18.C2",
      "status": "open",
      "checkbox": false
    },
    {
      "id": "18.C3",
      "status": "open",
      "checkbox": false
    },
    {
      "id": "18.C4",
      "status": "open",
      "checkbox": false
    }
  ],
  "independentGates": [
    {
      "id": "0A",
      "status": "partial",
      "checkbox": null
    },
    {
      "id": "0B",
      "status": "partial",
      "checkbox": null
    },
    {
      "id": "0C",
      "status": "partial",
      "checkbox": null
    },
    {
      "id": "0D",
      "status": "satisfied",
      "checkbox": null
    },
    {
      "id": "0E",
      "status": "satisfied",
      "checkbox": null
    },
    {
      "id": "0F",
      "status": "open",
      "checkbox": null
    }
  ],
  "counts": {
    "satisfied": 200,
    "partial": 33,
    "open": 43,
    "conditional-NA": 2
  }
}
```


## Accepted Task4 disposition — local evidence wave, 14 October 2026

The owner accepted global named-place timezone V1 and deferred coordinate-boundary lookup. Root replaced Task4 interfaces/C1/C4 wording explicitly, preserving previous exact criteria above and Git history. [Mapped acceptance](timezone-acceptance-wave.md) and [scope disposition](timezone-scope-reconciliation.md) cover named-record zones, missing/invalid/unsupported IDs without UTC fallback, named-area near-me limitations, opposing civil dates, fractional offsets, UTC-fold display, candidate-plan rejection and independent runtime/gazetteer refresh/rollback provenance. Fresh484 Node tests:483 passed/one permission skip/zero failures; three type configurations pass; independent timezone review clear. Task4 is Done under accepted scope; current counts12 Done/9 Partial/6 Not started. Group4 stays Partial because4B requires an actual draft. The historical JSON recommendations above describe the unchanged original boundary requirement and are not the current accepted scope.

## Current Hanle rehearsal disposition — 14 October 2026

Root accepted independent review of the actual Claude tools-only rehearsal and direct MCP reproduction: **5.C4,10A.C3 and10A.C5 are partial**, superseding their satisfied snapshot above. Short requested-window darkness is numerically clipped; the polarState name and planner Polar label imply a whole-day condition the evidence does not establish. Matching threshold intervals do not prove a mocked ephemeris. Existing reference tests remain valid; final semantic contract/regression and installed-skill/model acceptance are deferred, not resolved by workflow text. Current headings10 Done/11 Partial/6 Not started, groups4/12/3. Original160 boxes reconcile to89checked/71open. See [handoff](local-completion-next-actions.md) and [wave](../superpowers/plans/2026-10-14-nightsky-local-package-completion.md). No source/host/public gate closed.
