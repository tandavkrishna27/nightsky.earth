import test from "node:test";
import assert from "node:assert/strict";
import { GeoNamesPlaceIndex } from "../../server/places/geonames";
import { searchSkyEvents } from "../../server/events/catalog";

const index = new GeoNamesPlaceIndex([
  { geonameId: 901, name: "Lunar endpoint reference", asciiName: "Lunar endpoint reference", alternateNames: "", latitude: 18.5204, longitude: 57.5, countryCode: "XX", countryName: "Fixture", featureClass: "P", featureCode: "PPL", population: 1, timeZone: "UTC", modificationDate: "2026-10-14" },
  { geonameId: 902, name: "Pune", asciiName: "Pune", alternateNames: "", latitude: 18.5204, longitude: 73.8567, countryCode: "IN", countryName: "India", featureClass: "P", featureCode: "PPL", population: 1, timeZone: "Asia/Kolkata", modificationDate: "2026-10-14" },
  { geonameId: 903, name: "Solar horizon reference", asciiName: "Solar horizon reference", alternateNames: "", latitude: 0, longitude: -20, countryCode: "XX", countryName: "Fixture", featureClass: "P", featureCode: "PPL", population: 1, timeZone: "UTC", modificationDate: "2026-10-14" },
  { geonameId: 904, name: "Honolulu", asciiName: "Honolulu", alternateNames: "", latitude: 21.3069, longitude: -157.8583, countryCode: "US", countryName: "United States", featureClass: "P", featureCode: "PPL", population: 1, timeZone: "Pacific/Honolulu", modificationDate: "2026-10-14" },
  { geonameId: 905, name: "London", asciiName: "London", alternateNames: "", latitude: 51.5072, longitude: -0.1276, countryCode: "GB", countryName: "United Kingdom", featureClass: "P", featureCode: "PPL", population: 1, timeZone: "Europe/London", modificationDate: "2026-10-14" },
], "independent-lunar-horizon-v1");

async function lunar(id: number) {
  const result = await searchSkyEvents({ placeId: `place:v1:geonames:${id}`, window: { startUtc: "2026-03-03T00:00:00Z", endUtc: "2026-03-04T00:00:00Z", timeZone: index.getById(id)!.timeZone }, eventTypes: ["eclipse"] }, index);
  return result.events.find(event => event.eventId.startsWith("lunar-eclipse:"))!;
}

for (const [id, state] of [[904, "visible"], [905, "not-visible"]] as const) {
  test(`independent JPL lunar eclipse horizon reference: ${id} is ${state}`, async () => {
    // Same Moon AIRLESS query at 08:40,11:30,14:30 UTC:
    // Honolulu elevations +57.818654,+70.885307,+33.307653;
    // London -17.534745,-32.195837,-27.023366 degrees.
    // Broad non-grazing reference cases complement the endpoint rise regression.
    assert.equal((await lunar(id)).localVisibility, state);
  });
}

test("independent JPL rising Moon in final lunar eclipse sampling tail is partially visible", async () => {
  // JPL Horizons API 1.2, Moon 301, coord@399 GEODETIC (57.5,18.5204,0),
  // quantity 4, AIRLESS, UTC, retrieved 2026-10-14. Elevations at
  // 14:14=-1.982102, 14:22=-0.164618, 14:23=+0.062795 degrees.
  // The independently bracketed center rise precedes the modeled event end.
  // Omitting the final partial 10-minute step incorrectly returns not-visible.
  const event = await lunar(901);
  assert.equal(event.localVisibility, "partially-visible");
  assert.ok(Date.parse(event.endUtc!) > Date.parse("2026-03-03T14:23:00Z"));
});

test("independent JPL Sun straddles the horizon across local solar eclipse contacts", async () => {
  // JPL Horizons Sun 10, GEODETIC (-20,0,0), quantity 4, AIRLESS:
  // 19:05=+4.833747,19:06=+4.592056;19:27=-0.484422,
  // 19:28=-0.726179;19:48=-5.560824,19:49=-5.802508 degrees.
  // These independently validate signs at the modeled contact/peak brackets.
  // Solar event altitude uses standard refraction, unlike JPL AIRLESS.
  const result = await searchSkyEvents({ placeId: "place:v1:geonames:903", window: { startUtc: "2026-08-12T00:00:00Z", endUtc: "2026-08-13T00:00:00Z", timeZone: "UTC" }, eventTypes: ["eclipse"] }, index);
  const event = result.events.find(event => event.eventId.startsWith("solar-eclipse:"))!;
  assert.equal(event.localVisibility, "partially-visible");
  for (const [actual, start, end] of [
    [event.startUtc!, "19:05", "19:06"], [event.peakUtc!, "19:27", "19:28"], [event.endUtc!, "19:48", "19:49"],
  ]) {
    assert.ok(Date.parse(actual) >= Date.parse(`2026-08-12T${start}:00Z`) && Date.parse(actual) <= Date.parse(`2026-08-12T${end}:00Z`));
  }
  assert.match(event.description!, /below the horizon at maximum/);
});

test("independent JPL Pune Moon rises during the March 2026 lunar eclipse", async () => {
  // Same query, site (73.8567,18.5204,0): 08:40=-56.670190,
  // 11:30=-23.438244, 13:10=-1.103430, 13:20=+1.169447,
  // 14:20=+14.891001 degrees. Horizon crossing lies inside penumbral phase.
  const event = await lunar(902);
  assert.equal(event.localVisibility, "partially-visible");
  assert.ok(Date.parse(event.startUtc!) < Date.parse("2026-03-03T13:10:00Z"));
  assert.ok(Date.parse(event.endUtc!) > Date.parse("2026-03-03T13:20:00Z"));
});
