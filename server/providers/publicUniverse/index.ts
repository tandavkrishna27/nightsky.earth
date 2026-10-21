import * as z from 'zod4';
import { searchReferenceObjectsInputSchema, getReferenceDetailsInputSchema, discoverObservingTargetsInputSchema, getCatalogueTargetWindowsInputSchema, referenceSearchResultSchema, referenceDetailsResultSchema, referenceObservingResultSchema, type ReferenceOperation, type ReferenceRecord, type ReferenceSearchResult, type ReferenceDetailsResult, type ReferenceObservingResult, type DiscoverObservingTargetsInput, type GetCatalogueTargetWindowsInput } from '../../../shared/nightsky/reference';
import * as c from './contracts';
import * as n from './normalization';
import { ReferenceStore, canonicalJson, type IdentitySnapshot, type Selection } from './referenceStore';
import { PublicUniverseTransport, PublicUniverseTransportError, ReferenceSuccessCache, type PublicUniverseRequest } from './transport';
type Options = ConstructorParameters<typeof PublicUniverseTransport>[0] & {
    fetcher?: typeof fetch;
    /** Configured production callers may admit only the reviewed starter subset. */
    scope?: 'all' | 'starter-only';
};
class InputError extends Error {
}
class UnsupportedFeature extends Error {
}
function inputParse<T>(schema: {
    parse: (v: unknown) => T;
}, value: unknown): T { try {
    return schema.parse(value);
}
catch {
    throw new InputError('invalid-input');
} }
type Coordinates = {
    latitude: number;
    longitude: number;
};
type Item = {
    record: ReferenceRecord;
    identity: IdentitySnapshot;
};
export const REVIEWED_STARTER_SOURCES: Record<string, {snapshot: string; sourceUrl: string; licence: string; licenceUrl: string; attribution: string}> = {
    bsc5p: {
        snapshot: '7fe926d80b535f9422ca81f8f3fee1d6422de29adaecfbd2f14b1a93fe5134b9',
        sourceUrl: 'https://heasarc.gsfc.nasa.gov/W3Browse/star-catalog/bsc5p.html',
        licence: 'HEASARC data-use policy',
        licenceUrl: 'https://heasarc.gsfc.nasa.gov/docs/heasarc/data_policy.html',
        attribution: 'Hoffleit & Warren (1991); NASA/GSFC HEASARC',
    },
    openngc: {
        snapshot: 'd8517e8d195ce69700645b60f8d6603d2aebba0e8e21f47603a4d6a31fe667a1',
        sourceUrl: 'https://github.com/mattiaverga/OpenNGC',
        licence: 'CC BY-SA 4.0',
        licenceUrl: 'https://creativecommons.org/licenses/by-sa/4.0/',
        attribution: 'Mattia Verga / OpenNGC',
    },
};
export function createPublicUniverseProvider(options: Options) {
    const transport = new PublicUniverseTransport({ ...options, fetch: options.fetcher ?? options.fetch }), now = options.now ?? Date.now, store = new ReferenceStore({ now }), cache = new ReferenceSuccessCache(now);
    const envelope = (operation: ReferenceOperation) => ({ provider: 'publicuniverse' as const, operation, status: 'available' as const, reason: null, errorCode: null, retrievedAt: new Date(now()).toISOString(), sources: [], limitations: [] as string[] });
    function failure(operation: ReferenceOperation, error: unknown) {
        const code = error instanceof PublicUniverseTransportError ? error.code : error instanceof UnsupportedFeature ? 'unsupported-feature' : error instanceof InputError ? 'invalid-input' : error instanceof Error && error.message === 'stale-selection' ? 'stale-selection' : 'invalid-response';
        const status = code === 'stale-selection' ? 'stale' : error instanceof InputError ? 'invalid-input' : error instanceof PublicUniverseTransportError && error.status === 404 ? 'not-found' : 'unavailable';
        return { ...envelope(operation), status, reason: `Public Universe ${code}.`, errorCode: code, data: null };
    }
    const select = (item: Item) => ({ ...item.record, selection: store.put(item.identity) });
    const reviewedStarter = (source: z.infer<typeof c.starterProvenanceSchema>) => {
        if (options.scope !== 'starter-only') return;
        const reviewed = REVIEWED_STARTER_SOURCES[source.source];
        if (!reviewed || source.snapshot_sha256 !== reviewed.snapshot || source.source_url !== reviewed.sourceUrl || source.license !== reviewed.licence || source.license_url !== reviewed.licenceUrl || source.attribution !== reviewed.attribution)
            throw Error('Unreviewed starter source lineage or credit');
    };
    const exactStarterIdentity = (selection: Selection, remote: IdentitySnapshot) => {
        const stored = store.get(selection);
        const comparable = (value: IdentitySnapshot) => ({ domain: value.domain, upstreamId: value.upstreamId, upstreamSourceIdentity: value.upstreamSourceIdentity ?? null, coordinateFrame: value.coordinateFrame ?? null, coordinateEpoch: value.coordinateEpoch ?? null, motionModel: value.motionModel ?? null });
        if (canonicalJson(comparable(stored)) !== canonicalJson(comparable(remote))) throw Error('stale-selection');
    };
    const request = async (r: PublicUniverseRequest, deadline?: number) => transport.request(r, { deadline });
    async function searchReferenceObjects(value: unknown): Promise<ReferenceSearchResult> {
        try {
            const input = inputParse(searchReferenceObjectsInputSchema, value), key = 'search:' + canonicalJson(input), hit = cache.get(key);
            if (options.scope === 'starter-only' && input.domain !== 'starter-targets') throw new UnsupportedFeature();
            let normalized: {
                items: Item[];
                total: number | null;
                available: boolean;
                limitations: string[];
                catalogueSnapshot?: z.infer<typeof c.catalogueSnapshotSchema>;
            };
            let retrievedAt: string;
            if (hit) {
                normalized = hit.value as typeof normalized;
                retrievedAt = hit.retrievedAt;
            }
            else {
                const response = await request({ kind: 'search', domain: input.domain, q: input.query, limit: input.limit });
                retrievedAt = response.retrievedAt;
                const parsed = c.parseSearchResponse(input.domain, response.value);
                const limitations: string[] = ['Catalogue context does not establish local visibility.'];
                if (parsed.results.length > input.limit)
                    throw Error('Result count mismatch');
                const items: Item[] = parsed.results.map((row: any) => {
                    if (input.domain === 'starter-targets') {
                        const source = (parsed as z.infer<typeof c.starterSearchResponseSchema>).sources[row.source];
                        reviewedStarter(source);
                        return { record: n.starterRecord(row, source), identity: n.starterIdentity(row, source) };
                    }
                    if (input.domain === 'exoplanets')
                        return { record: n.exoplanetRecord(row, limitations), identity: n.exoplanetIdentity(row) };
                    return { record: { domain: 'solar-system', upstreamId: row.id, name: row.name, aliases: row.designation ? [row.designation] : [], sources: [], measurements: [] }, identity: { domain: 'solar-system', upstreamId: row.id } };
                });
                normalized = { items, total: 'total' in parsed ? parsed.total : null, available: !('available' in parsed) || parsed.available, limitations, ...('catalogue_snapshot' in parsed ? { catalogueSnapshot: parsed.catalogue_snapshot } : {}) };
                // Cache normalized immutable identities and records; no raw payload or local refs.
                cache.put(key, normalized, retrievedAt, response.cacheControl, { method: 'GET', success: normalized.available });
            }
            return referenceSearchResultSchema.parse({ ...envelope('search'), retrievedAt, status: normalized.available ? 'available' : 'unavailable', reason: normalized.available ? null : 'Source catalogue is unavailable.', sources: normalized.items.flatMap(i => i.record.sources).slice(0, 30), limitations: normalized.limitations.slice(0, 20), data: { domain: input.domain, matches: normalized.items.map(select), selectionRequired: true, total: normalized.total, ...(normalized.catalogueSnapshot ? { catalogueSnapshot: normalized.catalogueSnapshot } : {}) } });
        }
        catch (error) {
            return referenceSearchResultSchema.parse(failure('search', error));
        }
    }
    async function getReferenceDetails(value: unknown): Promise<ReferenceDetailsResult> {
        let operation: ReferenceOperation = 'object';
        try {
            const input = inputParse(getReferenceDetailsInputSchema, value), deadline = transport.operationDeadline(), limitations: string[] = ['Reference facts do not establish local viewing potential or transit predictions.'];
            if (options.scope === 'starter-only' && input.kind !== 'selected-object') throw new UnsupportedFeature();
            let record: ReferenceRecord | null = null;
            const additionalSources:ReferenceRecord['sources']=[];
            let extra: Record<string, unknown> = {};
            const sections: NonNullable<ReferenceDetailsResult['data']>['sections'] = [];
            let retrievedAt = new Date(now()).toISOString();
            if (input.kind === 'meteor-shower') {
                operation = 'meteor-shower';
                const response = await request({ kind: operation, code: input.code }, deadline);
                retrievedAt = response.retrievedAt;
                const meteor = c.parseMeteorResponse(response.value, input.code);
                extra = { meteor: { ...meteor, parent: meteor.parent && typeof meteor.parent !== 'string' ? { id: meteor.parent.id, name: meteor.parent.name } : null } };
                limitations.push('Meteor parameter sets are background catalogue evidence, not annual peak or forecast evidence.');
            }
            else {
                const identity = store.get(input);
                const domain = identity.domain;
                if (options.scope === 'starter-only' && domain !== 'starter-targets') throw new UnsupportedFeature();
                if (input.kind === 'close-approaches') {
                    operation = 'close-approaches';
                    if (domain !== 'solar-system')
                        throw new InputError();
                    const response = await request({ kind: operation, id: identity.upstreamId, from: input.from, to: input.to, limit: input.limit }, deadline);
                    retrievedAt = response.retrievedAt;
                    const parsed = c.parseCloseApproaches(response.value, identity.upstreamId, input.from, input.to);
                    if (parsed.results.length > input.limit)
                        throw Error('Limit mismatch');
                    extra = { closeApproaches: parsed.results };
                    limitations.push('Close approach distance is not brightness or visibility.');
                }
                else if (input.kind === 'exoplanet-host') {
                    operation = 'exoplanet-host';
                    const hostId = domain === 'exoplanet-host' ? identity.upstreamId : domain === 'exoplanets' ? identity.hostId : null;
                    if (!hostId)
                        throw new InputError();
                    const response = await request({ kind: operation, id: hostId }, deadline);
                    retrievedAt = response.retrievedAt;
                    const host = c.parseHostDetail(response.value, hostId);
                    const evidence=n.hostEvidence(host);
                    const planets=host.planets.map(p=>n.exoplanetRecord(p,limitations));
                    additionalSources.push(evidence.source,...planets.flatMap(p=>p.sources));
                    extra = { host: { id: host.id, name: host.name, coordinates:evidence.coordinates,distance:evidence.distance,provenance:evidence.provenance,coordinateMetadata: host.coordinate_metadata, planets } };
                    limitations.push('Host coordinates are archive ICRS inputs without proper motion; remote revision association unverified.');
                    limitations.push('Host distance errors retain the source signed error fields in pc; dataset citation is provider documentation, not a per-row URL.');
                }
                else {
                    if (domain !== 'solar-system' && domain !== 'starter-targets' && domain !== 'exoplanets')
                        throw new InputError();
                    operation = domain === 'exoplanets' ? 'exoplanet' : 'object';
                    const response = await request({ kind: 'object', domain, id: identity.upstreamId }, deadline);
                    retrievedAt = response.retrievedAt;
                    if (domain === 'starter-targets') {
                        const row = c.parseStarterDetail(response.value, identity.upstreamId);
                        const remote = n.starterIdentity(row, row.provenance);
                        if (options.scope === 'starter-only') exactStarterIdentity(input, remote);
                        reviewedStarter(row.provenance);
                        record = n.starterRecord(row, row.provenance);
                        record.remoteRevisionAssociation = store.compare(input, remote).association;
                        if (options.scope === 'starter-only' && record.remoteRevisionAssociation !== 'verified') throw Error('stale-selection');
                        for (const section of input.sections)
                            sections.push({ section, status: 'unavailable', reason: 'Optional solar object section is unsupported for this domain.', records: [] });
                    }
                    else if (domain === 'exoplanets') {
                        const row = c.parseExoplanetDetail(response.value, identity.upstreamId, identity.hostId ?? undefined);
                        record = n.exoplanetRecord(row, limitations);
                        // Compare documentary provenance for changed selections, but it cannot establish catalogue/build revision association.
                        store.compare(input, n.exoplanetIdentity(row));
                        record.remoteRevisionAssociation = 'unverified';
                        for (const section of input.sections)
                            sections.push({ section, status: 'unavailable', reason: 'Optional solar object section is unsupported for this domain.', records: [] });
                    }
                    else {
                        const row = c.parseObjectDetail(response.value, identity.upstreamId);
                    limitations.push('Named reference measurements are a bounded subset; equatorial/polar radii, visual estimates and unnormalized orbital fields are omitted.');
                        record = n.solarRecord(row);
                        record.remoteRevisionAssociation = store.compare(input, n.solarIdentity(row)).association;
                        for (const section of input.sections) {
                            try {
                                let payload: unknown;
                                if ((section === 'discovery' || section === 'designations' || section === 'atmosphere') && row[section] != null)
                                    payload = section === 'designations' ? { results: row.designations } : row[section];
                                else {
                                    if (['moons', 'rings', 'atmosphere'].includes(section) && !['planet', 'dwarf_planet'].includes(row.object_type))
                                        throw Error('Unsupported parent type');
                                    const req: PublicUniverseRequest = section === 'discovery' || section === 'designations' ? { kind: section, id: row.id } : { kind: section, parentName: row.name };
                                    payload = (await request(req, deadline)).value;
                                }
                                sections.push(normalizeSection(section, payload, row.id));
                            }
                            catch (error) {
                                sections.push({ section, status: 'unavailable', reason: error instanceof PublicUniverseTransportError ? `Public Universe ${error.code}.` : 'Section evidence is unavailable or invalid.', records: [] });
                            }
                        }
                    }
                    record.selection = { referenceId: input.referenceId, revision: input.revision };
                }
            }
            return referenceDetailsResultSchema.parse({ ...envelope(operation), retrievedAt, status: sections.some(s => s.status !== 'available') ? 'partial' : 'available', sources: [...(record?.sources??[]),...additionalSources].slice(0,30), limitations: limitations.slice(0, 20), data: { record, sections, ...extra } });
        }
        catch (error) {
            return referenceDetailsResultSchema.parse(failure(operation, error));
        }
    }
    function normalizeSection(section: string, payload: unknown, id: string): NonNullable<ReferenceDetailsResult['data']>['sections'][number] {
        let rows: Record<string, unknown>[] = [];
        let facts: {
            name: string;
            value: string | null;
            source: string | null;
        }[] = [];
        let association = false;
        if (section === 'discovery' || section === 'atmosphere') {
            if (payload && typeof payload === 'object' && !Object.keys(payload).length)
                return { section, status: 'partial', reason: 'Requested section has no source evidence.', records: [] };
            const row = (section === 'discovery' ? c.discoveryDetailSchema : c.atmosphereSchema).parse(payload);
            if (row.object_id !== id)
                throw Error('Section identity mismatch');
            rows = [row];
            association = true;
        }
        else if (section === 'designations')
            rows = z.object({ results: z.array(c.designationSchema).max(40) }).parse(payload).results;
        else if (section === 'rings')
            rows = z.object({ results: z.array(c.ringSchema).max(100) }).parse(payload).results;
        else
            rows = z.object({ results: z.array(c.objectDetailSchema.pick({ id: true, name: true, designation: true, discoverer: true, discovery_date: true }).merge(c.physicalSchema).merge(c.orbitalSchema)).max(100) }).parse(payload).results;
        for (const row of rows) {
            if ((row.object_id && row.object_id !== id) || (row.parent_id && row.parent_id !== id))
                throw Error('Section identity mismatch');
            for (const [key, value] of Object.entries(row)) {
                if (['object_id', 'parent_id', 'source', 'id'].includes(key) || value === undefined)
                    continue;
                if (typeof value === 'string' || typeof value === 'number' || value === null)
                    facts.push({ name: section + '.' + key, value: value === null ? null : String(value).slice(0, 500), source: typeof row.source === 'string' ? row.source : null });
                if (key === 'composition' && Array.isArray(value))
                    for (const v of value)
                        facts.push({ name: 'composition.' + v.species, value: v.fraction == null ? null : String(v.fraction) + (v.unit ? ' ' + v.unit : ' (unit unknown)'), source: typeof row.source === 'string' ? row.source : null });
            }
        }
        const reduced = rows.length > 20 || facts.length > 30;
        const records = section === 'moons' ? rows.slice(0, 20).map(row => n.solarRecord({ id: String(row.id), name: String(row.name), designation: typeof row.designation === 'string' ? row.designation : null, object_type: 'moon', sources: [], physical: c.physicalSchema.parse(row), orbital: c.orbitalSchema.parse(row) })) : [];
        return { section, status: association && !reduced ? 'available' : 'partial', reason: reduced ? 'Requested section was reduced to bounded facts.' : association ? null : 'Parent association is unverified in this source response.', records, facts: facts.slice(0, 30) };
    }
    async function observing(operation: 'discover' | 'night', value: unknown, coordinates: Coordinates): Promise<ReferenceObservingResult> {
        try {
            const input = operation === 'discover' ? inputParse(discoverObservingTargetsInputSchema, value) : inputParse(getCatalogueTargetWindowsInputSchema, value);
            if (options.scope === 'starter-only' && operation === 'discover' && 'preference' in input && input.preference === 'solar_system') throw new UnsupportedFeature();
            const selections = operation === 'night' ? (input as GetCatalogueTargetWindowsInput).targets : [];
            const identities = selections.map(s => store.get(s));
            if (identities.some(s => s.domain !== 'starter-targets' || !c.isSupportedStarterId(s.upstreamId)))
                throw new InputError();
            const targetIds = identities.map(s => s.upstreamId);
            let body: ReturnType<typeof c.buildObservingRequest>;
            try {
                body = c.buildObservingRequest(operation, input, coordinates, operation === 'night' ? targetIds : undefined);
            }
            catch {
                throw new InputError();
            }
            const response = await request({ kind: operation, body });
            const binding = { ...input, ...coordinates, ...(operation === 'night' ? { targetIds } : {}) };
            const discovery = operation === 'discover' ? c.parseDiscoveryResponse(response.value, binding) : null;
            const plan = discovery ? discovery.plan : c.parseNightResponse(response.value, binding);
            if (options.scope === 'starter-only') {
                for (const source of discovery?.discovery.source_snapshots ?? []) reviewedStarter(source);
                for (const target of plan?.targets ?? []) if (target.catalogue) reviewedStarter(target.catalogue);
            }
            const sources = discovery ? discovery.discovery.source_snapshots.map(n.starterSource) : [];
            const targets = (plan?.targets ?? []).filter(target => options.scope !== 'starter-only' || !!target.catalogue).map(target => {
                let record: ReferenceRecord = { domain: target.catalogue ? 'starter-targets' : 'solar-system', upstreamId: target.id, name: target.name, aliases: [], sources: target.catalogue ? [n.starterSource(target.catalogue)] : [], measurements: [], observingSupported: true };
                if (operation === 'night') {
                    const i = targetIds.indexOf(target.id);
                    if (i < 0 || !target.catalogue)
                        throw Error('Missing comparable starter source');
                    const remote = n.observingIdentity(target.id, target.catalogue);
                    const stored = identities[i];
                    // All lineage tokens are mandatory for observing; shared subset comparison alone is insufficient.
                    if (!stored.upstreamSourceIdentity || !remote.upstreamSourceIdentity || canonicalJson(stored) !== canonicalJson({ ...remote, hostId: stored.hostId ?? null })) {
                        const association = store.compare(selections[i], remote).association;
                        if (association !== 'verified')
                            throw Error('Missing comparable starter source');
                        for (const key of ['source', 'snapshot_sha256', 'upstream_sha256', 'equinox', 'reference_epoch_jyear', 'observation_epoch_jyear'])
                            if (stored.upstreamSourceIdentity?.[key] !== remote.upstreamSourceIdentity?.[key])
                                throw Error('stale-selection');
                        if (stored.coordinateFrame !== remote.coordinateFrame || stored.motionModel !== remote.motionModel)
                            throw Error('stale-selection');
                    }
                    record.selection = selections[i];
                    record.remoteRevisionAssociation = 'verified';
                }
                else if (target.catalogue) {
                    record.selection = store.put(n.observingIdentity(target.id, target.catalogue));
                }
                const reduced = c.reduceChartSamples(target.samples, input.window);
                const candidate = discovery?.candidates.find(x => x.id === target.id);
                return { record, ...(target.catalogue ? { catalogue: target.catalogue } : {}), status: target.status, constraintCoverage: target.constraint_coverage, sampling: { originalCount: reduced.originalCount, inWindowCount: reduced.inWindowCount, reduced: reduced.reduced, sampleScope: reduced.sampleScope }, windows: target.windows.map(w => ({ startUtc: w.start_utc, endUtc: w.end_utc, status: target.status === 'unresolved_grazing' ? 'unresolved_grazing' as const : 'available' as const })), samples: reduced.samples.map(s => ({ atUtc: s.time_utc, altitudeDeg: s.altitude_deg, azimuthDeg: s.azimuth_deg })), limitations: ['Chart samples are bounded full-night samples filtered to the selected interval; omitted separation/distance columns are not a continuous track.'], ...(candidate ? { appearance: candidate.appearance, preferenceReasons: candidate.preference_reasons, fieldContext: candidate.field_context, brightnessStatus: candidate.brightness_status } : {}) };
            });
            const moon = plan ? c.reduceChartSamples(plan.moon.samples, input.window) : null;
            const requestEcho = discovery?.request;
            const effective = plan?.observer ?? { lat: requestEcho!.lat, lon: requestEcho!.lon };
            return referenceObservingResultSchema.parse({ ...envelope(operation), retrievedAt: response.retrievedAt, sources: [...sources, ...targets.flatMap(t => t.record.sources)].slice(0, 30), limitations: ['Provider coordinates are rounded to two decimals; geometry excludes terrain and does not guarantee detection.', 'Coarse screening is incomplete between samples; no matches is not an all-sky negative.', 'Moon phase is referenced to the full local-night midpoint.', ...(options.scope === 'starter-only' ? ['Unscreened solar-system target records were omitted from this catalogue enrichment.'] : [])], data: { requestedCoordinates: coordinates, effectiveCoordinates: { latitude: effective.lat, longitude: effective.lon }, localNightDate: input.localNightDate, timeZone: input.displayTimeZone, window: input.window, method: discovery?.method ?? plan!.method, constraints: plan?.constraints ?? null, night: plan?.night ?? null, darkness: plan?.darkness ?? null, moon: plan && moon ? { ...plan.moon, samples: moon.samples, sampling: { originalCount: moon.originalCount, inWindowCount: moon.inWindowCount, reduced: moon.reduced, sampleScope: moon.sampleScope } } : null, ...(discovery ? { discovery: Object.fromEntries(Object.entries(discovery.discovery).filter(([key]) => key !== 'options')) } : {}), targets } });
        }
        catch (error) {
            return referenceObservingResultSchema.parse(failure(operation, error));
        }
    }
    return { searchReferenceObjects, getReferenceDetails, discoverObservingTargets: (input: unknown, coordinates: Coordinates) => observing('discover', input, coordinates), getCatalogueTargetWindows: (input: unknown, coordinates: Coordinates) => observing('night', input, coordinates), async close() { try {
            await transport.close();
        }
        finally {
            store.close();
            cache.close();
        } } };
}
export type PublicUniverseProvider = ReturnType<typeof createPublicUniverseProvider>;
