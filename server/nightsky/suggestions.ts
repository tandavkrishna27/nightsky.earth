import type { TargetVisibilityResult, AstronomyWindowResult } from "../../shared/nightsky/astronomy";
import type { TimeWindow } from "../../shared/nightsky/common";
import type { PlannerServices } from "./planner";
import { getTargetVisibility } from "./astronomy";

/** Pure local engine calculations: no additional provider requests or redistributed star catalog. */
export async function suggestVisibleTargets(activity: string, place: { placeId: string; timeZone: string }, window: TimeWindow, services: PlannerServices, astronomy?: AstronomyWindowResult): Promise<TargetVisibilityResult[]> {
  const names = activity === "moon-observing" ? ["Moon"] : ["general-stargazing", "visual-stargazing", "learning", "planet-observing"].includes(activity) ? ["Moon", "Jupiter", "Saturn", "Venus", "Mars", "Mercury"] : activity === "astrophotography" ? ["Milky Way core", "Moon", "Jupiter"] : [];
  const visible: TargetVisibilityResult[] = [];
  for (const name of names) {
    if (activity === "planet-observing" && name === "Moon") continue;
    const result = await getTargetVisibility(name, place, window, services.index).catch(() => undefined);
    const darkness = astronomy?.astronomicalDarkness;
    const requiresDarkness = !["moon-observing", "planet-observing"].includes(activity);
    if (result?.availability.status === "available" && result.intervals.some(interval => !requiresDarkness || darkness?.status === "available" && Date.parse(interval.endUtc) > Date.parse(darkness.startUtc) && Date.parse(interval.startUtc) < Date.parse(darkness.endUtc))) visible.push(result);
    if (visible.length === 3) break;
  }
  return visible;
}
