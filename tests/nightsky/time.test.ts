import assert from "node:assert/strict";
import test from "node:test";
import { formatLocalTime, resolveLocalDateTimeToUtc } from "../../server/nightsky/time";
import { GeoNamesPlaceIndex } from "../../server/places/geonames";
import { resolvePlaceTimeZone } from "../../server/places";

test("formatsLocalTimeAcrossDst", () => {
  const before = resolveLocalDateTimeToUtc("2026-03-08", 1, 30, "America/New_York");
  const after = resolveLocalDateTimeToUtc("2026-03-08", 3, 30, "America/New_York");
  assert.equal(formatLocalTime(before, "America/New_York", "en-US"), "1:30 AM EST");
  assert.equal(formatLocalTime(after, "America/New_York", "en-US"), "3:30 AM EDT");
  assert.throws(() => resolveLocalDateTimeToUtc("2026-03-08", 2, 30, "America/New_York"), /does not resolve/i);
});

test("resolvesIanaZoneFromNamedPlaceRecord", async () => {
  const index = new GeoNamesPlaceIndex([{
    geonameId: 1880252, name: "Pune", asciiName: "Pune", alternateNames: "",
    latitude: 18.5204, longitude: 73.8567, countryCode: "IN", countryName: "India",
    featureClass: "P", featureCode: "PPL", population: 100_000, timeZone: "Asia/Kolkata", modificationDate: "2026-10-01",
  }], "test-vintage");
  const resolved = await resolvePlaceTimeZone("place:v1:geonames:1880252", index);
  assert.equal(resolved?.timeZone, "Asia/Kolkata");
  assert.doesNotThrow(() => formatLocalTime("2026-10-11T12:00:00.000Z", resolved!.timeZone, "en-IN"));
  assert.equal(await resolvePlaceTimeZone("place:v1:geonames:999", index), undefined);
  assert.throws(() => formatLocalTime("2026-10-11T12:00:00.000Z", "Not/A_Timezone", "en"));
});
