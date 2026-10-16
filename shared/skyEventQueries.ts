import type { SkyEvent, EventTiming } from "./skyEvents";
import { dateKeyAt, dateRange, formatInstant } from "./skyEventTime";
export type ProjectedEvent = {
  event: SkyEvent;
  dateKeys: readonly string[];
  timingText: string;
  phase: "upcoming" | "ongoing" | "past";
  marker: "primary" | "activity" | "both";
  sortKey: string;
};
export function timingDays(t: EventTiming, zone: string): string[] {
  if (t.kind === "instant") return [dateKeyAt(t.atUtc, zone)];
  if (t.kind === "approximate")
    return dateRange(t.startDate, t.endDateInclusive);
  return dateRange(
    dateKeyAt(t.startUtc, zone),
    dateKeyAt(new Date(Date.parse(t.endUtcExclusive) - 1).toISOString(), zone),
  );
}
export function timingText(t: EventTiming, zone: string): string {
  if (t.kind === "instant")
    return t.label + ": " + formatInstant(t.atUtc, zone);
  if (t.kind === "interval")
    return (
      t.label +
      ": " +
      formatInstant(t.startUtc, zone) +
      " – " +
      formatInstant(t.endUtcExclusive, zone) +
      " (end exclusive)"
    );
  const date = (s: string) =>
    new Intl.DateTimeFormat("en-GB", {
      timeZone: "UTC",
      day: "numeric",
      month: "short",
      year: "numeric",
    }).format(new Date(s + "T12:00:00Z"));
  return (
    t.label +
    ": " +
    date(t.startDate) +
    (t.endDateInclusive !== t.startDate
      ? " – " + date(t.endDateInclusive)
      : "") +
    " · Approx. · " +
    t.basisLabel
  );
}
export function timingPhase(
  t: EventTiming,
  now: Date,
): "upcoming" | "ongoing" | "past" {
  if (t.kind === "instant")
    return Date.parse(t.atUtc) >= now.getTime() ? "upcoming" : "past";
  if (t.kind === "interval")
    return now.getTime() < Date.parse(t.startUtc)
      ? "upcoming"
      : now.getTime() < Date.parse(t.endUtcExclusive)
        ? "ongoing"
        : "past";
  const today = now.toISOString().slice(0, 10);
  return today < t.startDate
    ? "upcoming"
    : today <= t.endDateInclusive
      ? "ongoing"
      : "past";
}
function project(e: SkyEvent, zone: string, now: Date): ProjectedEvent {
  const phase = timingPhase(e.timing, now);
  const activityPhase = e.activity ? timingPhase(e.activity, now) : "past";
  const marker =
    phase === "past" && activityPhase === "ongoing" ? "activity" : "primary";
  const all = [
    ...timingDays(e.timing, zone),
    ...(e.activity ? timingDays(e.activity, zone) : []),
  ];
  const t = e.timing;
  const sortKey =
    t.kind === "instant"
      ? t.atUtc
      : t.kind === "interval"
        ? t.startUtc
        : t.startDate;
  return {
    event: e,
    dateKeys: Array.from(new Set(all)).sort(),
    timingText: timingText(e.timing, zone),
    phase: marker === "activity" ? "ongoing" : phase,
    marker,
    sortKey,
  };
}
export function projectMonth(
  events: readonly SkyEvent[],
  month: string,
  zone: string,
  now: Date,
): ProjectedEvent[] {
  return events
    .filter((e) => e.reviewStatus === "reviewed")
    .map((e) => project(e, zone, now))
    .map((p) => ({
      ...p,
      dateKeys: p.dateKeys.filter((d) => d.startsWith(month)),
    }))
    .filter((p) => p.dateKeys.length)
    .sort(
      (a, b) =>
        a.sortKey.localeCompare(b.sortKey) ||
        a.event.id.localeCompare(b.event.id),
    );
}
export function nextSkyEvents(
  events: readonly SkyEvent[],
  zone: string,
  now: Date,
  count: number,
): ProjectedEvent[] {
  return events
    .filter((e) => e.reviewStatus === "reviewed")
    .map((e) => project(e, zone, now))
    .filter((p) => p.phase !== "past")
    .sort(
      (a, b) =>
        Number(a.marker === "activity") - Number(b.marker === "activity") ||
        a.sortKey.localeCompare(b.sortKey) ||
        a.event.id.localeCompare(b.event.id),
    )
    .slice(0, Math.max(0, Math.min(3, count)));
}
