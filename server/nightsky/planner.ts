import { planObservingSessionInputSchema, planResultSchema, type PlanResult } from "../../shared/nightsky/planning";
import type { TimeWindow, SourceRecord } from "../../shared/nightsky/common";
import type { AstronomyWindowResult, TargetVisibilityResult } from "../../shared/nightsky/astronomy";
import type { EventResult } from "../../shared/nightsky/events";
import type { NightConditionsResult, AuroraOutlookResult } from "../../shared/nightsky/weather";
import type { getLocationContextResultSchema, searchObservingLocationsResultSchema } from "../../shared/nightsky/places";
import { climateContextResultSchema, describeClimateContext, observingNightForInstant, type ClimateContextResultV2 } from "../../shared/nightsky/climate";
import type * as z from "zod4";
import { GeoNamesPlaceIndex, resolvedCoordinatesForPlace } from "../places/geonames";
import { getLearningGuidance } from "../content/learning";
import { getPreparationChecklist } from "../content/checklists";
import { suggestVisibleTargets } from "./suggestions";
import { composeCandidateWindows } from "./windows";
import { formatForecastValue, formatLocalInstant } from "../../shared/nightsky/format";
import { evaluateRadiant } from "../events/meteorRadiants";
import { meteorRadiantResultSchema, type MeteorRadiantResult } from "../../shared/nightsky/meteors";

type GetLocationContextResult = z.infer<typeof getLocationContextResultSchema>;
type SearchObservingLocationsResult = z.infer<typeof searchObservingLocationsResultSchema>;

export interface PlannerServices {
  index: GeoNamesPlaceIndex;
  getAstronomy(place: { placeId: string; timeZone: string }, window: TimeWindow): Promise<AstronomyWindowResult>;
  getNightConditions(placeId: string, window: TimeWindow): Promise<NightConditionsResult>;
  searchEvents(placeId: string, window: TimeWindow): Promise<EventResult>;
  getTargetVisibility(place: { placeId: string; timeZone: string }, target: string, window: TimeWindow): Promise<TargetVisibilityResult>;
  getLocationContext(placeId: string): Promise<GetLocationContextResult>;
  searchCandidates?(placeId: string): Promise<SearchObservingLocationsResult>;
  getClimatology?(placeId: string, month: number): Promise<ClimateContextResultV2>;
  getAuroraOutlook?(placeId: string, window: TimeWindow): Promise<AuroraOutlookResult>;
}

type Factor = PlanResult["factors"][number];

/** Compose source-linked evidence into a useful activity-specific plan. Provider failures remain visible gaps. */
export async function planObservingSession(inputValue: unknown, services: PlannerServices): Promise<PlanResult> {
  const input = planObservingSessionInputSchema.parse(inputValue);
  const cityId = input.placeId.startsWith("place:v1:geonames:") ? Number(input.placeId.slice("place:v1:geonames:".length)) : NaN;
  const city = Number.isSafeInteger(cityId) ? services.index.getById(cityId) : undefined;
  if (!city || !resolvedCoordinatesForPlace(services.index, input.placeId)) {
    throw new RangeError("The selected named place is unavailable in the current GeoNames index. Resolve it again.");
  }
  if (input.window.timeZone !== city.timeZone) throw new RangeError("The requested time zone does not match the resolved named place. Resolve the place again and use its returned time zone.");

  const place = services.index.toPlaceRef(city);
  const [astronomy, conditions, events, locationContext, targetVisibility, aurora, candidates, climatology] = await Promise.all([
    settled(() => services.getAstronomy({ placeId: input.placeId, timeZone: input.window.timeZone }, input.window)),
    settled(() => services.getNightConditions(input.placeId, input.window)),
    settled(() => services.searchEvents(input.placeId, input.window)),
    settled(() => services.getLocationContext(input.placeId)),
    input.target && input.activity !== "meteor-shower" ? settled(() => services.getTargetVisibility({ placeId: input.placeId, timeZone: input.window.timeZone }, input.target!, input.window)) : Promise.resolve(undefined),
    input.activity === "aurora" ? (services.getAuroraOutlook ? settled(() => services.getAuroraOutlook!(input.placeId, input.window)) : Promise.resolve(undefined)) : Promise.resolve(undefined),
    services.searchCandidates ? settled(() => services.searchCandidates!(input.placeId)) : Promise.resolve(undefined),
    services.getClimatology ? settled(async () => {
      const month = monthAt(input.window, input.window.timeZone);
      const result = climateContextResultSchema.parse(await services.getClimatology!(input.placeId, month));
      if (result.placeId !== input.placeId || result.month !== month || result.timeZone !== input.window.timeZone) throw new RangeError("Historical context does not match the requested place/month/timezone.");
      return result;
    }) : Promise.resolve(undefined),
  ]);

  const factors: Factor[] = [];
  const gaps: string[] = [];
  const caveats = new Set<string>([
    "A forecast is model output, not an observation; local cloud and visibility can differ.",
    "This plan does not verify site access, night opening, permits, terrain, safety, or local horizon obstructions.",
    "Seeing and transparency are not supplied by the current V1 forecast; do not infer them from cloud cover.",
  ]);
  const sourceRecords: SourceRecord[] = [...place.sources];

  if (astronomy && !isError(astronomy)) {
    sourceRecords.push(...astronomy.sources);
    addAll(caveats, astronomy.caveats);
    factors.push({ name: "Astronomical darkness", assessment: darknessAssessment(astronomy), impact: astronomy.astronomicalDarkness.status === "available" ? "favorable" : "unfavorable", sourceNames: sourceNames(astronomy.sources) });
    factors.push({ name: "Moon", assessment: `Illumination ${round(astronomy.moon.illuminationPercent)}%; maximum altitude ${round(astronomy.moon.maximumAltitudeDegrees)}° at ${astronomy.moon.maximumAltitudeAtUtc}. ${moonInterpretation(input.activity, astronomy.moon.illuminationPercent)}`, impact: moonImpact(input.activity, astronomy.moon.illuminationPercent), sourceNames: sourceNames(astronomy.sources) });
    if (astronomy.polarState !== "normal") factors.push({ name: "Polar daylight or darkness", assessment: `Astronomy state: ${astronomy.polarState}.`, impact: astronomy.polarState === "no-astronomical-darkness" ? "unfavorable" : "mixed", sourceNames: sourceNames(astronomy.sources) });
  } else {
    factors.push({ name: "Astronomical darkness", assessment: "Unavailable: the astronomy calculation failed for this request.", impact: "unknown", sourceNames: [] });
    gaps.push("Astronomical darkness and calculated Moon conditions could not be retrieved.");
  }

  if (conditions && !isError(conditions)) {
    sourceRecords.push(...conditions.sources, ...conditions.forecasts.map(({ source }) => source));
    addAll(caveats, conditions.caveats);
    if (conditions.forecasts.some(({ samples }) => samples.some(({ values }) => Object.values(values).some((value) => value?.periodEndUtc)))) caveats.add("Precipitation intervals may overlap or extend beyond the session; never sum overlapping totals or treat longer-period values as hourly.");
    factors.push(...weatherFactors(conditions, input.activity, input.units, input.locale));
    if (!conditions.forecasts.length) {
      factors.push({ name: "Weather forecast", assessment: `${capitalize(conditions.availability.status)}: ${conditions.availability.reason}`, impact: "unknown", sourceNames: sourceNames(conditions.sources) });
      gaps.push(`${capitalize(conditions.availability.status)}: ${conditions.availability.reason}`);
    }
    for (const forecast of conditions.forecasts) {
      for (const missing of forecast.missingFields) gaps.push(`${humanize(missing.field)} is missing: ${missing.reason}`);
      if (forecast.availability.status === "out-of-horizon") gaps.push(`${forecast.source.name} does not forecast this date yet; no forecast is inferred.`);
    }
    if (!conditions.forecasts.length) gaps.push(`Weather forecast unavailable: ${conditions.availability.reason}`);
  } else {
    factors.push({ name: "Weather forecast", assessment: "Unavailable: the forecast provider failed or did not return a result.", impact: "unknown", sourceNames: [] });
    gaps.push("Weather data is unavailable. Check the provider again closer to the observing date.");
  }

  if (events && !isError(events)) {
    sourceRecords.push(...events.sources, ...events.events.map(event => event.source));
    addAll(caveats, events.caveats);
    const relevant = events.events.filter((event) => input.activity !== "meteor-shower" || event.eventType === "meteor-shower");
    const hasEvaluatedVisibility = relevant.some(event => ["visible", "partially-visible", "not-visible"].includes(event.localVisibility));
    const eventImpact = !relevant.length || !hasEvaluatedVisibility ? "unknown" : relevant.every(event => event.localVisibility === "not-visible") ? "unfavorable" : relevant.every(event => event.localVisibility === "visible") ? "favorable" : "mixed";
    factors.push({
      name: input.activity === "meteor-shower" ? "Meteor shower and sky events" : "Sky events",
      assessment: relevant.length ? relevant.slice(0, 6).map((event) => `${event.name}${event.peakUtc ? ` peaks ${event.peakUtc}` : ""} (visibility: ${event.localVisibility})`).join("; ") : "No supported matching event was found in the selected window.",
      impact: eventImpact, sourceNames: sourceNames(events.sources),
    });
    if (events.unsupportedEventTypes.length) gaps.push(`Event classes not covered by V1: ${events.unsupportedEventTypes.join(", ")}.`);
  } else {
    factors.push({ name: "Sky events", assessment: "Unavailable: event lookup failed.", impact: "unknown", sourceNames: [] });
    gaps.push("Sky events could not be checked.");
  }

  const meteorRadiantSamples: MeteorRadiantResult[] = [];
  if (input.activity === "meteor-shower") {
    const matchingEvents = events && !isError(events) ? events.events.filter(event => event.eventType === "meteor-shower") : [];
    const code = input.target ? meteorCode(input.target) : matchingEvents.length === 1 ? meteorCode(matchingEvents[0]!.name) ?? meteorCode(matchingEvents[0]!.eventId.split(":").at(-1)!) : undefined;
    if (code) {
      const start = Date.parse(input.window.startUtc), end = Date.parse(input.window.endUtc);
      try {
        for (const instant of [start, (start + end) / 2, end]) meteorRadiantSamples.push(meteorRadiantResultSchema.parse(evaluateRadiant(code, instant, { latitude: city.latitude, longitude: city.longitude })));
      } catch { meteorRadiantSamples.length = 0; gaps.push("The local radiant model could not be evaluated; retry the selected shower and time."); }
    }
    const available = meteorRadiantSamples.filter(sample => sample.status === "available");
    if (available.length) {
      for (const sample of available) {
        sourceRecords.push({ ...sample.source, name: "Global Meteor Network radiant fits", product: "Moorhead, Clements and Vida radiant fit coefficients", dataClass: "calculation" });
        caveats.add(sample.caveat);
      }
      sourceRecords.push({ name: "Astronomy Engine", url: "https://github.com/cosinekitty/astronomy", attribution: "Astronomy Engine by Don Cross, MIT License. Solar longitude, frame rotations, horizon and Moon calculations by NightSky.earth.", dataClass: "calculation", product: "Meteor radiant geometry", vintage: "astronomy-engine-2.1.19", licenseUrl: "https://github.com/cosinekitty/astronomy/blob/master/LICENSE", modified: true });
      factors.push({ name: "Meteor radiant visibility", assessment: available.map(sample => `${sample.code} at ${sample.evaluatedAt}: altitude ${round(sample.altitudeDeg)}°, azimuth ${round(sample.azimuthDeg)}°, Moon separation ${round(sample.moonSeparationDeg)}°; ${sample.annualExtrapolation ? "annual extrapolation" : "within observation years"}`).join("; "), impact: "mixed", sourceNames: ["Global Meteor Network radiant fits", "Astronomy Engine"] });
      caveats.add("Radiant fits use observations from 2018-12-10 to 2021-05-22; annual reuse through 2030 is extrapolation. Three point samples do not establish continuous visibility, full-season activity, meteor rates or exact peak times.");
      caveats.add("Moon separation compares a modeled geocentric mean radiant with a topocentric Moon direction in equatorial-of-date coordinates; parameter uncertainties are not propagated confidence intervals.");
    } else {
      factors.push({ name: "Meteor radiant visibility", assessment: "Unknown: select a reviewed shower whose coordinates or drift model covers this date. Radiant altitude and Moon separation remain unknown outside the licensed fit windows.", impact: "unknown", sourceNames: [] });
      gaps.push(code ? meteorRadiantSamples.length ? "Meteor radiant altitude and moon-to-radiant separation are not calculated where the model is outside its nominal radiant fit window." : "Meteor radiant altitude and moon-to-radiant separation are unavailable because the local model could not be evaluated." : "Meteor radiant altitude is unknown: choose one reviewed shower (PER, GEM, ORI, ETA, LYR, SDA, QUA or LEO); an unknown or ambiguous event list cannot select a radiant.");
    }
    for (const sample of meteorRadiantSamples) if (sample.status !== "available") gaps.push(`${sample.code} radiant ${sample.status}: ${sample.reason}`);
    gaps.push("Complete meteor activity seasons and full-season radiant coverage remain unavailable. The enabled meteor calendar supplies year-specific forecast maxima; bounded radiant fits and forecast peaks do not establish activity-season boundaries.");
  }

  if (input.target && input.activity !== "meteor-shower") {
    if (targetVisibility && !isError(targetVisibility)) {
      sourceRecords.push(...targetVisibility.sources);
      addAll(caveats, targetVisibility.caveats);
      factors.push({ name: `${targetVisibility.target.name} visibility`, assessment: targetVisibility.availability.status === "available" ? targetVisibility.intervals.length ? targetVisibility.intervals.map((interval) => `${interval.localStart}–${interval.localEnd}; maximum altitude ${round(interval.maximumAltitudeDegrees)}°`).join("; ") : "The target does not rise above the geometric horizon during the selected window." : `${capitalize(targetVisibility.availability.status)}: ${targetVisibility.availability.reason}`, impact: targetVisibility.intervals.length ? "favorable" : "unknown", sourceNames: sourceNames(targetVisibility.sources) });
    } else {
      factors.push({ name: "Target visibility", assessment: "Unavailable: target visibility could not be calculated.", impact: "unknown", sourceNames: [] });
      gaps.push("Target visibility could not be checked.");
    }
  }

  if (input.activity === "aurora") {
    if (aurora && !isError(aurora)) {
      sourceRecords.push(...aurora.sources); addAll(caveats, aurora.caveats);
      const outlook = aurora.outlook;
      factors.push({ name: "Aurora outlook", assessment: outlook.status === "available" ? `${outlook.summary} Grid value ${outlook.gridValue} ${outlook.gridValueUnit} at ${outlook.gridCellLatitude}°, ${outlook.gridCellLongitude}°.` : `${capitalize(outlook.status)}: ${outlook.reason}`, impact: outlook.status === "available" ? "mixed" : "unknown", sourceNames: sourceNames(aurora.sources) });
    } else factors.push({ name: "Aurora outlook", assessment: "Unsupported: no aurora provider is enabled for this plan.", impact: "unknown", sourceNames: [] });
  }

  if (locationContext && !isError(locationContext)) {
    sourceRecords.push(...locationContext.sources); addAll(caveats, locationContext.caveats);
    if (locationContext.access.status === "verified") sourceRecords.push(locationContext.access.source);
    if (locationContext.groundLightContext.status === "available") sourceRecords.push(locationContext.groundLightContext.source);
    const access = locationContext.access;
    factors.push({ name: "Site access", assessment: access.status === "verified" ? `Verified from source: ${access.description}` : `Unknown: ${access.description ?? "No independent access evidence is available."}`, impact: access.status === "verified" ? "mixed" : "unknown", sourceNames: access.status === "verified" ? [access.source.name] : [] });
  } else factors.push({ name: "Site access", assessment: "Unknown: access and night opening have not been independently verified.", impact: "unknown", sourceNames: [] });

  if (candidates && !isError(candidates)) {
    sourceRecords.push(...candidates.sources, ...candidates.candidates.flatMap(candidate => candidate.sources));
    factors.push({ name: "Nearby observing places", assessment: candidates.availability.status === "available" ? `${candidates.candidates.length} candidate place(s) returned; access and darkness still require independent checks.` : `${capitalize(candidates.availability.status)}: ${candidates.availability.reason}`, impact: candidates.candidates.length ? "mixed" : "unknown", sourceNames: sourceNames(candidates.sources) });
  } else factors.push({ name: "Nearby observing places", assessment: "Unsupported: no rights-reviewed local candidate index is enabled.", impact: "unknown", sourceNames: [] });

  if (climatology && !isError(climatology)) {
    sourceRecords.push(...climatology.sources);
    addAll(caveats, climatology.caveats);
    factors.push({ name: "Historical context", assessment: describeClimateContext(climatology), impact: "unknown", sourceNames: sourceNames(climatology.sources) });
    if (climatology.availability.status !== "available") gaps.push(`Historical context is ${climatology.availability.status}: ${climatology.availability.reason}`);
  } else factors.push({ name: "Historical context", assessment: "Unsupported: no rights-reviewed historical sky-condition dataset is enabled.", impact: "unknown", sourceNames: [] });

  const learningGuide = ["learning", "astrophotography", "deep-sky-imaging", "eclipse"].includes(input.activity)
    ? getLearningGuidance({ activity: input.activity as "learning" | "astrophotography" | "deep-sky-imaging" | "eclipse", experience: input.experience, hemisphere: city.latitude === 0 ? "equatorial" : city.latitude > 0 ? "north" : "south" })
    : undefined;
  if (learningGuide) sourceRecords.push(...learningGuide.sources);

  if (conditions && !isError(conditions) && conditions.availability.status !== "available") gaps.push(`Weather evidence is ${conditions.availability.status}: ${conditions.availability.reason}`);
  if (locationContext && !isError(locationContext) && locationContext.access.status === "unknown") gaps.push("Confirm public access, opening hours, permits, and current closures directly before travel.");
  if (input.activity === "astrophotography" || input.activity === "deep-sky-imaging") gaps.push("No seeing or transparency forecast is available; cloud cover alone cannot establish imaging quality.");
  const suggestions = input.target ? [] : await suggestVisibleTargets(input.activity, { placeId: input.placeId, timeZone: input.window.timeZone }, input.window, services, astronomy && !isError(astronomy) ? astronomy : undefined);
  suggestions.forEach(target => { sourceRecords.push(...target.sources); addAll(caveats, target.caveats); });
  if (!input.target && ["general-stargazing", "visual-stargazing", "learning", "planet-observing", "moon-observing", "astrophotography"].includes(input.activity) && !suggestions.length) gaps.push("No supported bright target is geometrically visible in this session; the local catalog covers Sun, Moon, planets and Milky Way core only.");
  if (input.activity === "deep-sky-imaging" && !input.target) gaps.push("No rights-reviewed deep-sky catalog is enabled. Supply a supported target or use a specialist sky catalog; global deep-sky suggestions are unsupported.");
  if (input.target && targetVisibility && !isError(targetVisibility) && targetVisibility.availability.status !== "available") gaps.push(`Target visibility is ${targetVisibility.availability.status}: ${targetVisibility.availability.reason}`);
  if (input.activity === "eclipse") gaps.push("A general session interval cannot establish eclipse contacts or safe viewing; use the selected event's source-linked visibility and safety guidance.");
  if (conditions && !isError(conditions) && conditions.forecasts.some(forecast => forecast.samples.some(sample => sample.values.totalCloudCover && !sample.values.totalCloudCover.periodEndUtc))) gaps.push("Cloud forecasts contain instant or sparse samples, not cloud coverage intervals; no continuous weather window is inferred.");
  if (["meteor-shower", "deep-sky-imaging", "astrophotography", "aurora"].includes(input.activity)) gaps.push("Moon illumination is whole-session context; Moon-above-horizon timing is not supplied for the entire candidate window.");
  const cloudCoverMax = conditions && !isError(conditions)
    ? maxForecastValue(conditions, "totalCloudCover")
    : undefined;
  const prep = [...getPreparationChecklist(input.activity, { experience: input.experience, equipment: input.equipment, cloudCoverMax }), ...(learningGuide?.guidance ?? [])].slice(0, 20);
  const summary = makeSummary(input.activity, factors, conditions && !isError(conditions) ? conditions.availability.status : "unavailable", gaps);
  const target = targetVisibility && !isError(targetVisibility) ? targetVisibility : undefined;
  const candidateWindows = composeCandidateWindows(input.activity, input.window, astronomy && !isError(astronomy) ? astronomy : undefined, target ? [target] : suggestions, conditions && !isError(conditions) ? conditions : undefined);
  if (candidateWindows.length === 8) gaps.push("The bounded display contains eight candidate windows; all target intervals remain in exact structured target evidence for additional evaluation.");
  const uniqueSources = dedupeSources(sourceRecords);
  const timedPreparation = input.experience === "beginner" || ["learning", "general-stargazing", "visual-stargazing"].includes(input.activity) ? timedSteps(candidateWindows[0]?.window.startUtc ?? input.window.startUtc, input.window, input.locale) : [];
  const result = planResultSchema.parse({
    availability: { status: gaps.length ? "partial" : "available", reason: gaps.length ? "A useful plan was assembled, with missing evidence listed explicitly." : "The requested planning evidence was assembled." },
    sources: uniqueSources.length ? uniqueSources : [place.sources[0]!], caveats: Array.from(caveats).slice(0, 20), goal: input.activity, place, requestedWindow: input.window,
    summary, candidateWindows, factors: factors.slice(0, 20).map(factor => ({ ...factor, name: factor.name.slice(0, 120), assessment: conciseAssessment(factor.assessment) })), gaps: Array.from(new Set(gaps)), preparation: prep.map(item => item.length <= 300 ? item : `${item.slice(0, 230)}… Review the full equipment list you supplied before departure.`),
    suggestions, timedPreparation, evidence: { ...(astronomy && !isError(astronomy) ? { astronomy } : {}), ...(target ? { target } : {}), ...(conditions && !isError(conditions) ? { weather: conditions } : {}), ...(events && !isError(events) ? { events } : {}), ...(aurora && !isError(aurora) ? { aurora } : {}), ...(climatology && !isError(climatology) ? { history: climatology } : {}), ...(locationContext && !isError(locationContext) ? { location: locationContext } : {}), ...(candidates && !isError(candidates) ? { candidates } : {}), ...(input.activity === "meteor-shower" ? { meteorRadiantSamples } : {}) },
  });
  return result;
}

function settled<T>(callback: () => Promise<T>): Promise<T | Error> { return callback().catch((error: unknown) => error instanceof Error ? error : new Error("Provider failed.")); }
function isError(value: unknown): value is Error { return value instanceof Error; }
function conciseAssessment(value: string): string { return value.length <= 500 ? value : `${value.slice(0, 410)}… Full exact values and source records are retained in structured evidence.`; }
function meteorCode(query: string): string | undefined {
  const aliases: Record<string, string> = { per: "PER", perseids: "PER", gem: "GEM", geminids: "GEM", ori: "ORI", orionids: "ORI", eta: "ETA", "eta aquariids": "ETA", lyr: "LYR", lyrids: "LYR", sda: "SDA", "southern delta aquariids": "SDA", "delta aquariids": "SDA", qua: "QUA", quadrantids: "QUA", leo: "LEO", leonids: "LEO" };
  const key = query.trim().toLowerCase().replaceAll("-", " ").replace(/\s+(?:meteor\s+)?shower$/, "");
  return Object.hasOwn(aliases, key) ? aliases[key] : undefined;
}
function sourceNames(sources: SourceRecord[]): string[] { return Array.from(new Set(sources.map(({ name }) => name))).slice(0, 8); }
function addAll(target: Set<string>, values: string[]): void { values.forEach((value) => target.add(value)); }
function dedupeSources(sources: SourceRecord[]): SourceRecord[] { return Array.from(new Map(sources.map((source) => [JSON.stringify(source), source])).values()); }
function round(value: number): string { return Number.isInteger(value) ? String(value) : value.toFixed(1); }
function capitalize(value: string): string { return value.charAt(0).toUpperCase() + value.slice(1); }
function humanize(value: string): string { return value.replace(/[A-Z]/g, (letter) => ` ${letter.toLowerCase()}`).replace(/^./, (letter) => letter.toUpperCase()); }
function monthAt(window: TimeWindow, timeZone: string): number { return Number(observingNightForInstant(window.startUtc, timeZone).slice(5, 7)); }
function darknessAssessment(result: AstronomyWindowResult): string { return result.astronomicalDarkness.status === "available" ? `${result.astronomicalDarkness.localStart} to ${result.astronomicalDarkness.localEnd} local time.` : `${capitalize(result.astronomicalDarkness.status)}: ${result.astronomicalDarkness.reason}`; }
function moonInterpretation(activity: string, illumination: number): string {
  if (activity === "moon-observing") return "Moonlight supports lunar observing; phase and altitude still determine the view.";
  if (activity === "meteor-shower") return illumination <= 25 ? "Low moonlight is generally helpful for seeing fainter meteors." : illumination >= 70 ? "Bright moonlight may reduce visibility of fainter meteors." : "Moonlight may reduce visibility of some fainter meteors.";
  if (["astrophotography", "deep-sky-imaging"].includes(activity)) return illumination >= 50 ? "Moonlight can brighten the sky background, especially near the Moon." : "Moonlight is lower, though target separation and sky brightness still matter.";
  return illumination >= 70 ? "Bright moonlight can reduce contrast for faint objects." : "Moonlight is one factor; local sky brightness and target choice also matter.";
}
function moonImpact(activity: string, illumination: number): Factor["impact"] {
  if (activity === "moon-observing") return "favorable";
  if (activity === "meteor-shower" || activity === "astrophotography" || activity === "deep-sky-imaging") return illumination >= 70 ? "unfavorable" : illumination <= 25 ? "favorable" : "mixed";
  return illumination >= 70 ? "unfavorable" : "mixed";
}
function weatherFactors(result: NightConditionsResult, activity: string, units: "metric" | "imperial", locale: string): Factor[] {
  const skyFields = ["totalCloudCover", "lowCloudCover", "mediumCloudCover", "highCloudCover", "precipitationProbability", "precipitationAmount"] as const;
  const otherFields = ["windSpeed", "windGust", "temperature", "dewPoint", "relativeHumidity", "visibility"] as const;
  const factors: Factor[] = [];
  for (const forecast of result.forecasts) {
    for (const group of [{ label: "cloud and precipitation", fields: skyFields }, { label: "wind, temperature, and visibility", fields: otherFields }] as const) {
      const parts: string[] = [];
      const impacts: Factor["impact"][] = [];
      for (const field of group.fields) {
        const observations = forecast.samples.flatMap((sample) => sample.values[field] ? [{ ...sample.values[field]! }] : []);
        if (!observations.length) continue;
        const groups = new Map<string, typeof observations>();
        for (const value of observations) {
          const hours = value.periodStartUtc && value.periodEndUtc ? (Date.parse(value.periodEndUtc) - Date.parse(value.periodStartUtc)) / 3_600_000 : undefined;
          const key = `${value.unit}|${hours ?? "instant"}`;
          const list = groups.get(key) ?? []; list.push(value); groups.set(key, list);
        }
        const descriptions = Array.from(groups.values()).map((list) => {
          const min = Math.min(...list.map(({ value }) => value)); const max = Math.max(...list.map(({ value }) => value)); const first = list[0]!;
          const hours = first.periodStartUtc && first.periodEndUtc ? (Date.parse(first.periodEndUtc) - Date.parse(first.periodStartUtc)) / 3_600_000 : undefined;
          const display = min === max ? formatForecastValue({ value: min, unit: first.unit }, units, locale) : `${formatForecastValue({ value: min, unit: first.unit }, units, locale)}–${formatForecastValue({ value: max, unit: first.unit }, units, locale)}`;
          return `${display}${hours !== undefined ? ` (${round(hours)}h)` : ""}`;
        });
        parts.push(`${humanize(field)} ${descriptions.join(", ")}`);
        const min = Math.min(...observations.map(({ value }) => value)); const max = Math.max(...observations.map(({ value }) => value));
        if (field === "totalCloudCover" || field === "lowCloudCover" || field === "precipitationProbability") impacts.push(max <= 30 ? "favorable" : min >= 70 ? "unfavorable" : "mixed");
      }
      if (!parts.length) continue;
      const first = forecast.samples[0]!.validAt; const last = forecast.samples[forecast.samples.length - 1]!.validAt;
      const periodEnds = forecast.samples.flatMap(({ values }) => Object.values(values).flatMap((value) => value?.periodEndUtc ? [value.periodEndUtc] : []));
      const periodEnd = periodEnds.length ? periodEnds.sort().at(-1) : undefined;
      const validRange = `${first === last ? `valid ${first}` : `valid ${first} to ${last}`}${periodEnd && group.label === "cloud and precipitation" ? `; aggregation through ${periodEnd}` : ""}`;
      const cloudNote = activity === "aurora" && group.label === "cloud and precipitation" ? " Clouds can obstruct the view independently of aurora activity." : "";
      factors.push({ name: `${forecast.source.name} ${group.label} forecast`, assessment: `${parts.join("; ")}; ${forecast.samples.length} sample(s), ${validRange}.${cloudNote}`, impact: group.label === "cloud and precipitation" ? aggregateImpact(impacts) : "unknown", sourceNames: [forecast.source.name] });
    }
  }
  return factors;
}
function timedSteps(startUtc: string, window: TimeWindow, locale: string): NonNullable<PlanResult["timedPreparation"]> {
  const start = Date.parse(startUtc), end = Date.parse(window.endUtc);
  return [
    { at: Math.max(Date.parse(window.startUtc), start - 30 * 60_000), instruction: "Set up on level ground and confirm access; allow 20–30 minutes for eyes to adapt. Families can begin with a short shared Moon or planet view." },
    { at: start, instruction: "Begin with one suggested target and take turns; use a dim red light and avoid bright phone screens." },
    { at: Math.min(end - 1, start + 30 * 60_000), instruction: "After 30 minutes, check comfort, warmth and cloud changes. Take a break or finish early if children are tired." },
  ].map(step => ({ atUtc: new Date(step.at).toISOString(), localTime: formatLocalInstant(new Date(step.at).toISOString(), window.timeZone, locale), instruction: step.instruction }));
}
function aggregateImpact(values: Factor["impact"][]): Factor["impact"] {
  if (!values.length) return "unknown";
  if (values.every((value) => value === values[0])) return values[0]!;
  return "mixed";
}
function maxForecastValue(result: NightConditionsResult, field: "totalCloudCover"): number | undefined {
  const values = result.forecasts.flatMap(({ samples }) => samples.flatMap(({ values }) => values[field] ? [values[field]!.value] : []));
  return values.length ? Math.max(...values) : undefined;
}
function makeSummary(activity: string, factors: Factor[], weatherStatus: string, gaps: string[]): string {
  const darkness = factors.find(({ name }) => name === "Astronomical darkness")?.assessment;
  const cloud = factors.find(({ name }) => /cloud and precipitation forecast/.test(name))?.assessment;
  const lead = `${capitalize(activity.replaceAll("-", " "))} plan`;
  const cloudText = cloud ? cloud.replace(/[.;]+$/, "") : "cloud forecast unavailable";
  return `${lead}: ${darkness ? `darkness ${darkness}` : "darkness data unavailable"}; forecast evidence ${weatherStatus}; ${cloudText}. ${gaps.length ? `${gaps.length} evidence gap(s) need attention.` : "No material evidence gaps were found."}`;
}
