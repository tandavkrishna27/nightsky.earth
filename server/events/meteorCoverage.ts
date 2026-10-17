import { readFileSync } from "node:fs";
import { validateReviewedMeteorPeakCatalog } from "./meteorPeaks";
import { meteorCalendarGuidance } from "./meteorCalendarGuidance";
import { meteorCivilGuidance } from "./meteorCivilGuidance";
import { METEOR_CODES } from "../../shared/nightsky/meteors";

import * as z from "zod4";

const retainedCodes = METEOR_CODES;
const inventorySchema = z.strictObject({
 schemaVersion: z.literal(1), selectionStatus: z.literal("pending-owner-decision"),
 maintainedSelection: z.null(), maintenanceOwner: z.null(), nextReviewDate: z.null(),
 reviewedPeakYears: z.tuple([z.literal(2025), z.literal(2026), z.literal(2027)]),
 retainedCodes: z.array(z.enum(retainedCodes)).length(19).refine(rows => new Set(rows).size === 19),
 completeActivityEvidence: z.array(z.never()).length(0), caveat: z.string().min(1),
});
// Exact consumed domain fields from the reviewed GMN 2021 admission. Any
// replacement model/anchor/window requires a separate scientific admission.
const reviewedRadiantDomains: Record<string, readonly [number, number]> = {
 PER: [140.1, 9], GEM: [262.2, 3], ORI: [209.2, 7], ETA: [45.12, 9],
 LYR: [32.5, 3], SDA: [126.7, 5], QUA: [283, 1], LEO: [235.5, 7],
 CAP: [125.48, 7], NTA: [235.8, 15], STA: [218, 19], HYD: [254.8, 15],
};
const radiantDomainSchema = z.object({
 schemaVersion: z.literal(1),
 vintage: z.literal("Moorhead-Clements-Vida-2021-arxiv2205.15423v1"),
 sourceUrl: z.literal("https://arxiv.org/abs/2205.15423v1"),
 licenseUrl: z.literal("https://creativecommons.org/licenses/by/4.0/"),
 frame: z.literal("J2000 mean ecliptic; Sun-centered geocentric radiant"),
 localCalculationYears: z.object({first: z.literal(2018), last: z.literal(2030)}),
 fitWindowConversionDegPerDay: z.literal(0.986),
 rows: z.array(z.object({code: z.enum(retainedCodes), referenceSolarLongitudeDeg: z.number().finite().min(0).max(360), nominalFitDays: z.number().finite().positive()})).length(12)
  .refine(rows => new Set(rows.map(row => row.code)).size === 12)
  .refine(rows => rows.every(row => {
   const reviewed = reviewedRadiantDomains[row.code];
   return reviewed !== undefined && row.referenceSolarLongitudeDeg === reviewed[0] && row.nominalFitDays === reviewed[1];
  }), "Radiant code, anchor and fit width must match the reviewed domain admission."),
});
/** Validate inventory policy and the bounded fields used here; peak admission remains source-specific. */
export function validateMeteorEvidenceArtifacts(inventoryInput: unknown, radiantInput: unknown) {
 return {inventory: inventorySchema.parse(inventoryInput), radiants: radiantDomainSchema.parse(radiantInput)};
}
const {inventory, radiants} = validateMeteorEvidenceArtifacts(
 JSON.parse(readFileSync("data/events/meteor-evidence-inventory-v1.json", "utf8")),
 JSON.parse(readFileSync("data/events/meteor-radiants-gmn-2021.json", "utf8")),
);
export interface MeteorCoverageEvidence {
 status: "supported" | "partial" | "missing" | "out-of-horizon";
 references: string[];
 contextReferences?: string[];
 domain?: {frame: string; anchorDeg: number; halfWidthDeg: number; firstYear: number; lastYear: number};
}
export interface MeteorCoverageRow {
 code: string; year: number; selection: "pending-owner-decision";
 peak: MeteorCoverageEvidence; activity: MeteorCoverageEvidence; radiant: MeteorCoverageEvidence;
}
/** Artifact inventory only. No selected visual scope, recurrence, activity interval or visibility claim. */
export function meteorCoverage(year: number): MeteorCoverageRow[] {
 if (!Number.isInteger(year) || year < 1 || year > 9999) throw new TypeError("Inventory year must be an integer from 1 to 9999.");
 const peakFile = `data/events/meteor-peaks-nasa-${year}.json`;
 const peaks = inventory.reviewedPeakYears.some(value => value === year)
  ? validateReviewedMeteorPeakCatalog(year, JSON.parse(readFileSync(peakFile, "utf8"))).peaks : undefined;
 const verbalCodes = new Set<string>(meteorCalendarGuidance().entries.map(row => row.code));
 const civilCodes = new Set<string>(meteorCivilGuidance().map(row => row.code));
 return inventory.retainedCodes.map(code => {
  const fit = radiants.rows.find(row => row.code === code);
  const withinFitYears = year >= radiants.localCalculationYears.first && year <= radiants.localCalculationYears.last;
  return { code, year, selection: "pending-owner-decision",
   peak: {status: !peaks ? "out-of-horizon" : peaks.some(row => row.code === code) ? "supported" : "missing",
    references: peaks?.some(row => row.code === code) ? [`${peakFile}#${code}`] : []},
   activity: {status: "missing", references: [], contextReferences: [
    ...(code === "ETA" || code === "ORI" ? [`server/events/meteorTypicalSeasons.ts#${code}`] : []),
    ...(verbalCodes.has(code) ? [`server/events/meteorCalendarGuidance.ts#${code}`] : []),
    ...(civilCodes.has(code) ? [`server/events/meteorCivilGuidance.ts#${code}`] : []),
   ]},
   radiant: {status: !fit ? "missing" : withinFitYears ? "partial" : "out-of-horizon",
    references: fit ? [`data/events/meteor-radiants-gmn-2021.json#${code}`] : [],
    ...(fit ? {domain: {frame: radiants.frame, anchorDeg: fit.referenceSolarLongitudeDeg,
     halfWidthDeg: fit.nominalFitDays * radiants.fitWindowConversionDegPerDay / 2,
     firstYear: radiants.localCalculationYears.first, lastYear: radiants.localCalculationYears.last}} : {})},
  };
 });
}
/** Reject assertions beyond the current retained artifacts; reference strings alone are not admission. */
export function validateMeteorCoverage(rows: readonly MeteorCoverageRow[]): void {
 const keys = rows.map(row => `${row.year}:${row.code}`);
 if (new Set(keys).size !== keys.length) throw new TypeError("Duplicate code/year inventory entry.");
 for (const year of Array.from(new Set(rows.map(row => row.year)))) {
  const expected = meteorCoverage(year);
  const actual = rows.filter(row => row.year === year);
  if (actual.length !== expected.length || actual.some(row => !inventory.retainedCodes.some(code => code === row.code))) throw new TypeError("Inventory must preserve all retained identities.");
  for (const row of actual) {
   const admitted = expected.find(entry => entry.code === row.code)!;
   for (const component of ["peak", "activity", "radiant"] as const) {
    if (JSON.stringify(row[component]) !== JSON.stringify(admitted[component])) throw new TypeError(`Invalid ${component} state, domain or evidence reference for ${row.code}/${year}.`);
   }
   if (row.selection !== admitted.selection) throw new TypeError("Maintained selection requires an owner decision.");
  }
 }
 if (!rows.length) throw new TypeError("Inventory must preserve all retained identities.");
}




