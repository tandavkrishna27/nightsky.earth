import assert from "node:assert/strict";
import { once } from "node:events";
import { createServer } from "node:http";
import test from "node:test";
import express from "express";
import { mountMcpRoute, type McpRouteDependencies } from "../../server/mcp/route";
import { GeoNamesPlaceIndex } from "../../server/places/geonames";
import { UpstreamControls } from "../../server/providers/upstreamControls";
import { nightConditionsResultSchema } from "../../shared/nightsky/weather";

const window = { startUtc: "2026-10-15T18:00:00Z", endUtc: "2026-10-16T06:00:00Z", timeZone: "Europe/London" };
const args = { placeId: "place:v1:geonames:2643743", window };
const payload = { properties: {
  meta: { updated_at: "2026-10-15T12:00:00Z", units: { air_temperature: "˚C", wind_speed: "m/s", cloud_area_fraction: "%" } },
  timeseries: [{ time: "2026-10-15T22:00:00Z", data: { instant: { details: { air_temperature: 9, wind_speed: 3, cloud_area_fraction: 20 } } } }],
} };
const index = new GeoNamesPlaceIndex([{ geonameId: 2643743, name: "London", asciiName: "London", alternateNames: "", latitude: 51.5000123, longitude: -0.1200123, countryCode: "GB", countryName: "United Kingdom", featureClass: "P", featureCode: "PPLC", population: 8_000_000, timeZone: "Europe/London", modificationDate: "2026-10-01" }], "offline fixture");
function memoryCache() {
  const entries = new Map<string, { value: unknown; expiresAt: number }>();
  return {
    entries,
    get: async <T>(key: string) => entries.get(key) as { value: T; expiresAt: number } | undefined,
    set: async <T>(key: string, value: T, ttlMs: number) => { entries.set(key, { value, expiresAt: Date.now() + ttlMs }); },
    expire: () => entries.forEach(entry => { entry.expiresAt = Date.now() - 1; }),
  };
}
async function transport(dependencies: McpRouteDependencies, run: (call: (name?: string, argumentsValue?: unknown) => Promise<any>) => Promise<void>) {
  const app = express();
  app.use(express.json({ limit: "32kb" }));
  mountMcpRoute(app, { placeIndex: index, weatherUserAgent: "NightSky fixture https://example.test/contact", ...dependencies });
  const server = createServer(app);
  server.listen(0, "127.0.0.1");
  await once(server, "listening");
  const address = server.address();
  assert.ok(address && typeof address !== "string");
  let id = 0;
  const call = async (name = "get_night_conditions", argumentsValue: unknown = args) => {
    const response = await fetch(`http://127.0.0.1:${address.port}/mcp`, {
      method: "POST", headers: { "content-type": "application/json", accept: "application/json, text/event-stream", "mcp-protocol-version": "2025-11-25" },
      body: JSON.stringify({ jsonrpc: "2.0", id: ++id, method: "tools/call", params: { name, arguments: argumentsValue } }),
    });
    assert.equal(response.status, 200);
    const data = (await response.text()).split("\n").find(line => line.startsWith("data: "));
    assert.ok(data);
    const result = JSON.parse(data.slice(6)).result;
    assert.equal(result.isError, undefined, JSON.stringify(result));
    return result.structuredContent;
  };
  try { await run(call); } finally { server.close(); await once(server, "close"); }
}

test("MCP expiry, 304 and outage preserve source records and unknown fields", async () => {
  const cache = memoryCache();
  const validators: Array<string | null> = [];
  let calls = 0;
  const modified = "Thu, 15 Oct 2026 12:00:00 GMT";
  await transport({ cache, fetcher: async (url, init) => {
    calls++;
    assert.match(String(url), /lat=51\.5000&lon=-0\.1200/);
    validators.push(new Headers(init?.headers).get("If-Modified-Since"));
    if (calls === 1) return new Response(JSON.stringify(payload), { headers: { "Last-Modified": modified, Expires: new Date(Date.now() + 60000).toUTCString() } });
    if (calls === 2) return new Response(null, { status: 304, headers: { Expires: new Date(Date.now() + 60000).toUTCString() } });
    return new Response("", { status: 503 });
  } }, async call => {
    const first = nightConditionsResultSchema.parse(await call());
    const forecast = first.forecasts[0];
    assert.equal(forecast.source.issuedAt, "2026-10-15T12:00:00.000Z");
    assert.equal(forecast.samples[0].validAt, "2026-10-15T22:00:00.000Z");
    assert.equal(forecast.samples[0].values.windSpeed?.unit, "m/s");
    assert.equal(forecast.samples[0].values.dewPoint, undefined);
    assert.ok(forecast.missingFields.some(field => field.field === "dewPoint"));
    assert.ok(first.nightContext.forecastStepsDuringDarkness.length);
    await call(); assert.equal(calls, 1);
    cache.expire();
    const revalidated = nightConditionsResultSchema.parse(await call());
    assert.deepEqual(revalidated.forecasts[0].samples, forecast.samples);
    assert.equal(validators[1], modified);
    await call(); assert.equal(calls, 2);
    cache.expire();
    const stale = nightConditionsResultSchema.parse(await call());
    assert.equal(stale.forecasts[0].availability.status, "stale");
    assert.deepEqual(stale.forecasts[0].samples, forecast.samples);
    await call(); assert.equal(calls, 3, "cooldown suppresses another source request");
  });
});

test("MCP fresh replacement drops a validator belonging to old bytes", async () => {
  const cache = memoryCache();
  const validators: Array<string | null> = [];
  await transport({ cache, fetcher: async (_url, init) => {
    validators.push(new Headers(init?.headers).get("If-Modified-Since"));
    return new Response(JSON.stringify(payload), { headers: validators.length === 1 ? { "Last-Modified": "Thu, 15 Oct 2026 12:00:00 GMT" } : {} });
  } }, async call => {
    await call(); cache.expire();
    await call(); cache.expire();
    await call();
    assert.deepEqual(validators, [null, "Thu, 15 Oct 2026 12:00:00 GMT", null]);
  });
});

test("MCP cold provider outage returns unknown weather without exposing provider error details", async () => {
  let calls = 0;
  await transport({ cache: memoryCache(), fetcher: async () => { calls++; throw new Error("secret stack precise location"); } }, async call => {
    const result = nightConditionsResultSchema.parse(await call());
    assert.equal(result.forecasts.length, 0);
    assert.equal(result.availability.status, "unavailable");
    assert.doesNotMatch(JSON.stringify(result), /secret stack precise location/);
    await call(); assert.equal(calls, 1);
  });
});

test("MCP old issue times remain stale after successful 304 revalidation", async () => {
  const cache = memoryCache();
  const oldPayload = { properties: { ...payload.properties, meta: { ...payload.properties.meta, updated_at: "2026-10-10T12:00:00Z" } } };
  let calls = 0;
  await transport({ cache, fetcher: async () => {
    calls++;
    return calls === 1
      ? new Response(JSON.stringify(oldPayload), { headers: { "Last-Modified": "Sat, 10 Oct 2026 12:00:00 GMT" } })
      : new Response(null, { status: 304 });
  } }, async call => {
    assert.equal((await call()).forecasts[0].availability.status, "stale");
    cache.expire();
    const result = nightConditionsResultSchema.parse(await call());
    assert.equal(result.forecasts[0].availability.status, "stale");
    assert.equal(result.forecasts[0].source.issuedAt, "2026-10-10T12:00:00.000Z");
    assert.equal(calls, 2);
  });
});

test("MCP malformed upstream bytes never become a valid forecast or poison its cache", async () => {
  const cache = memoryCache();
  let calls = 0;
  await transport({ cache, fetcher: async () => {
    calls++;
    return new Response(calls === 1 ? "not JSON" : JSON.stringify(payload));
  } }, async call => {
    assert.equal((await call()).forecasts.length, 0);
    assert.equal(cache.entries.size, 0);
    assert.equal((await call()).forecasts.length, 1);
    assert.equal(calls, 2);
  });
});

test("MCP hard deadline retains abort-ignoring work within the upstream ceiling until settlement", { timeout: 3000 }, async () => {
  let release!: () => void;
  let starts = 0;
  let clock = 0;
  const controls = new UpstreamControls({ globalConcurrency: 1, now: () => clock });
  await transport({ cache: memoryCache(), upstreamControls: controls, providerTimeoutsMs: { met: 20 }, fetcher: async () => {
    starts++;
    if (starts === 1) await new Promise<void>(resolve => { release = resolve; });
    return new Response(JSON.stringify(payload));
  } }, async call => {
    const start = performance.now();
    assert.equal((await call()).forecasts.length, 0);
    assert.ok(performance.now() - start < 1500);
    clock = 60001;
    assert.equal((await call()).forecasts.length, 0);
    assert.equal(starts, 1, "timed out work still occupies bounded capacity");
    release(); await new Promise(resolve => setImmediate(resolve));
    assert.equal((await call()).forecasts.length, 1);
    assert.equal(starts, 2, "settlement restores capacity");
  });
});
