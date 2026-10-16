import { meteorCalendarGuidanceSchema, type MeteorCalendarGuidance } from "../../shared/nightsky/events";
import { METEOR_TYPICAL_SEASON_SOURCE } from "./meteorTypicalSeasons";

export const GEMINID_CALENDAR_SOURCE = {
 name: "NASA/JPL, What's Up - December 2023",
 url: "https://www.jpl.nasa.gov/videos/whats-up-december-2023/",
 attribution: "Source reference: NASA/JPL, Preston Dyches, What's Up - December 2023 (2023-12-01). Annual calendar fact extracted and structured by NightSky.earth; no NASA/JPL endorsement or blanket transcript license asserted.",
 dataClass: "context" as const, product: "Annual Geminid calendar month fact from original skywatching transcript",
 vintage: "JPL-Whats-Up-2023-12-01", modified: true,
};

export const ADDITIONAL_CALENDAR_SOURCES = [
 {
  name: "NASA/JPL, What's Up - April 2023",
  url: "https://www.jpl.nasa.gov/videos/whats-up-april-2023/",
  attribution: "Source reference: NASA/JPL, Preston Dyches, What's Up - April 2023 (2023-03-31). Annual calendar fact extracted and structured by NightSky.earth; no NASA/JPL endorsement or blanket transcript license asserted.",
  dataClass: "context" as const, product: "Annual Lyrid calendar month fact from original skywatching transcript",
  vintage: "JPL-Whats-Up-2023-03-31", modified: true,
 },
 {
  name: "NASA/JPL-Caltech, What's Up: August 2021",
  url: "https://science.nasa.gov/resource/whats-up-august-2021/",
  attribution: "Source reference: NASA/JPL-Caltech, Preston Dyches, What's Up: August 2021 (2021-08-02). Annual calendar fact extracted and structured by NightSky.earth; no NASA/JPL endorsement or blanket transcript license asserted.",
  dataClass: "context" as const, product: "Annual Perseid calendar month fact from original skywatching narrative",
  vintage: "JPL-Whats-Up-2021-08-02", modified: true,
 },
 {
  name: "NASA/JPL, NASA Leonids Activities",
  url: "https://www.jpl.nasa.gov/news/nasa-leonids-activities-sleepheads-may-miss-spectacular-celestial-display/",
  attribution: "Source reference: NASA/JPL, NASA Leonids Activities: Sleepheads May Miss Spectacular Celestial Display, release 2001-219 (page dated 2001-11-19). Annual calendar fact extracted and structured by NightSky.earth; no NASA/JPL endorsement or blanket article license asserted.",
  dataClass: "context" as const, product: "Approximate annual Leonid calendar period from original agency release",
  vintage: "JPL-release-2001-219", modified: true,
 },
];

/** A58's introductory calendar wording, independently of its longitude intervals.
 * No numerical boundaries are assigned to "early" or "late". */
export function meteorCalendarGuidance(): MeteorCalendarGuidance {
 return meteorCalendarGuidanceSchema.parse({
  availability: { status: "partial", reason: "Approximate annual calendar wording is admitted for ETA, ORI, GEM, LYR, PER and LEO only; other showers remain unavailable pending source and reuse review. Missing guidance does not mean no meteor activity." },
  entries: [...[["ETA", "Eta Aquariids", "early May"], ["ORI", "Orionids", "late October"]].map(([code, name, sourceWording]) => ({
   code, name, sourceWording, evidenceKind: "approximate-calendar-guidance",
   precision: "verbal-period", recurrenceBasis: "typical-annual", requestedWindowOverlap: "not-evaluated",
   sourceLocator: "Section 1, introduction, page 1",
   caveat: "Published approximate annual context, not a year-specific forecast, exact peak, full activity season or local visibility. No calendar boundaries or UTC conversion are inferred; requested-window overlap is not evaluated. Radiant validity is separate.",
   source: { ...METEOR_TYPICAL_SEASON_SOURCE,
    product: "Introductory approximate annual calendar wording; A&A 640 A58",
    attribution: "© A. Egal, P. G. Brown, J. Rendtel, M. Campbell-Brown and P. Wiegert 2020. A&A 640, A58, CC BY 4.0. Calendar wording transcribed from Section 1; structured metadata added by NightSky.earth.",
   },
  })), {
   code: "GEM", name: "Geminids", sourceWording: "December",
   evidenceKind: "approximate-calendar-guidance", precision: "verbal-period",
   recurrenceBasis: "typical-annual", requestedWindowOverlap: "not-evaluated",
   sourceLocator: "Transcript, Geminids paragraph, opening annual-recurrence sentence",
   caveat: "Annual calendar month context only. It does not assert activity throughout December, a complete season, a year-specific peak or local visibility. No UTC boundaries or requested-window overlap are inferred; radiant validity is separate.",
   source: GEMINID_CALENDAR_SOURCE,
  }, ...[
   { code: "LYR", name: "Lyrids", sourceWording: "April", sourceLocator: "Transcript, Lyrids paragraph, opening annual-recurrence sentence" },
   { code: "PER", name: "Perseids", sourceWording: "August", sourceLocator: "Skywatching Tips from NASA, opening Perseids paragraph, annual-recurrence sentences" },
   { code: "LEO", name: "Leonids", sourceWording: "around Nov. 17 or 18", sourceLocator: "Release 2001-219, meteor explanation paragraph, annual-recurrence sentence" },
  ].map((row, index) => ({
   ...row, evidenceKind: "approximate-calendar-guidance", precision: "verbal-period",
   recurrenceBasis: "typical-annual", requestedWindowOverlap: "not-evaluated",
   caveat: "Approximate annual calendar context only, not activity throughout the named period, a complete season, a year-specific peak or local visibility. Verbal qualifiers are retained; no UTC boundaries or requested-window overlap are inferred. Radiant validity is separate.",
   source: ADDITIONAL_CALENDAR_SOURCES[index],
  }))],
 });
}
