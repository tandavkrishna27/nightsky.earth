import test from "node:test";
import assert from "node:assert/strict";
import { getMetNorwayForecast, parseLocationForecast } from "../../../server/providers/weather/metNorway";
import { weatherForecastSchema } from "../../../shared/nightsky/weather";

const fixture = {
  type: "Feature",
  properties: { meta: { updated_at: "2026-10-11T00:00:00.000Z", units: { air_temperature: "˚C", cloud_area_fraction: "%", wind_speed: "m/s", dew_point_temperature: "˚C" } } },
  geometry: { type: "Point", coordinates: [73.8567, 18.5204, 560] },
  properties2: {},
  properties: {
    meta: { updated_at: "2026-10-11T00:00:00.000Z", units: { air_temperature: "˚C", cloud_area_fraction: "%", wind_speed: "m/s", dew_point_temperature: "˚C", wind_from_direction: "degrees", relative_humidity: "%", precipitation_amount: "mm" } },
    timeseries: [
      { time: "2026-10-11T01:00:00.000Z", data: { instant: { details: { air_temperature: 12.5, cloud_area_fraction: 35, cloud_area_fraction_low: 10, wind_speed: 2, wind_from_direction: 180, relative_humidity: 70 } }, next_1_hours: { details: { precipitation_amount: 0.2, probability_of_precipitation: 10 } } } },
      { time: "2026-10-11T02:00:00Z", data: { instant: { details: { air_temperature: 12, cloud_area_fraction: 40, wind_speed: 3 } } } },
    ],
  },
};
const place = { placeId: "place:v1:geonames:1259229", latitude: 18.520432, longitude: 73.856789 };
const window = { startUtc: "2026-10-11T00:30:00Z", endUtc: "2026-10-11T03:00:00Z", timeZone: "Asia/Kolkata" };
const headers = { get: (name: string) => ({ "last-modified": "Sun, 11 Oct 2026 00:00:00 GMT", expires: "Sun, 11 Oct 2026 00:15:00 GMT" }[name.toLowerCase()] ?? null) };

test("maps MET cloud and wind fields with source units and provenance", () => {
  const result = parseLocationForecast(fixture, place, window, { lastModified: "Sun, 11 Oct 2026 00:00:00 GMT", checkedAt: "2026-10-11T00:01:00Z" });
  assert.ok(result.forecast);
  const parsed = weatherForecastSchema.parse(result.forecast);
  assert.equal(parsed.source.issuedAt, "2026-10-11T00:00:00.000Z");
  assert.equal(parsed.samples[0]?.values.totalCloudCover?.value, 35);
  assert.equal(parsed.samples[0]?.values.windSpeed?.unit, "m/s");
  assert.equal(parsed.samples[0]?.values.precipitationProbability?.value, 10);
});

test("keeps fields absent when MET has no value and never invents dew point", () => {
  const result = parseLocationForecast(fixture, place, window, { checkedAt: "2026-10-11T00:01:00Z" });
  assert.equal(result.forecast?.samples[1]?.values.dewPoint, undefined);
  assert.ok(result.forecast?.missingFields.some(({ field }) => field === "dewPoint"));
});

test("preserves provider issue and valid timestamps", () => {
  const result = parseLocationForecast(fixture, place, window, { checkedAt: "2026-10-11T00:01:00Z" });
  assert.equal(result.forecast?.samples[0]?.validAt, "2026-10-11T01:00:00.000Z");
  assert.equal(result.forecast?.source.issuedAt, "2026-10-11T00:00:00.000Z");
});

test("rounds coordinates before request and sends required identifying User-Agent", async () => {
  let requested = "";
  let sentAgent = "";
  const result = await getMetNorwayForecast(place, window, {
    userAgent: "NightSky.earth https://nightsky.earth/contact",
    now: () => Date.parse("2026-10-11T00:01:00Z"),
    fetcher: async (input, init) => {
      requested = String(input);
      sentAgent = new Headers(init?.headers).get("User-Agent") ?? "";
      return new Response(JSON.stringify(fixture), { status: 200, headers: { "Last-Modified": "Sun, 11 Oct 2026 00:00:00 GMT", Expires: "Sun, 11 Oct 2026 00:15:00 GMT" } });
    },
  });
  assert.match(requested, /lat=18\.5204/);
  assert.match(requested, /lon=73\.8567/);
  assert.equal(sentAgent, "NightSky.earth https://nightsky.earth/contact");
  assert.equal(result.status, "partial");
});

test("returns unavailable for provider errors and refuses malformed payloads", async () => {
  const throttled = await getMetNorwayForecast(place, window, { userAgent: "NightSky.earth https://nightsky.earth/contact", fetcher: async () => new Response("", { status: 429 }) });
  assert.equal(throttled.status, "stale");
  const timedOut = await getMetNorwayForecast({ ...place, latitude: 18.5301 }, window, { userAgent: "NightSky.earth https://nightsky.earth/contact", fetcher: async () => { throw new DOMException("timeout", "AbortError"); } });
  assert.match(timedOut.reason, /timed out/i);
  await assert.rejects(() => getMetNorwayForecast({ ...place, latitude: 18.5302 }, window, { userAgent: "NightSky.earth https://nightsky.earth/contact", fetcher: async () => new Response("{}", { status: 200 }) }), /Malformed MET/);
});

test("warns when MET marks the product deprecated with HTTP 203", async () => {
  const result = await getMetNorwayForecast({ ...place, latitude: 18.5311 }, window, {
    userAgent: "NightSky.earth https://nightsky.earth/contact",
    now: () => Date.parse("2026-10-11T00:01:00Z"),
    fetcher: async () => new Response(JSON.stringify(fixture), { status: 203, headers: { Expires: "Sun, 11 Oct 2026 00:15:00 GMT" } }),
  });
  assert.match(result.deprecationWarning ?? "", /deprecated/i);
  assert.ok(result.forecast);
});

test("uses stored Last-Modified for conditional fetch after provider expiry", async () => {
  const uniquePlace = { ...place, latitude: 18.5322 };
  const modified = "Sun, 11 Oct 2026 00:00:00 GMT";
  let conditionalHeader: string | null = null;
  await getMetNorwayForecast(uniquePlace, window, {
    userAgent: "NightSky.earth https://nightsky.earth/contact",
    now: () => Date.parse("2026-10-11T00:01:00Z"),
    fetcher: async () => new Response(JSON.stringify(fixture), { status: 200, headers: { "Last-Modified": modified, Expires: "Sun, 11 Oct 2026 00:02:00 GMT" } }),
  });
  const refreshed = await getMetNorwayForecast(uniquePlace, window, {
    userAgent: "NightSky.earth https://nightsky.earth/contact",
    now: () => Date.parse("2026-10-11T00:03:00Z"),
    fetcher: async (_input, init) => {
      conditionalHeader = new Headers(init?.headers).get("If-Modified-Since");
      return new Response(null, { status: 304, headers: { Expires: "Sun, 11 Oct 2026 00:15:00 GMT" } });
    },
  });
  assert.equal(conditionalHeader, modified);
  assert.ok(refreshed.forecast);
});

test("requires a real application identity in User-Agent", async () => {
  await assert.rejects(() => getMetNorwayForecast(place, window, { userAgent: "NightSky test" }), /identifying User-Agent/);
});

test("returns cached forecast as stale when MET throttles refresh", async () => {
  const uniquePlace = { ...place, latitude: 18.5333 };
  await getMetNorwayForecast(uniquePlace, window, {
    userAgent: "NightSky.earth https://nightsky.earth/contact",
    now: () => Date.parse("2026-10-11T00:01:00Z"),
    fetcher: async () => new Response(JSON.stringify(fixture), { status: 200, headers: { "Last-Modified": "Sun, 11 Oct 2026 00:00:00 GMT", Expires: "Sun, 11 Oct 2026 00:02:00 GMT" } }),
  });
  const fallback = await getMetNorwayForecast(uniquePlace, window, {
    userAgent: "NightSky.earth https://nightsky.earth/contact",
    now: () => Date.parse("2026-10-11T00:03:00Z"),
    fetcher: async () => new Response("", { status: 429 }),
  });
  assert.equal(fallback.status, "stale");
  assert.equal(fallback.forecast?.availability.status, "stale");
});

test("uses injected shared cache and application rate limiter", async () => {
  const cache = new Map<string, { value: unknown; expiresAt: number }>();
  const sharedCache = {
    async get<T>(key: string) { return cache.get(key) as { value: T; expiresAt: number } | undefined; },
    async set<T>(key: string, value: T, ttlMs: number) { cache.set(key, { value, expiresAt: Date.parse("2026-10-11T00:01:00Z") + ttlMs }); },
  };
  let limited = 0;
  let fetched = 0;
  const args = {
    userAgent: "NightSky.earth https://nightsky.earth/contact",
    now: () => Date.parse("2026-10-11T00:01:00Z"),
    cache: sharedCache,
    rateLimiter: { async acquire() { limited += 1; } },
    fetcher: async () => { fetched += 1; return new Response(JSON.stringify(fixture), { status: 200, headers: { Expires: "Sun, 11 Oct 2026 00:15:00 GMT" } }); },
  };
  const uniquePlace = { ...place, latitude: 18.5344 };
  await getMetNorwayForecast(uniquePlace, window, args);
  await getMetNorwayForecast(uniquePlace, window, args);
  assert.equal(fetched, 1);
  assert.equal(limited, 1);
});

test("marks forecasts beyond available valid times out of horizon", () => {
  const farWindow = { ...window, startUtc: "2026-10-30T00:00:00Z", endUtc: "2026-10-30T02:00:00Z" };
  const result = parseLocationForecast(fixture, place, farWindow, { checkedAt: "2026-10-11T00:01:00Z" });
  assert.equal(result.status, "out-of-horizon");
  assert.equal(result.forecast, undefined);
});








 test("304 refresh preserves payload, adopts response validator and honors renewed expiry", async () => {
  let now = Date.parse("2026-10-11T00:01:00Z");
  const entries = new Map<string, {value: any; expiresAt: number}>();
  const cache = {
    async get<T>(key: string) { return entries.get(key) as {value: T; expiresAt: number} | undefined; },
    async set<T>(key: string, value: T, ttlMs: number) { entries.set(key, {value, expiresAt: now + ttlMs}); },
  };
  const validators: (string | null)[] = [];
  const oldModified = "Sun, 11 Oct 2026 00:00:00 GMT";
  const newModified = "Sun, 11 Oct 2026 00:00:01 GMT";
  let calls = 0;
  const args = { userAgent: "NightSky.earth https://nightsky.earth/contact", cache, now: () => now,
    fetcher: async (_input: any, init: any) => {
      validators.push(new Headers(init?.headers).get("If-Modified-Since"));
      calls++;
      return calls === 1
        ? new Response(JSON.stringify(fixture), {status: 200, headers: {"Last-Modified": oldModified, Expires: "Sun, 11 Oct 2026 00:02:00 GMT"}})
        : new Response(null, {status: 304, headers: {"Last-Modified": newModified, Expires: "Sun, 11 Oct 2026 00:04:00 GMT"}});
    },
  };
  await getMetNorwayForecast({...place, latitude: 18.5444}, window, args);
  await getMetNorwayForecast({...place, latitude: 18.5444}, window, args);
  assert.equal(calls, 1);
  now = Date.parse("2026-10-11T00:02:00Z");
  const refreshed = await getMetNorwayForecast({...place, latitude: 18.5444}, window, args);
  assert.ok(refreshed.forecast);
  assert.equal(validators[1], oldModified);
  assert.equal([...entries.values()][0].value.lastModified, newModified);
  now = Date.parse("2026-10-11T00:03:00Z");
  await getMetNorwayForecast({...place, latitude: 18.5444}, window, args);
  assert.equal(calls, 2);
 });
