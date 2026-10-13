import test from "node:test";
import assert from "node:assert/strict";
import { GeoNamesPlaceIndex } from "../../server/places/geonames";
import { searchSkyEvents } from "../../server/events/catalog";

// Independent reference values transcribed 2026-10-13 from USNO API 4.0.1:
// https://aa.usno.navy.mil/api/seasons?year=2026 (tz=0, dst=false)
// https://aa.usno.navy.mil/api/moon/phases/year?year=2026
// USNO publishes minute precision. A two-minute bound allows rounding and
// small ephemeris/time-model differences, but catches date/hour/phase errors.
// These expected values are not generated with the implementation's engine.
const seasons = [
  ["March equinox", "2026-03-20T14:46:00Z"],
  ["June solstice", "2026-06-21T08:24:00Z"],
  ["September equinox", "2026-09-23T00:05:00Z"],
  ["December solstice", "2026-12-21T20:50:00Z"],
] as const;
const phases = [
  ["Full Moon", "2026-01-03T10:03:00Z"],
  ["Third Quarter", "2026-01-10T15:48:00Z"],
  ["New Moon", "2026-01-18T19:52:00Z"],
  ["First Quarter", "2026-01-26T04:47:00Z"],
  ["Full Moon", "2026-03-03T11:38:00Z"],
  ["New Moon", "2026-08-12T17:37:00Z"],
  ["Full Moon", "2026-08-28T04:18:00Z"],
  ["New Moon", "2026-12-09T00:52:00Z"],
] as const;

const index = new GeoNamesPlaceIndex([
  { geonameId: 1, name: "Quito", asciiName: "Quito", alternateNames: "", latitude: -0.18, longitude: -78.47, countryCode: "EC", countryName: "Ecuador", featureClass: "P", featureCode: "PPLC", population: 1000, timeZone: "America/Guayaquil", modificationDate: "2026-01-01" },
], "independent-reference-v1");

for (const [eventType, cases] of [["equinox-solstice", seasons], ["moon-phase", phases]] as const) {
  for (const [name, expectedUtc] of cases) {
    test(`USNO independent reference: ${name} at ${expectedUtc}`, async () => {
      const expected = Date.parse(expectedUtc);
      const result = await searchSkyEvents({
        placeId: "place:v1:geonames:1",
        window: { startUtc: new Date(expected - 86_400_000).toISOString(), endUtc: new Date(expected + 86_400_000).toISOString(), timeZone: "America/Guayaquil" },
        eventTypes: [eventType],
      }, index);
      assert.equal(result.events.length, 1);
      const event = result.events[0]!;
      assert.equal(event.name, name);
      assert.ok(event.peakUtc);
      const errorSeconds = Math.abs(Date.parse(event.peakUtc) - expected) / 1000;
      assert.ok(errorSeconds <= 120, `${name} differs from USNO by ${errorSeconds.toFixed(2)} seconds`);
    });
  }
}
