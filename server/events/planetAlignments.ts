import { createRequire } from "node:module";
import type * as AstronomyTypes from "astronomy-engine";
import type { SkyEvent } from "../../shared/nightsky/events";
import type { SourceRecord } from "../../shared/nightsky/common";

const Astronomy = createRequire(import.meta.url)("astronomy-engine") as typeof AstronomyTypes;
const DAY_MS = 86_400_000;
const MIN_DATE = Date.parse("1900-01-01T00:00:00Z");
const MAX_DATE = Date.parse("2101-01-01T00:00:00Z") - 1;
const OUTER = [Astronomy.Body.Mars, Astronomy.Body.Jupiter, Astronomy.Body.Saturn, Astronomy.Body.Uranus, Astronomy.Body.Neptune];
const INNER = [Astronomy.Body.Mercury, Astronomy.Body.Venus];

export function planetWindowCovered(start: number, end: number): boolean {
  return Number.isFinite(start) && Number.isFinite(end) && start >= MIN_DATE && end <= MAX_DATE && end > start && end-start <= 366*DAY_MS;
}

export function findPlanetAlignments(start: number, end: number, oppositions: boolean, conjunctions: boolean, source: SourceRecord): SkyEvent[] {
  if (!planetWindowCovered(start, end)) return [];
  const events: SkyEvent[] = [];
  const streams: { body: AstronomyTypes.Body; target: number; kind: string; type: SkyEvent["eventType"] }[] = [];
  if (oppositions) for (const body of OUTER) streams.push({body, target: 0, kind: "Opposition", type: "opposition"});
  if (conjunctions) {
    for (const body of [...INNER, ...OUTER]) streams.push({body, target: 180, kind: "Superior Solar Conjunction", type: "planetary-conjunction"});
    for (const body of INNER) streams.push({body, target: 0, kind: "Inferior Solar Conjunction", type: "planetary-conjunction"});
  }
  // A canonical year anchor makes returned instants/IDs independent of query
  // start and permits exact inclusive boundaries on a previous result's time.
  const firstYear = new Date(start).getUTCFullYear();
  const lastYear = new Date(end).getUTCFullYear();
  for (const stream of streams) {
    for (let year = firstYear; year <= lastYear; year++) {
      const yearStart = Date.UTC(year, 0, 1);
      const yearEnd = Math.min(end, Date.UTC(year+1, 0, 1)-1);
      let cursor = yearStart-DAY_MS;
      let exhausted = true;
      for (let iteration = 0; iteration < 8; iteration++) {
        const time = Astronomy.SearchRelativeLongitude(stream.body, stream.target, new Date(cursor));
        const instant = time.date.getTime();
        if (!Number.isFinite(instant) || instant < cursor) throw new Error("Planet alignment search failed to advance.");
        if (instant > yearEnd) { exhausted = false; break; }
        if (instant >= Math.max(start, yearStart)) events.push({
          eventId: `planet-alignment:${stream.body.toLowerCase()}:${stream.kind.toLowerCase().replaceAll(" ", "-")}:${time.toString()}`,
          name: `${stream.body} ${stream.kind} (heliocentric longitude)`, eventType: stream.type,
          peakUtc: time.toString(), localVisibility: "not-evaluated", source,
          description: `${stream.body}: ${stream.kind}, defined by ${stream.target}° relative heliocentric ecliptic longitude between this planet and Earth; latitude above the ecliptic is ignored. This is a Sun/Earth/planet alignment time, not an apparent planet-pair conjunction, minimum sky separation or closest-distance instant. Local horizon, darkness and detectability are not evaluated.${stream.type === "planetary-conjunction" ? " Solar alignment is not a viewing recommendation; never look at the Sun through unfiltered optics." : ""}`,
        });
        cursor = instant + DAY_MS;
      }
      if (exhausted) throw new Error("Planet alignment search exceeded its bounded iteration budget.");
    }
  }
  return events;
}
