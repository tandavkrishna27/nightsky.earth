import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import { performance } from 'node:perf_hooks';
import { pathToFileURL } from 'node:url';
export interface MeasurementReport {
    schemaVersion: 1;
    synthetic: true;
    liveEvidenceEligible: false;
    sourceVersion: string;
    configuration: {
        mode: 'offline-fixture';
        providers: string[];
        concurrency: 1;
        maxRequests: number;
        timeBudgetMs: number;
    };
    requests: Array<{
        operation: string;
        latencyMs: number;
        status: string;
    }>;
    attempts: Array<{
        provider: string;
        status: number;
    }>;
    metrics: {
        p50Ms: number;
        p95Ms: number;
        peakRssBytes: number;
        startupMs: number;
        cache: {
            entries: number;
            bytes: number;
        };
        discoveryCache: null;
        discoveryCacheReason: string;
        retries: null;
        retriesReason: string;
        storage: null;
        storageReason: string;
    };
    elapsedMs: number;
    limitations: string[];
}
export function validateMeasurementReport(value: unknown): asserts value is MeasurementReport {
    const r = value as MeasurementReport;
    if (!r || r.schemaVersion !== 1 || r.synthetic !== true || r.liveEvidenceEligible !== false ||
        r.configuration?.mode !== 'offline-fixture')
        throw new TypeError('Fixture measurements cannot claim live evidence.');
    if (!/^[a-f0-9]{64}$/.test(r.sourceVersion))
        throw new TypeError('Missing exact source version.');
    if (r.configuration.concurrency !== 1 || !Number.isInteger(r.configuration.maxRequests) ||
        r.configuration.maxRequests < 1 || r.configuration.maxRequests > 20 ||
        !Number.isFinite(r.configuration.timeBudgetMs) || r.configuration.timeBudgetMs <= 0 ||
        r.configuration.timeBudgetMs > 30000)
        throw new TypeError('Invalid measurement budget.');
    if (!Array.isArray(r.requests) || r.requests.length > r.configuration.maxRequests ||
        !Array.isArray(r.attempts) || r.attempts.length > r.configuration.maxRequests)
        throw new TypeError('Request budget exceeded.');
    if (!r.requests.length || r.requests.some(x => !x.operation || !x.status) ||
        r.attempts.some(x => x.provider !== 'geonames' || x.status !== 200) ||
        JSON.stringify(r.configuration.providers) !== JSON.stringify(['geonames']))
        throw new TypeError('Invalid fixture observations.');
    const numbers = [r.elapsedMs, r.metrics?.p50Ms, r.metrics?.p95Ms, r.metrics?.peakRssBytes,
        r.metrics?.startupMs, r.metrics?.cache?.entries, r.metrics?.cache?.bytes,
        ...r.requests.map(x => x.latencyMs)];
    if (numbers.some(x => !Number.isFinite(x) || x < 0))
        throw new TypeError('Invalid observed metric.');
    if (r.metrics.discoveryCache !== null || !r.metrics.discoveryCacheReason ||
        r.metrics.retries !== null || !r.metrics.retriesReason ||
        r.metrics.storage !== null || !r.metrics.storageReason || !r.limitations?.length) {
        throw new TypeError('Unobservable metrics require an explicit reason.');
    }
}
export async function measureApiRuntime(options: {
    maxRequests?: number;
    timeBudgetMs?: number;
} = {}): Promise<MeasurementReport> {
    const maxRequests = options.maxRequests ?? 4;
    const timeBudgetMs = options.timeBudgetMs ?? 5000;
    if (!Number.isInteger(maxRequests) || maxRequests < 1 || maxRequests > 20 ||
        !Number.isFinite(timeBudgetMs) || timeBudgetMs <= 0 || timeBudgetMs > 30000)
        throw new RangeError('Invalid offline measurement budget.');
    const started = performance.now();
    let peakRssBytes = process.memoryUsage().rss;
    const sample = () => { peakRssBytes = Math.max(peakRssBytes, process.memoryUsage().rss); };
    const attempts: MeasurementReport['attempts'] = [];
    // This function never accepts a caller fetcher, credentials, URL or live mode.
    const fetcher: typeof fetch = async (input) => {
        if (attempts.length >= maxRequests || performance.now() - started >= timeBudgetMs)
            throw Error('Fixture budget exhausted.');
        const url = new URL(String(input));
        if (url.hostname !== 'secure.geonames.org' || url.pathname !== '/searchJSON')
            throw Error('Unexpected fixture request.');
        attempts.push({ provider: 'geonames', status: 200 });
        sample();
        return new Response(JSON.stringify({ geonames: [{ geonameId: 1, name: 'Fixture Town', lat: '12', lng: '77' }] }));
    };
    const startup = performance.now();
    const { createApiServices } = await import('../server/places/api/configuration');
    const services = createApiServices({ geonamesUsername: 'fixture', now: Date.now, userAgent: 'NightSky offline measurement (fixture@example.invalid)', fetcher });
    const startupMs = performance.now() - startup;
    sample();
    const requests: MeasurementReport['requests'] = [];
    let ref: {
        placeId: string;
        sourceRevision: string;
    } | undefined;
    const cases = [
        { operation: 'resolve-cold', run: async () => { const r = await services.discoveryProvider.resolvePlace({ placeQuery: 'Fixture Town' }); const match = r.matches[0]; ref = match?.sourceRevision ? { placeId: match.placeId, sourceRevision: match.sourceRevision } : undefined; return r.availability.status; } },
        { operation: 'resolve-warm', run: async () => (await services.discoveryProvider.resolvePlace({ placeQuery: 'Fixture Town' })).availability.status },
        { operation: 'details-snapshot', run: async () => { if (!ref)
                throw Error('Fixture resolution failed.'); return (await services.discoveryProvider.details(ref)).availability.status; } },
        { operation: 'region-unsupported', run: async () => (await services.discoveryProvider.resolveRegion({ regionQuery: 'Fixture Region' })).availability.status },
    ];
    for (const c of cases.slice(0, maxRequests)) {
        if (performance.now() - started >= timeBudgetMs)
            break;
        const before = performance.now();
        const status = await c.run();
        requests.push({ operation: c.operation, latencyMs: performance.now() - before, status });
        sample();
    }
    if (!requests.length) throw new Error('Time budget exhausted before any operation was measured.');
    const sourceFiles = ['configuration.ts', 'discovery.ts', 'http.ts', 'selectionStore.ts', 'geonames.ts', 'geoapify.ts', 'types.ts'];
    const hash = createHash('sha256');
    for (const file of sourceFiles)
        hash.update(file).update(await readFile(new URL(`../server/places/api/${file}`, import.meta.url)));
    hash.update(await readFile(new URL('../server/providers/upstreamControls.ts', import.meta.url)));
    hash.update(await readFile(new URL('./measure-api-runtime.ts', import.meta.url)));
    const sorted = requests.map(x => x.latencyMs).sort((a, b) => a - b);
    const percentile = (p: number) => sorted.length ? sorted[Math.ceil(sorted.length * p) - 1]! : 0;
    const report: MeasurementReport = {
        schemaVersion: 1, synthetic: true, liveEvidenceEligible: false, sourceVersion: hash.digest('hex'),
        configuration: { mode: 'offline-fixture', providers: ['geonames'], concurrency: 1, maxRequests, timeBudgetMs },
        requests, attempts,
        metrics: { p50Ms: percentile(.5), p95Ms: percentile(.95), peakRssBytes, startupMs,
            cache: services.selectionStore.occupancy,
            discoveryCache: null, discoveryCacheReason: 'Discovery cache occupancy is not exposed by its public API.',
            retries: null, retriesReason: 'Internal retry counts are not exposed; attempts count fixture fetch invocations only.',
            storage: null, storageReason: 'Current, rollback and scratch deployment storage are not observed by this process.' },
        elapsedMs: performance.now() - started,
        limitations: ['Synthetic fixtures cannot satisfy live service, coverage, source quality or deployment gates.',
            'Startup measures module import and service construction in this process; RSS is sampled at operation boundaries, not continuous OS peak RSS.',
            'Time budget prevents starting new cases; synchronous work already running may finish after the deadline.'],
    };
    validateMeasurementReport(report);
    return report;
}
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
    if (process.argv.length > 2)
        throw new Error('Only offline fixtures are supported; no command-line modes are accepted.');
    console.log(JSON.stringify(await measureApiRuntime(), null, 2));
}
