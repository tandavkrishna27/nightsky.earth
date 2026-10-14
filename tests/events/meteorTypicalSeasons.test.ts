import test from "node:test";
import assert from "node:assert/strict";
import { searchSkyEvents } from "../../server/events/catalog";
import { GeoNamesPlaceIndex } from "../../server/places/geonames";
import { skyEventsResultSchema } from "../../shared/nightsky/events";
import { planObservingSession } from "../../server/nightsky/planner";

const index = new GeoNamesPlaceIndex([{ geonameId: 1, name: "Pune", asciiName: "Pune", alternateNames: "", latitude: 18.52, longitude: 73.85, countryCode: "IN", countryName: "India", featureClass: "P", featureCode: "PPL", population: 1000, timeZone: "Asia/Kolkata", modificationDate: "2026-01-01" }], "fixture-v1");
const query = (eventTypes = ["meteor-shower"]) => searchSkyEvents({placeId:"place:v1:geonames:1", window:{startUtc:"2027-01-02T00:00:00Z",endUtc:"2027-01-05T00:00:00Z",timeZone:"Asia/Kolkata"},eventTypes},index);

test("meteor query exposes original typical intervals without claiming date overlap or adding dated events", async () => {
 const result = await query();
 const rows = (result as any).meteorTypicalSeasons;
 assert.ok(rows, "Source-only typical season evidence is missing");
 assert.deepEqual(rows.map((row:any)=>[row.code,row.solarLongitudeStartDeg,row.solarLongitudeEndDeg]), [["ETA",35,60],["ORI",195,220]]);
 assert.deepEqual(result.events, []);
 assert.equal(result.availability.status,"partial");
 for(const row of rows) {
  assert.equal(row.frame,"ecliptic J2000; solar longitude convention unspecified");
  assert.equal(row.requestedWindowOverlap,"not-evaluated");
  assert.equal(row.dateConversion,"unavailable");
  assert.equal(row.evidenceKind,"typical-activity-interval");
  assert.equal(row.source.licenseUrl,"https://creativecommons.org/licenses/by/4.0/");
  assert.ok(result.sources.some(source=>source.url===row.source.url));
  assert.equal(row.startUtc,undefined); assert.equal(row.peakUtc,undefined);
  assert.match(row.caveat,/not.*year-specific/i);
 }
 assert.match(result.caveats.join(" "),/overlap.*not evaluated/i);
});

test("nonmeteor queries omit season metadata and its source",async()=>{
 const result=await query(["moon-phase"]);
 assert.equal((result as any).meteorTypicalSeasons,undefined);
 assert.ok(!result.sources.some(source=>source.vintage==="Egal-et-al-2020-AA640-A58"));
});

test("typical source metadata rejects invented time fields, excessive rows, reversed intervals and false overlap claims",async()=>{
 const result=await query();
 const rows=(result as any).meteorTypicalSeasons;
 assert.ok(rows,"Source-only typical season evidence is missing");
 assert.equal(skyEventsResultSchema.safeParse(result).success,true);
 for(const patch of [{startUtc:"2027-05-01T00:00:00Z"},{solarLongitudeStartDeg:61},{requestedWindowOverlap:"overlaps"}]) {
  assert.equal(skyEventsResultSchema.safeParse({...result,meteorTypicalSeasons:[{...rows[0],...patch}]}).success,false);
 }
 assert.equal(skyEventsResultSchema.safeParse({...result,meteorTypicalSeasons:[...rows,rows[0]]}).success,false);
 assert.equal(skyEventsResultSchema.safeParse({...result,meteorTypicalSeasons:[{...rows[0],source:undefined}]}).success,false);
});

test("composed plan retains reference metadata without turning it into occurrence or radiant evidence",async()=>{
 const unavailable=async()=>{throw new Error("Provider unavailable in this fixture");};
 const window={startUtc:"2027-01-02T00:00:00Z",endUtc:"2027-01-02T06:00:00Z",timeZone:"Asia/Kolkata"};
 const result=await planObservingSession({placeId:"place:v1:geonames:1",activity:"meteor-shower",target:"ORI",window},{index,getAstronomy:unavailable,getNightConditions:unavailable,getTargetVisibility:unavailable,getLocationContext:unavailable,searchEvents:(placeId,requested)=>searchSkyEvents({placeId,window:requested,eventTypes:["meteor-shower"]},index)});
 assert.equal(result.evidence?.events?.meteorTypicalSeasons?.length,2);
 assert.deepEqual(result.evidence?.events?.events,[]);
 assert.match(result.evidence?.events?.caveats.join(" ")??"",/overlap.*not evaluated/i);
 assert.ok(result.evidence?.meteorRadiantSamples?.every(row=>row.status!=="available"));
});
