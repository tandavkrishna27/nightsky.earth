# NightSky.earth V1 Core Service Implementation Plan

> **Historical work-package notes:** Use [the V1 execution plan](2026-10-10-nightsky-v1-execution-ready.md) as the sole implementation checklist. This file preserves earlier service design discussion; its steps may be stale.

**Goal:** Build and locally validate the shared read-only MCP service that supplies NightSky's place, astronomy, event, weather and historical-climate data.

**Architecture:** Extend the existing Express server with one Streamable HTTP MCP endpoint. Keep domain contracts and provider adapters independent; inject provider functions into tool handlers; return structured results with source provenance and explicit availability. Do not add user accounts or location storage.

**Tech stack:** Existing Node.js 20, TypeScript 5.6, Express 4, Zod, tsx and esbuild; add the official TypeScript MCP SDK and Astronomy Engine after license verification. Use Node's built-in test runner and mocked fetch for offline provider tests.

**Spec:** [Product scope](../../product-scope-v1-v3.md). Overall sequencing is in [the master plan](2026-10-10-nightsky-v1-implementation-reviewed.md).

## Global constraints

- User price and required API/data fees remain zero; the public pilot budget target is $25/month.
- Forecast sources remain separate, with source/model, issue/retrieval time, valid time, horizon, resolution/time step, missing fields and uncertainty where supplied.
- Distinguish forecast, observation, calculated astronomy and historical values.
- Public place data never proves legal access, safety, opening, accessibility or clear horizon.
- Use host-independent schemas. Register only tools whose handlers are implemented; do not publish placeholder tools.
- Apply source license, attribution, cache, rate and freshness rules.

## Review focus

- Invalid coordinates, ambiguous place names and missing time zones.
- DST transitions, UTC/local conversions and high-latitude days with no astronomical darkness.
- Partial, stale, malformed, throttled and timed-out provider data.
- Different forecast models and valid times returned separately.
- OSM import vintage, license handling and unknown site access.

## File responsibilities

| Path | Responsibility |
|---|---|
| shared/nightsky/ | Domain input/output Zod schemas and inferred types shared by the service and tests. |
| server/mcp/ | MCP server creation, tool metadata and Streamable HTTP route. |
| server/nightsky/ | Time-zone and deterministic astronomy calculations. |
| server/places/ | GeoNames name resolution and product-managed OSM candidate search. |
| server/events/ | Versioned event catalogs and source metadata. |
| server/providers/weather/ | Provider-neutral weather types and MET Norway/optional NOAA adapters. |
| server/providers/aurora/ | NOAA SWPC product adapter. |
| server/providers/climate/ | ERA5 historical aggregation and source labels. |
| data/ | Versioned source metadata and importer fixtures; no user-location history. |
| shared/meteorShowers.ts | Existing website shower catalogue; extend it as the single source used by the website and MCP service. |
| docs/operations/ | Source terms, data refresh, cache and provider failure runbooks. |
| tests/ and tests/all.test.ts | Unit, contract and MCP protocol checks; all test files are imported by the aggregator. |
| package.json and package-lock.json | Test scripts and pinned runtime dependencies. |

## Tasks

### Task 1: Create shared result contracts and a cross-platform test harness

**Files:** Create shared/nightsky/common.ts, places.ts, astronomy.ts, weather.ts, events.ts, planning.ts and index.ts; modify package.json and package-lock.json; create tests/shared/contracts.test.ts and tests/all.test.ts.

**Interfaces:** Export PlaceRef, TimeWindow, SourceRecord, Availability, WeatherForecast, AstronomyWindowResult, EventResult and PlanResult schemas/types.

- PlaceRef: id, displayName, latitude, longitude, IANA timeZone and source record.
- TimeWindow: startUtc, endUtc and timeZone.
- SourceRecord: provider, product, optional model, sourceUrl, attribution, dataClass (forecast, observation, historical, calculated or user_provided), retrievedAt, optional issuedAt/validStart/validEnd/horizonHours/resolution/timeStepMinutes.
- Availability: available, partial, stale, unavailable, not_covered or not_configured.
- WeatherForecast: source, points[{validAt, cloudTotalPercent, cloudLowPercent, cloudMidPercent, cloudHighPercent, precipitationMm, precipitationProbabilityPercent, temperatureC, dewPointC, windSpeedMps, humidityPercent}], missingFields and uncertaintyNotes. Source-dependent fields stay optional and units are explicit.
- AstronomyWindowResult: place, window, timeZone, civil/nautical/astronomical twilight intervals, darkness intervals, Moon phase/illumination/rise/set/altitude, source and availability.
- TargetVisibilityResult: target, place, window, rise/set, altitude/azimuth samples, visibility intervals, source and availability.
- EventResult: eventId, name, eventType, source, catalogVintage, optional activityStart/peak/end timestamps, local circumstances, visibility state and uncertainty notes.
- NightConditionsResult: forecasts[], optional airContext[], observations[], regionalAlerts[] and availability. Every forecast, observation and alert carries its own SourceRecord.
- PlanResult: status, activity, place, window, summary, candidateWindows, events, forecasts, factors, sources, caveats and followUpQuestions. It has no persistent ID or user-history field.

- [ ] Write contract tests for coordinate and time rejection, optional missing weather values, valid partial provider responses, explicit unavailable states, and two distinct forecasts in one result.
- [ ] Run the contract tests and confirm the new schemas fail as expected before implementation.
- [ ] Implement the Zod schemas and the test aggregator; add npm test to run all test files through tsx and Node's test runner on Windows and Linux.
- [ ] Run npm test and npm run check; both must pass from the repository root.

### Task 2: Add the MCP transport and tool registration boundary

**Files:** Create server/mcp/index.ts and server/mcp/route.ts; modify server/index.ts and server/routes.ts only where needed; create tests/mcp/initialize.test.ts and tests/mcp/tool-metadata.test.ts.

**Interfaces:** Export createNightSkyMcpServer(dependencies): McpServer and mountMcpRoute(app): void. Register domain tools through focused registration functions; use structuredContent matching each output schema plus concise model-readable text. Mark public lookups read-only and non-destructive; mark openWorldHint true when a handler calls a public provider.

- [ ] Write initialize, tool-discovery, schema-metadata, and invalid-argument/no-provider-call tests.
- [ ] Confirm the MCP route follows the selected SDK's Streamable HTTP lifecycle and malformed protocol requests return MCP errors without exposing stack traces.
- [ ] Implement the route on /mcp while preserving the existing site and /api/news routes.
- [ ] Run npm test, npm run check and an MCP Inspector initialize/list-tools/invalid-input session against localhost:5000/mcp.
- [ ] Add tool registrations only as their owning task completes; no always-unavailable placeholder handlers.

### Task 3: Resolve named places and map coordinates to local time zones

**Files:** Create server/places/geonames.ts, server/places/index.ts, server/nightsky/time.ts, data/place-index/README.md and tests/places/geonames.test.ts and tests/nightsky/time.test.ts; add source entries to docs/operations/data-sources.md.

**Interfaces:** resolvePlace(input: ResolvePlaceInput): Promise<ResolvePlaceResult> returns ranked textual matches, stable ID, coordinate precision, source and ambiguity. resolveTimeZone(lat: number, lon: number): string returns an IANA zone from a versioned boundary dataset.

- [ ] Write tests for unique/ambiguous/no-match place queries, country qualifiers, malformed dataset rows, invalid coordinates and coordinates on time-zone boundaries.
- [ ] Implement a product-managed GeoNames import from the published daily dataset and a repeatable refresh process; do not use its public search API for each keystroke.
- [ ] Import IANA rules and the selected timezone-boundary-builder release; record versions and ODbL attribution.
- [ ] Run the place/time tests and verify local time-zone resolution does not silently fall back to UTC.

### Task 4: Calculate local darkness, Moon and supported target visibility

**Files:** Create server/nightsky/astronomy.ts, server/nightsky/time.ts; modify shared/nightsky/astronomy.ts and related tests.

**Interfaces:** getAstronomyWindow(place: PlaceRef, window: TimeWindow): Promise<AstronomyWindowResult> returns civil/nautical/astronomical twilight, darkness intervals, Moon phase/illumination/rise/set/altitude and calculation source. getTargetVisibility(target: TargetRef, place: PlaceRef, window: TimeWindow): Promise<TargetVisibilityResult> returns supported rise/set, altitude/azimuth samples and visible intervals.

- [ ] Write fixed-reference tests for equatorial and mid-latitude twilight, Moon values, target rise/set, DST boundary and polar summer/winter.
- [ ] Verify Astronomy Engine's MIT license and tested date range; implement calculations locally and return UTC instants plus IANA-local display data.
- [ ] Return a truthful no-astronomical-darkness state for polar summer, not fabricated twilight times.
- [ ] Run the domain tests and compare selected cases with USNO reference output within a documented tolerance.

### Task 5: Add target catalogs and predictable sky-event search

**Files:** Create server/events/catalog.ts, data/events/solar-eclipses.json, data/events/lunar-eclipses.json, data/targets/README.md and tests/events/catalog.test.ts; modify shared/meteorShowers.ts and its current website consumers only as needed.

**Interfaces:** searchSkyEvents(query: SkyEventQuery): Promise<SkyEventResult> accepts eventType, startUtc, endUtc and optional PlaceRef; it returns supported events with source, catalog vintage, local circumstances and visibility state. Target lookup accepts a catalog ID or a resolved supported name; unknown names return a clarification/unsupported result.

- [ ] Write cases for Moon phases, selected planets/conjunctions, a curated meteor shower, solar/lunar eclipse contacts, selected JPL comet/asteroid ephemerides, below-horizon visibility and unsupported transient event links.
- [ ] Audit the existing 2025/2026 records in shared/meteorShowers.ts for source, peak interval, time-zone assumptions and rates. Extend it as the canonical shower catalogue and preserve existing exports used by website pages; do not maintain a second conflicting shower list.
- [ ] Add only a selected versioned bright/deep-sky catalog; preserve HYG/OpenNGC attribution and share-alike notices for redistributed data.
- [ ] Curate shower activity and peak data from sources whose reuse terms are reviewed; do not bulk republish a catalog with unclear reuse terms.
- [ ] For selected bright comets/asteroids, use cached server-side JPL Horizons/SBDB requests with an identifying User-Agent and reasonable cadence; keep a clear unsupported state when no current ephemeris is available.
- [ ] Implement routine planetary/Sun/Moon calculations and catalog event lookup; compute local circumstances at the selected location.
- [ ] Run event tests and confirm every event has a visible/partial/not-visible/unsupported status with source vintage.

### Task 6: Add the short-range aurora provider

**Files:** Create server/providers/aurora/noaaSwpc.ts and tests/providers/aurora/noaaSwpc.test.ts; update docs/operations/data-sources.md.

**Interfaces:** getAuroraOutlook(place: PlaceRef, window: TimeWindow): Promise<AuroraOutlookResult> returns official product values, issue/valid times, source links, latitude context and uncertainty. Darkness and clouds are combined by the planner, not misrepresented as SWPC outputs.

- [ ] Write fixture tests for current data, stale data, missing location/latitude coverage, timeout and provider outage.
- [ ] Implement the selected NOAA SWPC JSON/text product adapter with cache and attribution metadata.
- [ ] Return an unavailable/partial result when the product is stale or missing; never promise an aurora sighting.
- [ ] Run provider tests and one manual MCP call with a fixture or current response.

### Task 7: Add the MET Norway global point forecast

**Files:** Create server/providers/weather/types.ts and metNorway.ts; create tests/providers/weather/metNorway.test.ts; update docs/operations/data-sources.md.

**Interfaces:** WeatherProvider.getForecast(place: PlaceRef, window: TimeWindow): Promise<WeatherForecast>. MetNorwayProvider sends an identifying User-Agent, respects rounded-coordinate/cache/request guidance, preserves provider update time and maps only supplied fields. get_night_conditions initially returns one-element forecasts array with source availability.

- [ ] Write fixture tests for supported cloud/precipitation/wind/temperature fields, absent dew/low-cloud fields, stale provider update time, 429/rate limit, rejected 403, timeout, malformed body and generic 5xx.
- [ ] Implement provider parsing with units, attribution URL and valid time steps.
- [ ] Return each missing field as missing; never infer values from another source.
- [ ] Run tests and verify one named test location via MCP Inspector with source and validity metadata present.

### Task 8: Build and operate the global text candidate-location index

**Files:** Create server/places/osmCandidates.ts, server/places/importOsm.ts and tests/places/osmCandidates.test.ts and tests/places/importOsm.test.ts; modify docs/operations/data-sources.md.

**Interfaces:** searchObservingLocations(input: CandidateSearchInput): Promise<CandidateSearchResult> returns candidate name/type, coordinates, distance estimate, OSM object ID/source URL, import vintage and explicit access/opening evidence or unknown status. getLocationContext(place: PlaceRef): Promise<LocationContextResult> returns only supported public context.

- [ ] First measure a regional Geofabrik import: resulting storage size, index build time, query latency, required fields and deployment fit. Record the selected storage/index approach and estimate for global baseline coverage before implementing the full import.
- [ ] Write tests for supported/unsupported OSM tags, source IDs/links, stale vintage, absent opening/access information, distance units and result-limit behavior.
- [ ] Implement a repeatable importer for selected public candidate tags from country/region extracts; store only required fields and retain OSM/ODbL notices.
- [ ] Define a global baseline import/update schedule and report missing regions/coverage instead of presenting a small sample as global coverage.
- [ ] Run tests and verify production search has no dependency on public Nominatim autocomplete or public Overpass.

### Task 9: Add the months-ahead ERA5 climate summary

**Files:** Create server/providers/climate/era5.ts, scripts/era5/aggregate.ts and tests/providers/climate/era5.test.ts; update docs/operations/data-sources.md and docs/operations/deployment.md.

**Interfaces:** getClearSkyClimatology(place: PlaceRef, season: SeasonQuery): Promise<ClimateContextResult> returns a defined nighttime statistic, contributing years, source vintage, grid resolution and dataClass historical.

- [ ] Write tests for valid monthly statistics, sparse/missing grid coverage, output vintage and the invariant that historical results cannot be labeled forecasts.
- [ ] Prove the CDS registration/API download and scheduled aggregation path with a small sample before committing to full coverage; include secret handling and license.
- [ ] Define the first statistic as the distribution of ERA5 hourly total-cloud fraction during locally calculated astronomical darkness, using a documented 1991–2020 baseline; return median, 25th/75th percentiles, valid-year count, grid resolution and units. If a location has fewer than 20 usable years, return partial coverage and explain why.
- [ ] Document that this is historical grid-cell context, not a clear-sky probability or a specific-night forecast.
- [ ] Implement bounded aggregate storage/query for the global pilot and document update cadence, size, runtime and cost.
- [ ] Run tests and verify month-ahead plans say “historical pattern” and invite a forecast recheck.
- [ ] Treat the journey as a release blocker if ERA5 cannot be legally and reliably served inside budget; do not claim it as supported.

### Task 10: Decide supplemental free-data integrations without expanding the launch claim

**Files:** Update docs/operations/data-sources.md and docs/operations/source-spikes.md; add provider tests only for sources selected for V1.

- [ ] For NOAA GEFS, CAMS aerosols, NWS forecast/alerts, NASA GIBS, NASA FIRMS, NOAA CO-OPS tides, Black Marble and Copernicus DEM, record user journey, exact product, license/attribution, coverage, update time, operating work and fallback.
- [ ] Prototype NOAA subset decoding separately. Add a provider only if real decoded values, units, model/run/valid times, cache, request budget and operating cost pass.
- [ ] Select and implement CAMS or NWS only if one improves a launch-required flow and its regional/forecast scope is communicated accurately.
- [ ] Defer the map-oriented satellite, radiance and terrain layers; defer tides unless coastal planning is selected for V1. Do not include fire hotspots as a safety determination.
- [ ] Keep the source registry complete even for feeds deferred from production. Do not expose tools whose implementations are deferred.

## Core service acceptance

- MCP Inspector lists only working tools and returns structured results that match their output schemas.
- The required baseline tools are resolve_place, search_observing_locations, get_location_context, get_astronomy_window, get_target_visibility, search_sky_events, get_night_conditions, get_clear_sky_climatology and get_aurora_outlook. The end-to-end planner and app-content tools are registered by the workflows plan when complete.
- Local test suite covers every Review Focus item and remains offline/repeatable through fixtures.
- Run commands: npm test; npm run check; npm run build; then connect MCP Inspector to http://localhost:5000/mcp.
