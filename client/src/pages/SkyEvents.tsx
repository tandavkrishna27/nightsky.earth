import { useEffect } from "react";
import { Link, useLocation, useSearch } from "wouter";
import SEO from "@/components/SEO";
import PluginAction from "@/components/PluginAction";
import { skyEvents, coverageMonths } from "@shared/skyEventCatalog";
import { dateKeyAt } from "@shared/skyEventTime";
import {
  calendarHref,
  parseCalendarState,
  type CalendarState,
} from "@shared/skyEventRoutes";
import { projectMonth } from "@shared/skyEventQueries";
import { useCalendarPreferences } from "@/components/sky-events/CalendarPreferences";
import CalendarControls from "@/components/sky-events/CalendarControls";
import MonthCalendar from "@/components/sky-events/MonthCalendar";
import EventList from "@/components/sky-events/EventList";
import UpcomingEvents from "@/components/sky-events/UpcomingEvents";
import image from "@assets/stock_images/starry_night_sky_met_675ba820.jpg";
import "@/styles/sky-events.css";
export default function SkyEvents() {
  const prefs = useCalendarPreferences();
  const search = useSearch();
  const [, navigate] = useLocation();
  // Resolve timezone before deriving the default month: a URL zone can be on another day/month.
  const preliminary = parseCalendarState(search, {
    month: dateKeyAt(prefs.now.toISOString(), prefs.tz).slice(0, 7),
    category: "all",
    view: prefs.view,
    tz: prefs.tz,
  });
  const state = parseCalendarState(search, {
    ...preliminary,
    month: dateKeyAt(prefs.now.toISOString(), preliminary.tz).slice(0, 7),
  });
  const normalized = calendarHref(state, search);
  useEffect(() => {
    prefs.setTz(state.tz, false);
    if ("/sky-events" + (search ? "?" + search : "") !== normalized)
      navigate(normalized, { replace: true });
  }, [normalized]);
  const update = (patch: Partial<CalendarState>) => {
    if (patch.tz) prefs.setTz(patch.tz);
    if (patch.view) prefs.setView(patch.view);
    navigate(calendarHref({ ...state, ...patch }, search));
  };
  const items = projectMonth(
    skyEvents,
    state.month,
    state.tz,
    prefs.now,
  ).filter(
    (p) => state.category === "all" || p.event.category === state.category,
  );
  const covered = coverageMonths.some((m) => m.month === state.month);
  const detailSearch = normalized.slice(normalized.indexOf("?"));
  const nextMonth = coverageMonths.find(
    (m) =>
      m.month > state.month &&
      skyEvents.some(
        (e) =>
          e.reviewStatus === "reviewed" &&
          (e.timing.kind === "instant"
            ? e.timing.atUtc
            : e.timing.kind === "interval"
              ? e.timing.startUtc
              : e.timing.startDate
          ).startsWith(m.month),
      ),
  );
  return (
    <>
      <SEO
        title="Sky Events calendar"
        description="Explore a reviewed selection of meteor showers, eclipses, Moon phases and planetary events, with clear timing and source information."
      />
      <section
        className="sky-events-hero"
        style={{
          backgroundImage:
            "linear-gradient(#080c1760,#0c0c0ef0),url(" + image + ")",
        }}
      >
        <p className="eyebrow">Sky Events</p>
        <h1>
          Something worth <br />
          looking up for.
        </h1>
        <p>
          A calendar of selected moments in the sky. Discover what is coming up,
          understand what makes it interesting, and explore the conditions that
          matter.
        </p>
        <a href="#sky-calendar" className="text-link">
          Explore the calendar ↓
        </a>
      </section>
      <UpcomingEvents search={detailSearch} />
      <section id="sky-calendar" className="sky-calendar-section page-width">
        <div className="calendar-section-heading">
          <p className="eyebrow">Make room for a little wonder</p>
          <h2>Your calendar of the sky.</h2>
          <p>
            Reviewed selection: October 2026–September 2027. This is a curated
            calendar, not a list of every astronomical event.
          </p>
        </div>
        <CalendarControls
          state={state}
          onChange={update}
          onToday={() =>
            update({
              month: dateKeyAt(prefs.now.toISOString(), state.tz).slice(0, 7),
            })
          }
          onResetZone={() =>
            navigate(calendarHref({ ...state, tz: prefs.resetZone() }, search))
          }
        />
        {prefs.fallback && (
          <p role="status">
            Your browser’s time zone could not be detected. UTC is available as
            a fallback.
          </p>
        )}
        {!covered && (
          <p className="calendar-notice">
            This month has not been reviewed yet.
          </p>
        )}
        {!items.length && (
          <div className="calendar-empty">
            <h3>
              {state.category === "all"
                ? "No reviewed events listed for this month."
                : "No reviewed events match this category for this month."}
            </h3>
            <p>Try another month or explore a different category.</p>
            {state.category !== "all" && (
              <button
                className="text-link"
                onClick={() => update({ category: "all" })}
              >
                Show all categories
              </button>
            )}
            {nextMonth && (
              <button
                className="text-link"
                onClick={() =>
                  update({ month: nextMonth.month, category: "all" })
                }
              >
                Go to next listed month →
              </button>
            )}
          </div>
        )}
        {state.view === "month" ? (
          <MonthCalendar
            items={items}
            month={state.month}
            tz={state.tz}
            today={dateKeyAt(prefs.now.toISOString(), state.tz)}
            search={detailSearch}
          />
        ) : (
          <EventList items={items} search={detailSearch} />
        )}
      </section>
      <section className="calendar-explainer page-width">
        <div>
          <p className="eyebrow">From a date to a night outside</p>
          <h2>
            A moment in the calendar.
            <br />A different view from every place.
          </h2>
        </div>
        <div>
          <p>
            A global event time tells you when an alignment or phase happens.
            Your horizon, darkness, the Moon and weather help determine what you
            could actually see.
          </p>
          <p>
            Approximate entries preserve their source dates. Eclipse maximum is
            a global reference, not your local start time. Use the linked guides
            to understand the difference.
          </p>
          <Link className="text-link" href="/resources?topic=events">
            Explore sky-event resources →
          </Link>
        </div>
      </section>
      <section className="about-closing">
        <p className="eyebrow">Make it your own</p>
        <h2>Explore your next night.</h2>
        <p>Bring an event, a destination and a question to NightSky.</p>
        <PluginAction />
      </section>
    </>
  );
}
