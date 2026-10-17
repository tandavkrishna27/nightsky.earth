import { uniqueRecords } from './records';
import { ApiProviderError } from './http';
import { isIanaTimeZone } from '../../../shared/nightsky/common';
import { COUNTRY_ISO3 } from './countryCodes';
import * as z from 'zod4';
import type { ApiHttpClient } from './http';
import type { ApiSourceRecord } from './types';
import type { Category, ResolveObservingRegionInput } from '../../../shared/nightsky/discovery';
const COUNTRY_ISO2 = new Map(Object.entries(COUNTRY_ISO3).map(([alpha2, alpha3]) => [alpha3, alpha2.toLowerCase()]));
/** One documented forward-geocode query; never retry aliases or loosen country scope. */
export function geoapifyRegionQuery(input: ResolveObservingRegionInput): Record<string, string> {
    const country = input.countryCode ? COUNTRY_ISO2.get(input.countryCode) : undefined;
    if (input.countryCode && !country) throw new ApiProviderError('unsupported-query');
    return {
        ...(input.adminLevel === 0 ? { country: input.regionQuery, type: 'country' }
            : input.adminLevel === 1 ? { state: input.regionQuery, type: 'state' } : { text: input.regionQuery }),
        ...(country ? { filter: `countrycode:${country}` } : {}),
        bias: 'countrycode:none', limit: '5', format: 'geojson',
    };
}
export const GEOAPIFY_SOURCE = {
    name: 'Geoapify / OpenStreetMap', url: 'https://www.geoapify.com/', attribution: 'Powered by Geoapify; map data © OpenStreetMap contributors (ODbL).', dataClass: 'context' as const, licenseUrl: 'https://www.openstreetmap.org/copyright'
};
const feature = z.object({
    properties: z.object({
        place_id: z.string().min(1).max(2048), datasource: z.object({
            sourcename: z.string().max(120).optional(), attribution: z.string().max(500).optional(), license: z.string().max(160).optional(), url: z.url().max(2048).optional(), license_url: z.url().max(2048).optional()
        }).optional(), result_type: z.string().optional(), country_code: z.string().optional(), timezone: z.object({
            name: z.string()
        }).optional(), name: z.string().trim().min(1).max(160).optional(), formatted: z.string().trim().max(512).optional(), categories: z.array(z.string()).optional()
    }), geometry: z.object({
        type: z.literal('Point'), coordinates: z.tuple([z.number().min(-180).max(180), z.number().min(-90).max(90)])
    })
});
export const CATEGORY_MAP: Record<Category, string[]> = {
    park: ['leisure.park'], viewpoint: ['tourism.attraction.viewpoint'], 'protected-area': ['natural.protected_area', 'national_park', 'leisure.park.nature_reserve'], campground: ['camping.camp_site', 'camping.caravan_site'], beach: ['beach'], other: ['natural.mountain', 'leisure.picnic']
};
const PRECEDENCE: Category[] = ['protected-area', 'campground', 'viewpoint', 'beach', 'park', 'other'];
export async function geoapifyRecords(http: ApiHttpClient, path: '/v1/geocode/search' | '/v2/places', query: Record<string, string>, now: () => number, deadline?: number): Promise<{
    items: Array<{
        record: ApiSourceRecord;
        category?: Category;
    }>;
    pageFull: boolean;
}> {
    const data = z.object({
        features: z.array(z.unknown()).max(100)
    }).parse(await http.json('geoapify', path, query, deadline));
    const at = now();
    const out: Array<{
        record: ApiSourceRecord;
        category?: Category;
    }> = [];
    for (const raw of data.features) {
        const parsed = feature.safeParse(raw);
        if (!parsed.success)
            throw new ApiProviderError('invalid-response');
        const f = parsed.data;
        if ((f.properties.result_type === 'country' || f.properties.result_type === 'state') && !COUNTRY_ISO3[f.properties.country_code?.toUpperCase() ?? ''])
            throw new ApiProviderError('invalid-response');
        const name = f.properties.name ?? f.properties.formatted?.slice(0, 160);
        if (!name)
            throw new ApiProviderError('invalid-response');
        const categories = f.properties.categories ?? [];
        const category = PRECEDENCE.find(k => CATEGORY_MAP[k].some(c => categories.includes(c)));
        out.push({
            category, record: {
                providerId: 'geoapify', upstreamId: f.properties.place_id, name, latitude: f.geometry.coordinates[1], longitude: f.geometry.coordinates[0], fetchedAt: new Date(at).toISOString(), expiresAt: new Date(at + 3600000).toISOString(), sourceUrl: 'https://www.geoapify.com/', attribution: GEOAPIFY_SOURCE.attribution, ...(category ? {
                    category
                } : {}), ...(f.properties.datasource ? {
                    additionalSources: [{
                            name: f.properties.datasource.sourcename ?? 'Geoapify upstream data', url: f.properties.datasource.url ?? GEOAPIFY_SOURCE.url, attribution: f.properties.datasource.attribution ?? GEOAPIFY_SOURCE.attribution, dataClass: 'context' as const, licenseUrl: f.properties.datasource.license_url, product: f.properties.datasource.license
                        }]
                } : {}), timeZoneEvidence: f.properties.timezone?.name && isIanaTimeZone(f.properties.timezone.name) ? {
                    status: 'verified', timeZone: f.properties.timezone.name, source: GEOAPIFY_SOURCE
                } : {
                    status: 'unknown'
                }, ...((f.properties.result_type === 'country' || f.properties.result_type === 'state') && COUNTRY_ISO3[f.properties.country_code?.toUpperCase() ?? ''] ? {
                    regionEvidence: {
                        countryCode: COUNTRY_ISO3[f.properties.country_code!.toUpperCase()]!, adminLevel: f.properties.result_type === 'country' ? 0 as const : 1 as const
                    }
                } : {})
            }
        });
    }
    uniqueRecords(out.map(x => x.record));
    const seen = new Set<string>();
    return {
        items: out.filter(row => {
            if (seen.has(row.record.upstreamId))
                return false;
            seen.add(row.record.upstreamId);
            return true;
        }), pageFull: data.features.length >= 20
    };
}
