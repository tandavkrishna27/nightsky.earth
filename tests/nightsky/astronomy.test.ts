import test from "node:test";
import assert from "node:assert/strict";
import { astronomyWindowResultSchema, targetVisibilityResultSchema } from "../../shared/nightsky/astronomy";
import { GeoNamesPlaceIndex } from "../../server/places/geonames";
import { getAstronomyWindow, getTargetVisibility } from "../../server/nightsky/astronomy";
import { formatLocalTime } from "../../server/nightsky/time";

const index = new GeoNamesPlaceIndex([
  { geonameId: 1, name: "Quito", asciiName: "Quito", alternateNames: "", latitude: -0.18, longitude: -78.47, countryCode: "EC", countryName: "Ecuador", featureClass: "P", featureCode: "PPLC", population: 1000, timeZone: "America/Guayaquil", modificationDate: "2026-01-01" },
  { geonameId: 2, name: "Tromso", asciiName: "Tromso", alternateNames: "", latitude: 69.65, longitude: 18.96, countryCode: "NO", countryName: "Norway", featureClass: "P", featureCode: "PPLC", population: 1000, timeZone: "Europe/Oslo", modificationDate: "2026-01-01" },
  { geonameId: 3, name: "Ushuaia", asciiName: "Ushuaia", alternateNames: "", latitude: -54.8, longitude: -68.3, countryCode: "AR", countryName: "Argentina", featureClass: "P", featureCode: "PPLC", population: 1000, timeZone: "America/Argentina/Ushuaia", modificationDate: "2026-01-01" },
  { geonameId: 5, name: "Madrid", asciiName: "Madrid", alternateNames: "", latitude: 40.42, longitude: -3.70, countryCode: "ES", countryName: "Spain", featureClass: "P", featureCode: "PPLC", population: 1000, timeZone: "Europe/Madrid", modificationDate: "2026-01-01" },
  { geonameId: 7, name: "Hanle", asciiName: "Hanle", alternateNames: "", latitude: 32.7794, longitude: 78.9642, countryCode: "IN", countryName: "India", featureClass: "P", featureCode: "PPL", population: 1000, timeZone: "Asia/Kolkata", modificationDate: "2026-01-01" },
  { geonameId: 6, name: "South Pole", asciiName: "South Pole", alternateNames: "", latitude: -90, longitude: 0, countryCode: "AQ", countryName: "Antarctica", featureClass: "P", featureCode: "PPLC", population: 1000, timeZone: "Antarctica/McMurdo", modificationDate: "2026-01-01" },
], "fixture-v1");

const place = (id: number) => ({ placeId: `place:v1:geonames:${id}`, timeZone: index.getById(id)!.timeZone });
const window = (startUtc: string, endUtc: string, timeZone: string) => ({ startUtc, endUtc, timeZone });

test("calculatesTwilightAtEquatorialSite", async () => {
  const result = await getAstronomyWindow(place(1), window("2026-06-01T00:00:00Z", "2026-06-02T00:00:00Z", "America/Guayaquil"), index);
  assert.equal(result.darknessState, "partial-window");
  assert.ok(result.solarThresholdIntervals.some((row) => row.kind === "astronomical"));
  assert.equal(astronomyWindowResultSchema.safeParse(result).success, true);
});

test("calculatesTwilightAtMidLatitude", async () => {
  const result = await getAstronomyWindow(place(5), window("2026-06-01T00:00:00Z", "2026-06-02T00:00:00Z", "Europe/Madrid"), index);
  assert.equal(result.darknessState, "partial-window");
  assert.ok(result.solarThresholdIntervals.length > 0);
  assert.ok(result.solarThresholdIntervals.every((interval) => Date.parse(interval.endUtc) > Date.parse(interval.startUtc)));
  assert.equal(astronomyWindowResultSchema.safeParse(result).success, true);
});

test("returnsNoAstronomicalDarknessDuringPolarSummer", async () => {
  const result = await getAstronomyWindow(place(2), window("2026-06-20T00:00:00Z", "2026-06-21T00:00:00Z", "Europe/Oslo"), index);
  assert.equal(result.darknessState, "none");
  assert.notEqual(result.astronomicalDarkness.status, "available");
});

test("returnsDarkWindowDuringPolarWinter", async () => {
  const result = await getAstronomyWindow(place(6), window("2026-06-20T00:00:00Z", "2026-06-21T00:00:00Z", "Antarctica/McMurdo"), index);
  assert.equal(result.darknessState, "full-window");
  assert.equal(result.astronomicalDarkness.status, "available");
});

test("calculatesMoonPhaseAndAltitude", async () => {
  const result = await getAstronomyWindow(place(1), window("2026-06-01T00:00:00Z", "2026-06-02T00:00:00Z", "America/Guayaquil"), index);
  assert.ok(result.moon.illuminationPercent >= 0 && result.moon.illuminationPercent <= 100);
  assert.ok(result.moon.maximumAltitudeDegrees >= -90 && result.moon.maximumAltitudeDegrees <= 90);
});

test("returnsTargetRiseSetAndAltAzSamples", async () => {
  const result = await getTargetVisibility("Jupiter", place(1), window("2026-06-01T00:00:00Z", "2026-06-02T00:00:00Z", "America/Guayaquil"), index);
  assert.equal(result.target.targetType, "planet");
  assert.ok(result.intervals.length > 0);
  assert.ok(result.intervals[0]!.maximumAltitudeDegrees > 0);
  assert.equal(targetVisibilityResultSchema.safeParse(result).success, true);
});

test("calculatesMilkyWayCoreSeasonInBothHemispheres", async () => {
  const north = await getTargetVisibility("Milky Way core", place(5), window("2026-07-01T00:00:00Z", "2026-07-02T00:00:00Z", "Europe/Madrid"), index);
  const south = await getTargetVisibility("Milky Way core", place(3), window("2026-01-01T00:00:00Z", "2026-01-02T00:00:00Z", "America/Argentina/Ushuaia"), index);
  assert.equal(north.target.targetId, "milky-way-core");
  assert.ok(north.intervals.length > 0);
  assert.ok(south.intervals.length > 0);
});

test("keepsUtcAndLocalTimesConsistentAcrossDst", async () => {
  const oslo = new GeoNamesPlaceIndex([{ geonameId: 4, name: "Oslo", asciiName: "Oslo", alternateNames: "", latitude: 59.91, longitude: 10.75, countryCode: "NO", countryName: "Norway", featureClass: "P", featureCode: "PPLC", population: 1000, timeZone: "Europe/Oslo", modificationDate: "2026-01-01" }], "fixture-v1");
  const result = await getAstronomyWindow({ placeId: "place:v1:geonames:4", timeZone: "Europe/Oslo" }, window("2026-03-29T00:00:00Z", "2026-03-30T00:00:00Z", "Europe/Oslo"), oslo);
  for (const interval of result.solarThresholdIntervals) {
    assert.ok(interval.localStart.startsWith(formatLocalTime(interval.startUtc, "Europe/Oslo", "en")));
    assert.ok(interval.localEnd.startsWith(formatLocalTime(interval.endUtc, "Europe/Oslo", "en")));
  }
});

test("rejectsTimeZoneThatDoesNotMatchResolvedPlace", async () => {
  await assert.rejects(
    getAstronomyWindow(place(1), window("2026-06-01T00:00:00Z", "2026-06-02T00:00:00Z", "Europe/London"), index),
    /does not match the resolved named place/,
  );
});


test("Hanle four-hour night means full requested window with nested threshold intervals", async () => {
  const selected = window("2026-10-15T14:30:00Z", "2026-10-15T18:30:00Z", "Asia/Kolkata");
  const result = await getAstronomyWindow(place(7), selected, index);
  assert.equal(result.darknessState, "full-window");
  assert.equal("polarState" in result, false);
  assert.equal("twilightIntervals" in result, false);
  assert.deepEqual(result.solarThresholdIntervals.map(({ kind, sunAltitudeThresholdDegrees }) => [kind, sunAltitudeThresholdDegrees]), [["civil", -6], ["nautical", -12], ["astronomical", -18]]);
  for (const row of result.solarThresholdIntervals) {
    assert.equal(Date.parse(row.startUtc), Date.parse(selected.startUtc));
    assert.equal(Date.parse(row.endUtc), Date.parse(selected.endUtc));
    assert.ok(row.localStart.startsWith("8:00 PM"));
    assert.ok(row.localEnd.startsWith("12:00 AM"));
  }
  assert.ok(result.caveats.some((value) => /nested/i.test(value) && /requested window/i.test(value)));
  assert.equal(result.sources[0]?.vintage, "astronomy-engine-2.1.19");
});

test("Hanle expanded 24-hour window is partial with bounded astronomical darkness", async () => {
  const selected = window("2026-10-15T06:30:00Z", "2026-10-16T06:30:00Z", "Asia/Kolkata");
  const result = await getAstronomyWindow(place(7), selected, index);
  assert.equal(result.darknessState, "partial-window");
  assert.equal(result.astronomicalDarkness.status, "available");
  if (result.astronomicalDarkness.status === "available") {
    assert.ok(Date.parse(result.astronomicalDarkness.startUtc) > Date.parse(selected.startUtc));
    assert.ok(Date.parse(result.astronomicalDarkness.endUtc) < Date.parse(selected.endUtc));
  }
});

for (const [id, start, end, state] of [
  [1, "2026-06-01T16:00:00Z", "2026-06-01T18:00:00Z", "none"],
  [1, "2026-06-01T03:00:00Z", "2026-06-01T07:00:00Z", "full-window"],
  [5, "2026-06-01T10:00:00Z", "2026-06-01T12:00:00Z", "none"],
  [5, "2026-06-01T00:00:00Z", "2026-06-01T02:00:00Z", "full-window"],
] as const) {
  test(`requested darkness state at ${id} from ${start} is ${state}`, async () => {
    const result = await getAstronomyWindow(place(id), window(start, end, place(id).timeZone), index);
    assert.equal(result.darknessState, state);
    assert.equal(result.astronomicalDarkness.status, state === "none" ? "unavailable" : "available");
  });
}
