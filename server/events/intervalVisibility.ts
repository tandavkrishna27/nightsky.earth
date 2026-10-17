import { createRequire } from "node:module";
import type * as AstronomyTypes from "astronomy-engine";
import { conjunctionWindowSchema, type ConjunctionWindow, PLANET_PAIR_BODIES } from "../../shared/nightsky/events";
import type { SkyEvent } from "../../shared/nightsky/events";

/** Certifies signs conditional on a supplied Lipschitz slope envelope (degrees/ms). */
export function boundedAltitudeVisibility(start: number, end: number, altitude: (time: number) => number, maxSlope: number, minimumStep: number, budget: number): SkyEvent["localVisibility"] {
  if (!Number.isFinite(start) || !Number.isFinite(end) || end < start || !Number.isFinite(end - start) || !Number.isFinite(maxSlope) || !(maxSlope > 0) || !Number.isFinite(minimumStep) || !(minimumStep > 0) || !Number.isSafeInteger(budget) || budget < 2 || budget > 4096) return "not-evaluated";
  let calls = 0, above = false, below = false, unresolved = false;
  const evaluate = (time: number) => {
    calls++;
    const value = altitude(time);
    if (!Number.isFinite(value)) { unresolved = true; return value; }
    if (value > 0) above = true;
    if (value < 0) below = true;
    if (value === 0) unresolved = true;
    return value;
  };
  const first = evaluate(start), last = evaluate(end);
  const pending = [{ start, end, first, last }];
  while (pending.length && !(above && below)) {
    const segment = pending.pop()!;
    const span = segment.end - segment.start;
    if (!Number.isFinite(segment.first) || !Number.isFinite(segment.last)) { unresolved = true; continue; }
    // If an interior zero existed, travelling there from BOTH endpoints would
    // require at least (|first|+|last|)/maxSlope time. Strict inequality excludes it.
    if (segment.first * segment.last > 0 && Math.abs(segment.first) + Math.abs(segment.last) > maxSlope * span) continue;
    if (span <= minimumStep || calls >= budget) { unresolved = true; continue; }
    const middle = segment.start + span / 2;
    if (middle === segment.start || middle === segment.end) { unresolved = true; continue; }
    const value = evaluate(middle);
    pending.push({ start: middle, end: segment.end, first: value, last: segment.last }, { start: segment.start, end: middle, first: segment.first, last: value });
  }
  return above && below ? "partially-visible" : unresolved ? "not-evaluated" : above ? "visible" : below ? "not-visible" : "not-evaluated";
}

const Astronomy = createRequire(import.meta.url)("astronomy-engine") as typeof AstronomyTypes;

/** Point samples only: no interpolation, interval certification, or detectability claim. */
export function sampleConjunctionWindow(input: { eventId?: string; bodies: ConjunctionWindow["bodies"]; latitude: number; longitude: number; startUtc: string; endUtc: string }): ConjunctionWindow {
  const start = Date.parse(input.startUtc), end = Date.parse(input.endUtc);
  if (!Number.isFinite(start) || !Number.isFinite(end) || end <= start || end - start > 86400000 || !Number.isFinite(input.latitude) || Math.abs(input.latitude) > 90 || !Number.isFinite(input.longitude) || Math.abs(input.longitude) > 180 || input.bodies.length !== 2 || !input.bodies.every(body => PLANET_PAIR_BODIES.includes(body)) || PLANET_PAIR_BODIES.indexOf(input.bodies[0]) >= PLANET_PAIR_BODIES.indexOf(input.bodies[1])) throw new Error("Invalid bounded conjunction observing window.");
  const observer = new Astronomy.Observer(input.latitude, input.longitude, 0);
  const altitude = (body: AstronomyTypes.Body, date: Date) => {
    const coordinates = Astronomy.Equator(body, date, observer, true, true);
    return Astronomy.Horizon(date, observer, coordinates.ra, coordinates.dec).altitude;
  };
  const times: number[] = [];
  for (let at = start; at < end; at += 900000) times.push(at);
  times.push(end);
  return conjunctionWindowSchema.parse({ eventId: input.eventId ?? "local-pair-geometry", bodies: input.bodies, startUtc: new Date(start).toISOString(), endUtc: new Date(end).toISOString(), method: "15-minute-point-samples", horizonBasis: "geometric-center-zero-degrees", continuousVisibility: "not-established", detectability: "not-assessed", samples: times.map(at => {
    const date = new Date(at);
    return { atUtc: date.toISOString(), altitudeDeg: input.bodies.map(body => altitude(body as AstronomyTypes.Body, date)), sunAltitudeDeg: altitude(Astronomy.Body.Sun, date), moonAltitudeDeg: altitude(Astronomy.Body.Moon, date), moonIlluminationPercent: Astronomy.Illumination(Astronomy.Body.Moon, date).phase_fraction * 100 };
  }) });
}
