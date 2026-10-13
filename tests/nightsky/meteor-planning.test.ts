import assert from "node:assert/strict";
import test from "node:test";
import { GeoNamesPlaceIndex } from "../../server/places/geonames";
import { getAstronomyWindow, getTargetVisibility } from "../../server/nightsky/astronomy";
import { planObservingSession, type PlannerServices } from "../../server/nightsky/planner";
const index = new GeoNamesPlaceIndex([{ geonameId: 1, name: "London", asciiName: "London", alternateNames: "", latitude: 51.5, longitude: -.12, countryCode: "GB", countryName: "United Kingdom", featureClass: "P", featureCode: "PPLC", population: 8000000, timeZone: "Europe/London", modificationDate: "2026-10-01" }], "fixture");
const placeId = "place:v1:geonames:1";
const window = { startUtc: "2026-08-11T20:00:00Z", endUtc: "2026-08-12T04:00:00Z", timeZone: "Europe/London" };
const source = { name: "Fixture", url: "https://example.test/source", attribution: "Fixture", dataClass: "context" as const };
function services(): PlannerServices {
  return { index, getAstronomy: (p,w) => getAstronomyWindow(p,w,index), getTargetVisibility: (p,t,w) => getTargetVisibility(t,p,w,index), getNightConditions: async () => ({ availability: { status: "out-of-horizon", reason: "No forecast" }, sources: [source], caveats: [], placeId, window, forecasts: [], nightContext: { darkness: { status: "unknown", reason: "Fixture" }, forecastStepsDuringDarkness: [] } }), searchEvents: async () => ({ availability: { status: "unsupported", reason: "Full-season catalog rights remain open" }, sources: [source], caveats: [], placeId, window, events: [], unsupportedEventTypes: ["meteor-shower"] }), getLocationContext: async () => ({ availability: { status: "unknown", reason: "Fixture" }, sources: [source], caveats: [], placeId, access: { status: "unknown" }, groundLightContext: { status: "unknown", reason: "Fixture" } }) };
}
test("explicit Perseids gives three licensed exact radiant samples without substituting a season catalog", async () => {
  const result = await planObservingSession({ placeId, window, activity: "meteor-shower", target: "Perseids" }, services());
  const samples = result.evidence!.meteorRadiantSamples!;
  assert.equal(samples.length, 3);
  assert.ok(samples.every(sample => sample.status === "available" && Number.isFinite(sample.altitudeDeg) && Number.isFinite(sample.moonSeparationDeg)));
  assert.equal(samples[0]!.status === "available" ? samples[0].evaluatedAt : undefined, window.startUtc.replace("Z", ".000Z"));
  assert.ok(result.sources.some(record => record.licenseUrl === "https://creativecommons.org/licenses/by/4.0/"));
  assert.ok(result.sources.some(record => /Astronomy Engine/.test(record.name)));
  assert.ok(result.caveats.some(caveat => /2018-12-10.*2021-05-22/.test(caveat)));
  assert.ok(result.gaps.some(gap => /full-season|season catalog/i.test(gap)));
  assert.ok(!result.gaps.some(gap => /Target visibility is unsupported/.test(gap)));
  assert.equal(result.availability.status, "partial");
  assert.ok(samples.every(sample => sample.status === "available" && sample.annualExtrapolation));
});
test("outside fit bounds returns no radiant numbers and preserves the reason", async () => {
  const result = await planObservingSession({ placeId, window: { ...window, startUtc: "2026-01-15T20:00:00Z", endUtc: "2026-01-16T04:00:00Z" }, activity: "meteor-shower", target: "PER" }, services());
  assert.ok(result.evidence!.meteorRadiantSamples!.every(sample => sample.status === "outside-model" && !("altitudeDeg" in sample)));
  assert.ok(result.gaps.some(gap => /nominal radiant fit window/.test(gap)));
});
test("no selected shower leaves an explicit choice gap with no fabricated radiant", async () => {
  const result = await planObservingSession({ placeId, window, activity: "meteor-shower" }, services());
  assert.deepEqual(result.evidence!.meteorRadiantSamples, []);
  assert.ok(result.gaps.some(gap => /choose|select/i.test(gap)));
});
test("one date-only matching event can select a radiant but two events require a choice", async () => {
  const svc = services(), original = svc.searchEvents;
  svc.searchEvents = async (...args) => ({ ...await original(...args), events: [{ eventId: "meteor:perseids", name: "Perseids", eventType: "meteor-shower", localVisibility: "not-evaluated", source }] });
  const single = await planObservingSession({ placeId, window, activity: "meteor-shower" }, svc);
  assert.ok(single.evidence!.meteorRadiantSamples!.every(sample => sample.status === "available" && sample.code === "PER"));
  const singleEvents = svc.searchEvents;
  svc.searchEvents = async (...args) => { const result = await singleEvents(...args); return { ...result, events: [...result.events, { eventId: "meteor:geminids", name: "Geminids", eventType: "meteor-shower", localVisibility: "not-evaluated", source }] }; };
  const multiple = await planObservingSession({ placeId, window, activity: "meteor-shower" }, svc);
  assert.deepEqual(multiple.evidence!.meteorRadiantSamples, []);
  assert.ok(multiple.gaps.some(gap => /choose.*shower/.test(gap)));
});
test("years outside the reviewed bound retain no modeled radiant numbers", async () => {
  const result = await planObservingSession({ placeId, window: { ...window, startUtc: "2031-08-11T20:00:00Z", endUtc: "2031-08-12T04:00:00Z" }, activity: "meteor-shower", target: "Perseids" }, services());
  assert.ok(result.evidence!.meteorRadiantSamples!.every(sample => sample.status === "outside-model" && !Object.hasOwn(sample, "moonSeparationDeg")));
  assert.ok(result.gaps.some(gap => /2018-2030/.test(gap)));
});

test("inherited object property names remain ordinary unknown shower selections", async () => {
  for (const target of ["constructor", "__proto__", "toString"]) {
    const result = await planObservingSession({ placeId, window, activity: "meteor-shower", target }, services());
    assert.deepEqual(result.evidence!.meteorRadiantSamples, []);
    assert.ok(!result.gaps.some(gap => /model could not be evaluated/.test(gap)));
  }
});
