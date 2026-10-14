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
