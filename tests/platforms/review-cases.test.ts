import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { runReviewCases } from '../../scripts/verify-review-cases';

test('offline review rehearsal executes exactly eight manifest cases over MCP without claiming host behavior', async () => {
  const report = await runReviewCases({ offline: true });
  assert.equal(report.manifestSha256, createHash('sha256').update(readFileSync('plugins/nightsky/plugin.json')).digest('hex'));
  assert.equal(report.records.length, 8);
  assert.deepEqual(report.records.map(row => row.caseId), ['casual', 'meteor', 'beginner', 'photography', 'two-night-comparison', 'aurora-guarantee', 'solar-sunglasses', 'typed-coordinates']);
  assert.equal(report.records.filter(row => row.kind === 'positive').length, 5);
  assert.equal(report.records.filter(row => row.kind === 'negative').length, 3);
  assert.equal(report.externalAttempts, 0);
  for (const row of report.records) {
    assert.equal(row.serverAssertionsPassed, true);
    assert.ok(row.role.includes(row.kind));
    assert.equal(row.hostBehaviorVerified, false);
    assert.ok(row.calls.length > 0);
    assert.ok(row.serverProbeRationale.length > 30);
    if (row.kind === 'positive') assert.deepEqual(row.calls.map(call => call.toolName), row.expectedToolSequence.split(',').map(name => name.trim()));
    assert.ok(row.calls.every(call => Number.isSafeInteger(call.requestId) && call.toolName.length > 0));
    assert.equal(row.sourceFixtures.weather, true);
  }
  const coordinates = report.records[7];
  assert.equal(coordinates.calls.length, 1);
  assert.equal(coordinates.calls[0].toolName, 'resolve_place');
  assert.equal(coordinates.calls[0].isError, true);
  assert.ok(report.records[6].assertions.includes('solar safety and NASA provenance'));
});

test('review rehearsal requires explicit offline authorization', async () => {
  await assert.rejects(() => runReviewCases({ offline: false }), /offline/);
});
