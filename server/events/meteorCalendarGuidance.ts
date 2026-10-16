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


const SOURCE_CLOSURE_GUIDANCE = [
 { code: "QUA", name: "Quadrantids", sourceWording: "early-January", sourceLocator: "About the Meteor Shower, opening annual-recurrence sentence", sourceName: "NASA Science, Quadrantids Meteor Shower", url: "https://science.nasa.gov/solar-system/meteors-meteorites/quadrantids/", vintage: "NASA-Quadrantids-narrative-reviewed-2026-10-16", daytime: false },
 { code: "DSX", name: "Daytime Sextantids", sourceWording: "late September and early October", sourceLocator: "Section 1, introduction, annual Daytime Sextantid description", sourceName: "Kipreos, Campbell-Brown, Brown and Vida (2022), Characterizing the Daytime Sextantids, arXiv 2208.03521v1", url: "https://arxiv.org/html/2208.03521v1", vintage: "Kipreos-et-al-2208.03521v1", daytime: true },
 { code: "ARI", name: "Daytime Arietids", sourceWording: "on or near June 8th", sourceLocator: "Narrative paragraph beginning Meteors and meteor showers can occur in the daytime", sourceName: "NOAA/NWS Sioux Falls, Meteors and Meteor Showers", url: "https://www.weather.gov/fsd/meteor", vintage: "NWS-FSD-meteor-narrative-reviewed-2026-10-16", daytime: true },
 { code: "CAP", name: "Alpha Capricornids", sourceWording: "late July", sourceLocator: "Event narrative, Every year sentence preceding This year peak statement", sourceName: "Lowell Observatory, Two Meteor Showers: One Fabulous Night, Night Sky Network listing (2020-07-28)", url: "https://nightsky.jpl.nasa.gov/events/12408/", vintage: "Lowell-NSN-12408-2020-07-28", daytime: false },
 { code: "DRA", name: "October Draconids", sourceWording: "October", sourceLocator: "Explanation, final recurrence sentence: occur every October", sourceName: "Robert Nemiroff and Jerry Bonnell, APOD: Draconid Meteors Over Spain (2011-10-19)", url: "https://science.nasa.gov/image-article/apod-2011-october-19-draconid-meteors-over-spain/", vintage: "APOD-2011-10-19-narrative-reviewed-2026-10-16", daytime: false },
 { code: "NTA", name: "Northern Taurids", sourceWording: "middle and late November", sourceLocator: "Section 3.2, Average activity, sentence contrasting STA and NTA average visual/video profiles", sourceName: "Egal, Brown, Wiegert and Kipreos (2022), An observational synthesis of the Taurid meteor complex, arXiv 2202.05141v1", url: "https://arxiv.org/html/2202.05141v1", vintage: "Egal-et-al-2202.05141v1", daytime: false },
 { code: "STA", name: "Southern Taurids", sourceWording: "October and early November", sourceLocator: "Section 3.2, Average activity, sentence contrasting STA and NTA average visual/video profiles", sourceName: "Egal, Brown, Wiegert and Kipreos (2022), An observational synthesis of the Taurid meteor complex, arXiv 2202.05141v1", url: "https://arxiv.org/html/2202.05141v1", vintage: "Egal-et-al-2202.05141v1", daytime: false },
 { code: "HYD", name: "Sigma Hydrids", sourceWording: "December", sourceLocator: "Explanation, second paragraph, relative clause: peaks yearly in December", sourceName: "Robert Nemiroff and Jerry Bonnell, APOD: Comet Nishimura Grows (2023-09-09)", url: "https://science.nasa.gov/image-article/apod-2023-september-9-comet-nishimura-grows/", vintage: "APOD-2023-09-09-narrative-reviewed-2026-10-16", daytime: false },
 { code: "AND", name: "Andromedids", sourceWording: "early November", sourceLocator: "Introduction, opening sentence describing low annual activity during most years", sourceName: "Peter Jenniskens and Nick Moskovitz (2021), An outburst of Andromedids on November 28, 2021", url: "https://www.emeteornews.net/2021/12/01/andromedid-activity-in-2021/", vintage: "Jenniskens-Moskovitz-2021-12-01-reviewed-2026-10-16", daytime: false, qualification: "The source describes low annual activity in most years; late-November and early-December outbursts are separate and are not forecast by this period." },
 { code: "SDA", name: "Southern Delta Aquariids", sourceWording: "end of July", sourceLocator: "Introduction, opening paragraph; annual context in Discussion of SDA activity between 2000 and 2025, opening paragraph", sourceName: "Koen Miskotte (2026), The Southern Delta Aquariids 2000-2025", url: "https://www.emeteornews.net/2026/03/30/the-southern-delta-aquariids-2000-2025/", vintage: "Miskotte-2026-03-30-reviewed-2026-10-16", daytime: false, qualification: "Annual strength varies; this period does not predict any year's activity level." },
 { code: "URS", name: "Ursids", sourceWording: "December", sourceLocator: "PDF page 1, Introduction, opening annual-display sentence; month only, not the adjacent numerical dates or peak", sourceName: "Madiedo et al. (2021), The Ursid Meteor Outburst in 2020: Preliminary Results, LPSC abstract 1275", url: "https://www.hou.usra.edu/meetings/lpsc2021/pdf/1275.pdf", vintage: "LPSC-2021-2548-1275-reviewed-2026-10-16", daytime: false },
 { code: "ZPE", name: "Daytime Zeta Perseids", sourceWording: "first half of June", sourceLocator: "Section 5 opening, printed page 37 / PDF page 7; annual context in Section 1, printed page 32 / PDF page 2", sourceName: "Porubčan et al. (2007), Summer streams of the Taurid meteor complex, CAOSP 37, 31-48", url: "https://www.ta3.sk/caosp/Eedition/FullTexts/vol37no1/pp31-48.pdf", vintage: "Porubcan-et-al-2007-CAOSP37-31-48-reviewed-2026-10-16", daytime: true },
].map(({sourceName, url, vintage, daytime, qualification, ...row}) => ({
 ...row, evidenceKind: "approximate-calendar-guidance", precision: "verbal-period",
 recurrenceBasis: "typical-annual", requestedWindowOverlap: "not-evaluated",
 caveat: "Approximate annual context only; no exact season, year-specific peak, local visibility or requested-window overlap is inferred. Radiant validity is separate." + (daytime ? " This is a daytime shower; annual timing is not a recommendation for nighttime visual observing." : "") + (qualification ? ` ${qualification}` : ""),
 source: {name: sourceName, url, vintage, dataClass: "context", modified: true,
  product: "Individual annual calendar fact from original explanatory narrative",
  attribution: `Source reference: ${sourceName}. Annual calendar fact extracted and structured by NightSky.earth; no blanket article license or endorsement asserted.`,
 },
}));

/** A58's introductory calendar wording, independently of its longitude intervals.
 * No numerical boundaries are assigned to "early" or "late". */
export function meteorCalendarGuidance(): MeteorCalendarGuidance {
 return meteorCalendarGuidanceSchema.parse({
  availability: { status: "partial", reason: "Approximate annual calendar wording is admitted for ETA, ORI, GEM, LYR, PER, LEO, QUA, DSX, ARI, CAP, DRA, NTA, STA, HYD, AND, SDA, URS and ZPE only; other showers remain unavailable pending source and reuse review. Missing guidance does not mean no meteor activity." },
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
  })), ...SOURCE_CLOSURE_GUIDANCE],
 });
}
