import { useState } from "react";
import { Link, useParams, useSearch } from "wouter";
import EditorialPage from "@/components/EditorialPage";
import PluginAction from "@/components/PluginAction";
import { skyEvents } from "@shared/skyEventCatalog";
import { categoryLabels } from "@shared/skyEvents";
import { timingText, timingPhase } from "@shared/skyEventQueries";
import { resolveZone, dateKeyAt } from "@shared/skyEventTime";
import { calendarHref, parseCalendarState } from "@shared/skyEventRoutes";
import { useCalendarPreferences } from "@/components/sky-events/CalendarPreferences";
import image from "@assets/stock_images/milky_way_galaxy_nig_0e96a3f6.jpg";
import "@/styles/sky-events.css";
export default function SkyEventDetail() {
  const { id } = useParams();
  const search = useSearch();
  const prefs = useCalendarPreferences();
  const [status, setStatus] = useState("");
  const event = skyEvents.find(
    (e) => e.id === id && e.reviewStatus !== "draft",
  );
  const tz = resolveZone(new URLSearchParams(search).get("tz"), prefs.tz);
  const state = parseCalendarState(search, {
    month: dateKeyAt(prefs.now.toISOString(), tz).slice(0, 7),
    category: "all",
    view: prefs.view,
    tz,
  });
  if (!event || event.reviewStatus === "withdrawn")
    return (
      <EditorialPage
        noindex
        eyebrow="Sky Events"
        title={event ? "This entry is under review." : "Sky event not found."}
        intro={
          event
            ? "This event has been withdrawn from the reviewed calendar while its information is checked."
            : "We could not find that reviewed event."
        }
      >
        <Link className="text-link" href={calendarHref(state)}>
          Explore sky events →
        </Link>
      </EditorialPage>
    );
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(event.question);
      setStatus("Question copied.");
    } catch {
      setStatus(
        "Couldn’t copy. Select the question below to copy it manually.",
      );
    }
  };
  return (
    <EditorialPage
      eyebrow={categoryLabels[event.category]}
      title={event.title}
      intro={event.synopsis}
      image={image}
    >
      <Link className="text-link" href={calendarHref(state)}>
        ← Back to the calendar
      </Link>
      <div className="event-detail-layout">
        <div className="reading-column">
          <section className="event-detail-timing">
            <p className="eyebrow">
              {timingPhase(event.timing, prefs.now) === "past"
                ? "Past event"
                : "Event timing"}
            </p>
            <h2>When the moment happens.</h2>
            <p>{timingText(event.timing, tz)}</p>
            <p className="small-note">
              Selected time zone: {tz}. Visibility varies by location.
            </p>
            {event.activity && <p>{timingText(event.activity, tz)}</p>}
          </section>
          {event.sections.map((s) => (
            <section key={s.heading}>
              <h2>{s.heading}</h2>
              <p>{s.body}</p>
            </section>
          ))}
          <section>
            <h2>Bring it into the conversation.</h2>
            <blockquote>{event.question}</blockquote>
            <button className="action action-outline" onClick={copy}>
              Copy question
            </button>
            <p role="status">{status}</p>
            <PluginAction />
          </section>
        </div>
        <aside className="event-detail-aside">
          <section>
            <p className="eyebrow">Where to look</p>
            <p>{event.visibility}</p>
          </section>
          <section>
            <p className="eyebrow">What to bring</p>
            <p>{event.equipment}</p>
          </section>
          <section>
            <p className="eyebrow">Sources & review</p>
            <p>Reviewed {event.lastReviewedAt}</p>
            {event.sources.map((s) => (
              <a
                key={s.id}
                href={s.url}
                target="_blank"
                rel="noopener noreferrer"
              >
                {s.title} ↗
              </a>
            ))}
            <p className="source-credit">
              {event.sources.some((s) => s.id === "almanac") &&
                "Sky Event Almanacs Courtesy of Fred Espenak, www.AstroPixels.com."}
              {event.category === "eclipses" &&
                " Eclipse Predictions by Fred Espenak, NASA’s GSFC."}
            </p>
          </section>
        </aside>
      </div>
    </EditorialPage>
  );
}
