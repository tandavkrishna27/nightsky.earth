import assert from "node:assert/strict";
import test from "node:test";
import { createWeatherCollection } from "../../server/providers/weather/collection";
const place = { placeId: "place:v1:test", latitude: 12, longitude: 34 };
const window = { startUtc: "2026-10-17T18:00:00Z", endUtc: "2026-10-18T06:00:00Z", timeZone: "UTC" };
test("bounded collection retains deterministic outcomes, failures, disabled sources and selected point", async () => {
  let active = 0, peak = 0;
  const provider = { getForecast: async (p: typeof place, w: typeof window) => { assert.deepEqual(p, place); assert.deepEqual(w, window); peak = Math.max(peak, ++active); await new Promise(resolve => setTimeout(resolve, 5)); active--; return { status: "out-of-horizon" as const, reason: "Synthetic horizon." }; } };
  const result = await createWeatherCollection([{ id: "met", enabled: true, provider }, { id: "weatherapi", enabled: true, provider }, { id: "openweather", enabled: false, provider }], { deadlineMs: 100 }).getForecasts(place, window);
  assert.equal(peak, 2); assert.deepEqual(result.outcomes.map(o => o.providerId), ["met", "weatherapi", "openweather"]); assert.equal(result.outcomes[0].result.status, "out-of-horizon"); assert.equal(result.outcomes[2].result.status, "unavailable");
});
test("deadline returns stalled and queued sources safely and ignores late completion", async () => {
  const provider = { getForecast: () => new Promise<never>(() => {}) };
  const result = await createWeatherCollection([{ id: "met", enabled: true, provider }, { id: "weatherapi", enabled: true, provider }, { id: "openweather", enabled: true, provider }], { deadlineMs: 15 }).getForecasts(place, window);
  assert.equal(result.outcomes.length, 3); assert.ok(result.outcomes.every(o => o.result.status === "unavailable"));
});
test("invalid injected result and exceptions are isolated without exposing raw diagnostics", async () => {
  const result = await createWeatherCollection([{ id: "met", enabled: true, provider: { getForecast: async () => { throw Error("secret"); } } }, { id: "weatherapi", enabled: true, provider: { getForecast: async () => ({ status: "available", reason: "secret", forecast: {} }) as any } }], { deadlineMs: 100 }).getForecasts(place, window);
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
