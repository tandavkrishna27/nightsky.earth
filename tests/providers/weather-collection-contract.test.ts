import assert from "node:assert/strict";
import { test } from "node:test";
import { nightConditionsResultSchema, weatherForecastSchema } from "../../shared/nightsky/weather";

const source = { name: "Synthetic weather", url: "https://example.com/weather", attribution: "Synthetic fixture", dataClass: "forecast" };
const outcome = (providerId: string) => ({ providerId, status: "unavailable", reason: "Not configured", source });
const base = { availability: { status: "unavailable", reason: "Synthetic" }, sources: [source], caveats: [], placeId: "place:v1:test-place", window: { startUtc: "2026-10-17T18:00:00Z", endUtc: "2026-10-18T06:00:00Z", timeZone: "UTC" }, forecasts: [], nightContext: { darkness: { status: "unknown", reason: "Synthetic" }, forecastStepsDuringDarkness: [] } };
test("legacy result without provider outcomes remains valid", () => { assert.equal(nightConditionsResultSchema.safeParse(base).success, true); });
for (const ids of [[], ["met"], ["met", "weatherapi", "openweather"]]) test(`accepts ${ids.length} provider outcomes`, () => { assert.equal(nightConditionsResultSchema.safeParse({ ...base, providerOutcomes: ids.map(outcome) }).success, true); });
test("rejects duplicate, unknown and more than four outcomes", () => {
  for (const ids of [["met", "met"], ["geoapify"], ["met", "weatherapi", "openweather", "met", "met"]]) assert.equal(nightConditionsResultSchema.safeParse({ ...base, providerOutcomes: ids.map(outcome) }).success, false);
});
test("outcomes require bounded reason and source and reject credentials", () => {
  for (const invalid of [{ ...outcome("met"), reason: "x".repeat(501) }, { ...outcome("met"), source: undefined }, { ...outcome("met"), apiKey: "synthetic-secret" }]) assert.equal(nightConditionsResultSchema.safeParse({ ...base, providerOutcomes: [invalid] }).success, false);
});
test("missing forecast fields and issue time remain absent", () => {
  const forecast = weatherForecastSchema.parse({ availability: { status: "partial", reason: "Limited fixture" }, source, forecastHorizonHours: 3, samples: [{ validAt: "2026-10-17T18:00:00Z", values: { totalCloudCover: { value: 0, unit: "%" } } }], missingFields: [{ field: "lowCloudCover", reason: "Not supplied" }] });
  assert.equal(forecast.source.issuedAt, undefined);
  assert.equal(forecast.samples[0].values.lowCloudCover, undefined);
  assert.equal(forecast.samples[0].values.totalCloudCover?.value, 0);
  assert.equal(weatherForecastSchema.safeParse({ ...forecast, apiKey: "synthetic-secret" }).success, false);
});

