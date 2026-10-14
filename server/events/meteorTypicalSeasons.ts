import { meteorTypicalSeasonSchema, type MeteorTypicalSeason } from "../../shared/nightsky/events";
import type { SourceRecord } from "../../shared/nightsky/common";

export const METEOR_TYPICAL_SEASON_SOURCE: SourceRecord = {
 name: "Egal et al. (2020), Activity of the Eta-Aquariid and Orionid meteor showers",
 url: "https://doi.org/10.1051/0004-6361/202038115",
 attribution: "© A. Egal, P. G. Brown, J. Rendtel, M. Campbell-Brown and P. Wiegert 2020. A&A 640, A58, CC BY 4.0. Original analysis in Sections 6.1 and 7; intervals transcribed and metadata added by NightSky.earth.",
 dataClass: "context", product: "Original typical activity intervals; A&A 640 A58",
 vintage: "Egal-et-al-2020-AA640-A58", licenseUrl: "https://creativecommons.org/licenses/by/4.0/", modified: true,
};

/** Unfiltered reference metadata: no requested-year activity or overlap claim.
 * Source specifies J2000, but does not resolve apparent/geometric longitude.
 * Never feed these intervals into the bounded radiant evaluator as fit domains. */
export function meteorTypicalSeasons(): MeteorTypicalSeason[] {
 return [["ETA", "Eta Aquariids", 35, 60], ["ORI", "Orionids", 195, 220]].map(([code, name, start, end]) => meteorTypicalSeasonSchema.parse({
  code, name, solarLongitudeStartDeg: start, solarLongitudeEndDeg: end,
  evidenceKind: "typical-activity-interval", frame: "ecliptic J2000; solar longitude convention unspecified",
  dateConversion: "unavailable", requestedWindowOverlap: "not-evaluated",
  caveat: "Typical source activity interval, not a year-specific forecast, guaranteed season boundary, peak, rate or local visibility. UTC conversion and requested-window overlap are unavailable. Radiant fit validity is separate and is not extended by this interval.",
  source: { ...METEOR_TYPICAL_SEASON_SOURCE },
 }));
}
