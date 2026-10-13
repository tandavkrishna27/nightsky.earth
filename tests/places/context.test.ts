import test from "node:test";
import assert from "node:assert/strict";
import { getLocationContext } from "../../server/places/context";

const place = { placeId: "place:v1:geonames:1880252", displayName: "Pune, India", timeZone: "Asia/Kolkata", indexVintage: "2026-10", sources: [{ name: "GeoNames", url: "https://www.geonames.org/", attribution: "GeoNames CC BY 4.0", dataClass: "catalog" as const, vintage: "2026-10" }] };

test("returnsSourceLinkedPlaceContext", async () => {
  const result = await getLocationContext(place);
  assert.equal(result.placeId, place.placeId);
  assert.equal(result.sources[0]!.url, "https://www.geonames.org/");
});

test("returnsUnknownForUnverifiedDarkness", async () => {
  const result = await getLocationContext(place);
  assert.equal(result.groundLightContext.status, "unknown");
  assert.match(result.groundLightContext.reason, /not passed|not validated/i);
  assert.equal(result.access.status, "unknown");
});
