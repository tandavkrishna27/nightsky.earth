import assert from "node:assert/strict";
import test from "node:test";
import { planObservingSession } from "../../server/nightsky/planner";
import { GeoNamesPlaceIndex } from "../../server/places/geonames";
import type { NightConditionsResult } from "../../shared/nightsky/weather";
import type { AstronomyWindowResult } from "../../shared/nightsky/astronomy";
import type { EventResult } from "../../shared/nightsky/events";
import type { SourceRecord, TimeWindow } from "../../shared/nightsky/common";
import type { PlannerServices } from "../../server/nightsky/planner";


const window: TimeWindow = { startUtc: "2026-10-15T18:00:00Z", endUtc: "2026-10-16T06:00:00Z", timeZone: "Europe/London" };
const source: SourceRecord = { name: "Fixture astronomy", url: "https://example.test/astro", attribution: "Deterministic test fixture.", dataClass: "calculation" };
const index = new GeoNamesPlaceIndex([{ geonameId: 2643743, name: "London", asciiName: "London", alternateNames: "", latitude: 51.5, longitude: -0.12, countryCode: "GB", countryName: "United Kingdom", featureClass: "P", featureCode: "PPLC", population: 8_000_000, timeZone: "Europe/London", modificationDate: "2026-10-01" }], "fixture-2026-10");
const placeId = "place:v1:geonames:2643743";

function astronomy(): AstronomyWindowResult {
  return {
    availability: { status: "available", reason: "Calculated for the fixture place." }, sources: [source], caveats: [], placeId, window,
    darknessState: "partial-window", astronomicalDarkness: { status: "available", startUtc: "2026-10-15T19:00:00Z", endUtc: "2026-10-16T05:00:00Z", localStart: "8 pm", localEnd: "6 am" },
    solarThresholdIntervals: [{ kind: "astronomical", sunAltitudeThresholdDegrees: -18, startUtc: "2026-10-15T19:00:00Z", endUtc: "2026-10-16T05:00:00Z", localStart: "8 pm", localEnd: "6 am" }], moon: { phaseAtUtc: "2026-10-16T00:00:00Z", phaseDegrees: 60, illuminationPercent: 25, maximumAltitudeDegrees: 20, maximumAltitudeAtUtc: "2026-10-16T01:00:00Z" },
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
function bandConditions(status:'partial'|'stale'='partial', includeTransparency=true):NightConditionsResult {
 const result=conditions();result.forecasts[0].source.name='7Timer!';result.forecasts[0].availability.status=status;
 result.forecasts[0].samples=[{validAt:'2026-10-15T22:00:00Z',values:{},bands:{seeing:{code:1,range:'<0.5',unit:'arcseconds'},...(includeTransparency?{transparency:{code:2,range:'0.3–0.4',unit:'mag/airmass' as const}}:{})}}];
 return result;
}
test('composed imaging plan uses native seeing and transparency bands without a false missing claim',async()=>{
 const result=await planObservingSession({placeId,activity:'astrophotography',window},services({getNightConditions:async()=>bandConditions()}));
 assert.ok(!result.gaps.some(g=>/No seeing or transparency forecast/.test(g)));
 assert.ok(!result.caveats.some(c=>/Seeing and transparency are not supplied/.test(c)));
 const factor=result.factors.find(f=>/seeing and transparency/.test(f.name));assert.ok(factor);assert.match(factor.assessment,/<0.5 arcseconds/);assert.match(factor.assessment,/0.3–0.4 mag\/airmass/);assert.match(factor.assessment,/2026-10-15T22:00:00Z/);assert.equal(factor.impact,'unknown');assert.deepEqual(factor.sourceNames,['7Timer!']);
});
test('composed imaging plan preserves missing transparency and stale band caveats',async()=>{
 const missing=await planObservingSession({placeId,activity:'astrophotography',window},services({getNightConditions:async()=>bandConditions('partial',false)}));
 assert.ok(missing.gaps.some(g=>/transparency/i.test(g)&&/unavailable|missing|not supplied/i.test(g)));
 assert.ok(!missing.gaps.some(g=>/No seeing or transparency forecast/.test(g)));
 const stale=await planObservingSession({placeId,activity:'astrophotography',window},services({getNightConditions:async()=>bandConditions('stale')}));
 assert.ok(stale.gaps.some(g=>/seeing/i.test(g)&&/unavailable|missing|not supplied/i.test(g)));
 assert.ok(stale.factors.some(f=>/seeing and transparency/.test(f.name)&&/stale|unavailable/i.test(f.assessment)&&f.impact==='unknown'));
});
test('bands outside the requested window cannot fill the seeing gap',async()=>{
 const weather=bandConditions();weather.forecasts[0].samples[0].validAt='2026-10-17T22:00:00Z';
 const result=await planObservingSession({placeId,activity:'astrophotography',window},services({getNightConditions:async()=>weather}));
 assert.ok(result.gaps.some(g=>/seeing/i.test(g)&&/unavailable|missing|not supplied/i.test(g)));
});
test('stale provider outcome cannot make otherwise partial native bands usable',async()=>{
 const weather=bandConditions();weather.providerOutcomes=[{providerId:'seventimer',status:'stale',reason:'Issue time is stale.',source:weather.forecasts[0].source}];
 const result=await planObservingSession({placeId,activity:'deep-sky-imaging',window},services({getNightConditions:async()=>weather}));
 assert.ok(result.gaps.some(g=>/seeing and transparency/.test(g)&&/unavailable/.test(g)));
 assert.ok(result.factors.some(f=>/seeing and transparency/.test(f.name)&&/Stale or unavailable/.test(f.assessment)));
});
