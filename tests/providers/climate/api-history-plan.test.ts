import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import test from "node:test";
import { decodeOpenMeteoHistory, planOpenMeteoHistory, type HistoryPartition } from "../../../server/providers/climate/openMeteoHistoryContract";
import { OPEN_METEO_HISTORY_METHOD as METHOD } from "../../../server/providers/climate/openMeteoHistoryMethod";

const load = async () => {
  const api = await import("../../../server/providers/climate/apiHistoryPlan").catch(() => undefined);
  assert.ok(api?.planApiHistory, "pure larger-range planner must exist");
  return api;
};
const selected = { latitude: 10.24, longitude: 77.49 };
const canonical = (value: unknown): string => value !== null && typeof value === "object"
  ? Array.isArray(value) ? `[${value.map(canonical).join(",")}]`
    : `{${Object.keys(value).sort().map(key => `${JSON.stringify(key)}:${canonical((value as Record<string, unknown>)[key])}`).join(",")}}`
  : JSON.stringify(value);
function wire(p: HistoryPartition) {
  return { ...p.requestedPoint, utc_offset_seconds: 0, hourly_units: { time: "unixtime", cloud_cover: "%" },
    hourly: { time: [p.startUnixSeconds, p.startUnixSeconds + 7200], cloud_cover: [null, 25] } };
}

test("offline API plan covers all 263088 padded hours once and queries only its canonical cell", async () => {
  const { planApiHistory } = await load();
  const plan = planApiHistory(selected, "Asia/Kolkata");
  assert.deepEqual(plan.requestedPoint, selected);
  assert.deepEqual(plan.queryCell, { latitude: 10.25, longitude: 77.5 });
  assert.equal(plan.mode, "offline"); assert.equal(plan.historicalAdmission, false);
  assert.deepEqual(plan.period, { startNight: "1991-01-01", endNight: "2020-12-31", kind: "baseline-1991-2020" });
  assert.equal(plan.schemaVersion, 1); assert.equal(plan.expectedHours, 263088); assert.equal(plan.requestCount, 30);
  const hours = plan.ranges.flatMap(p => Array.from({ length: p.expectedHours }, (_, i) => p.startUnixSeconds + 3600 * i));
  assert.equal(hours.length, 263088); assert.equal(new Set(hours).size, 263088);
  assert.equal(hours[0], Date.parse("1990-12-30T00:00:00Z") / 1000);
  assert.equal(hours.at(-1), Date.parse("2021-01-03T00:00:00Z") / 1000 - 3600);
  for (const p of plan.ranges) {
    assert.deepEqual(p.requestedPoint, plan.queryCell); assert.ok(p.expectedHours <= 366 * 24);
    const q = new URL(p.url).searchParams;
    for (const [key, value] of Object.entries({ latitude: "10.25", longitude: "77.5", hourly: "cloud_cover", models: "era5", timezone: "GMT", timeformat: "unixtime", cell_selection: "nearest", elevation: "nan" })) assert.equal(q.get(key), value);
    assert.equal(p.historicalAdmission, false); assert.equal(p.accounting, "unverified");
  }
  assert.equal(new URL(plan.ranges.at(-1)!.url).searchParams.get("end_date"), "2021-01-02");
  assert.deepEqual(plan.limits, { maxResponseBytes: 2097152, maxTotalBytes: 16777216, requestTimeoutMs: 60000, aggregateTimeoutMs: 300000, maxBuildMs: 900000 });
});

test("source estimated weights and per-call integer credit floors differ from HTTP count", async () => {
  const { planApiHistory } = await load();
  for (const [rangeDays, count, credits] of [[366, 30, 90], [1827, 6, 84], [14, 783, 783]] as const) {
    const plan = planApiHistory(selected, "UTC", { rangeDays });
    assert.equal(plan.requestCount, count); assert.equal(plan.accounting.reservedIntegerCredits, credits);
    assert.equal(plan.accounting.deployedDebit, "unobserved");
    assert.equal(plan.accounting.sourceCodeCommit, "01ceed5b028fb6ac19794c3310aed5a4f7aa6d4a");
    assert.equal(plan.accounting.perRequest.length, count);
    plan.ranges.forEach((p, i) => {
      const estimate = Math.max(1, p.expectedHours / 24 / 140);
      assert.equal(plan.accounting.perRequest[i].estimatedWeightedCredits, estimate);
      assert.equal(plan.accounting.perRequest[i].reservedIntegerCredits, Math.ceil(estimate));
    });
    assert.equal(plan.accounting.estimatedWeightedCredits, rangeDays === 14 ? 783 : 78.3);
  }
});

test("official index mapping retains pole columns, clamps dateline and rounds ties in index space", async () => {
  const { mapApiHistoryPoint } = await load();
  const cases = [
    [{ latitude: 0, longitude: -180 }, { latitude: 0, longitude: -180 }],
    [{ latitude: 0, longitude: 180 }, { latitude: 0, longitude: 179.75 }],
    [{ latitude: 90, longitude: 77.49 }, { latitude: 90, longitude: 77.5 }],
    [{ latitude: -90, longitude: -77.49 }, { latitude: -90, longitude: -77.5 }],
    [{ latitude: -0.125, longitude: -0.125 }, { latitude: 0, longitude: 0 }],
    [{ latitude: 0.125, longitude: 0.125 }, { latitude: 0.25, longitude: 0.25 }],
    [{ latitude: -89.875, longitude: -179.875 }, { latitude: -89.75, longitude: -179.75 }],
  ];
  for (const [input, expected] of cases) assert.deepEqual(mapApiHistoryPoint(input), expected);
});

test("plan validates points, IANA zones and explicit bounded integer range sizes", async () => {
  const { mapApiHistoryPoint, planApiHistory, apiHistoryCacheKey } = await load();
  for (const bad of [null, {}, { latitude: NaN, longitude: 0 }, { latitude: 91, longitude: 0 }, { latitude: 0, longitude: -180.01 }, { latitude: 0, longitude: Infinity }]) {
    assert.throws(() => mapApiHistoryPoint(bad as any)); assert.throws(() => planApiHistory(bad as any, "UTC"));
  }
  for (const rangeDays of [null, 0, -1, 1.1, 1828, NaN, Infinity, "366"]) assert.throws(() => planApiHistory(selected, "UTC", { rangeDays: rangeDays as number }));
  for (const zone of ["", "Invalid/Zone", "+05:30", "UTC ", "x".repeat(65), undefined]) assert.throws(() => planApiHistory(selected, zone as string));
  assert.throws(() => planApiHistory(selected, "UTC", null as any));
  assert.throws(() => apiHistoryCacheKey(selected, "UTC"), /cell/i);
  assert.throws(() => apiHistoryCacheKey({ latitude: 0, longitude: 180 }, "UTC"), /cell/i);
});

test("cache shares only cell and zone rules identity while exact canonical plan hashes bind range choices", async () => {
  const { planApiHistory, apiHistoryCacheKey } = await load();
  const a = planApiHistory(selected, "UTC");
  const b = planApiHistory({ latitude: 10.26, longitude: 77.51 }, "UTC", { rangeDays: 1827 });
  assert.equal(a.cacheKey, b.cacheKey); assert.equal(a.cacheKey, apiHistoryCacheKey(a.queryCell, "UTC"));
  assert.notEqual(a.planSha256, b.planSha256);
  assert.notEqual(a.cacheKey, planApiHistory(selected, "Asia/Kolkata").cacheKey);
  assert.notEqual(a.cacheKey, planApiHistory({ latitude: 10.6, longitude: 77.49 }, "UTC").cacheKey);
  assert.match(a.cacheKey, /^[a-f0-9]{64}$/); assert.match(a.planSha256, /^[a-f0-9]{64}$/);
  const cacheIdentity = { schemaVersion: 1, sourceMethod: METHOD, cell: a.queryCell, timeZone: "UTC",
    mappingPolicy: "open-meteo-era5-index-round-clamp-quarter-degree-v1", period: a.period,
    astronomyVersion: "2.1.19", timezoneVersion: `node-${process.versions.node}/icu-${process.versions.icu}/tz-${process.versions.tz ?? "unknown"}` };
  assert.equal(a.cacheKey, createHash("sha256").update(canonical(cacheIdentity)).digest("hex"));
  const { planSha256, ...identity } = a;
  assert.equal(planSha256, createHash("sha256").update(canonical(identity)).digest("hex"));
  assert.deepEqual(planApiHistory(selected, "UTC"), a);
});

test("generalized decoder preserves sparse null hours and exact returned cell over a maximum range", async () => {
  const { planApiHistory } = await load();
  const p = planApiHistory(selected, "UTC", { rangeDays: 1827 }).ranges[0];
  const decoded = decodeOpenMeteoHistory(Buffer.from(JSON.stringify(wire(p))), p, p.requestedPoint);
  assert.equal(decoded.samples.length, 43848); assert.equal(decoded.nullHours, 1); assert.equal(decoded.absentHours, 43846);
  assert.equal(decoded.missingHours, 43847); assert.equal(decoded.samples[2].cloudFraction, 0.25);
  assert.deepEqual(decoded.actualCell, p.requestedPoint); assert.equal(decoded.samples.at(-1)!.unixSeconds, p.endUnixSeconds - 3600);
});

test("generalized decoder rejects body, time, range contract and unrounded returned-cell drift", async () => {
  const { planApiHistory } = await load();
  const p = planApiHistory(selected, "UTC", { rangeDays: 1827 }).ranges[0];
  const bytes = Buffer.from(JSON.stringify(wire(p)));
  const shiftedCell = wire(p); shiftedCell.latitude += 0.25;
  assert.throws(() => decodeOpenMeteoHistory(Buffer.from(JSON.stringify(shiftedCell)), p), /drift/i);
  assert.throws(() => decodeOpenMeteoHistory(Buffer.alloc(2097153), p), /size|bound/i);
  for (const mutate of [(w: any) => w.latitude += 0.001, (w: any) => w.longitude += 0.25,
    (w: any) => w.hourly.time[1] = p.endUnixSeconds, (w: any) => w.hourly.time[1] = p.startUnixSeconds,
    (w: any) => w.hourly.time[1] += 1, (w: any) => w.hourly.cloud_cover[1] = 101,
    (w: any) => w.hourly.cloud_cover[1] = "25", (w: any) => w.hourly.cloud_cover.pop()]) {
    const w = wire(p); mutate(w); assert.throws(() => decodeOpenMeteoHistory(Buffer.from(JSON.stringify(w)), p, p.requestedPoint));
  }
  for (const bad of [{ ...p, rangeDays: 1828 }, { ...p, rangeDays: 1.5 }, { ...p, startUnixSeconds: p.startUnixSeconds + 86400 },
    { ...p, expectedHours: p.expectedHours + 24 }, { ...p, url: p.url.replace("models=era5", "models=best_match") },
    { ...p, reviewedRangeContract: undefined }, { ...p, reviewedRangeContract: "unknown" }, { ...p, rangeDays: undefined }]) {
    assert.throws(() => decodeOpenMeteoHistory(bytes, bad as HistoryPartition));
  }
  const legacy = planOpenMeteoHistory(selected);
  assert.equal(legacy.length, 783); assert.equal(legacy[0].expectedHours, 336);
  assert.equal("rangeDays" in legacy[0], false); assert.equal("reviewedRangeContract" in legacy[0], false);
  assert.throws(() => decodeOpenMeteoHistory(bytes, { ...legacy[0], rangeDays: 14 } as HistoryPartition));
});

test("CLI writes the bounded offline plan as JSON without an execution capability", async () => {
  await load();
  const script = fileURLToPath(new URL("../../../scripts/era5/plan-api-history.ts", import.meta.url));
  const run = spawnSync(process.execPath, ["--import", "tsx", script, "10.24", "77.49", "UTC"], { encoding: "utf8" });
  assert.equal(run.status, 0, run.stderr);
  const plan = JSON.parse(run.stdout); assert.equal(plan.mode, "offline"); assert.equal(plan.requestCount, 30);
  const larger = spawnSync(process.execPath, ["--import", "tsx", script, "10.24", "77.49", "UTC", "--range-days", "1827"], { encoding: "utf8" });
  assert.equal(larger.status, 0, larger.stderr); assert.equal(JSON.parse(larger.stdout).requestCount, 6);
  const invalid = spawnSync(process.execPath, ["--import", "tsx", script, "10.24", "77.49", "UTC", "--execute"], { encoding: "utf8" });
  assert.notEqual(invalid.status, 0); assert.equal(invalid.stdout, "");
});

test("larger and legacy partitions yield identical independent-clock statistics", async () => {
  const { planApiHistory } = await load();
  const { aggregateHostedHistory } = await import("../../../server/providers/climate/openMeteoHistoryServing");
  const cell = { latitude: 28.5, longitude: 77.25 };
  const larger = planApiHistory(cell, "UTC", { rangeDays: 28 }).ranges[0];
  const legacy = planOpenMeteoHistory(cell).slice(0, 2);
  const retained = (partition: HistoryPartition) => {
    const times = Array.from({ length: partition.expectedHours }, (_, i) => partition.startUnixSeconds + i * 3600);
    return { partition, retrievedAt: "2026-10-17T00:00:00Z", bytes: Buffer.from(JSON.stringify({ ...cell, utc_offset_seconds: 0, hourly_units: { time: "unixtime", cloud_cover: "%" }, hourly: { time: times, cloud_cover: times.map(t => (t / 3600) % 13 === 0 ? null : [10, 25, 50, 90][Math.abs(t / 3600) % 4]) } })) };
  };
  const options = { timeZone: "UTC", startNight: "1991-01-01", endNight: "1991-01-24", maxHours: 672, maxRetainedBytes: 2097152, maxElapsedMs: 10000 };
  const a = aggregateHostedHistory([retained(larger)], options), b = aggregateHostedHistory(legacy.map(retained), options);
  assert.deepEqual(a.bins, b.bins); assert.deepEqual(a.yearMonthly, b.yearMonthly); assert.deepEqual(a.period, b.period);
  assert.ok(a.bins.some(bin => bin.valid < bin.expected)); assert.ok(a.bins.some(bin => bin.valid > 0));
  assert.notEqual(a.cacheKey, b.cacheKey, "source receipt partition identity remains distinct");
});
