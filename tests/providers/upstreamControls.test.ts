import assert from "node:assert/strict";
import test from "node:test";
import { UpstreamControls } from "../../server/providers/upstreamControls";
const response = () => new Response("{}");
test("coalesces cold requests and refuses concurrency overload", async () => {
  const controls = new UpstreamControls({
    globalConcurrency: 1,
    providerConcurrency: 1,
  });
  let release!: () => void;
  let calls = 0;
  const fetcher = async () => {
    calls++;
    await new Promise<void>((r) => (release = r));
    return response();
  };
  const a = controls.fetch("met", "a", fetcher);
  const b = controls.fetch("met", "a", fetcher);
  await assert.rejects(controls.fetch("noaa", "b", fetcher), /admission/);
  release();
  await Promise.all([a, b]);
  assert.equal(calls, 1);
});
test("bounds streamed bytes and enforces retry-after with recovery", async () => {
  let now = 0;
  const controls = new UpstreamControls({
    maxResponseBytes: 4,
    now: () => now,
    backoffMs: 10,
  });
  await assert.rejects(
    controls.fetch("met", "big", async () => new Response("12345")),
    /byte/,
  );
  now = 20;
  await controls.fetch(
    "met",
    "bad",
    async () =>
      new Response("", { status: 429, headers: { "Retry-After": "2" } }),
  );
  await assert.rejects(
    controls.fetch("met", "next", async () => response()),
    /backoff/,
  );
  now = 2021;
  assert.equal(
    (await controls.fetch("met", "next", async () => response())).status,
    200,
  );
});
test("rolling admission and invalid bounds are enforced", async () => {
  assert.throws(
    () => new UpstreamControls({ globalConcurrency: 0 }),
    /Invalid/,
  );
  let now = 0;
  const controls = new UpstreamControls({
    globalCallsPerMinute: 2,
    providerCallsPerMinute: 1,
    now: () => now,
  });
  await controls.fetch("met", "one", async () => response());
  await assert.rejects(
    controls.fetch("met", "two", async () => response()),
    /admission/,
  );
  await controls.fetch("noaa", "one", async () => response());
  await assert.rejects(
    controls.fetch("noaa", "two", async () => response()),
    /admission/,
  );
  now = 60001;
  await controls.fetch("met", "three", async () => response());
});
test("chunked response is canceled at byte bound", async () => {
  let canceled = false;
  const controls = new UpstreamControls({ maxResponseBytes: 3 });
  const stream = new ReadableStream({
    start(c) {
      c.enqueue(new Uint8Array([1, 2]));
      c.enqueue(new Uint8Array([3, 4]));
    },
    cancel() {
      canceled = true;
    },
  });
  await assert.rejects(
    controls.fetch("noaa", "chunks", async () => new Response(stream)),
    /byte/,
  );
  assert.equal(canceled, true);
});
test("abort ignoring transport consumes bounded slot until it settles", async () => {
  const controls = new UpstreamControls({ globalConcurrency: 1 });
  const abort = new AbortController();
  let release!: () => void;
  const pending = controls.fetch(
    "met",
    "hang",
    async () => {
      await new Promise<void>((r) => (release = r));
      return response();
    },
    abort.signal,
  );
  abort.abort();
  await assert.rejects(
    controls.fetch("noaa", "other", async () => response()),
    /admission/,
  );
  release();
  await pending;
});
test("concurrent success preserves retry-after from another request", async () => {
  let release!: () => void;
  const controls = new UpstreamControls({ now: () => 0 });
  const pending = controls.fetch("met", "slow", async () => {
    await new Promise<void>((r) => (release = r));
    return response();
  });
  await controls.fetch(
    "met",
    "throttled",
    async () =>
      new Response("", { status: 503, headers: { "Retry-After": "60" } }),
  );
  release();
  await pending;
  await assert.rejects(
    controls.fetch("met", "new", async () => response()),
    /backoff/,
  );
});
test("provider starts cannot burst beyond its one second ceiling", async () => {
  let now = 0;
  const controls = new UpstreamControls({
    providerCallsPerSecond: 1,
    now: () => now,
  });
  await controls.fetch("met", "one", async () => response());
  await assert.rejects(
    controls.fetch("met", "two", async () => response()),
    /admission/,
  );
  now = 1001;
  await controls.fetch("met", "three", async () => response());
});
test("server retry-after survives local exponential cap", async () => {
  let now = 0;
  const controls = new UpstreamControls({ now: () => now, maxBackoffMs: 10 });
  await controls.fetch(
    "met",
    "bad",
    async () =>
      new Response("", { status: 503, headers: { "Retry-After": "600" } }),
  );
  now = 1000;
  await assert.rejects(
    controls.fetch("met", "early", async () => response()),
    /backoff/,
  );
  now = 600001;
  await controls.fetch("met", "recover", async () => response());
});
test("abort cancels a native hanging body and restores its occupied slot", async () => {
  let canceled = false;
  const controller = new AbortController();
  const controls = new UpstreamControls({ globalConcurrency: 1 });
  const stream = new ReadableStream({
    cancel() {
      canceled = true;
    },
  });
  const pending = controls.fetch(
    "met",
    "body",
    async () => new Response(stream),
    controller.signal,
  );
  await new Promise((r) => setImmediate(r));
  controller.abort();
  await pending;
  assert.equal(canceled, true);
  await controls.fetch("noaa", "free", async () => response());
});
test("aborting an already settled request cannot impose backoff", async () => {
  const controller = new AbortController();
  const controls = new UpstreamControls();
  await controls.fetch(
    "met",
    "done",
    async () => response(),
    controller.signal,
  );
  controller.abort();
  await controls.fetch("met", "next", async () => response());
});
test("custom burst configuration cannot bypass MET hard ceiling", async () => {
  const controls = new UpstreamControls({
    providerCallsPerSecond: 100,
    now: () => 0,
  });
  for (let i = 0; i < 19; i++)
    await controls.fetch("met", String(i), async () => response());
  await assert.rejects(
    controls.fetch("met", "twenty", async () => response()),
    /admission/,
  );
});
