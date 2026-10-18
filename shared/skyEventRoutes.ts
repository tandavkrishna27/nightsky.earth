import { categoryLabels, type EventCategory } from "./skyEvents";
import { isSupportedZone, validMonth } from "./skyEventTime";
export type CalendarState = {
  month: string;
  category: EventCategory | "all";
  view: "month" | "list";
  tz: string;
};
export const legacyCalendarDestination = "/sky-events?category=meteor-showers";
export function parseCalendarState(
  search: string,
  defaults: CalendarState,
): CalendarState {
  const q = new URLSearchParams(search);
  const month = q.get("month") || "";
  const category = q.get("category") || "";
  const view = q.get("view");
  const tz = q.get("tz") || "";
  return {
    month: validMonth(month) ? month : defaults.month,
    category:
      category === "all" || Object.hasOwn(categoryLabels, category)
        ? (category as CalendarState["category"])
        : defaults.category,
    view: view === "month" || view === "list" ? view : defaults.view,
    tz: isSupportedZone(tz) ? tz : defaults.tz,
  };
}
export function calendarHref(state: CalendarState, search = ""): string {
  const q = new URLSearchParams(search);
  Object.entries(state).forEach(([k, v]) => q.set(k, v));
  return "/sky-events?" + q.toString();
}
