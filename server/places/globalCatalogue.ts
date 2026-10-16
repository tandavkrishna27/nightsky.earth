import { createHash } from 'node:crypto';
import { candidateRefSchema, discoveryScopeSchema, searchDiscoveryResultSchema, countryCodeSchema, type CatalogueReader, type CandidateRef, type Category, type RegionIndex, type RegionRef } from '../../shared/nightsky/discovery';
import { placeIdSchema, hasCoordinatePair, assertStructuredResultSize, type SourceRecord } from '../../shared/nightsky/common';
import { type CatalogueFiles, type CatalogueBudget, CatalogueBudgetStop, type Bounds, type PageRef, type CatalogueCandidate, normalizeCatalogueName } from './catalogueFiles';
import { GeoNamesPlaceIndex, resolvedCoordinatesForPlace } from './geonames';
import { createRegionIndex } from './regions';
function publicCandidate(row: CatalogueCandidate & {
    originDistances?: CandidateRef['originDistances'];
}): CandidateRef { const { sourceCompleteness, countryCode, regionIds, ...candidate } = row; return candidateRefSchema.parse(candidate); }
const lexical = (a: string, b: string) => a < b ? -1 : a > b ? 1 : 0;
const keyRoute = (key: string) => (r: PageRef) => (r.minKey === undefined || r.minKey <= key) && (r.maxKey === undefined || key <= r.maxKey);
const overlaps = (a: Bounds, b: Bounds) => a.south <= b.north && b.south <= a.north && a.west <= b.east && b.west <= a.east;
const contains = (a: Bounds, b: Bounds) => a.south <= b.south && a.north >= b.north && a.west <= b.west && a.east >= b.east;
export function catalogueDistanceKm(a: {
    latitude: number;
    longitude: number;
}, b: {
    latitude: number;
    longitude: number;
}) { const rad = Math.PI / 180; const h = Math.sin((b.latitude - a.latitude) * rad / 2) ** 2 + Math.cos(a.latitude * rad) * Math.cos(b.latitude * rad) * Math.sin((b.longitude - a.longitude) * rad / 2) ** 2; return 6371.0088 * 2 * Math.asin(Math.sqrt(Math.min(1, Math.max(0, h)))); }
/** Conservative spherical-cap rectangles, split at the antimeridian. */
export function catalogueRadiusBounds(latitude: number, longitude: number, radiusKm: number): Bounds[] { const delta = radiusKm / 6371.0088, deg = 180 / Math.PI, south = Math.max(-90, latitude - delta * deg), north = Math.min(90, latitude + delta * deg); let width = 180; if (south > -90 && north < 90)
    width = Math.asin(Math.min(1, Math.sin(delta) / Math.cos(latitude / deg))) * deg; const west = longitude - width, east = longitude + width; if (width === 180)
    return [{ south, north, west: -180, east: 180 }]; if (west < -180)
    return [{ south, north, west: west + 360, east: 180 }, { south, north, west: -180, east }]; if (east > 180)
    return [{ south, north, west, east: 180 }, { south, north, west: -180, east: east - 360 }]; return [{ south, north, west, east }]; }
function subtractCell(rect: Bounds, cell: Bounds): Bounds[] {
    if (!overlaps(rect, cell))
        return [rect];
    const south = Math.max(rect.south, cell.south), north = Math.min(rect.north, cell.north), west = Math.max(rect.west, cell.west), east = Math.min(rect.east, cell.east);
    const rest: Bounds[] = [];
    if (rect.south < south)
        rest.push({ ...rect, north: south });
    if (north < rect.north)
        rest.push({ ...rect, south: north });
    if (rect.west < west)
        rest.push({ south, north, west: rect.west, east: west });
    if (east < rect.east)
        rest.push({ south, north, west: east, east: rect.east });
    return rest;
}
export class CatalogueRevisionError extends Error {
    constructor() { super('Candidate catalogue revision is stale; search again.'); }
}
export const MAX_SCANNED_CANDIDATE_IDENTITIES = 100000;
function identityDigest(row: CatalogueCandidate):string {const canonical=(value:unknown):unknown=>Array.isArray(value)?value.map(canonical):value&&typeof value==='object'?Object.fromEntries(Object.entries(value).sort(([a],[b])=>lexical(a,b)).map(([key,v])=>[key,canonical(v)])):value;return createHash('sha256').update(JSON.stringify(canonical(row))).digest('hex');}
export interface GlobalCatalogueOptions {
    maxScannedIdentities?: number;
    cities: GeoNamesPlaceIndex;
    regions?: RegionIndex;
    budget?: {
        maxLeaves?: number;
        maxDirectoryBytes?: number;
        timeoutMs?: number;
    };
}
export function createGlobalCatalogue(files: CatalogueFiles, options: GlobalCatalogueOptions): CatalogueReader & {
    files: CatalogueFiles;
    regions: RegionIndex;
} {
    const regions = options.regions ?? createRegionIndex(files, options.budget), revision = files.root.catalogueRevision;
    const maximumIdentities=options.maxScannedIdentities??MAX_SCANNED_CANDIDATE_IDENTITIES;
    if(!Number.isSafeInteger(maximumIdentities)||maximumIdentities<1||maximumIdentities>MAX_SCANNED_CANDIDATE_IDENTITIES)throw new RangeError('Invalid scanned candidate identity limit');
    const budget = () => files.createBudget(options.budget);
    function stopped(b: CatalogueBudget) { if (b.stopReason)
        throw new CatalogueBudgetStop(b.stopReason); }
    async function lookupRaw(placeId: string, b: CatalogueBudget): Promise<CatalogueCandidate | undefined> {
        placeIdSchema.parse(placeId);
        let found: CatalogueCandidate | undefined;
        for await (const page of files.walk('id', { accept: keyRoute(placeId), budget: b })) {
            if (page.kind !== 'ids')
                throw new TypeError('Unexpected ID page');
            for (const row of page.rows)
                if (row.key === placeId) {
                    if (found)
                        throw new TypeError('Duplicate candidate ID index');
                    const leaf = await files.readPage(row.page, b);
                    if (leaf.kind !== 'candidates')
                        throw new TypeError('ID index must reference candidates');
                    const hits = leaf.rows.filter(r => r.placeId === placeId);
                    if (hits.length !== 1)
                        throw new TypeError('Candidate ID index mismatch');
                    found = hits[0];
                }
        }
        stopped(b);
        return found;
    }
    async function lookup(placeId: string, b: CatalogueBudget) { const r = await lookupRaw(placeId, b); return r ? publicCandidate(r) : undefined; }
    async function knownRegion(id: string, b: CatalogueBudget) { let found: RegionRef | undefined; for await (const page of files.walk('regions', { accept: keyRoute(id), budget: b })) {
        if (page.kind !== 'regions')
            throw new TypeError('Unexpected region page');
        for (const r of page.rows)
            if (r.regionId === id) {
                if (found)
                    throw new TypeError('Duplicate region ID');
                found = r;
            }
    } stopped(b); if (!found)
        throw new TypeError(`Unknown administrative region ID: ${id}`); return found; }
    return { files, regions,
        async details(ref) { if (ref.catalogueRevision !== revision)
            throw new CatalogueRevisionError(); return lookup(ref.placeId, budget()); },
        async findNames(query) { if (typeof query.placeQuery !== 'string' || !query.placeQuery.trim() || query.placeQuery.length > 160 || hasCoordinatePair(query.placeQuery))
            throw new TypeError('Enter a named place, not coordinates'); if (query.countryCode !== undefined)
            countryCodeSchema.parse(query.countryCode); const name = normalizeCatalogueName(query.placeQuery), b = budget(), ids: string[] = []; for await (const page of files.walk('name', { accept: keyRoute(name), budget: b })) {
            if (page.kind !== 'names')
                throw new TypeError('Unexpected name page');
            for (const r of page.rows)
                if (r.key === name && (query.countryCode === undefined || query.countryCode === r.countryCode)) {
                    if (!ids.includes(r.placeId)) {
                        ids.push(r.placeId);
                        ids.sort(lexical);
                        if (ids.length > 5)
                            ids.pop();
                    }
                }
        } stopped(b); const matches: CandidateRef[] = []; for (const id of ids) {
            const r = await lookup(id, b);
            if (!r)
                throw new TypeError('Name index references unknown candidate');
            matches.push(r);
        } return matches; },
        async search(raw, searchOptions) {
            const scope = discoveryScopeSchema.parse(raw);
            if (!Number.isInteger(searchOptions.limit) || searchOptions.limit < 1 || searchOptions.limit > 10)
                throw new RangeError('Search limit must be 1–10');
            const categories = searchOptions.categories;
            if (categories && (categories.length < 1 || categories.length > 6 || categories.some(c => !['park', 'viewpoint', 'protected-area', 'campground', 'beach', 'other'].includes(c))))
                throw new TypeError('Invalid categories');
            const b = budget(), sources: SourceRecord[] = [], sourceKeys = new Map<string, string>();
            function addSources(items: SourceRecord[]) { for (const s of items) {
                const key = JSON.stringify([s.url, s.product, s.model, s.vintage, s.issuedAt, s.validStartUtc, s.validEndUtc]);
                const value = JSON.stringify(Object.fromEntries(Object.entries(s).sort(([a], [c]) => lexical(a, c))));
                if (sourceKeys.has(key)) {
                    if (sourceKeys.get(key) !== value)
                        throw new TypeError('Conflicting source provenance');
                    continue;
                }
                if (sources.length >= 64) {
                    throw new CatalogueBudgetStop('source-limit');
                }
                sourceKeys.set(key, value);
                sources.push(s);
            } }
            const originPoints: {
                latitude: number;
                longitude: number;
            }[] = [], originBasis: {
                placeId: string;
                basis: 'named-record' | 'catalogue-point';
            }[] = [], rectangles: Bounds[][] = [];
            let stop: string | undefined;
            for (const o of scope.origins) {
                let point = resolvedCoordinatesForPlace(options.cities, o.placeId);
                if (point) {
                    const city = options.cities.getById(Number(o.placeId.split(':').at(-1)))!;
                    addSources(options.cities.toPlaceRef(city).sources);
                    originBasis.push({ placeId: o.placeId, basis: 'named-record' });
                }
                else {
                    if (o.catalogueRevision !== revision)
                        throw new CatalogueRevisionError();
                    const r = await lookup(o.placeId, b);
                    if (!r)
                        throw new TypeError('Unknown candidate origin; search again');
                    point = r;
                    addSources(r.sources);
                    originBasis.push({ placeId: o.placeId, basis: 'catalogue-point' });
                }
                originPoints.push(point);
                rectangles.push(catalogueRadiusBounds(point.latitude, point.longitude, o.radiusKm));
            }
            const requestedRegions = new Map<string, RegionRef>();
            for (const id of Array.from(new Set([...scope.includeRegionIds, ...scope.excludeRegionIds]))) {
                const region = await knownRegion(id, b);
                requestedRegions.set(id, region);
                addSources(region.sources);
            }
            // Missing tags are not proof of being outside a boundary. A known
            // different country can establish nonmembership without state data.
            function membership(row: CatalogueCandidate, id: string): boolean | undefined {
                if (row.regionIds.includes(id)) return true;
                if (row.countryCode && row.countryCode !== requestedRegions.get(id)!.countryCode) return false;
                return undefined;
            }
            let anyFootprint = files.root.trees.footprints.rows > 0, overlapFootprint = false;
            const remaining = rectangles.map(rs => rs.map(r => ({ ...r })));
            let wholeWorld = false;
            const world = { south: -90, north: 90, west: -180, east: 180 };
            // Coverage proof needs every origin rectangle, even for an all-origin scope.
            // Administrative tags cannot make a geographically disjoint cell relevant.
            const footprintRoute = (r: PageRef) => !r.bounds || !rectangles.length || rectangles.some(rs => rs.some(box => overlaps(r.bounds!, box)));
            // Share the total resource ceiling while reserving work for candidate search.
            // A region-only coverage scan has no administrative routing bounds.
            const coverageBudget: CatalogueBudget = {
                ...b,
                maxLeaves: b.leaves + Math.floor((b.maxLeaves - b.leaves) / 2),
                maxDirectoryBytes: b.directoryBytes + Math.floor((b.maxDirectoryBytes - b.directoryBytes) / 2),
                deadline: b.deadline - Math.floor(Math.max(0, b.deadline - Date.now()) / 2),
            };
            let coverageStop: string | undefined;
            try {
                for await (const page of files.walk('footprints', { accept: footprintRoute, budget: coverageBudget })) {
                    if (page.kind !== 'footprints')
                        throw new TypeError('Unexpected footprint page');
                    for (const fp of page.rows) {
                        if (Date.now() >= coverageBudget.deadline) {
                            coverageBudget.stopReason = 'time-limit';
                            throw new CatalogueBudgetStop('time-limit');
                        }
                        anyFootprint = true;
                        const geographicOverlap = rectangles.some(rs => rs.some(box => overlaps(fp.bounds, box)));
                        const global = contains(fp.bounds, world);
                        if (rectangles.length ? !geographicOverlap : !global && !scope.includeRegionIds.some(id => fp.regionIds?.includes(id)))
                            continue;
                        addSources(fp.sources);
                        if (global)
                            wholeWorld = true;
                        for (let i = 0; i < rectangles.length; i++)
                            for (let j = 0; j < rectangles[i].length; j++) {
                                if (overlaps(fp.bounds, rectangles[i][j]))
                                    overlapFootprint = true;
                            }
                        for (let i = 0; i < remaining.length; i++) {
                            remaining[i] = remaining[i].flatMap(r => subtractCell(r, fp.bounds));
                            if (remaining[i].length > 4096)
                                throw new CatalogueBudgetStop('coverage-fragment-limit');
                        }
                        if (scope.includeRegionIds.some(id => fp.regionIds?.includes(id)))
                            overlapFootprint = true;
                    }
                }
                stopped(coverageBudget);
            }
            catch (e) {
                if (!(e instanceof CatalogueBudgetStop))
                    throw e;
                stop = coverageStop = e.reason;
            }
            finally {
                b.leaves = coverageBudget.leaves;
                b.directoryBytes = coverageBudget.directoryBytes;
            }
            const allOriginsCovered = remaining.length > 0 && remaining.every(rs => rs.length === 0);
            const covered = wholeWorld || (allOriginsCovered && !scope.includeRegionIds.length);
            const footprintStatus = covered ? 'covered' : overlapFootprint || coverageStop ? 'partial' : 'not-covered';
            const ranked: {
                row: CatalogueCandidate;
                candidate: CandidateRef;
                distance: number;
            }[] = [];
            const sortBasis = originPoints.length ? (scope.originMode === 'all' ? 'maximum-distance' : 'minimum-distance') : 'source-completeness-then-name-id';
            function compare(a: typeof ranked[number], c: typeof ranked[number]) { return (originPoints.length ? a.distance - c.distance : 0) || c.row.sourceCompleteness - a.row.sourceCompleteness || lexical(a.row.name, c.row.name) || lexical(a.row.placeId, c.row.placeId); }
            const accept = (r: PageRef) => !r.bounds || !rectangles.length || (scope.originMode === 'all' ? rectangles.every(rs => rs.some(box => overlaps(r.bounds!, box))) : rectangles.some(rs => rs.some(box => overlaps(r.bounds!, box))));
            async function* queryRows(): AsyncGenerator<CatalogueCandidate> {
                if (originPoints.length) {
                    for await (const page of files.walk('spatial', { accept, budget: b })) {
                        if (page.kind !== 'candidates')
                            throw new TypeError('Unexpected spatial page');
                        for (const row of page.rows)
                            yield row;
                    }
                    return;
                }
                const includes = Array.from(new Set(scope.includeRegionIds)), seenPages = new Map<string, string>();
                for (const id of scope.regionMode === 'all' ? includes.slice(0, 1) : includes) {
                    for await (const page of files.walk('membership', { accept: keyRoute(id), budget: b })) {
                        if (page.kind !== 'memberships')
                            throw new TypeError('Unexpected membership page');
                        for (const member of page.rows)
                            if (member.key === id) {
                                if (member.page) {
                                    const signature = JSON.stringify(member.page), previous = seenPages.get(member.page.path);
                                    if (previous !== undefined) {
                                        if (previous !== signature)
                                            throw new TypeError('Conflicting membership page reference');
                                        continue;
                                    }
                                    if (seenPages.size >= 256)
                                        throw new CatalogueBudgetStop('membership-page-limit');
                                    seenPages.set(member.page.path, signature);
                                    const candidates = await files.readPage(member.page, b);
                                    if (candidates.kind !== 'candidates' || !candidates.rows.some(r => r.placeId === member.placeId && r.regionIds.includes(id)))
                                        throw new TypeError('Membership page index mismatch');
                                    for (const row of candidates.rows)
                                        yield row;
                                }
                                else {
                                    const row = await lookupRaw(member.placeId, b);
                                    if (!row || !row.regionIds.includes(id))
                                        throw new TypeError('Membership index mismatch');
                                    if (scope.regionMode === 'any' && includes.find(key => row.regionIds.includes(key)) !== id)
                                        continue;
                                    yield row;
                                }
                            }
                    }
                    stopped(b);
                }
            }
            if ((!stop || coverageStop && ['leaf-limit', 'directory-byte-limit', 'time-limit', 'coverage-fragment-limit'].includes(coverageStop)) && footprintStatus !== 'not-covered')
                try {
                    const identities=new Map<string,string>();
                for await (const row of queryRows()) {
                    const signature=identityDigest(row),previous=identities.get(row.placeId);
                    if(previous!==undefined){if(previous!==signature)throw new TypeError('Conflicting candidate identity across catalogue leaves');continue;}
                    if(identities.size>=maximumIdentities)throw new CatalogueBudgetStop('scanned-identity-limit');
                    identities.set(row.placeId,signature);
                        if (Date.now() >= b.deadline) {
                            b.stopReason = 'time-limit';
                            throw new CatalogueBudgetStop('time-limit');
                        }
                        if (categories && !categories.includes(row.category))
                            continue;
                        if (scope.excludeRegionIds.some(id => membership(row, id) !== false))
                            continue;
                        if (scope.includeRegionIds.length && !(scope.regionMode === 'all' ? scope.includeRegionIds.every(id => membership(row, id) === true) : scope.includeRegionIds.some(id => membership(row, id) === true)))
                            continue;
                        const distances = originPoints.map(p => catalogueDistanceKm(p, row));
                        const inside = distances.map((d, i) => d >= scope.origins[i].minimumDistanceKm && d <= scope.origins[i].radiusKm);
                        if (inside.length && !(scope.originMode === 'all' ? inside.every(Boolean) : inside.some(Boolean)))
                            continue;
                        const distance = distances.length ? (scope.originMode === 'all' ? Math.max(...distances) : Math.min(...distances)) : 0;
                        const candidate = publicCandidate({ ...row, ...(distances.length ? { distanceKm: distance, originDistances: distances.map((distanceKm, i) => ({ placeId: scope.origins[i].placeId, distanceKm })) } : {}) });
                        addSources(row.sources);
                        ranked.push({ row, candidate, distance });
                        ranked.sort(compare);
                        if (ranked.length > searchOptions.limit)
                            ranked.pop();
                    }
                    stopped(b);
                }
                catch (e) {
                    if (!(e instanceof CatalogueBudgetStop))
                        throw e;
                    stop = coverageStop && coverageStop !== e.reason ? `coverage-${coverageStop}; candidates-${e.reason}` : e.reason;
                }
            if (!sources.length)
                throw new TypeError('Catalogue has no source-linked footprint or region metadata');
            const unavailable = !stop && footprintStatus === 'not-covered';
            const completeness = stop ? 'budget-limited' : unavailable ? 'unavailable' : 'complete';
            const reason = stop ? `Catalogue search stopped: ${stop}. Ranking is incomplete.` : unavailable ? (anyFootprint ? 'Requested geography is outside admitted footprints.' : 'No admitted catalogue footprints are installed.') : 'Search completed within admitted source footprints; mapped-feature completeness is unknown.';
            const result = searchDiscoveryResultSchema.parse({ availability: { status: stop || footprintStatus === 'partial' ? 'partial' : unavailable ? 'not-covered' : 'available', reason }, sources, caveats: ['Source geometry identifies candidate points; darkness and night access are not verified.', 'Coverage describes admitted source footprints, not completeness of real-world observing sites.', ...(requestedRegions.size ? ['Administrative region membership may be unknown; candidates without enough membership evidence to satisfy region filters are omitted. Search completeness describes processed catalogue rows, not complete regional membership.'] : [])], candidates: ranked.map(r => r.candidate), sortBasis, coverage: reason, discoveryCoverage: { footprintStatus, searchCompleteness: completeness, mappedFeatureCompleteness: 'unknown', catalogueRevision: revision, ...(stop ? { stopReason: stop } : {}) }, queryScope: scope, originBasis, ...(stop ? { truncationReason: stop } : {}) });
            assertStructuredResultSize(result);
            return result;
        }
    };
}
