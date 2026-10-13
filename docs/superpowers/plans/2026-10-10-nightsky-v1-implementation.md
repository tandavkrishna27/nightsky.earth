# NightSky.earth V1 Implementation Plan

> **Superseded:** This first draft grouped too many independent deliverables into large tasks. Use the [V1 execution plan](2026-10-10-nightsky-v1-execution-ready.md) as the sole implementation checklist and the [reviewed V1 plan](2026-10-10-nightsky-v1-implementation-reviewed.md) as its product decision record.

> **For agentic workers:** REQUIRED SUB-SKILL: Use `superpowers:subagent-driven-development` (recommended) or `superpowers:executing-plans` to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the free, assistant-first NightSky.earth V1 that turns a user's observing goal, place and date into a source-transparent night-sky plan across compatible AI assistants.

**Architecture:** Keep the existing React/Vite website and add a platform-neutral TypeScript planning service behind one read-only Streamable HTTP MCP endpoint. Implement astronomy, places and weather as independent modules with shared Zod contracts and provenance; each forecast remains a separate source record. Package host-specific instructions/skills outside the provider core. The interactive map, community features, account data and automatic reminders stay out of V1.

**Tech Stack:** Existing Node.js 20, TypeScript, Express, Vite, Zod and `tsx`; add the official `@modelcontextprotocol/sdk` and use Node's built-in test runner through `tsx --test`. Use an astronomy library only after verifying its license and required calculations. Use MET Norway's JSON API first; NOAA GEFS GRIB decoding is an optional provider task gated on a small decoder/operations spike.

**Spec:** [`docs/product-scope-v1-v3.md`](../../product-scope-v1-v3.md)

## Global Constraints

- Keep the user price and required data/API fees at zero.
- Return each weather forecast separately with source/model name, issue time, valid time, horizon and missing fields; do not blend or rank forecast models.
- MET Norway is the initial weather source; NOAA GEFS is optional until decoding and operations are proven.
- Label forecasts, observations, calculated astronomy and historical climatology as different data classes.
- V1 is read-only and does not require an account, exact GPS permission, social media access, user submissions or user-location history.
- Text-based public place candidates are not proof of legal access, current opening, safety or suitability after dark.
- V1 has no interactive map UI, aggregate “good sky” score, certified Bortle/SQM output, promised seeing/transparency, or background reminders.
- Keep output schemas and planning logic usable without a custom assistant UI; isolate host-specific behavior.
- Apply each source's license, attribution, request policy, freshness and cache rules before release.
- Use the proposed $25/month maximum as a pilot budget constraint to validate, not as a scale guarantee.

## Review Focus

- Invalid coordinates, ambiguous place names and high-latitude dates must return validation/clarification or a truthful no-darkness result, not fabricated times.
- Partial weather responses, missing fields, provider throttling and timeouts must yield source-specific partial results rather than a false complete forecast.
- Forecasts from different sources or different valid times must remain clearly distinct; a source disagreement must not be silently averaged.
- Place tags and stale data must not be presented as verified access, safety, night opening or clear horizon.
- Local time, daylight-saving changes, UTC timestamps and event visibility must remain correct across time zones and polar edge cases.

---

## File Map

| Path | Responsibility |
|---|---|
| `shared/nightsky.ts` | Zod input/result contracts shared by MCP tools and service modules. |
| `server/mcp/index.ts` | MCP server construction, tool registration and read-only annotations. |
| `server/mcp/route.ts` | Streamable HTTP transport mounted at `/mcp`; keep it separate from the current REST routes. |
| `server/nightsky/planner.ts` | Orchestrates deterministic calculations and provider calls into a plan with provenance. |
| `server/nightsky/astronomy.ts` | Local twilight, darkness, Moon and supported target/event computations. |
| `server/nightsky/time.ts` | Time-zone resolution and local/UTC conversion helpers. |
| `server/providers/weather/metNorway.ts` | MET Norway request, parsing, attribution and provider-specific missing-field handling. |
| `server/providers/weather/noaaGefS.ts` | Optional NOAA GEFS filtering, decoding and member-spread representation. |
| `server/providers/weather/types.ts` | Shared provider interface; returns separate provider forecasts, never a combined model value. |
| `server/places/geonames.ts` | GeoNames place-name search over an imported local dataset/index. |
| `server/places/osmCandidates.ts` | OSM candidate-place query/index and source/license metadata. |
| `server/places/index.ts` | Place resolution and candidate search composition. |
| `server/events/catalog.ts` | Versioned/attributed event records not produced by deterministic astronomy calculations. |
| `server/content/specialistTools.ts` | Reviewed static app/tool directory with source and last-reviewed date. |
| `plugins/nightsky/skills/` | Canonical five guidance workflows: place discovery, stargazing, astrophotography, sky events and outing preparation. |
| `plugins/nightsky/plugin.json` | Local ChatGPT plugin package metadata and MCP server mapping, following the current platform format. |
| `tests/` | Unit and protocol-level tests using Node's test runner. |
| `docs/operations/data-sources.md` | Source license, attribution, cache, rate, freshness and fallback register. |
| `docs/operations/deployment.md` | Local run, chosen MCP host, secrets, monitoring, cost limits and failure behavior. |

## Implementation Tasks

### Task 1: Establish shared planning contracts and test runner

**Files:**
- Create: `shared/nightsky.ts`
- Modify: `package.json`
- Create: `tests/shared/nightsky.test.ts`

**Interfaces:**
- Produce `PlaceRefSchema`, `TimeWindowSchema`, `SourceRecordSchema`, `WeatherForecastSchema`, `AvailabilitySchema`, and `PlanResultSchema` with inferred TypeScript types.
- A source record contains `provider`, `model`, `issuedAt`, `retrievedAt`, `validStart`, `validEnd`, `horizonHours`, `dataClass`, `resolution`, `attribution` and `sourceUrl` where available.
- A weather forecast contains `source: SourceRecord`, a list of timestamped condition points, `missingFields`, and uncertainty notes. There is no source-merging field.
- Add `npm test` using `tsx --test` and Node's built-in test runner; do not introduce another test framework.

- [ ] Add `place_ref_rejects_out_of_range_coordinates`, `source_record_requires_valid_issue_and_valid_times`, `weather_forecast_accepts_missing_optional_fields`, and `plan_result_keeps_two_forecasts_separate` tests.
- [ ] Run `npm test`; confirm invalid coordinates/timestamps fail schema parsing and valid partial forecasts pass.
- [ ] Implement the Zod schemas and inferred types.
- [ ] Run `npm test` again; confirm all contract tests pass.

### Task 2: Add local Streamable HTTP MCP endpoint

**Files:**
- Modify: `package.json`
- Create: `server/mcp/index.ts`
- Create: `server/mcp/route.ts`
- Modify: `server/index.ts`
- Create: `tests/mcp/initialize.test.ts`
- Create: `tests/mcp/tools.test.ts`

**Interfaces:**
- `createNightSkyMcpServer(): McpServer` registers tool metadata and handlers.
- `mountMcpRoute(app: Express): void` mounts Streamable HTTP at `/mcp` and returns MCP-compliant protocol errors.
- Initial tools: `resolve_place`, `get_astronomy_window`, `get_night_conditions`, `search_sky_events`, `plan_observing_session`, `search_observing_locations`, `get_clear_sky_climatology`, `get_aurora_outlook`, `get_target_visibility`, `get_location_context`, `compare_observing_options`, and `recommend_specialist_tools`. Tools may return an explicit `unavailable` result until their provider task is complete.
- Mark lookups read-only/non-destructive and open-world when reaching public services. Validate all arguments with shared Zod schemas.

- [ ] Add `mcp_initialize_lists_nightsky_tools` and `mcp_tool_schema_matches_shared_zod_schema` tests.
- [ ] Add `mcp_invalid_arguments_return_structured_error_without_provider_call` test.
- [ ] Install the official MCP TypeScript SDK and implement the Streamable HTTP endpoint.
- [ ] Run `npm test` and connect MCP Inspector to `http://localhost:5000/mcp`; confirm initialize, tool discovery and one invalid-input call.
- [ ] Preserve existing `/api/news` and website routes while mounting `/mcp`.

### Task 3: Implement local astronomy and time-zone calculations

**Files:**
- Create: `server/nightsky/time.ts`
- Create: `server/nightsky/astronomy.ts`
- Modify: `shared/nightsky.ts`
- Create: `tests/nightsky/time.test.ts`
- Create: `tests/nightsky/astronomy.test.ts`

**Interfaces:**
- `getAstronomyWindow(place: PlaceRef, date: string): Promise<AstronomyWindowResult>` returns local civil/nautical/astronomical twilight, darkness intervals, Moon phase/illumination/rise/set/altitude, local time zone and calculation source.
- `getTargetVisibility(target: TargetRef, place: PlaceRef, window: TimeWindow): Promise<TargetVisibilityResult>` returns local rise/set, altitude/azimuth samples and visible windows when supported.
- Verify the selected astronomy library's license and supported date/coordinate behavior before adding it; do not invent unsupported target data.

- [ ] Add `astronomy_window_returns_local_twilight_and_darkness`, `time_conversion_handles_dst_boundary`, `polar_summer_returns_no_astronomical_darkness`, and `polar_winter_returns_dark_interval` tests.
- [ ] Add `moon_result_has_phase_illumination_and_rise_set` and `target_visibility_returns_supported_rise_set_and_altitude` tests using fixed reference cases.
- [ ] Implement time-zone lookup using the selected versioned open boundary source and calculation library.
- [ ] Run `npm test`; check timestamps are returned in UTC and converted to the correct local zone.

### Task 4: Implement MET Norway forecast adapter and distinct forecast output

**Files:**
- Create: `server/providers/weather/types.ts`
- Create: `server/providers/weather/metNorway.ts`
- Modify: `shared/nightsky.ts`
- Modify: `server/mcp/index.ts`
- Create: `tests/providers/weather/metNorway.test.ts`

**Interfaces:**
- `WeatherProvider.getForecast(place: PlaceRef, window: TimeWindow): Promise<WeatherForecastResult>` returns a provider-specific result and never merges sources.
- `MetNorwayProvider` sends a unique descriptive `User-Agent`, applies documented request/cache behavior, records the provider update timestamp, and maps only fields actually returned.
- `get_night_conditions` returns `forecasts: WeatherForecastResult[]`, even when there is only one source, plus availability and per-source missing fields.

- [ ] Add `met_maps_supported_fields_and_update_time`, `met_preserves_missing_optional_fields`, `met_stale_result_is_marked`, `met_http_error_is_unavailable`, `met_timeout_is_partial_failure`, and `met_403_is_rate_limited` tests using fixtures/mocked fetch.
- [ ] Implement the adapter and add attribution/source URL to results.
- [ ] Call the MCP tool for one named test location; confirm its output keeps missing values null/absent rather than filling them in.
- [ ] Run `npm test`; confirm source and valid-time metadata are preserved.

### Task 5: Decide and implement the NOAA GEFS adapter as an optional provider

**Files:**
- Create: `server/providers/weather/noaaGefS.ts`
- Modify: `server/providers/weather/types.ts`
- Modify: `server/mcp/index.ts`
- Create: `tests/providers/weather/noaaGefS.test.ts`
- Create/update: `docs/operations/data-sources.md`

**Interfaces:**
- `NoaaGefSProvider.getForecast(place: PlaceRef, window: TimeWindow): Promise<WeatherForecastResult>` returns a NOAA-specific forecast with run time, valid times, selected fields, ensemble statistic/member spread and uncertainty metadata.
- Use an open GRIB decoder and document its license/runtime footprint. Request only necessary fields/time steps and only a small spatial subset; never download/retain the full global archive for point lookups.
- Register NOAA GEFS only when decoding, time alignment, source attribution and budget checks succeed. Otherwise the tool reports `not_configured`/`unavailable`, and MET Norway still provides V1 weather.

- [ ] Add `gefs_decodes_cloud_subset_and_run_metadata`, `gefs_converts_units_without_changing_source_values`, and `gefs_missing_data_is_unavailable` tests using decoder fixtures.
- [ ] Verify one real filtered NOAA cloud/wind/temperature output for a sample point and valid time after installing the decoder.
- [ ] Keep the source result separate from the MET Norway result; add no averaging, ranking or “winner” logic.
- [ ] Record whether the decoder/runtime and scheduled/request-time extraction fit the $25/month public-pilot ceiling; document the launch decision.

### Task 6: Add named-place and public candidate-location search

**Files:**
- Create: `server/places/index.ts`
- Create: `server/places/geonames.ts`
- Create: `server/places/osmCandidates.ts`
- Modify: `shared/nightsky.ts`
- Modify: `server/mcp/index.ts`
- Create: `tests/places/geonames.test.ts`
- Create: `tests/places/osmCandidates.test.ts`
- Create/update: `docs/operations/data-sources.md`

**Interfaces:**
- `resolvePlace(query: ResolvePlaceInput): Promise<ResolvePlaceResult>` returns matches, source URL, coordinate precision and ambiguity state.
- `searchObservingLocations(query: CandidateSearchInput): Promise<CandidateSearchResult>` returns candidate name/type, coordinate, source URL, distance estimate, source object ID, import vintage and access/opening-hours evidence where present.
- Initial candidate tags include public parks, campgrounds, viewpoints and mapped observation-related features; filter out unsupported/ambiguous categories rather than inventing suitability.

- [ ] Add `geonames_returns_ambiguous_matches`, `geonames_empty_query_returns_no_match`, `geonames_malformed_row_is_skipped`, and `osm_candidate_exposes_stale_import_vintage` tests.
- [ ] Implement a local/indexed GeoNames place lookup using the daily file format and a defined refresh procedure.
- [ ] Implement candidate lookup over an explicitly selected small/regionally staged OSM extract; document ODbL attribution and database treatment.
- [ ] Define and run a repeatable process to expand/update the candidate index across country/region extracts for global baseline coverage, with known coverage gaps returned explicitly.
- [ ] Confirm neither implementation depends on public Nominatim autocomplete or public Overpass for production traffic.
- [ ] Run `npm test`; verify result payloads preserve provenance and label access status `unknown` unless directly evidenced.

### Task 7: Add event catalogs, aurora and seasonal context

**Files:**
- Create: `server/events/catalog.ts`
- Create: `server/providers/aurora/noaaSwpc.ts`
- Create: `server/providers/climate/era5.ts`
- Modify: `server/mcp/index.ts`
- Create: `tests/events/catalog.test.ts`
- Create: `tests/providers/aurora/noaaSwpc.test.ts`
- Create: `tests/providers/climate/era5.test.ts`
- Create/update: `docs/operations/data-sources.md`

**Interfaces:**
- `searchSkyEvents(query: SkyEventQuery): Promise<SkyEventResult>` returns curated event records and/or computed local circumstances with source, catalog date and visibility/uncertainty.
- `getAuroraOutlook(place: PlaceRef, window: TimeWindow): Promise<AuroraOutlookResult>` returns official product issue/valid times separately from cloud/darkness context; never guarantees visibility.
- `getClearSkyClimatology(place: PlaceRef, season: SeasonQuery): Promise<ClimateContextResult>` returns a named statistic, historical years/vintage, grid scale and `dataClass: historical`.
- The first event catalog covers Moon phases, major planets/selected conjunctions, curated established meteor showers and solar/lunar eclipses; other classes return unsupported plus authoritative link.

- [ ] Add `meteor_shower_peak_uses_curated_year_and_timezone`, `event_below_horizon_is_not_visible`, `unsupported_event_returns_authoritative_link`, `aurora_outage_returns_unavailable`, and `era5_result_is_labeled_historical` tests.
- [ ] Implement catalog and official NOAA SWPC adapter with per-product source metadata.
- [ ] Implement a bounded ERA5 monthly/seasonal night-cloud summary using free data; if registration, compute or storage cannot fit the pilot budget, record that as a V1 launch blocker for the months-ahead journey instead of silently claiming the flow is complete.
- [ ] Run `npm test`; verify no event is claimed visible when below the local horizon and no ERA5 statistic is described as a forecast.

### Task 8: Build the end-to-end plan, learning guidance and outing preparation

**Files:**
- Create: `server/nightsky/planner.ts`
- Create: `server/content/specialistTools.ts`
- Create: `server/content/learning.ts`
- Modify: `server/mcp/index.ts`
- Modify: `client/src/App.tsx`
- Create: `client/src/pages/PlanShare.tsx`
- Create: `tests/nightsky/planner.test.ts`
- Create: `tests/content/specialistTools.test.ts`
- Create: `tests/content/learning.test.ts`

**Interfaces:**
- `planObservingSession(input: PlanObservingSessionInput): Promise<PlanResult>` orchestrates place, darkness, supported events, each weather source, visibility and checklist context.
- `compareObservingOptions(input: CompareOptionsInput): Promise<CompareOptionsResult>` returns side-by-side date/place options with source-specific weather records and plain-language trade-offs; it does not rank weather sources or hide underlying values.
- `recommendSpecialistTools(input: SpecialistToolQuery): Promise<SpecialistToolResult>` returns a small reviewed list with platform, pricing label, activity fit, source URL and review date.
- Learning/gear guidance is original concise content with citations and user-provided equipment; it does not claim equipment-specific settings unless inputs support them.
- Calendar files and optional share links are generated client-side; exact place coordinates appear in a share URL only after an explicit user choice.

- [ ] Add `plan_beginner_session_has_explained_targets`, `plan_meteor_shower_uses_radiant_and_moon`, `plan_astrophotography_uses_user_gear_only`, `plan_telescope_session_omits_unsupported_seeing`, `plan_weather_outage_returns_partial_result`, and `plan_beyond_forecast_uses_climate_label` tests.
- [ ] Add `planner_and_comparison_preserve_each_weather_source` and `planner_emits_no_composite_weather_score` tests.
- [ ] Implement orchestration with partial-result behavior and clear follow-up prompts for missing material inputs.
- [ ] Add an `.ics` export for computed event/session times and a client-side share page that omits exact coordinates unless the user explicitly includes them.
- [ ] Run `npm test`; confirm each end-to-end fixture includes source links, local time zone, data class and uncertainty.

### Task 9: Package the five skills and local ChatGPT plugin configuration

**Files:**
- Create: `plugins/nightsky/skills/find-observing-place/SKILL.md`
- Create: `plugins/nightsky/skills/plan-stargazing-night/SKILL.md`
- Create: `plugins/nightsky/skills/plan-astrophotography/SKILL.md`
- Create: `plugins/nightsky/skills/plan-sky-event/SKILL.md`
- Create: `plugins/nightsky/skills/prepare-outing/SKILL.md`
- Create: `plugins/nightsky/plugin.json`
- Create: `client/src/pages/Assistant.tsx`
- Modify: `client/src/App.tsx`
- Modify: `client/src/components/Navigation.tsx`
- Create: `docs/platforms/chatgpt.md`
- Create: `docs/platforms/claude.md`
- Create: `docs/platforms/gemini.md`

**Interfaces:**
- Each skill describes when it applies, the minimum needed questions, available tools, source/uncertainty behaviors and clear unsupported cases.
- The local ChatGPT package references the remote/local MCP server using the current manifest format; keep OpenAI-specific metadata isolated from the service.
- The website gets a concise assistant-product page explaining supported workflows, current platform setup links, source policy and privacy; no map UI is added.
- Claude docs explain custom remote MCP setup. Gemini is conditional: document the currently available user route and do not promise marketplace integration if unavailable.

- [ ] Check each skill against direct, indirect, missing-location and unsupported-event prompts; add `skill_tool_names_match_server_inventory` and `skill_asks_only_for_material_missing_context` checks.
- [ ] Verify tool names used in all skills match the MCP server inventory exactly.
- [ ] Create local plugin configuration and connect it to the running MCP endpoint.
- [ ] Add the website product/fallback page and link it from navigation without adding an interactive map.
- [ ] Run local prompts through at least one host; document per-host gaps instead of claiming parity without evidence.

### Task 10: Hosting, operations and public pilot readiness

**Files:**
- Modify: `netlify.toml` only if the chosen design keeps MCP on Netlify and its runtime is validated; otherwise leave the static site deployment alone.
- Create: `docs/operations/deployment.md`
- Create: `docs/operations/privacy-and-telemetry.md`
- Create: `tests/operations/provider-failure.test.ts`

**Interfaces:**
- Host the MCP endpoint at a stable HTTPS `/mcp` address using Streamable HTTP; select a Node-capable host only after verifying persistent/stateless transport needs, monitoring, costs and secrets.
- Expose a health endpoint that does not leak secrets or user location.
- Cache only within each source's terms. Do not log exact place coordinates or full tool arguments by default.
- Track minimal disclosed service metrics: tool success/error, latency and provider coverage/outages; do not equate tool calls with installs or unique users.

- [ ] Add `provider_timeout_returns_partial_result`, `stale_cache_is_disclosed`, `malformed_provider_payload_is_rejected`, `mcp_initialize_failure_is_logged_without_location`, and `health_endpoint_exposes_no_secrets` checks.
- [ ] Check source attribution, privacy notice, support contact, rate limiting, uptime/alerting and $25/month spending alerts.
- [ ] Test the production URL from ChatGPT and Claude target accounts; test Gemini only on the route actually available to the intended account.
- [ ] Complete platform-specific listing/review requirements and verify which install/usage analytics each platform exposes.
- [ ] Launch a small invited pilot and gather whether users completed/acted on a real plan, where they needed manual cross-checking, and whether they returned.

## Sequence and Release Gates

1. **Local vertical slice:** Tasks 1–4 and the smallest part of Task 8. A user can name a place/date and receive darkness, Moon, one MET forecast, a useful beginner plan and source labels through MCP Inspector.
2. **Place/event completeness:** Tasks 6–7 and remaining Task 8. Candidate places and defined event types work with honest partial coverage.
3. **Optional second forecast:** Task 5. Add NOAA only after GRIB decoding, output correctness and budget/latency are demonstrated; the product remains useful if omitted.
4. **Cross-platform and pilot:** Tasks 9–10. Local app/skill flow works, endpoint is public HTTPS, privacy and source operations are ready, and platform-specific access is actually verified.

## Plan Self-Review

- Scope coverage: MCP transport, astronomy/time, source-specific weather, public place discovery, events, climatology, aurora, learning, specialist app guidance, outing preparation, calendar output and cross-platform delivery each have an owning task.
- Separate forecast behavior is enforced in shared schemas, provider interfaces, planner and tests; NOAA can be omitted without breaking MET-only V1.
- Main launch gates are explicit: source rights/data inventory, GEFS decoder/output/budget decision, global place index refresh/cost, hosting target, platform availability and privacy review.
- The plan does not include map UI, accounts, community submissions, social media ingestion, photo hosting or automatic reminders.
- No production deployment or public launch occurs in the implementation tasks until the deployment details and platform connection are verified.
