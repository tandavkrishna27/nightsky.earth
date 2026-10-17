import assert from "node:assert/strict";
import test from "node:test";
import { registerNightSkyTools, type NightSkyDependencies } from "../../server/mcp/registerTools";
import { GeoNamesPlaceIndex } from "../../server/places/geonames";
import { createWeatherCollection } from "../../server/providers/weather/collection";
import type { WeatherProviderId, WeatherProviderResult } from "../../server/providers/weather/types";
const index = new GeoNamesPlaceIndex([{ geonameId: 2643743, name: "London", asciiName: "London", alternateNames: "", latitude: 51.5, longitude: -0.12, countryCode: "GB", countryName: "United Kingdom", featureClass: "P", featureCode: "PPLC", population: 8_000_000, timeZone: "Europe/London", modificationDate: "2026-10-01" }], "fixture-2026-10");
const window = { startUtc: "2026-10-25T00:00:00Z", endUtc: "2026-10-25T06:00:00Z", timeZone: "Europe/London" };
const input = { placeId: "place:v1:geonames:2643743", window, activity: "general-stargazing" };
function fixture(name: string, cloud: number, times = ["2026-10-25T00:00:00Z", "2026-10-25T03:00:00Z"]): WeatherProviderResult { return { status: "available", reason: "Synthetic forecast.", forecast: { availability: { status: "available", reason: "Synthetic samples." }, source: { name, url: "https://example.test/weather", attribution: "Synthetic fixture.", dataClass: "forecast" }, forecastHorizonHours: 48, samples: times.map(validAt => ({ validAt, values: { totalCloudCover: { value: cloud, unit: "%" } } })), missingFields: [{ field: "lowCloudCover", reason: "Not supplied." }] } }; }
function handlers(dependencies: NightSkyDependencies) { const tools = new Map<string, (input: any) => Promise<any>>(); registerNightSkyTools({ registerTool: (name: string, _options: unknown, fn: any) => tools.set(name, fn) } as any, { placeIndex: index, osmCandidateIndexLoader: async () => undefined, ...dependencies }); return tools; }
function collection(results: Array<[WeatherProviderId, WeatherProviderResult]>) { return createWeatherCollection(results.map(([id, result]) => ({ id, enabled: true, provider: { getForecast: async (point, requested) => { assert.deepEqual(point, { placeId: input.placeId, latitude: 51.5, longitude: -0.12 }); assert.deepEqual(requested, window); return result; } } })), { deadlineMs: 100 }); }
test("conditions, plan and comparison retain disagreeing source evidence and exact missing status through DST", async () => {
  const tools = handlers({ weatherCollection: collection([["met", fixture("MET fixture", 0, ["2026-10-25T00:00:00Z", "2026-10-25T01:00:00Z"] )], ["weatherapi", fixture("WeatherAPI fixture", 100)], ["openweather", { status: "out-of-horizon", reason: "Synthetic horizon limit.", source: { name: "OpenWeather fixture", url: "https://example.test/openweather", attribution: "Synthetic", dataClass: "forecast" } }]]) });
  const direct = (await tools.get("get_night_conditions")!({ ...input, includeHourly: true })).structuredContent;
  assert.equal(direct.availability.status, "partial"); assert.equal(direct.providerOutcomes[2].status, "out-of-horizon"); assert.equal(direct.forecasts.length, 2);
  assert.equal(direct.forecasts[0].samples[0].values.lowCloudCover, undefined);
  const plan = (await tools.get("plan_observing_session")!(input)).structuredContent;
  assert.deepEqual(plan.evidence.weather, direct); assert.match(plan.summary, /MET fixture/); assert.match(plan.summary, /WeatherAPI fixture/);
  assert.ok(plan.preparation.some((s: string) => /WeatherAPI fixture.*substantial cloud/.test(s)));
  const compare = (await tools.get("compare_observing_options")!({ options: [input, { ...input, activity: "astrophotography" }], locale: "en", units: "metric" })).structuredContent;
  assert.deepEqual(compare.comparisons[0].evidence.weather, direct); assert.equal(compare.comparisons[0].evidence.weather.providerOutcomes[2].reason, "Synthetic horizon limit.");
});
test("invalid collection source does not discard usable independent source", async () => {
  const tools = handlers({ weatherCollection: { getForecasts: async () => ({ outcomes: [{ providerId: "met", result: fixture("Good source", 10) }, { providerId: "weatherapi", result: { status: "available", reason: "Invalid", forecast: {} } as any }] }) } });
  const result = (await tools.get("get_night_conditions")!({ ...input, includeHourly: true })).structuredContent;
  assert.equal(result.availability.status, "partial"); assert.equal(result.forecasts.length, 1); assert.equal(result.providerOutcomes[1].status, "unavailable"); assert.match(result.providerOutcomes[1].source.name, /weatherapi/); assert.ok(!result.sources.some((s: any) => /MET Norway/.test(s.name)));
});
test("no usable samples remains unavailable and no-darkness samples remain visible", async () => {
  const tools = handlers({ weatherCollection: collection([["met", fixture("Day source", 0, ["2026-10-25T12:00:00Z"])]]) });
  const direct = (await tools.get("get_night_conditions")!({ ...input, includeHourly: true })).structuredContent;
  assert.equal(direct.availability.status, "unavailable"); assert.deepEqual(direct.nightContext.forecastStepsDuringDarkness[0].validTimesUtc, []);
  const plan = (await tools.get("plan_observing_session")!(input)).structuredContent; assert.ok(plan.gaps.some((s: string) => /Day source.*no forecast samples/.test(s)));
});
test("rejects conflicting collection and legacy injection; preserves legacy provider", async () => {
  const weatherProvider = { getForecast: async () => fixture("Legacy fixture", 5) };
  assert.throws(() => handlers({ weatherProvider, weatherCollection: collection([]) }), /not both/);
  const tools = handlers({ weatherProvider }); const direct = (await tools.get("get_night_conditions")!({ ...input, includeHourly: true })).structuredContent;
  assert.equal(direct.availability.status, "available"); assert.equal(direct.sources[0].name, "Legacy fixture");
});
for (const count of [0, 1, 2, 3]) test(`collection with ${count} usable sources preserves independently labelled series`, async () => {
  const ids: WeatherProviderId[] = ["met", "weatherapi", "openweather"];
  const tools = handlers({ weatherCollection: collection(ids.slice(0, count).map(id => [id, fixture(`${id} fixture`, 10)])) });
  const result = (await tools.get("get_night_conditions")!({ ...input, includeHourly: true })).structuredContent;
  assert.equal(result.forecasts.length, count); assert.equal(result.availability.status, count ? "available" : "unavailable"); assert.equal(result.providerOutcomes.length, count);
});
test("all unavailable sources retain exact individual reasons and independent source records", async () => {
  const tools = handlers({ weatherCollection: collection([["met", { status: "unavailable", reason: "Synthetic outage" }], ["weatherapi", { status: "not-covered", reason: "Synthetic coverage gap" }]]) });
  const result = (await tools.get("get_night_conditions")!({ ...input, includeHourly: true })).structuredContent;
  assert.equal(result.availability.status, "unavailable"); assert.deepEqual(result.providerOutcomes.map((o: any) => [o.status, o.reason]), [["unavailable", "Synthetic outage"], ["not-covered", "Synthetic coverage gap"]]); assert.equal(result.forecasts.length, 0); assert.ok(result.sources.every((s: any) => s.dataClass === "context"));
});
test("malformed injected collection produces safely unavailable evidence", async () => {
  const tools = handlers({ weatherCollection: { getForecasts: async () => ({ outcomes: [{ providerId: "wrong", result: fixture("Wrong", 0) }] }) as any } });
  const result = (await tools.get("get_night_conditions")!({ ...input, includeHourly: true })).structuredContent;
  assert.equal(result.availability.status, "unavailable"); assert.equal(result.forecasts.length, 0); assert.ok(!JSON.stringify(result).includes("Wrong"));
});
test("three maximum-length source records and full series retain factors and attributions within public caps", async () => {
  const ids: WeatherProviderId[] = ["met", "weatherapi", "openweather"];
  const fields = ["totalCloudCover", "lowCloudCover", "mediumCloudCover", "highCloudCover", "precipitationProbability", "precipitationAmount", "windSpeed", "windGust", "windDirection", "temperature", "dewPoint", "relativeHumidity", "visibility"];
  const results: Array<[WeatherProviderId, WeatherProviderResult]> = ids.map(id => {
    const result = fixture(id + "x".repeat(120 - id.length), 20);
    result.forecast!.source.attribution = id + " attribution " + "x".repeat(450);
    result.forecast!.samples = Array.from({ length: 48 }, (_, i) => ({ validAt: new Date(Date.parse(window.startUtc) + i * 450_000).toISOString(), values: Object.fromEntries(fields.map(field => [field, { value: 20, unit: "%" }])) }));
    result.forecast!.missingFields = [];
    return [id, result];
  });
  const tools = handlers({ weatherCollection: collection(results) });
  const plan = (await tools.get("plan_observing_session")!(input)).structuredContent;
  assert.equal(plan.evidence.weather.forecasts.length, 3); assert.equal(plan.factors.filter((f: any) => /forecast/.test(f.name)).length, 6);
  for (const [, result] of results) assert.ok(plan.sources.some((s: any) => s.attribution === result.forecast!.source.attribution));
  assert.ok(plan.summary.length <= 1200); assert.ok(plan.factors.length <= 20); assert.ok(plan.sources.length <= 64);
});
