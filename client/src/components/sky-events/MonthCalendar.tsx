import { useEffect, useRef, useState } from "react";
import { Link } from "wouter";
import { monthCells } from "@shared/skyEventTime";
import { timingDays, type ProjectedEvent } from "@shared/skyEventQueries";
import { categoryLabels } from "@shared/skyEvents";
import EventList from "./EventList";
export default function MonthCalendar({
  items,
  month,
  tz,
  today,
  search,
}: {
  items: readonly ProjectedEvent[];
  month: string;
  tz: string;
  today: string;
  search: string;
}) {
  const cells = monthCells(month);
  const [expanded, setExpanded] = useState<string | null>(null);
  const heading = useRef<HTMLHeadingElement>(null);
  const expandedTrigger = useRef<HTMLButtonElement | null>(null);
  useEffect(() => setExpanded(null), [month, tz]);
  useEffect(() => {
    if (expanded) heading.current?.focus();
  }, [expanded]);
  const label = new Intl.DateTimeFormat("en-GB", {
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(month + "-01T12:00:00Z"));
  return (
    <>
      <div
        className="calendar-scroll"
        role="region"
        aria-label="Month calendar; scroll horizontally on smaller screens"
        tabIndex={0}
      >
        <table className="month-calendar">
          <caption>{label}</caption>
          <thead>
            <tr>
              {[
                "Monday",
                "Tuesday",
                "Wednesday",
                "Thursday",
                "Friday",
                "Saturday",
                "Sunday",
              ].map((d) => (
                <th key={d} scope="col">
                  <abbr title={d}>{d.slice(0, 3)}</abbr>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {Array.from({ length: cells.length / 7 }, (_, i) => (
              <tr key={i}>
                {cells.slice(i * 7, i * 7 + 7).map((cell) => {
                  const events = items.filter((e) =>
                    e.dateKeys.includes(cell.date),
                  );
                  return (
                    <td
                      key={cell.date}
                      className={cell.inMonth ? "" : "outside-month"}
                    >
                      <time
                        dateTime={cell.date}
                        aria-current={cell.date === today ? "date" : undefined}
                      >
                        {Number(cell.date.slice(8))}
                        {cell.date === today && (
                          <span className="sr-only"> Today</span>
                        )}
                      </time>
                      {events.slice(0, 2).map((p) => {
                        const activity = !timingDays(
                          p.event.timing,
                          tz,
                        ).includes(cell.date);
                        return (
                          <Link
                            key={p.event.id}
                            href={"/sky-events/" + p.event.id + search}
                            className={
                              "calendar-event category-" + p.event.category
                            }
                            title={
                              p.event.title +
                              " · " +
                              categoryLabels[p.event.category]
                            }
                          >
                            <span>{p.event.title}</span>
                            <small>
                              {activity
                                ? "Activity"
                                : p.event.timing.kind === "approximate"
                                  ? "Approx. · source dates"
                                  : categoryLabels[p.event.category]}
                            </small>
                          </Link>
                        );
                      })}
                      {events.length > 2 && (
                        <button
                          className="calendar-more"
                          onClick={(event) => {
                            expandedTrigger.current = event.currentTarget;
                            setExpanded(cell.date);
                          }}
                          aria-label={
                            "Show " + events.length + " events on " + cell.date
                          }
                        >
                          +{events.length - 2} more
                        </button>
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {expanded && (
        <section className="expanded-day">
          <h3 tabIndex={-1} ref={heading}>
            Events on {expanded}
          </h3>
          <button
            onClick={() => {
              setExpanded(null);
              expandedTrigger.current?.focus();
            }}
          >
            Close day list
          </button>
          <EventList
            items={items.filter((p) => p.dateKeys.includes(expanded))}
            search={search}
          />
        </section>
      )}
    </>
  );
}
