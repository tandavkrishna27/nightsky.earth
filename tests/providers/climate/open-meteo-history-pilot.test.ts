import assert from "node:assert/strict";
import test from "node:test";
import { mkdtemp, readFile, readdir, stat, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { executeHistoryPilot, historyPilotPlan, PILOT_ARTIFACT_BYTES } from "../../../scripts/era5/pilot-open-meteo-history";
import { OPEN_METEO_HISTORY_METHOD } from "../../../server/providers/climate/openMeteoHistoryMethod";

async function sandbox(run: (path: string) => Promise<void>) {
  const root = await mkdtemp(join(tmpdir(), "history-pilot-test-"));
  try { await run(join(root, "receipt")); } finally { await rm(root, { recursive: true, force: true }); }
}
function wire() {
  const p = historyPilotPlan().partition;
  return { latitude: 28.5, longitude: 77.25, utc_offset_seconds: 0,
    hourly_units: { time: "unixtime", cloud_cover: "%" },
    hourly: { time: Array.from({ length: 336 }, (_, i) => p.startUnixSeconds + i * 3600),
      cloud_cover: Array.from({ length: 336 }, (_, i) => i === 0 ? null : 10.125) } };
}
test("method preserves baseline and guards under a distinct nonproduction identity", () => {
  const m = OPEN_METEO_HISTORY_METHOD;
  assert.equal(m.methodVersion, "open-meteo-quantized-dark-cloud-v1");
  assert.equal(m.historicalAdmission, false);
  assert.equal(m.baseline.startNight, "1991-01-01");
  assert.equal(m.baseline.endNight, "2020-12-31");
  assert.deepEqual(m.thresholdsPercentInclusive, [10, 25, 50]);
  assert.deepEqual(m.quality, { minimumCompleteness: .9, minimumRepresentedYears: 27, minimumPerYearCompleteness: .8, maximumBadYears: 0, zeroDenominator: "omit-numeric-statistics" });
});
test("fake transport makes one exact bounded credential-free GET and preserves wire precision", async () => sandbox(async path => {
  let calls = 0;
  const transport: typeof fetch = async (url, init) => {
    calls++;
    assert.equal(url, historyPilotPlan().partition.url);
    assert.equal(init?.method, "GET"); assert.equal(init?.redirect, "manual"); assert.equal(init?.credentials, "omit");
    assert.deepEqual(init?.headers, { Accept: "application/json" });
    return new Response(JSON.stringify(wire()), { headers: { "set-cookie": "secret", "authorization": "secret" } });
  };
  const receipt = await executeHistoryPilot(path, transport);
  assert.equal(receipt.outcome, "decoded-quarantine-only"); assert.equal(calls, 1);
  const result = JSON.parse(await readFile(join(path, "quarantine.json"), "utf8"));
  assert.equal(result.samples[1].cloudFraction, .10125); assert.equal(result.missingHours, 1);
  assert.equal(JSON.stringify(receipt).includes("secret"), false);
  await assert.rejects(executeHistoryPilot(path, transport)); assert.equal(calls, 1);
  let total = 0; for (const name of await readdir(path)) total += (await stat(join(path, name))).size;
  assert.ok(total <= PILOT_ARTIFACT_BYTES);
}));
test("fake failures never retry, follow redirects, or persist exception secrets", async () => {
  for (const status of [429, 302, 500]) await sandbox(async path => {
    let calls = 0;
    const result = await executeHistoryPilot(path, async () => { calls++; return new Response("", { status, headers: { location: "https://secret.invalid/token" } }); });
    assert.equal(calls, 1); assert.equal(result.outcome, "stopped"); assert.equal(result.status, status);
    assert.equal(JSON.stringify(result).includes("secret"), false);
  });
  await sandbox(async path => {
    const result = await executeHistoryPilot(path, async () => { throw Error("SECRET_TOKEN"); });
    assert.equal(result.failure, "transport-failure");
    for (const name of await readdir(path)) assert.equal((await readFile(join(path, name), "utf8")).includes("SECRET_TOKEN"), false);
  });
});
test("fake streams enforce decoded cap and deadline even if transport ignores abort", async () => {
  await sandbox(async path => {
    const result = await executeHistoryPilot(path, async () => new Response(new Uint8Array(2 * 1024 * 1024 + 1)));
    assert.equal(result.failure, "decoded-body-cap");
  });
  await sandbox(async path => {
    const result = await executeHistoryPilot(path, async () => new Promise<Response>(() => {}), 10);
    assert.equal(result.failure, "timeout");
  });
  await sandbox(async path => {
    const result = await executeHistoryPilot(path, async () => new Response(new ReadableStream({ pull() { return new Promise(() => {}); } })), 10);
    assert.equal(result.failure, "timeout");
  });
});
test("fake unit and grid mismatch retain raw evidence but reject quarantine admission", async () => {
  for (const mutate of [(w: ReturnType<typeof wire>) => { w.latitude = 28.75; }, (w: ReturnType<typeof wire>) => { w.hourly_units.cloud_cover = "fraction"; }]) {
    await sandbox(async path => {
      const w = wire(); mutate(w);
      const result = await executeHistoryPilot(path, async () => new Response(JSON.stringify(w)));
      assert.equal(result.failure, "decoder-rejection"); assert.equal(result.historicalAdmission, false);
      assert.equal(await readFile(join(path, "raw-response.body"), "utf8"), JSON.stringify(w));
    });
  }
});
