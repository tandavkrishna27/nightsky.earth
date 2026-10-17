import { performance } from 'node:perf_hooks';
import { pathToFileURL } from 'node:url';
import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import { createApiServices } from '../server/places/api/configuration';
import { measureApiRuntime } from './measure-api-runtime';

/** Fixed, small, synthetic workload. No external transport, credentials or modes accepted. */
export async function measureApiLoad() {
    const start = performance.now();
    let sampledPeakRssBytes = process.memoryUsage().rss;
    const sample = () => { sampledPeakRssBytes = Math.max(sampledPeakRssBytes, process.memoryUsage().rss); };
    let fakeCalls = 0;
    const checkBudget = () => {
        if (performance.now() - start > 25000 || fakeCalls >= 22) throw Error('Offline load measurement budget exhausted');
    };
    const scenarios = [];
    for (const scenario of [
        { name: 'same-key-coalescing', count: 8, status: 200, sameKey: true },
        { name: 'distinct-key-overload', count: 10, status: 200, sameKey: false },
        { name: 'provider-outage', count: 1, status: 503, sameKey: false },
        { name: 'provider-429-and-backoff', count: 2, status: 429, sameKey: false },
    ]) {
        checkBudget();
        const began = performance.now();
        const attempts: Array<{ key: string; status: number; responseBytes: number }> = [];
        // Advance only the injected provider clock to avoid real pacing sleeps. Real
        // request deadlines remain wall-clock based. This cannot measure live QPS.
        let logicalTime = Date.parse('2026-10-17T00:00:00Z');
        const fetcher: typeof fetch = async input => {
            checkBudget();
            fakeCalls++;
            const url = new URL(String(input));
            if (url.hostname !== 'secure.geonames.org' || url.pathname !== '/searchJSON') throw Error('Unexpected fixture transport');
            const key = url.searchParams.get('q') ?? '';
            const body = JSON.stringify(scenario.status === 200 ? { geonames: [{ geonameId: 1 + attempts.length, name: key, lat: '12', lng: '77' }] } : { error: 'synthetic outage' });
            attempts.push({ key, status: scenario.status, responseBytes: Buffer.byteLength(body) });
            sample();
            return new Response(body, { status: scenario.status, headers: scenario.status === 429 ? { 'Retry-After': '60' } : {} });
        };
        const services = createApiServices({ geonamesUsername: 'offline-fixture', userAgent: 'NightSky offline fixture (fixture@example.invalid)', fetcher, now: () => logicalTime += 1001 });
        const results = await Promise.all(Array.from({ length: scenario.count }, async (_, i) => {
            const before = performance.now();
            const value = await services.discoveryProvider.resolvePlace({ placeQuery: `Fixture Town ${scenario.sameKey ? 'shared' : String.fromCharCode(65 + i)}` });
            sample();
            return { status: value.availability.status, matches: value.matches.length,
                sourceAttempts: value.sourceAttempts ?? [], responseBytes: Buffer.byteLength(JSON.stringify(value)), elapsedMs: performance.now() - before };
        }));
        scenarios.push({ name: scenario.name, callers: scenario.count, elapsedMs: performance.now() - began,
            attempts, results, observedExtraAttempts: attempts.length - new Set(attempts.map(a => a.key)).size,
            selectionCache: services.selectionStore.occupancy });
    }
    checkBudget();
    // Reuse the existing serial endpoint/cache and native weather-source scenarios.
    const baseline = await measureApiRuntime({ includeWeather: true, maxRequests: 6 });
    sample();
    sampledPeakRssBytes = Math.max(sampledPeakRssBytes, baseline.metrics.peakRssBytes);
    const sourceVersion = createHash('sha256').update(baseline.sourceVersion)
        .update(await readFile(new URL('./measure-api-load.ts', import.meta.url))).digest('hex');
    return {
        schemaVersion: 1 as const, synthetic: true as const, liveEvidenceEligible: false as const,
        sourceVersion, mode: 'offline-fixture' as const,
        budgets: { maxCombinedFakeCalls: 28, load: { maxFakeCalls: 22, timeBudgetMs: 25000 },
            baseline: { maxFakeCalls: 6, timeBudgetMs: 5000 }, maxConcurrentCallers: 10 },
        elapsedMs: performance.now() - start, sampledPeakRssBytes,
        totalFakeCalls: fakeCalls + baseline.attempts.length, scenarios, baseline,
        limitations: [
            'Local service-method evidence only; excludes HTTP/MCP transport, real network latency, deployment and Hetzner acceptance.',
            'Injected advancing provider clock removes pacing waits; elapsed time is not production throughput or quota capacity.',
            'Observed extra attempts count repeated fake transport keys within each scenario, not a private retry counter; blocked calls are not retries.',
            'Response bytes are UTF-8 JSON bytes before transport framing or compression. RSS is process-wide and sampled, not OS peak or per-request allocation.',
            'Weather source separation reuses collection fixtures; weather provider transports and forecast accuracy remain unmeasured.',
            'Budgets stop new work; a blocked event loop can exceed the wall-clock budget. No deployment storage or live coverage is observed.',
        ],
    };
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
    if (process.argv.length > 2) throw Error('Only fixed offline fixtures are supported');
    console.log(JSON.stringify(await measureApiLoad(), null, 2));
}
