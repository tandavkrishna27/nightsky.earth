import * as z from 'zod4';
import { latitudeSchema, longitudeSchema, utcInstantSchema, timeZoneEvidenceSchema, sourceRecordSchema } from '../../../shared/nightsky/common';
import type { ApiSelectionRef } from '../../../shared/nightsky/common';
import type { ResolvePlaceInput, ResolvePlaceResult } from '../../../shared/nightsky/places';
import type { SearchDiscoveryInput, SearchDiscoveryResult, ResolveObservingRegionInput, resolveObservingRegionResultSchema, getObservingLocationDetailsResultSchema, CalculationPlace } from '../../../shared/nightsky/discovery';
import type { CalculationPlaceInput } from '../calculationPlace';
export const apiSourceRecordSchema = z.strictObject({
    providerId: z.enum(['geonames', 'geoapify']), upstreamId: z.string().min(1).max(2048), fetchedAt: utcInstantSchema, expiresAt: utcInstantSchema, sourceUrl: z.url().max(2048), attribution: z.string().min(1).max(500), name: z.string().trim().min(1).max(160), latitude: latitudeSchema, longitude: longitudeSchema, timeZoneEvidence: timeZoneEvidenceSchema, additionalSources: z.array(sourceRecordSchema).max(3).optional(), category: z.enum(["park", "viewpoint", "protected-area", "campground", "beach", "other"]).optional(), regionEvidence: z.strictObject({
        countryCode: z.string().regex(/^[A-Z]{3}$/), adminLevel: z.union([z.literal(0), z.literal(1)])
    }).optional()
});
export type ApiSourceRecord = z.infer<typeof apiSourceRecordSchema>;
export type ApiResolveResult = ResolvePlaceResult;
export type ApiRegionResult = z.infer<typeof resolveObservingRegionResultSchema>;
export type ApiDiscoveryResult = SearchDiscoveryResult;
export type ApiPlaceDetailsResult = z.infer<typeof getObservingLocationDetailsResultSchema>;
export interface SelectedPlaceResolver {
    resolve(input: CalculationPlaceInput): Promise<CalculationPlace>;
}
export interface DiscoveryProvider {
    resolvePlace(input: ResolvePlaceInput): Promise<ApiResolveResult>;
    resolveRegion(input: ResolveObservingRegionInput): Promise<ApiRegionResult>;
    search(input: SearchDiscoveryInput): Promise<ApiDiscoveryResult>;
    details(ref: ApiSelectionRef): Promise<ApiPlaceDetailsResult>;
}
