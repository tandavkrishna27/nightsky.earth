import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createPersistentQuota } from '../../server/providers/quotaState';
import { PublicUniverseTransport, ReferenceSuccessCache, buildRoute } from '../../server/providers/publicUniverse/transport';
const quota = () => ({ reserve: async () => ({ allowed: true, reason: 'ok' }), setProviderState: async () => { } });
test('POST bodies are canonical, independent and observing data is never cached', async () => {
    let finish!: (r: Response) => void;
    let calls = 0;
    const t = new PublicUniverseTransport({ quota: quota(), quotaOwner: 'app', admitted: true, fetch: async () => { calls++; return new Promise(resolve => { finish = resolve; }); } });
    const body = { date: '2026-01-01', timezone: 'UTC', lat: 0, lon: 0, window_start_utc: '2026-01-01T18:00:00Z', window_end_utc: '2026-01-01T19:00:00Z', targets: 'bsc5p:hr2491' };
    const first = t.request({ kind: 'night', body });
    const same = t.request({ kind: 'night', body: Object.fromEntries(Object.entries(body).reverse()) });
    await assert.rejects(t.request({ kind: 'night', body: { ...body, lat: 1 } }), /busy/);
    await new Promise(resolve => setImmediate(resolve));
    finish(new Response('{}'));
    await Promise.all([first, same]);
    assert.equal(calls, 1);
    await t.close();
    const cache = new ReferenceSuccessCache();
    cache.put('observing', {}, 'now', 'max-age=100', { method: 'POST', success: true, observing: true });
    assert.equal(cache.get('observing'), undefined);
});
test('all documented detail routes and only documented query keys are built', () => {
    for (const domain of ['solar-system', 'starter-targets', 'exoplanets'] as const) {
        const route = buildRoute({ kind: 'search', domain, q: 'a & b', limit: 10 });
        assert.equal(route.query.get('q'), 'a & b');
        assert.equal(route.query.size, domain === 'solar-system' ? 2 : 3);
        assert.match(buildRoute({ kind: 'object', domain, id: 'A/B' }).path, /A%2FB$/);
    }
    for (const kind of ['discovery', 'designations'] as const)
        assert.equal(buildRoute({ kind, id: 'x' }).path, '/api/v1/objects/x/' + kind);
    for (const kind of ['moons', 'rings', 'atmosphere'] as const)
        assert.equal(buildRoute({ kind, parentName: 'Mars' }).path, '/api/v1/planets/Mars/' + kind);
    assert.equal(buildRoute({ kind: 'exoplanet-host', id: 'h' }).path, '/api/v1/exoplanet-hosts/h');
    assert.equal(buildRoute({ kind: 'close-approaches', id: 'x', from: '2026-01-01', to: '2026-01-31', limit: 10 }).query.get('body'), 'Earth');
    assert.throws(() => buildRoute({ kind: 'close-approaches', id: 'x', from: '2026-01-01', to: '2026-02-01', limit: 10 }));
    assert.throws(() => buildRoute({ kind: 'download' } as never));
});
test('cache bounds and reference lifetimes are independent', () => {
    const cache = new ReferenceSuccessCache();
    const options = { method: 'GET' as const, success: true };
    cache.put('selected', { matches: [{ selection: { referenceId: 'old', revision: 'old' }, upstreamId: 'x' }] }, 'original', null, options);
    assert.deepEqual(cache.get('selected')?.value, { matches: [{ upstreamId: 'x' }] });
    cache.put('large', 'x'.repeat(131073), 'original', null, options);
    assert.equal(cache.get('large'), undefined);
    for (let i = 0; i < 33; i++)
        cache.put(String(i), {}, 'original', null, options);
    assert.equal(cache.get('0'), undefined);
    assert.ok(cache.get('32'));
    cache.close();
    assert.equal(cache.get('32'), undefined);
});
test('canonical flights coalesce, distinct requests fail busy and quota precedes fetch', async () => {
    let finish!: (r: Response) => void;
    let calls = 0;
    let reservations = 0;
    const t = new PublicUniverseTransport({ quota: { ...quota(), reserve: async () => { reservations++; return { allowed: true, reason: 'ok' }; } }, quotaOwner: 'app', admitted: true,
        fetch: async () => { calls++; assert.equal(reservations, 1); return new Promise(resolve => { finish = resolve; }); } });
    const a = t.request({ kind: 'search', domain: 'solar-system', q: 'Mars', limit: 2 });
    const b = t.request({ kind: 'search', domain: 'solar-system', q: 'Mars', limit: 2 });
    await assert.rejects(t.request({ kind: 'search', domain: 'solar-system', q: 'Venus', limit: 2 }), /busy/);
    await new Promise(resolve => setImmediate(resolve));
    finish(new Response('{"ok":true}'));
    assert.deepEqual(await a, await b);
    assert.equal(calls, 1);
    await t.close();
});
test('durable cooldown survives ledger close and reopen; failed persistence poisons transport', async (t) => {
    const dir = await mkdtemp(join(tmpdir(), 'public-universe-test-'));
    t.after(() => rm(dir, { recursive: true, force: true }));
    let now = Date.UTC(2026, 0, 1);
    const open = () => createPersistentQuota({ path: join(dir, 'quota.json'), now: () => now, policies: [{ providerId: 'publicuniverse', accountLabel: 'synthetic-application-allocation', hourlyLimit: 20, dailyLimit: 100 }] });
    let q = await open();
    await q.initializeVerifiedBudget({ verifiedUnusedBudget: true, evidence: 'Synthetic unused application allocation for offline test only' });
    const first = new PublicUniverseTransport({ quota: q, quotaOwner: 'app', admitted: true, now: () => now, fetch: async () => new Response('', { status: 429, headers: { 'Retry-After': '120' } }) });
    await assert.rejects(first.request({ kind: 'meteor-shower', code: 'PER' }), /rate-limit/);
    await first.close();
    await q.close();
    q = await open();
    let calls = 0;
    const restarted = new PublicUniverseTransport({ quota: q, quotaOwner: 'app', admitted: true, now: () => now, fetch: async () => { calls++; return new Response('{}'); } });
    await assert.rejects(restarted.request({ kind: 'meteor-shower', code: 'PER' }), /quota/);
    assert.equal(calls, 0);
    await restarted.close();
    await q.close();
    const broken = new PublicUniverseTransport({ quota: { ...quota(), setProviderState: async () => { throw new Error('disk'); } }, quotaOwner: 'app', admitted: true, now: () => now, fetch: async () => { calls++; return new Response('', { status: 429 }); } });
    await assert.rejects(broken.request({ kind: 'meteor-shower', code: 'PER' }), /quota/);
    now += 86400001;
    await assert.rejects(broken.request({ kind: 'meteor-shower', code: 'PER' }), /quota/);
    assert.equal(calls, 1);
    await broken.close();
});
test('rolling catalogue ceiling and observing spacing use dispatch starts without queues', async () => {
    let now = 0;
    let calls = 0;
    const t = new PublicUniverseTransport({ quota: quota(), quotaOwner: 'app', admitted: true, now: () => now, fetch: async () => { calls++; return new Response('{}'); } });
    const search = { kind: 'search' as const, domain: 'solar-system' as const, q: 'Mars', limit: 1 };
    for (let i = 0; i < 30; i++)
        await t.request(search);
    await assert.rejects(t.request(search), /rate-limit/);
    now = 60000;
    await t.request(search);
    assert.equal(calls, 31);
    await t.close();
    for (const kind of ['discover', 'night'] as const) {
        now = 0;
        const t = new PublicUniverseTransport({ quota: quota(), quotaOwner: 'app', admitted: true, now: () => now, fetch: async () => new Response('{}') });
        const body = { date: '2026-01-01', timezone: 'UTC', lat: 0, lon: 0, window_start_utc: '2026-01-01T18:00:00Z', window_end_utc: '2026-01-01T19:00:00Z', ...(kind === 'discover' ? { equipment_mode: 'naked_eye', preference: 'balanced', shortlist_limit: 1 } : { targets: 'bsc5p:hr2491' }) };
        await t.request({ kind, body });
        await assert.rejects(t.request({ kind, body }), /rate-limit/);
        now = kind === 'discover' ? 14999 : 7499;
        await assert.rejects(t.request({ kind, body }), /rate-limit/);
        now++;
        await t.request({ kind, body });
        await t.close();
    }
});
test('cancelled waiter retains slot; close waits for actual fetch settlement', async () => {
    let finish!: (r: Response) => void;
    const abort = new AbortController();
    const t = new PublicUniverseTransport({ quota: quota(), quotaOwner: 'a', admitted: true, fetch: async () => new Promise(resolve => { finish = resolve; }) });
    const request = t.request({ kind: 'meteor-shower', code: 'PER' }, { signal: abort.signal });
    await new Promise(resolve => setImmediate(resolve));
    abort.abort();
    await assert.rejects(request, /cancelled/);
    await assert.rejects(t.request({ kind: 'meteor-shower', code: 'GEM' }), /busy/);
    let closed = false;
    const closing = t.close().then(() => { closed = true; });
    await new Promise(resolve => setImmediate(resolve));
    assert.equal(closed, false);
    finish(new Response('{}'));
    await closing;
    assert.equal(closed, true);
});
test('deadline returns while uncooperative underlying fetch retains ownership', async () => {
    let now = 0;
    let finish!: (r: Response) => void;
    const timers = new Map<number, () => void>();
    let next = 0;
    const t = new PublicUniverseTransport({ quota: quota(), quotaOwner: 'a', admitted: true, now: () => now, fetch: async () => new Promise(resolve => { finish = resolve; }), setTimer: fn => { const key = ++next; timers.set(key, fn); return key as unknown as ReturnType<typeof setTimeout>; }, clearTimer: timer => { timers.delete(timer as unknown as number); } });
    const request = t.request({ kind: 'meteor-shower', code: 'PER' }, { deadline: 100 });
    await new Promise(resolve => setImmediate(resolve));
    now = 100;
    for (const fn of Array.from(timers.values()))
        fn();
    await assert.rejects(request, /timeout/);
    await assert.rejects(t.request({ kind: 'meteor-shower', code: 'GEM' }), /busy/);
    finish(new Response('{}'));
    await t.close();
});
test('denied quota has no dispatch; response/request sizes and redirects are bounded', async () => {
    let calls = 0;
    const denied = new PublicUniverseTransport({ quota: { ...quota(), reserve: async () => ({ allowed: false, reason: 'denied' }) }, quotaOwner: 'a', admitted: true, fetch: async () => { calls++; return new Response('{}'); } });
    await assert.rejects(denied.request({ kind: 'meteor-shower', code: 'PER' }), /quota/);
    assert.equal(calls, 0);
    await denied.close();
    for (const response of [new Response('x'.repeat(1048577)), new Response('oops'), new Response('', { status: 302 })]) {
        const t = new PublicUniverseTransport({ quota: quota(), quotaOwner: 'a', admitted: true, fetch: async () => response });
        await assert.rejects(t.request({ kind: 'meteor-shower', code: 'PER' }));
        await t.close();
    }
    assert.throws(() => buildRoute({ kind: 'discover', body: { date: 'x'.repeat(17000), timezone: 'UTC', lat: 0, lon: 0, window_start_utc: 'a', window_end_utc: 'b', equipment_mode: 'naked_eye', preference: 'balanced', shortlist_limit: 1 } }), /size/);
});
test('GET success cache respects directives, freshness and retrieval time', () => {
    let now = 0;
    const cache = new ReferenceSuccessCache(() => now);
    const options = { method: 'GET' as const, success: true };
    for (const directive of ['no-store', 'no-cache', 'max-age=0']) {
        cache.put('a', {}, 'original', directive, options);
        assert.equal(cache.get('a'), undefined);
    }
    cache.put('a', { ok: true }, 'original', 'max-age=1', options);
    assert.equal(cache.get('a')?.retrievedAt, 'original');
    now = 1000;
    assert.equal(cache.get('a'), undefined);
    cache.put('b', {}, 'original', null, { method: 'POST', success: true });
    assert.equal(cache.get('b'), undefined);
    cache.close();
});
test('fixed encoded routes, no traversal and durable 429', async () => {
    assert.equal(buildRoute({ kind: 'object', domain: 'solar-system', id: 'a/b' }).path, '/api/v1/objects/a%2Fb');
    assert.throws(() => buildRoute({ kind: 'object', domain: 'solar-system', id: '..' }));
    let persisted = 0;
    const t = new PublicUniverseTransport({ quota: { ...quota(), setProviderState: async (_, s) => { persisted = s.blockedUntil!; } }, quotaOwner: 'app', admitted: true, now: () => 0, fetch: async () => new Response('', { status: 429, headers: { 'Retry-After': '60' } }) });
    await assert.rejects(t.request({ kind: 'meteor-shower', code: 'PER' }), /rate-limit/);
    assert.equal(persisted, 60000);
    await assert.rejects(t.request({ kind: 'meteor-shower', code: 'PER' }), /rate-limit/);
    await t.close();
});
