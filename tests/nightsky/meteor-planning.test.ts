import assert from "node:assert/strict";
import test from "node:test";
import { GeoNamesPlaceIndex } from "../../server/places/geonames";
import { getAstronomyWindow, getTargetVisibility } from "../../server/nightsky/astronomy";
import { planObservingSession, type PlannerServices } from "../../server/nightsky/planner";
import { searchSkyEvents } from "../../server/events/catalog";
const index = new GeoNamesPlaceIndex([{ geonameId: 1, name: "London", asciiName: "London", alternateNames: "", latitude: 51.5, longitude: -.12, countryCode: "GB", countryName: "United Kingdom", featureClass: "P", featureCode: "PPLC", population: 8000000, timeZone: "Europe/London", modificationDate: "2026-10-01" }], "fixture");
const placeId = "place:v1:geonames:1";
const window = { startUtc: "2026-08-11T20:00:00Z", endUtc: "2026-08-12T04:00:00Z", timeZone: "Europe/London" };
const source = { name: "Fixture", url: "https://example.test/source", attribution: "Fixture", dataClass: "context" as const };
test("IGN civil guidance remains qualified and its 2026 maximum does not recur", async () => {
  for (const year of [2026, 2027]) {
    const w = { ...window, startUtc: `${year}-04-22T18:07:00Z`, endUtc: `${year}-04-23T03:11:00Z` };
    const result = await planObservingSession({ placeId, window: w, activity: "meteor-shower", target: "LYR" }, {
      ...services(), searchEvents: (p, win) => searchSkyEvents({ placeId: p, window: win, eventTypes: ["meteor-shower"] }, index),
    });
    const guidance = result.evidence!.events!.meteorCivilGuidance!.find(row => row.code === "LYR")!;
    assert.equal(guidance.maximumTimeBasis, "UT-as-published");
    assert.equal(guidance.startMonthDay, "04-16");
    assert.equal(guidance.requestedWindowOverlap, "not-evaluated");
    assert.ok(!Object.hasOwn(guidance, "peakUtc"));
    assert.equal(result.evidence!.events!.events.length, 0);
    const factor = result.factors.find(row => row.name === "Meteor civil calendar guidance")!;
    assert.equal(factor.impact, "unknown");
    assert.match(factor.assessment, year === 2026 ? /19:40 universal time/ : /does not apply/);
    const samples = result.evidence!.meteorRadiantSamples!;
    assert.equal(samples.length, 38);
    assert.equal(samples.at(-1)!.status === "available" ? samples.at(-1)!.evaluatedAt : undefined, `${year}-04-23T03:11:00.000Z`);
  }
});

test("radiant sampling is bounded to 97 points for the maximum 24-hour request", async () => {
  const result = await planObservingSession({ placeId, window: { ...window, endUtc: "2026-08-12T20:00:00Z" }, activity: "meteor-shower", target: "PER" }, services());
  assert.equal(result.evidence!.meteorRadiantSamples!.length, 97);
  assert.match(result.caveats.join(" "), /do not establish continuous visibility/);
});
function services(): PlannerServices {
  return { index, getAstronomy: (p,w) => getAstronomyWindow(p,w,index), getTargetVisibility: (p,t,w) => getTargetVisibility(t,p,w,index), getNightConditions: async () => ({ availability: { status: "out-of-horizon", reason: "No forecast" }, sources: [source], caveats: [], placeId, window, forecasts: [], nightContext: { darkness: { status: "unknown", reason: "Fixture" }, forecastStepsDuringDarkness: [] } }), searchEvents: async () => ({ availability: { status: "unsupported", reason: "Full-season catalog rights remain open" }, sources: [source], caveats: [], placeId, window, events: [], unsupportedEventTypes: ["meteor-shower"] }), getLocationContext: async () => ({ availability: { status: "unknown", reason: "Fixture" }, sources: [source], caveats: [], placeId, access: { status: "unknown" }, groundLightContext: { status: "unknown", reason: "Fixture" } }) };
}
test("explicit Perseids gives bounded 15-minute radiant samples without substituting a season catalog", async () => {
  const result = await planObservingSession({ placeId, window, activity: "meteor-shower", target: "Perseids" }, services());
  const samples = result.evidence!.meteorRadiantSamples!;
  assert.equal(samples.length, 33);
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
  const choice = result.gaps.find(gap => /choose.*reviewed shower/i.test(gap));
  assert.ok(choice);
  for (const code of ["PER", "GEM", "ORI", "ETA", "LYR", "SDA", "QUA", "LEO", "CAP", "HYD", "NTA", "STA"]) {
    assert.ok(new RegExp(`\\b${code}\\b`).test(choice), `Missing selectable reviewed code ${code}`);
  }
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

test("a reviewed 2026 peak remains exact in the plan while full activity-season coverage stays a gap", async () => {
  const peakWindow = { startUtc: "2026-12-14T12:30:00Z", endUtc: "2026-12-14T23:30:00Z", timeZone: "Europe/London" };
  const result = await planObservingSession({ placeId, window: peakWindow, activity: "meteor-shower" }, {
    ...services(),
    searchEvents: (p, w) => searchSkyEvents({ placeId: p, window: w, eventTypes: ["meteor-shower"] }, index),
  });
  assert.equal(result.evidence!.events!.events[0]!.peakUtc, "2026-12-14T13:00:00Z");
  assert.equal(result.evidence!.events!.events[0]!.activityCalendarDateWindow, undefined);
  assert.equal(result.evidence!.meteorRadiantSamples!.length, 45);
  assert.ok(result.sources.some(row => row.vintage === "NASA-MEO-2026-issued-2025-10-17"));
  assert.ok(result.gaps.some(row => /enabled meteor calendar supplies year-specific forecast maxima/i.test(row)));
  assert.equal(result.factors.find(row => row.name === "Meteor shower and sky events")!.impact, "unknown");
});

test("qualified Andromedid annual guidance reaches a plan without inventing an event or radiant", async () => {
  const annualWindow = { startUtc: "2028-01-02T20:00:00Z", endUtc: "2028-01-03T04:00:00Z", timeZone: "Europe/London" };
  const result = await planObservingSession({ placeId, window: annualWindow, activity: "meteor-shower", target: "AND" }, {
    ...services(), searchEvents: (p, w) => searchSkyEvents({ placeId: p, window: w, eventTypes: ["meteor-shower"] }, index),
  });
  const guidance = result.evidence!.events!.meteorCalendarGuidance!.entries.find(row => row.code === "AND");
  assert.ok(guidance, "Andromedid annual guidance missing from composed evidence");
  assert.match(guidance.caveat, /most years/i);
  assert.equal(guidance.requestedWindowOverlap, "not-evaluated");
  assert.deepEqual(result.evidence!.events!.events, []);
  assert.ok(result.evidence!.meteorRadiantSamples!.every(sample => sample.status !== "available" && !("altitudeDeg" in sample)));
  assert.ok(result.sources.some(row => row.url === "https://www.emeteornews.net/2021/12/01/andromedid-activity-in-2021/"));
  assert.equal(result.availability.status, "partial");
});

test("an independently referenced below-horizon eclipse is an unfavorable event factor", async () => {
  const eclipseWindow = { startUtc: "2026-03-03T08:00:00Z", endUtc: "2026-03-03T16:00:00Z", timeZone: "Europe/London" };
  const result = await planObservingSession({ placeId, window: eclipseWindow, activity: "eclipse" }, {
    ...services(), searchEvents: (p, w) => searchSkyEvents({ placeId: p, window: w, eventTypes: ["eclipse"] }, index),
  });
  assert.equal(result.evidence!.events!.events[0]!.localVisibility, "not-visible");
  assert.equal(result.factors.find(row => row.name === "Sky events")!.impact, "unfavorable");
});

test("additional reviewed shower names and codes reach their own bounded radiant models", async () => {
  for (const [target, code, date] of [
    ["Alpha Capricornids", "CAP", "2026-07-30"],
    ["Northern Taurids", "NTA", "2026-11-13"],
    ["Southern Taurids", "STA", "2026-11-04"],
    ["Sigma Hydrids", "HYD", "2026-12-08"],
  ]) {
    for (const selection of [target, code]) {
      const result = await planObservingSession({ placeId, activity: "meteor-shower", target: selection,
        window: { startUtc: `${date}T20:00:00Z`, endUtc: `${date}T23:00:00Z`, timeZone: "Europe/London" } }, services());
      assert.equal(result.evidence!.meteorRadiantSamples!.length, 13, selection);
      assert.ok(result.evidence!.meteorRadiantSamples!.every(sample => sample.status === "available" && sample.code === code), selection);
      assert.equal(result.availability.status, "partial");
      assert.ok(result.gaps.some(gap => /full-season|season catalog/i.test(gap)));
    }
  }
});
