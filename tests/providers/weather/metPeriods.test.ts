import assert from "node:assert/strict";
import test from "node:test";
import { parseLocationForecast } from "../../../server/providers/weather/metNorway";
import { weatherForecastSchema } from "../../../shared/nightsky/weather";

const place = { placeId: "place:v1:geonames:1259229", latitude: 18.52, longitude: 73.85 };
const window = { startUtc: "2026-10-13T00:00:00Z", endUtc: "2026-10-13T02:00:00Z", timeZone: "Asia/Kolkata" };
function parse(data: unknown) {
  return parseLocationForecast({ properties: { meta: { updated_at: "2026-10-13T00:00:00Z" }, timeseries: [{ time: "2026-10-13T01:00:00Z", data }] } }, place, window, { checkedAt: "2026-10-13T00:00:00Z" }).forecast!;
}

test("MET chooses the shortest supplied period independently for each precipitation field", () => {
  const forecast = parse({ instant: { details: { air_temperature: 12 } }, next_1_hours: { details: { precipitation_amount: 1 } }, next_6_hours: { details: { precipitation_amount: 6, probability_of_precipitation: 40 } }, next_12_hours: { details: { precipitation_amount: 12, probability_of_precipitation: 90 } } });
  const values = forecast.samples[0]!.values;
  assert.equal(values.precipitationAmount?.value, 1);
  assert.equal(values.precipitationProbability?.value, 40);
  assert.equal(values.precipitationAmount?.periodEndUtc, "2026-10-13T02:00:00.000Z");
  assert.equal(values.precipitationProbability?.periodEndUtc, "2026-10-13T07:00:00.000Z");
  assert.equal(values.temperature?.periodStartUtc, undefined);
});

test("MET preserves longer periods crossing the requested night end without clipping or hourly conversion", () => {
  const forecast = parse({ instant: { details: { cloud_area_fraction: 5 } }, next_12_hours: { details: { precipitation_amount: 12 } } });
  assert.deepEqual(forecast.samples[0]!.values.precipitationAmount, { value: 12, unit: "mm", periodStartUtc: "2026-10-13T01:00:00.000Z", periodEndUtc: "2026-10-13T13:00:00.000Z" });
});

test("weather values reject a half specified or reversed aggregation interval", () => {
  const forecast = parse({ instant: { details: { air_temperature: 12 } }, next_1_hours: { details: { precipitation_amount: 1 } } });
  const bad = structuredClone(forecast);
  delete bad.samples[0]!.values.precipitationAmount!.periodEndUtc;
  assert.equal(weatherForecastSchema.safeParse(bad).success, false);
  bad.samples[0]!.values.precipitationAmount!.periodEndUtc = "2026-10-12T01:00:00Z";
  assert.equal(weatherForecastSchema.safeParse(bad).success, false);
});

test("MET retains overlapping rainfall between timestamp steps without copying earlier instant conditions", () => {
  const result = parseLocationForecast({ properties: { meta: { updated_at: "2026-10-13T00:00:00Z" }, timeseries: [
    { time: "2026-10-13T00:00:00Z", data: { instant: { details: { cloud_area_fraction: 5 } }, next_6_hours: { details: { precipitation_amount: 6 } } } },
    { time: "2026-10-13T06:00:00Z", data: { instant: { details: { cloud_area_fraction: 50 } } } },
  ] } }, place, { ...window, startUtc: "2026-10-13T01:00:00Z", endUtc: "2026-10-13T05:00:00Z" }, { checkedAt: "2026-10-13T00:00:00Z" });
  assert.equal(result.status, "partial");
  assert.equal(result.forecast?.samples[0]?.values.precipitationAmount?.value, 6);
  assert.equal(result.forecast?.samples[0]?.values.precipitationAmount?.periodStartUtc, "2026-10-13T00:00:00.000Z");
  assert.equal(result.forecast?.samples[0]?.values.totalCloudCover, undefined);
});

test("MET reports a sparse instant-only sampling gap as not covered rather than outside the horizon", () => {
  const result = parseLocationForecast({ properties: { meta: { updated_at: "2026-10-13T00:00:00Z" }, timeseries: [
    { time: "2026-10-13T00:00:00Z", data: { instant: { details: { cloud_area_fraction: 5 } } } },
    { time: "2026-10-13T06:00:00Z", data: { instant: { details: { cloud_area_fraction: 50 } } } },
  ] } }, place, { ...window, startUtc: "2026-10-13T01:00:00Z", endUtc: "2026-10-13T05:00:00Z" }, { checkedAt: "2026-10-13T00:00:00Z" });
  assert.equal(result.status, "not-covered");
  assert.equal(result.forecast, undefined);
});
