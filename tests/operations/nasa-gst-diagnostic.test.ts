import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, readFile, readdir, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { NASA_GST_PLAN, runNasaGstDiagnostic } from '../../scripts/diagnose-nasa-donki-gst';
import { createPersistentQuota } from '../../server/providers/quotaState';

const privateKey = 'synthetic-private-nasa-key';
async function fixture(t: Parameters<typeof test>[1] extends (t: infer T) => unknown ? T : never) {
  const dir = await mkdtemp(join(tmpdir(), 'nasa-gst-'));
  t.after(() => rm(dir, { recursive: true, force: true }));
  const quotaPath = join(dir, 'sky-quota.json');
  return { dir, quotaPath, journalPath: join(dir, 'journal.jsonl'), env: { NIGHTSKY_NASA_API_KEY: privateKey, NIGHTSKY_SKY_QUOTA_STATE_PATH: quotaPath } };
}
async function initialize(path: string) {
  const checkpoint = { version: 1, lastNow: Date.now(), entries: { 'nasa-donki': {
    accountLabel: 'operator-nasa-donki', buckets: {}, months: {}, disabled: false, blockedUntil: 0,
  } } };
  await writeFile(path, JSON.stringify(checkpoint));
  await writeFile(path + '.initialized', 'Synthetic fixture only');
}
function syntheticQuota() {
  let reservations = 0;
  const factory = (async () => ({
    reserve: async (provider: string, cost: number) => {
      assert.equal(provider, 'nasa-donki'); assert.equal(cost, 1); reservations++;
      return { allowed: true, reason: 'synthetic reservation' };
    },
    close: async () => {},
  })) as unknown as typeof createPersistentQuota;
  return { factory, count: () => reservations };
}

test('NASA GST diagnostic refuses absent ledger before transport', async t => {
  const f = await fixture(t); let calls = 0;
  await assert.rejects(runNasaGstDiagnostic(f.env, f.journalPath, (async () => { calls++; return Response.json([]); }) as typeof fetch));
  assert.equal(calls, 0); assert.deepEqual(await readdir(f.dir), []);
});

test('NASA GST diagnostic sends exactly one fixed request and records no private data', async t => {
  const f = await fixture(t); await initialize(f.quotaPath); let calls = 0;
  const quota = syntheticQuota();
  const transport = (async (input: RequestInfo | URL, init?: RequestInit) => {
    calls++; const url = new URL(String(input));
    assert.equal(url.origin + url.pathname, 'https://api.nasa.gov/DONKI/GST');
    assert.equal(url.searchParams.get('startDate'), NASA_GST_PLAN.startDate);
    assert.equal(url.searchParams.get('endDate'), NASA_GST_PLAN.endDate);
    assert.equal(url.searchParams.get('api_key'), privateKey);
    assert.equal(init?.redirect, 'error');
    return Response.json([{ gstID: '2026-08-02T18:00:00-GST-001', startTime: '2026-08-02T18:00Z', privateUpstreamField: 'never-store-this' }]);
  }) as typeof fetch;
  const report = await runNasaGstDiagnostic(f.env, f.journalPath, transport, quota.factory);
  assert.equal(calls, 1, JSON.stringify(report)); assert.equal(quota.count(), 1); assert.equal(report.attempts, 1); assert.equal(report.result, 'available-with-events'); assert.equal(report.eventCount, 1);
  const journal = await readFile(f.journalPath, 'utf8');
  assert.ok(!journal.includes(privateKey)); assert.ok(!journal.includes('never-store-this')); assert.ok(!JSON.stringify(report).includes(privateKey));
});

test('NASA GST diagnostic returns unavailable on 503 and never retries', async t => {
  const f = await fixture(t); await initialize(f.quotaPath); let calls = 0;
  const quota = syntheticQuota();
  const report = await runNasaGstDiagnostic(f.env, f.journalPath, (async () => { calls++; return new Response('private upstream failure', { status: 503 }); }) as typeof fetch, quota.factory);
  assert.equal(calls, 1); assert.equal(report.attempts, 1); assert.equal(report.httpStatus, 503); assert.equal(report.result, 'unavailable');
  assert.ok(!(await readFile(f.journalPath, 'utf8')).includes('private upstream failure'));
});

test('NASA GST diagnostic refuses oversized response without retaining its body', async t => {
  const f = await fixture(t); await initialize(f.quotaPath); let calls = 0;
  const payload = 'SECRET_RESPONSE_' + 'x'.repeat(NASA_GST_PLAN.maxBodyBytes);
  const quota = syntheticQuota();
  const report = await runNasaGstDiagnostic(f.env, f.journalPath, (async () => { calls++; return new Response(payload, { status: 200 }); }) as typeof fetch, quota.factory);
  assert.equal(calls, 1); assert.equal(report.attempts, 1); assert.equal(report.result, 'unavailable');
  assert.ok(!(await readFile(f.journalPath, 'utf8')).includes('SECRET_RESPONSE_'));
});
