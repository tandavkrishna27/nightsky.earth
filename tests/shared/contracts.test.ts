import assert from "node:assert/strict";
import test from "node:test";
import {
  astronomyWindowResultSchema,
  getAstronomyWindowInputSchema,
  getTargetVisibilityInputSchema,
  assertStructuredResultSize,
  compareObservingOptionsInputSchema,
  MAX_STRUCTURED_RESULT_BYTES,
  nightConditionsResultSchema,
  observingLocationCandidateSchema,
  planResultSchema,
  resolvePlaceInputSchema,
  resolvedPlaceSchema,
  resolveTonightWindow,
  sourceRecordSchema,
  timeWindowSchema,
  weatherForecastSchema,
} from "../../shared/nightsky/index";

const metSource = {
  name: "MET Norway",
  url: "https://api.met.no/weatherapi/locationforecast/2.0/documentation",
  attribution: "Weather data © MET Norway",
  dataClass: "forecast",
  product: "Locationforecast 2.0",
  issuedAt: "2026-10-11T06:00:00.000Z",
  vintage: "2026-10-11T06:00Z run",
};

const validWindow = {
  startUtc: "2026-10-11T12:30:00.000Z",
  endUtc: "2026-10-12T00:30:00.000Z",
  timeZone: "Asia/Kolkata",
};

function forecast(source: typeof metSource, cloudCover: number) {
  return {
    availability: { status: "available", reason: "Forecast data is available." },
    source,
    forecastHorizonHours: 36,
    samples: [{
      validAt: "2026-10-11T18:00:00.000Z",
      values: { totalCloudCover: { value: cloudCover, unit: "%" } },
    }],
    missingFields: [],
  };
}

test("rejectsInvalidCoordinatesInPlaceRecord", () => {
  assert.throws(() => observingLocationCandidateSchema.parse({
    placeId: "place:v1:osm:node/123",
    name: "Hilltop",
    category: "viewpoint",
    latitude: 91,
    longitude: 75,
    accessEvidence: { status: "unknown" },
    sources: [{
      name: "OpenStreetMap",
      url: "https://www.openstreetmap.org/",
      attribution: "© OpenStreetMap contributors",
      dataClass: "catalog",
      vintage: "2026-10-01",
    }],
    caveats: [],
  }));

  const privatePlace = {
    placeId: "place:v1:geonames:1880252",
    displayName: "Pune",
    timeZone: "Asia/Kolkata",
    indexVintage: "2026-10-01",
    sources: [{
      name: "GeoNames",
      url: "https://www.geonames.org/",
      attribution: "GeoNames geographical database",
      dataClass: "catalog" as const,
      vintage: "2026-10-01",
    }],
  };
  assert.throws(() => resolvedPlaceSchema.parse({ ...privatePlace, latitude: 91, longitude: 75 }));
  assert.throws(() => resolvedPlaceSchema.parse({ ...privatePlace, latitude: 18, longitude: 181 }));
});

test("rejectsInvalidTimeWindow", () => {
  assert.throws(() => timeWindowSchema.parse({
    startUtc: "2026-10-12T00:30:00.000Z",
    endUtc: "2026-10-11T12:30:00.000Z",
    timeZone: "Asia/Kolkata",
  }));
  assert.throws(() => timeWindowSchema.parse({
    startUtc: "2026-10-11T12:30:00.000Z",
    endUtc: "2028-10-11T12:30:00.000Z",
    timeZone: "Asia/Kolkata",
  }));
});

test("boundsAstronomyWindowToFiveDaysAndTargetWindowToFourteenDays", () => {
  const longWindow = { startUtc: "2026-01-01T00:00:00Z", endUtc: "2026-01-10T00:00:00Z", timeZone: "UTC" };
  assert.equal(getAstronomyWindowInputSchema.safeParse({ placeId: "place:v1:geonames:1", window: longWindow }).success, false);
  assert.equal(getTargetVisibilityInputSchema.safeParse({ placeId: "place:v1:geonames:1", targetQuery: "Jupiter", window: longWindow }).success, true);
});

test("resolvesTonightAcrossLocalMidnight", () => {
  const result = resolveTonightWindow({ localDate: "2026-10-11", timeZone: "Asia/Kolkata" });
  assert.deepEqual(result, {
    startUtc: "2026-10-11T12:30:00.000Z",
    endUtc: "2026-10-12T00:30:00.000Z",
    timeZone: "Asia/Kolkata",
  });
});

test("acceptsPartialWeatherWithMissingFields", () => {
  const result = weatherForecastSchema.parse({
    availability: { status: "partial", reason: "Wind and dew point are not present in this forecast." },
    source: metSource,
    forecastHorizonHours: 36,
    samples: [{
      validAt: "2026-10-11T18:00:00.000Z",
      values: { totalCloudCover: { value: 68, unit: "%" } },
    }],
    missingFields: [
      { field: "windSpeed", reason: "The provider did not return this field." },
      { field: "dewPoint", reason: "The provider did not return this field." },
    ],
  });
  assert.equal(result.samples[0]?.values.totalCloudCover?.value, 68);
  assert.equal(result.samples[0]?.values.dewPoint, undefined);
  assert.equal(result.missingFields.length, 2);
});

test("preservesTwoForecastSources", () => {
  const gefsSource = {
    ...metSource,
    name: "NOAA GEFS",
    url: "https://www.nco.ncep.noaa.gov/pmb/products/gens/",
    attribution: "NOAA/NWS/NCEP GEFS data",
    product: "GEFS ensemble",
  };
  const result = nightConditionsResultSchema.parse({
    availability: { status: "available", reason: "Two distinct forecast sources are available." },
    placeId: "place:v1:geonames:1880252",
    window: validWindow,
    sources: [metSource, gefsSource],
    forecasts: [forecast(metSource, 62), forecast(gefsSource, 47)],
    nightContext: { darkness: { status: "unknown", reason: "Not supplied by this contract fixture." }, forecastStepsDuringDarkness: [] },
    caveats: [],
  });
  assert.deepEqual(result.forecasts.map((item) => item.source.name), ["MET Norway", "NOAA GEFS"]);
  assert.deepEqual(result.forecasts.map((item) => item.samples[0]?.values.totalCloudCover?.value), [62, 47]);
});

test("rejectsHistoricalDataMarkedAsForecast", () => {
  assert.throws(() => weatherForecastSchema.parse({
    ...forecast({ ...metSource, dataClass: "reanalysis" }, 50),
  }));
});

test("requiresProvenanceForExternalValues", () => {
  assert.throws(() => weatherForecastSchema.parse({
    availability: { status: "available", reason: "A cloud value was returned." },
    samples: [{
      validAt: "2026-10-11T18:00:00.000Z",
      values: { totalCloudCover: { value: 50, unit: "%" } },
    }],
    missingFields: [],
  }));
  assert.throws(() => sourceRecordSchema.parse({
    name: "Unattributed external data",
    url: "https://example.org/data",
    dataClass: "catalog",
  }));
});

test("rejectsOversizedComparison", () => {
  const options = Array.from({ length: 6 }, (_, index) => ({
    placeId: `place:v1:geonames:${1000 + index}`,
    activity: "visual-stargazing",
    window: validWindow,
  }));
  assert.throws(() => compareObservingOptionsInputSchema.parse({ options }));
});

test("returnsAttributionInEveryResult", () => {
  const localCalculationSource = {
    name: "NightSky.earth astronomy calculation",
    url: "https://nightsky.earth/",
    attribution: "Calculated by NightSky.earth using Astronomy Engine (MIT).",
    dataClass: "calculation",
  };
  const astronomyResult = astronomyWindowResultSchema.parse({
    availability: { status: "available", reason: "Astronomical intervals were calculated." },
    sources: [localCalculationSource],
    placeId: "place:v1:geonames:1880252",
    window: validWindow,
    darknessState: "partial-window",
    astronomicalDarkness: {
      status: "available",
      startUtc: "2026-10-11T14:10:00.000Z",
      endUtc: "2026-10-11T22:45:00.000Z",
      localStart: "19:40 IST",
      localEnd: "04:15 IST",
    },
    solarThresholdIntervals: [],
    moon: { phaseAtUtc: "2026-10-11T18:00:00.000Z", phaseDegrees: 0, illuminationPercent: 0, maximumAltitudeDegrees: 42, maximumAltitudeAtUtc: "2026-10-11T18:00:00.000Z" },
    caveats: [],
  });
  assert.ok(astronomyResult.sources.every((source) => source.attribution.trim().length > 0));
  assert.throws(() => planResultSchema.parse({
    availability: { status: "available", reason: "Plan is available." },
    goal: "visual-stargazing",
    place: { placeId: "place:v1:geonames:1880252", displayName: "Pune", timeZone: "Asia/Kolkata", indexVintage: "2026-10-01", sources: [localCalculationSource] },
    requestedWindow: validWindow,
    summary: "A clear observing plan.",
    candidateWindows: [],
    factors: [],
    caveats: [],
    gaps: [],
    preparation: [],
  }));
});

test("resolvePlaceRequiresExactlyOneSupportedModeAndRejectsCoordinateText", () => {
  assert.throws(() => resolvePlaceInputSchema.parse({}));
  assert.throws(() => resolvePlaceInputSchema.parse({ placeQuery: "Pune", useApproximateHostLocation: true }));
  assert.throws(() => resolvePlaceInputSchema.parse({ placeQuery: "18.5204, 73.8567" }));
  assert.deepEqual(resolvePlaceInputSchema.parse({ useApproximateHostLocation: true }), { useApproximateHostLocation: true });
});

test("downstreamLocationInputsRequireVersionedPlaceIdOnly", () => {
  assert.throws(() => compareObservingOptionsInputSchema.parse({ options: [{ placeId: "Pune", activity: "visual-stargazing", window: validWindow }] }));
  assert.throws(() => compareObservingOptionsInputSchema.parse({ options: [{ placeId: "place:v1:geonames:1880252", latitude: 18.52, activity: "visual-stargazing", window: validWindow }] }));
});

test("rejectsStructuredResultAboveWireBudget", () => {
  assert.doesNotThrow(() => assertStructuredResultSize({ summary: "A short plan." }));
  assert.throws(() => assertStructuredResultSize({ optionalDetail: "x".repeat(MAX_STRUCTURED_RESULT_BYTES) }));
});


test("astronomy schema requires requested-window state and rejects legacy keys and threshold mismatch", () => {
  const base = {
    availability: { status: "available", reason: "Calculated." }, sources: [metSource], caveats: [],
    placeId: "place:v1:geonames:1", window: validWindow, darknessState: "full-window",
    astronomicalDarkness: { status: "unknown", reason: "Fixture." },
    solarThresholdIntervals: [{ kind: "civil", sunAltitudeThresholdDegrees: -6, startUtc: validWindow.startUtc, endUtc: validWindow.endUtc, localStart: "18:00", localEnd: "06:00" }],
    moon: { phaseAtUtc: validWindow.startUtc, phaseDegrees: 0, illuminationPercent: 0, maximumAltitudeDegrees: 0, maximumAltitudeAtUtc: validWindow.startUtc },
  };
  assert.equal(astronomyWindowResultSchema.safeParse(base).success, true);
  for (const [kind, threshold] of [["civil", -6], ["nautical", -12], ["astronomical", -18]] as const) {
    assert.equal(astronomyWindowResultSchema.safeParse({ ...base, solarThresholdIntervals: [{ ...base.solarThresholdIntervals[0], kind, sunAltitudeThresholdDegrees: threshold }] }).success, true);
    assert.equal(astronomyWindowResultSchema.safeParse({ ...base, solarThresholdIntervals: [{ ...base.solarThresholdIntervals[0], kind, sunAltitudeThresholdDegrees: threshold === -6 ? -12 : -6 }] }).success, false);
  }
  const { darknessState, solarThresholdIntervals, ...legacy } = base;
  assert.equal(astronomyWindowResultSchema.safeParse({ ...legacy, polarState: "continuous-darkness", twilightIntervals: [] }).success, false);
  assert.equal(astronomyWindowResultSchema.safeParse({ ...base, polarState: "normal" }).success, false);
  assert.equal(astronomyWindowResultSchema.safeParse({ ...base, twilightIntervals: [] }).success, false);
  assert.equal(astronomyWindowResultSchema.safeParse({ ...legacy, solarThresholdIntervals }).success, false);
  assert.equal(astronomyWindowResultSchema.safeParse({ ...base, darknessState: "unknown" }).success, true);
});
