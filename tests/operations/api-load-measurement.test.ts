import test from 'node:test';
import assert from 'node:assert/strict';
import { measureApiLoad } from '../../scripts/measure-api-load';

test('bounded offline load observes coalescing, overload, outage and 429 without live fetch', async () => {
    const original = globalThis.fetch;
    globalThis.fetch = async () => { throw Error('Live network forbidden'); };
    try {
        const r = await measureApiLoad();
        assert.equal(r.liveEvidenceEligible, false);
        assert.equal(r.synthetic, true);
        assert.ok(r.elapsedMs < 30000);
        assert.ok(r.totalFakeCalls < 30);
        assert.ok(r.totalFakeCalls <= r.budgets.maxCombinedFakeCalls);
        assert.ok(r.sampledPeakRssBytes >= r.baseline.metrics.peakRssBytes);
        assert.equal(r.totalFakeCalls, r.scenarios.reduce((n, s) => n + s.attempts.length, 0) + r.baseline.attempts.length);
        assert.ok(r.sampledPeakRssBytes > 0);
        const [same, distinct, outage, limited] = r.scenarios;
        assert.equal(same.attempts.length, 1);
        assert.equal(same.results.filter(x => x.matches > 0).length, 8);
        assert.equal(distinct.attempts.length, 8);
        assert.equal(distinct.results.filter(x => x.matches > 0).length, 8);
        assert.equal(distinct.results.filter(x => x.sourceAttempts.some(s => s.status === 'quota-exhausted')).length, 2);
        assert.equal(outage.attempts.length, 1);
        assert.equal(outage.attempts[0].status, 503);
        assert.equal(outage.results[0].status, 'unavailable');
        assert.equal(limited.attempts.length, 1);
        assert.equal(limited.attempts[0].status, 429);
        assert.ok(limited.results.every(x => x.sourceAttempts.some(s => s.status === 'quota-exhausted')));
        for (const s of r.scenarios) {
            assert.equal(s.observedExtraAttempts, 0);
            assert.ok(s.results.every(x => x.responseBytes > 0));
        }
        assert.deepEqual(r.baseline.weatherFixtures?.[0].sources.map(x => x.providerId), ['met', 'weatherapi', 'openweather']);
        assert.equal(r.baseline.weatherFixtures?.[1].sources[1].status, 'unavailable');
        assert.deepEqual(r.baseline.weatherFixtures?.[0].sources[2].validTimesUtc, ['2026-10-25T00:00:00Z', '2026-10-25T03:00:00Z']);
    } finally { globalThis.fetch = original; }
});
