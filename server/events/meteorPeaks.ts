import { readFileSync } from "node:fs";
import * as z from "zod4";
import type { SourceRecord } from "../../shared/nightsky/common";

const catalogSchema = z.strictObject({
  schemaVersion: z.literal(1), vintage: z.string(), reviewedAt: z.string().datetime(),
  sourceUrl: z.url(), rightsEvidenceUrl: z.url(),
  table: z.string(), coverage: z.string(),
  peaks: z.array(z.strictObject({ code: z.string(), id: z.string(), name: z.string(), peakUtc: z.string().datetime() })),
});
const earlierCodes = ["QUA", "ETA", "ZPE", "ARI", "SSG", "SDA", "CAP", "PER", "DSX", "DRA", "AND", "GEM", "URS"];
const admittedCodes: Record<number, readonly string[]> = {
  2025: earlierCodes, 2026: earlierCodes,
  2027: ["QUA", "ETA", "ZPE", "ARI", "SDA", "CAP", "PER", "DSX", "DRA", "LEO", "GEM", "URS"],
};
export function validateReviewedMeteorPeakCoverage(year: number, peaks: readonly {code: string; peakUtc: string}[]): void {
  const expected = admittedCodes[year];
  if (!expected || peaks.length !== expected.length || new Set(peaks.map(row => row.code)).size !== expected.length ||
    peaks.some(row => !expected.includes(row.code) || !row.peakUtc.startsWith(`${year}-`))) {
    throw new TypeError(`Invalid reviewed ${year} peak coverage.`);
  }
}
// Each reviewed revision is an explicit admission. A new year or replacement report
// requires its own rights/table/value review before this registry is extended.
const admittedReports: Record<number, { citation: string; issued: string; table: string }> = {
  2025: { citation: "20240012381", issued: "2024-10-18", table: "Table 3, page 9" },
  2026: { citation: "20250009524", issued: "2025-10-17", table: "Table 3, page 8" },
  2027: { citation: "20260009360", issued: "2026-10-16", table: "Table 3, page 9" },
};
export function validateReviewedMeteorPeakCatalog(year: number, input: unknown) {
  const report = admittedReports[year];
  if (!report) throw new TypeError(`No reviewed ${year} peak admission.`);
  const reviewedSchema = catalogSchema.extend({
    vintage: z.literal(`NASA-MEO-${year}-issued-${report.issued}`),
    sourceUrl: z.literal(`https://ntrs.nasa.gov/api/citations/${report.citation}/downloads/LEO_Forecast_${year}.pdf`),
    rightsEvidenceUrl: z.literal(`https://ntrs.nasa.gov/citations/${report.citation}`),
    table: z.literal(report.table),
    rightsStatement: z.literal(year === 2025
      ? "Work of the US Gov. Public Use Permitted."
      : "NASA NTRS PUBLIC distribution; GOV_PUBLIC_USE_PERMITTED. Ownership not inferred."),
  });
  const catalog = reviewedSchema.parse(input);
  validateReviewedMeteorPeakCoverage(year, catalog.peaks);
  return catalog;
}
const catalogs = [2025, 2026, 2027].map(year => {
  const catalog = validateReviewedMeteorPeakCatalog(year, JSON.parse(readFileSync(`data/events/meteor-peaks-nasa-${year}.json`, "utf8")));
  const source: SourceRecord = {
    name: "NASA Meteoroid Environment Office", url: catalog.sourceUrl,
    attribution: `NASA MEO, The ${year} meteor shower activity forecast for low Earth orbit, ${catalog.table}. ${year === 2027 ? "Source UT times at minute precision represented as ISO UTC by NightSky.earth; no subminute UTC accuracy established." : "Selected forecast maxima normalized to UTC by NightSky.earth."}`,
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
