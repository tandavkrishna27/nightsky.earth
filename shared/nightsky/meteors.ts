import * as z from "zod4";
import { utcInstantSchema } from "./common";
const angle = z.number().finite();
const uncertaintySchema = z.strictObject({ longitudeInterceptDeg: angle.positive(), longitudeSlopeDegPerSolarDeg: angle.positive(), latitudeInterceptDeg: angle.positive(), latitudeSlopeDegPerSolarDeg: angle.positive() });
/** Exact source/model sample; available is model coverage, never a meteor sighting probability. */
export const meteorRadiantResultSchema = z.discriminatedUnion("status", [
  z.strictObject({ status: z.literal("available"), code: z.string().min(1).max(12), evaluatedAt: utcInstantSchema,
    solarLongitudeJ2000Deg: angle.min(0).max(360), referenceSolarLongitudeDeg: angle.min(0).max(360), signedSolarOffsetDeg: angle.min(-180).max(180),
    eclipticLongitudeJ2000Deg: angle.min(0).max(360), eclipticLatitudeJ2000Deg: angle.min(-90).max(90), rightAscensionJ2000Deg: angle.min(0).max(360), declinationJ2000Deg: angle.min(-90).max(90),
    altitudeDeg: angle.min(-90).max(90), azimuthDeg: angle.min(0).max(360), moonSeparationDeg: angle.min(0).max(180), moonAltitudeDeg: angle.min(-90).max(90),
    radiantDirection: z.literal("geocentric mean radiant rotated to equatorial of date; no zenith attraction or refraction"), moonDirection: z.literal("topocentric equatorial of date; no atmospheric refraction"),
    modelValidSolarOffsetDeg: z.strictObject({ min: angle, max: angle }), parameterUncertainty: uncertaintySchema,
    source: z.strictObject({ url: z.url().max(2048), licenseUrl: z.url().max(2048), attribution: z.string().min(1).max(500), vintage: z.string().min(1).max(100), modified: z.literal(true) }),
    annualExtrapolation: z.boolean(), caveat: z.string().min(1).max(600),
  }),
  z.strictObject({ status: z.enum(["outside-model", "unsupported"]), code: z.string().min(1).max(120), evaluatedAt: utcInstantSchema.optional(), reason: z.string().min(1).max(500) }),
]);
export type MeteorRadiantResult = z.infer<typeof meteorRadiantResultSchema>;
