import * as z from "zod4";
import { placeIdSchema, resultSchema, timeWindowSchema, utcInstantSchema } from "./common";

const localIntervalSchema = z.strictObject({
  startUtc: utcInstantSchema,
  endUtc: utcInstantSchema,
  localStart: z.string().trim().min(1).max(80),
  localEnd: z.string().trim().min(1).max(80),
}).refine((interval) => Date.parse(interval.endUtc) > Date.parse(interval.startUtc), "Interval end must follow its start.");

export const getAstronomyWindowInputSchema = z.strictObject({
  placeId: placeIdSchema,
  window: timeWindowSchema,
}).refine(({ window }) => Date.parse(window.endUtc) - Date.parse(window.startUtc) <= 5 * 24 * 60 * 60 * 1000, "Astronomy windows may not exceed 5 days.");

export const astronomyWindowResultSchema = resultSchema({
  placeId: placeIdSchema,
  window: timeWindowSchema,
  polarState: z.enum(["normal", "no-astronomical-darkness", "continuous-darkness", "unknown"]),
  astronomicalDarkness: z.discriminatedUnion("status", [
    z.strictObject({ status: z.literal("available"), ...localIntervalSchema.shape }),
    z.strictObject({ status: z.enum(["unavailable", "unknown"]), reason: z.string().trim().min(1).max(300) }),
  ]),
  twilightIntervals: z.array(z.strictObject({
    kind: z.enum(["civil", "nautical", "astronomical"]),
    ...localIntervalSchema.shape,
  })).max(24),
  moon: z.strictObject({
    phaseAtUtc: utcInstantSchema,
    phaseDegrees: z.number().finite().min(0).max(360),
    illuminationPercent: z.number().finite().min(0).max(100),
    maximumAltitudeDegrees: z.number().finite().min(-90).max(90),
    maximumAltitudeAtUtc: utcInstantSchema,
  }),
});
export type AstronomyWindowResult = z.infer<typeof astronomyWindowResultSchema>;

export const getTargetVisibilityInputSchema = z.strictObject({
  placeId: placeIdSchema,
  targetQuery: z.string().trim().min(1).max(120),
  window: timeWindowSchema,
}).refine(({ window }) => Date.parse(window.endUtc) - Date.parse(window.startUtc) <= 14 * 24 * 60 * 60 * 1000, "Target visibility windows may not exceed 14 days.");

export const targetVisibilityResultSchema = resultSchema({
  placeId: placeIdSchema,
  target: z.strictObject({ targetId: z.string().trim().min(1).max(120), name: z.string().trim().min(1).max(160), targetType: z.enum(["sun", "moon", "planet", "star", "deep-sky-object", "comet", "asteroid"]) }),
  intervals: z.array(z.strictObject({
    ...localIntervalSchema.shape,
    maximumAltitudeDegrees: z.number().finite().min(-90).max(90),
    azimuthDegrees: z.number().finite().min(0).max(360),
    moonSeparationDegrees: z.number().finite().min(0).max(180).optional(),
  })).max(24),
});
export type TargetVisibilityResult = z.infer<typeof targetVisibilityResultSchema>;

// The historical tool is not registered yet; migrate its legacy import names
// together with the planner before an artifact reader is enabled.
export { getClearSkyClimatologyInputSchema, climateContextResultSchema as clearSkyClimatologyResultSchema } from "./climate";
