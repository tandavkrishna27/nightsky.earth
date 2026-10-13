import test from "node:test";
import assert from "node:assert/strict";
import { getNoaaAuroraOutlook, parseOvationAurora } from "../../../server/providers/aurora/noaaSwpc";

const fixture = {
  "Observation Time": "2026-10-11T08:57:00Z",
  "Forecast Time": "2026-10-11T09:46:00Z",
  "Data Format": "[Longitude, Latitude, Aurora]",
  coordinates: [[338, 64, 68], [339, 64, 25], [338, 65, 49], [159, -35, 4]],
  type: "MultiPoint",
};
const place = { placeId: "place:v1:geonames:3413829", latitude: 64.1466, longitude: -21.9426 };
const window = { startUtc: "2026-10-11T08:00:00Z", endUtc: "2026-10-11T10:30:00Z", timeZone: "Atlantic/Reykjavik" };

test("returns current outlook with geographic latitude context and nearest grid value", () => {
  const result = parseOvationAurora(fixture, place, window, "2026-10-11T09:00:00Z");
  assert.equal(result.latitudeBand, "high-latitude");
  assert.equal(result.outlook.status, "available");
  if (result.outlook.status === "available") {
    assert.equal(result.outlook.gridValue, 68);
    assert.equal(result.outlook.gridCellLatitude, 64);
    assert.equal(result.outlook.gridCellLongitude, -22);
    assert.equal(result.outlook.probability, undefined);
  }
});

test("marks old observation data stale", () => {
  const result = parseOvationAurora(fixture, place, window, "2026-10-11T12:00:00Z");
  assert.equal(result.outlook.status, "available");
  assert.equal(result.availability.status, "stale");
});

test("reports geographic latitude context without treating low latitude as impossible", () => {
  const lowLatitudePlace = { ...place, latitude: 24.2, longitude: 121.0 };
  const result = parseOvationAurora({ ...fixture, coordinates: [[121, 24, 0]] }, lowLatitudePlace, window, "2026-10-11T09:00:00Z");
  assert.equal(result.latitudeBand, "equatorial");
  assert.equal(result.outlook.status, "available");
  if (result.outlook.status === "available") assert.match(result.outlook.summary, /does not prove aurora is impossible/i);
});

test("returns unavailable on provider timeout", async () => {
  const result = await getNoaaAuroraOutlook(place, window, { fetcher: async () => { throw new DOMException("timeout", "AbortError"); } });
  assert.equal(result.outlook.status, "unavailable");
});

test("caches NOAA's global grid so repeat place lookups do not redownload it", async () => {
  const cache = new Map<string, { value: unknown; expiresAt: number }>();
  const sharedCache = {
    async get<T>(key: string) { return cache.get(key) as { value: T; expiresAt: number } | undefined; },
    async set<T>(key: string, value: T, ttlMs: number) { cache.set(key, { value, expiresAt: Date.parse("2026-10-11T09:00:00Z") + ttlMs }); },
  };
  let fetchCount = 0;
  const options = { now: () => Date.parse("2026-10-11T09:00:00Z"), cache: sharedCache, fetcher: async () => { fetchCount += 1; return new Response(JSON.stringify(fixture), { status: 200 }); } };
  await getNoaaAuroraOutlook(place, window, options);
  await getNoaaAuroraOutlook({ ...place, latitude: 64.5 }, window, options);
  assert.equal(fetchCount, 1);
});

test("returns out of horizon for a request beyond the short forecast window", () => {
  const laterWindow = { ...window, startUtc: "2026-10-11T20:00:00Z", endUtc: "2026-10-11T21:00:00Z" };
  const result = parseOvationAurora(fixture, place, laterWindow, "2026-10-11T09:00:00Z");
  assert.equal(result.outlook.status, "out-of-horizon");
  assert.equal(result.availability.status, "out-of-horizon");
});
