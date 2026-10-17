import test from "node:test";
import assert from "node:assert/strict";
import { GeoNamesPlaceIndex } from "../../server/places/geonames";
import { searchSkyEvents } from "../../server/events/catalog";
import { meteorCivilGuidanceSchema, skyEventsResultSchema } from "../../shared/nightsky/events";

const index = new GeoNamesPlaceIndex([
  { geonameId: 1, name: "Pune", asciiName: "Pune", alternateNames: "", latitude: 18.5204, longitude: 73.8567, countryCode: "IN", countryName: "India", featureClass: "P", featureCode: "PPL", population: 1000, timeZone: "Asia/Kolkata", modificationDate: "2026-01-01" },
  { geonameId: 2, name: "Reykjavik", asciiName: "Reykjavik", alternateNames: "", latitude: 64.1466, longitude: -21.9426, countryCode: "IS", countryName: "Iceland", featureClass: "P", featureCode: "PPLC", population: 1000, timeZone: "Atlantic/Reykjavik", modificationDate: "2026-01-01" },
  { geonameId: 3, name: "Horizon Test Site", asciiName: "Horizon Test Site", alternateNames: "", latitude: 0, longitude: -20, countryCode: "XX", countryName: "Test", featureClass: "P", featureCode: "PPL", population: 1, timeZone: "Etc/GMT+1", modificationDate: "2026-01-01" },
], "fixture-v1");

const place = (id: number) => ({ placeId: `place:v1:geonames:${id}`, timeZone: index.getById(id)!.timeZone });
const window = (startUtc: string, endUtc: string, timeZone: string) => ({ startUtc, endUtc, timeZone });

test("IGN civil guidance preserves Orionid date-only and Draconid/Ursid UT wording without creating UTC events", async () => {
  const query = (year: number) => searchSkyEvents({ placeId: place(1).placeId, window: window(`${year}-10-20T00:00:00Z`, `${year}-10-23T00:00:00Z`, "Asia/Kolkata"), eventTypes: ["meteor-shower"] }, index);
  const result = await query(2026);
  const rows = result.meteorCivilGuidance!;
  assert.deepEqual(rows.map(row => row.code), ["LYR", "LEO", "ORI", "DRA", "URS"]);
  for (const [code, start, end, wording, basis, uncertainty] of [
    ["ORI", "10-02", "11-07", "October 21; secondary peaks may increase activity in surrounding nights", "unspecified-by-source", "day precision; secondary peaks possible; numerical uncertainty not supplied"],
    ["DRA", "10-06", "10-10", "October 9 at around 2 a.m. universal time", "UT-as-published", "approximate; numerical uncertainty not supplied"],
    ["URS", "12-17", "12-26", "December 22 at 22h universal time", "UT-as-published", "hour precision; numerical uncertainty not supplied"],
  ]) {
    const row = rows.find(row => row.code === code)!;
    assert.ok(row, code);
    assert.equal(row.startMonthDay, start);
    assert.equal(row.endMonthDay, end);
    assert.equal(row.maximumWording, wording);
    assert.equal(row.maximumTimeBasis, basis);
    assert.equal(row.maximumUncertainty, uncertainty);
    assert.equal(row.maximumYear, 2026);
    assert.equal(row.timeZoneBasis, "unspecified-by-source");
    assert.equal(row.requestedWindowOverlap, "not-evaluated");
    assert.match(row.source.licenseUrl!, /ign\/portal\/info-aviso-legal/);
    assert.match(row.source.attribution, /no IGN endorsement/);
    assert.ok(result.sources.some(source => source.url === row.source.url));
    assert.match(row.caveat, /radiant fit validity/);
  }
  assert.match(rows.find(row => row.code === "DRA")!.geographicQualification, /Northern hemisphere/);
  assert.equal(rows.find(row => row.code === "DRA")!.recurrenceBasis, "source-general-period");
  assert.doesNotMatch(rows.find(row => row.code === "DRA")!.source.product!, /annual/i);
  assert.equal(rows.find(row => row.code === "ORI")!.recurrenceBasis, "typical-annual");
  assert.equal(rows.find(row => row.code === "URS")!.recurrenceBasis, "typical-annual");
  assert.match(rows.find(row => row.code === "URS")!.geographicQualification, /Northern hemisphere/);
  assert.deepEqual(result.events, []); // No admitted NASA maximum here; IGN civil facts are not instants.
  const later = await query(2028);
  assert.deepEqual(later.events, []);
  assert.deepEqual(later.meteorCivilGuidance, rows); // Unfiltered references retain maximumYear 2026.
  assert.equal(skyEventsResultSchema.safeParse({ ...result, meteorCivilGuidance: rows.slice(0, 2) }).success, true);
  assert.equal(skyEventsResultSchema.safeParse({ ...result, meteorCivilGuidance: [...rows, rows[0]] }).success, false);
  const orionids = rows.find(row => row.code === "ORI")!;
  assert.equal(meteorCivilGuidanceSchema.safeParse({ ...orionids, maximumTimeBasis: "UT-as-published" }).success, false);
  assert.equal(meteorCivilGuidanceSchema.safeParse({ ...orionids, startMonthDay: "10-03" }).success, false);
  assert.equal(meteorCivilGuidanceSchema.safeParse({ ...orionids, peakUtc: "2026-10-21T00:00:00Z" }).success, false);
});

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
  assert.equal(result.planetPairCoverage?.completeness,"not-certified");
  assert.match(result.caveats.join(" "), /closest approach.*unsupported/i);
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

test("default discovery includes greatest elongations and the final sorted result limit remains shared", async () => {
  const requested = { placeId: place(1).placeId, window: window("2026-02-19T00:00:00Z", "2026-02-21T00:00:00Z", "Asia/Kolkata"), limit: 25 };
  const discovery = await searchSkyEvents(requested, index);
  assert.ok(discovery.events.some(row => row.eventType === "greatest-elongation" && row.greatestElongation?.body === "Mercury"));
  assert.ok(!discovery.unsupportedEventTypes.includes("greatest-elongation"));
  const annual = { ...requested, window: window("2026-01-01T00:00:00Z", "2026-12-31T23:59:59Z", "Asia/Kolkata"), eventTypes: ["greatest-elongation", "moon-phase"] };
  const limited = await searchSkyEvents({ ...annual, limit: 2 }, index);
  const wider = await searchSkyEvents({ ...annual, limit: 25 }, index);
  assert.deepEqual(limited.events, wider.events.slice(0, 2));
  assert.equal(wider.events.length, 25);
  assert.equal(limited.availability.status, "partial");
  assert.match(limited.availability.reason, /truncated/);
  assert.match(limited.caveats.join(" "), /limited to the first 2/);
  assert.ok(wider.events.every((row, i) => i === 0 || row.peakUtc! >= wider.events[i-1]!.peakUtc!));
  const mixed = await searchSkyEvents({ ...requested, eventTypes: ["greatest-elongation", "comet"] }, index);
  assert.equal(mixed.availability.status, "partial");
  assert.deepEqual(mixed.unsupportedEventTypes, ["comet"]);
  assert.ok(mixed.events.some(row => row.eventType === "greatest-elongation"));
  const withAlignments = await searchSkyEvents({ ...requested, eventTypes: ["greatest-elongation", "planetary-conjunction"] }, index);
  assert.equal(withAlignments.availability.status, "partial");
  assert.match(withAlignments.caveats.join(" "), /heliocentric/);
  assert.match(withAlignments.caveats.join(" "), /3D/);
});

test("pair conjunction coverage is partial even when empty and keeps legacy horizons and unsupported classes separate", async () => {
  const query = (startUtc:string,endUtc:string,eventTypes?:string[],limit=25)=>searchSkyEvents({placeId:place(1).placeId,window:window(startUtc,endUtc,"Asia/Kolkata"),eventTypes,limit},index);
  const empty=await query("2026-06-09T00:00:00Z","2026-06-09T00:00:01Z",["planetary-conjunction"]);
  assert.equal(empty.planetPairCoverage?.status,"partial");
  assert.equal(empty.planetPairCoverage?.completeness,"not-certified");
  assert.equal(empty.planetPairCoverage?.pairCount,21);
  assert.equal(empty.availability.status,"partial");
  assert.equal(empty.events.length,0);
  for(const year of [2025,2027]) {
    const boundary=await query(`${year}-01-01T00:00:00Z`,`${year}-01-02T00:00:00Z`,["planetary-conjunction"]);
    assert.equal(boundary.planetPairCoverage?.status,"partial");
  }
  const legacy=await query("2024-06-01T00:00:00Z","2024-07-01T00:00:00Z",["planetary-conjunction"]);
  assert.equal(legacy.planetPairCoverage?.status,"out-of-horizon");
  assert.equal(legacy.availability.status,"partial");
  assert.ok(legacy.events.some(row=>row.eventType==="planetary-conjunction"&&!row.pairConjunction));
  assert.ok(legacy.events.every(row=>!row.pairConjunction));
  assert.equal((await query("2026-06-08T00:00:00Z","2026-06-11T00:00:00Z",["moon-phase"])).planetPairCoverage,undefined);
  const discovery=await query("2026-06-08T00:00:00Z","2026-06-11T00:00:00Z");
  assert.ok(discovery.events.some(row=>row.pairConjunction));
  const mixed=await query("2028-01-01T00:00:00Z","2028-02-01T00:00:00Z",["planetary-conjunction","moon-phase","comet"]);
  assert.deepEqual(mixed.unsupportedEventTypes,["comet"]);
  assert.equal(mixed.planetPairCoverage?.status,"out-of-horizon");
  assert.ok(mixed.events.some(row=>row.eventType==="moon-phase"));
  assert.ok(mixed.events.every(row=>!row.pairConjunction));
  const annual=await query("2026-01-01T00:00:00Z","2026-12-31T23:59:59Z",["planetary-conjunction"]);
  const limited=await query("2026-01-01T00:00:00Z","2026-12-31T23:59:59Z",["planetary-conjunction"],2);
  assert.equal(annual.events.length,25);
  assert.deepEqual(limited.events,annual.events.slice(0,2));
  assert.match(limited.availability.reason,/truncated/);
  assert.doesNotMatch(limited.caveats.join(" "),/complete list/i);
  assert.ok(annual.events.every((row,i)=>i===0||row.peakUtc!>=annual.events[i-1]!.peakUtc!));
  assert.ok(annual.planetPairCoverage!.unresolved.length<=256);
  assert.equal(skyEventsResultSchema.safeParse({...annual,planetPairCoverage:{...annual.planetPairCoverage,status:"available"}}).success,false);
  assert.equal(skyEventsResultSchema.safeParse({...annual,planetPairCoverage:{...annual.planetPairCoverage,completeness:"certified"}}).success,false);
});
