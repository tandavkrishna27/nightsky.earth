import { UpstreamControls } from "../../server/providers/upstreamControls";
import assert from "node:assert/strict";
import test from "node:test";
import { getMetNorwayForecast, MET_MEMORY_CACHE_MAX_ENTRIES } from "../../server/providers/weather/metNorway";
import { getNoaaAuroraOutlook } from "../../server/providers/aurora/noaaSwpc";

const place = { placeId: "place:v1:geonames:1259229", latitude: 40.101123, longitude: 70.98765 };
const window = { startUtc: "2026-10-11T00:00:00Z", endUtc: "2026-10-11T03:00:00Z", timeZone: "UTC" };
const now = () => Date.parse("2026-10-11T00:01:00Z");
const payload = { properties: {
  meta: { updated_at: "2026-10-11T00:00:00Z" },
  timeseries: [{ time: "2026-10-11T01:00:00Z", data: { instant: { details: { air_temperature: 12 } } } }],
} };
const noCache = { get: async <T>() => undefined, set: async <T>(_key: string, _value: T, _ttl: number) => {} };
const rateLimiter = { acquire: async () => {} };
const userAgent = "NightSky.earth https://nightsky.earth/contact";

function hangingBodyFetcher(): { fetcher: typeof fetch; signal: () => AbortSignal | undefined } {
  let signal: AbortSignal | undefined;
  return {
    signal: () => signal,
    fetcher: async (_url, init) => {
      signal = init?.signal ?? undefined;
      // Headers arrive immediately. The injected adapter deliberately ignores abort
      // while reading the body, so the caller must also enforce its own deadline.
      return { ok: true, status: 200, headers: new Headers(), json: () => new Promise(() => {}) } as unknown as Response;
    },
  };
}

test("MET deadline includes a hanging JSON body and returns unavailable", { timeout: 2000 }, async () => {
  const hanging = hangingBodyFetcher();
  const result = await getMetNorwayForecast(place, window, { userAgent, now, cache: noCache, rateLimiter, fetcher: hanging.fetcher, timeoutMs: 20 });
  assert.equal(result.status, "unavailable");
  assert.match(result.reason, /timed out/);
  assert.equal(hanging.signal()?.aborted, true);
});

test("MET hanging body preserves an expired cached forecast as stale", { timeout: 2000 }, async () => {
  const hanging = hangingBodyFetcher();
  const cache = { ...noCache, get: async <T>() => ({ value: { payload } as T, expiresAt: now() - 1 }) };
  const result = await getMetNorwayForecast(place, window, { userAgent, now, cache, rateLimiter, fetcher: hanging.fetcher, timeoutMs: 20 });
  assert.equal(result.status, "stale");
  assert.equal(result.forecast?.availability.status, "stale");
  assert.match(result.reason, /timed out/);
});

test("NOAA deadline includes a hanging JSON body", { timeout: 2000 }, async () => {
  const hanging = hangingBodyFetcher();
  const result = await getNoaaAuroraOutlook(place, window, { now, cache: noCache, fetcher: hanging.fetcher, timeoutMs: 20 });
  assert.equal(result.availability.status, "unavailable");
  assert.match(result.availability.reason, /timed out/);
  assert.equal(hanging.signal()?.aborted, true);
});

test("MET deadline bounds a never-resolving fetch that ignores abort", { timeout: 2000 }, async () => {
  let signal: AbortSignal | undefined;
  const result = await getMetNorwayForecast(place, window, {
    userAgent, now, cache: noCache, rateLimiter, timeoutMs: 20,
    fetcher: async (_url, init) => { signal = init?.signal ?? undefined; return new Promise<Response>(() => {}); },
  });
  assert.equal(result.status, "unavailable");
  assert.match(result.reason, /timed out/);
  assert.equal(signal?.aborted, true);
});

test("NOAA deadline bounds a never-resolving fetch that ignores abort", { timeout: 2000 }, async () => {
  let signal: AbortSignal | undefined;
  const result = await getNoaaAuroraOutlook(place, window, {
    now, cache: noCache, timeoutMs: 20,
    fetcher: async (_url, init) => { signal = init?.signal ?? undefined; return new Promise<Response>(() => {}); },
  });
  assert.equal(result.availability.status, "unavailable");
  assert.match(result.availability.reason, /timed out/);
  assert.equal(signal?.aborted, true);
});

test("MET fallback cache evicts old coordinates at its entry ceiling and retains recent hits", async () => {
  let calls = 0;
  let admissionClock = 0;
  const controls = new UpstreamControls({ now: () => admissionClock += 100 });
  const options = { userAgent, now, rateLimiter, controls, fetcher: (async () => {
    calls++;
    return new Response(JSON.stringify(payload), { headers: { Expires: "Sun, 11 Oct 2026 00:15:00 GMT" } });
  }) as typeof fetch };
  await getMetNorwayForecast(place, window, options);
  await getMetNorwayForecast(place, window, options);
  assert.equal(calls, 1, "warm coordinates reuse cached payload");
  for (let index = 0; index < MET_MEMORY_CACHE_MAX_ENTRIES; index++) {
    await getMetNorwayForecast({ ...place, latitude: 50 + index / 1000 }, window, options);
  }
  const before = calls;
  await getMetNorwayForecast({ ...place, latitude: 50 + (MET_MEMORY_CACHE_MAX_ENTRIES - 1) / 1000 }, window, options);
  assert.equal(calls, before, "most recent entry remains cached");
  await getMetNorwayForecast(place, window, options);
  assert.equal(calls, before + 1, "oldest entry is evicted, bounding memory entry count");
});
