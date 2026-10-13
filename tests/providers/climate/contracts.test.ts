import assert from "node:assert/strict";
import test from "node:test";
import { climateContextResultSchema, getClearSkyClimatologyInputSchema, describeClimateContext } from "../../../shared/nightsky/climate";

export function climateFixture() {
  return {
    schemaVersion: 2, placeId: "place:v1:geonames:1270426", month: 1, timeZone: "Asia/Kolkata",
    dataClass: "reanalysis", historicalLabel: "historical-not-a-forecast", methodVersion: "dark-cloud-v1",
    sampleDefinition: "hourly-dark-time-samples", unit: "fraction",
    period: { startNight: "2025-01-01", endNight: "2025-01-31", kind: "sample-only" },
    availability: { status: "partial", reason: "One-month sample only." }, caveats: [],
    sources: [{ name: "Copernicus ERA5", url: "https://doi.org/10.24381/cds.adbb2d47", attribution: "Contains modified Copernicus Climate Change Service information.", dataClass: "reanalysis", licenseUrl: "https://creativecommons.org/licenses/by/4.0/", vintage: "fixture" }],
    grid: { mapping: "nearest-supplied-cell", cellId: "era5:32.75:79", spacingDegrees: 0.25, displacementKm: 5, placeIndexVintage: "fixture" },
    summary: { expectedEligibleSamples: 10, validEligibleSamples: 10, representedYears: 1, badYearCount: 0,
      meanCloudFraction: 0.4, completeness: 1,
      thresholds: [{ fraction: 0.1, count: 2, frequency: 0.2 }, { fraction: 0.25, count: 4, frequency: 0.4 }, { fraction: 0.5, count: 6, frequency: 0.6 }] },
  };
}
test("climate V2 accepts labeled samples and rejects misleading available pilots", () => {
  assert.equal(climateContextResultSchema.parse(climateFixture()).schemaVersion, 2);
  assert.throws(() => climateContextResultSchema.parse({ ...climateFixture(), availability: { status: "available", reason: "Complete." } }));
});
test("climate V2 rejects inconsistent counts, means and threshold frequencies", () => {
  for (const mutation of [
    { validEligibleSamples: 11 }, { completeness: 0.9 }, { meanCloudFraction: Infinity },
    { thresholds: [{ fraction: 0.1, count: 11, frequency: 1.1 }, { fraction: 0.25, count: 4, frequency: 0.4 }, { fraction: 0.5, count: 6, frequency: 0.6 }] },
    { thresholds: [...climateFixture().summary.thresholds].reverse() },
  ]) assert.throws(() => climateContextResultSchema.parse({ ...climateFixture(), summary: { ...climateFixture().summary, ...mutation } }));
});
test("zero denominators omit numeric cloud statistics", () => {
  const summary = { expectedEligibleSamples: 0, validEligibleSamples: 0, representedYears: 0, badYearCount: 0 };
  const result = { ...climateFixture(), summary, availability: { status: "not-covered", reason: "No astronomical darkness." } };
  assert.equal(climateContextResultSchema.safeParse(result).success, true);
  assert.throws(() => climateContextResultSchema.parse({ ...result, summary: { ...summary, meanCloudFraction: 0 } }));
});
test("climate contract preserves provenance, mapping, period and historical semantics", () => {
  for (const mutation of [ { sources: [] }, { dataClass: "forecast" }, { historicalLabel: "forecast" },
    { grid: { ...climateFixture().grid, mapping: "interpolated" } },
    { period: { ...climateFixture().period, kind: "baseline-1991-2020" } },
    { period: { ...climateFixture().period, startNight: "2025-02-30" } },
    { month: 13 }, { schemaVersion: 1 },
  ]) assert.throws(() => climateContextResultSchema.parse({ ...climateFixture(), ...mutation }));
  assert.throws(() => getClearSkyClimatologyInputSchema.parse({ placeId: "place:v1:geonames:1", month: 0 }));
});
test("unavailable climate has no fabricated summary", () => {
  const { summary, grid, ...rest } = climateFixture();
  assert.equal(climateContextResultSchema.safeParse({ ...rest, availability: { status: "unavailable", reason: "No artifact." } }).success, true);
  assert.throws(() => climateContextResultSchema.parse({ ...rest, summary, availability: { status: "unavailable", reason: "No artifact." } }));
});
test("no-darkness states and represented years cannot contradict valid samples", () => {
  assert.throws(() => climateContextResultSchema.parse({ ...climateFixture(), availability: { status: "not-covered", reason: "No astronomical darkness." } }));
  assert.throws(() => climateContextResultSchema.parse({ ...climateFixture(), summary: { ...climateFixture().summary, representedYears: 0 } }));
});

test("historical description preserves distinct statistics within the planner factor limit", () => {
  const text = describeClimateContext(climateContextResultSchema.parse(climateFixture()));
  assert.ok(text.length <= 500);
  for (const phrase of ["Mean modeled cloud amount", "hourly dark-time sample frequencies", "cloud ≤10%", "cloud ≤25%", "cloud ≤50%", "sample-only", "Not a forecast or whole-night success probability"]) assert.ok(text.includes(phrase), phrase);
});
