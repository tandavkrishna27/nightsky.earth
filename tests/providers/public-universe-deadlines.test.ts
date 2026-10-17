import test from 'node:test';
import assert from 'node:assert/strict';
import { PublicUniverseTransport } from '../../server/providers/publicUniverse/transport';

function fakeClock() {
  let now = 0;
  let nextId = 0;
  const timers = new Map<number, { at: number; fn: () => void }>();
  return {
    now: () => now,
    setTimer(fn: () => void, ms: number) {
      const id = ++nextId;
      timers.set(id, { at: now + ms, fn });
      return id as unknown as ReturnType<typeof setTimeout>;
    },
    clearTimer(id: ReturnType<typeof setTimeout>) { timers.delete(id as unknown as number); },
    advance(ms: number) {
      now += ms;
      for (const [id, timer] of timers) {
        if (timer.at <= now) { timers.delete(id); timer.fn(); }
      }
    },
  };
}
const idleTurn = () => new Promise<void>(resolve => setImmediate(resolve));
const query = { kind: 'search', domain: 'solar-system', q: 'Mars', limit: 1 } as const;
const quota = () => ({ reserve: async () => ({ allowed: true, reason: 'synthetic' }), setProviderState: async () => {} });

test('an uncooperative quota reservation times out without dispatch or releasing its slot early', async () => {
  const clock = fakeClock();
  let finish!: (value: { allowed: boolean; reason: string }) => void;
  let calls = 0;
  const transport = new PublicUniverseTransport({
    ...clock, admitted: true, quotaOwner: 'synthetic',
    quota: { ...quota(), reserve: () => new Promise(resolve => { finish = resolve; }) },
    fetch: async () => { calls++; return new Response('{}'); },
  });
  const result = assert.rejects(transport.request(query), /timeout/);
  await idleTurn();
  clock.advance(15000);
  await result;
  await assert.rejects(transport.request({ ...query, q: 'Venus' }), /busy/);
  finish({ allowed: true, reason: 'synthetic' });
  await transport.close();
  assert.equal(calls, 0);
});

test('an uncooperative body reader retains ownership after the caller deadline until settlement', async () => {
  const clock = fakeClock();
  let finish!: (value: ReadableStreamReadResult<Uint8Array>) => void;
  let released = false;
  const response = new Response('{}');
  Object.defineProperty(response, 'body', { value: { getReader: () => ({
    read: () => new Promise<ReadableStreamReadResult<Uint8Array>>(resolve => { finish = resolve; }),
    cancel: async () => {},
    releaseLock: () => { released = true; },
  }) } });
  const transport = new PublicUniverseTransport({ ...clock, quota: quota(), quotaOwner: 'synthetic', admitted: true, fetch: async () => response });
  const result = assert.rejects(transport.request(query), /timeout/);
  await idleTurn();
  clock.advance(15000);
  await result;
  await assert.rejects(transport.request({ ...query, q: 'Venus' }), /busy/);
  let closed = false;
  const closing = transport.close().then(() => { closed = true; });
  await idleTurn();
  assert.equal(closed, false);
  finish({ done: true, value: undefined });
  await closing;
  assert.equal(released, true);
});

test('a coalesced waiter can time out earlier without cancelling the original request', async () => {
  const clock = fakeClock();
  let finish!: (value: Response) => void;
  let calls = 0;
  const transport = new PublicUniverseTransport({ ...clock, quota: quota(), quotaOwner: 'synthetic', admitted: true,
    fetch: async () => { calls++; return new Promise(resolve => { finish = resolve; }); },
  });
  const original = transport.request(query);
  const joined = assert.rejects(transport.request(query, { deadline: 100 }), /timeout/);
  await idleTurn();
  clock.advance(100);
  await joined;
  finish(new Response('{"id":"Mars"}'));
  assert.deepEqual((await original).value, { id: 'Mars' });
  assert.equal(calls, 1);
  await transport.close();
});
