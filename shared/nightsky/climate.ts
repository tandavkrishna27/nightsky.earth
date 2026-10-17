import { selectionRevisionRefinement } from "./common";
import * as z from "zod4";
import { ianaTimeZoneSchema, placeIdSchema, resultSchema, utcInstantSchema } from "./common";

export const CLOUD_THRESHOLDS = [0.1, 0.25, 0.5] as const;
export const CLIMATE_METHOD_VERSION = "dark-cloud-v1" as const;
export function observingNightFromLocalParts(year: number, month: number, day: number, hour: number): string {
  const date = new Date(Date.UTC(year, month - 1, day));
  if (hour < 12) date.setUTCDate(date.getUTCDate() - 1);
  return date.toISOString().slice(0, 10);
}
export function observingNightForInstant(atUtc: string, timeZone: string): string {
  utcInstantSchema.parse(atUtc);
  ianaTimeZoneSchema.parse(timeZone);
  const parts = Object.fromEntries(new Intl.DateTimeFormat("en-CA", { timeZone, year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", hourCycle: "h23" }).formatToParts(new Date(atUtc)).map(part => [part.type, part.value]));
  return observingNightFromLocalParts(Number(parts.year), Number(parts.month), Number(parts.day), Number(parts.hour));
}
export const calendarDateSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/).refine(value => {
  const time = Date.parse(`${value}T00:00:00Z`);
  return Number.isFinite(time) && new Date(time).toISOString().slice(0, 10) === value;
}, "Expected a real Gregorian calendar date.");
export const climatePeriodSchema = z.strictObject({
  startNight: calendarDateSchema, endNight: calendarDateSchema,
  kind: z.enum(["sample-only", "baseline-1991-2020"]),
}).superRefine((period, ctx) => {
  if (period.startNight > period.endNight) ctx.addIssue({ code: "custom", message: "Period is reversed." });
  const years = Number(period.endNight.slice(0, 4)) - Number(period.startNight.slice(0, 4)) + 1;
  if (years < 1 || years > 30 || Number(period.startNight.slice(0, 4)) < 1900 || Number(period.endNight.slice(0, 4)) > 2200)
    ctx.addIssue({ code: "custom", message: "Period must cover at most 30 calendar years within 1900–2200." });
  if (period.kind === "baseline-1991-2020" && (period.startNight !== "1991-01-01" || period.endNight !== "2020-12-31"))
    ctx.addIssue({ code: "custom", message: "Baseline requires the exact 1991–2020 observing-night period." });
});
const count = z.number().int().min(0).max(0xffffffff);
const fraction = z.number().finite().min(0).max(1);
export const climateStatisticsSchema = z.strictObject({
  expectedEligibleSamples: count, validEligibleSamples: count,
  representedYears: z.number().int().min(0).max(30), badYearCount: z.number().int().min(0).max(30),
  completeness: fraction.optional(), meanCloudFraction: fraction.optional(),
  thresholds: z.array(z.strictObject({ fraction, count, frequency: fraction })).length(3).optional(),
}).superRefine((stats, ctx) => {
  const fail = (message: string) => ctx.addIssue({ code: "custom", message });
  const { expectedEligibleSamples: expected, validEligibleSamples: valid } = stats;
  if (valid > expected) fail("Valid samples exceed expected samples.");
  if (stats.representedYears > valid || (!valid && stats.representedYears) || (valid > 0 && stats.representedYears === 0)) fail("Represented years are inconsistent with samples.");
  if (!expected ? stats.completeness !== undefined : stats.completeness === undefined || Math.abs(stats.completeness - valid / expected) > 1e-12)
    fail("Completeness must equal valid / expected and be absent at zero expected samples.");
  if (!valid) {
    if (stats.meanCloudFraction !== undefined || stats.thresholds !== undefined) fail("No numeric cloud statistics at a zero denominator.");
  } else {
    if (stats.meanCloudFraction === undefined || !stats.thresholds) fail("Valid samples require cloud statistics.");
    let previous = 0;
    stats.thresholds?.forEach((row, index) => {
      if (row.fraction !== CLOUD_THRESHOLDS[index] || row.count > valid || row.count < previous || Math.abs(row.frequency - row.count / valid) > 1e-12)
        fail("Thresholds must be ordered inclusive counts with matching fractions and frequencies.");
      previous = row.count;
    });
  }
});
export type ClimateStatistics = z.infer<typeof climateStatisticsSchema>;
export const getClearSkyClimatologyInputSchema = z.strictObject({ placeId: placeIdSchema, month: z.number().int().min(1).max(12), sourceRevision: z.string().regex(/^[a-f0-9]{64}$/).optional(), catalogueRevision: z.string().trim().min(1).max(100).optional(), displayTimeZone: ianaTimeZoneSchema.optional() }).superRefine(selectionRevisionRefinement);
export const climateContextResultSchema = resultSchema({
  sourceRevision:z.string().regex(/^[a-f0-9]{64}$/).optional(),
  schemaVersion: z.literal(2), placeId: placeIdSchema, month: z.number().int().min(1).max(12), timeZone: ianaTimeZoneSchema,
  dataClass: z.literal("reanalysis"), historicalLabel: z.literal("historical-not-a-forecast"),
  methodVersion: z.enum([CLIMATE_METHOD_VERSION, "open-meteo-quantized-dark-cloud-v1"]), sampleDefinition: z.literal("hourly-dark-time-samples"), unit: z.literal("fraction"),
  period: climatePeriodSchema,
  grid: z.strictObject({ mapping: z.literal("nearest-supplied-cell"), cellId: z.string().min(1).max(80), spacingDegrees: z.literal(0.25),
    displacementKm: z.number().finite().nonnegative(), placeIndexVintage: z.string().min(1).max(100) }).optional(),
  summary: climateStatisticsSchema.optional(),
  bins: z.array(z.strictObject({ utcHour: z.number().int().min(0).max(23), statistics: climateStatisticsSchema })).max(24).optional(),
}).superRefine((result, ctx) => {
  const fail = (message: string) => ctx.addIssue({ code: "custom", message });
  if (!result.sources.some(source => source.dataClass === "reanalysis")) fail("Historical result needs reanalysis provenance.");
  const status = result.availability.status;
  if (result.methodVersion === "open-meteo-quantized-dark-cloud-v1" && (status === "available" || (status !== "unavailable" && result.period.kind !== "sample-only"))) fail("Hosted method is restricted to sample-only previews or unavailable baseline.");
  if (!["available", "partial", "unavailable", "not-covered"].includes(status)) fail("Unsupported historical availability state.");
  if (status === "unavailable" && (result.summary || result.bins)) fail("Unavailable artifacts have no sample statistics.");
  if (status === "not-covered" && (result.summary?.expectedEligibleSamples || result.bins?.some(bin => bin.statistics.expectedEligibleSamples))) fail("Not-covered results cannot contain eligible cloud samples.");
  if ((status === "available" || status === "partial") && (!result.summary || !result.grid)) fail("Historical statistics need grid mapping and summary.");
  if (result.bins && new Set(result.bins.map(bin => bin.utcHour)).size !== result.bins.length) fail("Duplicate UTC hour bins.");
  const years = Number(result.period.endNight.slice(0, 4)) - Number(result.period.startNight.slice(0, 4)) + 1;
  const stats = [result.summary, ...(result.bins?.map(bin => bin.statistics) ?? [])].filter((row): row is ClimateStatistics => !!row);
  if (stats.some(row => row.representedYears > years || row.badYearCount > years)) fail("Coverage years exceed the actual period.");
  if (status === "available" && (result.period.kind !== "baseline-1991-2020" || stats.some(row => row.expectedEligibleSamples > 0 && ((row.completeness ?? 0) < 0.9 || row.representedYears < 27 || row.badYearCount > 0))))
    fail("Available seasonal context requires baseline and adequate coverage in every returned bin.");
  if (status === "available" && !result.summary?.validEligibleSamples) fail("Available context needs a valid denominator.");
});
export type ClimateContextResultV2 = z.infer<typeof climateContextResultSchema>;

export function describeClimateContext(result: ClimateContextResultV2): string {
  const parsed = climateContextResultSchema.parse(result);
  const label = `${parsed.period.startNight}–${parsed.period.endNight}; ${parsed.period.kind}; ${parsed.historicalLabel}`;
  if (!parsed.summary?.validEligibleSamples) return `${parsed.availability.status}: ${parsed.availability.reason} (${label}). No numeric cloud statistic is available.`;
  const stats = parsed.summary;
  const thresholds = stats.thresholds!.map(row => `cloud ≤${row.fraction * 100}%: ${(row.frequency * 100).toFixed(1)}%`).join("; ");
  return `${parsed.availability.status}: ${label}. Mean modeled cloud amount: ${(stats.meanCloudFraction! * 100).toFixed(1)}%. Valid hourly dark-time sample frequencies (${thresholds}). Coverage: ${stats.validEligibleSamples}/${stats.expectedEligibleSamples}. Not a forecast or whole-night success probability.`;
}
