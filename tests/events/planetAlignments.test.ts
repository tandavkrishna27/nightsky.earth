import test from "node:test";
import assert from "node:assert/strict";
import { GeoNamesPlaceIndex } from "../../server/places/geonames";
import { searchSkyEvents } from "../../server/events/catalog";
import { createRequire } from "node:module";
import type * as AstronomyTypes from "astronomy-engine";
import { skyEventSchema, searchSkyEventsInputSchema, skyEventsResultSchema } from "../../shared/nightsky/events";
import { findPlanetAlignments } from "../../server/events/planetAlignments";
const Astronomy = createRequire(import.meta.url)("astronomy-engine") as typeof AstronomyTypes;

const index = new GeoNamesPlaceIndex([{ geonameId: 1, name: "Pune", asciiName: "Pune", alternateNames: "", latitude: 18.5204, longitude: 73.8567, countryCode: "IN", countryName: "India", featureClass: "P", featureCode: "PPL", population: 1, timeZone: "Asia/Kolkata", modificationDate: "2026-01-01" }], "fixture");
const search = (startUtc: string, endUtc: string, eventTypes = ["opposition", "planetary-conjunction"]) => searchSkyEvents({ placeId: "place:v1:geonames:1", window: { startUtc, endUtc, timeZone: "Asia/Kolkata" }, eventTypes, limit: 25 }, index);

test("planet alignments match independent NAOJ event identities within preselected two-hour convention envelope", async () => {
  // (c) NAOJ. ECO terms permit reuse with credit. UT+9 table converted to UTC.
  // https://eco.mtk.nao.ac.jp/cgi-bin/koyomi/cande/phenomena_f_en.cgi
  // https://eco.mtk.nao.ac.jp/koyomi/site/index.html.en (reviewed 2026-10-14).
  // Definition differs: geocentric longitude vs runtime heliocentric relative longitude.
  const result = await search("2026-01-01T00:00:00Z", "2026-12-31T23:59:59Z");
  for (const [name, utc] of [
    ["Jupiter Opposition (heliocentric longitude)", "2026-01-10T08:42:00Z"],
    ["Saturn Opposition (heliocentric longitude)", "2026-10-04T12:29:00Z"],
    ["Uranus Opposition (heliocentric longitude)", "2026-11-25T22:41:00Z"],
    ["Neptune Opposition (heliocentric longitude)", "2026-09-26T01:36:00Z"],
    ["Venus Superior Solar Conjunction (heliocentric longitude)", "2026-01-06T16:36:00Z"],
    ["Mars Superior Solar Conjunction (heliocentric longitude)", "2026-01-09T11:41:00Z"],
    ["Mercury Inferior Solar Conjunction (heliocentric longitude)", "2026-03-07T11:02:00Z"],
  ]) {
    const nearReference = await search(new Date(Date.parse(utc!)-2*86_400_000).toISOString(), new Date(Date.parse(utc!)+2*86_400_000).toISOString());
    const event = nearReference.events.find(event => event.name === name && !event.pairConjunction);
    assert.ok(event?.peakUtc, name);
    assert.ok(Math.abs(Date.parse(event.peakUtc) - Date.parse(utc!)) <= 2 * 3600_000, name);
    assert.equal(event.localVisibility, "not-evaluated");
    assert.equal(event.source.vintage, "astronomy-engine-2.1.19");
    assert.match(event.description!, /heliocentric/);
  }
  assert.equal(result.availability.status, "partial");
  assert.match(result.caveats.join(" "), /planet-pair/i);
  assert.ok(!result.unsupportedEventTypes.includes("opposition"));
});

test("planet streams filter inclusive boundaries and avoid annual recurrence", async () => {
  const result = await search("2026-01-01T00:00:00Z", "2026-02-01T00:00:00Z", ["opposition"]);
  assert.equal(result.events.length, 1);
  const time = result.events[0]!.peakUtc!;
  assert.equal((await search(time, new Date(Date.parse(time)+1000).toISOString(), ["opposition"])).events.length, 1);
  assert.equal((await search(new Date(Date.parse(time)-1000).toISOString(), time, ["opposition"])).events.length, 1);
  assert.equal((await search(new Date(Date.parse(time)+1000).toISOString(), new Date(Date.parse(time)+2000).toISOString(), ["opposition"])).events.length, 0);
  assert.ok(!(await search("2026-01-01T00:00:00Z", "2026-12-31T00:00:00Z", ["opposition"])).events.some(e => e.name.startsWith("Mars")));
});

test("planet date horizon returns explicit unavailable coverage and preserves unrelated unsupported types", async () => {
  const result = await search("1800-01-01T00:00:00Z", "1800-01-02T00:00:00Z", ["opposition"]);
  assert.equal(result.availability.status, "out-of-horizon");
  assert.deepEqual(result.events, []);
  const mixed = await search("2026-01-01T00:00:00Z", "2026-02-01T00:00:00Z", ["opposition", "comet", "occultation"]);
  assert.deepEqual(mixed.unsupportedEventTypes, ["occultation", "comet"]);
});

test("calculated alignments satisfy stated heliocentric longitude and retain stable identity across queries", async () => {
  const result = await search("2026-01-01T00:00:00Z", "2026-12-31T23:59:59Z");
  for (const event of result.events.filter(row => !row.pairConjunction)) {
    const body = event.name.split(" ")[0] as AstronomyTypes.Body;
    const relative = Astronomy.EclipticLongitude(Astronomy.Body.Earth, new Date(event.peakUtc!)) - Astronomy.EclipticLongitude(body, new Date(event.peakUtc!));
    const target = event.name.includes("Superior") ? 180 : 0;
    const residual = ((relative-target+540)%360)-180;
    assert.ok(Math.abs(residual) < 0.001, `${event.name}: ${residual}`);
    const narrow = await search(event.peakUtc!, new Date(Date.parse(event.peakUtc!)+1000).toISOString(), [event.eventType]);
    assert.ok(narrow.events.some(other => other.eventId === event.eventId));
  }
});

test("year crossing window fits budgets and exposes every Mercury solar stream", async () => {
  const result = await search("2026-12-30T00:00:00Z", "2027-12-30T00:00:00Z", ["planetary-conjunction"]);
  const legacy = findPlanetAlignments(Date.parse("2026-12-30T00:00:00Z"), Date.parse("2027-12-30T00:00:00Z"), false, true, result.sources[0]!);
  const mercury = legacy.filter(event => event.name.startsWith("Mercury"));
  assert.ok(mercury.length >= 6 && mercury.length <= 8);
  assert.ok(mercury.some(event => event.name.includes("Inferior")));
  assert.ok(mercury.some(event => event.name.includes("Superior")));
  assert.equal(new Set(result.events.map(event => event.eventId)).size, result.events.length);
  assert.ok(result.events.every(event => event.peakUtc! >= "2026-12-30T00:00:00Z" && event.peakUtc! <= "2027-12-30T00:00:00Z"));
  const narrow = await search("2027-01-01T00:00:00Z", "2027-12-30T00:00:00Z", ["planetary-conjunction"]);
  assert.deepEqual(result.events.filter(row => !row.pairConjunction), narrow.events.filter(row => !row.pairConjunction));
});

test("same-RA planetary conjunctions match the fixed coarse PAGASA identities without borrowing closest approach", async () => {
  // PAGASA August2025/June2026 diaries, Planetary Location, PDF p3/printed p2.
  // https://pubfiles.pagasa.dost.gov.ph/pagasaweb/files/astronomy/08%20Astro%20Diary%20Press%20Release%20August%202025.pdf
  // https://pubfiles.pagasa.dost.gov.ph/pagasaweb/files/astronomy/06%20Astro%20Diary%20Press%20Release%20June%202026.pdf
  // PhST = UTC+8: PAGASA TD_USMAN_2018 report, printed p8 Notes(1).
  // Diaries cite MICA/In-The-Sky. Their epoch/location/correction flags and
  // whole-hour rounding are unestablished: fixed60min time-only envelope,
  // selected BEFORE outputs; no correction-equivalence/all-pair accuracy claim.
  for (const utc of ["2025-08-12T08:00:00Z", "2026-06-09T12:00:00Z"]) {
    const result = await search(new Date(Date.parse(utc)-86_400_000).toISOString(), new Date(Date.parse(utc)+86_400_000).toISOString(), ["planetary-conjunction"]);
    const event = result.events.find(row => row.pairConjunction?.bodies.join("/") === "Venus/Jupiter");
    assert.ok(event?.peakUtc, `PAGASA same-RA case ${utc}`);
    assert.ok(Math.abs(Date.parse(event.peakUtc)-Date.parse(utc)) <= 60*60_000);
    assert.equal(event.localVisibility, "not-evaluated");
    assert.equal(event.pairConjunction!.definition, "geocentric-right-ascension-of-date");
    assert.equal(event.pairConjunction!.corrections, "light-time-and-aberration");
    assert.match(event.description!, /not.*closest/i);
    const time = new Date(event.peakUtc);
    const rotation = Astronomy.Rotation_EQJ_EQD(time);
    const vectors = event.pairConjunction!.bodies.map(body => Astronomy.GeoVector(body as AstronomyTypes.Body, time, true));
    const ra = vectors.map(vector => Astronomy.SphereFromVector(Astronomy.RotateVector(rotation, vector)).lon);
    assert.ok(Math.abs(((ra[1]!-ra[0]!+540)%360)-180) <= 1e-6);
    assert.ok(Math.abs(event.pairConjunction!.angularSeparationDeg-Astronomy.AngleBetween(vectors[0]!, vectors[1]!)) < 1e-8);
    assert.equal(result.planetPairCoverage!.status, "partial");
    assert.equal(result.planetPairCoverage!.completeness, "not-certified");
    assert.equal(result.planetPairCoverage!.pairCount, 21);
  }
});

test("pair metadata validates canonical bodies and excludes duration, visibility and unrelated event claims", () => {
  const event = { eventId: "pair:fixture", name: "Venus/Jupiter same-RA crossing", eventType: "planetary-conjunction", peakUtc: "2026-06-09T12:00:00Z", localVisibility: "not-evaluated", source: { name: "Fixture", url: "https://example.test/source", attribution: "Synthetic contract fixture", dataClass: "calculation" }, pairConjunction: { bodies: ["Venus", "Jupiter"], definition: "geocentric-right-ascension-of-date", corrections: "light-time-and-aberration", angularSeparationDeg: 2, crossingDirection: "ascending" } };
  assert.equal(skyEventSchema.safeParse(event).success, true);
  for (const bodies of [["Jupiter","Venus"], ["Venus","Venus"], ["Earth","Venus"], ["Moon","Mars"], ["Venus","Jupiter","Saturn"]]) {
    assert.equal(skyEventSchema.safeParse({ ...event, pairConjunction: { ...event.pairConjunction, bodies } }).success, false);
  }
  for (const patch of [{ peakUtc: undefined }, { startUtc: event.peakUtc }, { endUtc: event.peakUtc }, { activityCalendarDateWindow: { startDate: "2026-06-09", endDate: "2026-06-10" } }, { peakCalendarDateWindow: { startDate: "2026-06-09", endDate: "2026-06-10" } }, { localVisibility: "visible" }, { eventType: "opposition" }]) {
    assert.equal(skyEventSchema.safeParse({ ...event, ...patch }).success, false);
  }
  for (const patch of [{ definition: "closest-approach" }, { corrections: "none" }, { angularSeparationDeg: NaN }, { angularSeparationDeg: -1 }, { angularSeparationDeg: 181 }, { crossingDirection: "stationary" }, { extra: true }]) {
    assert.equal(skyEventSchema.safeParse({ ...event, pairConjunction: { ...event.pairConjunction, ...patch } }).success, false);
  }
  assert.equal(skyEventSchema.safeParse({ ...event, pairConjunction: undefined }).success, true);
});

const DAY = 86_400_000;
const screening = async () => {
  const implementation = await import("../../server/events/planetPairConjunctions").catch(() => undefined);
  assert.ok(implementation?.screenPairCrossings, "Missing pure numerical screening entry point");
  return implementation!.screenPairCrossings;
};

test("synthetic screening distinguishes both directions, wrapped equality and opposite RA", async () => {
  const screen = await screening();
  for (const [angleAt, direction] of [[(t:number)=>10*(t/DAY-2.03), "ascending"], [(t:number)=>-10*(t/DAY-2.03), "descending"], [(t:number)=>(359+2*t/DAY)%360, "ascending"]] as const) {
    const result = screen(0, 4*DAY, angleAt);
    assert.equal(result.roots.length, 1);
    assert.equal(result.roots[0]!.crossingDirection, direction);
    assert.equal(result.completeness, "not-certified");
    assert.equal(result.unresolved.length, 0);
    const expected = angleAt(0) === 359 ? 0.5*DAY : 2.03*DAY;
    assert.ok(Math.abs(result.roots[0]!.time-expected) <= 100);
  }
  assert.deepEqual(screen(0, 4*DAY, t=>170+20*t/DAY).roots, []);
});

test("synthetic screening resolves two bracketed close crossings but retains tangent and near-miss uncertainty", async () => {
  const screen = await screening();
  const repeated = screen(0, 4*DAY, t=>10*(t/DAY-2.01)*(t/DAY-2.03));
  assert.equal(repeated.roots.length, 2);
  assert.deepEqual(repeated.roots.map(row=>row.crossingDirection), ["descending","ascending"]);
  assert.ok(repeated.roots[1]!.time-repeated.roots[0]!.time < 6*3600_000);
  // Two distinguishable opposite-direction roots less than two seconds apart
  // must not merge merely because they fit the grid matching tolerance.
  const close=screen(0,4*DAY,t=>0.1*(t/DAY-2.01)*(t/DAY-2.01001));
  assert.equal(close.roots.length,2);
  assert.deepEqual(close.roots.map(row=>row.crossingDirection),["descending","ascending"]);
  assert.ok(Math.abs(close.roots[0]!.time-2.01*DAY)<=100);
  assert.ok(Math.abs(close.roots[1]!.time-2.01001*DAY)<=100);
  assert.equal(close.unresolved.length,0);
  for (const offset of [0, 0.005]) {
    const tangent = screen(0, 4*DAY, t=>(t/DAY-2.03)**2+offset);
    assert.deepEqual(tangent.roots, []);
    assert.ok(tangent.unresolved.some(row=>/stationary|tangent/.test(row.reason)));
  }
});

test("an interval of constant equal RA is unresolved rather than an empty crossing inventory", async () => {
  const screen=await screening();
  const constant=screen(0,2*DAY,()=>0);
  assert.deepEqual(constant.roots,[]);
  assert.ok(constant.unresolved.some(row=>/stationary|constant|ambiguous/.test(row.reason)));
  const endpoint=screen(0,DAY,t=>(t/DAY)**2);
  assert.deepEqual(endpoint.roots,[]);
  assert.ok(endpoint.unresolved.length>0,"Tangent equality at the screening endpoint needs explicit unresolved coverage");
});

test("flat near-equal RA plateaus stay unresolved", async () => {
  const screen=await screening();
  for(const angleAt of [()=>0.005,(t:number)=>t>=DAY/2&&t<=1.5*DAY?0.005:0.005+(Math.abs(t/DAY-1)-0.5)**2]) {
    const flat=screen(0,2*DAY,angleAt);
    assert.deepEqual(flat.roots,[]);
    assert.ok(flat.unresolved.length>0,"Flat near-equal RA must not silently look empty");
  }
});

test("exact sampled endpoint roots still meet the numerical width bound",async()=>{
  const screen=await screening();
  const exact=screen(0,2*DAY,t=>10*(t/DAY-1));
  assert.equal(exact.roots.length,1);
  assert.ok(exact.roots[0]!.end-exact.roots[0]!.start<=100,"Exact sampled roots still require a narrow bracket");
});

test("synthetic grid disagreement, nonfinite geometry and exhausted numerical/output budgets stay explicit", async () => {
  const screen = await screening();
  const disagreement = screen(0, 2*DAY, t=>5*Math.sin(2*Math.PI*(t/DAY-0.03)/0.2));
  assert.ok(disagreement.unresolved.some(row=>/grid|ambiguous/.test(row.reason)));
  for (const [angleAt, limits, pattern] of [
    [(t:number)=>t===DAY/2 ? NaN : t/DAY, {}, /nonfinite/],
    [(t:number)=>t/DAY-1.2345, { evaluationLimit: 5 }, /evaluation.*budget/],
    [(t:number)=>t/DAY-1.2345, { refinementLimit: 1 }, /refinement.*budget/],
    [(t:number)=>5*Math.sin(2*Math.PI*(t/DAY-0.03)/0.2), { unresolvedLimit: 1 }, /unresolved.*budget/],
  ] as const) {
    const result = screen(0, 3*DAY, angleAt, limits);
    assert.deepEqual(result.roots, []);
    assert.ok(result.unresolved.some(row=>pattern.test(row.reason)));
    assert.ok(result.evaluations <= ("evaluationLimit" in limits ? limits.evaluationLimit! : 30_000));
  }
});

test("pair dates and identities are canonical across endpoints and year joins while coverage stays partial", async () => {
  const result = await search("2026-06-08T00:00:00Z", "2026-06-11T00:00:00Z", ["planetary-conjunction"]);
  const event = result.events.find(row=>row.pairConjunction?.bodies.join("/") === "Venus/Jupiter");
  assert.ok(event?.peakUtc);
  const instant=Date.parse(event.peakUtc);
  for (const [start,end] of [[instant,instant+1000],[instant-1000,instant]]) {
    const narrow=await search(new Date(start).toISOString(),new Date(end).toISOString(),["planetary-conjunction"]);
    assert.ok(narrow.events.some(row=>row.eventId===event.eventId));
  }
  assert.ok(!(await search(new Date(instant+1).toISOString(),new Date(instant+1000).toISOString(),["planetary-conjunction"])).events.some(row=>row.eventId===event.eventId));
  const joined=await search("2025-12-20T00:00:00Z","2026-01-20T00:00:00Z",["planetary-conjunction"]);
  const left=await search("2025-12-20T00:00:00Z","2026-01-01T00:00:00Z",["planetary-conjunction"]);
  const right=await search("2026-01-01T00:00:00Z","2026-01-20T00:00:00Z",["planetary-conjunction"]);
  assert.deepEqual([...new Map([...left.events,...right.events].map(row=>[row.eventId,row])).values()],joined.events);
  assert.equal(joined.events.length,new Set(joined.events.map(row=>row.eventId)).size);
  assert.equal(skyEventsResultSchema.safeParse(joined).success,true);
});

test("greatest elongations match independently published NAOJ times and full angles within preselected display envelopes", async () => {
  // (c) NAOJ; Celestial Phenomena 2026, UT+9, Delta T = 69 s; inspected 2026-10-17.
  // https://eco.mtk.nao.ac.jp/cgi-bin/koyomi/cande/phenomena_f_en.cgi
  // Definition: https://eco.mtk.nao.ac.jp/koyomi/faq/phenomena.html.en
  // Reuse with credit: https://eco.mtk.nao.ac.jp/koyomi/site/index.html.en
  // Source displays whole hours and arcminutes, rounding unspecified. These fixed
  // 60-minute / 2-arcminute comparison envelopes are not universal accuracy bounds.
  const result = await search("2026-01-01T00:00:00Z", "2026-12-31T23:59:59Z", ["greatest-elongation"]);
  for (const [body, viewingGeometry, utc, angle] of [
    ["Mercury", "evening", "2026-02-19T18:00:00Z", 18 + 7/60],
    ["Mercury", "morning", "2026-04-03T22:00:00Z", 27 + 49/60],
    ["Venus", "evening", "2026-08-15T06:00:00Z", 45 + 53/60],
  ] as const) {
    const event = result.events.find(row => row.greatestElongation?.body === body && row.greatestElongation.viewingGeometry === viewingGeometry && Math.abs(Date.parse(row.peakUtc!) - Date.parse(utc)) <= 60*60_000);
    assert.ok(event?.greatestElongation, `${body} ${viewingGeometry} NAOJ event`);
    assert.ok(Math.abs(event.greatestElongation.elongationDeg - angle) <= 1/30, `${body} full 3D angle`);
    assert.equal(event.eventType, "greatest-elongation");
    assert.equal(event.source.vintage, "astronomy-engine-2.1.19");
    assert.equal(event.source.dataClass, "calculation");
    assert.ok(event.source.licenseUrl?.endsWith("/LICENSE"));
    assert.match(event.description!, /geocentric.*3D/i);
    assert.match(event.description!, /light.time.*aberration/i);
    assert.equal(event.localVisibility, "not-evaluated");
  }
  assert.equal(result.availability.status, "available");
  assert.doesNotMatch(result.caveats.join(" "), /heliocentric/);
  assert.match(result.caveats.join(" "), /morning.*evening.*not.*local/i);
});

test("Venus morning time matches the published NAOJ 2025 almanac without borrowing an angle", async () => {
  // (c) NAOJ. Published 2025 almanac, printed pp. 2-3 (legend/definition),
  // p. 114 (planetary phenomena): June 1, 12h JCST, Venus greatest west.
  // https://eco.mtk.nao.ac.jp/koyomi/cande/pdf/cande2025.pdf#page=114
  // JCST = UTC + 9h; adopted Delta UT1 = 0, Delta T = 69s. Whole-hour
  // display, rounding unspecified. Keep the preselected 60-minute envelope;
  // the table supplies no angle, so this is a TIME-only independent check.
  const result = await search("2025-06-01T00:00:00Z", "2025-06-02T00:00:00Z", ["greatest-elongation"]);
  assert.equal(result.events.length, 1);
  const event = result.events[0]!;
  assert.equal(event.greatestElongation?.body, "Venus");
  assert.equal(event.greatestElongation?.viewingGeometry, "morning");
  assert.ok(Math.abs(Date.parse(event.peakUtc!) - Date.parse("2025-06-01T03:00:00Z")) <= 60*60_000);
  assert.equal(event.localVisibility, "not-evaluated");
});

test("both planets retain both elongation geometries and modeled local angular maxima without claiming independent Venus morning angle validation", async () => {
  const result = await search("2025-01-01T00:00:00Z", "2025-12-31T23:59:59Z", ["greatest-elongation"]);
  for (const body of ["Mercury", "Venus"]) {
    assert.ok(result.events.some(row => row.greatestElongation?.body === body && row.greatestElongation.viewingGeometry === "morning"));
    assert.ok(result.events.some(row => row.greatestElongation?.body === body && row.greatestElongation.viewingGeometry === "evening"));
  }
  for (const event of result.events) {
    const metadata = event.greatestElongation!;
    const instant = Date.parse(event.peakUtc!);
    const body = metadata.body as AstronomyTypes.Body;
    assert.ok(Math.abs(metadata.elongationDeg - Astronomy.AngleFromSun(body, new Date(instant))) < 1e-8);
    assert.ok(metadata.elongationDeg > Astronomy.AngleFromSun(body, new Date(instant-86_400_000)));
    assert.ok(metadata.elongationDeg > Astronomy.AngleFromSun(body, new Date(instant+86_400_000)));
    assert.equal(event.startUtc, undefined);
    assert.equal(event.endUtc, undefined);
    assert.equal(event.activityCalendarDateWindow, undefined);
    assert.equal(event.peakCalendarDateWindow, undefined);
  }
});

test("greatest elongation metadata is required only for an instant-only event with unevaluated visibility", () => {
  const event = { eventId: "elongation:fixture", name: "Mercury Greatest Elongation", eventType: "greatest-elongation", peakUtc: "2026-02-19T18:00:00Z", localVisibility: "not-evaluated", source: { name: "Contract fixture", url: "https://example.test/source", attribution: "Synthetic contract fixture", dataClass: "calculation" }, greatestElongation: { body: "Mercury", elongationDeg: 18, viewingGeometry: "evening" } };
  assert.equal(skyEventSchema.safeParse(event).success, true);
  for (const patch of [
    { greatestElongation: undefined }, { peakUtc: undefined }, { localVisibility: "visible" },
    { startUtc: event.peakUtc }, { endUtc: event.peakUtc },
    { activityCalendarDateWindow: { startDate: "2026-02-19", endDate: "2026-02-20" } },
    { peakCalendarDateWindow: { startDate: "2026-02-19", endDate: "2026-02-20" } },
  ]) assert.equal(skyEventSchema.safeParse({ ...event, ...patch }).success, false);
  for (const patch of [{ body: "Mars" }, { elongationDeg: NaN }, { elongationDeg: -1 }, { elongationDeg: 181 }, { viewingGeometry: "visible" }, { extra: true }]) {
    assert.equal(skyEventSchema.safeParse({ ...event, greatestElongation: { ...event.greatestElongation, ...patch } }).success, false);
  }
  for (const eventType of ["opposition", "planetary-conjunction", "meteor-shower", "moon-phase"]) {
    assert.equal(skyEventSchema.safeParse({ ...event, eventType }).success, false);
    assert.equal(skyEventSchema.safeParse({ ...event, eventType, greatestElongation: undefined }).success, true);
  }
  const input = { placeId: "place:v1:geonames:1", window: { startUtc: "2026-01-01T00:00:00Z", endUtc: "2026-01-02T00:00:00Z", timeZone: "Asia/Kolkata" }, eventTypes: ["meteor-shower", "eclipse", "occultation", "planetary-conjunction", "opposition", "greatest-elongation", "equinox-solstice", "moon-phase", "comet", "other"] };
  assert.equal(searchSkyEventsInputSchema.safeParse(input).success, true);
});

test("elongation streams preserve stable identity across inclusive endpoints and overlapping year boundaries", async () => {
  const result = await search("2026-12-01T00:00:00Z", "2027-12-01T00:00:00Z", ["greatest-elongation"]);
  assert.ok(result.events.length > 0);
  assert.equal(new Set(result.events.map(row => row.eventId)).size, result.events.length);
  for (const event of result.events) {
    const instant = Date.parse(event.peakUtc!);
    for (const [start, end] of [[instant, instant+1000], [instant-1000, instant]]) {
      const narrow = await search(new Date(start).toISOString(), new Date(end).toISOString(), ["greatest-elongation"]);
      assert.deepEqual(narrow.events, [event]);
    }
    assert.deepEqual((await search(new Date(instant+1).toISOString(), new Date(instant+1000).toISOString(), ["greatest-elongation"])).events, []);
  }
  const left = await search("2026-12-01T00:00:00Z", "2027-01-01T00:00:00Z", ["greatest-elongation"]);
  const right = await search("2027-01-01T00:00:00Z", "2027-12-01T00:00:00Z", ["greatest-elongation"]);
  assert.deepEqual([...new Map([...left.events, ...right.events].map(row => [row.eventId, row])).values()], result.events);
});

test("elongation horizon distinguishes unavailable geometry from unrelated supported and unsupported classes", async () => {
  const outside = await search("1899-12-31T00:00:00Z", "1900-01-02T00:00:00Z", ["greatest-elongation"]);
  assert.equal(outside.availability.status, "out-of-horizon");
  assert.deepEqual(outside.events, []);
  assert.match(outside.availability.reason, /elongation/i);
  for (const [start, end] of [["1900-01-01T00:00:00Z", "1900-12-31T00:00:00Z"], ["2100-01-01T00:00:00Z", "2100-12-31T23:59:59Z"]]) {
    const edge = await search(start!, end!, ["greatest-elongation"]);
    assert.equal(edge.availability.status, "available");
    assert.ok(edge.events.length > 0);
  }
  const beyond = await search("2100-12-31T00:00:00Z", "2101-01-01T00:00:00Z", ["greatest-elongation"]);
  assert.equal(beyond.availability.status, "out-of-horizon");
  const mixed = await search("1800-01-01T00:00:00Z", "1800-02-01T00:00:00Z", ["greatest-elongation", "moon-phase", "comet"]);
  assert.equal(mixed.availability.status, "partial");
  assert.deepEqual(mixed.unsupportedEventTypes, ["comet"]);
  assert.ok(mixed.events.some(row => row.eventType === "moon-phase"));
  assert.ok(mixed.events.every(row => row.eventType !== "greatest-elongation"));
  await assert.rejects(search("2026-01-01T00:00:00Z", "2027-01-03T00:00:00Z", ["greatest-elongation"]));
});

test("elongation search refuses stalled or invalid native results and fails explicitly on iteration exhaustion", async (context) => {
  // Only the native solver is replaced to exercise failures that its normal
  // successful results cannot provoke. The real catalog and adapter still run.
  const native = Astronomy.SearchMaxElongation(Astronomy.Body.Mercury, new Date("2026-01-01T00:00:00Z"));
  const stalled = context.mock.method(Astronomy, "SearchMaxElongation", (_body: AstronomyTypes.Body, start: AstronomyTypes.FlexibleDateTime) => ({ ...native, time: Astronomy.MakeTime(start) }));
  await assert.rejects(search("2026-01-01T00:00:00Z", "2026-12-31T00:00:00Z", ["greatest-elongation"]), /failed to advance/);
  stalled.mock.restore();
  for (const patch of [{ elongation: NaN }, { visibility: "visible" }]) {
    const invalid = context.mock.method(Astronomy, "SearchMaxElongation", () => ({ ...native, ...patch }));
    await assert.rejects(search("2026-01-01T00:00:00Z", "2026-12-31T00:00:00Z", ["greatest-elongation"]), /invalid (angle|viewing geometry)/);
    invalid.mock.restore();
  }
  const excessive = context.mock.method(Astronomy, "SearchMaxElongation", (_body: AstronomyTypes.Body, start: AstronomyTypes.FlexibleDateTime) => ({ ...native, time: Astronomy.MakeTime(start).AddDays(1) }));
  await assert.rejects(search("2026-01-01T00:00:00Z", "2026-12-31T00:00:00Z", ["greatest-elongation"]), /exceeded its bounded iteration budget/);
  assert.equal(excessive.mock.callCount(), 10);
});
