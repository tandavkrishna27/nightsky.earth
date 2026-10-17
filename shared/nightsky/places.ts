import { selectionRevisionRefinement } from "./common";
import * as z from "zod4";
import {
  hasCoordinatePair,
  ianaTimeZoneSchema,
  latitudeSchema,
  longitudeSchema,
  MAX_OBSERVING_LOCATION_CANDIDATES,
  placeIdSchema,
  resultSchema,
  sourceRecordSchema,
  timeZoneEvidenceSchema,
} from "./common";

export const placeRefSchema = z.strictObject({
  placeId: placeIdSchema,
  displayName: z.string().trim().min(1).max(160),
  timeZone: ianaTimeZoneSchema,
  indexVintage: z.string().trim().min(1).max(100),
  fetchedAt:z.string().datetime().optional(), expiresAt:z.string().datetime().optional(),
  sourceRevision: z.string().regex(/^[a-f0-9]{64}$/).optional(), catalogueRevision: z.string().trim().min(1).max(100).optional(),
  timeZoneBasis: z.enum(["named-record", "api-source", "explicit-display"]).optional(),
  sources: z.array(sourceRecordSchema).min(1).max(4),
});
export type PlaceRef = z.infer<typeof placeRefSchema>;
export const apiPlaceRefSchema = placeRefSchema.partial({indexVintage:true}).required({sourceRevision:true}).refine(ref=>ref.indexVintage===undefined,"API snapshots are not catalogue/index vintages.");
export type ApiPlaceRef = z.infer<typeof apiPlaceRefSchema>;

/** Server-private exact coordinates for calculations and provider calls. Never return this object to a model. */
export const resolvedPlaceSchema = placeRefSchema.extend({
  latitude: latitudeSchema,
  longitude: longitudeSchema,
});
export type ResolvedPlace = z.infer<typeof resolvedPlaceSchema>;

export const accessEvidenceSchema = z.discriminatedUnion("status", [
  z.strictObject({ status: z.literal("verified"), description: z.string().trim().min(1).max(400), source: sourceRecordSchema }),
  z.strictObject({ status: z.literal("unknown"), description: z.string().trim().min(1).max(400).optional() }),
]);

export const observingLocationCandidateSchema = z.strictObject({
  timeZoneEvidence:timeZoneEvidenceSchema.optional(),
  fetchedAt:z.string().datetime().optional(),expiresAt:z.string().datetime().optional(),
  placeId: placeIdSchema,
  name: z.string().trim().min(1).max(160),
  category: z.enum(["park", "viewpoint", "protected-area", "campground", "beach", "other"]),
  latitude: latitudeSchema,
  longitude: longitudeSchema,
  distanceKm: z.number().finite().min(0).max(5000).optional(),
  navigationUrl: z.url().optional(),
  accessEvidence: accessEvidenceSchema,
  sources: z.array(sourceRecordSchema).min(1).max(4),
  caveats: z.array(z.string().trim().min(1).max(300)).max(8),
});
export type ObservingLocationCandidate = z.infer<typeof observingLocationCandidateSchema>;

export const resolvePlaceInputSchema = z.strictObject({
  placeQuery: z.string().trim().min(1).max(160).optional(),
  useApproximateHostLocation: z.boolean().optional(),
}).superRefine((input, ctx) => {
  const hasQuery = input.placeQuery !== undefined;
  const usesHostLocation = input.useApproximateHostLocation === true;
  if (hasQuery === usesHostLocation) {
    ctx.addIssue({ code: "custom", message: "Provide either a named placeQuery or useApproximateHostLocation: true, but not both." });
  }
  if (hasQuery && hasCoordinatePair(input.placeQuery!)) {
    ctx.addIssue({ code: "custom", path: ["placeQuery"], message: "Enter a named place, not coordinates." });
  }
});
export type ResolvePlaceInput = z.infer<typeof resolvePlaceInputSchema>;

export const resolvePlaceResultSchema = resultSchema({
  matches: z.array(z.union([placeRefSchema, placeRefSchema.omit({timeZone:true,indexVintage:true}).extend({sourceRevision:z.string().regex(/^[a-f0-9]{64}$/),timeZone:ianaTimeZoneSchema.optional(),timeZoneEvidence:z.union([z.strictObject({status:z.literal("unknown")}),z.strictObject({status:z.literal("verified"),timeZone:ianaTimeZoneSchema,source:sourceRecordSchema})])})])).max(5),
  selectionRequired: z.boolean(),
  locationSource: z.enum(["named-place", "host-approximate-location"]).optional(),
});
export type ResolvePlaceResult = z.infer<typeof resolvePlaceResultSchema>;

export const searchObservingLocationsInputSchema = z.strictObject({
  placeId: placeIdSchema,
  radiusKm: z.number().finite().min(1).max(300).default(50),
  categories: z.array(observingLocationCandidateSchema.shape.category).min(1).max(6).optional(),
  limit: z.number().int().min(1).max(MAX_OBSERVING_LOCATION_CANDIDATES).default(5),
});
export type SearchObservingLocationsInput = z.infer<typeof searchObservingLocationsInputSchema>;

export const searchObservingLocationsResultSchema = resultSchema({
  candidates: z.array(observingLocationCandidateSchema).max(MAX_OBSERVING_LOCATION_CANDIDATES),
  sortBasis: z.enum(["distance-then-source-completeness", "requested-category-then-distance"]),
  coverage: z.string().trim().min(1).max(300),
});

export const getLocationContextInputSchema = z.strictObject({ placeId: placeIdSchema, sourceRevision: z.string().regex(/^[a-f0-9]{64}$/).optional(), catalogueRevision: z.string().trim().min(1).max(100).optional(), displayTimeZone: ianaTimeZoneSchema.optional() }).superRefine(selectionRevisionRefinement);
export const getLocationContextResultSchema = resultSchema({
  sourceRevision:z.string().regex(/^[a-f0-9]{64}$/).optional(),
  placeId: placeIdSchema,
  groundLightContext: z.discriminatedUnion("status", [
    z.strictObject({ status: z.literal("available"), label: z.string().trim().min(1).max(120), value: z.number().finite(), unit: z.string().trim().min(1).max(30), source: sourceRecordSchema }),
    z.strictObject({ status: z.literal("unknown"), reason: z.string().trim().min(1).max(300) }),
  ]),
  access: accessEvidenceSchema,
});
