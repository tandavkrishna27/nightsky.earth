import assert from "node:assert/strict";
import test from "node:test";
import { getNightConditionsInputSchema } from "../../shared/nightsky/weather";
import { compareObservingOptionsInputSchema, planObservingSessionInputSchema } from "../../shared/nightsky/planning";

const base = { placeId: "place:v1:geonames:990001", window: { startUtc: "2026-10-17T18:00:00Z", endUtc: "2026-10-17T21:00:00Z", timeZone: "UTC" } };

test("weather tools default to one source and admit bounded explicit comparison", () => {
  assert.equal(getNightConditionsInputSchema.parse(base).forecastMode, "single");
  assert.equal(planObservingSessionInputSchema.parse({ ...base, activity: "general-stargazing" }).forecastMode, "single");
  for (const forecastMode of ["compare", "all"] as const) {
    assert.equal(getNightConditionsInputSchema.parse({ ...base, forecastMode }).forecastMode, forecastMode);
    assert.equal(planObservingSessionInputSchema.parse({ ...base, activity: "general-stargazing", forecastMode }).forecastMode, forecastMode);
  }
  assert.equal(getNightConditionsInputSchema.safeParse({ ...base, forecastMode: "auto-all" }).success, false);
  const comparison = compareObservingOptionsInputSchema.parse({ options: [
    { ...base, activity: "general-stargazing" },
    { ...base, activity: "astrophotography", forecastMode: "compare" },
  ] });
  assert.deepEqual(comparison.options.map(option => option.forecastMode), ["single", "compare"]);
});
