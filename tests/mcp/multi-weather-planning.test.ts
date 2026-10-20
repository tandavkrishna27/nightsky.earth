import assert from "node:assert/strict";
import test from "node:test";
import { registerNightSkyTools, type NightSkyDependencies } from "../../server/mcp/registerTools";
import { GeoNamesPlaceIndex } from "../../server/places/geonames";
import { createWeatherCollection } from "../../server/providers/weather/collection";
import type { WeatherProviderId, WeatherProviderResult } from "../../server/providers/weather/types";
const index = new GeoNamesPlaceIndex([{ geonameId: 2643743, name: "London", asciiName: "London", alternateNames: "", latitude: 51.5, longitude: -0.12, countryCode: "GB", countryName: "United Kingdom", featureClass: "P", featureCode: "PPLC", population: 8_000_000, timeZone: "Europe/London", modificationDate: "2026-10-01" }], "fixture-2026-10");
const window = { startUtc: "2026-10-25T00:00:00Z", endUtc: "2026-10-25T06:00:00Z", timeZone: "Europe/London" };
const input = { placeId: "place:v1:geonames:2643743", window, activity: "general-stargazing" };
function fixture(name: string, cloud: number, times = ["2026-10-25T00:00:00Z", "2026-10-25T03:00:00Z"]): WeatherProviderResult { return { status: "available", reason: "Synthetic forecast.", forecast: { availability: { status: "available", reason: "Synthetic samples." }, source: { name, url: "https://example.test/weather", attribution: "Synthetic fixture.", dataClass: "forecast", validStartUtc: window.startUtc, validEndUtc: window.endUtc }, forecastHorizonHours: 48, samples: times.map(validAt => ({ validAt, values: { totalCloudCover: { value: cloud, unit: "%" } } })), missingFields: [{ field: "lowCloudCover", reason: "Not supplied." }] } }; }
function handlers(dependencies: NightSkyDependencies) { const tools = new Map<string, (input: any) => Promise<any>>(); registerNightSkyTools({ registerTool: (name: string, _options: unknown, fn: any) => tools.set(name, fn) } as any, { placeIndex: index, osmCandidateIndexLoader: async () => undefined, ...dependencies }); return tools; }
function collection(results: Array<[WeatherProviderId, WeatherProviderResult]>) { return createWeatherCollection(results.map(([id, result]) => ({ id, enabled: true, provider: { getForecast: async (point, requested) => { assert.deepEqual(point, { placeId: input.placeId, latitude: 51.5, longitude: -0.12 }); assert.deepEqual(requested, window); return result; } } })), { deadlineMs: 100 }); }
test("conditions, plan and comparison retain disagreeing source evidence and exact missing status through DST", async () => {
  const tools = handlers({ weatherCollection: collection([["met", fixture("MET fixture", 0, ["2026-10-25T00:00:00Z", "2026-10-25T01:00:00Z"] )], ["weatherapi", fixture("WeatherAPI fixture", 100)], ["openweather", { status: "out-of-horizon", reason: "Synthetic horizon limit.", source: { name: "OpenWeather fixture", url: "https://example.test/openweather", attribution: "Synthetic", dataClass: "forecast" } }]]) });
  const direct = (await tools.get("get_night_conditions")!({ ...input, includeHourly: true, forecastMode: "all" })).structuredContent;
  assert.equal(direct.availability.status, "available"); assert.equal(direct.providerOutcomes.length, 2); assert.equal(direct.forecasts.length, 2);
  assert.equal(direct.forecasts[0].samples[0].values.lowCloudCover, undefined);
  const plan = (await tools.get("plan_observing_session")!({ ...input, forecastMode: "all" })).structuredContent;
  assert.deepEqual(plan.evidence.weather, direct); assert.match(plan.summary, /MET fixture/); assert.match(plan.summary, /WeatherAPI fixture/);
  assert.ok(plan.preparation.some((s: string) => /WeatherAPI fixture.*substantial cloud/.test(s)));
  const compare = (await tools.get("compare_observing_options")!({ options: [{ ...input, forecastMode: "all" }, { ...input, activity: "astrophotography", forecastMode: "all" }], locale: "en", units: "metric" })).structuredContent;
  assert.deepEqual(compare.comparisons[0].evidence.weather, direct); assert.ok(!JSON.stringify(compare).includes("OpenWeather fixture"));
});
test("invalid collection source does not discard usable independent source", async () => {
  const tools = handlers({ weatherCollection: { getForecasts: async () => ({ outcomes: [{ providerId: "met", result: fixture("Good source", 10) }, { providerId: "weatherapi", result: { status: "available", reason: "Invalid", forecast: {} } as any }] }) } });
  const result = (await tools.get("get_night_conditions")!({ ...input, includeHourly: true })).structuredContent;
  assert.equal(result.availability.status, "partial"); assert.equal(result.forecasts.length, 1); assert.equal(result.providerOutcomes[1].status, "unavailable"); assert.match(result.providerOutcomes[1].source.name, /weatherapi/); assert.ok(!result.sources.some((s: any) => /MET Norway/.test(s.name)));
});
test("only card-backed planning exposes OpenWeather while direct and comparison responses exclude it", async () => {
  const tools = handlers({ resultCardPrototype: true, weatherCollection: collection([["met", fixture("MET fixture", 10)], ["weatherapi", fixture("WeatherAPI fixture", 20)], ["openweather", fixture("OpenWeather fixture", 30)]]) });
  const direct = (await tools.get("get_night_conditions")!({ ...input, forecastMode: "all" })).structuredContent;
  const plan = (await tools.get("plan_observing_session")!({ ...input, forecastMode: "all" })).structuredContent;
  const compare = (await tools.get("compare_observing_options")!({ options: [input, { ...input, activity: "astrophotography" }], locale: "en", units: "metric" })).structuredContent;
  assert.equal(direct.forecasts.length, 2);
  assert.equal(plan.evidence.weather.forecasts.length, 3);
  assert.equal(compare.comparisons[0].evidence.weather.forecasts.length, 1);
  assert.ok(!JSON.stringify(direct).includes("OpenWeather fixture"));
  assert.ok(!JSON.stringify(compare).includes("OpenWeather fixture"));
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
  const result = (await tools.get("get_night_conditions")!({ ...input, includeHourly: true, forecastMode: "all" })).structuredContent;
  assert.equal(result.forecasts.length, Math.min(count, 2)); assert.equal(result.availability.status, count ? "available" : "unavailable"); assert.equal(result.providerOutcomes.length, Math.min(count, 2));
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
  const plan = (await tools.get("plan_observing_session")!({ ...input, forecastMode: "all" })).structuredContent;
  assert.equal(plan.evidence.weather.forecasts.length, 2); assert.equal(plan.factors.filter((f: any) => /forecast/.test(f.name)).length, 4);
  for (const [, result] of results.slice(0, 2)) assert.ok(plan.sources.some((s: any) => s.attribution === result.forecast!.source.attribution));
  assert.ok(!JSON.stringify(plan).includes("openweather attribution"));
  assert.ok(plan.summary.length <= 1200); assert.ok(plan.factors.length <= 20); assert.ok(plan.sources.length <= 64);
});

test("claimed available source with truncated horizon remains partial", async () => {
  const result = fixture("Short horizon", 0);
  result.forecast!.source.validEndUtc = "2026-10-25T03:00:00Z";
  const tools = handlers({ weatherCollection: collection([["met", result]]) });
  const direct = (await tools.get("get_night_conditions")!({ ...input, includeHourly: true })).structuredContent;
  assert.equal(direct.availability.status, "partial"); assert.equal(direct.providerOutcomes[0].status, "available");
});
for (const state of ["stale", "unavailable", "unknown", "unsupported", "available", "partial"] as const) test(`${state} full-window cloud intervals preserve evidence and gate derived judgments`, async () => {
  const result = fixture(`${state} interval source`, 0);
  result.status = state === "unknown" || state === "unsupported" ? "available" : state;
  result.forecast!.availability.status = state === "unavailable" ? "available" : state;
  result.forecast!.samples = [{ validAt: window.startUtc, values: { totalCloudCover: { value: 0, unit: "%", periodStartUtc: window.startUtc, periodEndUtc: window.endUtc } } }];
  const tools = handlers({ weatherCollection: collection([["met", result]]) });
  const direct = (await tools.get("get_night_conditions")!({ ...input, includeHourly: true })).structuredContent;
  const plan = (await tools.get("plan_observing_session")!(input)).structuredContent;
  const factor = plan.factors.find((f: any) => /cloud and precipitation forecast/.test(f.name));
  assert.equal(factor.impact, ["available", "partial"].includes(state) ? "favorable" : "unknown");
  assert.deepEqual(plan.evidence.weather, direct); assert.equal(plan.evidence.weather.forecasts[0].availability.status, result.forecast!.availability.status);
  assert.ok(plan.candidateWindows.length > 0);
  assert.ok(plan.candidateWindows.every((w: any) => w.weatherCoverage === (["available", "partial"].includes(state) ? "available" : "unknown")));
  assert.ok(plan.candidateWindows.some((w: any) => w.weatherIntervals.length > 0));
  const compared = (await tools.get("compare_observing_options")!({ options: [input, { ...input, activity: "visual-stargazing" }], locale: "en", units: "metric" })).structuredContent;
  assert.deepEqual(compared.comparisons[0].evidence.weather, direct);
  assert.equal(compared.comparisons[0].factors.find((f: any) => /cloud and precipitation forecast/.test(f.name)).impact, ["available", "partial"].includes(state) ? "favorable" : "unknown");
  assert.ok(compared.comparisons[0].candidateWindows.every((w: any) => w.weatherCoverage === (["available", "partial"].includes(state) ? "available" : "unknown")));
});
test("legacy malformed empty source rejects while collection isolates the same malformed source", async () => {
  for (const source of [null, false, 0, "", {}]) {
    const raw = { status: "unavailable" as const, reason: "Synthetic unavailable", source } as any;
    const legacy = handlers({ weatherProvider: { getForecast: async () => raw } });
    await assert.rejects(() => legacy.get("get_night_conditions")!({ ...input, includeHourly: true }));
    const isolated = handlers({ weatherCollection: { getForecasts: async () => ({ outcomes: [{ providerId: "met", result: raw }, { providerId: "weatherapi", result: fixture("Independent source", 10) }] }) } });
    const result = (await isolated.get("get_night_conditions")!({ ...input, includeHourly: true })).structuredContent;
    assert.equal(result.providerOutcomes[0].status, "unavailable"); assert.equal(result.forecasts.length, 1); assert.equal(result.forecasts[0].source.name, "Independent source");
  }
});
test("legacy forecast identity remains authoritative over malformed empty-result metadata", async () => {
  const raw = { ...fixture("Authoritative source", 10), source: false } as any;
  const tools = handlers({ weatherProvider: { getForecast: async () => raw } });
  const result = (await tools.get("get_night_conditions")!({ ...input, includeHourly: true })).structuredContent;
  assert.equal(result.forecasts.length, 1); assert.equal(result.sources[0].name, "Authoritative source");
});
