import { selectionRevisionRefinement } from "./common";
import * as z from "zod4";
import { ianaTimeZoneSchema } from "./common";
import { MAX_EVENT_RESULTS, placeIdSchema, resultSchema, sourceRecordSchema, timeWindowSchema, utcInstantSchema } from "./common";

export const searchSkyEventsInputSchema = z.strictObject({ placeId: placeIdSchema, sourceRevision: z.string().regex(/^[a-f0-9]{64}$/).optional(), catalogueRevision: z.string().trim().min(1).max(100).optional(), displayTimeZone: ianaTimeZoneSchema.optional(), window: timeWindowSchema, eventTypes: z.array(z.enum(["meteor-shower", "eclipse", "occultation", "planetary-conjunction", "opposition", "greatest-elongation", "equinox-solstice", "moon-phase", "comet", "other"])).max(10).optional(), limit: z.number().int().min(1).max(MAX_EVENT_RESULTS).default(15) }).superRefine(selectionRevisionRefinement);
const calendarDateWindowSchema = z.strictObject({ startDate: z.string().date(), endDate: z.string().date() }).refine(({ startDate, endDate }) => endDate >= startDate, "Calendar date window end must not precede its start.");
export const PLANET_PAIR_BODIES = ["Mercury", "Venus", "Mars", "Jupiter", "Saturn", "Uranus", "Neptune"] as const;
const pairBodiesSchema = z.tuple([z.enum(PLANET_PAIR_BODIES), z.enum(PLANET_PAIR_BODIES)]).refine(bodies => PLANET_PAIR_BODIES.indexOf(bodies[0]) < PLANET_PAIR_BODIES.indexOf(bodies[1]), "Pair bodies must be distinct and in canonical order.");
export const pairConjunctionSchema = z.strictObject({ bodies: pairBodiesSchema, definition: z.literal("geocentric-right-ascension-of-date"), corrections: z.literal("light-time-and-aberration"), angularSeparationDeg: z.number().finite().min(0).max(180), crossingDirection: z.enum(["ascending", "descending"]) });
export const planetPairCoverageSchema = z.strictObject({
  status: z.enum(["partial", "out-of-horizon"]), completeness: z.literal("not-certified"),
  supportedStartUtc: z.literal("2025-01-01T00:00:00.000Z"), supportedEndUtc: z.literal("2027-12-31T23:59:59.999Z"), pairCount: z.literal(21),
  unresolved: z.array(z.strictObject({ bodies: pairBodiesSchema, startUtc: utcInstantSchema, endUtc: utcInstantSchema, reason: z.string().trim().min(1).max(200) }).refine(row => Date.parse(row.endUtc) >= Date.parse(row.startUtc), "Unresolved interval must be ordered.")).max(256),
});
export type PlanetPairCoverage = z.infer<typeof planetPairCoverageSchema>;
export const skyEventSchema = z.strictObject({
  eventId: z.string().trim().min(1).max(160),
  name: z.string().trim().min(1).max(200),
  eventType: z.enum(["meteor-shower", "eclipse", "occultation", "planetary-conjunction", "opposition", "greatest-elongation", "equinox-solstice", "moon-phase", "comet", "other"]),
  startUtc: utcInstantSchema.optional(), peakUtc: utcInstantSchema.optional(), endUtc: utcInstantSchema.optional(),
  activityCalendarDateWindow: calendarDateWindowSchema.optional(),
  peakCalendarDateWindow: calendarDateWindowSchema.optional(),
  greatestElongation: z.strictObject({ body: z.enum(["Mercury", "Venus"]), elongationDeg: z.number().finite().min(0).max(180), viewingGeometry: z.enum(["morning", "evening"]) }).optional(),
  pairConjunction: pairConjunctionSchema.optional(),
  localVisibility: z.enum(["visible", "partially-visible", "not-visible", "not-evaluated", "unknown"]),
  description: z.string().trim().max(800).optional(),
  source: sourceRecordSchema,
}).superRefine((event, ctx) => {
  if (event.pairConjunction !== undefined) {
    if (event.eventType !== "planetary-conjunction" || !event.peakUtc || event.localVisibility !== "not-evaluated") ctx.addIssue({ code: "custom", message: "Pair conjunction metadata requires an instantaneous planetary conjunction with unevaluated local visibility." });
    if (event.startUtc !== undefined || event.endUtc !== undefined || event.activityCalendarDateWindow !== undefined || event.peakCalendarDateWindow !== undefined) ctx.addIssue({ code: "custom", message: "Pair conjunction is a crossing instant, not a duration or calendar interval." });
  }
  if (event.eventType === "greatest-elongation") {
    if (!event.greatestElongation || !event.peakUtc) ctx.addIssue({ code: "custom", message: "Greatest elongation requires its geometry and peak instant." });
    if (event.startUtc !== undefined || event.endUtc !== undefined || event.activityCalendarDateWindow !== undefined || event.peakCalendarDateWindow !== undefined) ctx.addIssue({ code: "custom", message: "Greatest elongation is an instant, not an activity or calendar interval." });
    if (event.localVisibility !== "not-evaluated") ctx.addIssue({ code: "custom", message: "Greatest elongation geometry does not establish local visibility." });
  } else if (event.greatestElongation !== undefined) {
    ctx.addIssue({ code: "custom", message: "Greatest elongation metadata is only valid for greatest-elongation events." });
  }
  const dates = [event.startUtc, event.peakUtc, event.endUtc].filter((value): value is string => value !== undefined).map(Date.parse);
  if (dates.some((value, index) => index > 0 && value < dates[index - 1]!)) ctx.addIssue({ code: "custom", message: "Event times must be ordered start, peak, end." });
});
export type SkyEvent = z.infer<typeof skyEventSchema>;
// Reference evidence is deliberately separate from date-filtered SkyEvents.
export const meteorTypicalSeasonSchema = z.strictObject({
  code: z.enum(["ETA", "ORI"]), name: z.string().trim().min(1).max(100),
  evidenceKind: z.literal("typical-activity-interval"),
  solarLongitudeStartDeg: z.number().finite().min(0).max(360),
  solarLongitudeEndDeg: z.number().finite().min(0).max(360),
  frame: z.literal("ecliptic J2000; solar longitude convention unspecified"),
  dateConversion: z.literal("unavailable"), requestedWindowOverlap: z.literal("not-evaluated"),
  caveat: z.string().trim().min(1).max(500), source: sourceRecordSchema,
}).refine(row => row.solarLongitudeEndDeg >= row.solarLongitudeStartDeg, "Source longitude interval must be ordered.");
export type MeteorTypicalSeason = z.infer<typeof meteorTypicalSeasonSchema>;
// Published verbal recurrence is reference guidance, never a dated SkyEvent.
export const meteorCalendarGuidanceSchema = z.strictObject({
  availability: z.strictObject({ status: z.literal("partial"), reason: z.string().trim().min(1).max(500) }),
  entries: z.array(z.strictObject({
    code: z.enum(["ETA", "ORI", "GEM", "LYR", "PER", "LEO", "QUA", "DSX", "ARI", "CAP", "DRA", "NTA", "STA", "HYD", "AND", "SDA", "URS", "ZPE"]), name: z.string().trim().min(1).max(100),
    evidenceKind: z.literal("approximate-calendar-guidance"),
    sourceWording: z.string().trim().min(1).max(100),
    precision: z.literal("verbal-period"), recurrenceBasis: z.literal("typical-annual"),
    requestedWindowOverlap: z.literal("not-evaluated"),
    sourceLocator: z.string().trim().min(1).max(200),
    caveat: z.string().trim().min(1).max(500), source: sourceRecordSchema,
  })).max(18).refine(rows => new Set(rows.map(row => row.code)).size === rows.length, "Duplicate calendar guidance code."),
});
export type MeteorCalendarGuidance = z.infer<typeof meteorCalendarGuidanceSchema>;
export const meteorCivilGuidanceSchema = z.strictObject({
  code: z.enum(["LYR", "LEO"]), name: z.string().min(1).max(100),
  evidenceKind: z.literal("source-civil-calendar-guidance"), recurrenceBasis: z.literal("typical-annual"), calendar: z.literal("Gregorian"),
  startMonthDay: z.string().regex(/^(04-16|11-06)$/), endMonthDay: z.string().regex(/^(04-25|11-30)$/),
  endpointMeaning: z.literal("source-named-calendar-days; exact activity boundaries unspecified"), timeZoneBasis: z.literal("unspecified-by-source"),
  maximumYear: z.literal(2026), maximumWording: z.string().min(1).max(150), maximumTimeBasis: z.literal("UT-as-published"),
  maximumUncertainty: z.literal("approximate; numerical uncertainty not supplied"), geographicQualification: z.string().min(1).max(200),
  requestedWindowOverlap: z.literal("not-evaluated"), sourceLocator: z.string().min(1).max(200), caveat: z.string().min(1).max(500), source: sourceRecordSchema,
}).refine(row => row.code === "LYR" ? row.startMonthDay === "04-16" && row.endMonthDay === "04-25" : row.startMonthDay === "11-06" && row.endMonthDay === "11-30", "Civil guidance dates must match the source shower.");
export const skyEventsResultSchema = resultSchema({
  sourceRevision:z.string().regex(/^[a-f0-9]{64}$/).optional(),
  placeId: placeIdSchema,
  window: timeWindowSchema,
  events: z.array(skyEventSchema).max(MAX_EVENT_RESULTS),
  meteorCalendarGuidance: meteorCalendarGuidanceSchema.optional(),
  meteorCivilGuidance: z.array(meteorCivilGuidanceSchema).max(2).optional(),
  planetPairCoverage: planetPairCoverageSchema.optional(),
  meteorTypicalSeasons: z.array(meteorTypicalSeasonSchema).max(2).refine(rows => new Set(rows.map(row => row.code)).size === rows.length, "Duplicate typical season code.").optional(),
  unsupportedEventTypes: z.array(z.enum(["meteor-shower", "eclipse", "occultation", "planetary-conjunction", "opposition", "greatest-elongation", "equinox-solstice", "moon-phase", "comet", "other"])).max(10),
});
export type EventResult = z.infer<typeof skyEventsResultSchema>;

export const conjunctionWindowSchema = z.strictObject({
  eventId: z.string().min(1).max(160), bodies: pairBodiesSchema,
  startUtc: utcInstantSchema, endUtc: utcInstantSchema,
  method: z.literal("15-minute-point-samples"), horizonBasis: z.literal("geometric-center-zero-degrees"),
  continuousVisibility: z.literal("not-established"), detectability: z.literal("not-assessed"),
  samples: z.array(z.strictObject({ atUtc: utcInstantSchema, altitudeDeg: z.tuple([z.number().finite().min(-90).max(90), z.number().finite().min(-90).max(90)]), sunAltitudeDeg: z.number().finite().min(-90).max(90), moonAltitudeDeg: z.number().finite().min(-90).max(90), moonIlluminationPercent: z.number().finite().min(0).max(100) })).min(2).max(97),
}).superRefine((row, ctx) => {
  const start = Date.parse(row.startUtc), end = Date.parse(row.endUtc);
  if (row.samples.length < 2 || !(end > start) || end - start > 86400000 || Date.parse(row.samples[0].atUtc) !== start || Date.parse(row.samples[row.samples.length - 1].atUtc) !== end || row.samples.some((sample, i) => i > 0 && (Date.parse(sample.atUtc) <= Date.parse(row.samples[i - 1].atUtc) || Date.parse(sample.atUtc) - Date.parse(row.samples[i - 1].atUtc) > 900000))) ctx.addIssue({ code: "custom", message: "Samples must cover ordered endpoints within 24 hours at gaps of at most 15 minutes." });
});
export type ConjunctionWindow = z.infer<typeof conjunctionWindowSchema>;
