import { GeometryAcquisition, UnsupportedGeometryError, type GeometrySnapshot } from './geometryAcquisition';
import { resolvePlaceInputSchema, resolvePlaceResultSchema } from '../../../shared/nightsky/places';
import { searchDiscoveryInputSchema, normalizeDiscoveryInput, searchDiscoveryResultSchema, getObservingLocationDetailsResultSchema, resolveObservingRegionResultSchema, type Category, type RegionRef, resolveObservingRegionInputSchema } from '../../../shared/nightsky/discovery';
import { hasCoordinatePair } from '../../../shared/nightsky/common';
import { CalculationPlaceClarificationError } from '../calculationPlace';
import { ApiProviderError, type ApiAttemptStatus } from './http';
import { uniqueRecords } from './records';
import { ApiSelectionStore } from './selectionStore';
import { ApiHttpClient, type ApiConfiguration } from './http';
import { geonamesResolve, GEONAMES_API_SOURCE } from './geonames';
import { geoapifyRecords, GEOAPIFY_SOURCE, CATEGORY_MAP } from './geoapify';
import type { DiscoveryProvider, ApiSourceRecord } from './types';
const source = (r: ApiSourceRecord) => ({
    name: r.providerId, url: r.sourceUrl, attribution: r.attribution, dataClass: 'context' as const, issuedAt: r.fetchedAt, licenseUrl: r.providerId === 'geoapify' ? 'https://www.openstreetmap.org/copyright' : 'https://creativecommons.org/licenses/by/4.0/'
});
const distance = (a: {
    latitude: number;
    longitude: number;
}, b: {
    latitude: number;
    longitude: number;
}) => {
    const rad = Math.PI / 180;
    const h = Math.sin((a.latitude - b.latitude) * rad / 2) ** 2 + Math.cos(a.latitude * rad) * Math.cos(b.latitude * rad) * Math.sin((a.longitude - b.longitude) * rad / 2) ** 2;
    return 6371 * 2 * Math.asin(Math.min(1, Math.sqrt(h)));
};
const caveats = ['Provider records do not verify darkness, public access, night opening, permits, safety or current closures.'];
export class ApiDiscoveryProvider implements DiscoveryProvider {
    private http: ApiHttpClient;
    private geometry: GeometryAcquisition;
    private cache = new Map<string, {
        json: string;
        expires: number;
        bytes: number;
    }>();
    private bytes = 0;
    constructor(private config: ApiConfiguration, private store: ApiSelectionStore) {
        this.http = new ApiHttpClient(config);
        this.geometry = new GeometryAcquisition(this.http, config.now ?? Date.now);
    }
    private get now() {
        return this.config.now ?? Date.now;
    }
    private cached<T>(key: string): T | undefined {
        for (const [k, e] of Array.from(this.cache))
            if (e.expires <= this.now()) {
                this.bytes -= e.bytes;
                this.cache.delete(k);
            }
        const e = this.cache.get(key);
        if (!e)
            return;
        const value = JSON.parse(e.json);
        if (value?.items?.some((row: {
            record: ApiSourceRecord;
        }) => Date.parse(row.record.expiresAt) <= this.now())) {
            this.bytes -= e.bytes;
            this.cache.delete(key);
            return;
        }
        this.cache.delete(key);
        this.cache.set(key, e);
        return JSON.parse(e.json);
    }
    private save(key: string, value: unknown, empty = false) {
        const old = this.cache.get(key);
        if (old) {
            this.bytes -= old.bytes;
            this.cache.delete(key);
        }
        const json = JSON.stringify(value);
        const bytes = Buffer.byteLength(json);
        if (bytes > 65536)
            return;
        while (this.cache.size >= 128 || this.bytes + bytes > 1048576) {
            const k = this.cache.keys().next().value;
            if (!k)
                return;
            this.bytes -= this.cache.get(k)!.bytes;
            this.cache.delete(k);
        }
        this.cache.set(key, {
            json, bytes, expires: Math.min(this.now() + (empty ? 60000 : 3600000), ...(Array.isArray((value as {
                items?: unknown;
            }).items) ? (value as {
                items: Array<{
                    record: ApiSourceRecord;
                }>;
            }).items.map(row => Date.parse(row.record.expiresAt)) : []))
        });
        this.bytes += bytes;
    }
    async resolvePlace(input: Parameters<DiscoveryProvider['resolvePlace']>[0]) {
        const parsed = resolvePlaceInputSchema.parse(input);
        if (parsed.useApproximateHostLocation)
            return resolvePlaceResultSchema.parse({
                matches: [], selectionRequired: false, availability: {
                    status: 'unavailable', reason: 'Host-location resolution is unsupported in API mode. Ask for a named town and country; no host coordinates are sent to the location APIs.'
                }, sources: [GEONAMES_API_SOURCE], caveats
            });
        const deadline = Date.now() + 15000;
        const query = parsed.placeQuery!;
        if (hasCoordinatePair(query) || /^\s*\d+\s+\S+.*\b(?:street|road|avenue|lane|drive|st|rd|ave)\b/i.test(query))
            throw new RangeError('Enter a named place, not coordinates or a street address.');
        const key = 'resolve:' + query.toLocaleLowerCase();
        const cached = this.cached<Awaited<ReturnType<DiscoveryProvider['resolvePlace']>>>(key);
        if (cached && cached.matches.every(m => m.sourceRevision && this.store.get({
            placeId: m.placeId, sourceRevision: m.sourceRevision
        })))
            return cached;
        let records: ApiSourceRecord[] = [];
        let attempted = false;
        const attempts: string[] = [];
        if (!this.config.geonamesUsername)
            attempts.push('GeoNames: not-configured');
        if (!this.config.geoapifyApiKey)
            attempts.push('Geoapify: not-configured');
        if (this.config.geonamesUsername) {
            attempted = true;
            try {
                records = await geonamesResolve(this.http, query, this.now, deadline);
                attempts.push(records.length ? 'GeoNames: success' : 'GeoNames: no-results');
            }
            catch (error) {
                attempts.push('GeoNames: ' + (error instanceof ApiProviderError ? error.status : 'invalid-response'));
            }
        }
        if (!records.length && this.config.geoapifyApiKey) {
            attempted = true;
            try {
                records = (await geoapifyRecords(this.http, '/v1/geocode/search', {
                    text: query, limit: '5', format: 'geojson'
                }, this.now, deadline)).items.map(x => x.record);
                attempts.push(records.length ? 'Geoapify: success' : 'Geoapify: no-results');
            }
            catch (error) {
                attempts.push('Geoapify: ' + (error instanceof ApiProviderError ? error.status : 'invalid-response'));
            }
        }
        const unique = uniqueRecords(records).slice(0, 5);
        const matches = unique.map(r => ({
            ...this.store.put(r), displayName: r.name, ...(r.timeZoneEvidence.status === 'verified' ? {
                timeZone: r.timeZoneEvidence.timeZone
            } : {}), fetchedAt: r.fetchedAt, expiresAt: r.expiresAt, timeZoneEvidence: r.timeZoneEvidence, sources: [source(r), ...(r.additionalSources ?? [])]
        }));
        const failed = attempts.some(x => !x.endsWith('success') && !x.endsWith('no-results') && !x.endsWith('not-configured'));
        const result = resolvePlaceResultSchema.parse({
            sourceAttempts: attempts.map(attempt => ({
                providerId: attempt.startsWith('GeoNames') ? 'geonames' : 'geoapify', status: attempt.split(': ')[1] as ApiAttemptStatus
            })), matches, selectionRequired: matches.length > 1, availability: {
                status: matches.length ? 'available' : !attempted || failed ? 'unavailable' : 'not-covered', reason: matches.length ? 'Named source matches found. Select an exact snapshot; choose a display time zone when the site zone is unknown.' : !attempted ? 'Named-place API credentials are not configured.' : 'No usable match in the bounded API search.'
            }, sources: unique.length ? unique.flatMap(r => [source(r), ...(r.additionalSources ?? [])]) : [GEONAMES_API_SOURCE], caveats: [...caveats, ...attempts]
        });
        if (matches.length || (!failed && attempted))
            this.save(key, result, !matches.length);
        return result;
    }
    async resolveRegion(input: Parameters<DiscoveryProvider['resolveRegion']>[0]) {
        const parsed = resolveObservingRegionInputSchema.parse(input);
        const matches: RegionRef[] = [];
        let failed = false;
        if (this.config.geoapifyApiKey) {
            try {
                const rows = await geoapifyRecords(this.http, '/v1/geocode/search', {
                    text: parsed.regionQuery, ...(parsed.adminLevel !== undefined ? {
                        type: parsed.adminLevel === 0 ? 'country' : 'state'
                    } : {}), limit: '5', format: 'geojson'
                }, this.now);
                for (const { record: r } of rows.items) {
                    const e = r.regionEvidence;
                    if (!e || (parsed.countryCode && e.countryCode !== parsed.countryCode) || (parsed.adminLevel !== undefined && e.adminLevel !== parsed.adminLevel))
                        continue;
                    const ref = this.store.put(r);
                    matches.push({
                        regionId: ref.placeId.replace('place:v1:', 'region:v1:'), sourceRevision: ref.sourceRevision, name: r.name, countryCode: e.countryCode, adminLevel: e.adminLevel, sources: [source(r), ...(r.additionalSources ?? [])]
                    });
                }
            }
            catch {
                failed = true;
            }
        }
        return resolveObservingRegionResultSchema.parse({
            matches: matches.slice(0, 5), selectionRequired: matches.length > 1, availability: {
                status: matches.length ? 'available' : !this.config.geoapifyApiKey || failed ? 'unavailable' : 'not-covered', reason: matches.length ? 'Select an API region source revision. Only its own provider place filter establishes discovery membership; its center is not an observing point.' : 'No usable country/state boundary identity is available from the configured source.'
            }, sources: matches.length ? matches.flatMap(m => m.sources) : [GEOAPIFY_SOURCE], caveats
        });
    }
    private candidate(r: ApiSourceRecord, category: Category = 'other') {
        return {
            ...this.store.put(r), name: r.name, category: r.category ?? category, timeZoneEvidence: r.timeZoneEvidence, fetchedAt: r.fetchedAt, expiresAt: r.expiresAt, latitude: r.latitude, longitude: r.longitude, accessEvidence: {
                status: 'unknown' as const
            }, sources: [source(r), ...(r.additionalSources ?? [])], caveats
        };
    }
    async details(ref: Parameters<DiscoveryProvider['details']>[0]) {
        const r = this.store.get(ref);
        if (!r)
            throw new CalculationPlaceClarificationError('resolve-again', 'The selected source snapshot expired or is unavailable. Resolve again.');
        return getObservingLocationDetailsResultSchema.parse({
            matches: [this.candidate(r)], selectionRequired: false, availability: {
                status: 'partial', reason: r.timeZoneEvidence.status === 'verified' ? 'Immutable source snapshot with source-supplied point timezone; site access remains unverified.' : 'Immutable source snapshot; site timezone and access remain unverified.'
            }, sources: [source(r), ...(r.additionalSources ?? [])], caveats
        });
    }
    async search(input: Parameters<DiscoveryProvider['search']>[0]) {
        let deadline = Date.now() + 15000;
        const parsed = searchDiscoveryInputSchema.parse(input);
        const scope = normalizeDiscoveryInput(parsed);
        const origins = scope.origins;
        const base = {
            queryScope: scope, sources: [GEOAPIFY_SOURCE], caveats, coverage: 'Bounded Geoapify single-page search; mapped feature completeness is unknown.', sortBasis: scope.originMode === 'all' ? 'maximum-distance' as const : 'minimum-distance' as const, originBasis: origins.map(o => ({
                placeId: o.placeId, basis: 'api-point' as const
            }))
        };
        const unavailable = (status: 'unsupported' | 'unavailable', reason: string) => searchDiscoveryResultSchema.parse({
            ...base, candidates: [], availability: {
                status, reason
            }, discoveryCoverage: {
                footprintStatus: 'not-covered', searchCompleteness: 'unavailable', mappedFeatureCompleteness: 'unknown', stopReason: reason
            }
        });
        const needsGeometry = !!(scope.excludeRegionIds.length || (scope.includeRegionIds.length && origins.length) || (scope.regionMode === 'all' && scope.includeRegionIds.length > 1));
        if (needsGeometry && !(this.config.geometryEnabled && this.config.geometrySourceAccepted))
            return unavailable('unsupported', 'Administrative membership, exclusions and intersections require boundary evidence unavailable in this API adapter. No constraints were removed.');
        if (!this.config.geoapifyApiKey)
            return unavailable('unavailable', 'Geoapify POI discovery credentials are not configured.');
        const selectedRegionIds = needsGeometry ? Array.from(new Set([...scope.includeRegionIds, ...scope.excludeRegionIds])) : scope.includeRegionIds;
        const allRegions = selectedRegionIds.map(regionId => {
            const selected = scope.regionSelections?.find(r => r.regionId === regionId);
            if (!selected)
                throw new CalculationPlaceClarificationError('resolve-again', 'Each API region requires its selected source revision. Resolve again.');
            const r = this.store.get({
                placeId: regionId.replace('region:v1:', 'place:v1:'), sourceRevision: selected.sourceRevision
            });
            if (!r?.regionEvidence || r.providerId !== 'geoapify')
                throw new CalculationPlaceClarificationError('resolve-again', 'The selected API region expired or lacks boundary-filter evidence. Resolve again.');
            return r;
        });
        const regions = scope.includeRegionIds.map(id => allRegions[selectedRegionIds.indexOf(id)]!);
        const points = origins.map(o => {
            if (!o.sourceRevision || o.catalogueRevision)
                throw new CalculationPlaceClarificationError('resolve-again', 'API discovery requires each origin source revision. Resolve again.');
            const r = this.store.get({
                placeId: o.placeId, sourceRevision: o.sourceRevision
            });
            if (!r)
                throw new CalculationPlaceClarificationError('resolve-again', 'The API origin snapshot expired. Resolve again.');
            return r;
        });
        let geometry = new Map<string, GeometrySnapshot>();
        if (needsGeometry) {
            // Separate admitted 30-second stage; candidate stage retains its existing 15-second cap.
            try { geometry = await this.geometry.acquire(allRegions.map((r, i) => ({ ref: scope.regionSelections!.find(ref => ref.regionId === selectedRegionIds[i])!, upstreamId: r.upstreamId, expiresAt: r.expiresAt })), Date.now() + 30000); }
            catch (error) { return unavailable(error instanceof UnsupportedGeometryError ? 'unsupported' : 'unavailable', error instanceof UnsupportedGeometryError ? error.message : 'Selected geometry acquisition failed within its bounded stage. No constraints were removed.'); }
            deadline = Date.now() + 15000;
            base.caveats = [...caveats, 'Administrative membership is relative to fetched original geometry using snapshot-planar-v1; source vintage is unknown. Boundary ties and expired membership are withheld.'];
        }
        const identityRecords = new Map<string, ApiSourceRecord>();
        const rejectedIds = new Set<string>();
        const candidates = new Map<string, ReturnType<ApiDiscoveryProvider['candidate']>>();
        let failure = false;
        let truncated = false;
        const sourceAttempts: Array<{
            providerId: 'geoapify';
            status: ApiAttemptStatus;
        }> = [];
        for (let i = 0; i < (origins.length && scope.originMode === 'all' ? 1 : (origins.length || regions.length)); i++) {
            const origin = origins[i];
            const point = points[i];
            const region = origins.length ? undefined : regions[i];
            const query = {
                categories: (parsed.categories ?? (Object.keys(CATEGORY_MAP) as Category[])).flatMap(c => CATEGORY_MAP[c]).join(','), filter: region ? `place:${region.upstreamId}` : `circle:${point!.longitude},${point!.latitude},${origin!.radiusKm * 1000}`, limit: '20'
            };
            const key = 'poi:' + JSON.stringify(query);
            try {
                let rows = this.cached<Awaited<ReturnType<typeof geoapifyRecords>>>(key);
                if (!rows) {
                    rows = await geoapifyRecords(this.http, '/v2/places', query, this.now, deadline);
                    this.save(key, rows, !rows.items.length);
                }
                sourceAttempts.push({
                    providerId: 'geoapify', status: rows.items.length ? 'success' : 'no-results'
                });
                if (rows.pageFull)
                    truncated = true;
                for (const row of rows.items) {
                    const identity = row.record.providerId + ':' + row.record.upstreamId;
                    const previous = identityRecords.get(identity);
                    const c = this.candidate(row.record, row.category);
                    if (previous) {
                        try {
                            uniqueRecords([previous, row.record]);
                        }
                        catch {
                            failure = true;
                            rejectedIds.add(c.placeId);
                            candidates.delete(c.placeId);
                            continue;
                        }
                    }
                    identityRecords.set(identity, row.record);
                    if (!row.category || (parsed.categories && !parsed.categories.includes(row.category)))
                        continue;
                    const old = candidates.get(c.placeId);
                    if (old && (old.latitude !== c.latitude || old.longitude !== c.longitude)) {
                        failure = true;
                        rejectedIds.add(c.placeId);
                        candidates.delete(c.placeId);
                    }
                    else if (!rejectedIds.has(c.placeId))
                        candidates.set(c.placeId, c);
                }
            }
            catch (error) {
                failure = true;
                sourceAttempts.push({
                    providerId: 'geoapify', status: error instanceof ApiProviderError ? error.status : 'invalid-response'
                });
            }
        }
        const selected = Array.from(candidates.values()).map(c => {
            const distances = points.map(p => distance(c, p));
            return {
                ...c, originDistances: origins.map((o, i) => ({
                    placeId: o.placeId, distanceKm: distances[i]!
                })), ...(origins.length ? {
                    distanceKm: scope.originMode === 'all' ? Math.max(...distances) : Math.min(...distances)
                } : {})
            };
        }).filter(c => {
            const flags = c.originDistances.map((d, i) => d.distanceKm >= origins[i]!.minimumDistanceKm && d.distanceKm <= origins[i]!.radiusKm);
            if (needsGeometry) {
                const included = scope.includeRegionIds.map(id => geometry.get(id)!.classify([c.longitude, c.latitude], this.now()));
                const excluded = scope.excludeRegionIds.map(id => geometry.get(id)!.classify([c.longitude, c.latitude], this.now()));
                if (included.includes('unknown') || excluded.includes('unknown')) { failure = true; return false; }
                if (excluded.includes('inside') || (included.length && !(scope.regionMode === 'all' ? included.every(state => state === 'inside') : included.some(state => state === 'inside')))) return false;
            }
            return !origins.length || (scope.originMode === 'all' ? flags.every(Boolean) : flags.some(Boolean));
        }).sort((a, b) => (a.distanceKm ?? 0) - (b.distanceKm ?? 0) || a.name.localeCompare(b.name) || a.placeId.localeCompare(b.placeId));
        if (selected.length > parsed.limit)
            truncated = true;
        return searchDiscoveryResultSchema.parse({
            ...base, ...(needsGeometry ? { geometryEvidence: Array.from(geometry.values()).map(g => ({ ...g.region, geometryRevision: g.geometryRevision, sourceVintage: g.sourceVintage, fetchedAt: g.fetchedAt, expiresAt: g.expiresAt, policy: 'snapshot-planar-v1', source: { ...GEOAPIFY_SOURCE, url: 'https://apidocs.geoapify.com/docs/place-details/', issuedAt: g.fetchedAt } })) } : {}), sources: selected.length ? Array.from(new Map(selected.flatMap(c => c.sources).map(s => [JSON.stringify(s), s])).values()) : [GEOAPIFY_SOURCE], sourceAttempts, ...(!origins.length ? {
                sortBasis: 'source-completeness-then-name-id'
            } : {}), candidates: selected.slice(0, parsed.limit), availability: {
                status: failure ? 'partial' : selected.length ? 'available' : 'not-covered', reason: failure ? 'A source request failed or a candidate has unknown snapshot membership; returned candidates preserve every requested constraint.' : 'Bounded source search completed; access and darkness are unverified.'
            }, truncationReason: truncated ? 'Provider page or requested candidate limit reached.' : undefined, discoveryCoverage: {
                footprintStatus: failure ? 'partial' : 'covered', searchCompleteness: failure || truncated ? 'budget-limited' : 'complete', mappedFeatureCompleteness: 'unknown', stopReason: failure ? 'One or more source requests unavailable.' : truncated ? 'Provider page or candidate result limit reached.' : undefined
            }
        });
    }
}
