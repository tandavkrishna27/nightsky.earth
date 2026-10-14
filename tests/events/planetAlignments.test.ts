import test from "node:test";
import assert from "node:assert/strict";
import { GeoNamesPlaceIndex } from "../../server/places/geonames";
import { searchSkyEvents } from "../../server/events/catalog";
import { createRequire } from "node:module";
import type * as AstronomyTypes from "astronomy-engine";
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
