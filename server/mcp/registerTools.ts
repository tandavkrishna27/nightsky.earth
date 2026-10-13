import { climateContextResultSchema, getClearSkyClimatologyInputSchema, describeClimateContext, type ClimateContextResultV2 } from "../../shared/nightsky/climate";
import { createEra5ClimateProvider } from "../providers/climate/era5";
import { consentedHostLocation } from "./metadata";
import type { McpServer } from "@modelcontextprotocol/server";
import { resolvePlaceInputSchema, resolvePlaceResultSchema } from "../../shared/nightsky/places";
import { getAstronomyWindowInputSchema, astronomyWindowResultSchema, getTargetVisibilityInputSchema, targetVisibilityResultSchema } from "../../shared/nightsky/astronomy";
import { searchSkyEventsInputSchema, skyEventsResultSchema } from "../../shared/nightsky/events";
import { loadGeoNamesPlaceIndex, resolvePlace, resolvedCoordinatesForPlace, type GeoNamesPlaceIndex } from "../places/geonames";
import { getAstronomyWindow, getTargetVisibility } from "../nightsky/astronomy";
import { searchSkyEvents } from "../events/catalog";
import { getMetNorwayForecast, MET_NORWAY_SOURCE, type MetRateLimiter } from "../providers/weather/metNorway";
import type { WeatherProvider } from "../providers/weather/types";
import { controlsFor, type UpstreamControls, type UpstreamProvider } from "../providers/upstreamControls";
import { auroraOutlookResultSchema, getAuroraOutlookInputSchema, getNightConditionsInputSchema, nightConditionsResultSchema, type AuroraOutlookResult } from "../../shared/nightsky/weather";
import { getNoaaAuroraOutlook } from "../providers/aurora/noaaSwpc";
import { loadOsmCandidateIndex, searchObservingLocations, type OSMCandidateIndex } from "../places/osmCandidates";
import { getLocationContext } from "../places/context";
import { getLocationContextInputSchema, getLocationContextResultSchema, searchObservingLocationsInputSchema, searchObservingLocationsResultSchema } from "../../shared/nightsky/places";
import { planObservingSessionInputSchema, planResultSchema } from "../../shared/nightsky/planning";
import { planObservingSession, type PlannerServices } from "../nightsky/planner";
import { compareObservingOptionsInputSchema, compareObservingOptionsResultSchema, recommendSpecialistToolsInputSchema, specialistToolsResultSchema } from "../../shared/nightsky/planning";
import { compareObservingOptions } from "../nightsky/compare";
import { getSpecialistToolRecommendations } from "../content/specialistTools";

export interface CacheEntry<T> { value: T; expiresAt: number }
export interface NightSkyCache {
  get<T>(key: string): Promise<CacheEntry<T> | undefined>;
  set<T>(key: string, value: T, ttlMs: number): Promise<void>;
}

/** Runtime dependencies are shared by every stateless MCP request. */
export interface NightSkyDependencies {
  /** Operator-selected rehearsal scope; never controlled by request metadata. */
  toolMode?: "full" | "resolver-only";
  climateProvider?: { getClimatology(placeId: string, month: number): Promise<ClimateContextResultV2> };
  cache?: NightSkyCache;
  fetcher?: typeof fetch;
  rateLimit?: { windowMs: number; maxRequests: number };
  upstreamControls?: UpstreamControls;
  providerTimeoutsMs?: Partial<Readonly<Record<UpstreamProvider, number>>>;
  placeIndex?: GeoNamesPlaceIndex;
  /** Route-owned lazy index reader shared across stateless requests. */
  placeIndexLoader?: () => Promise<GeoNamesPlaceIndex | undefined>;
  osmCandidateIndex?: OSMCandidateIndex;
  /** Route-owned immutable candidate artifact shared by direct/composed tools. */
  osmCandidateIndexLoader?: () => Promise<OSMCandidateIndex | undefined>;
  weatherProvider?: WeatherProvider;
  weatherUserAgent?: string;
  weatherRateLimiter?: MetRateLimiter;
  auroraProvider?: (place: { placeId: string; latitude: number; longitude: number }, window: { startUtc: string; endUtc: string; timeZone: string }) => Promise<AuroraOutlookResult>;
  /** Fixture or host-specific service overrides used by the composed planner. */
  plannerServices?: Partial<Omit<PlannerServices, "index">>;
}

export const V1_TOOL_ANNOTATIONS = {
  resolve_place: { readOnlyHint: true, destructiveHint: false, openWorldHint: false },
  get_astronomy_window: { readOnlyHint: true, destructiveHint: false, openWorldHint: false },
  get_target_visibility: { readOnlyHint: true, destructiveHint: false, openWorldHint: false },
  search_sky_events: { readOnlyHint: true, destructiveHint: false, openWorldHint: false },
  get_night_conditions: { readOnlyHint: true, destructiveHint: false, openWorldHint: true },
  get_aurora_outlook: { readOnlyHint: true, destructiveHint: false, openWorldHint: true },
  search_observing_locations: { readOnlyHint: true, destructiveHint: false, openWorldHint: false },
  get_location_context: { readOnlyHint: true, destructiveHint: false, openWorldHint: false },
  get_clear_sky_climatology: { readOnlyHint: true, destructiveHint: false, openWorldHint: false },
  plan_observing_session: { readOnlyHint: true, destructiveHint: false, openWorldHint: true },
  compare_observing_options: { readOnlyHint: true, destructiveHint: false, openWorldHint: true },
  recommend_specialist_tools: { readOnlyHint: true, destructiveHint: false, openWorldHint: false },
} as const;

/** No domain tools are registered until their real handler and schema are ready. */
export function registerNightSkyTools(server: McpServer, dependencies: NightSkyDependencies): void {
  const toolMode = dependencies.toolMode ?? "full";
  if (toolMode !== "full" && toolMode !== "resolver-only") throw new TypeError("Invalid MCP tool mode.");
  for (const timeout of Object.values(dependencies.providerTimeoutsMs ?? {})) {
    if (!Number.isSafeInteger(timeout) || timeout! <= 0) throw new TypeError("Provider timeouts must be positive safe integers.");
  }
  dependencies = { ...dependencies, upstreamControls: dependencies.upstreamControls ?? controlsFor(dependencies.fetcher) };
  let placeIndexPromise: Promise<GeoNamesPlaceIndex | undefined> | undefined;
  let osmCandidateIndexPromise: Promise<OSMCandidateIndex | undefined> | undefined;
  let climateProvider: NightSkyDependencies["climateProvider"];
  const climateFor = (index: GeoNamesPlaceIndex): NonNullable<PlannerServices["getClimatology"]> => {
    if (dependencies.plannerServices?.getClimatology) return dependencies.plannerServices.getClimatology;
    const provider = dependencies.climateProvider ?? (climateProvider ??= createEra5ClimateProvider({ index, artifactPath: process.env.NIGHTSKY_CLIMATE_ARTIFACT, expectedSha256: process.env.NIGHTSKY_CLIMATE_SHA256 }));
    return (placeId, month) => provider.getClimatology(placeId, month);
  };
  const plannerServicesFor = (index: GeoNamesPlaceIndex): PlannerServices => ({
    index,
    getAstronomy: dependencies.plannerServices?.getAstronomy ?? ((place, window) => getAstronomyWindow(place, window, index)),
    getNightConditions: dependencies.plannerServices?.getNightConditions ?? ((placeId, window) => getNightConditionsForPlan(placeId, window, index, dependencies)),
    searchEvents: dependencies.plannerServices?.searchEvents ?? ((placeId, window) => searchSkyEvents({ placeId, window }, index)),
    getTargetVisibility: dependencies.plannerServices?.getTargetVisibility ?? ((place, target, window) => getTargetVisibility(target, place, window, index)),
    getLocationContext: dependencies.plannerServices?.getLocationContext ?? (async (placeId) => {
      const city = index.getById(Number(placeId.slice("place:v1:geonames:".length)));
      if (!city) throw new RangeError("The selected named place is unavailable in the current GeoNames index. Resolve it again.");
      return getLocationContext(index.toPlaceRef(city));
    }),
    getAuroraOutlook: dependencies.plannerServices?.getAuroraOutlook ?? (async (placeId, window) => {
      const coordinates = resolvedCoordinatesForPlace(index, placeId);
      if (!coordinates) throw new RangeError("The selected named place is unavailable in the current GeoNames index. Resolve it again.");
      const place = { placeId, ...coordinates };
      return (dependencies.auroraProvider ?? ((resolvedPlace, requestedWindow) => getNoaaAuroraOutlook(resolvedPlace, requestedWindow, { fetcher: dependencies.fetcher, cache: dependencies.cache, controls: dependencies.upstreamControls, timeoutMs: dependencies.providerTimeoutsMs?.noaa })))(place, window);
    }),
    searchCandidates: dependencies.plannerServices?.searchCandidates ?? (async (placeId: string) => {
      const city = index.getById(Number(placeId.slice("place:v1:geonames:".length)));
      if (!city) throw new RangeError("The selected named place is unavailable in the current GeoNames index. Resolve it again.");
      const candidateIndex = dependencies.osmCandidateIndex ?? await (osmCandidateIndexPromise ??= (dependencies.osmCandidateIndexLoader ?? loadOsmCandidateIndex)());
      return searchObservingLocations(searchObservingLocationsInputSchema.parse({ placeId }), { index: candidateIndex, place: { placeId, latitude: city.latitude, longitude: city.longitude } });
    }),
    getClimatology: climateFor(index),
  });
  server.registerTool("resolve_place", {
    title: "Find a named observing place",
    description: "Resolve a named city or observing area to one or more GeoNames places with an IANA time zone. If several places match, ask the user to choose. Use approximate host location only when the user explicitly asks for near-me results. Do not pass coordinates or street addresses.",
    inputSchema: resolvePlaceInputSchema,
    outputSchema: resolvePlaceResultSchema,
    annotations: V1_TOOL_ANNOTATIONS.resolve_place,
  }, async (input, context) => {
    const index = dependencies.placeIndex ?? await (placeIndexPromise ??= (dependencies.placeIndexLoader ?? loadGeoNamesPlaceIndex)());
    const hostLocationHint = consentedHostLocation(context.mcpReq._meta, input.useApproximateHostLocation === true);
    const result = await resolvePlace(input, { index, hostLocationHint });
    const structuredContent = resolvePlaceResultSchema.parse(result);
    const names = structuredContent.matches.map(({ displayName }) => displayName);
    const text = names.length
      ? `GeoNames (CC BY 4.0; ${index?.vintageLabel ?? "index unavailable"}). ${structuredContent.availability.reason} ${names.join("; ")}`
      : `GeoNames (CC BY 4.0). ${structuredContent.availability.reason}`;
    return { content: [{ type: "text", text }], structuredContent };
  });

  if (toolMode === "resolver-only") return;

  server.registerTool("get_astronomy_window", {
    title: "Calculate darkness and Moon conditions",
    description: "Calculate astronomical twilight and darkness, polar state, and a Moon phase/altitude summary for a previously resolved named place and UTC window. Terrain and horizon obstructions are not modeled.",
    inputSchema: getAstronomyWindowInputSchema,
    outputSchema: astronomyWindowResultSchema,
    annotations: V1_TOOL_ANNOTATIONS.get_astronomy_window,
  }, async (input) => {
    const index = dependencies.placeIndex ?? await (placeIndexPromise ??= (dependencies.placeIndexLoader ?? loadGeoNamesPlaceIndex)());
    if (!index) throw new Error("The local GeoNames place index is unavailable.");
    const result = await getAstronomyWindow({ placeId: input.placeId, timeZone: input.window.timeZone }, input.window, index);
    return { content: [{ type: "text", text: `Astronomy Engine ${result.sources[0]?.vintage}. ${result.availability.reason}` }], structuredContent: result };
  });

  server.registerTool("get_target_visibility", {
    title: "Check when a sky target is above the horizon",
    description: "Calculate geometric above-horizon intervals for the Sun, Moon, planets, or the Milky Way core at a previously resolved named place. Terrain, obstructions, atmosphere, and equipment limits are not modeled.",
    inputSchema: getTargetVisibilityInputSchema,
    outputSchema: targetVisibilityResultSchema,
    annotations: V1_TOOL_ANNOTATIONS.get_target_visibility,
  }, async (input) => {
    const index = dependencies.placeIndex ?? await (placeIndexPromise ??= (dependencies.placeIndexLoader ?? loadGeoNamesPlaceIndex)());
    if (!index) throw new Error("The local GeoNames place index is unavailable.");
    const result = await getTargetVisibility(input.targetQuery, { placeId: input.placeId, timeZone: input.window.timeZone }, input.window, index);
    return { content: [{ type: "text", text: `Astronomy Engine ${result.sources[0]?.vintage}. ${result.availability.reason}` }], structuredContent: result };
  });

  server.registerTool("get_night_conditions", {
    title: "Check forecast conditions during astronomical darkness",
    description: "Fetch the MET Norway point forecast for a resolved named place. The result keeps source fields and units separate, identifies missing variables, and adds the forecast steps overlapping calculated astronomical darkness plus Moon illumination. Forecasts are not observations and may differ from local conditions.",
    inputSchema: getNightConditionsInputSchema,
    outputSchema: nightConditionsResultSchema,
    annotations: V1_TOOL_ANNOTATIONS.get_night_conditions,
  }, async (input) => {
    const index = dependencies.placeIndex ?? await (placeIndexPromise ??= (dependencies.placeIndexLoader ?? loadGeoNamesPlaceIndex)());
    if (!index) throw new Error("The local GeoNames place index is unavailable.");
    const coordinates = resolvedCoordinatesForPlace(index, input.placeId);
    if (!coordinates) throw new RangeError("The selected place is unavailable in the current GeoNames index. Resolve it again.");
    const astronomy = await getAstronomyWindow({ placeId: input.placeId, timeZone: input.window.timeZone }, input.window, index);
    const userAgent = dependencies.weatherUserAgent ?? process.env.MET_NORWAY_USER_AGENT;
    const providerResult = userAgent || dependencies.weatherProvider
      ? await (dependencies.weatherProvider ?? { getForecast: (place, window) => getMetNorwayForecast(place, window, { userAgent: userAgent!, fetcher: dependencies.fetcher, cache: dependencies.cache, rateLimiter: dependencies.weatherRateLimiter, controls: dependencies.upstreamControls, timeoutMs: dependencies.providerTimeoutsMs?.met }) }).getForecast({ placeId: input.placeId, ...coordinates }, input.window)
      : { status: "unavailable" as const, reason: "MET Norway is not configured because its required application/contact User-Agent has not been set." };
    const forecasts = providerResult.forecast ? [providerResult.forecast] : [];
    if (!input.includeHourly) {
      for (const forecast of forecasts) {
        const chosen: typeof forecast.samples = [];
        let lastBucket = -1;
        for (const sample of forecast.samples) {
          const bucket = Math.floor(Date.parse(sample.validAt) / (3 * 60 * 60 * 1000));
          if (bucket !== lastBucket) chosen.push(sample);
          lastBucket = bucket;
        }
        forecast.samples = chosen;
      }
    }
    const darkness = astronomy.astronomicalDarkness;
    const darknessRange = darkness.status === "available" ? [Date.parse(darkness.startUtc), Date.parse(darkness.endUtc)] as const : undefined;
    const forecastStepsDuringDarkness = forecasts.map((forecast) => ({
      source: forecast.source.name,
      validTimesUtc: forecast.samples.filter(({ validAt }) => darknessRange && Date.parse(validAt) >= darknessRange[0] && Date.parse(validAt) <= darknessRange[1]).map(({ validAt }) => validAt),
    }));
    const result = nightConditionsResultSchema.parse({
      availability: { status: providerResult.status, reason: providerResult.reason },
      placeId: input.placeId,
      window: input.window,
      forecasts,
      nightContext: {
        darkness,
        moonIlluminationPercent: astronomy.moon.illuminationPercent,
        forecastStepsDuringDarkness,
      },
      sources: forecasts.length ? forecasts.map(({ source }) => source) : [MET_NORWAY_SOURCE],
      caveats: ["MET Norway forecasts are model output, not local observations. Cloud, wind, and other variables may be absent by region or forecast horizon.", ...(providerResult.deprecationWarning ? [providerResult.deprecationWarning] : [])],
    });
    return { content: [{ type: "text", text: `MET Norway: ${result.availability.reason}` }], structuredContent: result };
  });

  server.registerTool("get_aurora_outlook", {
    title: "Check the short-range aurora outlook",
    description: "Retrieve NOAA SWPC's short-horizon OVATION location/intensity forecast for a previously resolved place. The nearest coarse grid cell and forecast times are labeled. This is not a personal sighting probability; check darkness, clouds, horizon and local conditions separately.",
    inputSchema: getAuroraOutlookInputSchema,
    outputSchema: auroraOutlookResultSchema,
    annotations: V1_TOOL_ANNOTATIONS.get_aurora_outlook,
  }, async (input) => {
    const index = dependencies.placeIndex ?? await (placeIndexPromise ??= (dependencies.placeIndexLoader ?? loadGeoNamesPlaceIndex)());
    if (!index) throw new Error("The local GeoNames place index is unavailable.");
    const coordinates = resolvedCoordinatesForPlace(index, input.placeId);
    if (!coordinates) throw new RangeError("The selected place is unavailable in the current GeoNames index. Resolve it again.");
    const place = { placeId: input.placeId, ...coordinates };
    const result = await (dependencies.auroraProvider ?? ((resolvedPlace, window) => getNoaaAuroraOutlook(resolvedPlace, window, { fetcher: dependencies.fetcher, cache: dependencies.cache, controls: dependencies.upstreamControls, timeoutMs: dependencies.providerTimeoutsMs?.noaa })))(place, input.window);
    const checkedResult = auroraOutlookResultSchema.parse(result);
    return { content: [{ type: "text", text: `NOAA SWPC OVATION: ${checkedResult.availability.reason}` }], structuredContent: checkedResult };
  });

  server.registerTool("search_sky_events", {
    title: "Find sky events for this place and date range",
    description: "Find local Moon phases, solar/lunar eclipses, equinoxes and solstices, and sourced recurring meteor shower windows. Eclipse and Moon visibility is based on geometric horizon only. Meteor radiant visibility is not calculated. Unsupported event classes are listed in the structured result.",
    inputSchema: searchSkyEventsInputSchema,
    outputSchema: skyEventsResultSchema,
    annotations: V1_TOOL_ANNOTATIONS.search_sky_events,
  }, async (input) => {
    const index = dependencies.placeIndex ?? await (placeIndexPromise ??= (dependencies.placeIndexLoader ?? loadGeoNamesPlaceIndex)());
    if (!index) throw new Error("The local GeoNames place index is unavailable.");
    const result = await searchSkyEvents(input, index);
    return { content: [{ type: "text", text: `Sky events: ${result.events.length}. ${result.availability.reason}` }], structuredContent: result };
  });

  server.registerTool("search_observing_locations", {
    title: "Find nearby observing place candidates",
    description: "Search the locally installed, coverage-labeled OpenStreetMap candidate index near a previously resolved named place. Results include source links and dataset vintage. Candidate tags do not verify darkness, public access, night opening, safety, permits or current closures.",
    inputSchema: searchObservingLocationsInputSchema,
    outputSchema: searchObservingLocationsResultSchema,
    annotations: V1_TOOL_ANNOTATIONS.search_observing_locations,
  }, async (input) => {
    const index = dependencies.placeIndex ?? await (placeIndexPromise ??= (dependencies.placeIndexLoader ?? loadGeoNamesPlaceIndex)());
    const cityId = Number(input.placeId.slice("place:v1:geonames:".length));
    const city = input.placeId.startsWith("place:v1:geonames:") ? index?.getById(cityId) : undefined;
    if (!city || !index) throw new RangeError("The selected named place is unavailable. Resolve it again.");
    const result = await searchObservingLocations(input, {
      index: dependencies.osmCandidateIndex ?? await (osmCandidateIndexPromise ??= (dependencies.osmCandidateIndexLoader ?? loadOsmCandidateIndex)()),
      place: { placeId: input.placeId, latitude: city.latitude, longitude: city.longitude },
    });
    return { content: [{ type: "text", text: `OpenStreetMap candidates: ${result.availability.reason} Coverage: ${result.coverage}` }], structuredContent: result };
  });

  server.registerTool("get_location_context", {
    title: "Check what is known about a named observing area",
    description: "Return source-linked place context and explicit unknown states for unverified darkness, public access, night opening and safety.",
    inputSchema: getLocationContextInputSchema,
    outputSchema: getLocationContextResultSchema,
    annotations: V1_TOOL_ANNOTATIONS.get_location_context,
  }, async (input) => {
    const index = dependencies.placeIndex ?? await (placeIndexPromise ??= (dependencies.placeIndexLoader ?? loadGeoNamesPlaceIndex)());
    if (!index) throw new Error("The local GeoNames place index is unavailable.");
    const placeId = input.placeId;
    const city = placeId.startsWith("place:v1:geonames:") ? index.getById(Number(placeId.slice("place:v1:geonames:".length))) : undefined;
    if (!city) throw new RangeError("The selected named place is unavailable. Resolve it again.");
    const result = await getLocationContext(index.toPlaceRef(city));
    return { content: [{ type: "text", text: result.availability.reason }], structuredContent: result };
  });

  server.registerTool("get_clear_sky_climatology", {
    title: "Historical cloud patterns",
    description: "Read locally installed ERA5 monthly historical cloud statistics for a resolved named place. Values describe modeled total cloud cover in hourly dark-time samples, with inclusive 10%, 25% and 50% thresholds. They are not a forecast or whole-night success probability. One-year artifacts remain sample-only and partial; unsupported coverage is explicit.",
    inputSchema: getClearSkyClimatologyInputSchema,
    outputSchema: climateContextResultSchema,
    annotations: V1_TOOL_ANNOTATIONS.get_clear_sky_climatology,
  }, async (input) => {
    const index = dependencies.placeIndex ?? await (placeIndexPromise ??= (dependencies.placeIndexLoader ?? loadGeoNamesPlaceIndex)());
    if (!index) throw new Error("The local GeoNames place index is unavailable.");
    const result = climateContextResultSchema.parse(await climateFor(index)(input.placeId, input.month));
    return { content: [{ type: "text", text: describeClimateContext(result) }], structuredContent: result };
  });

  server.registerTool("plan_observing_session", {
    title: "Plan a night-sky observing session",
    description: "Combine named-place time zone, astronomical darkness, Moon conditions, sky events, weather forecasts, and activity-specific guidance. Resolve the place first. The result keeps source evidence and unknowns separate; forecast conditions are not guarantees, and access, seeing, transparency, and site safety are not inferred.",
    inputSchema: planObservingSessionInputSchema,
    outputSchema: planResultSchema,
    annotations: V1_TOOL_ANNOTATIONS.plan_observing_session,
  }, async (input) => {
    const index = dependencies.placeIndex ?? await (placeIndexPromise ??= (dependencies.placeIndexLoader ?? loadGeoNamesPlaceIndex)());
    if (!index) throw new Error("The local GeoNames place index is unavailable.");
    const services = plannerServicesFor(index);
    const result = await planObservingSession(input, services);
    return { content: [{ type: "text", text: result.summary }], structuredContent: result };
  });

  server.registerTool("compare_observing_options", {
    title: "Compare observing nights or places",
    description: "Compare two to five user-selected place/date/activity options. Keeps each forecast source separate, retains options with missing data, and shows activity-specific factors without inventing a winner or universal sky score.",
    inputSchema: compareObservingOptionsInputSchema,
    outputSchema: compareObservingOptionsResultSchema,
    annotations: V1_TOOL_ANNOTATIONS.compare_observing_options,
  }, async (input) => {
    const index = dependencies.placeIndex ?? await (placeIndexPromise ??= (dependencies.placeIndexLoader ?? loadGeoNamesPlaceIndex)());
    if (!index) throw new Error("The local GeoNames place index is unavailable.");
    const result = await compareObservingOptions(input, plannerServicesFor(index));
    return { content: [{ type: "text", text: `${result.comparisons.length} options compared. ${result.availability.reason}` }], structuredContent: result };
  });

  server.registerTool("recommend_specialist_tools", {
    title: "Suggest specialist sky tools",
    description: "Suggest a small set of optional astronomy or photography tools for the selected activity. Each recommendation links to its reviewed product listing; price or platform support is marked unknown when it could not be verified.",
    inputSchema: recommendSpecialistToolsInputSchema,
    outputSchema: specialistToolsResultSchema,
    annotations: V1_TOOL_ANNOTATIONS.recommend_specialist_tools,
  }, async ({ activity, experience }) => {
    const result = getSpecialistToolRecommendations(activity, experience);
    return { content: [{ type: "text", text: result.availability.reason }], structuredContent: result };
  });
}

async function getNightConditionsForPlan(placeId: string, window: { startUtc: string; endUtc: string; timeZone: string }, index: GeoNamesPlaceIndex, dependencies: NightSkyDependencies) {
  const coordinates = resolvedCoordinatesForPlace(index, placeId);
  if (!coordinates) throw new RangeError("The selected named place is unavailable in the current GeoNames index. Resolve it again.");
  const astronomy = await getAstronomyWindow({ placeId, timeZone: window.timeZone }, window, index);
  const userAgent = dependencies.weatherUserAgent ?? process.env.MET_NORWAY_USER_AGENT;
  const providerResult = userAgent || dependencies.weatherProvider
    ? await (dependencies.weatherProvider ?? { getForecast: (place, requestedWindow) => getMetNorwayForecast(place, requestedWindow, { userAgent: userAgent!, fetcher: dependencies.fetcher, cache: dependencies.cache, rateLimiter: dependencies.weatherRateLimiter, controls: dependencies.upstreamControls, timeoutMs: dependencies.providerTimeoutsMs?.met }) }).getForecast({ placeId, ...coordinates }, window)
    : { status: "unavailable" as const, reason: "MET Norway is not configured because its required application/contact User-Agent has not been set." };
  const forecasts = providerResult.forecast ? [providerResult.forecast] : [];
  const darkness = astronomy.astronomicalDarkness;
  const darknessRange = darkness.status === "available" ? [Date.parse(darkness.startUtc), Date.parse(darkness.endUtc)] as const : undefined;
  const forecastStepsDuringDarkness = forecasts.map((forecast) => ({
    source: forecast.source.name,
    validTimesUtc: forecast.samples.filter(({ validAt }) => darknessRange && Date.parse(validAt) >= darknessRange[0] && Date.parse(validAt) <= darknessRange[1]).map(({ validAt }) => validAt),
  }));
  return nightConditionsResultSchema.parse({
    availability: { status: providerResult.status, reason: providerResult.reason }, placeId, window, forecasts,
    nightContext: { darkness, moonIlluminationPercent: astronomy.moon.illuminationPercent, forecastStepsDuringDarkness },
    sources: forecasts.length ? forecasts.map(({ source }) => source) : [MET_NORWAY_SOURCE],
    caveats: ["MET Norway forecasts are model output, not local observations. Cloud, wind, and other variables may be absent by region or forecast horizon.", ...(providerResult.deprecationWarning ? [providerResult.deprecationWarning] : [])],
  });
}
