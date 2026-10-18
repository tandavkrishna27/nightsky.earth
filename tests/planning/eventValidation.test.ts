import test from "node:test";
import assert from "node:assert/strict";
import { GeoNamesPlaceIndex } from "../../server/places/geonames";
import { getAstronomyWindow, getTargetVisibility } from "../../server/nightsky/astronomy";
import { planObservingSession, type PlannerServices } from "../../server/nightsky/planner";
import { searchSkyEvents } from "../../server/events/catalog";

const index = new GeoNamesPlaceIndex([{ geonameId: 1, name: "London", asciiName: "London", alternateNames: "", latitude: 51.5, longitude: -.12, countryCode: "GB", countryName: "United Kingdom", featureClass: "P", featureCode: "PPLC", population: 1, timeZone: "Europe/London", modificationDate: "2026-10-01" }], "fixture");
const placeId = "place:v1:geonames:1";
const source = { name: "Offline weather fixture", url: "https://example.test/forecast", attribution: "Unavailable by construction", dataClass: "forecast" as const };

for (const [target, startUtc, endUtc, status] of [
  ["PER", "2026-08-12T00:00:00Z", "2026-08-12T01:00:00Z", "available"],
  ["PER", "2026-10-15T00:00:00Z", "2026-10-15T01:00:00Z", "outside-model"],
  ["PER", "2026-08-17T19:00:00Z", "2026-08-17T20:00:00Z", "mixed"],
  ["AND", "2026-11-14T00:00:00Z", "2026-11-14T01:00:00Z", "unsupported"],
  ["PER", "2031-08-12T00:00:00Z", "2031-08-12T01:00:00Z", "outside-model"],
] as const) test(`chosen meteor window preserves ${target} ${status} at ${startUtc}`, async () => {
  // Catches substituting a supported identity, skipping per-instant model validity,
  // silently extending the evaluation years, or promoting sampled fits to seasons.
  const window = { startUtc, endUtc, timeZone: "Europe/London" };
  const services: PlannerServices = {
    index, getAstronomy: (p,w) => getAstronomyWindow(p,w,index),
    getTargetVisibility: (p,t,w) => getTargetVisibility(t,p,w,index),
    searchEvents: query => searchSkyEvents(query,index),
    getNightConditions: async () => ({ availability: { status: "out-of-horizon", reason: "Offline" }, sources: [source], caveats: [], placeId, window, forecasts: [], nightContext: { darkness: { status: "unknown", reason: "Offline" }, forecastStepsDuringDarkness: [] } }),
    getLocationContext: async () => ({ availability: { status: "unknown", reason: "Offline" }, sources: [source], caveats: [], placeId, access: { status: "unknown" }, groundLightContext: { status: "unknown", reason: "Offline" } }),
  };
  const result = await planObservingSession({ placeId, window, activity: "meteor-shower", target }, services);
  const samples = result.evidence.meteorRadiantSamples!;
  assert.ok(samples.length);
  assert.ok(samples.every(sample => sample.code === target));
  if (status === "mixed") {
    assert.deepEqual(samples.map(sample => sample.status), ["available", "available", "outside-model", "outside-model", "outside-model"]);
    assert.ok(samples.filter(sample => sample.status === "outside-model").every(sample => !("altitudeDeg" in sample)));
  } else assert.ok(samples.every(sample => sample.status === status));
  assert.equal(samples[0].evaluatedAt, startUtc.replace("Z", ".000Z"));
  if (status !== "unsupported") {
    assert.equal(samples.length, 5);
    assert.equal(samples.at(-1)!.evaluatedAt, endUtc.replace("Z", ".000Z"));
  }
  if (status === "available" || status === "mixed") {
    assert.ok(samples.filter(sample => sample.status === "available").every(sample => Number.isFinite(sample.azimuthDeg) && sample.moonSeparationDeg >= 0));
    assert.equal(result.factors.find(f => f.name === "Meteor radiant visibility")!.impact, "mixed");
    assert.ok(result.sources.some(s => /Global Meteor Network/.test(s.name)));
  } else {
    assert.ok(samples.every(sample => !("altitudeDeg" in sample) && !("moonSeparationDeg" in sample)));
    assert.equal(result.factors.find(f => f.name === "Meteor radiant visibility")!.impact, "unknown");
  }
  assert.ok(result.gaps.some(gap => /Complete meteor activity seasons/.test(gap)));
  assert.equal(result.factors.find(f => f.name === "Weather forecast")!.impact, "unknown");
});
