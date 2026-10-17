import { sampleConjunctionWindow } from "../events/intervalVisibility";
import { resolveNamedCalculationPlace, CalculationPlaceClarificationError, type CalculationObserverPlace, type CalculationPlaceInput } from "../places/calculationPlace";
import { calculationPlaceSchema, type SearchDiscoveryResult, type CalculationPlace } from "../../shared/nightsky/discovery";
import { planObservingSessionInputSchema, planResultSchema, type PlanResult } from "../../shared/nightsky/planning";
import type { TimeWindow, SourceRecord } from "../../shared/nightsky/common";
import type { AstronomyWindowResult, TargetVisibilityResult } from "../../shared/nightsky/astronomy";
import type { EventResult } from "../../shared/nightsky/events";
import type { NightConditionsResult, AuroraOutlookResult } from "../../shared/nightsky/weather";
import type { getLocationContextResultSchema, searchObservingLocationsResultSchema } from "../../shared/nightsky/places";
import { climateContextResultSchema, describeClimateContext, observingNightForInstant, type ClimateContextResultV2 } from "../../shared/nightsky/climate";
import type * as z from "zod4";
import { GeoNamesPlaceIndex } from "../places/geonames";
import { getLearningGuidance } from "../content/learning";
import { getPreparationChecklist } from "../content/checklists";
import { suggestVisibleTargets } from "./suggestions";
import { composeCandidateWindows, usableWeatherForecast } from "./windows";
import { formatForecastValue, formatLocalInstant } from "../../shared/nightsky/format";
import { evaluateRadiant } from "../events/meteorRadiants";
import { meteorRadiantResultSchema, type MeteorRadiantResult } from "../../shared/nightsky/meteors";

type GetLocationContextResult = z.infer<typeof getLocationContextResultSchema>;
type SearchObservingLocationsResult = z.infer<typeof searchObservingLocationsResultSchema>;

export interface PlannerServices {
  index?: GeoNamesPlaceIndex;
  getPlaceRef?(input: CalculationPlaceInput): Promise<import("../../shared/nightsky/places").PlaceRef | import("../../shared/nightsky/places").ApiPlaceRef>;
  resolveCalculationPlace?(input: CalculationPlaceInput): Promise<CalculationPlace>;
  getAstronomy(place: CalculationObserverPlace, window: TimeWindow, calculationPlace?: CalculationPlace): Promise<AstronomyWindowResult>;
  getNightConditions(placeId: string, window: TimeWindow, calculationPlace?: CalculationPlace): Promise<NightConditionsResult>;
  searchEvents(placeId: string, window: TimeWindow, calculationPlace?: CalculationPlace): Promise<EventResult>;
  getTargetVisibility(place: CalculationObserverPlace, target: string, window: TimeWindow, calculationPlace?: CalculationPlace): Promise<TargetVisibilityResult>;
  getLocationContext(placeId: string, calculationPlace?: CalculationPlace): Promise<GetLocationContextResult>;
  searchCandidates?(placeId: string, calculationPlace?: CalculationPlace): Promise<SearchObservingLocationsResult | SearchDiscoveryResult>;
  getClimatology?(placeId: string, month: number, calculationPlace?: CalculationPlace): Promise<ClimateContextResultV2>;
  getAuroraOutlook?(placeId: string, window: TimeWindow, calculationPlace?: CalculationPlace): Promise<AuroraOutlookResult>;
}

type Factor = PlanResult["factors"][number];

/** Compose source-linked evidence into a useful activity-specific plan. Provider failures remain visible gaps. */
export async function planObservingSession(inputValue: unknown, services: PlannerServices): Promise<PlanResult> {
  const input = planObservingSessionInputSchema.parse(inputValue);
  const selection = {placeId:input.placeId,catalogueRevision:input.catalogueRevision,sourceRevision:input.sourceRevision,displayTimeZone:input.displayTimeZone};
  const calculation = calculationPlaceSchema.parse(services.resolveCalculationPlace
    ? await services.resolveCalculationPlace(selection)
    : resolveNamedCalculationPlace(selection, services.index!));
  if (calculation.placeId !== input.placeId || calculation.displayTimeZone !== input.window.timeZone || (input.displayTimeZone && input.displayTimeZone !== calculation.displayTimeZone) || (input.catalogueRevision && input.catalogueRevision !== calculation.catalogueRevision) || (input.sourceRevision && input.sourceRevision !== calculation.sourceRevision)) throw new CalculationPlaceClarificationError("time-zone-mismatch", "The selected calculation place, revision and requested display time zone must match. Resolve the place again.");
  const observerPlace: CalculationObserverPlace = { placeId: input.placeId, timeZone: calculation.displayTimeZone, calculationPlace: calculation };
  const place = services.getPlaceRef ? await services.getPlaceRef(selection) : calculation.catalogueRevision || calculation.sourceRevision
    ? {placeId:calculation.placeId, displayName:calculation.name, timeZone:calculation.displayTimeZone, indexVintage:calculation.catalogueRevision, sourceRevision:calculation.sourceRevision, catalogueRevision:calculation.catalogueRevision, timeZoneBasis:calculation.timeZoneBasis, sources:calculation.sources}
    : services.index!.toPlaceRef(services.index!.getById(Number(input.placeId.slice("place:v1:geonames:".length)))!);
  const [astronomy, conditions, events, locationContext, targetVisibility, aurora, candidates, climatology] = await Promise.all([
    settled(() => services.getAstronomy(observerPlace, input.window, calculation)),
    settled(() => services.getNightConditions(input.placeId, input.window, calculation)),
    settled(() => services.searchEvents(input.placeId, input.window, calculation)),
    settled(() => services.getLocationContext(input.placeId, calculation)),
    input.target && input.activity !== "meteor-shower" ? settled(() => services.getTargetVisibility(observerPlace, input.target!, input.window, calculation)) : Promise.resolve(undefined),
    input.activity === "aurora" ? (services.getAuroraOutlook ? settled(() => services.getAuroraOutlook!(input.placeId, input.window, calculation)) : Promise.resolve(undefined)) : Promise.resolve(undefined),
    services.searchCandidates ? settled(() => services.searchCandidates!(input.placeId, calculation)) : Promise.resolve(undefined),
    services.getClimatology ? settled(async () => {
      const month = monthAt(input.window, input.window.timeZone);
      const result = climateContextResultSchema.parse(await services.getClimatology!(input.placeId, month, calculation));
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
  if (calculation.timeZoneBasis === "explicit-display") caveats.add(`Times use the explicit display time zone ${calculation.displayTimeZone}; the actual site time zone is unverified.`);
  const sourceRecords: SourceRecord[] = [...place.sources];

  if (astronomy && !isError(astronomy)) {
    sourceRecords.push(...astronomy.sources);
    addAll(caveats, astronomy.caveats);
    factors.push({ name: "Astronomical darkness", assessment: darknessAssessment(astronomy), impact: darknessImpact(astronomy.darknessState), sourceNames: sourceNames(astronomy.sources) });
    factors.push({ name: "Moon", assessment: `Illumination ${round(astronomy.moon.illuminationPercent)}%; maximum altitude ${round(astronomy.moon.maximumAltitudeDegrees)}° at ${astronomy.moon.maximumAltitudeAtUtc}. ${moonInterpretation(input.activity, astronomy.moon.illuminationPercent)}`, impact: moonImpact(input.activity, astronomy.moon.illuminationPercent), sourceNames: sourceNames(astronomy.sources) });
  } else {
    factors.push({ name: "Astronomical darkness", assessment: "Unavailable: the astronomy calculation failed for this request.", impact: "unknown", sourceNames: [] });
    gaps.push("Astronomical darkness and calculated Moon conditions could not be retrieved.");
  }

  if (conditions && !isError(conditions)) {
    sourceRecords.push(...conditions.sources, ...conditions.forecasts.map(({ source }) => source));
    addAll(caveats, conditions.caveats);
    for (const outcome of conditions.providerOutcomes ?? []) if (outcome.status !== "available") gaps.push(`${outcome.source.name} ${outcome.status}: ${outcome.reason}`.slice(0, 400));
    for (const steps of conditions.nightContext.forecastStepsDuringDarkness) if (!steps.validTimesUtc.length) gaps.push(`${steps.source} supplies no forecast samples during calculated astronomical darkness.`);
    if (conditions.forecasts.some(({ samples }) => samples.some(({ values }) => Object.values(values).some((value) => value?.periodEndUtc)))) caveats.add("Precipitation intervals may overlap or extend beyond the session; never sum overlapping totals or treat longer-period values as hourly.");
    factors.push(...weatherFactors(conditions, input.activity, input.units, input.locale));
    if (!conditions.forecasts.length) {
      factors.push({ name: "Weather forecast", assessment: `${capitalize(conditions.availability.status)}: ${conditions.availability.reason}`, impact: "unknown", sourceNames: sourceNames(conditions.sources) });
      gaps.push(`${capitalize(conditions.availability.status)}: ${conditions.availability.reason}`);
    }
    for (const forecast of conditions.forecasts) {
      for (const missing of forecast.missingFields) gaps.push(`${forecast.source.name}: ${humanize(missing.field)} is missing: ${missing.reason}`.slice(0, 400));
      if (forecast.availability.status === "out-of-horizon") gaps.push(`${forecast.source.name} does not forecast this date yet; no forecast is inferred.`);
    }
    if (!conditions.forecasts.length) gaps.push(`Weather forecast unavailable: ${conditions.availability.reason}`);
  } else {
    factors.push({ name: "Weather forecast", assessment: "Unavailable: the forecast provider failed or did not return a result.", impact: "unknown", sourceNames: [] });
    gaps.push("Weather data is unavailable. Check the provider again closer to the observing date.");
  }

  // Empty event inventory is useful only for an explicit event plan; positive events remain relevant to every activity.
  const includeEventEvidence = input.activity === "meteor-shower" || input.activity === "eclipse" || Boolean(events && !isError(events) && events.events.length);
  if (includeEventEvidence && events && !isError(events)) {
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
  } else if (includeEventEvidence) {
    factors.push({ name: "Sky events", assessment: "Unavailable: event lookup failed.", impact: "unknown", sourceNames: [] });
    gaps.push("Sky events could not be checked.");
  }

  const conjunctionWindows: ReturnType<typeof sampleConjunctionWindow>[] = [];
  if (includeEventEvidence && events && !isError(events)) {
    const pairs = events.events.filter(event => event.pairConjunction);
    for (const event of pairs.slice(0, 6)) {
      try { conjunctionWindows.push(sampleConjunctionWindow({ eventId: event.eventId, bodies: event.pairConjunction!.bodies, latitude: calculation.latitude, longitude: calculation.longitude, startUtc: input.window.startUtc, endUtc: input.window.endUtc })); }
      catch { gaps.push(`Local conjunction geometry could not be evaluated for ${event.name}.`); }
    }
    if (pairs.length > 6) gaps.push("Local conjunction sampling is limited to the first six returned pair events.");
    if (conjunctionWindows.length) {
      caveats.add("Conjunction geometry uses 15-minute point samples plus the endpoint at a zero-elevation geometric horizon. Between-sample visibility, terrain, buildings, atmospheric extinction and detectability are not established. Solar and Moon altitude/illumination are context, not visibility thresholds.");
      if (!conditions || isError(conditions) || !conditions.forecasts.some(forecast => usableWeatherForecast(conditions, forecast) && forecast.samples.length)) gaps.push("Local conjunction weather is unknown: no usable source-native forecast samples are available; geometry does not imply clear skies.");
      factors.push({ name: "Local conjunction geometry", assessment: `${conjunctionWindows.length} pair window(s) sampled for both body altitudes, Sun altitude and Moon context. Consult separate source-native forecast evidence; these samples do not establish continuous visibility or detectability.`, impact: "unknown", sourceNames: ["Astronomy Engine"] });
      sourceRecords.push({ name: "Astronomy Engine", url: "https://github.com/cosinekitty/astronomy", attribution: "Astronomy Engine by Don Cross, MIT License. Local geometric altitude and lunar illumination calculations by NightSky.earth.", dataClass: "calculation", product: "Conjunction observing geometry", vintage: "astronomy-engine-2.1.19", licenseUrl: "https://github.com/cosinekitty/astronomy/blob/master/LICENSE", modified: true });
    }
  }

  const meteorRadiantSamples: MeteorRadiantResult[] = [];
  if (input.activity === "meteor-shower") {
    const matchingEvents = events && !isError(events) ? events.events.filter(event => event.eventType === "meteor-shower") : [];
    const code = input.target ? meteorCode(input.target) : matchingEvents.length === 1 ? meteorCode(matchingEvents[0]!.name) ?? meteorCode(matchingEvents[0]!.eventId.split(":").at(-1)!) : undefined;
    const civilGuidance = events && !isError(events) ? events.meteorCivilGuidance?.find(row => row.code === code) : undefined;
    if (civilGuidance) {
      sourceRecords.push(civilGuidance.source);
      caveats.add(civilGuidance.caveat);
      const maximumApplies = new Date(input.window.startUtc).getUTCFullYear() === civilGuidance.maximumYear && new Date(input.window.endUtc).getUTCFullYear() === civilGuidance.maximumYear;
      factors.push({ name: "Meteor civil calendar guidance", assessment: `${civilGuidance.name}: typical annual source dates ${civilGuidance.startMonthDay} to ${civilGuidance.endMonthDay}; exact activity boundaries and time zone are unspecified. ${civilGuidance.geographicQualification}.${maximumApplies ? ` Approximate ${civilGuidance.maximumYear} maximum: ${civilGuidance.maximumWording}; numerical uncertainty is not supplied.` : " The separately retained 2026 maximum does not apply to this requested year."} Requested-window activity overlap is not established.`, impact: "unknown", sourceNames: [civilGuidance.source.name] });
    }
    if (code) {
      const start = Date.parse(input.window.startUtc), end = Date.parse(input.window.endUtc);
      try {
        const instants = [start];
        for (let instant = start + 900_000; instant < end; instant += 900_000) instants.push(instant);
        instants.push(end);
        for (const instant of instants) meteorRadiantSamples.push(meteorRadiantResultSchema.parse({ ...evaluateRadiant(code, instant, { latitude: calculation.latitude, longitude: calculation.longitude }), evaluatedAt: new Date(instant).toISOString() }));
      } catch { meteorRadiantSamples.length = 0; gaps.push("The local radiant model could not be evaluated; retry the selected shower and time."); }
    }
    const available = meteorRadiantSamples.filter(sample => sample.status === "available");
    if (available.length) {
      for (const sample of available) {
        sourceRecords.push({ ...sample.source, name: "Global Meteor Network radiant fits", product: "Moorhead, Clements and Vida radiant fit coefficients", dataClass: "calculation" });
        caveats.add(sample.caveat);
      }
      sourceRecords.push({ name: "Astronomy Engine", url: "https://github.com/cosinekitty/astronomy", attribution: "Astronomy Engine by Don Cross, MIT License. Solar longitude, frame rotations, horizon and Moon calculations by NightSky.earth.", dataClass: "calculation", product: "Meteor radiant geometry", vintage: "astronomy-engine-2.1.19", licenseUrl: "https://github.com/cosinekitty/astronomy/blob/master/LICENSE", modified: true });
      factors.push({ name: "Meteor radiant visibility", assessment: `${available.length}/${meteorRadiantSamples.length} samples have supported radiant geometry. Sampled altitude range ${round(Math.min(...available.map(sample => sample.altitudeDeg)))}° to ${round(Math.max(...available.map(sample => sample.altitudeDeg)))}°; Moon separation range ${round(Math.min(...available.map(sample => sample.moonSeparationDeg)))}° to ${round(Math.max(...available.map(sample => sample.moonSeparationDeg)))}°. Inspect timestamped evidence for each point; ranges do not establish continuous visibility.`, impact: "mixed", sourceNames: ["Global Meteor Network radiant fits", "Astronomy Engine"] });
      caveats.add("Radiant fits use observations from 2018-12-10 to 2021-05-22; annual reuse through 2030 is extrapolation. Point samples at 15-minute cadence plus the exact endpoint do not establish continuous visibility, full-season activity, meteor rates or exact peak times.");
      caveats.add("Moon separation compares a modeled geocentric mean radiant with a topocentric Moon direction in equatorial-of-date coordinates; parameter uncertainties are not propagated confidence intervals.");
    } else {
      factors.push({ name: "Meteor radiant visibility", assessment: "Unknown: select a reviewed shower whose coordinates or drift model covers this date. Radiant altitude and Moon separation remain unknown outside the licensed fit windows.", impact: "unknown", sourceNames: [] });
      gaps.push(code ? meteorRadiantSamples.length ? "Meteor radiant altitude and moon-to-radiant separation are not calculated where the model is outside its nominal radiant fit window." : "Meteor radiant altitude and moon-to-radiant separation are unavailable because the local model could not be evaluated." : `Meteor radiant altitude is unknown: choose one reviewed shower (${Array.from(new Set(Object.values(METEOR_ALIASES))).join(", ")}); an unknown or ambiguous event list cannot select a radiant.`);
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
      if (outlook.status !== "available") gaps.push(`Aurora outlook is ${outlook.status}: ${outlook.reason}`);
      factors.push({ name: "Aurora outlook", assessment: outlook.status === "available" ? `${outlook.summary} Grid value ${outlook.gridValue} ${outlook.gridValueUnit} at ${outlook.gridCellLatitude}°, ${outlook.gridCellLongitude}°.` : `${capitalize(outlook.status)}: ${outlook.reason}`, impact: outlook.status === "available" ? "mixed" : "unknown", sourceNames: sourceNames(aurora.sources) });
    } else {
      const failed = aurora && isError(aurora);
      factors.push({ name: "Aurora outlook", assessment: failed ? "Unavailable: the enabled aurora provider failed." : "Unsupported: no aurora provider is enabled for this plan.", impact: "unknown", sourceNames: [] });
      gaps.push(failed ? "Aurora outlook retrieval failed; retry the official updates before travel." : "Aurora outlook is unsupported: no provider is enabled.");
    }
  }

  if (locationContext && !isError(locationContext)) {
    sourceRecords.push(...locationContext.sources); addAll(caveats, locationContext.caveats);
    if (locationContext.access.status === "verified") sourceRecords.push(locationContext.access.source);
    if (locationContext.groundLightContext.status === "available") sourceRecords.push(locationContext.groundLightContext.source);
    const access = locationContext.access;
    factors.push({ name: "Site access", assessment: access.status === "verified" ? `Verified from source: ${access.description}` : `Unknown: ${access.description ?? "No independent access evidence is available."}`, impact: access.status === "verified" ? "mixed" : "unknown", sourceNames: access.status === "verified" ? [access.source.name] : [] });
  } else {
    factors.push({ name: "Site access", assessment: "Unavailable: location context retrieval failed; access and night opening remain unknown.", impact: "unknown", sourceNames: [] });
    gaps.push("Site access context retrieval failed; confirm access directly with site management.");
  }

  if (candidates && !isError(candidates)) {
    sourceRecords.push(...candidates.sources, ...candidates.candidates.flatMap(candidate => candidate.sources));
    if (candidates.availability.status !== "available") gaps.push(`Nearby candidate lookup is ${candidates.availability.status}: ${candidates.availability.reason}`);
    factors.push({ name: "Nearby observing places", assessment: candidates.availability.status === "available" ? `${candidates.candidates.length} candidate place(s) returned; access and darkness still require independent checks.` : `${capitalize(candidates.availability.status)}: ${candidates.availability.reason}`, impact: candidates.candidates.length ? "mixed" : "unknown", sourceNames: sourceNames(candidates.sources) });
  } else {
    const failed = candidates && isError(candidates);
    factors.push({ name: "Nearby observing places", assessment: failed ? "Unavailable: the enabled candidate service failed." : "Unsupported: no rights-reviewed local candidate index is enabled.", impact: "unknown", sourceNames: [] });
    gaps.push(failed ? "Nearby candidate lookup failed; no site suitability or access is inferred." : "Nearby observing candidates are unsupported: no reviewed index is enabled.");
  }

  if (climatology && !isError(climatology)) {
    sourceRecords.push(...climatology.sources);
    addAll(caveats, climatology.caveats);
    factors.push({ name: "Historical context", assessment: describeClimateContext(climatology), impact: "unknown", sourceNames: sourceNames(climatology.sources) });
    if (climatology.availability.status !== "available") gaps.push(`Historical context is ${climatology.availability.status}: ${climatology.availability.reason}`);
  } else {
    const failed = climatology && isError(climatology);
    factors.push({ name: "Historical context", assessment: failed ? "Unavailable: the enabled historical context service failed." : "Unsupported: no rights-reviewed historical sky-condition dataset is enabled.", impact: "unknown", sourceNames: [] });
    gaps.push(failed ? "Historical context retrieval failed; no seasonal tendency is inferred." : "Historical context is unsupported: no reviewed dataset is enabled.");
  }

  const learningGuide = ["learning", "astrophotography", "deep-sky-imaging", "eclipse"].includes(input.activity)
    ? getLearningGuidance({ activity: input.activity as "learning" | "astrophotography" | "deep-sky-imaging" | "eclipse", experience: input.experience, hemisphere: calculation.latitude === 0 ? "equatorial" : calculation.latitude > 0 ? "north" : "south" })
    : undefined;
  if (learningGuide) sourceRecords.push(...learningGuide.sources);

  if (conditions && !isError(conditions) && conditions.availability.status !== "available") gaps.push(`Weather evidence is ${conditions.availability.status}: ${conditions.availability.reason}`);
  if (locationContext && !isError(locationContext) && locationContext.access.status === "unknown") gaps.push("Confirm public access, opening hours, permits, and current closures directly before travel.");
  if (input.activity === "astrophotography" || input.activity === "deep-sky-imaging") gaps.push("No seeing or transparency forecast is available; cloud cover alone cannot establish imaging quality.");
  const suggestions = input.target ? [] : await suggestVisibleTargets(input.activity, observerPlace, input.window, services, astronomy && !isError(astronomy) ? astronomy : undefined);
  suggestions.forEach(target => { sourceRecords.push(...target.sources); addAll(caveats, target.caveats); });
  if (!input.target && ["general-stargazing", "visual-stargazing", "learning", "planet-observing", "moon-observing", "astrophotography"].includes(input.activity) && !suggestions.length) gaps.push("No target suggestions were returned under this activity's selection rules; this does not establish that all targets are below the horizon or visually undetectable. The local catalog covers Sun, Moon, planets and Milky Way core only.");
  if (input.activity === "deep-sky-imaging" && !input.target) gaps.push("No rights-reviewed deep-sky catalog is enabled. Supply a supported target or use a specialist sky catalog; global deep-sky suggestions are unsupported.");
  if (input.target && targetVisibility && !isError(targetVisibility) && targetVisibility.availability.status !== "available") gaps.push(`Target visibility is ${targetVisibility.availability.status}: ${targetVisibility.availability.reason}`);
  if (input.activity === "eclipse") gaps.push("A general session interval cannot establish eclipse contacts or safe viewing; use the selected event's source-linked visibility and safety guidance.");
  if (conditions && !isError(conditions) && conditions.forecasts.some(forecast => forecast.samples.some(sample => sample.values.totalCloudCover && !sample.values.totalCloudCover.periodEndUtc))) gaps.push("Cloud forecasts contain instant or sparse samples, not cloud coverage intervals; no continuous weather window is inferred.");
  if (["meteor-shower", "deep-sky-imaging", "astrophotography", "aurora"].includes(input.activity) && !(astronomy && !isError(astronomy) && astronomy.moon.horizonBasis === "geometric-center-zero-degrees" && astronomy.moon.belowHorizonIntervals !== undefined)) gaps.push("Moon illumination is whole-session context; Moon-above-horizon timing is not supplied for the entire candidate window.");
  const weather = conditions && !isError(conditions) ? conditions : undefined;
  const onlyForecast = weather?.forecasts.length === 1 ? weather.forecasts[0] : undefined;
  const cloudValues = onlyForecast && weather && usableWeatherForecast(weather, onlyForecast) ? onlyForecast.samples.flatMap(sample => sample.values.totalCloudCover?.unit === "%" ? [sample.values.totalCloudCover.value] : []) : [];
  const cloudCoverMax = cloudValues.length ? Math.max(...cloudValues) : undefined;
  const checklist = getPreparationChecklist(input.activity, { experience: input.experience, equipment: input.equipment, cloudCoverMax });
  if ((weather?.forecasts.length ?? 0) > 1) checklist[2] = "Review each source's cloud forecast and valid times before departure; sources may disagree and are not combined.";
  const sourceCloudWarnings = (weather?.forecasts ?? []).flatMap(forecast => usableWeatherForecast(weather!, forecast) && forecast.samples.some(sample => sample.values.totalCloudCover?.unit === "%" && sample.values.totalCloudCover.value >= 70) ? [`${forecast.source.name} includes substantial cloud in its samples; check the source's exact valid times before choosing a night.`] : []);
  const prep = [...checklist, ...sourceCloudWarnings, ...(learningGuide?.guidance ?? [])].slice(0, 20);
  const summary = makeSummary(input.activity, factors, conditions && !isError(conditions) ? conditions.availability.status : "unavailable", gaps);
  const target = targetVisibility && !isError(targetVisibility) ? targetVisibility : undefined;
  const candidateWindows = composeCandidateWindows(input.activity, input.window, astronomy && !isError(astronomy) ? astronomy : undefined, target ? [target] : suggestions, conditions && !isError(conditions) ? conditions : undefined, input.locale);
  if (candidateWindows.length === 8) gaps.push("The bounded display contains eight candidate windows; all target intervals remain in exact structured target evidence for additional evaluation.");
  const uniqueSources = dedupeSources(sourceRecords);
  const timedPreparation = input.experience === "beginner" || ["learning", "general-stargazing", "visual-stargazing"].includes(input.activity) ? timedSteps(candidateWindows[0]?.window.startUtc ?? input.window.startUtc, input.window, input.locale) : [];
  const result = planResultSchema.parse({
    availability: { status: gaps.length ? "partial" : "available", reason: gaps.length ? "A useful plan was assembled, with missing evidence listed explicitly." : "The requested planning evidence was assembled." },
    sources: uniqueSources.length ? uniqueSources : [place.sources[0]!], caveats: Array.from(caveats).slice(0, 20), goal: input.activity, place, requestedWindow: input.window,
    summary, candidateWindows, factors: factors.slice(0, 20).map(factor => ({ ...factor, name: factor.name.slice(0, 120), assessment: conciseAssessment(factor.assessment) })), gaps: Array.from(new Set(gaps)), preparation: prep.map(item => item.length <= 300 ? item : `${item.slice(0, 230)}… Review the full equipment list you supplied before departure.`),
    suggestions, timedPreparation, evidence: { ...(conjunctionWindows.length ? { conjunctionWindows } : {}), ...(astronomy && !isError(astronomy) ? { astronomy } : {}), ...(target ? { target } : {}), ...(conditions && !isError(conditions) ? { weather: conditions } : {}), ...(includeEventEvidence && events && !isError(events) ? { events } : {}), ...(aurora && !isError(aurora) ? { aurora } : {}), ...(climatology && !isError(climatology) ? { history: climatology } : {}), ...(locationContext && !isError(locationContext) ? { location: locationContext } : {}), ...(candidates && !isError(candidates) ? { candidates } : {}), ...(input.activity === "meteor-shower" ? { meteorRadiantSamples } : {}) },
  });
  return result;
}

function settled<T>(callback: () => Promise<T>): Promise<T | Error> { return callback().catch((error: unknown) => error instanceof Error ? error : new Error("Provider failed.")); }
function isError(value: unknown): value is Error { return value instanceof Error; }
function conciseAssessment(value: string): string { return value.length <= 500 ? value : `${value.slice(0, 410)}… Full exact values and source records are retained in structured evidence.`; }
const METEOR_ALIASES: Readonly<Record<string, string>> = { per: "PER", perseids: "PER", gem: "GEM", geminids: "GEM", ori: "ORI", orionids: "ORI", eta: "ETA", "eta aquariids": "ETA", lyr: "LYR", lyrids: "LYR", sda: "SDA", "southern delta aquariids": "SDA", "delta aquariids": "SDA", qua: "QUA", quadrantids: "QUA", leo: "LEO", leonids: "LEO", cap: "CAP", "alpha capricornids": "CAP", capricornids: "CAP", nta: "NTA", "northern taurids": "NTA", sta: "STA", "southern taurids": "STA", hyd: "HYD", "sigma hydrids": "HYD" };
function meteorCode(query: string): string | undefined {
  const key = query.trim().toLowerCase().replaceAll("-", " ").replace(/\s+(?:meteor\s+)?shower$/, "");
  return Object.hasOwn(METEOR_ALIASES, key) ? METEOR_ALIASES[key] : undefined;
}
function sourceNames(sources: SourceRecord[]): string[] { return Array.from(new Set(sources.map(({ name }) => name))).slice(0, 8); }
function addAll(target: Set<string>, values: string[]): void { values.forEach((value) => target.add(value)); }
function dedupeSources(sources: SourceRecord[]): SourceRecord[] { return Array.from(new Map(sources.map((source) => [JSON.stringify(source), source])).values()); }
function round(value: number): string { return Number.isInteger(value) ? String(value) : value.toFixed(1); }
function capitalize(value: string): string { return value.charAt(0).toUpperCase() + value.slice(1); }
function humanize(value: string): string { return value.replace(/[A-Z]/g, (letter) => ` ${letter.toLowerCase()}`).replace(/^./, (letter) => letter.toUpperCase()); }
function monthAt(window: TimeWindow, timeZone: string): number { return Number(observingNightForInstant(window.startUtc, timeZone).slice(5, 7)); }
function darknessImpact(state: AstronomyWindowResult["darknessState"]): Factor["impact"] {
  return state === "full-window" ? "favorable" : state === "partial-window" ? "mixed" : state === "none" ? "unfavorable" : "unknown";
}
function darknessAssessment(result: AstronomyWindowResult): string {
  const interval = result.astronomicalDarkness;
  const timing = interval.status === "available" ? ` ${interval.localStart} to ${interval.localEnd} local time.` : ` ${interval.reason}`;
  switch (result.darknessState) {
    case "full-window": return `Astronomical darkness throughout the requested window.${timing}`;
    case "partial-window": return `Astronomical darkness during part of the requested window.${timing}`;
    case "none": return `No astronomical darkness in the requested window.${timing}`;
    case "unknown": return `Unknown astronomical darkness coverage of the requested window.${timing}`;
  }
}
function moonInterpretation(activity: string, illumination: number): string {
  if (activity === "moon-observing") return "For lunar observing, illumination is phase context, not a moonlight rating; visibility requires target geometry.";
  if (activity === "meteor-shower") return illumination <= 25 ? "Low illumination is phase context, not measured moonlight; moonlight impact is unknown without timing and observing conditions." : illumination >= 70 ? "Bright moonlight may reduce visibility of fainter meteors." : "Moonlight may reduce visibility of some fainter meteors.";
  if (["astrophotography", "deep-sky-imaging"].includes(activity)) return illumination >= 50 ? "Moonlight can brighten the sky background, especially near the Moon." : "Low illumination does not establish low moonlight; timing, target separation and sky brightness still matter.";
  return illumination >= 70 ? "Bright moonlight can reduce contrast for faint objects." : "Moonlight is one factor; local sky brightness and target choice also matter.";
}
function moonImpact(_activity: string, _illumination: number): Factor["impact"] {
  return "unknown"; // Phase alone cannot establish observing impact; target geometry is assessed separately.
}
function weatherFactors(result: NightConditionsResult, activity: string, units: "metric" | "imperial", locale: string): Factor[] {
  const skyFields = ["totalCloudCover", "lowCloudCover", "mediumCloudCover", "highCloudCover", "precipitationProbability", "precipitationAmount"] as const;
  const otherFields = ["windSpeed", "windGust", "temperature", "dewPoint", "relativeHumidity", "visibility"] as const;
  const factors: Factor[] = [];
  for (const forecast of result.forecasts) {
    const usable = usableWeatherForecast(result, forecast);
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
      const ratedFields = ["totalCloudCover", "lowCloudCover", "precipitationProbability"] as const;
      const ratedGroups = ratedFields.map(field => forecast.samples.flatMap(sample => sample.values[field] ? [sample.values[field]!] : [])).filter(values => values.length);
      const hasCloudIntervals = usable && ratedGroups.length > 0 && ratedGroups.every(values => {
        if (values.some(value => !value.periodStartUtc || !value.periodEndUtc)) return false;
        let through = Date.parse(result.window.startUtc);
        for (const value of [...values].sort((a,b) => Date.parse(a.periodStartUtc!) - Date.parse(b.periodStartUtc!))) {
          if (Date.parse(value.periodStartUtc!) > through) return false;
          through = Math.max(through, Date.parse(value.periodEndUtc!));
        }
        return through >= Date.parse(result.window.endUtc);
      });
      const hasInstantValues = group.fields.some(field => forecast.samples.some(sample => sample.values[field] && (!sample.values[field]!.periodStartUtc || !sample.values[field]!.periodEndUtc)));
      const sampleNote = !hasCloudIntervals && group.label === "cloud and precipitation" ? (hasInstantValues ? " Instant samples present; not continuous coverage or a clear-night assessment." : " Whole-window cloud coverage is not established.") : "";
      const availabilityNote = usable ? "" : " Stale or unavailable source evidence cannot support a current weather assessment; exact values are retained.";
      const cloudNote = activity === "aurora" && group.label === "cloud and precipitation" ? " Clouds can obstruct the view independently of aurora activity." : "";
      factors.push({ name: `${forecast.source.name.slice(0, 70)} ${group.label} forecast`, assessment: `${parts.join("; ")}; ${forecast.samples.length} sample(s), ${validRange}.${sampleNote}${cloudNote}${availabilityNote}`, impact: group.label === "cloud and precipitation" && hasCloudIntervals ? aggregateImpact(impacts) : "unknown", sourceNames: [forecast.source.name] });
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
function makeSummary(activity: string, factors: Factor[], weatherStatus: string, gaps: string[]): string {
  const darkness = factors.find(({ name }) => name === "Astronomical darkness")?.assessment;
  const clouds = factors.filter(({ name }) => /cloud and precipitation forecast/.test(name));
  const lead = `${capitalize(activity.replaceAll("-", " "))} plan`;
  const cloudText = clouds.length > 1 ? clouds.map(factor => `${factor.sourceNames.join(", ")}: ${factor.assessment.split(";")[0]}`).join("; ") : clouds[0]?.assessment.replace(/[.;]+$/, "") ?? "cloud forecast unavailable";
  return `${lead}: ${darkness ? `darkness ${darkness}` : "darkness data unavailable"}; forecast evidence ${weatherStatus}; ${cloudText}. ${gaps.length ? `${gaps.length} evidence gap(s) need attention.` : "No material evidence gaps were found."}`;
}
