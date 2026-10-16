import test from "node:test";
import assert from "node:assert/strict";
import { searchSkyEvents } from "../../server/events/catalog";
import { GeoNamesPlaceIndex } from "../../server/places/geonames";
import { skyEventsResultSchema } from "../../shared/nightsky/events";
import { planObservingSession } from "../../server/nightsky/planner";

const index = new GeoNamesPlaceIndex([{ geonameId: 1, name: "Pune", asciiName: "Pune", alternateNames: "", latitude: 18.52, longitude: 73.85, countryCode: "IN", countryName: "India", featureClass: "P", featureCode: "PPL", population: 1000, timeZone: "Asia/Kolkata", modificationDate: "2026-01-01" }], "fixture-v1");
const query = (eventTypes = ["meteor-shower"]) => searchSkyEvents({placeId:"place:v1:geonames:1", window:{startUtc:"2028-01-02T00:00:00Z",endUtc:"2028-01-05T00:00:00Z",timeZone:"Asia/Kolkata"},eventTypes},index);

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
 assert.equal(result.evidence?.events?.meteorCalendarGuidance?.entries[1]?.sourceWording,"late October");
 assert.deepEqual(result.evidence?.events?.events,[]);
 assert.match(result.evidence?.events?.caveats.join(" ")??"",/overlap.*not evaluated/i);
 assert.ok(result.evidence?.meteorRadiantSamples?.every(row=>row.status!=="available"));
});

test("approximate calendar survives discovery without inventing annual dates or overlap", async () => {
 const result = await query();
 const guidance = (result as any).meteorCalendarGuidance;
 assert.ok(guidance, "Approximate calendar guidance is missing");
 assert.equal(guidance.availability.status, "partial");
 assert.match(guidance.availability.reason, /other showers.*unavailable/i);
 assert.deepEqual(guidance.entries.map((row:any)=>[row.code,row.sourceWording]), [["ETA","early May"],["ORI","late October"],["GEM","December"],["LYR","April"],["PER","August"],["LEO","around Nov. 17 or 18"],["QUA","early-January"],["DSX","late September and early October"],["ARI","on or near June 8th"],["CAP","late July"],["DRA","October"],["NTA","middle and late November"],["STA","October and early November"],["HYD","December"],["AND","early November"],["SDA","end of July"],["URS","December"],["ZPE","first half of June"]]);
 for (const row of guidance.entries) {
  assert.equal(row.precision,"verbal-period");
  assert.equal(row.recurrenceBasis,"typical-annual");
  assert.equal(row.requestedWindowOverlap,"not-evaluated");
  if (["ETA", "ORI"].includes(row.code)) {
   assert.equal(row.sourceLocator,"Section 1, introduction, page 1");
   assert.equal(row.source.licenseUrl,"https://creativecommons.org/licenses/by/4.0/");
  }
  assert.equal(row.peakUtc,undefined);
  for(const patch of [{peakUtc:"2028-05-05T00:00:00Z"},{precision:"day"},{requestedWindowOverlap:"overlaps"},{source:undefined}]) {
   assert.equal(skyEventsResultSchema.safeParse({...result, meteorCalendarGuidance:{...guidance,entries:[{...row,...patch}]}}).success,false);
  }
 }
 assert.deepEqual(result.events,[]);
 assert.equal(skyEventsResultSchema.safeParse({...result,meteorCalendarGuidance:undefined}).success,true);
 assert.equal(skyEventsResultSchema.safeParse({...result,meteorCalendarGuidance:{...guidance,entries:[guidance.entries[0],guidance.entries[0]]}}).success,false);
 assert.equal((await query(["moon-phase"]) as any).meteorCalendarGuidance,undefined);
});

test("Geminid annual month fact keeps original source and never becomes a forecast", async () => {
 const result = await query();
 const row = result.meteorCalendarGuidance?.entries.find(entry => String(entry.code) === "GEM");
 assert.ok(row, "Geminid annual month guidance missing");
 assert.equal(row.sourceWording, "December");
 assert.equal(row.precision, "verbal-period");
 assert.equal(row.requestedWindowOverlap, "not-evaluated");
 assert.equal(row.source.url, "https://www.jpl.nasa.gov/videos/whats-up-december-2023/");
 assert.equal(row.source.licenseUrl, undefined);
 assert.match(row.source.attribution, /calendar fact.*NightSky/i);
 assert.ok(result.sources.some(source => source.url === row.source.url));
 assert.deepEqual(result.events, []);
});

for (const [code, wording, url] of [
 ["LYR", "April", "https://www.jpl.nasa.gov/videos/whats-up-april-2023/"],
 ["PER", "August", "https://science.nasa.gov/resource/whats-up-august-2021/"],
 ["LEO", "around Nov. 17 or 18", "https://www.jpl.nasa.gov/news/nasa-leonids-activities-sleepheads-may-miss-spectacular-celestial-display/"],
]) test(`${code} original annual wording remains reference evidence outside its calendar period`, async () => {
 const result = await query(); // January 2028, outside every admitted phrase and forecast year.
 const row = result.meteorCalendarGuidance?.entries.find(entry => String(entry.code) === code);
 assert.ok(row, `${code} annual guidance missing`);
 assert.equal(row.sourceWording, wording);
 assert.equal(row.source.url, url);
 assert.equal(row.source.licenseUrl, undefined);
 assert.match(row.source.attribution, /calendar fact.*NightSky/i);
 assert.ok(result.sources.some(source => source.url === url));
 assert.equal(row.requestedWindowOverlap, "not-evaluated");
 assert.deepEqual(result.events, []);
 const nonMeteor = await query(["moon-phase"]);
 assert.ok(!nonMeteor.sources.some(source => source.url === url));
});

test("calendar caveat identifies every supplied shower without claiming missing guidance for it", async () => {
  const result = await query();
  const caveat = result.caveats.find(text => text.startsWith("Approximate meteor calendar guidance"));
  assert.ok(caveat);
  for (const code of ["ETA", "ORI", "GEM", "LYR", "PER", "LEO"]) {
   assert.ok(caveat.includes(code), `Caveat omits supported ${code} guidance`);
  }
  assert.doesNotMatch(caveat, /Other showers have no admitted/);
 });

for (const [code, wording, url] of [
 ["QUA", "early-January", "https://science.nasa.gov/solar-system/meteors-meteorites/quadrantids/"],
 ["DSX", "late September and early October", "https://arxiv.org/html/2208.03521v1"],
 ["ARI", "on or near June 8th", "https://www.weather.gov/fsd/meteor"],
 ["CAP", "late July", "https://nightsky.jpl.nasa.gov/events/12408/"],
 ["DRA", "October", "https://science.nasa.gov/image-article/apod-2011-october-19-draconid-meteors-over-spain/"],
 ["NTA", "middle and late November", "https://arxiv.org/html/2202.05141v1"],
 ["STA", "October and early November", "https://arxiv.org/html/2202.05141v1"],
 ["HYD", "December", "https://science.nasa.gov/image-article/apod-2023-september-9-comet-nishimura-grows/"],
 ["AND", "early November", "https://www.emeteornews.net/2021/12/01/andromedid-activity-in-2021/"],
 ["SDA", "end of July", "https://www.emeteornews.net/2026/03/30/the-southern-delta-aquariids-2000-2025/"],
 ["URS", "December", "https://www.hou.usra.edu/meetings/lpsc2021/pdf/1275.pdf"],
 ["ZPE", "first half of June", "https://www.ta3.sk/caosp/Eedition/FullTexts/vol37no1/pp31-48.pdf"],
]) test(`${code} source closure retains annual precision and excludes local visibility inference`, async () => {
 const result = await query();
 const row = result.meteorCalendarGuidance?.entries.find(entry => String(entry.code) === code);
 assert.ok(row, `${code} annual guidance missing`);
 assert.equal(row.sourceWording, wording);
 assert.equal(row.source.url, url);
 assert.equal(row.source.licenseUrl, undefined);
 assert.ok(result.sources.some(source => source.url === url));
 assert.equal(row.precision, "verbal-period");
 assert.equal(row.requestedWindowOverlap, "not-evaluated");
 if (["DSX", "ARI", "ZPE"].includes(code)) assert.match(row.caveat, /daytime/i);
 if (code === "AND") {
  assert.match(row.caveat, /most years/i);
  assert.match(row.caveat, /low annual activity/i);
  assert.match(row.caveat, /outbursts.*separate/i);
 }
 assert.deepEqual(result.events, []);
 for (const patch of [{startUtc:"2028-06-08T00:00:00Z"}, {localVisibility:"visible"}, {precision:"day"}]) {
  assert.equal(skyEventsResultSchema.safeParse({...result,meteorCalendarGuidance:{...result.meteorCalendarGuidance,entries:[{...row,...patch}]}}).success,false);
 }
 assert.ok(!(await query(["moon-phase"])).sources.some(source => source.url === url));
});
