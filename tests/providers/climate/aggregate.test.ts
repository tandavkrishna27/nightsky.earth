import assert from "node:assert/strict";
import test from "node:test";
import { aggregateDarkCloudSamples, observingNightDate, summarizeMonth, validateChunkLedger, sunAltitudeDegrees } from "../../../scripts/era5/aggregate";

const mapping = { cellId: "era5:0:0", latitude: 0, longitude: 0, timeZone: "UTC" };
const method = { startNight: "2025-01-01", endNight: "2025-01-01" };
const sample = (hour: number, cloudFraction: number | null) => ({ atUtc: `2025-01-01T${String(hour).padStart(2, "0")}:00:00Z`, cloudFraction });
test("hourly dark samples use inclusive thresholds and weighted denominators", () => {
  const result = aggregateDarkCloudSamples([sample(20, 0), sample(21, 0.1), sample(22, 0.25), sample(23, 0.5), { atUtc: "2025-01-02T00:00:00Z", cloudFraction: 1 }], mapping, method);
  const summary = summarizeMonth(result, 1);
  assert.equal(summary.validEligibleSamples, 5);
  assert.equal(summary.meanCloudFraction, 0.37);
  assert.deepEqual(summary.thresholds?.map(row => row.count), [2, 3, 4]);
  assert.ok(summary.expectedEligibleSamples > 5);
  assert.equal(summary.quality, "sample-only");
});
test("missing source hours and null/nonfinite cloud stay in expected denominator", () => {
  const result = aggregateDarkCloudSamples([sample(20, null), sample(21, NaN)], mapping, method);
  const summary = summarizeMonth(result, 1);
  assert.equal(summary.validEligibleSamples, 0);
  assert.ok(summary.expectedEligibleSamples > 0);
  assert.equal(summary.meanCloudFraction, undefined);
});
test("invalid, duplicate and unsorted hourly input fail instead of repairing", () => {
  for (const samples of [[sample(20, -0.1)], [sample(20, 1.1)], [sample(20, 0), sample(20, 0)], [sample(21, 0), sample(20, 0)], [{ atUtc: "2025-01-01T20:30:00Z", cloudFraction: 0 }]])
    assert.throws(() => aggregateDarkCloudSamples(samples, mapping, method));
});
test("observing nights use previous calendar date before noon across month/year/DST", () => {
  assert.equal(observingNightDate("2025-02-01T01:00:00Z", "UTC"), "2025-01-31");
  assert.equal(observingNightDate("2025-01-01T01:00:00Z", "UTC"), "2024-12-31");
  assert.equal(observingNightDate("2024-03-10T15:00:00Z", "America/New_York"), "2024-03-09");
  assert.equal(observingNightDate("2024-11-03T05:00:00Z", "America/New_York"), observingNightDate("2024-11-03T06:00:00Z", "America/New_York"));
  assert.equal(observingNightDate("2025-01-01T22:00:00Z", "Pacific/Kiritimati"), "2025-01-02");
  assert.equal(observingNightDate("2025-01-02T00:00:00Z", "Etc/GMT+12"), "2025-01-01");
  assert.equal(observingNightDate("2024-03-01T01:00:00Z", "UTC"), "2024-02-29");
});
test("polar daylight omits numeric summary and continuous darkness retains noon grouping", () => {
  const daylight = aggregateDarkCloudSamples([], { ...mapping, latitude: 90 }, { startNight: "2025-06-20", endNight: "2025-06-20" });
  assert.equal(summarizeMonth(daylight, 6).quality, "no-astronomical-darkness");
  const dark = aggregateDarkCloudSamples([], { ...mapping, latitude: 90 }, { startNight: "2025-12-20", endNight: "2025-12-20" });
  assert.equal(summarizeMonth(dark, 12).expectedEligibleSamples, 24);
});
test("streamed and batch sample aggregation match; timezone is part of key", () => {
  const rows = [sample(20, 0.1), sample(21, 0.4)];
  function* stream() { yield* rows; }
  assert.deepEqual(aggregateDarkCloudSamples(stream(), mapping, method), aggregateDarkCloudSamples(rows, mapping, method));
  assert.notEqual(aggregateDarkCloudSamples([], mapping, method).key, aggregateDarkCloudSamples([], { ...mapping, timeZone: "Europe/London" }, method).key);
});
test("chunk checkpoint ledger rejects duplicates, incomplete checkpoints and revisions", () => {
  const entry = { chunkId: "a", sha256: "a".repeat(64), sourceRevision: "0001", complete: true };
  assert.doesNotThrow(() => validateChunkLedger([entry]));
  assert.throws(() => validateChunkLedger([entry, entry]));
  assert.throws(() => validateChunkLedger([{ ...entry, complete: false }]));
  assert.throws(() => validateChunkLedger([{ ...entry, sha256: "b".repeat(64) }], [entry]));
  assert.throws(() => validateChunkLedger([{ ...entry, sourceRevision: "0005" }], [entry]));
});
test("JPL independent historical Sun references validate the hourly darkness mask", () => {
  // NASA/JPL Horizons API, quantity 4 AIRLESS, UTC, geodetic (79,32.75,0 km).
  // Retrieved 2026-10-13; full query recipe/checksums in docs/operations/era5.md.
  // Literals come from JPL, not Astronomy Engine; 0.03-degree tolerance matches
  // existing independent horizon validation and does not model refraction.
  const cases = [
    ["1991-01-15", [-0.838717207, -12.603929576, -24.849629203, -37.369719421, -49.963886620]],
    ["2000-01-15", [-0.870117957, -12.634010510, -24.878693510, -37.398225855, -49.992579965]],
    ["2020-01-15", [-0.853070461, -12.618723959, -24.864679013, -37.384894155, -49.979054050]],
  ] as const;
  for (const [date, expected] of cases) expected.forEach((altitude, index) => {
    const actual = sunAltitudeDegrees(`${date}T${index + 12}:00:00Z`, 32.75, 79);
    assert.ok(Math.abs(actual - altitude) <= 0.03, `${date} hour ${index + 12}: ${actual} vs ${altitude}`);
    assert.equal(actual <= -18, altitude <= -18);
  });
});
test("concentrated annual/hour gaps stay partial despite adequate total completeness", () => {
  const aggregate = aggregateDarkCloudSamples([], mapping, method);
  aggregate.period = { startNight: "1991-01-01", endNight: "2020-12-31", kind: "baseline-1991-2020" };
  const good = { expected: 1000, valid: 1000, counts: [100, 200, 300] as [number, number, number], sum: 400, yearsMask: 0x3fffffff, badYearsMask: 0 };
  aggregate.bins[20] = { ...good, counts: [...good.counts] };
  aggregate.bins[21] = { ...good, valid: 980, counts: [100, 200, 300], sum: 392, badYearsMask: 1 };
  const summary = summarizeMonth(aggregate, 1, [20, 21]);
  assert.equal(summary.completeness, 0.99);
  assert.equal(summary.quality, "partial");
  assert.equal(summary.badYearCount, 1);
  aggregate.bins[21] = { ...good, expected: 100, valid: 50, counts: [10, 20, 30], sum: 40 };
  const weighted = summarizeMonth(aggregate, 1, [20, 21]);
  assert.equal(weighted.meanCloudFraction, 440 / 1050);
  assert.equal(weighted.thresholds![0]!.frequency, 110 / 1050);
  assert.equal(weighted.quality, "partial");
});
test("failed input validation closes the source iterator", () => {
  let closed = false;
  function* source() { try { yield sample(20, 2); } finally { closed = true; } }
  assert.throws(() => aggregateDarkCloudSamples(source(), mapping, method));
  assert.equal(closed, true);
});
