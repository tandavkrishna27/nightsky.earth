import * as z from "zod4";
import { MAX_EVENT_RESULTS, placeIdSchema, resultSchema, sourceRecordSchema, timeWindowSchema, utcInstantSchema } from "./common";

export const searchSkyEventsInputSchema = z.strictObject({ placeId: placeIdSchema, window: timeWindowSchema, eventTypes: z.array(z.enum(["meteor-shower", "eclipse", "occultation", "planetary-conjunction", "opposition", "equinox-solstice", "moon-phase", "comet", "other"])).max(9).optional(), limit: z.number().int().min(1).max(MAX_EVENT_RESULTS).default(15) });
const calendarDateWindowSchema = z.strictObject({ startDate: z.string().date(), endDate: z.string().date() }).refine(({ startDate, endDate }) => endDate >= startDate, "Calendar date window end must not precede its start.");
export const skyEventSchema = z.strictObject({
  eventId: z.string().trim().min(1).max(160),
  name: z.string().trim().min(1).max(200),
  eventType: z.enum(["meteor-shower", "eclipse", "occultation", "planetary-conjunction", "opposition", "equinox-solstice", "moon-phase", "comet", "other"]),
  startUtc: utcInstantSchema.optional(), peakUtc: utcInstantSchema.optional(), endUtc: utcInstantSchema.optional(),
  activityCalendarDateWindow: calendarDateWindowSchema.optional(),
  peakCalendarDateWindow: calendarDateWindowSchema.optional(),
  localVisibility: z.enum(["visible", "partially-visible", "not-visible", "not-evaluated", "unknown"]),
  description: z.string().trim().max(800).optional(),
  source: sourceRecordSchema,
}).superRefine((event, ctx) => {
  const dates = [event.startUtc, event.peakUtc, event.endUtc].filter((value): value is string => value !== undefined).map(Date.parse);
  if (dates.some((value, index) => index > 0 && value < dates[index - 1]!)) ctx.addIssue({ code: "custom", message: "Event times must be ordered start, peak, end." });
});
export type SkyEvent = z.infer<typeof skyEventSchema>;
export const skyEventsResultSchema = resultSchema({
  placeId: placeIdSchema,
  window: timeWindowSchema,
  events: z.array(skyEventSchema).max(MAX_EVENT_RESULTS),
  unsupportedEventTypes: z.array(z.enum(["meteor-shower", "eclipse", "occultation", "planetary-conjunction", "opposition", "equinox-solstice", "moon-phase", "comet", "other"])).max(9),
});
export type EventResult = z.infer<typeof skyEventsResultSchema>;
