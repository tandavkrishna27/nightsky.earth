import {
  timingDays,
  timingText,
  type ProjectedEvent,
} from "@shared/skyEventQueries";

export function homeEventDate(item: ProjectedEvent, zone: string) {
  const timing =
    item.marker === "activity" && item.event.activity
      ? item.event.activity
      : item.event.timing;
  const days = timingDays(timing, zone);
  const first = days[0],
    last = days[days.length - 1];
  const format = (day: string, options: Intl.DateTimeFormatOptions) =>
    new Intl.DateTimeFormat("en-GB", { ...options, timeZone: "UTC" }).format(
      new Date(day + "T12:00:00Z"),
    );
  const sameMonth = first.slice(0, 7) === last.slice(0, 7);
  const day =
    first === last
      ? format(first, { day: "numeric" })
      : sameMonth
        ? `${format(first, { day: "numeric" })}–${format(last, { day: "numeric" })}`
        : `${format(first, { day: "numeric", month: "short" })}–${format(last, { day: "numeric", month: "short" })}`;
  const weekday = (
    format(first, { weekday: "short" }) +
    (first !== last ? "–" + format(last, { weekday: "short" }) : "")
  ).toUpperCase();
  const month = sameMonth
    ? format(first, { month: "short", year: "numeric" }).toUpperCase()
    : first.slice(0, 4) === last.slice(0, 4)
      ? first.slice(0, 4)
      : `${first.slice(0, 4)}–${last.slice(0, 4)}`;
  const context =
    timing.kind === "approximate"
      ? `Approx. · ${timing.basisLabel}`
      : timing.kind === "instant"
        ? new Intl.DateTimeFormat("en-GB", {
            hour: "2-digit",
            minute: "2-digit",
            timeZone: zone,
            timeZoneName: "short",
          }).format(new Date(timing.atUtc))
        : `Times in ${zone.replaceAll("_", " ")}`;
  return {
    day,
    weekday,
    month,
    first,
    label: timingText(timing, zone),
    context:
      item.marker === "activity"
        ? `Peak passed · Activity underway · ${context}`
        : item.phase === "ongoing"
          ? `Ongoing · ${context}`
          : context,
  };
}
