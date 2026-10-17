import assert from "node:assert/strict";
import test from "node:test";
import { GeoNamesPlaceIndex } from "../../server/places/geonames";
import { getAstronomyWindow, getTargetVisibility } from "../../server/nightsky/astronomy";
import { planObservingSession, type PlannerServices } from "../../server/nightsky/planner";
import type { EventResult } from "../../shared/nightsky/events";
import { searchSkyEvents } from "../../server/events/catalog";

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

test("learning retains a calculated elongation without inferring local visibility", async () => {
  const elongationWindow = { startUtc: "2026-08-15T04:00:00Z", endUtc: "2026-08-15T08:00:00Z", timeZone: "Europe/London" };
  const supplied = await searchSkyEvents({ placeId, window: elongationWindow, eventTypes: ["greatest-elongation"] }, index);
  assert.equal(supplied.events.length, 1);
  const result = await planObservingSession({ placeId, window: elongationWindow, activity: "learning" }, services(async () => supplied));
  assert.deepEqual(result.evidence.events, supplied);
  assert.equal(result.evidence.events?.events[0].localVisibility, "not-evaluated");
  assert.deepEqual(result.evidence.events?.events[0].greatestElongation?.body, "Venus");
  assert.ok(result.factors.some(f => f.name === "Sky events" && f.impact === "unknown"));
  assert.ok(result.sources.some(s => s.url === supplied.events[0].source.url));
});

test("learning retains a sourced planet-pair conjunction without favorable visibility", async () => {
  const pairWindow = { startUtc: "2026-06-09T10:00:00Z", endUtc: "2026-06-09T14:00:00Z", timeZone: "Europe/London" };
  const supplied = await searchSkyEvents({ placeId, window: pairWindow, eventTypes: ["planetary-conjunction"] }, index);
  const pair = supplied.events.find(event => event.pairConjunction);
  assert.ok(pair, "calculated pair event is present");
  assert.deepEqual(pair.pairConjunction?.bodies, ["Venus", "Jupiter"]);
  const result = await planObservingSession({ placeId, window: pairWindow, activity: "learning" }, services(async () => supplied));
  assert.deepEqual(result.evidence.events, supplied);
  assert.equal(pair.localVisibility, "not-evaluated");
  assert.ok(result.factors.some(f => f.name === "Sky events" && f.impact === "unknown"));
  assert.ok(result.sources.some(source => source.url === pair.source.url));
});

test("pair planning keeps local daylight geometry separate from missing forecast and crossing", async () => {
  const pairWindow = { startUtc: "2026-06-09T10:00:00Z", endUtc: "2026-06-09T14:00:00Z", timeZone: "Europe/London" };
  const supplied = await searchSkyEvents({ placeId, window: pairWindow, eventTypes: ["planetary-conjunction"] }, index);
  const result = await planObservingSession({ placeId, window: pairWindow, activity: "planet-observing" }, services(async () => supplied));
  assert.ok(result.evidence?.conjunctionWindows?.length, "local geometry missing");
  const geometry = result.evidence.conjunctionWindows[0];
  assert.ok(geometry.samples.every(sample => sample.sunAltitudeDeg > 0));
  assert.equal(geometry.continuousVisibility, "not-established");
  assert.equal(geometry.detectability, "not-assessed");
  assert.equal(result.evidence.weather?.forecasts.length, 0);
  assert.ok(result.gaps.some(gap => gap.includes("conjunction") && gap.includes("forecast")));
  assert.deepEqual(result.evidence.events, supplied);
});

for (const status of ["available", "stale"] as const) test(`conjunction keeps ${status} three-hour forecast evidence source-native`, async () => {
  const pairWindow = { startUtc: "2026-06-09T10:00:00Z", endUtc: "2026-06-09T14:00:00Z", timeZone: "Europe/London" };
  const supplied = await searchSkyEvents({ placeId, window: pairWindow, eventTypes: ["planetary-conjunction"] }, index);
  const providers = services(async () => supplied);
  const forecastSource = { ...source, name: "Three-hour fixture", dataClass: "forecast" as const };
  const samples = ["2026-06-09T10:00:00Z", "2026-06-09T13:00:00Z"].map(validAt => ({ validAt, values: { totalCloudCover: { value: 20, unit: "%" } } }));
  providers.getNightConditions = async () => ({ availability: { status, reason: "Fixture" }, sources: [forecastSource], caveats: [], placeId, window: pairWindow, forecasts: [{ availability: { status, reason: "Fixture" }, source: forecastSource, forecastHorizonHours: 24, samples, missingFields: [] }], nightContext: { darkness: { status: "unknown", reason: "Fixture" }, forecastStepsDuringDarkness: [] } });
  const result = await planObservingSession({ placeId, window: pairWindow, activity: "planet-observing" }, providers);
  assert.deepEqual(result.evidence.weather?.forecasts[0].samples, samples);
  assert.equal(result.gaps.some(gap => gap.startsWith("Local conjunction weather is unknown")), status === "stale");
  assert.ok(!result.factors.find(factor => factor.name === "Local conjunction geometry")?.assessment.includes("hourly"));
});

test("planner caps local pair geometry at six and keeps omitted event evidence", async () => {
  const pairWindow = { startUtc: "2026-06-09T10:00:00Z", endUtc: "2026-06-09T14:00:00Z", timeZone: "Europe/London" };
  const supplied = await searchSkyEvents({ placeId, window: pairWindow, eventTypes: ["planetary-conjunction"] }, index);
  const pair = supplied.events.find(event => event.pairConjunction)!;
  supplied.events = Array.from({ length: 7 }, (_, i) => ({ ...pair, eventId: `fixture:pair:${i}` }));
  const result = await planObservingSession({ placeId, window: pairWindow, activity: "planet-observing" }, services(async () => supplied));
  assert.equal(result.evidence.conjunctionWindows?.length, 6);
  assert.equal(result.evidence.events?.events.length, 7);
  assert.ok(result.gaps.some(gap => gap.includes("first six")));
  assert.deepEqual(result.evidence.conjunctionWindows?.map(row => row.eventId), supplied.events.slice(0, 6).map(event => event.eventId));
});

test("local pair samples follow selected point coordinates", async () => {
  const pairWindow = { startUtc: "2026-06-09T10:00:00Z", endUtc: "2026-06-09T14:00:00Z", timeZone: "Europe/London" };
  const supplied = await searchSkyEvents({ placeId, window: pairWindow, eventTypes: ["planetary-conjunction"] }, index);
  const oppositeIndex = new GeoNamesPlaceIndex([{ geonameId: 1, name: "Opposite fixture point", asciiName: "Opposite", alternateNames: "", latitude: -51.5, longitude: 179.88, countryCode: "GB", countryName: "United Kingdom", featureClass: "P", featureCode: "PPL", population: 1, timeZone: "Europe/London", modificationDate: "2026-10-01" }], "fixture");
  const providers = services(async () => supplied);
  providers.index = oppositeIndex;
  const result = await planObservingSession({ placeId, window: pairWindow, activity: "planet-observing" }, providers);
  assert.ok(result.evidence.conjunctionWindows?.[0].samples.every(sample => sample.sunAltitudeDeg < 0));
});

test("planner rejects a window over 24 hours before requesting evidence", async () => {
  let calls = 0;
  const providers = services(async () => { calls++; return events(); });
  await assert.rejects(planObservingSession({ placeId, window: { ...window, endUtc: "2026-10-17T04:00:00Z" }, activity: "planet-observing" }, providers), /24 hours/);
  assert.equal(calls, 0);
});
