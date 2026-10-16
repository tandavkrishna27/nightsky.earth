import { meteorCalendarGuidanceSchema, type MeteorCalendarGuidance } from "../../shared/nightsky/events";
import { METEOR_TYPICAL_SEASON_SOURCE } from "./meteorTypicalSeasons";

/** A58's introductory calendar wording, independently of its longitude intervals.
 * No numerical boundaries are assigned to "early" or "late". */
export function meteorCalendarGuidance(): MeteorCalendarGuidance {
 return meteorCalendarGuidanceSchema.parse({
  availability: { status: "partial", reason: "Approximate annual calendar wording is admitted for ETA and ORI only; other showers remain unavailable pending source and reuse review. Missing guidance does not mean no meteor activity." },
  entries: [["ETA", "Eta Aquariids", "early May"], ["ORI", "Orionids", "late October"]].map(([code, name, sourceWording]) => ({
   code, name, sourceWording, evidenceKind: "approximate-calendar-guidance",
   precision: "verbal-period", recurrenceBasis: "typical-annual", requestedWindowOverlap: "not-evaluated",
   sourceLocator: "Section 1, introduction, page 1",
   caveat: "Published approximate annual context, not a year-specific forecast, exact peak, full activity season or local visibility. No calendar boundaries or UTC conversion are inferred; requested-window overlap is not evaluated. Radiant validity is separate.",
   source: { ...METEOR_TYPICAL_SEASON_SOURCE,
    product: "Introductory approximate annual calendar wording; A&A 640 A58",
    attribution: "© A. Egal, P. G. Brown, J. Rendtel, M. Campbell-Brown and P. Wiegert 2020. A&A 640, A58, CC BY 4.0. Calendar wording transcribed from Section 1; structured metadata added by NightSky.earth.",
   },
  })),
 });
}
