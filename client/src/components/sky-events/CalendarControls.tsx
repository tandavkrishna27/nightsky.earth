import { useMemo, useState } from "react";
import { categoryLabels } from "@shared/skyEvents";
import { isSupportedZone, shiftMonth, validMonth } from "@shared/skyEventTime";
import type { CalendarState } from "@shared/skyEventRoutes";
export default function CalendarControls({
  state,
  onChange,
  onToday,
  onResetZone,
}: {
  state: CalendarState;
  onChange: (s: Partial<CalendarState>) => void;
  onToday: () => void;
  onResetZone: () => void;
}) {
  const [search, setSearch] = useState("");
  const zones = useMemo(() => {
    let list: string[] = [];
    try {
      list =
        (
          Intl as typeof Intl & {
            supportedValuesOf?: (key: string) => string[];
          }
        ).supportedValuesOf?.("timeZone") || [];
    } catch {}
    const fallback = [
      "UTC",
      "Asia/Kolkata",
      "Asia/Kathmandu",
      "Asia/Tokyo",
      "Australia/Sydney",
      "Europe/London",
      "Europe/Paris",
      "America/New_York",
      "America/Los_Angeles",
      "Pacific/Honolulu",
      "Pacific/Kiritimati",
    ];
    return Array.from(new Set(["UTC", state.tz, ...list, ...fallback]))
      .filter(isSupportedZone)
      .sort();
  }, [state.tz]);
  const shown = zones.filter(
    (z) =>
      z === state.tz ||
      z.toLowerCase().replaceAll("_", " ").includes(search.toLowerCase()),
  );
  const offset =
    new Intl.DateTimeFormat("en", {
      timeZone: state.tz,
      timeZoneName: "shortOffset",
    })
      .formatToParts(new Date(state.month + "-01T00:00:00Z"))
      .find((p) => p.type === "timeZoneName")?.value || "UTC";
  return (
    <div className="calendar-controls">
      <div className="calendar-toolbar">
        <div className="month-buttons">
          <button
            onClick={() => onChange({ month: shiftMonth(state.month, -1) })}
            disabled={!validMonth(shiftMonth(state.month, -1))}
            aria-label="Previous month"
          >
            ←
          </button>
          <button onClick={onToday}>Today</button>
          <button
            onClick={() => onChange({ month: shiftMonth(state.month, 1) })}
            disabled={!validMonth(shiftMonth(state.month, 1))}
            aria-label="Next month"
          >
            →
          </button>
        </div>
        <label>
          Month
          <input
            aria-label="Calendar month"
            type="month"
            min="1900-01"
            max="2100-12"
            value={state.month}
            onChange={(e) => {
              if (validMonth(e.target.value))
                onChange({ month: e.target.value });
            }}
          />
        </label>
        <div className="view-switch" role="group" aria-label="Calendar view">
          <button
            aria-pressed={state.view === "month"}
            onClick={() => onChange({ view: "month" })}
          >
            Calendar
          </button>
          <button
            aria-pressed={state.view === "list"}
            onClick={() => onChange({ view: "list" })}
          >
            List
          </button>
        </div>
      </div>
      <div className="calendar-filters">
        <label>
          Event category
          <select
            aria-label="Event category"
            value={state.category}
            onChange={(e) =>
              onChange({
                category: e.target.value as CalendarState["category"],
              })
            }
          >
            <option value="all">All events</option>
            {Object.entries(categoryLabels).map(([v, l]) => (
              <option key={v} value={v}>
                {l}
              </option>
            ))}
          </select>
        </label>
        <label>
          Find a time zone
          <input
            aria-label="Find a time zone"
            placeholder="Search city or region"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </label>
        <label>
          Display time zone
          <select
            aria-label="Display time zone"
            value={state.tz}
            onChange={(e) => onChange({ tz: e.target.value })}
          >
            {shown.map((z) => (
              <option key={z} value={z}>
                {z.replaceAll("_", " ")}
              </option>
            ))}
          </select>
        </label>
        <button className="text-link" onClick={onResetZone}>
          Use browser time zone
        </button>
      </div>
      <p className="calendar-time-note">
        Exact times shown in <strong>{state.tz.replaceAll("_", " ")}</strong>.{" "}
        {offset} at the start of this month. Individual event offsets follow
        their dates.
      </p>
      <p className="small-note">
        Approximate dates retain their source basis. Visibility varies by
        location.
      </p>
    </div>
  );
}
