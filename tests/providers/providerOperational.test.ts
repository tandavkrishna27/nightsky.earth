import assert from "node:assert/strict";
import test from "node:test";
import { getNoaaAuroraOutlook } from "../../server/providers/aurora/noaaSwpc";
import { getMetNorwayForecast } from "../../server/providers/weather/metNorway";
import { UpstreamControls } from "../../server/providers/upstreamControls";
const now = () => Date.parse("2026-10-11T00:01:00Z");
const place = {
  placeId: "place:v1:geonames:1259229",
  latitude: 60,
  longitude: 0,
};
const window = {
  startUtc: "2026-10-11T00:00:00Z",
  endUtc: "2026-10-11T01:00:00Z",
  timeZone: "UTC",
};
const payload = {
  "Observation Time": "2026-10-11T00:00:00Z",
  "Forecast Time": "2026-10-11T00:30:00Z",
  "Data Format": "[Longitude, Latitude, Aurora]",
  type: "MultiPoint",
  coordinates: [
    [0, 60, 15],
    [0, 30, 1],
  ],
};
const noCache = {
  get: async <T>() => undefined,
  set: async <T>(_key: string, _value: T, _ttl: number) => {},
};
test("NOAA cold cache coalesces global bytes and renders each place separately", async () => {
  let calls = 0;
  let release!: () => void;
  const controls = new UpstreamControls();
  const fetcher = (async () => {
    calls++;
    await new Promise<void>((r) => (release = r));
    return new Response(JSON.stringify(payload));
  }) as typeof fetch;
  const options = { now, cache: noCache, fetcher, controls };
  const first = getNoaaAuroraOutlook(place, window, options);
  const second = getNoaaAuroraOutlook(
    { ...place, latitude: 30 },
    window,
    options,
  );
  await new Promise((r) => setImmediate(r));
  release();
  const [a, b] = await Promise.all([first, second]);
  assert.equal(calls, 1);
  assert.equal(a.outlook.gridValue, 15);
  assert.equal(b.outlook.gridValue, 1);
});
test("NOAA expired cache is labeled stale during throttling and cooldown", async () => {
  let calls = 0;
  const controls = new UpstreamControls({ now });
  const cache = {
    ...noCache,
    get: async <T>() => ({ value: payload as T, expiresAt: now() - 1 }),
  };
  const options = {
    cache,
    controls,
    now,
    fetcher: (async () => {
      calls++;
      return new Response("", {
        status: 429,
        headers: { "Retry-After": "120" },
      });
    }) as typeof fetch,
  };
  const a = await getNoaaAuroraOutlook(place, window, options);
  const b = await getNoaaAuroraOutlook(place, window, options);
  assert.equal(a.availability.status, "stale");
  assert.equal(b.availability.status, "stale");
  assert.equal(calls, 1);
});
test("MET deadline includes injected limiter that never settles", async () => {
  const result = await getMetNorwayForecast(place, window, {
    userAgent: "NightSky.earth https://nightsky.earth",
    cache: noCache,
    controls: new UpstreamControls(),
    now,
    timeoutMs: 10,
    rateLimiter: { acquire: () => new Promise(() => {}) },
    fetcher: async () => {
      throw new Error("must not reach transport");
    },
  });
  assert.equal(result.status, "unavailable");
  assert.match(result.reason, /timed out/);
});
test("MET does not dispatch after delayed supplementary admission exceeds deadline", async () => {
  let release!: () => void;
  let calls = 0;
  const result = await getMetNorwayForecast(place, window, {
    userAgent: "NightSky.earth https://nightsky.earth",
    cache: noCache,
    controls: new UpstreamControls(),
    now,
    timeoutMs: 10,
    rateLimiter: { acquire: () => new Promise<void>((r) => (release = r)) },
    fetcher: async () => {
      calls++;
      return new Response("{}");
    },
  });
  assert.equal(result.status, "unavailable");
  release();
  await new Promise((r) => setImmediate(r));
  assert.equal(calls, 0);
});
