import * as z from "zod4";
import {
  hasCoordinatePair,
  ianaTimeZoneSchema,
  latitudeSchema,
  longitudeSchema,
  placeIdSchema,
  resultSchema,
  sourceRecordSchema,
} from "./common";
import {
  observingLocationCandidateSchema,
  searchObservingLocationsInputSchema as legacyInputSchema,
} from "./places";

export const categorySchema = observingLocationCandidateSchema.shape.category;
export type Category = z.infer<typeof categorySchema>;
export const catalogueRevisionSchema = z.string().trim().min(1).max(100);
export const regionIdSchema = z.string().regex(
  /^region:v1:[A-Za-z0-9][A-Za-z0-9._:/-]{0,127}$/,
  "Expected a versioned NightSky region ID.",
);
export const countryCodeSchema = z.string().regex(/^[A-Z]{3}$/, "Expected an uppercase ISO3 country code.");
export const regionRefSchema = z.strictObject({
  regionId: regionIdSchema,
  name: z.string().trim().min(1).max(160),
  countryCode: countryCodeSchema,
  adminLevel: z.union([z.literal(0), z.literal(1)]),
  boundaryRevision: catalogueRevisionSchema,
  sources: z.array(sourceRecordSchema).min(1).max(4),
});
export type RegionRef = z.infer<typeof regionRefSchema>;
export const discoveryOriginSchema = z.strictObject({
  placeId: placeIdSchema,
  catalogueRevision: catalogueRevisionSchema.optional(),
  radiusKm: z.number().finite().min(1).max(300).default(50),
  minimumDistanceKm: z.number().finite().min(0).max(300).default(0),
}).superRefine((origin, ctx) => {
  if (origin.minimumDistanceKm > origin.radiusKm) {
    ctx.addIssue({
      code: "custom",
      path: ["minimumDistanceKm"],
      message: "Minimum distance must not exceed radius.",
    });
  }
});
export const discoveryScopeSchema = z.strictObject({
  origins: z.array(discoveryOriginSchema).max(5).default([]),
  originMode: z.enum(["any", "all"]).default("any"),
  includeRegionIds: z.array(regionIdSchema).max(5).default([]),
  excludeRegionIds: z.array(regionIdSchema).max(5).default([]),
  regionMode: z.enum(["any", "all"]).default("any"),
}).superRefine((scope, ctx) => {
  if (!scope.origins.length && !scope.includeRegionIds.length) {
    ctx.addIssue({
      code: "custom",
      message: "Provide an origin or included region; narrow exclusion-only searches.",
    });
  }
});
export type DiscoveryScope = z.infer<typeof discoveryScopeSchema>;
export const searchDiscoveryInputSchema = z.strictObject({
  placeId: placeIdSchema.optional(),
  radiusKm: z.number().finite().min(1).max(300).optional(),
  scope: discoveryScopeSchema.optional(),
  categories: legacyInputSchema.shape.categories,
  limit: legacyInputSchema.shape.limit,
}).superRefine((input, ctx) => {
  if (input.scope !== undefined && (input.placeId !== undefined || input.radiusKm !== undefined)) {
    ctx.addIssue({code: "custom", message: "Scope cannot be combined with legacy placeId or radiusKm."});
  }
  if (input.scope === undefined && input.placeId === undefined) {
    ctx.addIssue({code: "custom", path: ["placeId"], message: "Provide placeId or scope."});
  }
});
export type SearchDiscoveryInput = z.infer<typeof searchDiscoveryInputSchema>;
export type SearchObservingLocationsInput = SearchDiscoveryInput;
export function normalizeDiscoveryInput(input: z.input<typeof searchDiscoveryInputSchema>): DiscoveryScope {
  const parsed = searchDiscoveryInputSchema.parse(input);
  return parsed.scope ?? discoveryScopeSchema.parse({
    origins: [{placeId: parsed.placeId!, radiusKm: parsed.radiusKm ?? 50}],
  });
}
export const discoveryCoverageSchema = z.strictObject({
  footprintStatus: z.enum(["covered", "partial", "not-covered"]),
  searchCompleteness: z.enum(["complete", "budget-limited", "unavailable"]),
  mappedFeatureCompleteness: z.literal("unknown"),
  catalogueRevision: catalogueRevisionSchema,
  stopReason: z.string().trim().min(1).max(300).optional(),
}).superRefine((coverage, ctx) => {
  if (coverage.searchCompleteness === "budget-limited" && !coverage.stopReason) {
    ctx.addIssue({
      code: "custom",
      path: ["stopReason"],
      message: "Budget-limited searches require a stop reason.",
    });
  }
});
export type DiscoveryCoverage = z.infer<typeof discoveryCoverageSchema>;
export const originDistanceSchema = z.strictObject({
  placeId: placeIdSchema,
  distanceKm: z.number().finite().min(0).max(21000),
});
export const candidateRefSchema = observingLocationCandidateSchema.extend({
  catalogueRevision: catalogueRevisionSchema,
  originDistances: z.array(originDistanceSchema).max(5).optional(),
});
export type CandidateRef = z.infer<typeof candidateRefSchema>;
export const originBasisSchema = z.strictObject({
  placeId: placeIdSchema,
  basis: z.enum(["named-record", "catalogue-point"]),
});
export const searchDiscoveryResultSchema = resultSchema({
  candidates: z.array(candidateRefSchema).max(10),
  sortBasis: z.enum([
    "distance-then-source-completeness",
    "requested-category-then-distance",
    "minimum-distance",
    "maximum-distance",
    "source-completeness-then-name-id",
  ]),
  coverage: z.string().trim().min(1).max(300),
  discoveryCoverage: discoveryCoverageSchema,
  queryScope: discoveryScopeSchema,
  originBasis: z.array(originBasisSchema).max(5),
  truncationReason: z.string().trim().min(1).max(300).optional(),
}).superRefine((result, ctx) => {
  if (result.truncationReason && result.discoveryCoverage.searchCompleteness === "complete") {
    ctx.addIssue({
      code: "custom",
      path: ["discoveryCoverage", "searchCompleteness"],
      message: "Truncated searches cannot claim complete ranking.",
    });
  }
});
export type SearchObservingLocationsResult = z.infer<typeof searchDiscoveryResultSchema>;
export type SearchDiscoveryResult = SearchObservingLocationsResult;
export const calculationPlaceSchema = z.strictObject({
  placeId: placeIdSchema,
  name: z.string().trim().min(1).max(160),
  latitude: latitudeSchema,
  longitude: longitudeSchema,
  displayTimeZone: ianaTimeZoneSchema,
  timeZoneBasis: z.enum(["named-record", "explicit-display"]),
  sources: z.array(sourceRecordSchema).min(1).max(4),
  catalogueRevision: catalogueRevisionSchema.optional(),
});
export type CalculationPlace = z.infer<typeof calculationPlaceSchema>;
export const calculationPlaceInputSchema = z.strictObject({
  placeId: placeIdSchema,
  catalogueRevision: catalogueRevisionSchema.optional(),
  displayTimeZone: ianaTimeZoneSchema.optional(),
});
const namedDiscoveryQuerySchema = z.string().trim().min(1).max(160).refine(
  value => !hasCoordinatePair(value),
  "Enter a named place or region, not coordinates.",
);
export const resolveObservingRegionInputSchema = z.strictObject({
  regionQuery: namedDiscoveryQuerySchema,
  countryCode: countryCodeSchema.optional(),
  adminLevel: z.union([z.literal(0), z.literal(1)]).optional(),
});
export const resolveObservingRegionResultSchema = resultSchema({
  matches: z.array(regionRefSchema).max(5),
  selectionRequired: z.boolean(),
});
export const getObservingLocationDetailsInputSchema = z.strictObject({
  placeId: placeIdSchema.optional(),
  catalogueRevision: catalogueRevisionSchema.optional(),
  displayTimeZone: ianaTimeZoneSchema.optional(),
  placeQuery: namedDiscoveryQuerySchema.optional(),
  countryCode: countryCodeSchema.optional(),
}).superRefine((input, ctx) => {
  const id = input.placeId !== undefined;
  const name = input.placeQuery !== undefined;
  if (
    id === name ||
    (id && input.catalogueRevision === undefined) ||
    (id && input.countryCode !== undefined) ||
    (name && (input.catalogueRevision !== undefined || input.displayTimeZone !== undefined))
  ) {
    ctx.addIssue({
      code: "custom",
      message: "Provide placeId with catalogueRevision and optional displayTimeZone, or placeQuery with optional countryCode.",
    });
  }
});
export const getObservingLocationDetailsResultSchema = resultSchema({
  matches: z.array(candidateRefSchema).max(5),
  selectionRequired: z.boolean(),
});
export interface CatalogueReader {
  search(scope: DiscoveryScope, options: {categories?: Category[]; limit: number}): Promise<SearchObservingLocationsResult>;
  details(ref: {placeId: string; catalogueRevision: string}): Promise<CandidateRef | undefined>;
  findNames(query: {placeQuery: string; countryCode?: string}): Promise<CandidateRef[]>;
}
export interface RegionIndex {
  resolve(input: {regionQuery: string; countryCode?: string; adminLevel?: 0 | 1}): Promise<RegionRef[]>;
  members(regionId: string): AsyncIterable<string>;
}
