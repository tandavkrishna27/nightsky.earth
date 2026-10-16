import * as z from "zod4";
import { ianaTimeZoneSchema } from "./common";
import { MAX_EVENT_RESULTS, placeIdSchema, resultSchema, sourceRecordSchema, timeWindowSchema, utcInstantSchema } from "./common";

export const searchSkyEventsInputSchema = z.strictObject({ placeId: placeIdSchema, catalogueRevision: z.string().trim().min(1).max(100).optional(), displayTimeZone: ianaTimeZoneSchema.optional(), window: timeWindowSchema, eventTypes: z.array(z.enum(["meteor-shower", "eclipse", "occultation", "planetary-conjunction", "opposition", "greatest-elongation", "equinox-solstice", "moon-phase", "comet", "other"])).max(10).optional(), limit: z.number().int().min(1).max(MAX_EVENT_RESULTS).default(15) });
const calendarDateWindowSchema = z.strictObject({ startDate: z.string().date(), endDate: z.string().date() }).refine(({ startDate, endDate }) => endDate >= startDate, "Calendar date window end must not precede its start.");
export const skyEventSchema = z.strictObject({
  eventId: z.string().trim().min(1).max(160),
  name: z.string().trim().min(1).max(200),
  eventType: z.enum(["meteor-shower", "eclipse", "occultation", "planetary-conjunction", "opposition", "greatest-elongation", "equinox-solstice", "moon-phase", "comet", "other"]),
  startUtc: utcInstantSchema.optional(), peakUtc: utcInstantSchema.optional(), endUtc: utcInstantSchema.optional(),
  activityCalendarDateWindow: calendarDateWindowSchema.optional(),
  peakCalendarDateWindow: calendarDateWindowSchema.optional(),
  greatestElongation: z.strictObject({ body: z.enum(["Mercury", "Venus"]), elongationDeg: z.number().finite().min(0).max(180), viewingGeometry: z.enum(["morning", "evening"]) }).optional(),
  localVisibility: z.enum(["visible", "partially-visible", "not-visible", "not-evaluated", "unknown"]),
  description: z.string().trim().max(800).optional(),
  source: sourceRecordSchema,
}).superRefine((event, ctx) => {
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
export const skyEventsResultSchema = resultSchema({
  placeId: placeIdSchema,
  window: timeWindowSchema,
  events: z.array(skyEventSchema).max(MAX_EVENT_RESULTS),
  meteorCalendarGuidance: meteorCalendarGuidanceSchema.optional(),
  meteorTypicalSeasons: z.array(meteorTypicalSeasonSchema).max(2).refine(rows => new Set(rows.map(row => row.code)).size === rows.length, "Duplicate typical season code.").optional(),
  unsupportedEventTypes: z.array(z.enum(["meteor-shower", "eclipse", "occultation", "planetary-conjunction", "opposition", "greatest-elongation", "equinox-solstice", "moon-phase", "comet", "other"])).max(10),
});
export type EventResult = z.infer<typeof skyEventsResultSchema>;
