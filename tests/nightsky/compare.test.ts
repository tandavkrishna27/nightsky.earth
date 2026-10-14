import assert from "node:assert/strict";
import test from "node:test";
import { compareObservingOptions } from "../../server/nightsky/compare";
import { GeoNamesPlaceIndex } from "../../server/places/geonames";
import type { PlannerServices } from "../../server/nightsky/planner";
import type { TimeWindow, SourceRecord } from "../../shared/nightsky/common";
import type { NightConditionsResult } from "../../shared/nightsky/weather";
import type { AstronomyWindowResult } from "../../shared/nightsky/astronomy";
import type { EventResult } from "../../shared/nightsky/events";

const cities = [
  { geonameId: 1, name: "London", asciiName: "London", alternateNames: "", latitude: 51.5, longitude: -0.12, countryCode: "GB", countryName: "United Kingdom", featureClass: "P" as const, featureCode: "PPLC", population: 8_000_000, timeZone: "Europe/London", modificationDate: "2026-10-01" },
  { geonameId: 2, name: "Pune", asciiName: "Pune", alternateNames: "", latitude: 18.5, longitude: 73.8, countryCode: "IN", countryName: "India", featureClass: "P" as const, featureCode: "PPL", population: 3_000_000, timeZone: "Asia/Kolkata", modificationDate: "2026-10-01" },
];
const index = new GeoNamesPlaceIndex(cities, "comparison-fixture");
const source: SourceRecord = { name: "Fixture astronomy", url: "https://example.test/astro", attribution: "Deterministic fixture.", dataClass: "calculation" };
const weatherSources: SourceRecord[] = [
  { name: "Model Cedar", url: "https://example.test/cedar", attribution: "Fixture model Cedar.", dataClass: "forecast" },
  { name: "Model Pine", url: "https://example.test/pine", attribution: "Fixture model Pine.", dataClass: "forecast" },
];
const makeWindow = (timeZone: string, day = "2026-11-01"): TimeWindow => ({ startUtc: `${day}T18:00:00Z`, endUtc: `${day}T23:00:00Z`, timeZone });
const placeId = (id: number) => `place:v1:geonames:${id}`;

function makeAstronomy(id: string, window: TimeWindow): AstronomyWindowResult {
  return { availability: { status: "available", reason: "Fixture calculation." }, sources: [source], caveats: [], placeId: id, window, darknessState: "full-window",
    astronomicalDarkness: { status: "available", startUtc: window.startUtc, endUtc: window.endUtc, localStart: "darkness begins", localEnd: "darkness ends" },
    solarThresholdIntervals: [], moon: { phaseAtUtc: window.startUtc, phaseDegrees: 180, illuminationPercent: 75, maximumAltitudeDegrees: 35, maximumAltitudeAtUtc: window.startUtc } };
}
function conditions(id: string, window: TimeWindow, values: Array<{ source: SourceRecord; cloud?: number }>): NightConditionsResult {
  const forecasts = values.filter(({ cloud }) => cloud !== undefined).map(({ source: forecastSource, cloud }) => ({
    availability: { status: "available" as const, reason: "Fixture value." }, source: forecastSource, forecastHorizonHours: 96,
    samples: [{ validAt: window.startUtc, values: { totalCloudCover: { value: cloud!, unit: "%" } } }], missingFields: [],
  }));
  return { availability: forecasts.length ? { status: "partial", reason: "Different model values; compare them separately." } : { status: "out-of-horizon", reason: "No forecast exists for this option date." },
    sources: values.map(({ source: item }) => item), caveats: [], placeId: id, window, forecasts,
    nightContext: { darkness: { status: "available", startUtc: window.startUtc, endUtc: window.endUtc, localStart: "dark", localEnd: "end" }, forecastStepsDuringDarkness: [] } };
}
function serviceSet(): PlannerServices {
  return {
    index,
    getAstronomy: async (place, window) => makeAstronomy(place.placeId, window),
    getNightConditions: async (id, window) => id.endsWith(":1") ? conditions(id, window, [{ source: weatherSources[0]!, cloud: 20 }, { source: weatherSources[1]!, cloud: 90 }]) : conditions(id, window, [{ source: weatherSources[0]! }]),
    searchEvents: async (id, window): Promise<EventResult> => ({ availability: { status: "available", reason: "Fixture event check." }, sources: [source], caveats: [], placeId: id, window, events: [], unsupportedEventTypes: [] }),
    getTargetVisibility: async () => { throw new Error("No target selected."); },
    getLocationContext: async (id) => ({ availability: { status: "unknown", reason: "Access unknown." }, sources: [source], caveats: [], placeId: id, groundLightContext: { status: "unknown", reason: "Unavailable." }, access: { status: "unknown", description: "Not verified." } }),
  };
}

test("comparesSourcesWithoutBlending", async () => {
  const result = await compareObservingOptions({ options: [
    { placeId: placeId(1), activity: "astrophotography", window: makeWindow("Europe/London") },
    { placeId: placeId(2), activity: "astrophotography", window: makeWindow("Asia/Kolkata") },
  ] }, serviceSet());
  const london = result.comparisons[0]!;
  const cedar = london.factors.find((factor) => factor.name === "Model Cedar cloud and precipitation forecast");
  const pine = london.factors.find((factor) => factor.name === "Model Pine cloud and precipitation forecast");
  assert.ok(cedar?.assessment.includes("20 %"));
  assert.ok(pine?.assessment.includes("90 %"));
  assert.deepEqual(cedar?.sourceNames, ["Model Cedar"]);
  assert.deepEqual(pine?.sourceNames, ["Model Pine"]);
  assert.ok(london.sources.some((record) => record.name === "Model Cedar" && record.url === "https://example.test/cedar"));
  assert.ok(london.sources.some((record) => record.name === "Model Pine" && record.url === "https://example.test/pine"));
});

test("keepsOptionWithMissingForecast", async () => {
  const result = await compareObservingOptions({ options: [
    { placeId: placeId(1), activity: "visual-stargazing", window: makeWindow("Europe/London") },
    { placeId: placeId(2), activity: "visual-stargazing", window: makeWindow("Asia/Kolkata", "2026-11-02") },
  ] }, serviceSet());
  assert.equal(result.comparisons.length, 2);
  assert.ok(result.comparisons[1]!.factors.some((factor) => /forecast/i.test(factor.name) && /out.of.horizon/i.test(factor.assessment)));
  assert.ok(result.comparisons[1]!.summary.length > 0);
});

test("explainsActivitySpecificTradeoffs", async () => {
  const result = await compareObservingOptions({ options: [
    { placeId: placeId(1), activity: "moon-observing", window: makeWindow("Europe/London") },
    { placeId: placeId(2), activity: "deep-sky-imaging", window: makeWindow("Asia/Kolkata") },
  ] }, serviceSet());
  assert.ok(result.comparisons[0]!.factors.some((factor) => factor.name === "Moon" && /lunar observing/i.test(factor.assessment)));
  assert.ok(result.comparisons[1]!.factors.some((factor) => factor.name === "Moon" && /sky background/i.test(factor.assessment)));
  assert.ok(result.comparisons.every((comparison) => comparison.summary.length > 0));
});

test("preservesSourceLinksAndLocalTimes", async () => {
  const result = await compareObservingOptions({ options: [
    { placeId: placeId(1), activity: "general-stargazing", window: makeWindow("Europe/London") },
    { placeId: placeId(2), activity: "general-stargazing", window: makeWindow("Asia/Kolkata") },
  ] }, serviceSet());
  assert.ok(result.comparisons[0]!.factors.some((factor) => /darkness begins/.test(factor.assessment)));
  assert.ok(result.comparisons[0]!.sources.some((item) => item.url.startsWith("https://")));
  assert.equal(result.comparisons[0]!.window.timeZone, "Europe/London");
  assert.equal(result.comparisons[1]!.window.timeZone, "Asia/Kolkata");
});

test("comparesFiveOptionsWithoutBlending", async () => {
  const result = await compareObservingOptions({ options: [
    { placeId: placeId(1), activity: "general-stargazing", window: makeWindow("Europe/London") },
    { placeId: placeId(2), activity: "general-stargazing", window: makeWindow("Asia/Kolkata") },
    { placeId: placeId(1), activity: "meteor-shower", window: makeWindow("Europe/London", "2026-11-02") },
    { placeId: placeId(2), activity: "astrophotography", window: makeWindow("Asia/Kolkata", "2026-11-03") },
    { placeId: placeId(1), activity: "moon-observing", window: makeWindow("Europe/London", "2026-11-04") },
  ] }, serviceSet());
  assert.equal(result.comparisons.length, 5);
  assert.deepEqual(result.comparisons.map((comparison) => comparison.placeId), [placeId(1), placeId(2), placeId(1), placeId(2), placeId(1)]);
  assert.ok(result.comparisons.every((comparison) => comparison.factors.some((factor) => /forecast/i.test(factor.name))));
});
test("comparison option failures do not disclose private paths or provider tokens", async () => {
  const services = serviceSet();
  const privateDetails = "C:/private/home/secret-artifact.json provider-token=SECRET_PRIVATE_TOKEN";
  services.index = new Proxy(services.index, { get(target, property, receiver) {
    if (property === "getById") return () => { throw new Error(privateDetails); };
    return Reflect.get(target, property, receiver);
  } });
  const result = await compareObservingOptions({ options: [
    { placeId: placeId(1), activity: "general-stargazing", window: makeWindow("Europe/London") },
    { placeId: placeId(2), activity: "general-stargazing", window: makeWindow("Asia/Kolkata") },
  ] }, services);
  assert.equal(result.comparisons.length, 2);
  assert.ok(result.comparisons.every(option => option.availability?.status === "unavailable"));
  assert.doesNotMatch(JSON.stringify(result), /private\/home|secret-artifact|SECRET_PRIVATE_TOKEN|provider-token/);
});

test("comparison keeps requested-window darkness states and missing evidence distinct", async () => {
  const states = ["full-window", "partial-window", "none", "unknown"] as const;
  const services = serviceSet();
  services.getAstronomy = async (place, window) => {
    const result = makeAstronomy(place.placeId, window);
    const state = states[Number(window.startUtc.slice(8, 10)) - 1]!;
    result.darknessState = state;
    if (state === "partial-window") result.astronomicalDarkness = { status: "available", startUtc: window.startUtc.replace("18:00", "19:00"), endUtc: window.endUtc, localStart: "partial darkness begins", localEnd: "darkness ends" };
    if (state === "none" || state === "unknown") result.astronomicalDarkness = { status: state === "none" ? "unavailable" : "unknown", reason: "Fixture session calculation." };
    return result;
  };
  const result = await compareObservingOptions({ options: states.map((_, i) => ({ placeId: placeId(2), activity: "astrophotography", window: makeWindow("Asia/Kolkata", `2026-11-0${i + 1}`) })) }, services);
  assert.deepEqual(result.comparisons.map(option => option.factors.find(factor => factor.name === "Astronomical darkness")?.impact), ["favorable", "mixed", "unfavorable", "unknown"]);
  assert.deepEqual(result.comparisons.map(option => option.evidence?.astronomy?.darknessState), ["full-window", "partial-window", "none", "unknown"]);
  for (const option of result.comparisons) {
    assert.doesNotMatch(option.summary + option.factors.map(factor => factor.name + factor.assessment).join(" "), /polar|continuous darkness|24.hour/i);
    assert.ok(option.factors.some(factor => /forecast/i.test(factor.name) && factor.impact === "unknown"));
    assert.ok(option.gaps.some(gap => /seeing|access|historical/i.test(gap)));
  }
});
