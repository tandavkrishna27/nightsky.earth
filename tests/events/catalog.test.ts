import test from "node:test";
import assert from "node:assert/strict";
import { GeoNamesPlaceIndex } from "../../server/places/geonames";
import { searchSkyEvents } from "../../server/events/catalog";
import { skyEventsResultSchema } from "../../shared/nightsky/events";

const index = new GeoNamesPlaceIndex([
  { geonameId: 1, name: "Pune", asciiName: "Pune", alternateNames: "", latitude: 18.5204, longitude: 73.8567, countryCode: "IN", countryName: "India", featureClass: "P", featureCode: "PPL", population: 1000, timeZone: "Asia/Kolkata", modificationDate: "2026-01-01" },
  { geonameId: 2, name: "Reykjavik", asciiName: "Reykjavik", alternateNames: "", latitude: 64.1466, longitude: -21.9426, countryCode: "IS", countryName: "Iceland", featureClass: "P", featureCode: "PPLC", population: 1000, timeZone: "Atlantic/Reykjavik", modificationDate: "2026-01-01" },
  { geonameId: 3, name: "Horizon Test Site", asciiName: "Horizon Test Site", alternateNames: "", latitude: 0, longitude: -20, countryCode: "XX", countryName: "Test", featureClass: "P", featureCode: "PPL", population: 1, timeZone: "Etc/GMT+1", modificationDate: "2026-01-01" },
], "fixture-v1");

const place = (id: number) => ({ placeId: `place:v1:geonames:${id}`, timeZone: index.getById(id)!.timeZone });
const window = (startUtc: string, endUtc: string, timeZone: string) => ({ startUtc, endUtc, timeZone });

test("findsMoonPhaseInRange", async () => {
  const result = await searchSkyEvents({ placeId: place(1).placeId, window: window("2026-03-01T00:00:00Z", "2026-03-10T00:00:00Z", "Asia/Kolkata"), eventTypes: ["moon-phase"] }, index);
  assert.ok(result.events.some((event) => event.eventType === "moon-phase" && event.name === "Full Moon" && event.peakUtc?.startsWith("2026-03-03")));
});

test("returnsReviewedYearSpecificMeteorPeakWithoutInventedSeason", async () => {
  const result = await searchSkyEvents({ placeId: place(1).placeId, window: window("2026-08-13T14:00:00Z", "2026-08-13T15:00:00Z", "Asia/Kolkata"), eventTypes: ["meteor-shower"] }, index);
  assert.equal(result.events.length, 1);
  assert.equal(result.events[0]!.peakUtc, "2026-08-13T14:09:00Z");
  assert.equal(result.events[0]!.activityCalendarDateWindow, undefined);
  assert.equal(result.events[0]!.peakCalendarDateWindow, undefined);
  assert.equal(result.events[0]!.localVisibility, "not-evaluated");
  assert.equal(result.availability.status, "partial");
});

test("doesNotRecurForecastPeaksIntoUnreviewedYears", async () => {
  const result = await searchSkyEvents({ placeId: place(1).placeId, window: window("2028-01-02T00:00:00Z", "2028-01-05T00:00:00Z", "Asia/Kolkata"), eventTypes: ["meteor-shower"] }, index);
  assert.deepEqual(result.events, []);
  assert.equal(result.availability.status, "partial");
});

test("2025 event uses its own timestamp identity and rights source", async () => {
  const result = await searchSkyEvents({placeId:place(1).placeId, window:window("2025-08-13T08:00:00Z","2025-08-13T08:02:00Z","Asia/Kolkata"),eventTypes:["meteor-shower"]},index);
  assert.equal(result.events[0]?.eventId,"meteor:perseids:2025");
  assert.equal(result.events[0]?.peakUtc,"2025-08-13T08:01:00Z");
  assert.match(result.events[0]?.description ?? "",/2025/);
  assert.equal(result.events[0]?.source.licenseUrl,"https://ntrs.nasa.gov/citations/20240012381");
  assert.equal(result.availability.status,"partial");
});

test("calendarActivityWithoutReviewedPeakInWindowDoesNotInventMeteorEvent", async () => {
  const result = await searchSkyEvents({ placeId: place(1).placeId, window: window("2026-08-12T00:00:00Z", "2026-08-13T00:00:00Z", "Asia/Kolkata"), eventTypes: ["meteor-shower"] }, index);
  assert.deepEqual(result.events, []);
});
test("calculatesEclipseLocalCircumstances", async () => {
  const result = await searchSkyEvents({ placeId: place(2).placeId, window: window("2026-08-12T00:00:00Z", "2026-08-13T00:00:00Z", "Atlantic/Reykjavik"), eventTypes: ["eclipse"] }, index);
  const eclipse = result.events.find((event) => event.name.includes("Solar Eclipse"));
  assert.ok(eclipse);
  assert.equal(eclipse.localVisibility, "visible");
  assert.ok(eclipse.startUtc && eclipse.peakUtc && eclipse.endUtc);
  assert.ok(Math.abs(Date.parse(eclipse.startUtc) - Date.parse("2026-08-12T16:47:00Z")) < 60_000);
});

test("marksPartialEclipseBelowHorizon", async () => {
  const result = await searchSkyEvents({ placeId: place(3).placeId, window: window("2026-08-12T00:00:00Z", "2026-08-13T00:00:00Z", "Etc/GMT+1"), eventTypes: ["eclipse"] }, index);
  const eclipse = result.events.find((event) => event.name.includes("Solar Eclipse"));
  assert.ok(eclipse);
  assert.equal(eclipse.localVisibility, "partially-visible");
  assert.match(eclipse.description ?? "", /below the horizon at maximum/);
});

test("marksEventBelowHorizon", async () => {
  const result = await searchSkyEvents({ placeId: place(1).placeId, window: window("2026-03-03T11:00:00Z", "2026-03-03T12:00:00Z", "Asia/Kolkata"), eventTypes: ["moon-phase"] }, index);
  const fullMoon = result.events.find((event) => event.name === "Full Moon");
  assert.ok(fullMoon);
  assert.equal(fullMoon.localVisibility, "not-visible");
});

test("returnsUnsupportedForUnmaintainedTransient", async () => {
  const result = await searchSkyEvents({ placeId: place(1).placeId, window: window("2026-01-01T00:00:00Z", "2026-12-31T00:00:00Z", "Asia/Kolkata"), eventTypes: ["comet"] }, index);
  assert.equal(result.availability.status, "unsupported");
  assert.deepEqual(result.unsupportedEventTypes, ["comet"]);
});

test("preservesCatalogSourceAndVintage", async () => {
  const result = await searchSkyEvents({ placeId: place(1).placeId, window: window("2026-10-01T00:00:00Z", "2026-11-10T00:00:00Z", "Asia/Kolkata"), eventTypes: ["meteor-shower"] }, index);
  const source = result.events[0]?.source;
  assert.ok(source?.url.startsWith("https://ntrs.nasa.gov/"));
  assert.ok(source?.vintage?.startsWith("NASA-MEO-2026"));
  assert.equal(skyEventsResultSchema.safeParse(result).success, true);
});

test("listsV1UnsupportedEventClasses", async () => {
  const result = await searchSkyEvents({ placeId: place(1).placeId, window: window("2026-01-01T00:00:00Z", "2026-12-31T00:00:00Z", "Asia/Kolkata") }, index);
  assert.ok(result.unsupportedEventTypes.includes("occultation"));
  assert.ok(!result.unsupportedEventTypes.includes("planetary-conjunction"));
  assert.ok(!result.unsupportedEventTypes.includes("opposition"));
  assert.ok(result.events.some(event => event.eventType === "opposition"));
  assert.match(result.caveats.join(" "), /Apparent planet-pair conjunctions.*unsupported/);
  assert.ok(result.unsupportedEventTypes.includes("comet"));
});

test("lunar eclipse peak and penumbral duration match NASA 2026 catalog within bounded model tolerance", async () => {
  // NASA 5 millennium catalog: March 3 TD 11:34:52, Delta T 75s,
  // total eclipse, penumbral duration 338.6 minutes. Retrieved 2026-10-13.
  // https://eclipse.gsfc.nasa.gov/LEcat5/LE2001-2100.html
  const result = await searchSkyEvents({placeId:place(1).placeId,
    window:window("2026-03-03T00:00:00Z","2026-03-04T00:00:00Z","Asia/Kolkata"), eventTypes:["eclipse"]},index);
  const lunar = result.events.find(event => event.eventId.startsWith("lunar-eclipse:"));
  assert.ok(lunar?.peakUtc && lunar.startUtc && lunar.endUtc);
  assert.match(lunar.name,/Total Lunar Eclipse/);
  assert.ok(Math.abs(Date.parse(lunar.peakUtc)-Date.parse("2026-03-03T11:33:37Z")) <= 120000);
  assert.ok(Math.abs((Date.parse(lunar.endUtc)-Date.parse(lunar.startUtc))/60000 - 338.6) <= 2);
});
