import { useEffect, useRef, useState, type KeyboardEvent } from "react";
import { Link } from "wouter";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { categoryLabels } from "@shared/skyEvents";
import type { ProjectedEvent } from "@shared/skyEventQueries";
import { homeEventDate } from "./eventDate";

export default function HomeEvents({
  items,
  zone,
  search,
}: {
  items: ProjectedEvent[];
  zone: string;
  search: string;
}) {
  const grid = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState(0);
  useEffect(() => {
    const element = grid.current;
    if (!element) return;
    const update = () => {
      const cards = Array.from(element.children) as HTMLElement[];
      if (!cards.length) return;
      const start = cards[0].offsetLeft;
      setPosition(
        cards.reduce(
          (best, card, index) =>
            Math.abs(card.offsetLeft - start - element.scrollLeft) <
            Math.abs(cards[best].offsetLeft - start - element.scrollLeft)
              ? index
              : best,
          0,
        ),
      );
    };
    element.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    const observer =
      typeof ResizeObserver !== "undefined" ? new ResizeObserver(update) : null;
    observer?.observe(element);
    update();
    return () => {
      element.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
      observer?.disconnect();
    };
  }, [items.map((item) => item.event.id).join("|")]);
  const move = (step: number) => {
    const element = grid.current;
    if (!element) return;
    const cards = Array.from(element.children) as HTMLElement[];
    const next = Math.min(cards.length - 1, Math.max(0, position + step));
    element.scrollTo({
      left: cards[next].offsetLeft - cards[0].offsetLeft,
      behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches
        ? "instant"
        : "smooth",
    });
  };
  const keyboard = (event: KeyboardEvent<HTMLDivElement>) => {
    if (
      event.target !== event.currentTarget ||
      !window.matchMedia("(max-width: 760px)").matches
    )
      return;
    if (event.key === "ArrowLeft" || event.key === "ArrowRight") {
      event.preventDefault();
      move(event.key === "ArrowRight" ? 1 : -1);
    }
  };
  return (
    <section
      id="home-events"
      className="home-events page-width"
      aria-labelledby="home-events-heading"
    >
      <div className="home-events-heading">
        <h2 id="home-events-heading">What’s Happening in the Sky.</h2>
        <Link className="text-link" href="/sky-events">
          Explore Sky Events <span aria-hidden="true">↗</span>
        </Link>
      </div>
      {items.length ? (
        <>
          <div
            ref={grid}
            className="home-event-grid upcoming-grid"
            tabIndex={0}
            onKeyDown={keyboard}
            aria-label="Sky events. Swipe or use the navigation buttons to browse."
          >
            {items.map((item) => {
              const date = homeEventDate(item, zone);
              return (
                <Link
                  key={item.event.id}
                  href={"/sky-events/" + item.event.id + search}
                  className={`home-event-card category-${item.event.category}`}
                  data-event-id={item.event.id}
                  aria-label={`${item.event.title}. ${date.label}. Explore event.`}
                >
                  <div className="home-event-art" aria-hidden="true">
                    <div
                      className={`home-event-date ${date.day.length > 6 ? "date-wide" : ""}`}
                    >
                      <span>{date.weekday}</span>
                      <strong>{date.day}</strong>
                      <span>{date.month}</span>
                    </div>
                    <div className="event-celestial-art">
                      <i />
                      <b />
                    </div>
                  </div>
                  <div className="home-event-content">
                    <span className="home-event-category">
                      {categoryLabels[item.event.category]}
                    </span>
                    <h3>{item.event.title}</h3>
                    <p className="home-event-context">{date.context}</p>
                    <p className="home-event-synopsis">{item.event.synopsis}</p>
                    <span className="home-event-action">
                      Explore the moment <span aria-hidden="true">↗</span>
                    </span>
                  </div>
                </Link>
              );
            })}
          </div>
          <div
            className="home-event-navigation"
            aria-label="Event cards navigation"
          >
            <span
              className="event-position"
              aria-live="polite"
              aria-atomic="true"
            >
              {position + 1} / {items.length}
            </span>
            <div>
              <button
                onClick={() => move(-1)}
                disabled={position === 0}
                aria-label="Previous event"
              >
                <ArrowLeft size={18} />
              </button>
              <button
                onClick={() => move(1)}
                disabled={position >= items.length - 1}
                aria-label="Next event"
              >
                <ArrowRight size={18} />
              </button>
            </div>
          </div>
          <p className="home-event-footnote">
            Dates follow the calendar’s timing basis. Explore each event for
            local context. Artwork is illustrative.
          </p>
        </>
      ) : (
        <p className="home-event-empty">
          More moments are being researched. Explore the calendar and
          skywatching resources.
        </p>
      )}
    </section>
  );
}
