import assert from "node:assert/strict";
import test from "node:test";
import { planObservingSession } from "../../server/nightsky/planner";
import { GeoNamesPlaceIndex, resolvePlace } from "../../server/places/geonames";
import type { NightConditionsResult } from "../../shared/nightsky/weather";
import type { AstronomyWindowResult } from "../../shared/nightsky/astronomy";
import type { EventResult } from "../../shared/nightsky/events";
import type { SourceRecord, TimeWindow } from "../../shared/nightsky/common";
import type { PlannerServices } from "../../server/nightsky/planner";
import { clearSkyClimatologyResultSchema } from "../../shared/nightsky/astronomy";

const window: TimeWindow = { startUtc: "2026-10-15T18:00:00Z", endUtc: "2026-10-16T06:00:00Z", timeZone: "Europe/London" };
const source: SourceRecord = { name: "Fixture astronomy", url: "https://example.test/astro", attribution: "Deterministic test fixture.", dataClass: "calculation" };
const index = new GeoNamesPlaceIndex([{ geonameId: 2643743, name: "London", asciiName: "London", alternateNames: "", latitude: 51.5, longitude: -0.12, countryCode: "GB", countryName: "United Kingdom", featureClass: "P", featureCode: "PPLC", population: 8_000_000, timeZone: "Europe/London", modificationDate: "2026-10-01" }], "fixture-2026-10");
const placeId = "place:v1:geonames:2643743";

function astronomy(): AstronomyWindowResult {
  return {
    availability: { status: "available", reason: "Calculated for the fixture place." }, sources: [source], caveats: [], placeId, window,
    darknessState: "partial-window", astronomicalDarkness: { status: "available", startUtc: "2026-10-15T19:00:00Z", endUtc: "2026-10-16T05:00:00Z", localStart: "8 pm", localEnd: "6 am" },
    solarThresholdIntervals: [], moon: { phaseAtUtc: "2026-10-16T00:00:00Z", phaseDegrees: 60, illuminationPercent: 25, maximumAltitudeDegrees: 20, maximumAltitudeAtUtc: "2026-10-16T01:00:00Z" },
  };
}
function conditions(): NightConditionsResult {
  const weatherSource: SourceRecord = { ...source, name: "Fixture weather", dataClass: "forecast", product: "Fixture forecast" };
  return {
    availability: { status: "partial", reason: "Cloud forecast is available; visibility is missing." }, sources: [weatherSource], caveats: [], placeId, window,
    forecasts: [{ availability: { status: "partial", reason: "Visibility is not supplied." }, source: weatherSource, forecastHorizonHours: 48,
      samples: [{ validAt: "2026-10-15T22:00:00Z", values: { totalCloudCover: { value: 18, unit: "%" }, windSpeed: { value: 4, unit: "m/s" } } }],
      missingFields: [{ field: "visibility", reason: "Not supplied by fixture." }] }],
    nightContext: { darkness: astronomy().astronomicalDarkness, moonIlluminationPercent: 25, forecastStepsDuringDarkness: [{ source: "Fixture weather", validTimesUtc: ["2026-10-15T22:00:00Z"] }] },
  };
}
function events(): EventResult {
  return { availability: { status: "available", reason: "Events checked." }, sources: [source], caveats: [], placeId, window, events: [], unsupportedEventTypes: [] };
}
function services(overrides: Partial<PlannerServices> = {}): PlannerServices {
  return {
    index,
    getAstronomy: async () => astronomy(),
    getNightConditions: async () => conditions(),
    searchEvents: async () => events(),
    getTargetVisibility: async () => { throw new Error("No target requested"); },
    getLocationContext: async () => ({ availability: { status: "unknown", reason: "Access is not verified." }, sources: [source], caveats: [], placeId, groundLightContext: { status: "unknown", reason: "Not available." }, access: { status: "unknown", description: "Not independently verified." } }),
    ...overrides,
  };
}

test("plansBeginnerStargazingWithPartialWeather", async () => {
  const result = await planObservingSession({ placeId, activity: "general-stargazing", window, experience: "beginner" }, services());
  assert.equal(result.place.displayName, "London, United Kingdom");
  assert.ok(result.factors.some((factor) => /cloud/i.test(factor.name) && /18\s*%/.test(factor.assessment)));
  assert.ok(result.factors.some((factor) => factor.name.includes("Moon") && factor.assessment.includes("25%")));
  assert.ok(result.gaps.some((gap) => gap.toLowerCase().includes("visibility")));
  assert.ok(result.preparation.length > 0);
  assert.match(result.summary, /partial|unknown|available/i);
});

test("plansAstrophotographyWithoutInventingSeeing", async () => {
  const result = await planObservingSession({ placeId, activity: "astrophotography", window }, services());
  assert.ok(result.gaps.some((gap) => /seeing/i.test(gap)));
  assert.ok(result.caveats.some((caveat) => /Seeing and transparency are not supplied/.test(caveat)));
});

test("planner keeps precipitation aggregation lengths separate", async () => {
  const weather = conditions();
  weather.forecasts[0]!.samples = [
    { validAt: "2026-10-15T22:00:00Z", values: { precipitationAmount: { value: 1, unit: "mm", periodStartUtc: "2026-10-15T22:00:00Z", periodEndUtc: "2026-10-15T23:00:00Z" }, precipitationProbability: { value: 20, unit: "%", periodStartUtc: "2026-10-15T22:00:00Z", periodEndUtc: "2026-10-15T23:00:00Z" } } },
    { validAt: "2026-10-15T23:00:00Z", values: { precipitationAmount: { value: 6, unit: "mm", periodStartUtc: "2026-10-15T23:00:00Z", periodEndUtc: "2026-10-16T05:00:00Z" }, precipitationProbability: { value: 40, unit: "%", periodStartUtc: "2026-10-15T23:00:00Z", periodEndUtc: "2026-10-16T05:00:00Z" } } },
  ];
  const result = await planObservingSession({ placeId, activity: "general-stargazing", window }, services({ getNightConditions: async () => weather }));
  const factor = result.factors.find(({ name }) => /cloud and precipitation/.test(name));
  assert.match(factor!.assessment, /1 mm \(1h\)/);
  assert.match(factor!.assessment, /6 mm \(6h\)/);
  assert.doesNotMatch(factor!.assessment, /1–6 mm/);
  assert.match(factor!.assessment, /20 % \(1h\), 40 % \(6h\)/);
  assert.match(factor!.assessment, /aggregation through 2026-10-16T05:00:00Z/);
  assert.ok(result.caveats.some((caveat) => /overlap.*sum/i.test(caveat)));
});

test("returnsUsefulPlanWhenOneProviderFails", async () => {
  const result = await planObservingSession({ placeId, activity: "visual-stargazing", window }, services({ getNightConditions: async () => { throw new Error("Provider offline"); } }));
  assert.equal(result.availability.status, "partial");
  assert.ok(result.factors.some((factor) => factor.name === "Weather forecast" && /unavailable/i.test(factor.assessment)));
  assert.ok(result.preparation.length > 0);
});

test("plansMeteorNightWithRadiantGapExplicit", async () => {
  const event = { eventId: "meteor:fixture", name: "Fixture shower", eventType: "meteor-shower" as const, peakUtc: "2026-10-15T23:00:00Z", localVisibility: "not-evaluated" as const, description: "Fixture peak date.", source };
  const result = await planObservingSession({ placeId, activity: "meteor-shower", window }, services({ searchEvents: async () => ({ ...events(), events: [event] }) }));
  assert.ok(result.factors.some((factor) => /meteor shower/i.test(factor.name) && /Fixture shower/.test(factor.assessment)));
  assert.ok(result.factors.some((factor) => factor.name === "Moon" && /25%/.test(factor.assessment)));
  assert.ok(result.factors.some((factor) => factor.name === "Meteor radiant visibility" && /unknown/i.test(factor.assessment) && /coordinates or drift/.test(factor.assessment)));
  assert.ok(result.candidateWindows.some((candidate) => /darkness interval/.test(candidate.rationale)));
  assert.ok(result.gaps.some((gap) => /radiant altitude/i.test(gap)));
});

test("plansTelescopeTargetWithVisibilityWindow", async () => {
  const result = await planObservingSession({ placeId, activity: "planet-observing", target: "Saturn", window }, services({
    getTargetVisibility: async () => ({ availability: { status: "available", reason: "Calculated." }, sources: [source], caveats: [], placeId,
      target: { targetId: "body:saturn", name: "Saturn", targetType: "planet" },
      intervals: [{ startUtc: "2026-10-15T21:00:00Z", endUtc: "2026-10-16T02:00:00Z", localStart: "10 pm, Oct 15", localEnd: "3 am, Oct 16", maximumAltitudeDegrees: 42, azimuthDegrees: 180 }] }),
  }));
  assert.ok(result.factors.some((factor) => factor.name === "Saturn visibility" && /42°/.test(factor.assessment)));
});

test("returnsHistoricalContextForMonthAheadDate", async () => {
  const laterWindow = { ...window, startUtc: "2026-11-15T18:00:00Z", endUtc: "2026-11-16T06:00:00Z" };
  const history = clearSkyClimatologyResultSchema.parse({ availability: { status: "partial", reason: "Fixture sample only." }, sources: [{ ...source, dataClass: "reanalysis" }], caveats: [], placeId,
    schemaVersion: 2, month: 11, timeZone: window.timeZone, dataClass: "reanalysis", methodVersion: "dark-cloud-v1", sampleDefinition: "hourly-dark-time-samples", unit: "fraction",
    period: { startNight: "2001-01-01", endNight: "2020-12-31", kind: "sample-only" }, historicalLabel: "historical-not-a-forecast",
    grid: { mapping: "nearest-supplied-cell", cellId: "fixture", spacingDegrees: 0.25, displacementKm: 1, placeIndexVintage: "fixture" },
    summary: { expectedEligibleSamples: 100, validEligibleSamples: 100, representedYears: 20, badYearCount: 0, completeness: 1, meanCloudFraction: 0.42,
      thresholds: [{ fraction: 0.1, count: 10, frequency: 0.1 }, { fraction: 0.25, count: 30, frequency: 0.3 }, { fraction: 0.5, count: 60, frequency: 0.6 }] } });
  const result = await planObservingSession({ placeId, activity: "general-stargazing", window: laterWindow }, services({ getClimatology: async () => history }));
  assert.ok(result.factors.some((factor) => factor.name === "Historical context" && /historical-not-a-forecast/.test(factor.assessment) && /2001-01-01–2020-12-31/.test(factor.assessment)));
  assert.ok(result.gaps.some(gap => /Historical context is partial/.test(gap)));
});

test("returnsUsefulPlanWhenClimatologyIsUnsupported", async () => {
  const result = await planObservingSession({ placeId, activity: "general-stargazing", window }, services());
  assert.ok(result.factors.some((factor) => factor.name === "Historical context" && /unsupported/i.test(factor.assessment)));
  assert.ok(result.factors.some((factor) => factor.name === "Nearby observing places" && /unsupported/i.test(factor.assessment)));
  assert.ok(result.preparation.length > 0);
});
test("planner requests the observing-night month for an after-midnight session", async () => {
  let requestedMonth: number | undefined;
  await planObservingSession({ placeId, activity: "general-stargazing", window: { startUtc: "2025-02-01T01:30:00Z", endUtc: "2025-02-01T05:00:00Z", timeZone: "Europe/London" } }, services({
    getClimatology: async (_placeId, month) => { requestedMonth = month; throw new Error("No historical artifact."); },
  }));
  assert.equal(requestedMonth, 1);
});

test("asksForAmbiguousPlace", async () => {
  const ambiguousIndex = new GeoNamesPlaceIndex([
    { geonameId: 1, name: "Springfield", asciiName: "Springfield", alternateNames: "", latitude: 39.8, longitude: -89.6, countryCode: "US", countryName: "United States", featureClass: "P", featureCode: "PPLA", population: 100_000, timeZone: "America/Chicago", modificationDate: "2026-10-01" },
    { geonameId: 2, name: "Springfield", asciiName: "Springfield", alternateNames: "", latitude: -27.7, longitude: 152.9, countryCode: "AU", countryName: "Australia", featureClass: "P", featureCode: "PPL", population: 60_000, timeZone: "Australia/Brisbane", modificationDate: "2026-10-01" },
  ], "fixture-ambiguous");
  const result = await resolvePlace({ placeQuery: "Springfield" }, { index: ambiguousIndex });
  assert.equal(result.selectionRequired, true);
  assert.equal(result.matches.length, 2);
});

test("includesNightAccessCaveat", async () => {
  const result = await planObservingSession({ placeId, activity: "general-stargazing", window }, services());
  assert.ok(result.caveats.some((caveat) => /access|opening|permits/i.test(caveat)));
  assert.ok(result.gaps.some((gap) => /Confirm public access/i.test(gap)));
});

test("a plan window is limited to one observing session", async () => {
  await assert.rejects(() => planObservingSession({ placeId, activity: "general-stargazing", window: { ...window, endUtc: "2026-10-17T06:00:00Z" } }, services()), /at most 24 hours/i);
});

test("rejects stale or unknown place IDs with a clear error", async () => {
  await assert.rejects(() => planObservingSession({ placeId: "place:v1:geonames:999", activity: "visual-stargazing", window }, services()), /selected named place is unavailable/i);
});

for (const [state, impact, meaning] of [
  ["full-window", "favorable", /throughout the requested window/i],
  ["partial-window", "mixed", /part of the requested window/i],
  ["none", "unfavorable", /no astronomical darkness.*requested window/i],
  ["unknown", "unknown", /unknown.*requested window/i],
] as const) for (const activity of ["general-stargazing", "astrophotography", "meteor-shower"] as const) {
  test(`${activity} describes ${state} darkness only for the requested session`, async () => {
    const supplied = astronomy();
    supplied.darknessState = state;
    if (state === "full-window") supplied.astronomicalDarkness = { status: "available", startUtc: window.startUtc, endUtc: window.endUtc, localStart: "7 pm", localEnd: "7 am" };
    if (state === "none" || state === "unknown") supplied.astronomicalDarkness = { status: state === "none" ? "unavailable" : "unknown", reason: "Fixture session calculation." };
    const darkness = supplied.astronomicalDarkness;
    supplied.solarThresholdIntervals = darkness.status === "available" ? [{ kind: "astronomical", sunAltitudeThresholdDegrees: -18, startUtc: darkness.startUtc, endUtc: darkness.endUtc, localStart: darkness.localStart, localEnd: darkness.localEnd }] : [];
    const result = await planObservingSession({ placeId, activity, window, experience: "beginner" }, services({ getAstronomy: async () => supplied, getNightConditions: async () => { throw new Error("Offline forecast"); } }));
    const factor = result.factors.find(({ name }) => name === "Astronomical darkness");
    assert.equal(factor?.impact, impact);
    assert.match(factor!.assessment, meaning);
    assert.deepEqual(factor?.sourceNames, ["Fixture astronomy"]);
    assert.equal(result.factors.some(({ name }) => /polar/i.test(name)), false);
    assert.doesNotMatch(result.summary + result.factors.map(({ assessment }) => assessment).join(" "), /polar|continuous darkness|24.hour/i);
    assert.deepEqual(result.evidence.astronomy, supplied);
    assert.ok(result.factors.some(({ name, impact }) => name === "Weather forecast" && impact === "unknown"));
    assert.ok(result.factors.some(({ name, impact }) => name === "Site access" && impact === "unknown"));
    assert.ok(result.factors.some(({ name, impact }) => name === "Historical context" && impact === "unknown"));
    if (state === "none" || state === "unknown") assert.equal(result.candidateWindows.length, 0);
    if (activity === "astrophotography") assert.ok(result.gaps.some(gap => /seeing.*transparency/i.test(gap)));
    if (activity === "meteor-shower") assert.ok(result.factors.some(({ name, impact }) => name === "Meteor radiant visibility" && impact === "unknown"));
  });
}
