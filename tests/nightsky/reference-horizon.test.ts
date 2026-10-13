import test from "node:test";
import assert from "node:assert/strict";
import { GeoNamesPlaceIndex } from "../../server/places/geonames";
import { getAstronomyWindow, getTargetVisibility } from "../../server/nightsky/astronomy";
import { searchSkyEvents } from "../../server/events/catalog";

const index = new GeoNamesPlaceIndex([
  { geonameId: 101, name: "Washington", asciiName: "Washington", alternateNames: "", latitude: 38.9, longitude: -77, countryCode: "US", countryName: "United States", featureClass: "P", featureCode: "PPLC", population: 1000, timeZone: "America/New_York", modificationDate: "2026-01-01" },
  { geonameId: 102, name: "Tromso", asciiName: "Tromso", alternateNames: "", latitude: 69.65, longitude: 18.96, countryCode: "NO", countryName: "Norway", featureClass: "P", featureCode: "PPLA", population: 1000, timeZone: "Europe/Oslo", modificationDate: "2026-01-01" },
  { geonameId: 103, name: "South Pole", asciiName: "South Pole", alternateNames: "", latitude: -90, longitude: 0, countryCode: "AQ", countryName: "Antarctica", featureClass: "P", featureCode: "PPL", population: 1000, timeZone: "Antarctica/McMurdo", modificationDate: "2026-01-01" },
  { geonameId: 104, name: "Dallas", asciiName: "Dallas", alternateNames: "", latitude: 32.78, longitude: -96.8, countryCode: "US", countryName: "United States", featureClass: "P", featureCode: "PPLA", population: 1000, timeZone: "America/Chicago", modificationDate: "2026-01-01" },
], "independent-horizon-reference-v1");
const place = (id = 101) => ({ placeId: `place:v1:geonames:${id}`, timeZone: index.getById(id)!.timeZone });
const window = (startUtc: string, endUtc: string, id = 101) => ({ startUtc, endUtc, timeZone: place(id).timeZone });

// Independently transcribed 2026-10-13 from NASA/JPL Horizons API 1.2.
// https://ssd.jpl.nasa.gov/api/horizons.api ; full query recipe and source frames
// in docs/operations/astronomy-validation-wave.md. Quantity 4, AIRLESS, center
// coord@399, GEODETIC site (-77,38.9,0 km), UTC. Apparent topocentric centers,
// light time/aberration/precession/nutation applied; no atmospheric refraction.
// Maxima selected from the two independently queried minute endpoints are
// literals. These short windows test endpoint
// sampling as well as body mapping, longitude sign and horizon conventions.
// 0.03 degrees allows ephemeris/Earth orientation differences, not refraction.
const aboveHorizon = [
  { body: "Sun", hour: "17", altitude: 29.944384, azimuth: 175.565340 },
  { body: "Moon", hour: "17", altitude: 15.035894, azimuth: 210.698387 },
  { body: "Mercury", hour: "17", altitude: 27.620707, azimuth: 179.544629 },
  { body: "Venus", hour: "17", altitude: 29.186314, azimuth: 172.977843 },
  { body: "Mars", hour: "17", altitude: 28.785846, azimuth: 177.159381 },
  { body: "Jupiter", hour: "01", altitude: 38.012870, azimuth: 90.690220 },
  { body: "Saturn", hour: "17", altitude: 17.174160, azimuth: 108.863082 },
  { body: "Uranus", hour: "01", altitude: 70.407435, azimuth: 172.510948 },
  { body: "Neptune", hour: "17", altitude: 16.920140, azimuth: 106.038266 },
  { body: "Pluto", hour: "17", altitude: 26.789246, azimuth: 166.588145 },
] as const;
for (const row of aboveHorizon) {
  test(`JPL airless altitude and azimuth: ${row.body} includes the one-minute window endpoint`, async () => {
    const selected = window(`2026-01-15T${row.hour}:00:00Z`, `2026-01-15T${row.hour}:01:00Z`);
    const result = await getTargetVisibility(row.body, place(), selected, index);
    assert.equal(result.intervals.length, 1);
    const interval = result.intervals[0]!;
    assert.equal(Date.parse(interval.startUtc), Date.parse(selected.startUtc));
    assert.equal(Date.parse(interval.endUtc), Date.parse(selected.endUtc));
    assert.ok(Math.abs(interval.maximumAltitudeDegrees - row.altitude) <= 0.03, `${row.body}: ${interval.maximumAltitudeDegrees} vs JPL ${row.altitude}`);
    const azError = Math.abs(((interval.azimuthDegrees - row.azimuth + 540) % 360) - 180);
    assert.ok(azError <= 0.03, `${row.body}: azimuth error ${azError}`);
  });
}
for (const [body, hour, elevations] of [
  ["Jupiter", "17", [-28.760851, -28.752725]],
  ["Uranus", "17", [-10.514262, -10.355812]],
  ["Pluto", "01", [-26.435035, -26.627554]],
] as const) {
  test(`JPL below-horizon reference excludes ${body} at ${hour}:00 UTC`, async () => {
    assert.ok(elevations.every((elevation) => elevation < 0));
    const result = await getTargetVisibility(body, place(), window(`2026-01-15T${hour}:00:00Z`, `2026-01-15T${hour}:01:00Z`), index);
    assert.deepEqual(result.intervals, []);
  });
}

// Same JPL settings, Sun 10, 2026-Jan-15 22:00 through Jan-16 13:00,
// one-minute step. Consecutive AIRLESS center elevations bracket crossings.
// Assert bracket with 10 seconds extra for time-model/ephemeris differences.
const twilightBrackets = [
  { kind: "civil", start: ["2026-01-15T22:39:00Z", "2026-01-15T22:40:00Z"], end: ["2026-01-16T11:55:00Z", "2026-01-16T11:56:00Z"], elevations: [-5.929221, -6.109245, -6.093228, -5.912877] },
  { kind: "nautical", start: ["2026-01-15T23:12:00Z", "2026-01-15T23:13:00Z"], end: ["2026-01-16T11:22:00Z", "2026-01-16T11:23:00Z"], elevations: [-11.963075, -12.148661, -12.142651, -11.956784] },
  { kind: "astronomical", start: ["2026-01-15T23:44:00Z", "2026-01-15T23:45:00Z"], end: ["2026-01-16T10:50:00Z", "2026-01-16T10:51:00Z"], elevations: [-17.967976, -18.157614, -18.159928, -17.970049] },
] as const;
function assertInBracket(actual: string, bracket: readonly [string, string]) {
  assert.ok(Date.parse(actual) >= Date.parse(bracket[0]) - 10_000 && Date.parse(actual) <= Date.parse(bracket[1]) + 10_000, `${actual} outside JPL crossing bracket ${bracket.join(" / ")}`);
}
for (const row of twilightBrackets) {
  test(`JPL geometric ${row.kind} twilight evening and morning crossing`, async () => {
    const result = await getAstronomyWindow(place(), window("2026-01-15T22:00:00Z", "2026-01-16T13:00:00Z"), index);
    const interval = result.twilightIntervals.find((interval) => interval.kind === row.kind)!;
    assert.ok(interval);
    assertInBracket(interval.startUtc, row.start);
    assertInBracket(interval.endUtc, row.end);
  });
}
test("JPL civil crossing in final unsampled four-minute tail is retained", async () => {
  const result = await getAstronomyWindow(place(), window("2026-01-15T22:36:00Z", "2026-01-15T22:40:00Z"), index);
  const interval = result.twilightIntervals.find((interval) => interval.kind === "civil");
  assert.ok(interval, "Civil darkness starts inside the window, after its midpoint");
  assertInBracket(interval.startUtc, twilightBrackets[0].start);
  assert.equal(Date.parse(interval.endUtc), Date.parse("2026-01-15T22:40:00Z"));
});
test("JPL morning civil crossing in final four-minute tail does not extend darkness to the end", async () => {
  const result = await getAstronomyWindow(place(), window("2026-01-16T11:53:00Z", "2026-01-16T11:57:00Z"), index);
  const interval = result.twilightIntervals.find((interval) => interval.kind === "civil")!;
  assert.ok(interval);
  assertInBracket(interval.endUtc, twilightBrackets[0].end);
});
test("JPL Moon altitude samples include the non-step-aligned endpoint", async () => {
  // JPL Moon 301, same Washington site, 13:00=18.570104; 13:01=18.641313.
  const result = await getAstronomyWindow(place(), window("2026-01-15T13:00:00Z", "2026-01-15T13:01:00Z"), index);
  assert.ok(Math.abs(result.moon.maximumAltitudeDegrees - 18.641313) <= 0.03);
  assert.equal(result.moon.maximumAltitudeAtUtc, "2026-01-15T13:01:00.000Z");
});
test("JPL geocentric illuminated lunar disk agrees with the window midpoint", async () => {
  // Horizons quantity 10, Moon 301, center 500@399 (GEOCENTRIC), Jan 15
  // 13:00/13:01 UTC reports 10.17550/10.17151 percent. The product's
  // illumination is geocentric, unlike its observer-dependent altitude.
  const result = await getAstronomyWindow(place(), window("2026-01-15T13:00:00Z", "2026-01-15T13:01:00Z"), index);
  assert.equal(result.moon.phaseAtUtc, "2026-01-15T13:00:30.000Z");
  assert.ok(Math.abs(result.moon.illuminationPercent - 10.1735) <= 0.05, `Illumination ${result.moon.illuminationPercent} vs JPL ~10.1735 percent`);
});
test("JPL geometric Sun setting in a short tail produces a positive interval ending at the crossing", async () => {
  // AIRLESS center 22:05=+0.067215, 22:06=-0.105406 degrees. This differs
  // from refracted upper-limb sunset, which is intentionally not the reference.
  const result = await getTargetVisibility("Sun", place(), window("2026-01-15T22:02:00Z", "2026-01-15T22:06:00Z"), index);
  assert.equal(result.intervals.length, 1);
  assertInBracket(result.intervals[0]!.endUtc, ["2026-01-15T22:05:00Z", "2026-01-15T22:06:00Z"]);
  assert.ok(Date.parse(result.intervals[0]!.endUtc) > Date.parse(result.intervals[0]!.startUtc));
});
test("JPL geometric Sun rising in a short tail starts its interval at the crossing", async () => {
  // AIRLESS center Jan 16 12:29=-0.077414, 12:30=+0.095587 degrees.
  const result = await getTargetVisibility("Sun", place(), window("2026-01-16T12:26:00Z", "2026-01-16T12:30:00Z"), index);
  assert.equal(result.intervals.length, 1);
  assertInBracket(result.intervals[0]!.startUtc, ["2026-01-16T12:29:00Z", "2026-01-16T12:30:00Z"]);
  assert.ok(Date.parse(result.intervals[0]!.endUtc) > Date.parse(result.intervals[0]!.startUtc));
});
for (const [id, state] of [[102, "no-astronomical-darkness"], [103, "continuous-darkness"]] as const) {
  test(`JPL polar Sun reference: ${place(id).placeId} is ${state}`, async () => {
    // Tromso: 00/06/12/18/24 UTC elevations 4.034827,28.324903,42.480695,
    // 15.746629,4.035049. South Pole: 00/12/24=-23.433886,-23.437665,-23.439720.
    const selected = window("2026-06-20T00:00:00Z", "2026-06-21T00:00:00Z", id);
    const result = await getAstronomyWindow(place(id), selected, index);
    assert.equal(result.polarState, state);
    if (state === "continuous-darkness") {
      assert.equal(result.astronomicalDarkness.status, "available");
      if (result.astronomicalDarkness.status === "available") {
        assert.equal(Date.parse(result.astronomicalDarkness.startUtc), Date.parse(selected.startUtc));
        assert.equal(Date.parse(result.astronomicalDarkness.endUtc), Date.parse(selected.endUtc));
      }
    } else assert.equal(result.astronomicalDarkness.status, "unavailable");
  });
}

// NASA's Cotton Bowl event notice gives Apr 8 2024 Dallas C1=12:23 CDT,
// C4=15:02 CDT and totality=13:40..13:44 CDT. CDT=UTC-5. Publication minute
// precision and city/venue coordinate difference justify 120 seconds, not a
// sub-second claim. Source does not publish the exact local maximum instant.
// https://solarsystem.nasa.gov/events/318/sun-moon-and-you-dallas-cotton-bowl-solar-eclipse/?category=eclipses_general
test("NASA Dallas local solar eclipse partial contacts and maximum within totality", async () => {
  const result = await searchSkyEvents({ placeId: place(104).placeId, window: window("2024-04-08T16:00:00Z", "2024-04-08T21:00:00Z", 104), eventTypes: ["eclipse"] }, index);
  assert.equal(result.events.length, 1);
  const event = result.events[0]!;
  assert.equal(event.name, "Total Solar Eclipse");
  assert.equal(event.localVisibility, "visible");
  for (const [actual, reference] of [[event.startUtc, "2024-04-08T17:23:00Z"], [event.endUtc, "2024-04-08T20:02:00Z"]]) {
    assert.ok(actual);
    assert.ok(Math.abs(Date.parse(actual) - Date.parse(reference!)) <= 120_000, `${actual} vs NASA ${reference}`);
  }
  assert.ok(event.peakUtc);
  assert.ok(Date.parse(event.peakUtc) >= Date.parse("2024-04-08T18:40:00Z") && Date.parse(event.peakUtc) <= Date.parse("2024-04-08T18:44:00Z"));
});
test("NASA Dallas partial phase overlap is returned when window ends before maximum", async () => {
  const result = await searchSkyEvents({ placeId: place(104).placeId, window: window("2024-04-08T17:25:00Z", "2024-04-08T17:35:00Z", 104), eventTypes: ["eclipse"] }, index);
  assert.equal(result.events.length, 1, "NASA C1 precedes the window even though local maximum follows it");
  assert.equal(result.events[0]!.name, "Total Solar Eclipse");
});
