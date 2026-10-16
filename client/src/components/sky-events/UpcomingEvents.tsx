import { Link } from "wouter";
import { skyEvents } from "@shared/skyEventCatalog";
import { nextSkyEvents } from "@shared/skyEventQueries";
import type { SkyEvent } from "@shared/skyEvents";
import { useCalendarPreferences } from "./CalendarPreferences";
import EventCard from "./EventCard";
import "@/styles/sky-events.css";
export default function UpcomingEvents({
  home = false,
  events = skyEvents,
  search,
}: {
  home?: boolean;
  events?: readonly SkyEvent[];
  search?: string;
}) {
  const { tz, now } = useCalendarPreferences();
  const items = nextSkyEvents(events, tz, now, 3);
  return (
    <section className="upcoming-section page-width">
      <div className="section-heading">
        <p className="eyebrow">
          {home ? "A reason to look up" : "Coming up next · All categories"}
        </p>
        <h2>
          {home ? "Next in the night sky" : "The next moments to explore."}
        </h2>
        <p>
          A selected calendar of celestial moments. Exact times follow your time
          zone; visibility depends on where you are.
        </p>
      </div>
      {items.length ? (
        <div className="upcoming-grid">
          {items.map((item) => (
            <EventCard
              key={item.event.id}
              item={item}
              search={search || "?tz=" + encodeURIComponent(tz)}
            />
          ))}
        </div>
      ) : (
        <p>
          More moments are being researched. Explore the calendar and
          skywatching resources.
        </p>
      )}
      {home && (
        <Link className="action action-outline" href="/sky-events">
          Explore sky events <span aria-hidden="true">↗</span>
        </Link>
      )}
    </section>
  );
}
