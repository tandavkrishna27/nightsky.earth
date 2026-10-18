import { calculationCoordinates, type CalculationObserverPlace } from "../places/calculationPlace";
import type { CalculationPlace } from "../../shared/nightsky/discovery";
import { createRequire } from "node:module";
import type * as AstronomyTypes from "astronomy-engine";
import { astronomyWindowResultSchema, targetVisibilityResultSchema, type AstronomyWindowResult, type TargetVisibilityResult } from "../../shared/nightsky/astronomy";
import { timeWindowSchema, type TimeWindow, type SourceRecord } from "../../shared/nightsky/common";
import { type GeoNamesPlaceIndex } from "../places/geonames";
import { formatLocalTime } from "./time";
import { formatLocalInstant } from "../../shared/nightsky/format";

const Astronomy = createRequire(import.meta.url)("astronomy-engine") as typeof AstronomyTypes;

const LIBRARY_VERSION = "2.1.19";
const CALCULATION_SOURCE: SourceRecord = {
  name: "Astronomy Engine", url: "https://github.com/cosinekitty/astronomy",
  attribution: "Astronomy Engine by Don Cross, MIT License. Calculations by NightSky.earth.",
  dataClass: "calculation", product: "Astronomy Engine", vintage: `astronomy-engine-${LIBRARY_VERSION}`,
  licenseUrl: "https://github.com/cosinekitty/astronomy/blob/master/LICENSE", modified: true,
};
const BODY_NAMES: Record<string, { body: string; type: "sun" | "moon" | "planet" }> = {
  sun: { body: "Sun", type: "sun" }, moon: { body: "Moon", type: "moon" },
  mercury: { body: "Mercury", type: "planet" }, venus: { body: "Venus", type: "planet" },
  mars: { body: "Mars", type: "planet" }, jupiter: { body: "Jupiter", type: "planet" },
  saturn: { body: "Saturn", type: "planet" }, uranus: { body: "Uranus", type: "planet" },
  neptune: { body: "Neptune", type: "planet" }, pluto: { body: "Pluto", type: "planet" },
};
const MILKY_WAY_CORE = { ra: 17 + 45 / 60 + 40 / 3600, dec: -29.0078 };

export async function getAstronomyWindow(place: CalculationObserverPlace, window: TimeWindow, index: GeoNamesPlaceIndex | undefined, calculationPlace?: CalculationPlace): Promise<AstronomyWindowResult> {
  const checkedWindow = timeWindowSchema.parse(window);
  if (checkedWindow.timeZone !== place.timeZone) throw new RangeError("The requested time zone does not match the resolved named place. Resolve the place again and use its returned time zone.");
  const coordinates = calculationCoordinates(place, index, calculationPlace);
  const observer = new Astronomy.Observer(coordinates.latitude, coordinates.longitude, 0);
  const start = Date.parse(checkedWindow.startUtc);
  const end = Date.parse(checkedWindow.endUtc);
  const solarThresholdIntervals: AstronomyWindowResult["solarThresholdIntervals"] = [];
  const darknessIntervals: Array<{ start: number; end: number }> = [];
  let maximumMoon = { altitude: -90, at: start };
  const phaseAt = new Date((start + end) / 2);
  const moonPhase = Astronomy.MoonPhase(phaseAt);
  const moonIllumination = Astronomy.Illumination(Astronomy.Body.Moon, phaseAt).phase_fraction * 100;
  const twilights = [{ kind: "civil" as const, altitude: -6 as const }, { kind: "nautical" as const, altitude: -12 as const }, { kind: "astronomical" as const, altitude: -18 as const }];
  for (const twilight of twilights) {
    for (const interval of belowAltitudeIntervals(Astronomy.Body.Sun, observer, start, end, twilight.altitude)) {
      solarThresholdIntervals.push({ kind: twilight.kind, sunAltitudeThresholdDegrees: twilight.altitude, ...makeInterval(interval.start, interval.end, checkedWindow.timeZone) });
      if (twilight.kind === "astronomical") darknessIntervals.push(interval);
    }
  }
  const moonStep = Math.max(15 * 60_000, Math.ceil((end - start) / 288));
  for (const instant of sampleInstants(start, end, moonStep)) {
      const date = new Date(instant);
      const hor = horizon(Astronomy.Body.Moon, observer, date);
      if (hor.altitude > maximumMoon.altitude) maximumMoon = { altitude: hor.altitude, at: date.getTime() };
  }
  const clippedDarkness = darknessIntervals.map(({ start: a, end: b }) => ({ start: Math.max(a, start), end: Math.min(b, end) })).filter((i) => i.end > i.start);
  const darknessState = clippedDarkness.length === 0 ? "none"
    : clippedDarkness.length === 1 && clippedDarkness[0]!.start <= start && clippedDarkness[0]!.end >= end ? "full-window" : "partial-window";
  const selectedDarkness = clippedDarkness[0];
  const result = astronomyWindowResultSchema.parse({
    availability: { status: "available", reason: "Calculated from the selected place point and display IANA time zone." },
    sources: [CALCULATION_SOURCE],
    caveats: [...displayTimeZoneCaveats(coordinates), "Solar threshold intervals are nested Sun-below-threshold intervals at -6, -12 and -18 degrees, clipped to the requested window; they are not exclusive twilight phase bands. Astronomical darkness uses the Sun's geometric center at -18 degrees. Terrain and local horizon obstructions are not modeled.", "Moon maximum altitude is sampled at intervals, so it is an estimate; it does not establish moonrise or moonset."],
    sourceRevision:coordinates.sourceRevision,placeId: place.placeId, window: checkedWindow, darknessState,
    astronomicalDarkness: selectedDarkness ? { status: "available", ...makeInterval(selectedDarkness.start, selectedDarkness.end, checkedWindow.timeZone) } : { status: "unavailable", reason: "The Sun does not reach 18 degrees below the geometric horizon during this window." },
    solarThresholdIntervals,
    sunBelowGeometricHorizonIntervals: belowAltitudeIntervals(Astronomy.Body.Sun, observer, start, end, 0).map(row => ({...makeInterval(row.start,row.end,checkedWindow.timeZone), localStart:formatLocalInstant(new Date(row.start).toISOString(),checkedWindow.timeZone,"en"),localEnd:formatLocalInstant(new Date(row.end).toISOString(),checkedWindow.timeZone,"en")})),
    moon: { phaseAtUtc: phaseAt.toISOString(), phaseDegrees: normalizeDegrees(moonPhase), illuminationPercent: clamp(moonIllumination, 0, 100), maximumAltitudeDegrees: clamp(maximumMoon.altitude, -90, 90), maximumAltitudeAtUtc: new Date(maximumMoon.at).toISOString(), horizonBasis: "geometric-center-zero-degrees", belowHorizonIntervals: belowAltitudeIntervals(Astronomy.Body.Moon, observer, start, end, 0).map(row => ({...makeInterval(row.start, row.end, checkedWindow.timeZone), localStart: formatLocalInstant(new Date(row.start).toISOString(), checkedWindow.timeZone, "en"), localEnd: formatLocalInstant(new Date(row.end).toISOString(), checkedWindow.timeZone, "en")})) },
  });
  return result;
}

export async function getTargetVisibility(targetQuery: string, place: CalculationObserverPlace, window: TimeWindow, index: GeoNamesPlaceIndex | undefined, calculationPlace?: CalculationPlace): Promise<TargetVisibilityResult> {
  const checkedWindow = timeWindowSchema.parse(window);
  if (checkedWindow.timeZone !== place.timeZone) throw new RangeError("The requested time zone does not match the resolved named place. Resolve the place again and use its returned time zone.");
  const coordinates = calculationCoordinates(place, index, calculationPlace);
  const query = targetQuery.trim().toLocaleLowerCase().replace(/\s+/g, " ");
  const match = BODY_NAMES[query];
  const milkyWay = ["milky way", "milky way core", "galactic centre", "galactic center", "sagittarius a*"].includes(query);
  if (!match && !milkyWay) {
    return targetVisibilityResultSchema.parse({
      availability: { status: "unsupported", reason: "This V1 target catalog supports the Sun, Moon, named planets, and the Milky Way core. Resolve other targets in a specialist sky app." },
      sources: [CALCULATION_SOURCE], caveats: displayTimeZoneCaveats(coordinates), sourceRevision:coordinates.sourceRevision,placeId: place.placeId,
      target: { targetId: `unsupported:${query.slice(0, 80)}`, name: targetQuery.slice(0, 160), targetType: "deep-sky-object" }, intervals: [],
    });
  }
  const observer = new Astronomy.Observer(coordinates.latitude, coordinates.longitude, 0);
  const start = Date.parse(checkedWindow.startUtc); const end = Date.parse(checkedWindow.endUtc);
  const stepMs = 10 * 60_000;
  const groups: Array<{ start: number; end: number; maxAltitude: number; azimuth: number; maximumAt: number }> = [];
  let group: typeof groups[number] | undefined;
  let previousUp = false;
  let previousTime = start;
  const positionAt = (time: number) => milkyWay ? milkyWayCoreHorizon(observer, new Date(time)) : horizon(match!.body as AstronomyTypes.Body, observer, new Date(time));
  for (const time of sampleInstants(start, end, stepMs)) {
    const position = positionAt(time);
    const up = position.altitude > 0;
    if (up && !previousUp) group = { start: time === start ? start : horizonCrossing(previousTime, time, (instant) => positionAt(instant).altitude, true), end: time, maxAltitude: position.altitude, azimuth: position.azimuth, maximumAt: time };
    if (up && group) {
      group.end = Math.min(time, end);
      if (position.altitude > group.maxAltitude) { group.maxAltitude = position.altitude; group.azimuth = position.azimuth; group.maximumAt = time; }
    }
    if (!up && previousUp && group) { group.end = horizonCrossing(previousTime, time, (instant) => positionAt(instant).altitude, false); if (group.end > group.start) groups.push(group); group = undefined; }
    previousUp = up;
    previousTime = time;
  }
  if (group && group.end > group.start) groups.push(group);
  const targetType = milkyWay ? "deep-sky-object" : match!.type;
  return targetVisibilityResultSchema.parse({
    availability: { status: "available", reason: "Geometric altitude calculated for the selected place and UTC window." },
    sources: [CALCULATION_SOURCE], caveats: [...displayTimeZoneCaveats(coordinates), "Visibility intervals use a 0-degree geometric horizon; terrain, buildings, atmospheric extinction, and instrument limits are not modeled.", ...(milkyWay ? ["Milky Way core is represented by a fixed J2000 direction near Sagittarius; this is a seasonal direction estimate, not a star-field model."] : [])],
    sourceRevision:coordinates.sourceRevision,placeId: place.placeId,
    target: { targetId: milkyWay ? "milky-way-core" : `body:${match!.body.toLowerCase()}`, name: milkyWay ? "Milky Way core" : match!.body, targetType },
    orientationSamples: Array.from(new Set([start, Math.floor((start + end) / 2), end - 1])).sort((a,b)=>a-b).map(instant => {
      const position = positionAt(instant);
      const atUtc = new Date(instant).toISOString();
      return { atUtc, localTime: formatLocalInstant(atUtc, checkedWindow.timeZone, "en"), altitudeDegrees: clamp(position.altitude, -90, 90), azimuthDegrees: normalizeDegrees(position.azimuth), horizonBasis: "geometric-center" as const, refraction: "none" as const, azimuthReference: "true-north-clockwise" as const };
    }),
    intervals: groups.map((row) => ({ ...makeInterval(row.start, row.end, checkedWindow.timeZone), startBoundary: row.start === start ? "requested-window" : "horizon-crossing", endBoundary: row.end === end ? "requested-window" : "horizon-crossing", maximumAltitudeDegrees: clamp(row.maxAltitude, -90, 90), azimuthDegrees: normalizeDegrees(row.azimuth), azimuthBasis: "maximum-altitude-sample", maximumAltitudeAtUtc: new Date(row.maximumAt).toISOString(), maximumAltitudeLocal: formatLocalInstant(new Date(row.maximumAt).toISOString(), checkedWindow.timeZone, "en") })),
  });
}

function belowAltitudeIntervals(body: AstronomyTypes.Body, observer: AstronomyTypes.Observer, start: number, end: number, altitude: number): Array<{ start: number; end: number }> {
  const crossings = [start];
  let priorTime = start; let priorAltitude = horizon(body, observer, new Date(priorTime)).altitude - altitude;
  for (const current of sampleInstants(start, end, 5 * 60_000)) {
    if (current === start) continue;
    const value = horizon(body, observer, new Date(current)).altitude - altitude;
    if ((priorAltitude < 0 && value >= 0) || (priorAltitude >= 0 && value < 0)) {
      let lo = priorTime; let hi = current; const rising = value > priorAltitude;
      for (let i = 0; i < 24; i += 1) { const mid = (lo + hi) / 2; const midAltitude = horizon(body, observer, new Date(mid)).altitude - altitude; if ((midAltitude >= 0) === rising) hi = mid; else lo = mid; }
      crossings.push((lo + hi) / 2);
    }
    priorTime = current; priorAltitude = value;
  }
  crossings.push(end);
  const intervals: Array<{ start: number; end: number }> = [];
  for (let i = 0; i < crossings.length - 1; i += 1) {
    const a = crossings[i]!; const b = crossings[i + 1]!;
    if (horizon(body, observer, new Date((a + b) / 2)).altitude < altitude) intervals.push({ start: a, end: b });
  }
  return intervals;
}
// Always inspect the requested endpoint, including a final partial sampling step.
function sampleInstants(start: number, end: number, step: number): number[] {
  const times: number[] = [];
  for (let time = start; time < end; time += step) times.push(time);
  times.push(end);
  return times;
}
function horizonCrossing(start: number, end: number, altitudeAt: (time: number) => number, rising: boolean): number {
  let lo = start; let hi = end;
  for (let i = 0; i < 24; i += 1) {
    const mid = (lo + hi) / 2;
    if ((altitudeAt(mid) >= 0) === rising) hi = mid; else lo = mid;
  }
  return (lo + hi) / 2;
}
function horizon(body: AstronomyTypes.Body, observer: AstronomyTypes.Observer, date: Date) { const coord = Astronomy.Equator(body, date, observer, true, true); return Astronomy.Horizon(date, observer, coord.ra, coord.dec); }
function milkyWayCoreHorizon(observer: AstronomyTypes.Observer, date: Date) {
  Astronomy.DefineStar(Astronomy.Body.Star8, MILKY_WAY_CORE.ra, MILKY_WAY_CORE.dec, 26_000);
  return horizon(Astronomy.Body.Star8, observer, date);
}
function makeInterval(start: number, end: number, timeZone: string) { const startUtc = new Date(start).toISOString(); const endUtc = new Date(end).toISOString(); return { startUtc, endUtc, localStart: `${formatLocalTime(startUtc, timeZone, "en")}, ${new Intl.DateTimeFormat("en", { timeZone, year: "numeric", month: "short", day: "numeric" }).format(new Date(startUtc))}`, localEnd: `${formatLocalTime(endUtc, timeZone, "en")}, ${new Intl.DateTimeFormat("en", { timeZone, year: "numeric", month: "short", day: "numeric" }).format(new Date(endUtc))}` }; }
function normalizeDegrees(value: number): number { return ((value % 360) + 360) % 360; }
function clamp(value: number, min: number, max: number): number { return Math.max(min, Math.min(max, value)); }

function displayTimeZoneCaveats(place: CalculationPlace): string[] { return place.timeZoneBasis === "explicit-display" ? [`Times use the explicit display time zone ${place.displayTimeZone}; the actual site time zone is unverified.`] : []; }
