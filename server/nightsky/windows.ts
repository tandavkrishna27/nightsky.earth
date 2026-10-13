import type { AstronomyWindowResult, TargetVisibilityResult } from "../../shared/nightsky/astronomy";
import type { NightConditionsResult } from "../../shared/nightsky/weather";
import type { TimeWindow } from "../../shared/nightsky/common";
import type { PlanResult } from "../../shared/nightsky/planning";

/** Intersect only proven geometry. Instant cloud samples cannot establish a clear interval. */
export function composeCandidateWindows(activity: string, window: TimeWindow, astronomy: AstronomyWindowResult | undefined, targets: TargetVisibilityResult[], weather: NightConditionsResult | undefined): PlanResult["candidateWindows"] {
  const needsDarkness = !["moon-observing", "planet-observing", "eclipse"].includes(activity);
  const darkness = astronomy?.astronomicalDarkness;
  const base = needsDarkness ? darkness?.status === "available" ? [{ startUtc: darkness.startUtc, endUtc: darkness.endUtc }] : [] : [window];
  const result: PlanResult["candidateWindows"] = [];
  const targetRequired = ["moon-observing", "planet-observing", "deep-sky-imaging", "astrophotography"].includes(activity);
  if (targetRequired && !targets.length) return [];
  // An eclipse requires contact/local visibility evidence, not a generic night interval.
  if (activity === "eclipse") return [];
  for (const interval of base) {
    const selections = targets.length ? targets.flatMap(target => target.intervals.map(visibility => ({ visibility, target }))) : [{ visibility: interval, target: undefined }];
    for (const { visibility, target } of selections) {
      const start = Math.max(Date.parse(window.startUtc), Date.parse(interval.startUtc), Date.parse(visibility.startUtc));
      const end = Math.min(Date.parse(window.endUtc), Date.parse(interval.endUtc), Date.parse(visibility.endUtc));
      if (end <= start) continue;
      const cloudPeriodsByProvider = weather?.forecasts.map(forecast => forecast.samples.flatMap(sample => {
        const cloud = sample.values.totalCloudCover;
        return cloud?.periodStartUtc && cloud.periodEndUtc ? [{ start: Date.parse(cloud.periodStartUtc), end: Date.parse(cloud.periodEndUtc) }] : [];
      })) ?? [];
      const cloudPeriods = cloudPeriodsByProvider.flat();
      const weatherCoverage = cloudPeriodsByProvider.length && cloudPeriodsByProvider.every(periods => periods.some(period => period.start <= start && period.end >= end)) ? "available" : cloudPeriods.some(period => period.end > start && period.start < end) ? "partial" : "unknown";
      const weatherIntervals = weather?.forecasts.flatMap((forecast, forecastIndex) => forecast.samples.flatMap((sample, sampleIndex) => {
        const cloud = sample.values.totalCloudCover;
        if (!cloud?.periodStartUtc || !cloud.periodEndUtc) return [];
        const a = Math.max(start, Date.parse(cloud.periodStartUtc)), b = Math.min(end, Date.parse(cloud.periodEndUtc));
        return b > a ? [{ window: { startUtc: new Date(a).toISOString(), endUtc: new Date(b).toISOString(), timeZone: window.timeZone }, forecastIndex, sampleIndex }] : [];
      })) ?? [];
      result.push({ window: { startUtc: new Date(start).toISOString(), endUtc: new Date(end).toISOString(), timeZone: window.timeZone }, ...(target ? { targetId: target.target.targetId } : {}), weatherCoverage, weatherIntervals,
        moonConstraint: activity === "moon-observing" ? "target" : target?.intervals.some(item => item.moonSeparationDegrees !== undefined) ? "separation-available" : "context-only",
        rationale: `${needsDarkness ? "Astronomical darkness interval" : "Requested session"}${target ? ` intersected with ${target.target.name} geometric visibility` : ""}. Cloud interval coverage ${weatherCoverage}; provider values remain separate. Moon timing/separation is ${activity === "moon-observing" ? "the target geometry" : "context only unless supplied in target evidence"}; no clear-night probability is inferred.` });
      if (result.length === 8) return result;
    }
  }
  return result;
}
