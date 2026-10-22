import assert from 'node:assert/strict';
import test from 'node:test';
import { runReviewCases } from '../../scripts/verify-review-cases';

test('API review probes exercise five positive cases and validate three out-of-scope cases without external traffic', async () => {
  const original = globalThis.fetch;
  const argumentsSeen: Array<{ name: string; arguments: any }> = [];
  globalThis.fetch = async (input, init) => {
    const url = new URL(String(input));
    assert.equal(url.hostname, '127.0.0.1', 'Only loopback transport may use global fetch');
    const body = JSON.parse(String(init?.body));
    if (body.method === 'tools/call') argumentsSeen.push(body.params);
    return original(input, init);
  };
  try {
    const report = await runReviewCases({ offline: true, apiFixture: true });
    assert.equal(report.locationMode, 'api-fixture');
    assert.equal(report.gazetteerFilesUsed, false);
    assert.equal(report.externalAttempts, 0);
    assert.equal(report.hostBehaviorVerified, false);
    assert.equal(report.records.length, 8);
    assert.ok(report.fixtureRequests.some(row => row.endsWith('/searchJSON')));
    assert.ok(report.fixtureRequests.some(row => row.endsWith('/v1/geocode/search')));
    assert.ok(report.fixtureRequests.some(row => row.endsWith('/v2/places')));
    for (const row of report.records) {
      assert.equal(row.serverAssertionsPassed, row.kind === 'positive');
      assert.equal(row.hostBehaviorVerified, false);
      assert.equal(row.sourceFixtures.gazetteer, false);
      assert.equal(row.sourceFixtures.candidates, 'empty coverage');
    }
    for (const call of argumentsSeen) {
      const refs = call.name === 'compare_observing_options' ? call.arguments.options : [call.arguments];
      for (const ref of refs) if (ref.placeId) {
        assert.match(ref.placeId, /^place:v1:api:/);
        assert.match(ref.sourceRevision, /^[a-f0-9]{64}$/);
      }
    }
    for (const row of report.records.slice(5)) {
      assert.deepEqual(row.calls, []);
      assert.equal(row.expectedToolSequence, '');
    }
  } finally { globalThis.fetch = original; }
});

test('default review mode retains legacy fixture labeling', async () => {
  const original = globalThis.fetch;
  globalThis.fetch = async (input, init) => {
    assert.equal(new URL(String(input)).hostname, '127.0.0.1');
    return original(input, init);
  };
  try {
    const report = await runReviewCases({ offline: true });
    assert.equal(report.locationMode, 'legacy-fixture');
    assert.equal(report.gazetteerFilesUsed, false);
    assert.deepEqual(report.fixtureRequests, []);
    assert.equal(report.records[0].sourceFixtures.gazetteer, true);
  } finally { globalThis.fetch = original; }
});
