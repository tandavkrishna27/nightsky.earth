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

test('source diagnostics expose bounded phase timings and random identity without request or response values', async () => {
  const clock = fakeClock(), events: any[] = [];
  const transport = new PublicUniverseTransport({ ...clock, quota: quota(), quotaOwner: 'private-owner', admitted: true,
    onDiagnostic: event => events.push(event), fetch: async () => { clock.advance(7); return new Response('{"private-response-value":"private-body"}', {headers:{'x-private':'private-header'}}); },
  });
  try {
    await transport.request({...query,q:'private-query'});
    assert.deepEqual(events.map(e=>e.phase),['start','quota-reserved','headers','body-read','parsed','settled']);
    assert.equal(new Set(events.map(e=>e.requestId)).size,1);
    assert.match(events[0].requestId,/^[a-f0-9-]{36}$/);
    assert.ok(events.every(e=>e.event==='publicuniverse.request'&&e.category==='catalogue'&&Number.isFinite(e.elapsedMs)));
    assert.equal(events.find(e=>e.phase==='headers').status,200);
    assert.equal(events.find(e=>e.phase==='body-read').responseBytes,Buffer.byteLength('{"private-response-value":"private-body"}'));
    for(const marker of ['private-owner','private-query','private-response-value','private-body','private-header'])assert.equal(JSON.stringify(events).includes(marker),false);
  } finally { await transport.close(); }
});

test('source diagnostics identify timeout before uncooperative fetch settles without releasing ownership', async()=>{
  const clock=fakeClock(),events:any[]=[];let finish!:(r:Response)=>void;
  const transport=new PublicUniverseTransport({...clock,quota:quota(),quotaOwner:'test',admitted:true,onDiagnostic:event=>events.push(event),fetch:async()=>new Promise(resolve=>{finish=resolve;})});
  const result=assert.rejects(transport.request(query),/timeout/);await idleTurn();clock.advance(15000);await result;
  assert.deepEqual(events.map(e=>e.phase),['start','quota-reserved','timeout']);
  assert.equal(events.at(-1).errorCode,'timeout');
  await assert.rejects(transport.request({...query,q:'Venus'}),/busy/);
  finish(new Response('{}'));await transport.close();
  assert.equal(events.filter(e=>e.phase==='timeout').length,1);
  assert.equal(events.at(-1).phase,'settled');
});

test('a throwing optional diagnostic sink cannot alter provider success or settlement',async()=>{
  let calls=0;
  const transport=new PublicUniverseTransport({quota:quota(),quotaOwner:'test',admitted:true,onDiagnostic:()=>{throw Error('private-sink-error');},fetch:async()=>{calls++;return new Response('{}');}});
  try{assert.deepEqual((await transport.request(query)).value,{});assert.equal(calls,1);}finally{await transport.close();}
});

test('a rejecting asynchronous diagnostic sink remains isolated after request settlement',async()=>{
  const transport=new PublicUniverseTransport({quota:quota(),quotaOwner:'test',admitted:true,onDiagnostic:async()=>{throw Error('private-async-sink');},fetch:async()=>new Response('{}')});
  try{assert.deepEqual((await transport.request(query)).value,{});await idleTurn();}finally{await transport.close();}
});

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
