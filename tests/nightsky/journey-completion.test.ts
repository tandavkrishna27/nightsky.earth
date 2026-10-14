import assert from "node:assert/strict";
import test from "node:test";
import { GeoNamesPlaceIndex } from "../../server/places/geonames";
import { getAstronomyWindow, getTargetVisibility } from "../../server/nightsky/astronomy";
import { planObservingSession, type PlannerServices } from "../../server/nightsky/planner";
import { compareObservingOptions } from "../../server/nightsky/compare";
import { assertStructuredResultSize, MAX_STRUCTURED_RESULT_BYTES } from "../../shared/nightsky/common";
import { composeCandidateWindows } from "../../server/nightsky/windows";
import { suggestVisibleTargets } from "../../server/nightsky/suggestions";

const index = new GeoNamesPlaceIndex([{ geonameId: 1, name: "London", asciiName: "London", alternateNames: "", latitude: 51.5, longitude: -.12, countryCode: "GB", countryName: "United Kingdom", featureClass: "P", featureCode: "PPLC", population: 8000000, timeZone: "Europe/London", modificationDate: "2026-10-01" }], "fixture");
const placeId = "place:v1:geonames:1";
const window = { startUtc: "2026-10-15T18:00:00Z", endUtc: "2026-10-16T06:00:00Z", timeZone: "Europe/London" };
const source = { name: "Fixture model", url: "https://example.test/model", attribution: "Fixture", dataClass: "forecast" as const, issuedAt: "2026-10-15T12:00:00Z" };

test("real split darkness preserves the evening Milky Way opportunity and excludes the daylight gap", async () => {
  const equator = new GeoNamesPlaceIndex([[2, "Equatorial fixture", "Equatorial fixture", "", 0, 0, "GH", "Ghana", 1, "Africa/Accra"]], "split-darkness-fixture");
  const place = { placeId: "place:v1:geonames:2", timeZone: "Africa/Accra" };
  const day = { startUtc: "2026-10-15T00:00:00Z", endUtc: "2026-10-16T00:00:00Z", timeZone: place.timeZone };
  const astronomy = await getAstronomyWindow(place, day, equator);
  const target = await getTargetVisibility("Milky Way core", place, day, equator);
  const photography = composeCandidateWindows("astrophotography", day, astronomy, [target], undefined);
  assert.equal(photography.length, 1);
  assert.equal(photography[0]!.window.startUtc.slice(0, 16), "2026-10-15T18:58");
  assert.equal(photography[0]!.window.endUtc.slice(0, 16), "2026-10-15T22:09");
  const darkWindows = composeCandidateWindows("meteor-shower", day, astronomy, [], undefined);
  assert.equal(darkWindows.length, 2);
  assert.equal(darkWindows[0]!.window.endUtc.slice(0, 16), "2026-10-15T04:33");
  assert.equal(darkWindows[1]!.window.startUtc.slice(0, 16), "2026-10-15T18:58");
  assert.ok(darkWindows.every(candidate => !(candidate.window.startUtc < "2026-10-15T12:00:00Z" && candidate.window.endUtc > "2026-10-15T12:00:00Z")));
  assertStructuredResultSize({ photography, darkWindows });
  const multipleDays = { ...day, endUtc: "2026-10-20T00:00:00Z" };
  const multipleAstronomy = await getAstronomyWindow(place, multipleDays, equator);
  const multipleTarget = await getTargetVisibility("Milky Way core", place, multipleDays, equator);
  const bounded = composeCandidateWindows("astrophotography", multipleDays, multipleAstronomy, [multipleTarget, multipleTarget], undefined);
  assert.equal(bounded.length, 8);
  assertStructuredResultSize(bounded);
  const suggestions = await suggestVisibleTargets("astrophotography", place, day, { ...services(), index: equator }, astronomy);
  assert.equal(suggestions[0]?.target.name, "Milky Way core");
  assert.ok(suggestions.length <= 3);
});

test("explicit empty threshold rows override a legacy first-darkness interval", async () => {
  const astronomy = await getAstronomyWindow({ placeId, timeZone: window.timeZone }, window, index);
  assert.deepEqual(composeCandidateWindows("meteor-shower", window, { ...astronomy, solarThresholdIntervals: [] }, [], undefined), []);
  const { solarThresholdIntervals, ...legacy } = astronomy;
  assert.equal(composeCandidateWindows("meteor-shower", window, legacy as typeof astronomy, [], undefined).length, 1);
});
function services(): PlannerServices {
  return { index, getAstronomy: (p, w) => getAstronomyWindow(p, w, index), getTargetVisibility: (p, t, w) => getTargetVisibility(t, p, w, index),
    getNightConditions: async () => ({ availability: { status: "partial", reason: "Sparse model" }, sources: [source], caveats: [], placeId, window, forecasts: [{ availability: { status: "partial", reason: "Sparse model" }, source, forecastHorizonHours: 48, samples: [{ validAt: "2026-10-15T22:00:00Z", values: { totalCloudCover: { value: 12, unit: "%" } } }], missingFields: [] }], nightContext: { darkness: { status: "unknown", reason: "Fixture" }, forecastStepsDuringDarkness: [] } }),
    searchEvents: async () => ({ availability: { status: "available", reason: "Fixture" }, sources: [{ ...source, dataClass: "catalog" }], caveats: [], placeId, window, events: [], unsupportedEventTypes: ["comet"] }),
    getLocationContext: async () => ({ availability: { status: "unknown", reason: "Fixture" }, sources: [{ ...source, dataClass: "context" }], caveats: [], placeId, access: { status: "unknown" }, groundLightContext: { status: "unknown", reason: "Fixture" } }) };
}
test("automatic supported targets are locally visible, bounded, and timed beginner guidance survives", async () => {
  const result = await planObservingSession({ placeId, window, activity: "general-stargazing", experience: "beginner" }, services());
  assert.ok(result.suggestions!.length >= 1 && result.suggestions!.length <= 3);
  assert.ok(result.suggestions!.every(target => target.intervals.length > 0));
  assert.ok(result.timedPreparation!.some(step => /20|30/.test(step.instruction)));
  assert.equal(result.evidence!.weather!.forecasts[0]!.samples[0]!.values.totalCloudCover!.value, 12);
  assert.equal(result.evidence!.weather!.forecasts[0]!.source.issuedAt, source.issuedAt);
});
test("Moon observing windows follow Moon geometry and sparse cloud values never become a weather interval", async () => {
  const result = await planObservingSession({ placeId, window, activity: "moon-observing" }, services());
  assert.ok(result.candidateWindows.every(candidate => !/darkness is required/.test(candidate.rationale)));
  assert.ok(result.candidateWindows.every(candidate => candidate.weatherCoverage === "unknown"));
  assert.ok(result.gaps.some(gap => /sparse|interval/i.test(gap)));
  assert.ok(result.candidateWindows.every(candidate => candidate.weatherIntervals!.length === 0));
});
test("activity windows intersect exact per-model cloud periods with target geometry", async () => {
  const svc = services(), original = svc.getNightConditions;
  svc.getNightConditions = async (...args) => {
    const result = await original(...args);
    result.forecasts[0]!.samples[0]!.values.totalCloudCover = { value: 12, unit: "%", periodStartUtc: "2026-10-15T22:00:00Z", periodEndUtc: "2026-10-15T23:00:00Z" };
    return result;
  };
  const result = await planObservingSession({ placeId, window, activity: "planet-observing", target: "Jupiter" }, svc);
  for (const candidate of result.candidateWindows) for (const interval of candidate.weatherIntervals!) {
    assert.ok(Date.parse(interval.window.startUtc) >= Date.parse(candidate.window.startUtc));
    assert.ok(Date.parse(interval.window.endUtc) <= Date.parse(candidate.window.endUtc));
    assert.equal(result.evidence!.weather!.forecasts[interval.forecastIndex]!.samples[interval.sampleIndex]!.values.totalCloudCover!.value, 12);
  }
});
test("comparison retains exact per-option evidence, availability, gaps, and windows", async () => {
  const result = await compareObservingOptions({ options: [{ placeId, window, activity: "moon-observing" }, { placeId, window, activity: "planet-observing", target: "Jupiter" }] }, services());
  assert.ok(result.comparisons.every(option => option.availability && option.gaps && option.candidateWindows && option.evidence));
  assert.equal(result.comparisons[0]!.evidence!.weather!.forecasts[0]!.samples[0]!.values.totalCloudCover!.value, 12);
});
test("five full hourly four-provider options fit the bounded budget with exact provenance", async (t) => {
  const svc = services();
  const original = svc.getNightConditions;
  svc.getNightConditions = async (...args) => {
    const weather = await original(...args);
    weather.forecasts = Array.from({ length: 4 }, (_, provider) => ({ ...weather.forecasts[0]!, source: { ...source, name: `Model ${provider}`, attribution: "a".repeat(500), product: "p".repeat(160), model: "m".repeat(160), vintage: "v".repeat(100) }, samples: Array.from({ length: 48 }, (_, sample) => ({ validAt: new Date(Date.parse(window.startUtc) + sample * 15 * 60000).toISOString(), values: Object.fromEntries(["totalCloudCover", "lowCloudCover", "mediumCloudCover", "highCloudCover", "precipitationProbability", "precipitationAmount", "windSpeed", "windGust", "windDirection", "temperature", "dewPoint", "relativeHumidity", "visibility"].map(field => [field, { value: 12, unit: field.includes("Cloud") ? "%" : "native", periodStartUtc: window.startUtc, periodEndUtc: window.endUtc }])) })) }));
    return weather;
  };
  const result = await compareObservingOptions({ options: Array.from({ length: 5 }, () => ({ placeId, window, activity: "general-stargazing" })) }, svc);
  assert.equal(result.comparisons.length, 5);
  assert.equal(result.comparisons[4]!.evidence!.weather!.forecasts[3]!.samples.length, 48);
  assert.ok(result.comparisons[4]!.sources.some(item => item.model === "m".repeat(160)));
  assertStructuredResultSize(result);
  t.diagnostic(`Exact five-option evidence bytes: ${new TextEncoder().encode(JSON.stringify(result)).byteLength}`);
});
test("unique native values and periods remain exact through all five options", async (t) => {
  const svc = services(), original = svc.getNightConditions;
  svc.getNightConditions = async (...args) => {
    const weather = await original(...args);
    weather.forecasts = Array.from({ length: 4 }, (_, provider) => ({ ...weather.forecasts[0]!, source: { ...source, name: `Unique model ${provider}` }, samples: Array.from({ length: 48 }, (_, sample) => ({ validAt: new Date(Date.parse(window.startUtc) + sample * 15 * 60000).toISOString(), values: Object.fromEntries(["totalCloudCover", "lowCloudCover", "mediumCloudCover", "highCloudCover", "precipitationProbability", "precipitationAmount", "windSpeed", "windGust", "windDirection", "temperature", "dewPoint", "relativeHumidity", "visibility"].map((field, fieldIndex) => [field, { value: sample + provider + fieldIndex / 17, unit: "native".repeat(5), periodStartUtc: new Date(Date.parse(window.startUtc) + sample * 15 * 60000 + fieldIndex).toISOString(), periodEndUtc: new Date(Date.parse(window.startUtc) + (sample + 1) * 15 * 60000 + fieldIndex).toISOString() }])) })) }));
    return weather;
  };
  const result = await compareObservingOptions({ options: Array.from({ length: 5 }, () => ({ placeId, window, activity: "general-stargazing" })) }, svc);
  assert.equal(result.comparisons[4]!.evidence!.weather!.forecasts[3]!.samples[47]!.values.visibility!.value, 50 + 12 / 17);
  assertStructuredResultSize(result);
  t.diagnostic(`Unique native five-option evidence bytes: ${new TextEncoder().encode(JSON.stringify(result)).byteLength}`);
});
test("above-budget evidence fails explicitly rather than discarding source records", () => {
  assert.throws(() => assertStructuredResultSize({ sources: [{ attribution: "x".repeat(MAX_STRUCTURED_RESULT_BYTES) }] }), /Structured result.*maximum/);
});
test("eclipse plan preserves all three authoritative solar safety instructions", async () => {
  const result = await planObservingSession({ placeId, window, activity: "eclipse" }, services());
  assert.ok(result.preparation.some(item => /ISO 12312-2/.test(item)));
  assert.ok(result.preparation.some(item => /front aperture/.test(item)));
  assert.ok(result.preparation.some(item => /before any bright solar surface returns/.test(item)));
  assert.ok(result.sources.some(item => item.name === "NASA Eclipse Eye Safety"));
});
const journeys = [
  ["casual beginner", "general-stargazing", undefined, "suggestions"],
  ["curious beginner", "learning", undefined, "suggestions"],
  ["family educator", "general-stargazing", undefined, "timed"],
  ["urban observer", "planet-observing", undefined, "suggestions"],
  ["meteor watcher", "meteor-shower", undefined, "radiant"],
  ["Milky Way photographer", "astrophotography", "Milky Way core", "target"],
  ["aspiring photographer", "astrophotography", undefined, "seeing"],
  ["deep sky imager", "deep-sky-imaging", "M31", "unsupported"],
  ["visual telescope observer", "visual-stargazing", "M31", "unsupported"],
  ["planet Moon observer", "moon-observing", undefined, "suggestions"],
  ["aurora chaser", "aurora", undefined, "aurora"],
  ["eclipse observer", "eclipse", undefined, "eclipse"],
  ["months ahead traveler", "general-stargazing", undefined, "history"],
  ["changed forecast", "general-stargazing", undefined, "weather"],
  ["access needs", "general-stargazing", undefined, "access"],
] as const;
for (const [name, activity, target, expected] of journeys) test(`journey matrix: ${name} exposes enabled evidence or explicit coverage gap`, async () => {
  const result = await planObservingSession({ placeId, window, activity, target, experience: "beginner" }, services());
  if (expected === "suggestions") assert.ok(result.suggestions!.length);
  if (expected === "timed") assert.ok(result.timedPreparation!.some(step => /Families|children/.test(step.instruction)));
  if (expected === "target") assert.equal(result.evidence!.target!.target.name, "Milky Way core");
  if (["radiant", "seeing", "unsupported", "eclipse"].includes(expected)) assert.ok(result.gaps.some(gap => new RegExp(expected === "unsupported" ? "unsupported" : expected, "i").test(gap)));
  if (expected === "aurora") assert.ok(result.factors.some(factor => /Aurora outlook/.test(factor.name) && /Unsupported/.test(factor.assessment)));
  if (expected === "history") assert.ok(result.factors.some(factor => /Historical context/.test(factor.name) && /Unsupported/.test(factor.assessment)));
  if (expected === "weather") assert.equal(result.evidence!.weather!.forecasts[0]!.source.issuedAt, source.issuedAt);
  if (expected === "access") assert.equal(result.evidence!.location!.access.status, "unknown");
});

test("enabled optional services that fail expose unavailable gaps instead of disabled capability claims", async () => {
  const svc = services();
  const fail = async (): Promise<never> => { throw new Error("Fixture unavailable"); };
  svc.searchCandidates = fail; svc.getClimatology = fail; svc.getAuroraOutlook = fail; svc.getLocationContext = fail;
  const result = await planObservingSession({ placeId, window, activity: "aurora" }, svc);
  for (const name of ["Nearby observing places", "Historical context", "Aurora outlook", "Site access"]) {
    assert.ok(result.factors.some(factor => factor.name === name && /Unavailable/.test(factor.assessment)), name);
  }
  for (const pattern of [/candidate.*failed/i, /historical.*failed/i, /aurora.*failed/i, /access.*failed/i]) assert.ok(result.gaps.some(gap => pattern.test(gap)), String(pattern));
});

test("conflicting forecasts preserve distinct issue times, valid times and native values in comparison evidence", async () => {
  const svc = services(), original = svc.getNightConditions;
  svc.getNightConditions = async (...args) => {
    const result = await original(...args);
    result.forecasts.push({ ...result.forecasts[0]!, source: { ...source, name: "Second fixture model", issuedAt: "2026-10-15T15:00:00Z", validStartUtc: "2026-10-15T23:00:00Z", validEndUtc: "2026-10-15T23:00:00Z" }, samples: [{validAt:"2026-10-15T23:00:00Z",values:{totalCloudCover:{value:90,unit:"%"}}}] });
    return result;
  };
  const result=await compareObservingOptions({options:[{placeId,window,activity:"astrophotography",target:"Milky Way core"},{placeId,window,activity:"moon-observing",target:"Moon"}]},svc);
  for(const option of result.comparisons) {
    const forecasts=option.evidence!.weather!.forecasts;
    assert.deepEqual(forecasts.map(item=>item.samples[0]!.values.totalCloudCover!.value),[12,90]);
    assert.deepEqual(forecasts.map(item=>item.samples[0]!.validAt),["2026-10-15T22:00:00Z","2026-10-15T23:00:00Z"]);
    assert.deepEqual(forecasts.map(item=>item.source.issuedAt),["2026-10-15T12:00:00Z","2026-10-15T15:00:00Z"]);
    assert.ok(option.factors.some(item=>item.name.includes("Second fixture model")&&item.assessment.includes("90 %")));
    assert.ok(option.factors.some(item=>item.name.includes("Fixture model")&&item.assessment.includes("12 %")));
  }
});
