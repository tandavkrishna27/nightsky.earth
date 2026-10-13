import test from "node:test";
import assert from "node:assert/strict";
import { findReviewedMeteorPeaks } from "../../server/events/meteorPeaks";

test("NASA original 2026 Table 3 peaks retain all thirteen shower codes and exact UTC forecasts", () => {
  const rows = findReviewedMeteorPeaks(Date.parse("2026-01-01T00:00:00Z"), Date.parse("2026-12-31T23:59:59Z"));
  assert.deepEqual(rows.map(row => [row.code, row.peakUtc]), [
    ["QUA", "2026-01-03T18:38:00Z"], ["ETA", "2026-05-06T16:30:00Z"], ["ZPE", "2026-06-03T06:48:00Z"], ["ARI", "2026-06-10T02:03:00Z"], ["SSG", "2026-06-20T03:55:00Z"], ["SDA", "2026-07-30T00:39:00Z"], ["CAP", "2026-07-31T04:30:00Z"], ["PER", "2026-08-13T14:09:00Z"], ["DSX", "2026-10-01T23:40:00Z"], ["DRA", "2026-10-09T02:10:00Z"], ["AND", "2026-11-28T05:12:00Z"], ["GEM", "2026-12-14T13:00:00Z"], ["URS", "2026-12-22T15:54:00Z"],
  ]);
  for (const row of rows) {
    assert.equal("activityCalendarDateWindow" in row, false);
    assert.equal("visualRate" in row, false);
    assert.equal(row.source.vintage, "NASA-MEO-2026-issued-2025-10-17");
    assert.equal(row.source.modified, true);
  }
});

test("reviewed peaks are inclusive instants and never recur into unsupported years", () => {
  const peak = Date.parse("2026-08-13T14:09:00Z");
  assert.equal(findReviewedMeteorPeaks(peak, peak).length, 1);
  assert.deepEqual(findReviewedMeteorPeaks(peak + 1, peak + 1000), []);
  assert.deepEqual(findReviewedMeteorPeaks(Date.parse("2027-01-01T00:00:00Z"), Date.parse("2028-01-01T00:00:00Z")), []);
  assert.throws(() => findReviewedMeteorPeaks(NaN, peak), /finite/);
  assert.throws(() => findReviewedMeteorPeaks(peak + 1, peak), /ordered/);
});
