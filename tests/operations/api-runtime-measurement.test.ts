import test from 'node:test';
import { readFileSync } from 'node:fs';
import { PROVIDER_QUOTA_POLICIES } from '../../server/providers/weather/configuration';
import assert from 'node:assert/strict';
import { measureApiRuntime, validateMeasurementReport } from '../../scripts/measure-api-runtime';
test('offline measurement observes API fixture operations and selection cache', async () => {
    const report = await measureApiRuntime();
    validateMeasurementReport(report);
    assert.equal(report.synthetic, true);
    assert.equal(report.liveEvidenceEligible, false);
    assert.deepEqual(report.requests.map(x => x.operation), ['resolve-cold', 'resolve-warm', 'details-snapshot', 'region-unsupported']);
    assert.equal(report.attempts.length, 1);
    assert.equal(report.metrics.cache.entries, 1);
    assert.ok(report.metrics.cache.bytes > 0);
    assert.ok(report.metrics.peakRssBytes > 0);
    assert.equal(report.metrics.storage, null);
});
test('fixture report cannot claim live evidence', async () => {
    const report = await measureApiRuntime({ maxRequests: 1 });
    assert.throws(() => validateMeasurementReport({ ...report, synthetic: false, liveEvidenceEligible: true }), /live evidence/);
    assert.throws(() => validateMeasurementReport({ ...report, liveEvidenceEligible: true }), /live evidence/);
    assert.throws(() => validateMeasurementReport({ ...report, configuration: { ...report.configuration, mode: 'live' } }), /live evidence/);
});
test('offline budgets and unavailable metrics remain explicit', async () => {
    await assert.rejects(measureApiRuntime({ maxRequests: 21 }), /budget/);
    await assert.rejects(measureApiRuntime({ timeBudgetMs: Infinity }), /budget/);
    const report = await measureApiRuntime({ maxRequests: 1 });
    assert.equal(report.requests.length, 1);
    assert.throws(() => validateMeasurementReport({ ...report, metrics: { ...report.metrics, retries: 0 } }), /Unobservable/);
    assert.throws(() => validateMeasurementReport({ ...report, metrics: { ...report.metrics, p95Ms: NaN } }), /metric/);
});


test('synthetic three-source measurement preserves native cadence and partial outage', async () => {
    const report = await measureApiRuntime({ includeWeather: true, maxRequests: 6 });
    validateMeasurementReport(report);
    assert.deepEqual(report.configuration.providers, ['geonames', 'met', 'weatherapi', 'openweather']);
    assert.deepEqual(report.requests.slice(-2).map(x => [x.operation, x.status]), [['weather-three-source', 'available'], ['weather-partial-outage', 'partial']]);
    assert.equal(report.weatherFixtures?.length, 2);
    assert.deepEqual(report.weatherFixtures?.[0]?.sources.map(x => x.providerId), ['met', 'weatherapi', 'openweather']);
    assert.deepEqual(report.weatherFixtures?.[0]?.sources[2]?.validTimesUtc, ['2026-10-25T00:00:00Z', '2026-10-25T03:00:00Z']);
    assert.equal(report.weatherFixtures?.[1]?.sources[1]?.status, 'unavailable');
    assert.equal(report.liveEvidenceEligible, false);
    assert.equal(report.attempts.length, 1, 'weather fixtures perform no transport requests');
    assert.throws(() => validateMeasurementReport({ ...report, weatherFixtures: [{ operation: 'weather-three-source', sources: [] }] }), /weather fixture/);
});

test('compiled smoke synthetic checkpoint labels match actual production policy registry', () => {
    const harness = readFileSync(new URL('../../scripts/verify-api-runtime.mjs', import.meta.url), 'utf8');
    const ids = harness.match(/\['geonames', 'geoapify', 'weatherapi', 'openweather'\]/)?.[0];
    assert.ok(ids, 'Synthetic checkpoint must declare its bounded fixture provider IDs.');
    assert.deepEqual(JSON.parse(ids.replaceAll("'", '\"')), PROVIDER_QUOTA_POLICIES.map(p => p.providerId));
    assert.ok(harness.includes('accountLabel: `operator-${id}`'));
    for (const policy of PROVIDER_QUOTA_POLICIES) assert.equal(policy.accountLabel, `operator-${policy.providerId}`);
});
