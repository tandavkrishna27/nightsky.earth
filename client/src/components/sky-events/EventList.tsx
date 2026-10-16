import type { ProjectedEvent } from "@shared/skyEventQueries";
import EventCard from "./EventCard";
export default function EventList({
  items,
  search = "",
}: {
  items: readonly ProjectedEvent[];
  search?: string;
}) {
  return (
    <div className="event-list">
      {items.map((item) => (
        <EventCard key={item.event.id} item={item} search={search} />
      ))}
    </div>
  );
}
