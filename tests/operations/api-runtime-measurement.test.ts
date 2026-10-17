import test from 'node:test';
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
