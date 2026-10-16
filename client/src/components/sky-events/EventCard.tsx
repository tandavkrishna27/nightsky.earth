import { Link } from "wouter";
import { categoryLabels } from "@shared/skyEvents";
import type { ProjectedEvent } from "@shared/skyEventQueries";
export default function EventCard({
  item,
  search = "",
}: {
  item: ProjectedEvent;
  search?: string;
}) {
  return (
    <article
      className={`sky-event-card category-${item.event.category}`}
      data-event-id={item.event.id}
    >
      <div className="event-category">
        <span aria-hidden="true">✧</span>
        {categoryLabels[item.event.category]}
        {item.phase === "past" && <span> · Past event</span>}
        {item.phase === "ongoing" && item.marker !== "activity" && (
          <span> · Ongoing</span>
        )}
      </div>
      <h3>
        <Link href={"/sky-events/" + item.event.id + search}>
          {item.event.title}
        </Link>
      </h3>
      <p className="event-time">{item.timingText}</p>
      {item.marker === "activity" && (
        <p className="small-note">Peak passed · Activity underway</p>
      )}
      <p>{item.event.synopsis}</p>
      <details>
        <summary>Visibility & equipment</summary>
        <p>{item.event.visibility}</p>
        <p>{item.event.equipment}</p>
      </details>
      <Link
        href={"/sky-events/" + item.event.id + search}
        className="text-link"
      >
        Explore event <span aria-hidden="true">↗</span>
      </Link>
    </article>
  );
}
