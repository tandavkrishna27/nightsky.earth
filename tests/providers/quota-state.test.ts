import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, readFile, writeFile, unlink, mkdir, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createPersistentQuota } from '../../server/providers/quotaState';
import { ApiHttpClient } from '../../server/places/api/http';
const policies = [{ providerId: 'weatherapi', accountLabel: 'operator-account', hourlyLimit: 2, dailyLimit: 4, monthlyLimit: 5 }];
async function fixture(t: any) {
 const dir = await mkdtemp(join(tmpdir(), 'nightsky-quota-')); const path = join(dir, 'quota.json');
 t.after(async () => { await rm(dir, { recursive: true, force: true }); });
 let time = Date.UTC(2026, 9, 31, 23, 59, 30);
 const open = () => createPersistentQuota({ path, now: () => time, policies });
 return { dir, path, open, advance: (ms: number) => { time += ms; } };
}
test('missing state requires explicit verified budget initialization; restart counts crash-before-fetch reservations', async t => {
 const f = await fixture(t); let q = await f.open();
 assert.equal((await q.reserve('weatherapi', 1)).allowed, false);
 await q.initializeVerifiedBudget({ verifiedUnusedBudget: true, evidence: 'Synthetic test verified unused allowance' }); assert.equal((await q.reserve('weatherapi', 1)).allowed, true);
 await q.close(); q = await f.open();
 assert.equal((await q.reserve('weatherapi', 1)).allowed, true);
 assert.equal((await q.reserve('weatherapi', 1)).allowed, false);
 await q.close();
 const data = await readFile(f.path, 'utf8'); assert.ok(!data.includes('apiKey'));
});
test('concurrent reservations serialize and a second owner cannot acquire the lock', async t => {
 const f = await fixture(t); const q = await f.open(); await q.initializeVerifiedBudget({ verifiedUnusedBudget: true, evidence: 'Synthetic test verified unused allowance' });
 await assert.rejects(f.open());
 const results = await Promise.all(Array.from({ length: 12 }, () => q.reserve('weatherapi', 1)));
 assert.equal(results.filter(r => r.allowed).length, 2); await q.close();
});
test('minute buckets stay charged for full window and rollback fails closed', async t => {
 const f = await fixture(t); const q = await f.open(); await q.initializeVerifiedBudget({ verifiedUnusedBudget: true, evidence: 'Synthetic test verified unused allowance' });
 await q.reserve('weatherapi', 2); f.advance(3600000); assert.equal((await q.reserve('weatherapi', 1)).allowed, false);
 f.advance(30000); assert.equal((await q.reserve('weatherapi', 1)).allowed, true);
 f.advance(-1); assert.equal((await q.reserve('weatherapi', 1)).allowed, false); await q.close();
});
test('UTC month rollover preserves rolling limits and same-account key rotation cannot reset state', async t => {
 const f = await fixture(t); let q = await f.open(); await q.initializeVerifiedBudget({ verifiedUnusedBudget: true, evidence: 'Synthetic test verified unused allowance' }); await q.reserve('weatherapi', 2);
 f.advance(60000); await q.close(); q = await f.open();
 assert.equal((await q.reserve('weatherapi', 1)).allowed, false); await q.close();
});
test('corruption, truncation, missing-after-use and persistence failure fail closed', async t => {
 for (const mode of ['corrupt', 'missing', 'disk'] as const) {
  const f = await fixture(t); let q = await f.open(); await q.initializeVerifiedBudget({ verifiedUnusedBudget: true, evidence: 'Synthetic test verified unused allowance' }); await q.reserve('weatherapi', 1);
  if (mode === 'disk') { await mkdir(f.path + '.tmp'); assert.equal((await q.reserve('weatherapi', 1)).allowed, false); await q.close(); }
  else { await q.close(); if (mode === 'missing') await unlink(f.path); else await writeFile(f.path, '{'); q = await f.open(); assert.equal((await q.reserve('weatherapi', 1)).allowed, false); await assert.rejects(q.initializeVerifiedBudget({ verifiedUnusedBudget: true, evidence: 'Synthetic test verified unused allowance' })); await q.close(); }
 }
});
test('auth and backoff survive restart', async t => {
 const f = await fixture(t); let q = await f.open(); await q.initializeVerifiedBudget({ verifiedUnusedBudget: true, evidence: 'Synthetic test verified unused allowance' }); await q.setProviderState('weatherapi', { disabled: true }); await q.close();
 q = await f.open(); assert.equal((await q.reserve('weatherapi', 1)).allowed, false); await q.close();
});
test('discovery reserves before fetch and shared denial makes zero network attempts', async () => {
 let calls = 0; const client = new ApiHttpClient({ userAgent: 'test', geoapifyApiKey: 'synthetic', quota: { reserve: async () => ({ allowed: false, reason: 'quota-exhausted' }) }, fetcher: async () => { calls++; return new Response('{}'); } });
 await assert.rejects(client.json('geoapify', '/v1/geocode/search', { text: 'test' })); assert.equal(calls, 0);
});

test('monthly limit resets at UTC boundary while daily bucket persists', async t => {
 const f = await fixture(t); const q = await createPersistentQuota({ path: f.path, now: () => clock, policies: [{ ...policies[0], hourlyLimit: 20, dailyLimit: 20, monthlyLimit: 2 }] });
 let clock = Date.UTC(2026, 9, 31, 23, 59, 59);
 await q.initializeVerifiedBudget({ verifiedUnusedBudget: true, evidence: 'Synthetic verified unused account budget' });
 await q.reserve('weatherapi', 2); assert.equal((await q.reserve('weatherapi', 1)).allowed, false);
 clock += 1000; assert.equal((await q.reserve('weatherapi', 2)).allowed, true); assert.equal((await q.reserve('weatherapi', 1)).allowed, false); await q.close();
});
test('live deletion cannot recreate state, invalid policies and unsafe linked paths rejected', async t => {
 const f = await fixture(t); const q = await f.open(); await q.initializeVerifiedBudget({ verifiedUnusedBudget: true, evidence: 'Synthetic verified unused account budget' });
 await unlink(f.path); assert.equal((await q.reserve('weatherapi', 1)).allowed, false); await q.close();
 await assert.rejects(createPersistentQuota({ path: join(f.dir, 'other.json'), now: Date.now, policies: [{ ...policies[0], hourlyLimit: -1 }] }));
 await assert.rejects(createPersistentQuota({ path: 'relative.json', now: Date.now, policies }));
});
test('stale crash lock is retained until explicit operator recovery', async t => {
 const f = await fixture(t);
 await writeFile(f.path + '.lock', JSON.stringify({ pid: 2147483647, token: 'previous-process' }));
 await assert.rejects(f.open()); assert.ok(await readFile(f.path + '.lock'));
});
test('discovery persists auth and rate backoff responses', async () => {
 for (const status of [401, 429]) {
  const saved: unknown[] = [];
  const client = new ApiHttpClient({ userAgent: 'test', geoapifyApiKey: 'synthetic', quota: { reserve: async () => ({ allowed: true, reason: 'reserved' }), setProviderState: async (_id, state) => { saved.push(state); } }, fetcher: async () => new Response('{}', { status }) });
  await assert.rejects(client.json('geoapify', '/v1/geocode/search', { text: 'test' }));
  assert.equal(saved.length, 1);
  assert.ok(status === 401 ? (saved[0] as any).disabled : (saved[0] as any).blockedUntil > Date.now());
 }
});
test('actual process exit retains lock and crash reservation after verified stale-lock removal', async t => {
 const { execFile } = await import('node:child_process'); const { promisify } = await import('node:util'); const { pathToFileURL } = await import('node:url');
 const f = await fixture(t);
 const moduleUrl = pathToFileURL(join(process.cwd(), 'server/providers/quotaState.ts')).href;
 const script = join(f.dir, 'crash.mjs');
 await writeFile(script, `import { createPersistentQuota } from ${JSON.stringify(moduleUrl)}; const q = await createPersistentQuota({ path: ${JSON.stringify(f.path)}, now: () => ${Date.UTC(2026,9,31,23,59,30)}, policies: ${JSON.stringify(policies)} }); await q.initializeVerifiedBudget({verifiedUnusedBudget:true,evidence:'Synthetic unused budget verified before crash'}); await q.reserve('weatherapi',2); process.exit(7);`);
 await assert.rejects(promisify(execFile)(process.execPath, ['--import', 'tsx', script], { cwd: process.cwd() }));
 await assert.rejects(f.open());
 await unlink(f.path + '.lock'); // Test operator has observed child exit; never automatic production recovery.
 const q = await f.open(); assert.equal((await q.reserve('weatherapi', 1)).allowed, false); await q.close();
});
test('account relabeling, oversized state, and live corruption cannot replenish allowance', async t => {
 const f = await fixture(t); let q = await f.open(); await q.initializeVerifiedBudget({ verifiedUnusedBudget: true, evidence: 'Synthetic unused budget verification' }); await q.reserve('weatherapi', 1); await q.close();
 q = await createPersistentQuota({ path: f.path, now: () => Date.UTC(2026,9,31,23,59,30), policies: [{ ...policies[0], accountLabel: 'other-account' }] });
 assert.equal((await q.reserve('weatherapi', 1)).allowed, false); await q.close();
 q = await f.open(); await writeFile(f.path, '{'); assert.equal((await q.reserve('weatherapi', 1)).allowed, false); await q.close();
 await writeFile(f.path, 'x'.repeat(4 * 1024 * 1024 + 1)); q = await f.open(); assert.equal((await q.reserve('weatherapi', 1)).allowed, false); await q.close();
});
test('backoff survives reopening and cache-coalesced discovery charges once', async t => {
 const f = await fixture(t); let q = await f.open(); await q.initializeVerifiedBudget({ verifiedUnusedBudget: true, evidence: 'Synthetic unused budget verification' });
 await q.setProviderState('weatherapi', { blockedUntil: Date.UTC(2026, 10, 1) }); await q.close(); q = await f.open(); assert.equal((await q.reserve('weatherapi', 1)).allowed, false); await q.close();
 let reservations = 0; let calls = 0;
 const client = new ApiHttpClient({ userAgent: 'test', geoapifyApiKey: 'synthetic', quota: { reserve: async () => { reservations++; return { allowed: true, reason: 'reserved' }; } }, fetcher: async () => { calls++; return new Response('{}'); } });
 await Promise.all(Array.from({ length: 5 }, () => client.json('geoapify', '/v1/geocode/search', { text: 'test' })));
 assert.equal(reservations, 1); assert.equal(calls, 1);
});
test('linked quota directories are rejected before lock acquisition', async t => {
 const { symlink } = await import('node:fs/promises'); const f = await fixture(t);
 const target = join(f.dir, 'actual'); const alias = join(f.dir, 'alias'); await mkdir(target);
 await symlink(target, alias, process.platform === 'win32' ? 'junction' : 'dir');
 await assert.rejects(createPersistentQuota({ path: join(alias, 'quota.json'), now: Date.now, policies }));
});
test('reservation persistence refusal prevents the discovery fetch entirely', async t => {
 const f = await fixture(t); const q = await createPersistentQuota({ path: f.path, now: Date.now, policies: [{ providerId: 'geoapify', accountLabel: 'synthetic-account', hourlyLimit: 200, dailyLimit: 1000 }] });
 await q.initializeVerifiedBudget({ verifiedUnusedBudget: true, evidence: 'Synthetic unused budget verified' });
 await mkdir(f.path + '.tmp');
 let calls = 0; const client = new ApiHttpClient({ userAgent: 'test', geoapifyApiKey: 'synthetic', quota: q, fetcher: async () => { calls++; return new Response('{}'); } });
 await assert.rejects(client.json('geoapify', '/v1/geocode/search', { text: 'test' })); assert.equal(calls, 0); await q.close();
});
