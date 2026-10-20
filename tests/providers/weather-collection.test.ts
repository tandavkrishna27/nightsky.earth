import assert from "node:assert/strict";
import test from "node:test";
import { createWeatherCollection } from "../../server/providers/weather/collection";
const place = { placeId: "place:v1:test", latitude: 12, longitude: 34 };
const window = { startUtc: "2026-10-17T18:00:00Z", endUtc: "2026-10-18T06:00:00Z", timeZone: "UTC" };
const useful = (name: string) => ({ status: "partial" as const, reason: "Synthetic partial coverage", forecast: { availability: { status: "partial" as const, reason: "Synthetic partial coverage" }, source: { name, url: "https://example.test/forecast", attribution: "Synthetic test data", dataClass: "forecast" as const }, forecastHorizonHours: 24, samples: [{ validAt: "2026-10-17T20:00:00Z", values: { totalCloudCover: { value: 25, unit: "%" } } }], missingFields: [] } });

test("default selection stops after one useful partial source", async () => {
  const called: string[] = [];
  const collection = createWeatherCollection((["met", "weatherapi", "openweather"] as const).map(id => ({ id, enabled: true, provider: { getForecast: async () => { called.push(id); return useful(id); } } })), { deadlineMs: 100 });
  const result = await collection.getForecasts(place, window);
  assert.deepEqual(called, ["met"]);
  assert.deepEqual(result.outcomes.map(o => o.providerId), ["met"]);
});

test("default selection falls back once when the first source has no usable window sample", async () => {
  const called: string[] = [];
  const collection = createWeatherCollection((["met", "weatherapi", "openweather"] as const).map(id => ({ id, enabled: true, provider: { getForecast: async () => { called.push(id); return id === "met" ? { status: "out-of-horizon" as const, reason: "Synthetic horizon" } : useful(id); } } })), { deadlineMs: 100 });
  const result = await collection.getForecasts(place, window);
  assert.deepEqual(called, ["met", "weatherapi"]);
  assert.deepEqual(result.outcomes.map(o => o.providerId), ["met", "weatherapi"]);
});

test("default selection reports a started fallback when its deadline expires", async () => {
  const called: string[] = [];
  const stalled = new Promise<never>(() => {});
  const collection = createWeatherCollection([
    { id: "met", enabled: true, provider: { getForecast: async () => { called.push("met"); return { status: "out-of-horizon" as const, reason: "No relevant sample" }; } } },
    { id: "weatherapi", enabled: true, provider: { getForecast: () => { called.push("weatherapi"); return stalled; } } },
    { id: "openweather", enabled: true, provider: { getForecast: async () => { called.push("openweather"); return useful("openweather"); } } },
  ], { deadlineMs: 5 });
  const result = await collection.getForecasts(place, window);
  assert.deepEqual(called, ["met", "weatherapi"]);
  assert.deepEqual(result.outcomes.map(o => o.providerId), ["met", "weatherapi"]);
  assert.equal(result.outcomes[1].result.status, "unavailable");
});

test("explicit comparison uses two sources and all mode uses every enabled source", async () => {
  const called: string[] = [];
  const collection = createWeatherCollection((["met", "weatherapi", "openweather"] as const).map(id => ({ id, enabled: true, provider: { getForecast: async () => { called.push(id); return useful(id); } } })), { deadlineMs: 100 });
  const compared = await collection.getForecasts(place, window, { mode: "compare" });
  assert.deepEqual(compared.outcomes.map(o => o.providerId), ["met", "weatherapi"]);
  assert.deepEqual(called.sort(), ["met", "weatherapi"]);
  called.length = 0;
  const all = await collection.getForecasts(place, window, { mode: "all" });
  assert.deepEqual(all.outcomes.map(o => o.providerId), ["met", "weatherapi", "openweather"]);
  assert.deepEqual(called.sort(), ["met", "openweather", "weatherapi"]);
});
test("exclusion prevents OpenWeather calls and output even in all mode", async () => {
  const called: string[] = [];
  const collection = createWeatherCollection((["met", "weatherapi", "openweather"] as const).map(id => ({ id, enabled: true, provider: { getForecast: async () => { called.push(id); return useful(id); } } })), { deadlineMs: 100 });
  const result = await collection.getForecasts(place, window, { mode: "all", excludedProviderIds: ["openweather"] });
  assert.deepEqual(called.sort(), ["met", "weatherapi"]);
  assert.deepEqual(result.outcomes.map(o => o.providerId), ["met", "weatherapi"]);
  await assert.rejects(() => collection.getForecasts(place, window, { mode: "all", excludedProviderIds: ["unknown" as any] }), /excluded weather provider/i);
});
test("bounded collection retains deterministic outcomes, failures, disabled sources and selected point", async () => {
  let active = 0, peak = 0;
  const provider = { getForecast: async (p: typeof place, w: typeof window) => { assert.deepEqual(p, place); assert.deepEqual(w, window); peak = Math.max(peak, ++active); await new Promise(resolve => setTimeout(resolve, 5)); active--; return { status: "out-of-horizon" as const, reason: "Synthetic horizon." }; } };
  const result = await createWeatherCollection([{ id: "met", enabled: true, provider }, { id: "weatherapi", enabled: true, provider }, { id: "openweather", enabled: false, provider }], { deadlineMs: 100 }).getForecasts(place, window, { mode: "all" });
  assert.equal(peak, 2); assert.deepEqual(result.outcomes.map(o => o.providerId), ["met", "weatherapi", "openweather"]); assert.equal(result.outcomes[0].result.status, "out-of-horizon"); assert.equal(result.outcomes[2].result.status, "unavailable");
});
test("deadline returns stalled and queued sources safely and ignores late completion", async () => {
  const provider = { getForecast: () => new Promise<never>(() => {}) };
  const result = await createWeatherCollection([{ id: "met", enabled: true, provider }, { id: "weatherapi", enabled: true, provider }, { id: "openweather", enabled: true, provider }], { deadlineMs: 15 }).getForecasts(place, window, { mode: "all" });
  assert.equal(result.outcomes.length, 3); assert.ok(result.outcomes.every(o => o.result.status === "unavailable"));
});
test("invalid injected result and exceptions are isolated without exposing raw diagnostics", async () => {
  const result = await createWeatherCollection([{ id: "met", enabled: true, provider: { getForecast: async () => { throw Error("secret"); } } }, { id: "weatherapi", enabled: true, provider: { getForecast: async () => ({ status: "available", reason: "secret", forecast: {} }) as any } }], { deadlineMs: 100 }).getForecasts(place, window, { mode: "all" });
  assert.ok(result.outcomes.every(o => o.result.status === "unavailable")); assert.ok(!JSON.stringify(result).includes("secret"));
});
test("reject duplicate and unknown registry entries and invalid deadline", () => {
  const entry = { id: "met" as const, enabled: false, provider: { getForecast: async () => ({ status: "unavailable" as const, reason: "Disabled" }) } };
  assert.throws(() => createWeatherCollection([entry, entry], { deadlineMs: 100 }));
  assert.throws(() => createWeatherCollection([{ ...entry, id: "unknown" } as any], { deadlineMs: 100 }));
  assert.throws(() => createWeatherCollection([], { deadlineMs: 0 }));
});
test("successful snapshots are immutable after a stalled source completes late", async () => {
  let release!: (result: any) => void;
  const late = new Promise<any>(resolve => { release = resolve; });
  const result = await createWeatherCollection([{ id: "met", enabled: true, provider: { getForecast: () => late } }], { deadlineMs: 5 }).getForecasts(place, window);
  const snapshot = JSON.stringify(result); release({ status: "out-of-horizon", reason: "Late result" }); await new Promise(resolve => setTimeout(resolve, 2)); assert.equal(JSON.stringify(result), snapshot);
});
