import { readFileSync } from "node:fs";
import * as z from "zod4";
import type { SourceRecord } from "../../shared/nightsky/common";

const catalogSchema = z.strictObject({
  schemaVersion: z.literal(1), vintage: z.string(), reviewedAt: z.string().datetime(),
  sourceUrl: z.url(), rightsEvidenceUrl: z.url(), rightsStatement: z.literal("Work of the US Gov. Public Use Permitted."),
  table: z.string(), coverage: z.string(),
  peaks: z.array(z.strictObject({ code: z.string(), id: z.string(), name: z.string(), peakUtc: z.string().datetime() })).length(13),
});
const catalogs = [2025, 2026].map(year => {
  const catalog = catalogSchema.parse(JSON.parse(readFileSync(`data/events/meteor-peaks-nasa-${year}.json`, "utf8")));
  if (new Set(catalog.peaks.map(row => row.code)).size !== 13 || catalog.peaks.some(row => !row.peakUtc.startsWith(`${year}-`))) throw new TypeError(`Invalid reviewed ${year} peak coverage.`);
  const source: SourceRecord = {
    name: "NASA Meteoroid Environment Office", url: catalog.sourceUrl,
    attribution: `NASA MEO, The ${year} meteor shower activity forecast for low Earth orbit, ${catalog.table}. Selected forecast maxima normalized to UTC by NightSky.earth.`,
    dataClass: "catalog", product: `${year} forecast meteor shower maxima`,
    vintage: catalog.vintage, licenseUrl: catalog.rightsEvidenceUrl, modified: true,
  };
  return { ...catalog, source };
});
export const REVIEWED_METEOR_PEAK_SOURCES = catalogs.map(catalog => catalog.source);

export const REVIEWED_METEOR_PEAK_SOURCE = REVIEWED_METEOR_PEAK_SOURCES[1]!;

/** Year-specific forecast maxima. No activity window or annual recurrence is inferred. */
export function findReviewedMeteorPeaks(start: number, end: number) {
  if (!Number.isFinite(start) || !Number.isFinite(end)) throw new TypeError("Peak search bounds must be finite.");
  if (start > end) throw new RangeError("Peak search bounds must be ordered.");
  return catalogs.flatMap(catalog => catalog.peaks.filter(row => Date.parse(row.peakUtc) >= start && Date.parse(row.peakUtc) <= end)
    .map(row => ({ ...row, source: { ...catalog.source } })));
}
