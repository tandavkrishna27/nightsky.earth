
import { createRequire } from "node:module";
import type * as AstronomyTypes from "astronomy-engine";
import { findReviewedMeteorPeaks, REVIEWED_METEOR_PEAK_SOURCES } from "./meteorPeaks";
import { skyEventsResultSchema, searchSkyEventsInputSchema, type SkyEvent } from "../../shared/nightsky/events";
import { type SourceRecord } from "../../shared/nightsky/common";
import { resolvedCoordinatesForPlace, type GeoNamesPlaceIndex } from "../places/geonames";

const Astronomy = createRequire(import.meta.url)("astronomy-engine") as typeof AstronomyTypes;
const LIBRARY_VERSION = "2.1.19";
const CALC_SOURCE: SourceRecord = {
  name: "Astronomy Engine", url: "https://github.com/cosinekitty/astronomy",
  attribution: "Astronomy Engine by Don Cross, MIT License. Calculations by NightSky.earth.",
  dataClass: "calculation", product: "Astronomy Engine", vintage: `astronomy-engine-${LIBRARY_VERSION}`,
  licenseUrl: "https://github.com/cosinekitty/astronomy/blob/master/LICENSE", modified: true,
};
const SUPPORTED_TYPES = ["meteor-shower", "eclipse", "equinox-solstice", "moon-phase"] as const;
const ALL_EVENT_TYPES = ["meteor-shower", "eclipse", "occultation", "planetary-conjunction", "opposition", "equinox-solstice", "moon-phase", "comet", "other"] as const;
const UNSUPPORTED_REASONS: Record<string, string> = {
  occultation: "No maintained occultation catalog is included in V1.",
  "planetary-conjunction": "No conjunction catalog or angular-separation calculation is included in this V1 event tool.",
  opposition: "No opposition event catalog is included in this V1 event tool.",
  comet: "Transient comet data needs a maintained, rights-reviewed catalog or live feed; none is enabled in V1.",
  other: "This event class has no maintained V1 source or calculation.",
};

export async function searchSkyEvents(inputValue: unknown, index: GeoNamesPlaceIndex) {
  const input = searchSkyEventsInputSchema.parse(inputValue);
  const placeId = input.placeId;
  const cityId = Number(placeId.slice("place:v1:geonames:".length));
  const city = index.getById(cityId);
  const coordinates = resolvedCoordinatesForPlace(index, placeId);
  if (!city || !coordinates) throw new RangeError("The selected place is unavailable in the current GeoNames index. Resolve it again.");
  if (input.window.timeZone !== city.timeZone) throw new RangeError("The requested time zone does not match the resolved named place. Resolve the place again and use its returned time zone.");

  const start = Date.parse(input.window.startUtc);
  const end = Date.parse(input.window.endUtc);
  const requestedTypes = input.eventTypes ?? [...SUPPORTED_TYPES, ...ALL_EVENT_TYPES.filter((type) => !SUPPORTED_TYPES.includes(type as typeof SUPPORTED_TYPES[number]))];
  const unsupportedEventTypes = ALL_EVENT_TYPES.filter((type) => requestedTypes.includes(type) && !SUPPORTED_TYPES.includes(type as typeof SUPPORTED_TYPES[number]));
  const events: SkyEvent[] = [];
  const observer = new Astronomy.Observer(coordinates.latitude, coordinates.longitude, 0);

  if (requestedTypes.includes("moon-phase")) events.push(...findMoonPhases(start, end, observer, input.window.timeZone, placeId));
  if (requestedTypes.includes("equinox-solstice")) events.push(...findSeasons(start, end, placeId));
  if (requestedTypes.includes("eclipse")) events.push(...findEclipses(start, end, observer, input.window.timeZone, placeId));
  if (requestedTypes.includes("meteor-shower")) events.push(...findMeteorShowers(start, end, input.window.timeZone, placeId));

  events.sort((a, b) => eventSortTime(a) - eventSortTime(b) || a.eventId.localeCompare(b.eventId));
  const limited = events.slice(0, input.limit);
  const truncated = events.length > input.limit;
  const caveats = [
    "Event calculations use Astronomy Engine 2.1.19 and its built-in ephemeris/time model; displayed times are local to the resolved GeoNames city.",
    "Visibility uses modeled solar contact altitudes with standard atmospheric refraction for solar eclipses and geometric body altitude for lunar events; terrain, clouds, twilight brightness and naked-eye detectability are not established.",
  ];
  if (requestedTypes.includes("meteor-shower")) caveats.push("Meteor results include only 13 NASA MEO forecast maxima per year for 2025 and 2026. No activity-season widths or annual recurrence are established; Lyrids, Orionids and Leonids have no peak in this forecast. Empty results do not establish no shower activity. Forecast times can change, and peak timing alone does not establish local radiant visibility or personal meteor rates.");
  if (unsupportedEventTypes.length) caveats.push(`V1 does not include maintained event data or calculations for: ${unsupportedEventTypes.map((type) => `${type} (${UNSUPPORTED_REASONS[type]})`).join(" ")}`);
  if (truncated) caveats.push(`The result was limited to the first ${input.limit} events. Narrow the requested time window for a complete list.`);
  const status = requestedTypes.every((type) => unsupportedEventTypes.includes(type)) ? "unsupported" : (unsupportedEventTypes.length || truncated || requestedTypes.includes("meteor-shower") ? "partial" : "available");
  const sources = [CALC_SOURCE, ...(requestedTypes.includes("meteor-shower") ? REVIEWED_METEOR_PEAK_SOURCES : [])];
  return skyEventsResultSchema.parse({
    availability: { status, reason: status === "unsupported" ? "Only unsupported event classes were requested." : truncated ? "Supported event results were returned, but the requested result limit truncated the list." : unsupportedEventTypes.length ? "Supported events are shown; unsupported event classes are listed explicitly." : requestedTypes.includes("meteor-shower") ? "Meteor coverage contains year-specific 2025–2026 forecast maxima only; complete activity seasons and other years are unavailable." : "Supported events were calculated or loaded from the versioned catalog." },
    sources, caveats, placeId, window: input.window, events: limited, unsupportedEventTypes,
  });
}

function findMoonPhases(start: number, end: number, observer: AstronomyTypes.Observer, timeZone: string, placeId: string): SkyEvent[] {
  const result: SkyEvent[] = [];
  let quarter = Astronomy.SearchMoonQuarter(new Date(start - 1));
  while (quarter.time.date.getTime() <= end) {
    const peak = quarter.time.date.getTime();
    if (peak >= start) {
      const names = ["New Moon", "First Quarter", "Full Moon", "Third Quarter"];
      const altitude = bodyAltitude(Astronomy.Body.Moon, observer, quarter.time.date);
      result.push({ eventId: `moon-phase:${quarter.time.toString()}`, name: names[quarter.quarter] ?? "Moon phase", eventType: "moon-phase", peakUtc: quarter.time.toString(), localVisibility: altitude >= 0 ? "visible" : "not-visible", description: `Moon phase event. The Moon's geometric center is ${altitude.toFixed(1)}° ${altitude >= 0 ? "above" : "below"} the geometric horizon at the phase instant.`, source: CALC_SOURCE });
    }
    quarter = Astronomy.NextMoonQuarter(quarter);
  }
  return result;
}

function findSeasons(start: number, end: number, placeId: string): SkyEvent[] {
  const result: SkyEvent[] = [];
  const firstYear = new Date(start).getUTCFullYear() - 1;
  const lastYear = new Date(end).getUTCFullYear() + 1;
  for (let year = firstYear; year <= lastYear; year += 1) {
    const seasons = Astronomy.Seasons(year);
    const entries = [
      ["March equinox", seasons.mar_equinox], ["June solstice", seasons.jun_solstice],
      ["September equinox", seasons.sep_equinox], ["December solstice", seasons.dec_solstice],
    ] as const;
    for (const [name, time] of entries) {
      const instant = time.date.getTime();
      if (instant >= start && instant <= end) result.push({ eventId: `season:${name.toLowerCase().replaceAll(" ", "-")}:${time.toString()}`, name, eventType: "equinox-solstice", peakUtc: time.toString(), localVisibility: "not-evaluated", description: "Calculated seasonal event; this is a time marker, not a claim that an object is visible in the night sky.", source: CALC_SOURCE });
    }
  }
  return result;
}

function findEclipses(start: number, end: number, observer: AstronomyTypes.Observer, timeZone: string, placeId: string): SkyEvent[] {
  const events: SkyEvent[] = [];
  let lunar = Astronomy.SearchLunarEclipse(new Date(start - 2 * DAY_MS));
  let guard = 0;
  while (lunar.peak.date.getTime() - lunar.sd_penum * 60_000 <= end && guard++ < 100) {
    const peak = lunar.peak.date.getTime();
    const eventStart = peak - lunar.sd_penum * 60_000;
    const eventEnd = peak + lunar.sd_penum * 60_000;
    if (eventEnd >= start && eventStart <= end) {
      const visibility = intervalVisibility(Astronomy.Body.Moon, observer, eventStart, eventEnd);
      events.push({ eventId: `lunar-eclipse:${lunar.peak.toString()}`, name: `${capitalize(lunar.kind)} Lunar Eclipse`, eventType: "eclipse", startUtc: new Date(eventStart).toISOString(), peakUtc: lunar.peak.toString(), endUtc: new Date(eventEnd).toISOString(), localVisibility: visibility.status, description: `${capitalize(lunar.kind)} lunar eclipse; modeled umbral obscuration ${(lunar.obscuration * 100).toFixed(0)}%. ${visibility.description}`, source: CALC_SOURCE });
    }
    lunar = Astronomy.NextLunarEclipse(lunar.peak);
  }
  let solar = Astronomy.SearchLocalSolarEclipse(new Date(start - DAY_MS), observer);
  guard = 0;
  while (solar.partial_begin.time.date.getTime() <= end && guard++ < 100) {
    const eventStart = solar.partial_begin.time.date.getTime();
    const peak = solar.peak.time.date.getTime();
    const eventEnd = solar.partial_end.time.date.getTime();
    if (eventEnd >= start && eventStart <= end) {
      const altitudes = [solar.partial_begin.altitude, solar.peak.altitude, solar.partial_end.altitude];
      const visibility = contactVisibility(altitudes);
      events.push({ eventId: `solar-eclipse:${solar.peak.time.toString()}:${placeId}`, name: `${capitalize(solar.kind)} Solar Eclipse`, eventType: "eclipse", startUtc: solar.partial_begin.time.toString(), peakUtc: solar.peak.time.toString(), endUtc: solar.partial_end.time.toString(), localVisibility: visibility, description: `${capitalize(solar.kind)} solar eclipse at this location; modeled obscuration ${(solar.obscuration * 100).toFixed(1)}%. Peak Sun altitude ${solar.peak.altitude.toFixed(1)}°; ${solar.peak.altitude < 0 ? "below the horizon at maximum" : "above the horizon at maximum"}.`, source: CALC_SOURCE });
    }
    solar = Astronomy.NextLocalSolarEclipse(solar.peak.time, observer);
  }
  return events;
}

function findMeteorShowers(start: number, end: number, timeZone: string, placeId: string): SkyEvent[] {
  return findReviewedMeteorPeaks(start, end).map(row => ({
    eventId: `meteor:${row.id}:${row.peakUtc.slice(0, 4)}`, name: row.name, eventType: "meteor-shower", peakUtc: row.peakUtc,
    localVisibility: "not-evaluated", source: row.source,
    description: `Year-specific NASA MEO forecast maximum for ${row.peakUtc.slice(0, 4)}; no activity-season interval is inferred. Forecast timing alone does not establish local visibility, a personal meteor count, or radiant model coverage.`,
  }));
}
function intervalVisibility(body: AstronomyTypes.Body, observer: AstronomyTypes.Observer, start: number, end: number): { status: SkyEvent["localVisibility"]; description: string } {
  let above = false; let below = false;
  for (let time = start; ; time = Math.min(time + 10 * 60_000, end)) {
    if (bodyAltitude(body, observer, new Date(time)) >= 0) above = true; else below = true;
    if (time === end) break;
  }
  if (!above) return { status: "not-visible", description: "The Moon remains below the geometric horizon for the modeled event window." };
  if (below) return { status: "partially-visible", description: "Only part of the modeled event window is above the geometric horizon." };
  return { status: "visible", description: "The Moon remains above the geometric horizon for the modeled event window." };
}

function contactVisibility(altitudes: number[]): SkyEvent["localVisibility"] {
  const above = altitudes.some((altitude) => altitude >= 0);
  const below = altitudes.some((altitude) => altitude < 0);
  return !above ? "not-visible" : below ? "partially-visible" : "visible";
}

function bodyAltitude(body: AstronomyTypes.Body, observer: AstronomyTypes.Observer, date: Date): number {
  const coordinates = Astronomy.Equator(body, date, observer, true, true);
  return Astronomy.Horizon(date, observer, coordinates.ra, coordinates.dec).altitude;
}

function eventSortTime(event: SkyEvent): number {
  if (event.peakUtc) return Date.parse(event.peakUtc);
  if (event.peakCalendarDateWindow) return Date.parse(`${event.peakCalendarDateWindow.startDate}T00:00:00Z`);
  if (event.activityCalendarDateWindow) return Date.parse(`${event.activityCalendarDateWindow.startDate}T00:00:00Z`);
  return Number.MAX_SAFE_INTEGER;
}

function capitalize(value: string): string { return value.charAt(0).toUpperCase() + value.slice(1); }
const DAY_MS = 86_400_000;
