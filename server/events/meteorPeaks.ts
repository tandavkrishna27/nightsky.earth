import { readFileSync } from "node:fs";
import * as z from "zod4";
import type { SourceRecord } from "../../shared/nightsky/common";

const catalog = z.strictObject({
  schemaVersion: z.literal(1), vintage: z.string(), reviewedAt: z.string().datetime(),
  sourceUrl: z.url(), rightsEvidenceUrl: z.url(), rightsStatement: z.literal("Work of the US Gov. Public Use Permitted."),
  table: z.string(), coverage: z.string(),
  peaks: z.array(z.strictObject({ code: z.string(), id: z.string(), name: z.string(), peakUtc: z.string().datetime() })).length(13),
}).parse(JSON.parse(readFileSync("data/events/meteor-peaks-nasa-2026.json", "utf8")));
if (new Set(catalog.peaks.map(row => row.code)).size !== 13 || catalog.peaks.some(row => !row.peakUtc.startsWith("2026-"))) throw new TypeError("Invalid reviewed 2026 peak coverage.");

export const REVIEWED_METEOR_PEAK_SOURCE: SourceRecord = {
  name: "NASA Meteoroid Environment Office", url: catalog.sourceUrl,
  attribution: "NASA MEO, The 2026 meteor shower activity forecast for low Earth orbit, issued October 17, 2025, Table 3. Selected forecast maxima normalized to UTC by NightSky.earth.",
  dataClass: "catalog", product: "2026 forecast meteor shower maxima (selected V1 codes)",
  vintage: catalog.vintage, licenseUrl: catalog.rightsEvidenceUrl, modified: true,
};

/** Year-specific forecast maxima. No activity window or annual recurrence is inferred. */
export function findReviewedMeteorPeaks(start: number, end: number) {
  if (!Number.isFinite(start) || !Number.isFinite(end)) throw new TypeError("Peak search bounds must be finite.");
  if (start > end) throw new RangeError("Peak search bounds must be ordered.");
  return catalog.peaks.filter(row => Date.parse(row.peakUtc) >= start && Date.parse(row.peakUtc) <= end)
    .map(row => ({ ...row, source: { ...REVIEWED_METEOR_PEAK_SOURCE } }));
}
