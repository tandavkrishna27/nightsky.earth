import { uniqueRecords } from './records';
import * as z from 'zod4';
import { ApiProviderError } from './http';
import type { ApiHttpClient } from './http';
import type { ApiSourceRecord } from './types';
const row = z.object({
    // https://www.geonames.org/export/codes.html: class P codes only; PCLI is class A.
    // Omitted metadata is compatible with our featureClass=P request, but explicit
    // contradictory metadata must fail before any selected point is returned.
    fcl: z.literal('P').optional(), fcode: z.enum([
        'PPL', 'PPLA', 'PPLA2', 'PPLA3', 'PPLA4', 'PPLA5', 'PPLC', 'PPLCD', 'PPLCH',
        'PPLF', 'PPLG', 'PPLH', 'PPLL', 'PPLQ', 'PPLR', 'PPLS', 'PPLW', 'PPLX', 'STLMT'
    ]).optional(),
    geonameId: z.union([z.number().int().positive().max(Number.MAX_SAFE_INTEGER), z.string().regex(/^[1-9]\d{0,19}$/)]), name: z.string().trim().min(1).max(160), lat: z.union([z.number(), z.string().regex(/^[+-]?\d+(?:\.\d+)?$/).transform(Number)]).pipe(z.number().finite().min(-90).max(90)), lng: z.union([z.number(), z.string().regex(/^[+-]?\d+(?:\.\d+)?$/).transform(Number)]).pipe(z.number().finite().min(-180).max(180))
});
export const GEONAMES_API_SOURCE = {
    name: 'GeoNames', url: 'https://www.geonames.org/', attribution: 'GeoNames geographical database, CC BY 4.0.', dataClass: 'context' as const, licenseUrl: 'https://creativecommons.org/licenses/by/4.0/'
};
export async function geonamesResolve(http: ApiHttpClient, query: string, now: () => number, deadline?: number): Promise<ApiSourceRecord[]> {
    const data = z.object({
        geonames: z.array(z.unknown()).max(100)
    }).parse(await http.json('geonames', '/searchJSON', {
        q: query, maxRows: '5', style: 'FULL', startRow: '0', featureClass: 'P'
    }, deadline));
    const output: ApiSourceRecord[] = [];
    const at = now();
    for (const raw of data.geonames) {
        const r = row.safeParse(raw);
        if (!r.success)
            throw new ApiProviderError('invalid-response');
        output.push({
            providerId: 'geonames', upstreamId: String(r.data.geonameId), name: r.data.name, latitude: r.data.lat, longitude: r.data.lng, fetchedAt: new Date(at).toISOString(), expiresAt: new Date(at + 3600000).toISOString(), sourceUrl: `https://www.geonames.org/${r.data.geonameId}/`, attribution: GEONAMES_API_SOURCE.attribution, timeZoneEvidence: {
                status: 'unknown'
            }
        });
    }
    return uniqueRecords(output);
}
