import assert from "node:assert/strict";
import test from "node:test";
import { planApiHistory } from "../../../server/providers/climate/apiHistoryPlan";
import type { ApiHistoryStore } from "../../../server/providers/climate/apiHistoryStore";
import { syntheticApiAggregate } from "./api-history-fixtures";

function memoryStore(events: string[]) {
  const summaries = new Map<string, Uint8Array>(), journals = new Map<string, unknown>();
  let held = false;
  const store: ApiHistoryStore = {
    async readSummary(key) { return summaries.get(key); }, async canPublish() { return true; },
    async putSummary(key, bytes) { events.push("publish"); summaries.set(key, bytes); },
    async readJournal(key) { return journals.get(key); },
    async writeJournal(key, value) { events.push((value as any).status); journals.set(key, structuredClone(value)); },
    async acquireLease() { if (held) throw Error("busy"); held = true; events.push("lease"); return async () => { held = false; events.push("release"); }; },
  };
  return { store, journals, summaries };
}
const plan = () => planApiHistory({ latitude: 28.51, longitude: 77.24 }, "Asia/Kolkata", { rangeDays: 1827 });
const approval = (p: ReturnType<typeof plan>) => ({ decision: "approved-api-history-build" as const, executionId: "e".repeat(64), planSha256: p.planSha256, expiresAt: "2026-10-18T00:00:00Z", maxReservedCredits: 84 });
const now = () => Date.parse("2026-10-17T00:00:00Z");

test("history worker defaults offline and never constructs implicit network work", async () => {
  const api = await import("../../../server/providers/climate/apiHistoryJobs").catch(() => undefined);
  assert.equal(typeof api?.runApiHistoryBuild, "function", "bounded history worker is missing");
  if (!api) return;
  const events: string[] = [], { store } = memoryStore(events);
  const result = await api.runApiHistoryBuild(plan(), { store, now, transport: async () => { throw Error("network must not run"); } });
  assert.equal(result.status, "offline"); assert.deepEqual(events, []);
});

test("quota and persisted intents precede six requests; failure and restart do not retry", async () => {
  const { runApiHistoryBuild } = await import("../../../server/providers/climate/apiHistoryJobs");
  const p = plan(), events: string[] = [], { store, journals } = memoryStore(events);
  let calls = 0, units = 0;
  const options = { store, now, approval: approval(p),
    quota: { async reserve(_id: string, cost: number) { events.push("quota"); units += cost; return { allowed: true, reason: "reserved" }; } },
    transport: async () => { calls++; assert.equal(events.at(-1), "request-intent"); return { status: 429, bytes: Buffer.from("{}"), retrievedAt: "2026-10-17T00:00:00Z" }; },
  };
  const stopped = await runApiHistoryBuild(p, options);
  assert.equal(stopped.status, "stopped"); assert.equal(calls, 1); assert.equal(units, 14);
  assert.equal((journals.get(options.approval.executionId) as any).status, "stopped");
  const restarted = await runApiHistoryBuild(p, options);
  assert.equal(restarted.status, "review-required"); assert.equal(calls, 1);
  const altered = { ...p, requestCount: 1 };
  await assert.rejects(runApiHistoryBuild(altered, options), /plan/);
});

test("history worker refuses quota, storage capacity and altered authority before transport", async () => {
  const { runApiHistoryBuild } = await import("../../../server/providers/climate/apiHistoryJobs");
  const p = plan(), events: string[] = [], { store } = memoryStore(events);
  let calls = 0;
  const base = { store, now, approval: approval(p), quota: { async reserve() { return { allowed: false, reason: "quota-exhausted" }; } }, transport: async () => { calls++; throw Error("forbidden"); } };
  assert.equal((await runApiHistoryBuild(p, base)).status, "stopped");
  assert.equal(calls, 0);
  assert.equal((await runApiHistoryBuild(p, { ...base, approval: { ...approval(p), planSha256: "0".repeat(64) } })).status, "offline");
  assert.equal((await runApiHistoryBuild(p, { ...base, store: { ...store, async canPublish() { return false; } }, approval: { ...approval(p), executionId: "f".repeat(64) } })).status, "stopped");
  assert.equal(calls, 0);
});

function validResponse(p: ReturnType<typeof plan>) {
  return { status: 200, retrievedAt: "2026-10-17T00:00:00Z", bytes: Buffer.from(JSON.stringify({ ...p.queryCell, utc_offset_seconds: 0, hourly_units: { time: "unixtime", cloud_cover: "%" }, hourly: { time: [], cloud_cover: [] } })) };
}
test("six-request worker publishes only after completion journal and reuses cache without requests", async () => {
  const { runApiHistoryBuild } = await import("../../../server/providers/climate/apiHistoryJobs");
  const { decodeApiHistoryCache } = await import("../../../server/providers/climate/apiHistoryProvider");
  const p = plan(), events: string[] = [], { store, summaries, journals } = memoryStore(events);
  let calls = 0, units = 0;
  const options = { store, now, approval: approval(p), quota: { async reserve(_id: string, cost: number) { units += cost; return { allowed: true, reason: "reserved" }; } },
    transport: async () => { calls++; assert.equal(events.at(-1), "request-intent"); return validResponse(p); },
    aggregate: (chunks: Parameters<typeof syntheticApiAggregate>[1]) => syntheticApiAggregate(p, chunks) };
  const built = await runApiHistoryBuild(p, options);
  assert.equal(built.status, "built"); assert.equal(calls, 6); assert.equal(units, 84);
  assert.ok(events.indexOf("complete") < events.indexOf("publish"));
  assert.equal((journals.get(approval(p).executionId) as any).status, "complete");
  assert.equal(decodeApiHistoryCache(summaries.get(p.cacheKey)!, p.cacheKey).period.kind, "baseline-1991-2020");
  assert.equal((await runApiHistoryBuild(p, options)).status, "cache-hit"); assert.equal(calls, 6);
});

test("completion persistence failure never publishes a servable summary", async () => {
  const { runApiHistoryBuild } = await import("../../../server/providers/climate/apiHistoryJobs");
  const p = plan(), events: string[] = [], memory = memoryStore(events);
  const result = await runApiHistoryBuild(p, { store: { ...memory.store, async writeJournal(key, value) { if ((value as any).status === "complete") throw Error("Synthetic fsync failure"); await memory.store.writeJournal(key, value); } },
    now, approval: approval(p), quota: { async reserve() { return { allowed: true, reason: "reserved" }; } }, transport: async () => validResponse(p), aggregate: chunks => syntheticApiAggregate(p, chunks) });
  assert.equal(result.status, "stopped"); assert.equal(memory.summaries.size, 0); assert.equal(events.includes("publish"), false);
});

test("request timeout, oversized wire and returned cell drift stop once without publishing", async () => {
  const { runApiHistoryBuild } = await import("../../../server/providers/climate/apiHistoryJobs");
  const p = plan();
  for (const scenario of ["timeout", "bytes", "cell"] as const) {
    const events: string[] = [], { store, summaries } = memoryStore(events); let instant = now();
    const result = await runApiHistoryBuild(p, { store, now: () => instant, approval: approval(p), quota: { async reserve() { return { allowed: true, reason: "reserved" }; } }, transport: async () => {
      const response = validResponse(p);
      if (scenario === "timeout") instant += 61000;
      if (scenario === "bytes") response.bytes = Buffer.alloc(p.limits.maxResponseBytes + 1);
      if (scenario === "cell") { const wire = JSON.parse(response.bytes.toString()); wire.latitude += 0.25; response.bytes = Buffer.from(JSON.stringify(wire)); }
      return response;
    } });
    assert.equal(result.status, "stopped", scenario); assert.equal(result.requests, 1); assert.equal(summaries.size, 0);
    assert.equal((await runApiHistoryBuild(p, { store, now, approval: approval(p), quota: { async reserve() { throw Error("no retry"); } }, transport: async () => { throw Error("no retry"); } })).status, "review-required");
  }
});

test("public transport is injectable and enforces host, byte, encoding and exact-length limits", async () => {
  const { createApiHistoryTransport } = await import("../../../server/providers/climate/apiHistoryJobs");
  const request = { url: plan().ranges[0]!.url, signal: new AbortController().signal, maxBytes: 8, timeoutMs: 60000 };
  const cases = [new Response("123456789"), new Response("{}", { headers: { "content-encoding": "gzip" } }), new Response("{}", { headers: { "content-length": "3" } }), new Response("{}", { headers: { "content-length": "9" } })];
  for (const response of cases) await assert.rejects(createApiHistoryTransport(async () => response)(request), /bound|encoding|length/);
  let calls = 0;
  const transport = createApiHistoryTransport(async (_url, init) => { calls++; assert.equal(init?.redirect, "manual"); return new Response("{}", { headers: { "content-length": "2" } }); });
  assert.equal((await transport(request)).bytes.byteLength, 2);
  await assert.rejects(transport({ ...request, url: "https://example.com/v1/archive" }), /host/); assert.equal(calls, 1);
  assert.equal((await createApiHistoryTransport(async () => new Response("", { status: 302 }))(request)).status, 302);
});

test("authority deadline returns even when injected transport ignores abort", { timeout: 500 }, async () => {
  const { runApiHistoryBuild } = await import("../../../server/providers/climate/apiHistoryJobs");
  const p = plan(), events: string[] = [], { store, summaries } = memoryStore(events); let aborted = false;
  const result = await runApiHistoryBuild(p, { store, now, approval: { ...approval(p), expiresAt: new Date(now() + 10).toISOString() }, quota: { async reserve() { return { allowed: true, reason: "reserved" }; } },
    transport: async ({ signal }) => { signal.addEventListener("abort", () => { aborted = true; }); return new Promise<never>(() => {}); } });
  assert.equal(result.status, "stopped"); assert.equal(result.requests, 1); assert.equal(aborted, true); assert.equal(summaries.size, 0); assert.equal(events.at(-1), "release");
});
