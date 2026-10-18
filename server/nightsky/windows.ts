import { formatLocalInstant } from "../../shared/nightsky/format";
import type { AstronomyWindowResult, TargetVisibilityResult } from "../../shared/nightsky/astronomy";
import type { NightConditionsResult } from "../../shared/nightsky/weather";
import type { TimeWindow } from "../../shared/nightsky/common";
import type { PlanResult } from "../../shared/nightsky/planning";

/** Keep each clipped astronomical interval separate; older service fixtures may omit rows. */
export function astronomicalDarknessIntervals(astronomy: AstronomyWindowResult | undefined): Pick<AstronomyWindowResult["solarThresholdIntervals"][number], "startUtc" | "endUtc" | "localStart" | "localEnd">[] {
  if (!astronomy) return [];
  if (astronomy.solarThresholdIntervals !== undefined) return astronomy.solarThresholdIntervals
    .filter(row => row.kind === "astronomical")
    .map(({ startUtc, endUtc, localStart, localEnd }) => ({ startUtc, endUtc, localStart, localEnd }));
  const darkness = astronomy.astronomicalDarkness;
  return darkness.status === "available" ? [{ startUtc: darkness.startUtc, endUtc: darkness.endUtc, localStart: darkness.localStart, localEnd: darkness.localEnd }] : [];
}

/** Current available/partial evidence may support derived judgments; retained stale or failed evidence may not. */
export function usableWeatherForecast(weather: NightConditionsResult, forecast: NightConditionsResult["forecasts"][number]): boolean {
  if (!["available", "partial"].includes(forecast.availability.status)) return false;
  if (!weather.providerOutcomes?.length) return ["available", "partial"].includes(weather.availability.status);
  const outcomes = weather.providerOutcomes.filter(outcome => JSON.stringify(outcome.source) === JSON.stringify(forecast.source));
  return outcomes.length > 0 && outcomes.every(outcome => ["available", "partial"].includes(outcome.status));
}

/** Intersect only proven geometry. Instant cloud samples cannot establish a clear interval. */
export function composeCandidateWindows(activity: string, window: TimeWindow, astronomy: AstronomyWindowResult | undefined, targets: TargetVisibilityResult[], weather: NightConditionsResult | undefined, locale = "en"): PlanResult["candidateWindows"] {
  const needsDarkness = !["moon-observing", "planet-observing", "eclipse"].includes(activity);
  const base = needsDarkness ? astronomicalDarknessIntervals(astronomy) : [window];
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
      const cloudPeriodsByProvider = weather?.forecasts.map(forecast => !usableWeatherForecast(weather, forecast) ? [] : forecast.samples.flatMap(sample => {
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
      const darknessOverlapIntervals = astronomy?.availability.status === "available" ? astronomicalDarknessIntervals(astronomy).flatMap(darkness => {
        const a=Math.max(start,Date.parse(darkness.startUtc)), b=Math.min(end,Date.parse(darkness.endUtc));
        return b>a ? [{startUtc:new Date(a).toISOString(),endUtc:new Date(b).toISOString(),localStart:formatLocalInstant(new Date(a).toISOString(),window.timeZone,locale),localEnd:formatLocalInstant(new Date(b).toISOString(),window.timeZone,locale)}] : [];
      }) : undefined;
      result.push({ darknessOverlapIntervals, localStart: formatLocalInstant(new Date(start).toISOString(), window.timeZone, locale), localEnd: formatLocalInstant(new Date(end).toISOString(), window.timeZone, locale), window: { startUtc: new Date(start).toISOString(), endUtc: new Date(end).toISOString(), timeZone: window.timeZone }, ...(target ? { targetId: target.target.targetId } : {}), weatherCoverage, weatherIntervals,
        moonConstraint: activity === "moon-observing" ? "target" : target?.intervals.some(item => item.moonSeparationDegrees !== undefined) ? "separation-available" : "context-only",
        rationale: `${needsDarkness ? "Astronomical darkness interval" : "Requested session"}${target ? ` + ${target.target.name} above-zero geometry` : ""}; clipped geometric opportunity, not rise/set, useful altitude or itinerary. Cloud interval coverage ${weatherCoverage}; provider values remain separate.${weather?.forecasts.some(forecast => !usableWeatherForecast(weather, forecast)) ? " Stale/unavailable intervals do not support usable coverage." : ""} Moon ${activity === "moon-observing" ? "is target geometry" : "context only"}; no clear-night probability is inferred.` });
      if (result.length === 8) return result;
    }
  }
  return result;
}
