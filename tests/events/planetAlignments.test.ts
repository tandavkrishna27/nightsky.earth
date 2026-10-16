import test from "node:test";
import assert from "node:assert/strict";
import { GeoNamesPlaceIndex } from "../../server/places/geonames";
import { searchSkyEvents } from "../../server/events/catalog";
import { createRequire } from "node:module";
import type * as AstronomyTypes from "astronomy-engine";
import { skyEventSchema, searchSkyEventsInputSchema } from "../../shared/nightsky/events";
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
    const event = result.events.find(event => event.name === name);
    assert.ok(event?.peakUtc, name);
    assert.ok(Math.abs(Date.parse(event.peakUtc) - Date.parse(utc!)) <= 2 * 3600_000, name);
    assert.equal(event.localVisibility, "not-evaluated");
    assert.equal(event.source.vintage, "astronomy-engine-2.1.19");
    assert.match(event.description!, /heliocentric/);
  }
  assert.equal(result.availability.status, "partial");
  assert.match(result.caveats.join(" "), /planet-pair/);
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
  for (const event of result.events) {
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
  const mercury = result.events.filter(event => event.name.startsWith("Mercury"));
  assert.ok(mercury.length >= 6 && mercury.length <= 8);
  assert.ok(mercury.some(event => event.name.includes("Inferior")));
  assert.ok(mercury.some(event => event.name.includes("Superior")));
  assert.equal(new Set(result.events.map(event => event.eventId)).size, result.events.length);
  assert.ok(result.events.every(event => event.peakUtc! >= "2026-12-30T00:00:00Z" && event.peakUtc! <= "2027-12-30T00:00:00Z"));
  const narrow = await search("2027-01-01T00:00:00Z", "2027-12-30T00:00:00Z", ["planetary-conjunction"]);
  assert.deepEqual(result.events, narrow.events);
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

test("both planets retain both elongation geometries and modeled local angular maxima without claiming independent Venus morning validation", async () => {
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
