import assert from "node:assert/strict";
import test from "node:test";
import { GeoNamesPlaceIndex, parseGeoNamesCityRow, resolvePlace } from "../../server/places/geonames";

const vintage = "geonames-cities500-2026-10-11";
function city(input: { id: number; name: string; aliases?: string; lat: number; lon: number; country: string; countryName: string; zone: string; population?: number }) {
  return {
    geonameId: input.id, name: input.name, asciiName: input.name, alternateNames: input.aliases ?? "",
    latitude: input.lat, longitude: input.lon, countryCode: input.country, countryName: input.countryName,
    featureClass: "P", featureCode: "PPL", population: input.population ?? 100_000,
    timeZone: input.zone, modificationDate: "2026-10-01",
  };
}

const index = new GeoNamesPlaceIndex([
  city({ id: 1880252, name: "Pune", aliases: "Poona,पुणे", lat: 18.5204, lon: 73.8567, country: "IN", countryName: "India", zone: "Asia/Kolkata" }),
  city({ id: 4613868, name: "Springfield", lat: 39.8017, lon: -89.6436, country: "US", countryName: "United States", zone: "America/Chicago", population: 114000 }),
  city({ id: 4409896, name: "Springfield", lat: 37.2089, lon: -93.2923, country: "US", countryName: "United States", zone: "America/Chicago", population: 170000 }),
  city({ id: 2193733, name: "Auckland", lat: -36.85, lon: 174.76, country: "NZ", countryName: "New Zealand", zone: "Pacific/Auckland" }),
  city({ id: 4034948, name: "Apia", lat: -13.8333, lon: -171.7667, country: "WS", countryName: "Samoa", zone: "Pacific/Apia" }),
], vintage);

test("returnsUniquePlaceMatch", async () => {
  const result = await resolvePlace({ placeQuery: "Pune" }, { index });
  assert.equal(result.matches.length, 1);
  assert.equal(result.matches[0]?.placeId, "place:v1:geonames:1880252");
  assert.equal(result.matches[0]?.timeZone, "Asia/Kolkata");
  assert.equal(result.selectionRequired, false);
  assert.equal("latitude" in result.matches[0]!, false);
});

test("returnsAmbiguousMatchesWithoutChoosing", async () => {
  const result = await resolvePlace({ placeQuery: "Springfield" }, { index });
  assert.equal(result.matches.length, 2);
  assert.equal(result.selectionRequired, true);
});

test("returnsNoMatch", async () => {
  const result = await resolvePlace({ placeQuery: "No Such Place" }, { index });
  assert.equal(result.matches.length, 0);
  assert.equal(result.availability.status, "not-covered");
});

test("requiresCountryQualifierWhenNeeded", async () => {
  const result = await resolvePlace({ placeQuery: "Springfield, United States" }, { index });
  assert.equal(result.matches.length, 2);
  const india = await resolvePlace({ placeQuery: "Pune, India" }, { index });
  assert.equal(india.matches[0]?.displayName, "Pune, India");
});

test("matchesNonLatinAliasesWhenAvailable", async () => {
  const result = await resolvePlace({ placeQuery: "पुणे" }, { index });
  assert.equal(result.matches[0]?.placeId, "place:v1:geonames:1880252");
});

test("rejectsCoordinateTextOnEveryHost", async () => {
  await assert.rejects(() => resolvePlace({ placeQuery: "18.5204, 73.8567" }, { index }));
  await assert.rejects(() => resolvePlace({ placeQuery: "lat: 18.5 lon: 73.8" }, { index }));
});

test("resolvesExplicitHostHintToNamedPlace", async () => {
  const result = await resolvePlace({ useApproximateHostLocation: true }, { index, hostLocationHint: { latitude: 18.521, longitude: 73.857, label: "Pune" } });
  assert.equal(result.matches[0]?.displayName, "Pune, India");
  assert.equal(result.locationSource, "host-approximate-location");
  assert.equal(JSON.stringify(result).includes("18.521"), false);
});

test("returnsLocationUnavailableWhenHintAbsent", async () => {
  const result = await resolvePlace({ useApproximateHostLocation: true }, { index });
  assert.equal(result.availability.status, "unavailable");
  assert.equal(result.availability.reason, "host-location-unavailable");
});

test("ignoresHostHintWithoutFlag", async () => {
  const result = await resolvePlace({ placeQuery: "Pune" }, { index, hostLocationHint: { latitude: -36.85, longitude: 174.76 } });
  assert.equal(result.matches[0]?.displayName, "Pune, India");
  assert.equal(result.locationSource, "named-place");
});

test("rejectsMalformedGazetteerRow", () => {
  assert.throws(() => parseGeoNamesCityRow("bad\trow"));
  assert.throws(() => parseGeoNamesCityRow(Array.from({ length: 19 }, () => "").join("\t")));
});

test("returnsStalePlaceIdWithReresolvePath", async () => {
  const result = await resolvePlace({ placeQuery: "Pune" }, { index, stalePlaceId: "place:v1:geonames:99999999" });
  assert.equal(result.availability.status, "stale");
  assert.match(result.availability.reason, /resolve/i);
});

test("indexIsDeterministicAndCarriesAttributionAndVintage", async () => {
  const result = await resolvePlace({ placeQuery: "Pune" }, { index });
  assert.equal(result.matches[0]?.indexVintage, vintage);
  assert.ok(result.sources[0]?.attribution.includes("GeoNames"));
});

test("usesNamedPlaceTimezoneRatherThanExposingCoordinates", async () => {
  const result = await resolvePlace({ placeQuery: "Pune" }, { index });
  assert.equal(result.matches[0]?.timeZone, "Asia/Kolkata");
  assert.equal("longitude" in result.matches[0]!, false);
});

test("resolvesZoneAcrossDateLine", async () => {
  const auckland = await resolvePlace({ placeQuery: "Auckland" }, { index });
  const apia = await resolvePlace({ placeQuery: "Apia" }, { index });
  assert.equal(auckland.matches[0]?.timeZone, "Pacific/Auckland");
  assert.equal(apia.matches[0]?.timeZone, "Pacific/Apia");
});
