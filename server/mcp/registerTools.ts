import { registerLightPollutionTools } from './lightPollutionTools';
import type { LightPollutionProvider } from '../../shared/nightsky/lightPollution';
import { registerOptionalSkyTools } from './optionalSkyTools';
import type { OptionalSkyProviders } from '../providers/skyConfiguration';
import { apiAttributionText } from "../places/api/attribution";
import type { DiscoveryProvider, SelectedPlaceResolver } from "../places/api/types";
import { planAnswerText, sourceLinkedText } from "./answerText";
import * as z from "zod4";
import { CatalogueRevisionError } from "../places/globalCatalogue";
import { normalizeDiscoveryInput, searchDiscoveryInputSchema, searchDiscoveryResultSchema, candidateRefSchema, discoveryCoverageSchema, discoveryScopeSchema, originBasisSchema, resolveObservingRegionInputSchema, resolveObservingRegionResultSchema, getObservingLocationDetailsInputSchema, getObservingLocationDetailsResultSchema, type CatalogueReader, type RegionIndex, type CalculationPlace } from "../../shared/nightsky/discovery";
import { resolveCalculationPlace, resolveNamedCalculationPlace, CalculationPlaceClarificationError } from "../places/calculationPlace";
import { climateContextResultSchema, getClearSkyClimatologyInputSchema, describeClimateContext, type ClimateContextResultV2 } from "../../shared/nightsky/climate";
import { selectConfiguredClimateProvider } from "../providers/climate/configuration";
import { consentedHostLocation } from "./metadata";
import type { McpServer } from "@modelcontextprotocol/server";
import { resolvePlaceInputSchema, resolvePlaceResultSchema } from "../../shared/nightsky/places";
import { getAstronomyWindowInputSchema, astronomyWindowResultSchema, getTargetVisibilityInputSchema, targetVisibilityResultSchema } from "../../shared/nightsky/astronomy";
import { searchSkyEventsInputSchema, skyEventsResultSchema } from "../../shared/nightsky/events";
import { loadGeoNamesPlaceIndex, resolvePlace, resolvedCoordinatesForPlace, type GeoNamesPlaceIndex } from "../places/geonames";
import { getAstronomyWindow, getTargetVisibility } from "../nightsky/astronomy";
import { astronomicalDarknessIntervals } from "../nightsky/windows";
import { searchSkyEvents } from "../events/catalog";
import { getMetNorwayForecast, MET_NORWAY_SOURCE, type MetRateLimiter } from "../providers/weather/metNorway";
import { sourceRecordSchema } from "../../shared/nightsky/common";
import type { WeatherProviderResult } from "../providers/weather/types";
import type { WeatherProvider, WeatherCollectionService, WeatherCollection } from "../providers/weather/types";
import { configurationSource, validateWeatherCollection, validateWeatherResult } from "../providers/weather/collection";
import { controlsFor, type UpstreamControls, type UpstreamProvider } from "../providers/upstreamControls";
import { auroraOutlookResultSchema, getAuroraOutlookInputSchema, getNightConditionsInputSchema, nightConditionsResultSchema, type AuroraOutlookResult } from "../../shared/nightsky/weather";
import { getNoaaAuroraOutlook } from "../providers/aurora/noaaSwpc";
import { loadOsmCandidateIndex, searchObservingLocations, type OSMCandidateIndex, type SearchPlace } from "../places/osmCandidates";
import { getLocationContext } from "../places/context";
import { getLocationContextInputSchema, getLocationContextResultSchema, searchObservingLocationsInputSchema, searchObservingLocationsResultSchema, type SearchObservingLocationsInput } from "../../shared/nightsky/places";
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
  skyProviders?: OptionalSkyProviders;
  lightPollutionProviders?: LightPollutionProvider[];
  /** Operator-selected rehearsal scope; never controlled by request metadata. */
  discoveryProvider?: DiscoveryProvider;
  selectedPlaceResolver?: SelectedPlaceResolver;
  toolMode?: "full" | "resolver-only";
  climateProvider?: { getClimatology(placeId: string, month: number, point?: CalculationPlace): Promise<ClimateContextResultV2> };
  cache?: NightSkyCache;
  fetcher?: typeof fetch;
  rateLimit?: { windowMs: number; maxRequests: number };
  upstreamControls?: UpstreamControls;
  providerTimeoutsMs?: Partial<Readonly<Record<UpstreamProvider, number>>>;
  placeIndex?: GeoNamesPlaceIndex;
  catalogue?: CatalogueReader;
  regionIndex?: RegionIndex;
  /** Route-owned lazy index reader shared across stateless requests. */
  placeIndexLoader?: () => Promise<GeoNamesPlaceIndex | undefined>;
  osmCandidateIndex?: OSMCandidateIndex;
  /** Route-owned immutable candidate artifact shared by direct/composed tools. */
  osmCandidateIndexLoader?: () => Promise<OSMCandidateIndex | undefined>;
  /** Operator-installed regional provider shared by direct and composed requests. */
  candidateProvider?: { search(input: SearchObservingLocationsInput, options: { place: SearchPlace }): ReturnType<typeof searchObservingLocations> };
  weatherProvider?: WeatherProvider;
  weatherCollection?: WeatherCollectionService;
  weatherUserAgent?: string;
  weatherRateLimiter?: MetRateLimiter;
  auroraProvider?: (place: { placeId: string; latitude: number; longitude: number }, window: { startUtc: string; endUtc: string; timeZone: string }) => Promise<AuroraOutlookResult>;
  /** Fixture or host-specific service overrides used by the composed planner. */
  plannerServices?: Partial<Omit<PlannerServices, "index">>;
}

export const V1_TOOL_ANNOTATIONS = {
  resolve_observing_region: { readOnlyHint: true, destructiveHint: false, openWorldHint: false },
  get_observing_location_details: { readOnlyHint: true, destructiveHint: false, openWorldHint: false },
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
  if (dependencies.weatherCollection && dependencies.weatherProvider) throw new TypeError("Configure weatherCollection or weatherProvider, not both.");
  const toolMode = dependencies.toolMode ?? "full";
  if (toolMode !== "full" && toolMode !== "resolver-only") throw new TypeError("Invalid MCP tool mode.");
  for (const timeout of Object.values(dependencies.providerTimeoutsMs ?? {})) {
    if (!Number.isSafeInteger(timeout) || timeout! <= 0) throw new TypeError("Provider timeouts must be positive safe integers.");
  }
  dependencies = { ...dependencies, upstreamControls: dependencies.upstreamControls ?? controlsFor(dependencies.fetcher) };
  let placeIndexPromise: Promise<GeoNamesPlaceIndex | undefined> | undefined;
  let osmCandidateIndexPromise: Promise<OSMCandidateIndex | undefined> | undefined;
  const candidatesFor = async (input: SearchObservingLocationsInput, place: SearchPlace) => {
    if (dependencies.candidateProvider) return searchObservingLocationsResultSchema.parse(await dependencies.candidateProvider.search(input, { place }));
    const candidateIndex = dependencies.osmCandidateIndex ?? await (osmCandidateIndexPromise ??= (dependencies.osmCandidateIndexLoader ?? loadOsmCandidateIndex)());
    return searchObservingLocations(input, { index: candidateIndex, place });
  };
  const resolvePoint = (input: {placeId: string; sourceRevision?:string; catalogueRevision?: string; displayTimeZone?: string}, index: GeoNamesPlaceIndex | undefined) => dependencies.selectedPlaceResolver && input.placeId.startsWith("place:v1:api:") ? dependencies.selectedPlaceResolver.resolve({placeId:input.placeId,sourceRevision:input.sourceRevision,catalogueRevision:input.catalogueRevision,displayTimeZone:input.displayTimeZone}) : dependencies.catalogue
    ? resolveCalculationPlace({placeId:input.placeId,catalogueRevision:input.catalogueRevision,sourceRevision:input.sourceRevision,displayTimeZone:input.displayTimeZone}, {cities: index!, catalogue: dependencies.catalogue})
    : Promise.resolve(resolveNamedCalculationPlace({placeId:input.placeId,displayTimeZone:input.displayTimeZone}, index!));
  const contextForPoint = async (point: CalculationPlace, index: GeoNamesPlaceIndex | undefined) => {
    if (!point.catalogueRevision && !point.sourceRevision) return getLocationContext(index!.toPlaceRef(index!.getById(Number(point.placeId.split(":").at(-1)))!));
    const candidate = await dependencies.catalogue?.details({placeId: point.placeId, catalogueRevision: point.catalogueRevision!});
    return getLocationContextResultSchema.parse({availability: {status: "partial", reason: "Site source geometry is available; darkness, night opening and safety remain unverified."}, placeId: point.placeId,
      sourceRevision:point.sourceRevision,sources: candidate?.sources ?? point.sources, caveats: candidate?.caveats ?? ["Site access is unverified."],
      access: candidate?.accessEvidence ?? {status: "unknown"}, groundLightContext: {status: "unknown", reason: "No validated ground-light measurement is installed for this candidate."}});
  };
  let climateProvider: NightSkyDependencies["climateProvider"];
  const climateFor = (index: GeoNamesPlaceIndex | undefined): NonNullable<PlannerServices["getClimatology"]> => {
    if (dependencies.plannerServices?.getClimatology) return dependencies.plannerServices.getClimatology;
    if (dependencies.discoveryProvider) return (placeId,month,point) => { if(!point) throw new CalculationPlaceClarificationError("resolve-again","Resolve the selected API snapshot again."); return dependencies.climateProvider ? dependencies.climateProvider.getClimatology(placeId,month,point) : Promise.resolve(candidateClimateGap(point,month)); };
    const provider = dependencies.climateProvider ?? (climateProvider ??= selectConfiguredClimateProvider(index!, {NIGHTSKY_CLIMATE_ARTIFACT:process.env.NIGHTSKY_CLIMATE_ARTIFACT,NIGHTSKY_CLIMATE_SHA256:process.env.NIGHTSKY_CLIMATE_SHA256,NIGHTSKY_ERA5_RELEASE_MANIFEST:process.env.NIGHTSKY_ERA5_RELEASE_MANIFEST,NIGHTSKY_ERA5_RELEASE_SHA256:process.env.NIGHTSKY_ERA5_RELEASE_SHA256}));
    return (placeId, month, point) => (point?.catalogueRevision || point?.sourceRevision) ? Promise.resolve(candidateClimateGap(point,month)) : provider.getClimatology(placeId, month);
  };
  const plannerServicesFor = (index: GeoNamesPlaceIndex | undefined): PlannerServices => ({
    index,
    resolveCalculationPlace: input => resolvePoint(input, index),
    getAstronomy: dependencies.plannerServices?.getAstronomy ?? ((place, window, point) => getAstronomyWindow(place, window, index, point)),
    getNightConditions: dependencies.plannerServices?.getNightConditions ?? ((placeId, window, point) => getNightConditionsForPlan(placeId, window, index, dependencies, point)),
    searchEvents: dependencies.plannerServices?.searchEvents ?? ((placeId, window, point) => searchSkyEvents({ placeId, window, ...candidatePointMetadata(point) }, index, point)),
    getTargetVisibility: dependencies.plannerServices?.getTargetVisibility ?? ((place, target, window, point) => getTargetVisibility(target, place, window, index, point)),
    getLocationContext: dependencies.plannerServices?.getLocationContext ?? (async (placeId, point) => {
      if (point) return contextForPoint(point, index);
      const city = index!.getById(Number(placeId.slice("place:v1:geonames:".length)));
      if (!city) throw new RangeError("The selected named place is unavailable in the current GeoNames index. Resolve it again.");
      return getLocationContext(index!.toPlaceRef(city));
    }),
    getAuroraOutlook: dependencies.plannerServices?.getAuroraOutlook ?? (async (placeId, window, point) => {
      const coordinates = point ?? resolvedCoordinatesForPlace(index!, placeId);
      if (!coordinates) throw new RangeError("The selected named place is unavailable in the current GeoNames index. Resolve it again.");
      const place = { placeId, ...coordinates };
      const result = await (dependencies.auroraProvider ?? ((resolvedPlace, requestedWindow) => getNoaaAuroraOutlook(resolvedPlace, requestedWindow, { fetcher: dependencies.fetcher, cache: dependencies.cache, controls: dependencies.upstreamControls, timeoutMs: dependencies.providerTimeoutsMs?.noaa })))(place, window);
      return auroraOutlookResultSchema.parse({ ...result, ...candidatePointMetadata(point), caveats: [...result.caveats, ...candidateZoneCaveats(point)] });
    }),
    searchCandidates: dependencies.plannerServices?.searchCandidates ?? (async (placeId: string, point?: CalculationPlace) => {
      if (dependencies.discoveryProvider && point) return dependencies.discoveryProvider.search(searchDiscoveryInputSchema.parse({placeId,sourceRevision:point.sourceRevision,limit:5}));
      if (dependencies.catalogue && point) return dependencies.catalogue.search(normalizeDiscoveryInput({scope:{origins:[{placeId, catalogueRevision:point.catalogueRevision}]}}),{limit:5});
      const city = index!.getById(Number(placeId.slice("place:v1:geonames:".length)));
      if (!city) throw new RangeError("The selected named place is unavailable in the current GeoNames index. Resolve it again.");
      return candidatesFor(searchObservingLocationsInputSchema.parse({ placeId }), { placeId, latitude: city.latitude, longitude: city.longitude });
    }),
    getClimatology: climateFor(index),
  });
  server.registerTool("resolve_place", {
    title: "Find a named observing place",
    description: dependencies.discoveryProvider ? "Resolve a named place using the configured bounded GeoNames/Geoapify APIs. Keep sourceRevision and freshness for the selected match. Ask the user to choose among ambiguous matches and to choose an explicit display time zone when actual-site timezone evidence is unknown. Coordinates and street addresses are not accepted." : "Resolve a named city or observing area to one or more GeoNames places with an IANA time zone. If several places match, ask the user to choose. Use approximate host location only when the user explicitly asks for near-me results. Do not pass coordinates or street addresses.",
    inputSchema: resolvePlaceInputSchema,
    outputSchema: resolvePlaceResultSchema,
    annotations: {...V1_TOOL_ANNOTATIONS.resolve_place,openWorldHint:Boolean(dependencies.discoveryProvider)},
  }, async (input, context) => {
    const index = dependencies.discoveryProvider ? undefined : dependencies.placeIndex ?? await (placeIndexPromise ??= (dependencies.placeIndexLoader ?? loadGeoNamesPlaceIndex)());
    if (dependencies.discoveryProvider) { const result = await dependencies.discoveryProvider.resolvePlace(input); return {content:[{type:"text",text:apiAttributionText(result.availability.reason,result.sources)}],structuredContent:result}; }
    const hostLocationHint = consentedHostLocation(context.mcpReq._meta, input.useApproximateHostLocation === true);
    const result = await resolvePlace(input, { index, hostLocationHint });
    const structuredContent = resolvePlaceResultSchema.parse(result);
    const names = structuredContent.matches.map(({ displayName }) => displayName);
    const text = !names.length && input.useApproximateHostLocation ? "Approximate host location is unavailable. Ask the user for a named town or city." : names.length
      ? `GeoNames (CC BY 4.0; ${index?.vintageLabel ?? "index unavailable"}). ${structuredContent.availability.reason} ${names.join("; ")}`
      : `GeoNames (CC BY 4.0). ${structuredContent.availability.reason}`;
    return { content: [{ type: "text", text: sourceLinkedText(text, structuredContent.sources) }], structuredContent };
  });

  if (toolMode === "resolver-only") return;
  if (dependencies.lightPollutionProviders) registerLightPollutionTools(server, dependencies.lightPollutionProviders, async input => {
    const index = dependencies.discoveryProvider ? undefined : dependencies.placeIndex ?? await (placeIndexPromise ??= (dependencies.placeIndexLoader ?? loadGeoNamesPlaceIndex)());
    if (!index && !dependencies.selectedPlaceResolver) throw new Error('Resolve a place before requesting light pollution.');
    return resolvePoint(input, index);
  });
  if (dependencies.skyProviders) registerOptionalSkyTools(server, dependencies.skyProviders, async input => {
    const index = dependencies.discoveryProvider ? undefined : dependencies.placeIndex ?? await (placeIndexPromise ??= (dependencies.placeIndexLoader ?? loadGeoNamesPlaceIndex)());
    if (!index && !dependencies.selectedPlaceResolver) throw new Error('Resolve a place before requesting observer data.');
    return resolvePoint(input, index);
  });

  server.registerTool("get_astronomy_window", {
    title: "Calculate darkness and Moon conditions",
    description: "Calculate astronomical darkness coverage of the requested window, nested Sun-below-threshold intervals clipped to that window, and a Moon phase/altitude summary for a resolved named place or revision-pinned candidate with explicit display time zone. This does not classify whole-day polar conditions. Terrain and horizon obstructions are not modeled.",
    inputSchema: getAstronomyWindowInputSchema,
    outputSchema: astronomyWindowResultSchema,
    annotations: V1_TOOL_ANNOTATIONS.get_astronomy_window,
  }, async (input) => {
    const index = dependencies.discoveryProvider ? undefined : dependencies.placeIndex ?? await (placeIndexPromise ??= (dependencies.placeIndexLoader ?? loadGeoNamesPlaceIndex)());
    if (!index && !dependencies.selectedPlaceResolver) throw new Error("The local GeoNames place index is unavailable.");
    const point = await resolvePoint({ ...input, displayTimeZone: input.displayTimeZone ?? (input.placeId.startsWith("place:v1:geonames:") ? input.window.timeZone : undefined) }, index);
    const result = await getAstronomyWindow({ placeId: input.placeId, timeZone: input.window.timeZone }, input.window, index, point);
    return { content: [{ type: "text", text: sourceLinkedText(`Astronomy Engine ${result.sources[0]?.vintage}. ${result.availability.reason}`, result.sources) }], structuredContent: result };
  });

  server.registerTool("get_target_visibility", {
    title: "Check when a sky target is above the horizon",
    description: "Calculate geometric above-horizon intervals for the Sun, Moon, planets, or the Milky Way core at a resolved named place or revision-pinned candidate with explicit display time zone. Terrain, obstructions, atmosphere, and equipment limits are not modeled.",
    inputSchema: getTargetVisibilityInputSchema,
    outputSchema: targetVisibilityResultSchema,
    annotations: V1_TOOL_ANNOTATIONS.get_target_visibility,
  }, async (input) => {
    const index = dependencies.discoveryProvider ? undefined : dependencies.placeIndex ?? await (placeIndexPromise ??= (dependencies.placeIndexLoader ?? loadGeoNamesPlaceIndex)());
    if (!index && !dependencies.selectedPlaceResolver) throw new Error("The local GeoNames place index is unavailable.");
    const point = await resolvePoint({ ...input, displayTimeZone: input.displayTimeZone ?? (input.placeId.startsWith("place:v1:geonames:") ? input.window.timeZone : undefined) }, index);
    const result = await getTargetVisibility(input.targetQuery, { placeId: input.placeId, timeZone: input.window.timeZone }, input.window, index, point);
    return { content: [{ type: "text", text: sourceLinkedText(`Astronomy Engine ${result.sources[0]?.vintage}. ${result.availability.reason}`, result.sources) }], structuredContent: result };
  });

  server.registerTool("get_night_conditions", {
    title: "Check forecast conditions during astronomical darkness",
    description: "Fetch the MET Norway point forecast at the actual selected named-place or revision-pinned candidate point. Candidate planning requires an explicit display time zone. The result keeps source fields and units separate, identifies missing variables, and adds the forecast steps overlapping calculated astronomical darkness plus Moon illumination. Forecasts are not observations and may differ from local conditions.",
    inputSchema: getNightConditionsInputSchema,
    outputSchema: nightConditionsResultSchema,
    annotations: V1_TOOL_ANNOTATIONS.get_night_conditions,
  }, async (input) => {
    const index = dependencies.discoveryProvider ? undefined : dependencies.placeIndex ?? await (placeIndexPromise ??= (dependencies.placeIndexLoader ?? loadGeoNamesPlaceIndex)());
    if (!index && !dependencies.selectedPlaceResolver) throw new Error("The local GeoNames place index is unavailable.");
    const coordinates = await resolvePoint({ ...input, displayTimeZone: input.displayTimeZone ?? (input.placeId.startsWith("place:v1:geonames:") ? input.window.timeZone : undefined) }, index);
    if (!coordinates) throw new RangeError("The selected place is unavailable in the current GeoNames index. Resolve it again.");
    const result = await getNightConditionsForPlan(input.placeId, input.window, index, dependencies, coordinates, input.includeHourly);
    return { content: [{ type: "text", text: `${result.sources[0].name}: ${result.availability.reason}` }], structuredContent: result };
  });

  server.registerTool("get_aurora_outlook", {
    title: "Check the short-range aurora outlook",
    description: "Retrieve NOAA SWPC's short-horizon OVATION location/intensity forecast for a previously resolved place. The nearest coarse grid cell and forecast times are labeled. This is not a personal sighting probability; check darkness, clouds, horizon and local conditions separately.",
    inputSchema: getAuroraOutlookInputSchema,
    outputSchema: auroraOutlookResultSchema,
    annotations: V1_TOOL_ANNOTATIONS.get_aurora_outlook,
  }, async (input) => {
    const index = dependencies.discoveryProvider ? undefined : dependencies.placeIndex ?? await (placeIndexPromise ??= (dependencies.placeIndexLoader ?? loadGeoNamesPlaceIndex)());
    if (!index && !dependencies.selectedPlaceResolver) throw new Error("The local GeoNames place index is unavailable.");
    const coordinates = await resolvePoint({ ...input, displayTimeZone: input.displayTimeZone ?? (input.placeId.startsWith("place:v1:geonames:") ? input.window.timeZone : undefined) }, index);
    if (!coordinates) throw new RangeError("The selected place is unavailable in the current GeoNames index. Resolve it again.");
    if (coordinates.displayTimeZone !== input.window.timeZone) throw new CalculationPlaceClarificationError("time-zone-mismatch", "The requested window time zone must match the selected display time zone.");
    const place = { placeId: input.placeId, latitude:coordinates.latitude, longitude:coordinates.longitude };
    const result = await (dependencies.auroraProvider ?? ((resolvedPlace, window) => getNoaaAuroraOutlook(resolvedPlace, window, { fetcher: dependencies.fetcher, cache: dependencies.cache, controls: dependencies.upstreamControls, timeoutMs: dependencies.providerTimeoutsMs?.noaa })))(place, input.window);
    const checkedResult = auroraOutlookResultSchema.parse({...result,...candidatePointMetadata(coordinates),caveats:[...result.caveats,...candidateZoneCaveats(coordinates)]});
    return { content: [{ type: "text", text: sourceLinkedText(`Aurora outlook: ${checkedResult.availability.reason}`, checkedResult.sources) }], structuredContent: checkedResult };
  });

  server.registerTool("search_sky_events", {
    title: "Find sky events for this place and date range",
    description: "Find calculated Moon phases, solar/lunar eclipses, equinoxes, solstices, outer-planet oppositions, explicitly defined inferior/superior solar alignments, Mercury/Venus greatest geocentric three-dimensional Sun-angle elongations, and numerically screened geocentric right-ascension planet-pair conjunctions for all 21 Mercury–Neptune pairs within 2025–2027, plus sourced year-specific meteor forecast maxima. Pair coverage is partial: exhaustive completeness and stationary/tangent contacts are not certified; preserve unresolved intervals. RA crossings, solar alignments, elongations and closest approaches are distinct. Planet local visibility, darkness and detectability are not established; never suggest unfiltered solar viewing. Lunar intervals carry model-conditional horizon bounds; solar contacts use the stated refraction model. Separate source-backed verbal calendar guidance describes typical annual periods, not exact dates, requested-window activity or radiant visibility. Meteor season and radiant coverage are limited. Unsupported classes and coverage gaps are explicit.",
    inputSchema: searchSkyEventsInputSchema,
    outputSchema: skyEventsResultSchema,
    annotations: V1_TOOL_ANNOTATIONS.search_sky_events,
  }, async (input) => {
    const index = dependencies.discoveryProvider ? undefined : dependencies.placeIndex ?? await (placeIndexPromise ??= (dependencies.placeIndexLoader ?? loadGeoNamesPlaceIndex)());
    if (!index && !dependencies.selectedPlaceResolver) throw new Error("The local GeoNames place index is unavailable.");
    const point = await resolvePoint({ ...input, displayTimeZone: input.displayTimeZone ?? (input.placeId.startsWith("place:v1:geonames:") ? input.window.timeZone : undefined) }, index);
    const result = await searchSkyEvents(input, index, point);
    return { content: [{ type: "text", text: `Sky events: ${result.events.length}. ${result.availability.reason}` }], structuredContent: result };
  });

  server.registerTool("search_observing_locations", {
    title: "Find nearby observing place candidates",
    description: dependencies.discoveryProvider ? "Search bounded Geoapify POI records using selected API origins and sourceRevision, or selected country/state provider boundaries with regionSelections. Return source snapshots and distance bands; unsupported exclusions and administrative intersections remain explicit. The source does not verify night access, safety or darkness." : "Search locally installed, coverage-labeled OpenStreetMap candidate artifacts near a previously resolved named place. Flat or regional artifacts retain source links and individual dataset vintages. Candidate tags do not verify darkness, public access, night opening, safety, permits or current closures.",
    inputSchema: searchDiscoveryInputSchema,
    outputSchema: integratedSearchResultSchema,
    annotations: {...V1_TOOL_ANNOTATIONS.search_observing_locations,openWorldHint:Boolean(dependencies.discoveryProvider)},
  }, async (input) => {
    if (dependencies.discoveryProvider) {const result=await dependencies.discoveryProvider.search(input);return {content:[{type:"text",text:apiAttributionText(result.availability.reason,result.sources)}],structuredContent:result};}
    const scope = normalizeDiscoveryInput(input);
    if (dependencies.catalogue) {
      const result = searchDiscoveryResultSchema.parse(await dependencies.catalogue.search(scope, {categories:input.categories, limit:input.limit}));
      return {content:[{type:"text", text:result.availability.reason}], structuredContent:result};
    }
    if (input.scope) {
      const result = searchDiscoveryResultSchema.parse({availability:{status:"unavailable",reason:"A checksum-pinned global catalogue is not installed; this scope cannot be searched."}, candidates:[],sortBasis:"source-completeness-then-name-id",coverage:"Global discovery coverage is unavailable.", queryScope:scope,originBasis:[],
        discoveryCoverage:{footprintStatus:"not-covered",searchCompleteness:"unavailable",mappedFeatureCompleteness:"unknown",catalogueRevision:"uninstalled"},sources:[CONFIGURATION_SOURCE], caveats:[GLOBAL_CONFIGURATION_CAVEAT]});
      return {content:[{type:"text",text:result.availability.reason}],structuredContent:result};
    }
    const index = dependencies.discoveryProvider ? undefined : dependencies.placeIndex ?? await (placeIndexPromise ??= (dependencies.placeIndexLoader ?? loadGeoNamesPlaceIndex)());
    const city = input.placeId!.startsWith("place:v1:geonames:") ? index?.getById(Number(input.placeId!.split(":").at(-1))) : undefined;
    if (!city || !index) throw new RangeError("The selected named place is unavailable. Resolve it again.");
    const result = await candidatesFor(searchObservingLocationsInputSchema.parse(input), {placeId:input.placeId!,latitude:city.latitude,longitude:city.longitude});
    const structuredContent = {...result,caveats:[...result.caveats, "Legacy city-radius artifact coverage is partial and does not establish global mapped-feature completeness."]};
    return {content:[{type:"text",text: `OpenStreetMap candidates: ${result.availability.reason} Coverage: ${result.coverage}`}],structuredContent};
  });

  server.registerTool("resolve_observing_region", {
    title:"Resolve a country or state", description:dependencies.discoveryProvider ? "Resolve named countries or states into their own Geoapify boundary-filter identities. Keep each regionId and sourceRevision in scope.regionSelections; select ambiguous matches. Region centers are not observing points. Unsupported memberships and exclusions remain explicit." : "Resolve named administrative regions in the installed pinned boundary catalogue. Missing coverage is explicit; boundaries do not verify site access or safety.",
    inputSchema:resolveObservingRegionInputSchema,outputSchema:resolveObservingRegionResultSchema,annotations:{...V1_TOOL_ANNOTATIONS.resolve_observing_region,openWorldHint:Boolean(dependencies.discoveryProvider)},
  }, async input => {
    if (dependencies.discoveryProvider) {const result=await dependencies.discoveryProvider.resolveRegion(input);return {content:[{type:"text",text:apiAttributionText(result.availability.reason,result.sources)}],structuredContent:result};}
    const matches = dependencies.regionIndex ? await dependencies.regionIndex.resolve(input) : [];
    const result = resolveObservingRegionResultSchema.parse({matches,selectionRequired:matches.length>1,availability:{status:dependencies.regionIndex ? matches.length ? "available":"not-covered":"unavailable",reason:dependencies.regionIndex ? "Only installed boundary coverage is searched." : GLOBAL_CONFIGURATION_CAVEAT},sources:matches.length?matches.flatMap(x=>x.sources):[CONFIGURATION_SOURCE],caveats:["Administrative boundaries do not verify night access or site safety."]});
    return {content:[{type:"text",text:result.availability.reason}],structuredContent:result};
  });
  server.registerTool("get_observing_location_details", {
    title:"Inspect a selected observing candidate",description:dependencies.discoveryProvider ? "Inspect a selected immutable API source snapshot by placeId and sourceRevision. Expired or missing snapshots require new resolution/search. Source coordinates are retained exactly; unknown site timezones require an explicit display zone before calculations." : "Retrieve source geometry and access evidence for a candidate ID and exact catalogue revision, or resolve a named site within installed coverage. Missing or stale coverage is explicit; choose a display time zone before planning an unverified site zone.",
    inputSchema:getObservingLocationDetailsInputSchema,outputSchema:getObservingLocationDetailsResultSchema,annotations:V1_TOOL_ANNOTATIONS.get_observing_location_details,
  }, async input => {
    if (dependencies.discoveryProvider) {if(!input.placeId||!input.sourceRevision) throw new CalculationPlaceClarificationError("resolve-again","Resolve a named API place first, then inspect its selected source revision.");const result=await dependencies.discoveryProvider.details({placeId:input.placeId,sourceRevision:input.sourceRevision});return {content:[{type:"text",text:apiAttributionText(result.availability.reason,result.sources)}],structuredContent:result};}
    const candidate = input.placeId && dependencies.catalogue ? await dependencies.catalogue.details({placeId:input.placeId,catalogueRevision:input.catalogueRevision!}).catch(error => {if(error instanceof CatalogueRevisionError) return undefined;throw error;}) : undefined;
    const matches = candidate ? [candidate] : input.placeQuery && dependencies.catalogue ? await dependencies.catalogue.findNames({placeQuery:input.placeQuery,countryCode:input.countryCode}) : [];
    const result = getObservingLocationDetailsResultSchema.parse({matches,selectionRequired:matches.length>1,availability:{status:dependencies.catalogue ? matches.length ? "available":"not-covered":"unavailable",reason:dependencies.catalogue ? matches.length ? "Candidate source geometry found; actual site time zone and night access remain unverified." : "Candidate name, ID or revision is outside installed coverage. Search again." : GLOBAL_CONFIGURATION_CAVEAT},sources:matches.length?matches.flatMap(x=>x.sources):[CONFIGURATION_SOURCE],caveats:["Source tags do not verify public access, night opening, permits, safety or darkness."]});
    return {content:[{type:"text",text:sourceLinkedText(`${result.availability.reason} ${matches.length ? "Ask the user to choose an explicit display time zone before planning if they have not already supplied one; do not infer it from a nearby city or window.timeZone. A request to use the site timezone is not a display-zone choice when that timezone is unverified." : ""}`, result.sources)}],structuredContent:result};
  });
  server.registerTool("get_location_context", {
    title: "Check what is known about a named observing area",
    description: "Return source-linked place context and explicit unknown states for unverified darkness, public access, night opening and safety.",
    inputSchema: getLocationContextInputSchema,
    outputSchema: getLocationContextResultSchema,
    annotations: V1_TOOL_ANNOTATIONS.get_location_context,
  }, async (input) => {
    const index = dependencies.discoveryProvider ? undefined : dependencies.placeIndex ?? await (placeIndexPromise ??= (dependencies.placeIndexLoader ?? loadGeoNamesPlaceIndex)());
    if (!index && !dependencies.selectedPlaceResolver) throw new Error("The local GeoNames place index is unavailable.");
    const placeId = input.placeId;
    if (!placeId.startsWith("place:v1:geonames:")) {
      const point=await resolvePoint(input,index);
      const result=await contextForPoint(point,index);
      return {content:[{type:"text",text:result.availability.reason}],structuredContent:result};
    }
    const city = placeId.startsWith("place:v1:geonames:") ? index!.getById(Number(placeId.slice("place:v1:geonames:".length))) : undefined;
    if (!city) throw new RangeError("The selected named place is unavailable. Resolve it again.");
    const result = await getLocationContext(index!.toPlaceRef(city));
    return { content: [{ type: "text", text: result.availability.reason }], structuredContent: result };
  });

  server.registerTool("get_clear_sky_climatology", {
    title: "Historical cloud patterns",
    description: "Read locally installed ERA5 monthly historical cloud statistics for a resolved named place. Values describe modeled total cloud cover in hourly dark-time samples, with inclusive 10%, 25% and 50% thresholds. They are not a forecast or whole-night success probability. One-year artifacts remain sample-only and partial; unsupported coverage is explicit.",
    inputSchema: getClearSkyClimatologyInputSchema,
    outputSchema: climateContextResultSchema,
    annotations: V1_TOOL_ANNOTATIONS.get_clear_sky_climatology,
  }, async (input) => {
    const index = dependencies.discoveryProvider ? undefined : dependencies.placeIndex ?? await (placeIndexPromise ??= (dependencies.placeIndexLoader ?? loadGeoNamesPlaceIndex)());
    if (!index && !dependencies.selectedPlaceResolver) throw new Error("The local GeoNames place index is unavailable.");
    const point=await resolvePoint(input,index);
    const result = climateContextResultSchema.parse(await climateFor(index)(input.placeId, input.month, point));
    return { content: [{ type: "text", text: describeClimateContext(result) }], structuredContent: result };
  });

  server.registerTool("plan_observing_session", {
    title: "Plan a night-sky observing session",
    description: "Combine the selected city or revision-pinned candidate point and display time zone, astronomical darkness, Moon conditions, sky events, weather forecasts, and activity-specific guidance. Resolve the place first. For an unverified candidate site zone, use a user-chosen display time zone; if the user has not chosen one, ask and wait before calling. The result keeps source evidence and unknowns separate; forecast conditions are not guarantees, and access, seeing, transparency, and site safety are not inferred.",
    inputSchema: planObservingSessionInputSchema,
    outputSchema: planResultSchema,
    annotations: V1_TOOL_ANNOTATIONS.plan_observing_session,
  }, async (input) => {
    const index = dependencies.discoveryProvider ? undefined : dependencies.placeIndex ?? await (placeIndexPromise ??= (dependencies.placeIndexLoader ?? loadGeoNamesPlaceIndex)());
    if (!index && !dependencies.selectedPlaceResolver) throw new Error("The local GeoNames place index is unavailable.");
    const services = plannerServicesFor(index);
    const result = await planObservingSession(input, services);
    return { content: [{ type: "text", text: dependencies.discoveryProvider ? apiAttributionText(planAnswerText(result),result.sources) : planAnswerText(result) }], structuredContent: result };
  });

  server.registerTool("compare_observing_options", {
    title: "Compare observing nights or places",
    description: "Compare two to five user-selected place/date/activity options. Keeps each forecast source separate, retains options with missing data, and shows activity-specific factors without inventing a winner or universal sky score.",
    inputSchema: compareObservingOptionsInputSchema,
    outputSchema: compareObservingOptionsResultSchema,
    annotations: V1_TOOL_ANNOTATIONS.compare_observing_options,
  }, async (input) => {
    const index = dependencies.discoveryProvider ? undefined : dependencies.placeIndex ?? await (placeIndexPromise ??= (dependencies.placeIndexLoader ?? loadGeoNamesPlaceIndex)());
    if (!index && !dependencies.selectedPlaceResolver) throw new Error("The local GeoNames place index is unavailable.");
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

async function getNightConditionsForPlan(placeId: string, window: { startUtc: string; endUtc: string; timeZone: string }, index: GeoNamesPlaceIndex | undefined, dependencies: NightSkyDependencies, point?: CalculationPlace, includeHourly = true) {
  const coordinates = point ?? resolvedCoordinatesForPlace(index!, placeId);
  if (!coordinates) throw new RangeError("The selected named place is unavailable in the current GeoNames index. Resolve it again.");
  const astronomy = await getAstronomyWindow({ placeId, timeZone: window.timeZone }, window, index, point);
  const userAgent = dependencies.weatherUserAgent ?? process.env.MET_NORWAY_USER_AGENT;
  let collection: WeatherCollection;
  if (dependencies.weatherCollection) {
    // The runtime collection is bounded itself; enforce the same ceiling for host-injected services.
    let timer: ReturnType<typeof setTimeout> | undefined;
    const fallback = () => ({ outcomes: [{ providerId: "met" as const, result: { status: "unavailable" as const, reason: "The weather collection could not complete this request.", source: UNSPECIFIED_WEATHER_SOURCE } }] });
    try {
      collection = await Promise.race([
        Promise.resolve().then(() => dependencies.weatherCollection!.getForecasts({ placeId, latitude: coordinates.latitude, longitude: coordinates.longitude }, window)).then(validateWeatherCollection),
        new Promise<WeatherCollection>(resolve => { timer = setTimeout(() => resolve(fallback()), 12_000); }),
      ]);
    } catch { collection = fallback(); }
    finally { if (timer) clearTimeout(timer); }
  } else {
    let result: WeatherProviderResult;
    try {
      result = userAgent || dependencies.weatherProvider
        ? await (dependencies.weatherProvider ?? { getForecast: (place, requestedWindow) => getMetNorwayForecast(place, requestedWindow, { userAgent: userAgent!, fetcher: dependencies.fetcher, cache: dependencies.cache, rateLimiter: dependencies.weatherRateLimiter, controls: dependencies.upstreamControls, timeoutMs: dependencies.providerTimeoutsMs?.met }) }).getForecast({ placeId, latitude: coordinates.latitude, longitude: coordinates.longitude }, window)
        : { status: "unavailable", reason: "MET Norway is not configured because its required application/contact User-Agent has not been set." };
    } catch { result = { status: "unavailable", reason: "The weather source could not complete this request." }; }
    // Legacy injection rejects supplied malformed identity, while forecast.source remains authoritative.
    // Keep this validation outside the network failure catch and before collection-style isolation.
    const source = weatherSources(result, dependencies.weatherProvider !== undefined)[0];
    collection = { outcomes: [{ providerId: "met", result: validateWeatherResult("met", { ...result, source }) }] };
  }
  const forecasts = collection.outcomes.flatMap(({ result }) => result.forecast ? [result.forecast] : []);
  if (!includeHourly) for (const forecast of forecasts) {
    const buckets = new Set<number>();
    forecast.samples = forecast.samples.filter(sample => { const bucket = Math.floor(Date.parse(sample.validAt) / 10_800_000); if (buckets.has(bucket)) return false; buckets.add(bucket); return true; });
  }
  const providerOutcomes = collection.outcomes.map(({ providerId, result }) => ({ providerId, status: result.status, reason: result.reason, source: result.forecast?.source ?? result.source ?? configurationSource(providerId) }));
  const usable = collection.outcomes.flatMap(({ result }) => ["available", "partial", "stale"].includes(result.status) && result.forecast ? [result.forecast] : []).filter(forecast => ["available", "partial", "stale"].includes(forecast.availability.status) && forecast.samples.some(sample => Date.parse(sample.validAt) >= Date.parse(window.startUtc) && Date.parse(sample.validAt) <= Date.parse(window.endUtc)));
  const coversWindow = usable.every(forecast => {
    const instants = forecast.samples.map(sample => Date.parse(sample.validAt));
    const start = forecast.source.validStartUtc ? Date.parse(forecast.source.validStartUtc) : Math.min(...instants);
    const end = forecast.source.validEndUtc ? Date.parse(forecast.source.validEndUtc) : Math.max(...instants);
    return start <= Date.parse(window.startUtc) && end >= Date.parse(window.endUtc);
  });
  const status = !dependencies.weatherCollection ? collection.outcomes[0]!.result.status : !usable.length ? "unavailable" : collection.outcomes.length > 0 && collection.outcomes.every(({ result }) => result.status === "available" && result.forecast?.availability.status === "available") && usable.length === collection.outcomes.length && coversWindow ? "available" : "partial";
  const reason = !dependencies.weatherCollection ? collection.outcomes[0]!.result.reason : status === "available" ? "All requested weather sources supplied the requested window." : status === "partial" ? "Some requested weather evidence is missing or incomplete; inspect each source outcome." : "No requested source supplied usable forecast samples in this window.";
  const darknessIntervals = astronomicalDarknessIntervals(astronomy);
  return nightConditionsResultSchema.parse({
    availability: { status, reason }, placeId, ...candidatePointMetadata(point), window, forecasts, providerOutcomes,
    nightContext: { darkness: astronomy.astronomicalDarkness, astronomicalDarknessIntervals: darknessIntervals, moonIlluminationPercent: astronomy.moon.illuminationPercent, forecastStepsDuringDarkness: forecasts.map(forecast => ({ source: forecast.source.name, validTimesUtc: forecast.samples.filter(({ validAt }) => darknessIntervals.some(interval => Date.parse(validAt) >= Date.parse(interval.startUtc) && Date.parse(validAt) <= Date.parse(interval.endUtc))).map(({ validAt }) => validAt) })) },
    sources: providerOutcomes.length ? providerOutcomes.map(outcome => outcome.source) : [UNSPECIFIED_WEATHER_SOURCE],
    caveats: [...candidateZoneCaveats(point), weatherCaveat(dependencies.weatherProvider !== undefined || dependencies.weatherCollection !== undefined), ...collection.outcomes.flatMap(({ result }) => result.deprecationWarning ? [result.deprecationWarning] : [])],
  });
}

const GLOBAL_CONFIGURATION_CAVEAT = "No checksum-pinned global catalogue is installed. Ask for a named town for legacy city-radius coverage, or configure an admitted global edition.";
const CONFIGURATION_SOURCE = {name:"NightSky local catalogue configuration",url:"https://nightsky.earth",attribution:"NightSky runtime provider configuration; this record supplies no geographic source evidence.",dataClass:"context" as const};
// MCP output must have an object root; accept legacy rows without manufacturing a revision.
const integratedSearchResultSchema = searchObservingLocationsResultSchema.extend({
  candidates:z.array(candidateRefSchema.partial({catalogueRevision:true})).max(10),
  sortBasis:searchDiscoveryResultSchema.shape.sortBasis,
  geometryEvidence:searchDiscoveryResultSchema.shape.geometryEvidence,
  discoveryCoverage:discoveryCoverageSchema.optional(),queryScope:discoveryScopeSchema.optional(),originBasis:z.array(originBasisSchema).max(5).optional(),truncationReason:z.string().max(300).optional(),
});

function candidateClimateGap(point: CalculationPlace,month:number):ClimateContextResultV2 {
 return climateContextResultSchema.parse({schemaVersion:2,sourceRevision:point.sourceRevision,placeId:point.placeId,month,timeZone:point.displayTimeZone,dataClass:"reanalysis",historicalLabel:"historical-not-a-forecast",methodVersion:"dark-cloud-v1",sampleDefinition:"hourly-dark-time-samples",unit:"fraction",period:{startNight:"1991-01-01",endNight:"2020-12-31",kind:"baseline-1991-2020"},availability:{status:"not-covered",reason:"No installed historical climate artifact maps this selected candidate and display time zone. No city history has been substituted."},sources:[{name:"ERA5 dataset coverage requirement",url:"https://doi.org/10.24381/cds.adbb2d47",attribution:"ERA5 is the configured historical dataset family; no ERA5 sample or aggregation is available for this candidate.",dataClass:"reanalysis"}],caveats:["No numeric historical statistic is available for this site. The requested baseline is not installed for it."]});
}

function candidateZoneCaveats(point?: {timeZoneBasis?:string;sourceRevision?:string;catalogueRevision?:string;displayTimeZone?:string}):string[]{return (point?.catalogueRevision||point?.timeZoneBasis==="explicit-display")?[`Times use the explicit display time zone ${point.displayTimeZone}; the actual site time zone is unverified.`]:[];}
function candidatePointMetadata(point?: {sourceRevision?:string;catalogueRevision?:string;displayTimeZone?:string}) {return point?.sourceRevision?{sourceRevision:point.sourceRevision,displayTimeZone:point.displayTimeZone}:point?.catalogueRevision?{catalogueRevision:point.catalogueRevision,displayTimeZone:point.displayTimeZone}:{};}

const UNSPECIFIED_WEATHER_SOURCE = {
  name: "NightSky weather provider configuration",
  url: "https://nightsky.earth",
  attribution: "The configured weather provider returned no forecast or source identity. This configuration record supplies no forecast data or provider provenance.",
  dataClass: "context" as const,
};
function weatherSources(result: WeatherProviderResult, customProvider: boolean) {
  if (result.forecast) return [sourceRecordSchema.parse(result.forecast.source)];
  if (customProvider) return [result.source !== undefined ? sourceRecordSchema.parse(result.source) : UNSPECIFIED_WEATHER_SOURCE];
  return [MET_NORWAY_SOURCE];
}
function weatherCaveat(customProvider: boolean): string {
  return `${customProvider ? "Weather" : "MET Norway"} forecasts are model output, not local observations. Cloud, wind, and other variables may be absent by region or forecast horizon.`;
}
