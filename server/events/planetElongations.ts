import { createRequire } from "node:module";
import type * as AstronomyTypes from "astronomy-engine";
import type { SkyEvent } from "../../shared/nightsky/events";
import type { SourceRecord } from "../../shared/nightsky/common";
import { planetWindowCovered } from "./planetAlignments";

const Astronomy = createRequire(import.meta.url)("astronomy-engine") as typeof AstronomyTypes;
const DAY_MS = 86_400_000;

/** Geocentric 3D Sun separation maxima, independently of heliocentric alignments. */
export function findPlanetElongations(start: number, end: number, source: SourceRecord): SkyEvent[] {
  if (!planetWindowCovered(start, end)) return [];
  const events: SkyEvent[] = [];
  for (const body of [Astronomy.Body.Mercury, Astronomy.Body.Venus] as const) {
    for (let year = new Date(start).getUTCFullYear(); year <= new Date(end).getUTCFullYear(); year++) {
      const yearStart = Date.UTC(year, 0, 1);
      const yearEnd = Math.min(end, Date.UTC(year+1, 0, 1)-1);
      // Canonical anchors and identical iteration paths keep time/identity stable
      // when a query starts on a previously returned event or overlaps a year.
      let cursor = yearStart-DAY_MS;
      let reachedSentinel = false;
      for (let iteration = 0; iteration < 10; iteration++) {
        const result = Astronomy.SearchMaxElongation(body, new Date(cursor));
        const instant = result.time.date.getTime();
        if (!Number.isFinite(instant) || instant <= cursor) throw new Error("Planet elongation search failed to advance.");
        if (instant > yearEnd) { reachedSentinel = true; break; }
        if (result.visibility !== "morning" && result.visibility !== "evening") throw new Error("Planet elongation returned invalid viewing geometry.");
        if (!Number.isFinite(result.elongation) || result.elongation < 0 || result.elongation > 180) throw new Error("Planet elongation returned an invalid angle.");
        if (instant >= Math.max(start, yearStart)) events.push({
          eventId: `planet-elongation:${body.toLowerCase()}:${result.time.toString()}`,
          name: `${body} Greatest Elongation (${result.visibility} geometry)`,
          eventType: "greatest-elongation", peakUtc: result.time.toString(), localVisibility: "not-evaluated", source,
          greatestElongation: { body, elongationDeg: result.elongation, viewingGeometry: result.visibility },
          description: `${body}: greatest geocentric 3D angular separation from the Sun, using Astronomy Engine 2.1.19 light-time correction and aberration. ${result.visibility === "morning" ? "Morning" : "Evening"} describes global Sun-relative geometry; local horizon, darkness and detectability are not evaluated. This is not an ecliptic-longitude separation or a planet-pair conjunction. Never look at the Sun through unfiltered optics.`,
        });
        // Native Mercury/Venus extrema are separated by weeks. Move beyond this
        // extremum's numerical search tolerance before requesting the next one.
        cursor = instant+DAY_MS;
      }
      if (!reachedSentinel) throw new Error("Planet elongation search exceeded its bounded iteration budget.");
    }
  }
  return events;
}
