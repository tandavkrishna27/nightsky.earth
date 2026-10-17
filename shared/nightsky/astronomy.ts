import { selectionRevisionRefinement } from "./common";
import * as z from "zod4";
import { ianaTimeZoneSchema } from "./common";
import { placeIdSchema, resultSchema, timeWindowSchema, utcInstantSchema } from "./common";

const localIntervalSchema = z.strictObject({
  startUtc: utcInstantSchema,
  endUtc: utcInstantSchema,
  localStart: z.string().trim().min(1).max(80),
  localEnd: z.string().trim().min(1).max(80),
}).refine((interval) => Date.parse(interval.endUtc) > Date.parse(interval.startUtc), "Interval end must follow its start.");

export const getAstronomyWindowInputSchema = z.strictObject({
  placeId: placeIdSchema,
  sourceRevision: z.string().regex(/^[a-f0-9]{64}$/).optional(), catalogueRevision: z.string().trim().min(1).max(100).optional(),
  displayTimeZone: ianaTimeZoneSchema.optional(),
  window: timeWindowSchema,
}).superRefine(selectionRevisionRefinement).refine(({ window }) => Date.parse(window.endUtc) - Date.parse(window.startUtc) <= 5 * 24 * 60 * 60 * 1000, "Astronomy windows may not exceed 5 days.");

export const astronomyWindowResultSchema = resultSchema({
  sourceRevision:z.string().regex(/^[a-f0-9]{64}$/).optional(),
  placeId: placeIdSchema,
  window: timeWindowSchema,
  darknessState: z.enum(["full-window", "partial-window", "none", "unknown"]).describe("Astronomical darkness coverage of the requested window only: full-window covers all of it; partial-window covers part; none has no calculated darkness; unknown is unavailable evidence."),
  astronomicalDarkness: z.discriminatedUnion("status", [
    z.strictObject({ status: z.literal("available"), ...localIntervalSchema.shape }),
    z.strictObject({ status: z.enum(["unavailable", "unknown"]), reason: z.string().trim().min(1).max(300) }),
  ]).describe("First calculated Sun-below-minus-18-degree interval, clipped to the requested window, or its availability reason."),
  sunBelowGeometricHorizonIntervals: z.array(localIntervalSchema).max(24).optional().describe("Sun center below zero degrees, clipped to the window; may include twilight. Not apparent sunrise/set. No astronomical darkness does not imply all daytime."),
  solarThresholdIntervals: z.array(z.strictObject({
    kind: z.enum(["civil", "nautical", "astronomical"]).describe("Names the solar altitude threshold, not an exclusive twilight phase."),
    sunAltitudeThresholdDegrees: z.union([z.literal(-6), z.literal(-12), z.literal(-18)]).describe("Sun geometric center threshold: civil -6, nautical -12, astronomical -18 degrees."),
    ...localIntervalSchema.shape,
  }).refine((interval) => interval.sunAltitudeThresholdDegrees === ({ civil: -6, nautical: -12, astronomical: -18 } as const)[interval.kind], "Solar altitude threshold must match kind.")).max(24).describe("Nested Sun-below-threshold intervals clipped to the requested window; civil, nautical and astronomical rows may overlap."),
  moon: z.strictObject({
    phaseAtUtc: utcInstantSchema,
    phaseDegrees: z.number().finite().min(0).max(360),
    illuminationPercent: z.number().finite().min(0).max(100),
    maximumAltitudeDegrees: z.number().finite().min(-90).max(90),
    maximumAltitudeAtUtc: utcInstantSchema,
    horizonBasis: z.literal("geometric-center-zero-degrees").optional(),
    belowHorizonIntervals: z.array(localIntervalSchema).max(24).optional().describe("Calculated Moon-center-below-zero intervals clipped to the session. Not apparent limb moonset, not a guarantee of negligible moonlight."),
  }),
});
export type AstronomyWindowResult = z.infer<typeof astronomyWindowResultSchema>;

export const getTargetVisibilityInputSchema = z.strictObject({
  placeId: placeIdSchema,
  sourceRevision: z.string().regex(/^[a-f0-9]{64}$/).optional(), catalogueRevision: z.string().trim().min(1).max(100).optional(),
  displayTimeZone: ianaTimeZoneSchema.optional(),
  targetQuery: z.string().trim().min(1).max(120),
  window: timeWindowSchema,
}).superRefine(selectionRevisionRefinement).refine(({ window }) => Date.parse(window.endUtc) - Date.parse(window.startUtc) <= 14 * 24 * 60 * 60 * 1000, "Target visibility windows may not exceed 14 days.");

export const targetVisibilityResultSchema = resultSchema({
  sourceRevision:z.string().regex(/^[a-f0-9]{64}$/).optional(),
  placeId: placeIdSchema,
  target: z.strictObject({ targetId: z.string().trim().min(1).max(120), name: z.string().trim().min(1).max(160), targetType: z.enum(["sun", "moon", "planet", "star", "deep-sky-object", "comet", "asteroid"]) }),
  intervals: z.array(z.strictObject({
    ...localIntervalSchema.shape,
    maximumAltitudeDegrees: z.number().finite().min(-90).max(90),
    azimuthDegrees: z.number().finite().min(0).max(360),
    azimuthBasis: z.literal("maximum-altitude-sample").optional(),
    maximumAltitudeAtUtc: utcInstantSchema.optional(),
    maximumAltitudeLocal: z.string().max(120).optional(),
    moonSeparationDegrees: z.number().finite().min(0).max(180).optional(),
  })).max(24),
});
export type TargetVisibilityResult = z.infer<typeof targetVisibilityResultSchema>;

// The historical tool is not registered yet; migrate its legacy import names
// together with the planner before an artifact reader is enabled.
export { getClearSkyClimatologyInputSchema, climateContextResultSchema as clearSkyClimatologyResultSchema } from "./climate";
