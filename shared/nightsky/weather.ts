import * as z from "zod4";
import { ianaTimeZoneSchema } from "./common";
import { dataClassSchema, placeIdSchema, resultSchema, sourceRecordSchema, timeWindowSchema, utcInstantSchema } from "./common";

const weatherValueSchema = z.strictObject({ value: z.number().finite(), unit: z.string().trim().min(1).max(30), periodStartUtc: utcInstantSchema.optional(), periodEndUtc: utcInstantSchema.optional() }).refine(
  (value) => value.periodStartUtc === undefined && value.periodEndUtc === undefined || value.periodStartUtc !== undefined && value.periodEndUtc !== undefined && Date.parse(value.periodEndUtc) > Date.parse(value.periodStartUtc),
  "Aggregation intervals require both UTC bounds and an end after the start.",
);
const weatherFields = ["totalCloudCover", "lowCloudCover", "mediumCloudCover", "highCloudCover", "precipitationProbability", "precipitationAmount", "windSpeed", "windGust", "windDirection", "temperature", "dewPoint", "relativeHumidity", "visibility"] as const;
const weatherValuesSchema = z.strictObject(Object.fromEntries(weatherFields.map((field) => [field, weatherValueSchema.optional()])) as Record<typeof weatherFields[number], z.ZodOptional<typeof weatherValueSchema>>).refine((values) => Object.values(values).some((value) => value !== undefined), "At least one weather value is required.");

export const weatherForecastSchema = z.strictObject({
  availability: z.strictObject({ status: z.enum(["available", "partial", "stale", "unavailable", "not-covered", "unknown", "unsupported", "out-of-horizon"]), reason: z.string().trim().min(1).max(500) }),
  source: sourceRecordSchema,
  forecastHorizonHours: z.number().finite().nonnegative().max(24 * 366),
  samples: z.array(z.strictObject({ validAt: utcInstantSchema, values: weatherValuesSchema })).min(1).max(48),
  missingFields: z.array(z.strictObject({ field: z.enum(weatherFields), reason: z.string().trim().min(1).max(300) })).max(weatherFields.length),
}).superRefine((forecast, ctx) => {
  if (forecast.source.dataClass !== "forecast") ctx.addIssue({ code: "custom", path: ["source", "dataClass"], message: "WeatherForecast source must be classified as forecast." });
});
export type WeatherForecast = z.infer<typeof weatherForecastSchema>;

export const getNightConditionsInputSchema = z.strictObject({ placeId: placeIdSchema, catalogueRevision: z.string().trim().min(1).max(100).optional(), displayTimeZone: ianaTimeZoneSchema.optional(), window: timeWindowSchema, includeHourly: z.boolean().default(true) }).refine(({ window }) => Date.parse(window.endUtc) - Date.parse(window.startUtc) <= 24 * 60 * 60 * 1000, "A night-conditions request may cover at most 24 hours so its darkness context stays specific to one observing night.");
export const nightConditionsResultSchema = resultSchema({
  placeId: placeIdSchema,
  catalogueRevision: z.string().trim().min(1).max(100).optional(),
  displayTimeZone: ianaTimeZoneSchema.optional(),
  window: timeWindowSchema,
  forecasts: z.array(weatherForecastSchema).max(4),
  nightContext: z.strictObject({
    darkness: z.discriminatedUnion("status", [
      z.strictObject({ status: z.literal("available"), startUtc: utcInstantSchema, endUtc: utcInstantSchema, localStart: z.string(), localEnd: z.string() }),
      z.strictObject({ status: z.enum(["unavailable", "unknown"]), reason: z.string().trim().min(1).max(300) }),
    ]).describe("First astronomical darkness interval clipped to the requested window, or its availability reason. Use astronomicalDarknessIntervals for all calculated intervals."),
    astronomicalDarknessIntervals: z.array(z.strictObject({
      startUtc: utcInstantSchema, endUtc: utcInstantSchema,
      localStart: z.string().trim().min(1).max(80), localEnd: z.string().trim().min(1).max(80),
    }).refine(interval => Date.parse(interval.endUtc) > Date.parse(interval.startUtc), "Interval end must follow its start.")).max(24).optional().describe("Separate Sun-below-minus-18-degree intervals clipped to the requested window. Forecast steps are selected from their union; daylight gaps remain excluded."),
    moonIlluminationPercent: z.number().finite().min(0).max(100).optional(),
    forecastStepsDuringDarkness: z.array(z.strictObject({ source: z.string().trim().min(1).max(120), validTimesUtc: z.array(utcInstantSchema).max(48) })).max(4),
  }),
});
export type NightConditionsResult = z.infer<typeof nightConditionsResultSchema>;

export const getAuroraOutlookInputSchema = z.strictObject({ placeId: placeIdSchema, catalogueRevision: z.string().trim().min(1).max(100).optional(), displayTimeZone: ianaTimeZoneSchema.optional(), window: timeWindowSchema }).refine(({ window }) => Date.parse(window.endUtc) - Date.parse(window.startUtc) <= 24 * 60 * 60 * 1000, "Aurora outlook windows may not exceed 24 hours.");
export const auroraOutlookResultSchema = resultSchema({
  placeId: placeIdSchema,
  catalogueRevision: z.string().trim().min(1).max(100).optional(),
  displayTimeZone: ianaTimeZoneSchema.optional(),
  window: timeWindowSchema,
  outlook: z.discriminatedUnion("status", [
    z.strictObject({ status: z.literal("available"), kpIndex: z.number().finite().min(0).max(9).optional(), probability: z.number().finite().min(0).max(1).optional(), gridValue: z.number().finite().min(0).max(100), gridValueUnit: z.literal("OVATION model index (0–100)"), gridCellLatitude: z.number().finite().min(-90).max(90), gridCellLongitude: z.number().finite().min(-180).max(180), summary: z.string().trim().min(1).max(500), source: sourceRecordSchema }),
    z.strictObject({ status: z.enum(["unavailable", "unknown", "out-of-horizon", "not-covered"]), reason: z.string().trim().min(1).max(300) }),
  ]),
  latitudeBand: z.enum(["equatorial", "mid-latitude", "high-latitude", "polar", "unknown"]),
});
export type AuroraOutlookResult = z.infer<typeof auroraOutlookResultSchema>;
