import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { findReviewedMeteorPeaks } from "../../server/events/meteorPeaks";

test("2025 forecasts are independent year-specific data with inclusive bounds and source", () => {
  const peak = Date.parse("2025-08-13T08:01:00Z");
  const rows = findReviewedMeteorPeaks(Date.parse("2025-01-01T00:00:00Z"), Date.parse("2026-01-01T00:00:00Z"));
  assert.equal(rows.length, 13);
  assert.equal(findReviewedMeteorPeaks(peak, peak)[0]?.peakUtc, "2025-08-13T08:01:00Z");
  assert.equal(rows[0]?.source.vintage, "NASA-MEO-2025-issued-2024-10-18");
  assert.equal(rows[0]?.source.licenseUrl, "https://ntrs.nasa.gov/citations/20240012381");
  assert.deepEqual(findReviewedMeteorPeaks(peak + 1, peak + 1000), []);
});

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
  assert.deepEqual(findReviewedMeteorPeaks(Date.parse("2028-01-01T00:00:00Z"), Date.parse("2029-01-01T00:00:00Z")), []);
  assert.throws(() => findReviewedMeteorPeaks(NaN, peak), /finite/);
  assert.throws(() => findReviewedMeteorPeaks(peak + 1, peak), /ordered/);
});

test("2026 rights preserve public-use metadata without inferring ownership", () => {
  const catalog = JSON.parse(readFileSync("data/events/meteor-peaks-nasa-2026.json", "utf8"));
  assert.equal(catalog.rightsStatement, "NASA NTRS PUBLIC distribution; GOV_PUBLIC_USE_PERMITTED. Ownership not inferred.");
  assert.equal(catalog.sourceUrl, "https://ntrs.nasa.gov/api/citations/20250009524/downloads/LEO_Forecast_2026.pdf");
  assert.equal(catalog.rightsEvidenceUrl, "https://ntrs.nasa.gov/citations/20250009524");
  assert.equal(catalog.peaks.length, 13);
  assert.equal(findReviewedMeteorPeaks(Date.parse("2026-01-01T00:00:00Z"), Date.parse("2026-12-31T23:59:59Z")).length, 13);
});
import { GeoNamesPlaceIndex } from "../../server/places/geonames";
import { searchSkyEvents } from "../../server/events/catalog";

test("2027 independently reviewed Table 3 returns twelve UT-minute maxima without recurrence", () => {
  // Hand-transcribed from rendered NASA 2027 report, Table 3, page 9.
  const rows = findReviewedMeteorPeaks(Date.parse("2027-01-01T00:00:00Z"), Date.parse("2027-12-31T23:59:59Z"));
  assert.deepEqual(rows.map(row => [row.code, row.peakUtc]), [
    ["QUA", "2027-01-04T00:48:00Z"], ["ETA", "2027-05-06T22:28:00Z"],
    ["ZPE", "2027-06-03T12:51:00Z"], ["ARI", "2027-06-10T08:02:00Z"],
    ["SDA", "2027-07-30T06:52:00Z"], ["CAP", "2027-07-31T10:41:00Z"],
    ["PER", "2027-08-13T20:20:00Z"], ["DSX", "2027-10-02T05:51:00Z"],
    ["DRA", "2027-10-09T08:20:00Z"], ["LEO", "2027-11-20T04:38:00Z"],
    ["GEM", "2027-12-14T19:13:00Z"], ["URS", "2027-12-22T22:07:00Z"],
  ]);
  for (const peak of ["2027-01-04T00:48:00Z", "2027-11-20T04:38:00Z", "2027-12-22T22:07:00Z"]) {
    assert.equal(findReviewedMeteorPeaks(Date.parse(peak), Date.parse(peak)).length, 1);
    assert.deepEqual(findReviewedMeteorPeaks(Date.parse(peak) + 1, Date.parse(peak) + 1000), []);
  }
  assert.ok(rows.every(row => row.code !== "SSG" && row.code !== "AND"));
  assert.ok(findReviewedMeteorPeaks(Date.parse("2026-01-01T00:00:00Z"), Date.parse("2026-12-31T23:59:59Z")).some(row => row.code === "AND"));
  for (const row of rows) {
    assert.equal(row.source.vintage, "NASA-MEO-2027-issued-2026-10-16");
    assert.equal(row.source.licenseUrl, "https://ntrs.nasa.gov/citations/20260009360");
    assert.equal(row.source.modified, true);
    assert.equal("visualRate" in row, false);
  }
});

test("2027 meteor search preserves source, UT precision and partial season/visibility coverage", async () => {
  const index = new GeoNamesPlaceIndex([{ geonameId: 1, name: "Pune", asciiName: "Pune", alternateNames: "", latitude: 18.5204, longitude: 73.8567, countryCode: "IN", countryName: "India", featureClass: "P", featureCode: "PPL", population: 1, timeZone: "Asia/Kolkata", modificationDate: "2026-01-01" }], "fixture");
  const result = await searchSkyEvents({ placeId: "place:v1:geonames:1", window: { startUtc: "2027-11-20T00:00:00Z", endUtc: "2027-11-21T00:00:00Z", timeZone: "Asia/Kolkata" }, eventTypes: ["meteor-shower"] }, index);
  assert.equal(result.availability.status, "partial");
  assert.equal(result.events.length, 1);
  const event = result.events[0]!;
  assert.equal(event.name, "Leonids");
  assert.equal(event.peakUtc, "2027-11-20T04:38:00Z");
  assert.equal(event.localVisibility, "not-evaluated");
  assert.equal(event.startUtc, undefined);
  assert.equal(event.endUtc, undefined);
  assert.equal(event.source.url, "https://ntrs.nasa.gov/api/citations/20260009360/downloads/LEO_Forecast_2027.pdf");
  assert.match(event.source.attribution!, /UT.*minute/i);
  assert.ok(result.caveats.some(text => /SSG.*AND/.test(text) && /absence/i.test(text)));
  assert.ok(result.caveats.some(text => /2027/.test(text) && /12/.test(text)));
});


test("reviewed meteor admission rejects same-count code substitutions and wrong-year timestamps", async () => {
  const { validateReviewedMeteorPeakCoverage } = await import("../../server/events/meteorPeaks");
  for (const year of [2025, 2026, 2027]) {
    const rows = findReviewedMeteorPeaks(Date.parse(`${year}-01-01T00:00:00Z`), Date.parse(`${year}-12-31T23:59:59Z`));
    assert.doesNotThrow(() => validateReviewedMeteorPeakCoverage(year, rows));
    assert.throws(() => validateReviewedMeteorPeakCoverage(year, rows.map((row, i) => i === 0 ? {...row, code: "UNKNOWN"} : row)), /coverage/);
    assert.throws(() => validateReviewedMeteorPeakCoverage(year, rows.map((row, i) => i === 0 ? {...row, peakUtc: "2028-01-01T00:00:00Z"} : row)), /coverage/);
    assert.throws(() => validateReviewedMeteorPeakCoverage(year, rows.slice(1)), /coverage/);
  }
});

test("reviewed admission binds each peak artifact to its exact retained report identity", async () => {
  const { validateReviewedMeteorPeakCatalog } = await import("../../server/events/meteorPeaks");
  for (const year of [2025, 2026, 2027]) {
    const catalog = JSON.parse(readFileSync(`data/events/meteor-peaks-nasa-${year}.json`, "utf8"));
    assert.doesNotThrow(() => validateReviewedMeteorPeakCatalog(year, catalog));
    for (const [field, value] of Object.entries({
      sourceUrl: "https://ntrs.nasa.gov/unreviewed.pdf",
      rightsEvidenceUrl: "https://ntrs.nasa.gov/citations/unreviewed",
      vintage: `NASA-MEO-${year}-unreviewed-revision`, table: "Table 4",
      rightsStatement: "Public domain inferred", reviewedAt: "invalid",
    })) {
      assert.throws(() => validateReviewedMeteorPeakCatalog(year, { ...catalog, [field]: value }), undefined, field);
    }
    assert.throws(() => validateReviewedMeteorPeakCatalog(2028, catalog), /admission/);
  }
});
