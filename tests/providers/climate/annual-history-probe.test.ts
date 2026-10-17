import assert from "node:assert/strict";
import test from "node:test";
import { mkdtemp, readFile, readdir, stat, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { annualHistoryProbePlan, decodeAnnualHistoryProbe, executeAnnualHistoryProbe } from "../../../scripts/era5/probe-annual-history";

function wire() {
  return { latitude: 28.5, longitude: 77.25, utc_offset_seconds: 0,
    hourly_units: { time: "unixtime", cloud_cover: "%" },
    hourly: { time: Array.from({ length: 8784 }, (_, i) => 694224000 + i * 3600),
      cloud_cover: Array.from({ length: 8784 }, (_, i) => i === 0 ? null : 10.125) } };
}
const encode = (value: unknown) => Buffer.from(JSON.stringify(value));
async function sandbox(run: (root: string) => Promise<void>) {
  const root = await mkdtemp(join(tmpdir(), "annual-probe-"));
  try { await run(root); } finally { await rm(root, { recursive: true, force: true }); }
}
function approval(root: string) {
  return { decision: "approved-annual-history-probe" as const, planSha256: annualHistoryProbePlan().planSha256,
    executionId: "a".repeat(64), evidenceRoot: root, expiresAt: new Date(Date.now() + 60000).toISOString(),
    maxReservedCredits: 3 as const, sourceUseEligibilityReviewed: true as const };
}
test("annual decoder accepts leap-year clock and preserves nulls, rejects incomplete or drifting shape", () => {
  const p = annualHistoryProbePlan();
  assert.equal(new URL(p.url).searchParams.get("start_date"), "1992-01-01");
  assert.equal(new URL(p.url).searchParams.get("end_date"), "1992-12-31");
  assert.deepEqual(p.requestedPoint, { latitude: 28.6139, longitude: 77.209 });
  assert.deepEqual(p.queryCell, { latitude: 28.5, longitude: 77.25 });
  assert.equal(decodeAnnualHistoryProbe(encode(wire())).nullHours, 1);
  for (const mutate of [
    (w: ReturnType<typeof wire>) => { w.hourly.time.pop(); w.hourly.cloud_cover.pop(); },
    (w: ReturnType<typeof wire>) => { w.hourly.time[1] = w.hourly.time[0]; },
    (w: ReturnType<typeof wire>) => { w.latitude = 28.75; },
    (w: ReturnType<typeof wire>) => { w.hourly_units.cloud_cover = "fraction"; },
    (w: ReturnType<typeof wire>) => { w.hourly.cloud_cover[1] = 101; },
  ]) { const w = wire(); mutate(w); assert.throws(() => decodeAnnualHistoryProbe(encode(w))); }
});
test("annual execution reserves three durably before dispatch and retains one bounded quarantine receipt", async () => sandbox(async root => {
  let calls = 0;
  const a = approval(root);
  const quota = { reserve: async (id: string, cost: number) => {
    assert.equal(id, "open-meteo"); assert.equal(cost, 3);
    assert.equal(JSON.parse(await readFile(join(root, a.executionId, "attempt.json"), "utf8")).plan.expectedHours, 8784);
    return { allowed: true, reason: "quota-reserved" };
  } };
  const fetcher: typeof fetch = async (url, init) => {
    calls++;
    assert.equal(JSON.parse(await readFile(join(root, a.executionId, "reservation.json"), "utf8")).reservedCredits, 3);
    assert.equal(new URL(String(url)).searchParams.get("latitude"), "28.5");
    assert.equal(init?.redirect, "manual"); assert.equal(init?.credentials, "omit");
    return new Response(encode(wire()));
  };
  const receipt = await executeAnnualHistoryProbe({ approval: a, quota, fetcher });
  assert.equal(receipt.outcome, "validated-annual-shape-only"); assert.equal(calls, 1);
  assert.equal(receipt.historicalAdmission, false); assert.equal(receipt.measuredDebit, "unobserved");
  await assert.rejects(executeAnnualHistoryProbe({ approval: a, quota, fetcher })); assert.equal(calls, 1);
  let bytes = 0; for (const f of await readdir(join(root, a.executionId))) bytes += (await stat(join(root, a.executionId, f))).size;
  assert.ok(bytes <= 4194304);
}));
test("annual authority and missing accounting fail closed before transport", async () => sandbox(async root => {
  let calls = 0;
  const fetcher: typeof fetch = async () => { calls++; throw Error("must not dispatch"); };
  await assert.rejects(executeAnnualHistoryProbe({ approval: approval(root), fetcher }));
  await assert.rejects(executeAnnualHistoryProbe({ approval: { ...approval(root), planSha256: "b".repeat(64) }, fetcher }));
  const result = await executeAnnualHistoryProbe({ approval: approval(root), fetcher, quota: { reserve: async () => ({ allowed: false, reason: "quota-exhausted" }) } });
  assert.equal(result.outcome, "stopped"); assert.equal(calls, 0);
}));
test("annual transport errors, redirects, caps and ignored abort stop without retry or secret retention", async () => {
  for (const fetcher of [
    async () => new Response("", { status: 302 }),
    async () => new Response(new Uint8Array(2097153)),
    async () => { throw Error("SECRET_TOKEN"); },
    async () => new Promise<Response>(() => {}),
    async () => new Response(new ReadableStream({ pull() { return new Promise(() => {}); } })),
  ] as (typeof fetch)[]) await sandbox(async root => {
    let calls = 0;
    const result = await executeAnnualHistoryProbe({ approval: approval(root), timeoutMs: 20,
      quota: { reserve: async () => ({ allowed: true, reason: "quota-reserved" }) },
      fetcher: async (...args) => { calls++; return fetcher(...args); } });
    assert.equal(result.outcome, "stopped"); assert.equal(calls, 1);
    for (const f of await readdir(join(root, "a".repeat(64)))) assert.equal((await readFile(join(root, "a".repeat(64), f), "utf8")).includes("SECRET_TOKEN"), false);
  });
});
test("annual elapsed deadline rejects an event-loop-blocking response before the timer fires", async () => sandbox(async root => {
  const result = await executeAnnualHistoryProbe({ approval: approval(root), timeoutMs: 5,
    quota: { reserve: async () => ({ allowed: true, reason: "quota-reserved" }) },
    fetcher: async () => { const start = performance.now(); while (performance.now() - start < 30) { /* simulate blocking transport */ } return new Response(encode(wire())); } });
  assert.equal(result.outcome, "stopped");
  assert.equal(result.failure, "timeout-uncertain");
}));
