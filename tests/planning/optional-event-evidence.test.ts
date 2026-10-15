import assert from "node:assert/strict";
import test from "node:test";
import { GeoNamesPlaceIndex } from "../../server/places/geonames";
import { getAstronomyWindow, getTargetVisibility } from "../../server/nightsky/astronomy";
import { planObservingSession, type PlannerServices } from "../../server/nightsky/planner";
import type { EventResult } from "../../shared/nightsky/events";

const index = new GeoNamesPlaceIndex([{ geonameId: 1, name: "London", asciiName: "London", alternateNames: "", latitude: 51.5, longitude: -.12, countryCode: "GB", countryName: "United Kingdom", featureClass: "P", featureCode: "PPLC", population: 8000000, timeZone: "Europe/London", modificationDate: "2026-10-01" }], "fixture");
const placeId = "place:v1:geonames:1";
const window = { startUtc: "2026-10-15T20:00:00Z", endUtc: "2026-10-16T04:00:00Z", timeZone: "Europe/London" };
const source = { name: "Fixture context", url: "https://example.test/context", attribution: "Deterministic fixture", dataClass: "context" as const };
const eventSource = { ...source, name: "NASA eclipse fixture", url: "https://eclipse.gsfc.nasa.gov/fixture" };
const eventCaveat = "Fixture event inventory covers only supported event classes.";
function events(): EventResult {
  return { availability: { status: "partial", reason: "Only supported classes checked." }, sources: [eventSource], caveats: [eventCaveat], placeId, window, events: [], unsupportedEventTypes: ["comet"] };
}
function services(searchEvents: PlannerServices["searchEvents"] = async () => events()): PlannerServices {
  return { index, getAstronomy: (p,w) => getAstronomyWindow(p,w,index), getTargetVisibility: (p,t,w) => getTargetVisibility(t,p,w,index),
    getNightConditions: async () => ({ availability: { status: "out-of-horizon", reason: "No forecast" }, sources: [source], caveats: [], placeId, window, forecasts: [], nightContext: { darkness: { status: "unknown", reason: "Fixture" }, forecastStepsDuringDarkness: [] } }),
    searchEvents, getLocationContext: async () => ({ availability: { status: "unknown", reason: "Fixture" }, sources: [source], caveats: [], placeId, access: { status: "unknown" }, groundLightContext: { status: "unknown", reason: "Fixture" } }) };
}

for (const activity of ["learning", "astrophotography", "moon-observing"] as const) {
  test(`${activity} omits unused empty event inventory and its sources`, async () => {
    const result = await planObservingSession({ placeId, window, activity }, services());
    assert.equal(result.factors.some(f => /sky events/i.test(f.name)), false);
    assert.equal(result.evidence.events, undefined);
    assert.equal(result.gaps.some(g => /event classes|sky events/i.test(g)), false);
    assert.equal(result.sources.some(s => s.url === eventSource.url), false);
    assert.equal(result.caveats.includes(eventCaveat), false);
    assert.ok(result.factors.some(f => f.name === "Weather forecast" && f.impact === "unknown"));
    assert.ok(result.factors.some(f => f.name === "Historical context" && f.impact === "unknown"));
    assert.ok(result.factors.some(f => f.name === "Site access" && f.impact === "unknown"));
  });
  test(`${activity} does not turn optional event lookup failure into an event claim`, async () => {
    const result = await planObservingSession({ placeId, window, activity }, services(async () => { throw new Error("Offline event provider"); }));
    assert.equal(result.factors.some(f => /sky events/i.test(f.name)), false);
    assert.equal(result.gaps.some(g => /sky events|event lookup/i.test(g)), false);
    assert.equal(result.evidence.events, undefined);
    assert.equal(result.availability.status, "partial");
  });
}
for (const activity of ["meteor-shower", "eclipse"] as const) {
  test(`${activity} retains empty event coverage and its source`, async () => {
    const supplied = events();
    const result = await planObservingSession({ placeId, window, activity }, services(async () => supplied));
    assert.ok(result.factors.some(f => /sky events/i.test(f.name) && /No supported matching event/.test(f.assessment)));
    assert.deepEqual(result.evidence.events, supplied);
    assert.ok(result.sources.some(s => s.url === eventSource.url));
    assert.ok(result.gaps.some(g => /Event classes not covered/.test(g)));
    assert.ok(result.caveats.includes(eventCaveat));
  });
  test(`${activity} retains failed event coverage as unknown`, async () => {
    const result = await planObservingSession({ placeId, window, activity }, services(async () => { throw new Error("Offline event provider"); }));
    assert.ok(result.factors.some(f => /sky events/i.test(f.name) && f.impact === "unknown"));
    assert.ok(result.gaps.some(g => /Sky events could not be checked/.test(g)));
  });
}
test("learning retains a positive event with source and coverage", async () => {
  const supplied = { ...events(), events: [{ eventId: "eclipse:fixture", name: "Fixture eclipse", eventType: "eclipse" as const, localVisibility: "not-evaluated" as const, source: eventSource }] };
  const result = await planObservingSession({ placeId, window, activity: "learning" }, services(async () => supplied));
  assert.ok(result.factors.some(f => f.name === "Sky events" && /Fixture eclipse/.test(f.assessment)));
  assert.deepEqual(result.evidence.events, supplied);
  assert.ok(result.sources.some(s => s.url === eventSource.url));
  assert.ok(result.gaps.some(g => /Event classes not covered/.test(g)));
  assert.ok(result.caveats.includes(eventCaveat));
});
