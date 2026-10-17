import { selectionRevisionRefinement } from "./common";
import * as z from "zod4";
import { searchDiscoveryResultSchema } from "./discovery";
import { ianaTimeZoneSchema } from "./common";
import { MAX_COMPARISON_OPTIONS, MAX_RESULT_SOURCES, availabilitySchema, localeSchema, unitPreferenceSchema, placeIdSchema, resultSchema, sourceRecordSchema, timeWindowSchema, utcInstantSchema } from "./common";
import { astronomyWindowResultSchema, targetVisibilityResultSchema } from "./astronomy";
import { nightConditionsResultSchema, auroraOutlookResultSchema } from "./weather";
import { conjunctionWindowSchema, skyEventsResultSchema } from "./events";
import { climateContextResultSchema } from "./climate";
import { meteorRadiantResultSchema } from "./meteors";
import { apiPlaceRefSchema,placeRefSchema, getLocationContextResultSchema, searchObservingLocationsResultSchema } from "./places";

export const planObservingSessionInputSchema = z.strictObject({
  placeId: placeIdSchema,
  sourceRevision: z.string().regex(/^[a-f0-9]{64}$/).optional(), catalogueRevision: z.string().trim().min(1).max(100).optional(),
  displayTimeZone: ianaTimeZoneSchema.optional().describe("For an unverified candidate site zone, the user must explicitly choose this display zone. Ask and wait before calling; do not infer user choice from a city or window.timeZone."),
  activity: z.enum(["general-stargazing", "visual-stargazing", "meteor-shower", "astrophotography", "deep-sky-imaging", "planet-observing", "moon-observing", "aurora", "eclipse", "learning"]),
  window: timeWindowSchema,
  target: z.string().trim().min(1).max(120).optional(),
  experience: z.enum(["beginner", "intermediate", "advanced"]).optional(),
  equipment: z.array(z.string().trim().min(1).max(80)).max(20).optional(),
  locale: localeSchema.default("en"),
  units: unitPreferenceSchema.default("metric"),
}).superRefine(selectionRevisionRefinement).refine(({ window }) => Date.parse(window.endUtc) - Date.parse(window.startUtc) <= 24 * 60 * 60 * 1000, "A single observing session may cover at most 24 hours.");
export const compareObservingOptionsInputSchema = z.strictObject({
  options: z.array(z.strictObject({ placeId: placeIdSchema, sourceRevision: z.string().regex(/^[a-f0-9]{64}$/).optional(), catalogueRevision: z.string().trim().min(1).max(100).optional(), displayTimeZone: ianaTimeZoneSchema.optional().describe("For an unverified candidate site zone, the user must explicitly choose this display zone. Ask and wait before calling; do not infer user choice from a city or window.timeZone."), activity: planObservingSessionInputSchema.shape.activity, window: timeWindowSchema, target: z.string().trim().min(1).max(120).optional() })).min(2).max(MAX_COMPARISON_OPTIONS),
  locale: localeSchema.default("en"),
  units: unitPreferenceSchema.default("metric"),
}).superRefine(({ options }, ctx) => options.forEach(({ window }, index) => {
  if (Date.parse(window.endUtc) - Date.parse(window.startUtc) > 24 * 60 * 60 * 1000) ctx.addIssue({ code: "custom", path: ["options", index, "window"], message: "A compared observing session may cover at most 24 hours." });
}));

const planFactorSchema = z.strictObject({ name: z.string().trim().min(1).max(120), assessment: z.string().trim().min(1).max(500), impact: z.enum(["favorable", "mixed", "unfavorable", "unknown"]), sourceNames: z.array(z.string().trim().min(1).max(120)).max(8) });
const candidateWindowSchema = z.strictObject({ darknessOverlapIntervals: z.array(z.strictObject({startUtc: utcInstantSchema, endUtc: utcInstantSchema, localStart: z.string().max(120), localEnd: z.string().max(120)})).max(24).optional().describe("Calculated overlap with astronomical darkness, not a best-condition score. Empty means no overlap; absent means unknown."), window: timeWindowSchema, localStart: z.string().max(120).optional(), localEnd: z.string().max(120).optional(), score: z.number().finite().min(0).max(100).optional(), rationale: z.string().trim().min(1).max(500), targetId: z.string().max(120).optional(), weatherCoverage: z.enum(["available", "partial", "unknown"]).optional(), moonConstraint: z.enum(["target", "context-only", "separation-available"]).optional(), weatherIntervals: z.array(z.strictObject({ window: timeWindowSchema, forecastIndex: z.number().int().min(0).max(3), sampleIndex: z.number().int().min(0).max(47) })).max(192).optional() });
const evidenceSchema = z.strictObject({ conjunctionWindows: z.array(conjunctionWindowSchema).max(6).optional(), astronomy: astronomyWindowResultSchema.optional(), target: targetVisibilityResultSchema.optional(), weather: nightConditionsResultSchema.optional(), events: skyEventsResultSchema.optional(), aurora: auroraOutlookResultSchema.optional(), history: climateContextResultSchema.optional(), location: getLocationContextResultSchema.optional(), candidates: z.union([searchObservingLocationsResultSchema,searchDiscoveryResultSchema]).optional(), meteorRadiantSamples: z.array(meteorRadiantResultSchema).max(3).optional() });
const timedPreparationSchema = z.array(z.strictObject({ atUtc: utcInstantSchema, localTime: z.string().max(100), instruction: z.string().min(1).max(300) })).max(6);
export const planResultSchema = resultSchema({
  goal: z.string().trim().min(1).max(120),
  place: z.union([placeRefSchema,apiPlaceRefSchema]),
  requestedWindow: timeWindowSchema,
  summary: z.string().trim().min(1).max(1200),
  candidateWindows: z.array(candidateWindowSchema).max(8),
  factors: z.array(planFactorSchema).max(20),
  gaps: z.array(z.string().trim().min(1).max(400)).max(80),
  preparation: z.array(z.string().trim().min(1).max(300)).max(20),
  suggestions: z.array(targetVisibilityResultSchema).max(3).optional(),
  evidence: evidenceSchema.optional(),
  timedPreparation: timedPreparationSchema.optional(),
});
export type PlanResult = z.infer<typeof planResultSchema>;

export const compareObservingOptionsResultSchema = resultSchema({ comparisons: z.array(z.strictObject({ placeId: placeIdSchema, sourceRevision: z.string().regex(/^[a-f0-9]{64}$/).optional(), catalogueRevision: z.string().trim().min(1).max(100).optional(), displayTimeZone: ianaTimeZoneSchema.optional().describe("For an unverified candidate site zone, the user must explicitly choose this display zone. Ask and wait before calling; do not infer user choice from a city or window.timeZone."), timeZoneBasis: z.enum(["named-record", "api-source", "explicit-display"]).optional(), activity: planObservingSessionInputSchema.shape.activity, window: timeWindowSchema, summary: z.string().trim().min(1).max(1200), factors: z.array(planFactorSchema).max(20), sources: z.array(sourceRecordSchema).min(1).max(MAX_RESULT_SOURCES), availability: availabilitySchema.optional(), gaps: z.array(z.string().max(400)).max(80).optional(), candidateWindows: z.array(candidateWindowSchema).max(8).optional(), suggestions: z.array(targetVisibilityResultSchema).max(3).optional(), evidence: evidenceSchema.optional() })).min(2).max(MAX_COMPARISON_OPTIONS) });
export type CompareObservingOptionsResult = z.infer<typeof compareObservingOptionsResultSchema>;
export const recommendSpecialistToolsInputSchema = z.strictObject({ activity: planObservingSessionInputSchema.shape.activity, experience: planObservingSessionInputSchema.shape.experience.optional() });
export const specialistToolsResultSchema = resultSchema({ recommendations: z.array(z.strictObject({ name: z.string().trim().min(1).max(120), platform: z.enum(["web", "ios", "android", "desktop", "multiple", "unknown"]), purpose: z.string().trim().min(1).max(300), url: z.url(), pricing: z.enum(["free", "free-tier", "paid", "unknown"]), lastReviewed: z.iso.date().optional() })).max(12) });
