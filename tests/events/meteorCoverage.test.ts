import test from "node:test";
import assert from "node:assert/strict";
import { meteorCoverage, validateMeteorCoverage } from "../../server/events/meteorCoverage";
import { meteorCalendarGuidance } from "../../server/events/meteorCalendarGuidance";
import { meteorCivilGuidance } from "../../server/events/meteorCivilGuidance";
import * as meteorIdentity from "../../shared/nightsky/meteors";
import { searchSkyEvents } from "../../server/events/catalog";
import { GeoNamesPlaceIndex } from "../../server/places/geonames";
import { evaluateRadiant } from "../../server/events/meteorRadiants";
import { readFileSync } from "node:fs";

const proposed = ["QUA","LYR","ETA","SDA","CAP","PER","ORI","DRA","NTA","STA","LEO","GEM","URS"];

test("offline inventory preserves nineteen identities with owner selection pending", () => {
 const rows = meteorCoverage(2026);
 assert.equal(rows.length, 19);
 assert.equal(new Set(rows.map(row => row.code)).size, 19);
 assert.ok(rows.every(row => row.selection === "pending-owner-decision" && row.activity.status === "missing"));
 assert.deepEqual(rows.filter(row => !proposed.includes(row.code)).map(row => row.code).sort(), ["AND","ARI","DSX","HYD","SSG","ZPE"]);
});

test("known meteor identity is independent of missing models and ambiguous names stay unresolved", () => {
 assert.ok("resolveMeteorIdentity" in meteorIdentity, "shared identity resolution is missing");
 const resolve = meteorIdentity.resolveMeteorIdentity as (query: string) => string | undefined;
 for (const row of meteorCoverage(2026)) assert.equal(resolve(row.code.toLowerCase()), row.code);
 for (const year of [2025, 2026, 2027]) {
  const peaks = JSON.parse(readFileSync(`data/events/meteor-peaks-nasa-${year}.json`, "utf8")).peaks as {name: string; code: string}[];
  for (const peak of peaks) assert.equal(resolve(peak.name), peak.code, `${year} source event identity ${peak.name}`);
 }
 for (const [query, code] of [["October Draconid meteor shower", "DRA"], ["Ursids", "URS"], ["Southern mu-Sagittariids", "SSG"], ["Daytime Arietids", "ARI"], ["Daytime Sextantids", "DSX"], ["Daytime Zeta Perseids", "ZPE"], ["Andromedids", "AND"], ["Northern Taurids", "NTA"], ["Southern Taurids", "STA"], ["  Eta   Aquariid meteor shower  ", "ETA"]]) assert.equal(resolve(query!), code);
 for (const query of ["Taurids", "Delta Aquariids", "SSS", "GIA", "toString", "__proto__", "unknown"]) assert.equal(resolve(query), undefined);
 for (const code of ["DRA", "URS", "AND", "ARI", "DSX", "SSG", "ZPE"]) {
  const result = evaluateRadiant(resolve(code)!, "2026-10-09T02:00:00Z", {latitude: 51.5, longitude: -.12});
  assert.equal(result.status, "unsupported");
  assert.ok(!Object.hasOwn(result, "altitudeDeg"));
 }
});

test("inventory retains admitted verbal and civil context without promoting a complete activity period", () => {
 for (const year of [2026, 2027, 2028]) {
  const rows = meteorCoverage(year);
  for (const guidance of meteorCalendarGuidance().entries) {
   const row = rows.find(row => row.code === guidance.code)!;
   assert.equal(row.activity.status, "missing");
   assert.ok(row.activity.contextReferences?.includes(`server/events/meteorCalendarGuidance.ts#${guidance.code}`), `${guidance.code} verbal evidence missing`);
  }
  for (const guidance of meteorCivilGuidance()) {
   const row = rows.find(row => row.code === guidance.code)!;
   assert.ok(row.activity.contextReferences?.includes(`server/events/meteorCivilGuidance.ts#${guidance.code}`), `${guidance.code} civil evidence missing`);
   assert.equal(row.activity.status, "missing");
   assert.deepEqual(row.activity.references, []);
  }
 }
});

test("event result describes all admitted civil references without promising their maximum clocks", async () => {
 const index = new GeoNamesPlaceIndex([[1, "London", "London", "", 51.5, -.12, "GB", "United Kingdom", 1, "Europe/London"]], "fixture");
 const result = await searchSkyEvents({ placeId: "place:v1:geonames:1", window: { startUtc: "2026-10-20T20:00:00Z", endUtc: "2026-10-21T04:00:00Z", timeZone: "Europe/London" }, eventTypes: ["meteor-shower"] }, index);
 const civil = result.meteorCivilGuidance!;
 assert.match(result.availability.reason!, new RegExp(`${civil.length} source-qualified civil`));
 const caveats = result.caveats.join(" ");
 for (const row of civil) assert.ok(caveats.includes(row.code), `${row.code} must be identified as separate civil context`);
 assert.match(caveats, /maximum time basis.*source-specific/i);
 assert.deepEqual(result.events, []);
 assert.equal(civil.find(row => row.code === "ORI")?.maximumTimeBasis, "unspecified-by-source");
});

test("proposed thirteen by two year matrix records nine missing maxima without adopting scope", () => {
 assert.deepEqual([2026,2027].flatMap(year => meteorCoverage(year).filter(row => proposed.includes(row.code) && row.peak.status === "missing").map(row => `${year}:${row.code}`)).sort(),
 ["2026:LYR","2026:ORI","2026:NTA","2026:STA","2026:LEO","2027:LYR","2027:ORI","2027:NTA","2027:STA"].sort());
 for (const year of [2026,2027]) {
  const rows = meteorCoverage(year).filter(row => proposed.includes(row.code));
  assert.equal(rows.filter(row => row.peak.status === "supported").length, year === 2026 ? 8 : 9);
  assert.ok(rows.every(row => row.activity.status === "missing"));
 }
});

test("bounded radiant evidence and typical context never establish complete seasons", () => {
 const rows = meteorCoverage(2026);
 assert.equal(rows.filter(row => proposed.includes(row.code) && row.radiant.status === "partial").length, 11);
 for (const code of ["DRA","URS"]) assert.equal(rows.find(row => row.code === code)?.radiant.status, "missing");
 assert.ok(rows.find(row => row.code === "ETA")?.activity.contextReferences?.includes("server/events/meteorTypicalSeasons.ts#ETA"));
 assert.equal(rows.find(row => row.code === "PER")?.radiant.domain?.halfWidthDeg, 4.437);
 assert.ok(rows.find(row => row.code === "PER")?.peak.references[0]?.includes("meteor-peaks-nasa-2026.json"));
});

test("coverage distinguishes retained artifact horizons from missing seasons", () => {
 assert.ok(meteorCoverage(2028).every(row => row.peak.status === "out-of-horizon" && row.activity.status === "missing"));
 assert.equal(meteorCoverage(2031).find(row => row.code === "PER")?.radiant.status, "out-of-horizon");
 assert.throws(() => meteorCoverage(2026.5), /year/);
});

test("ledger validation rejects duplicate, dropped, invented or unreferenced evidence", () => {
 const rows = meteorCoverage(2026);
 assert.throws(() => validateMeteorCoverage([...rows, rows[0]!]), /duplicate|identities/i);
 assert.throws(() => validateMeteorCoverage(rows.slice(1)), /identities/);
 assert.throws(() => validateMeteorCoverage(rows.map(row => row.code === "PER" ? {...row, peak: {...row.peak, references: []}} : row)), /reference/);
 assert.throws(() => validateMeteorCoverage(rows.map(row => row.code === "PER" ? {...row, peak: {...row.peak, references: ["missing.json"]}} : row)), /reference/);
 assert.throws(() => validateMeteorCoverage(rows.map(row => row.code === "PER" ? {...row, activity: {status:"supported", references:["made-up"]}} : row)), /activity|reference/);
 validateMeteorCoverage(rows);
});

test("artifact admission rejects duplicate identities and invalid radiant domains", async () => {
 const coverage = await import("../../server/events/meteorCoverage");
 assert.ok("validateMeteorEvidenceArtifacts" in coverage, "missing artifact admission validator");
 const { readFileSync } = await import("node:fs");
 const inventory = JSON.parse(readFileSync("data/events/meteor-evidence-inventory-v1.json", "utf8"));
 const radiant = JSON.parse(readFileSync("data/events/meteor-radiants-gmn-2021.json", "utf8"));
 const validate = coverage.validateMeteorEvidenceArtifacts as (inventory: unknown, radiant: unknown) => unknown;
 validate(inventory, radiant);
 assert.throws(() => validate({...inventory, retainedCodes: [...inventory.retainedCodes.slice(1), inventory.retainedCodes[1]]}, radiant));
 assert.throws(() => validate({...inventory, maintainedSelection: ["PER"]}, radiant));
 assert.throws(() => validate(inventory, {...radiant, rows: radiant.rows.map((row: unknown, index: number) => index === 0 ? {...radiant.rows[0], nominalFitDays: -1} : row)}));
 assert.throws(() => validate(inventory, {...radiant, rows: [...radiant.rows.slice(1), radiant.rows[1]]}));
 assert.throws(() => validate(inventory, {...radiant, localCalculationYears: {first: 2030, last:2018}}));
});

test("radiant inventory rejects substituted models and widened reviewed domains", async () => {
 const { validateMeteorEvidenceArtifacts } = await import("../../server/events/meteorCoverage");
 const { readFileSync } = await import("node:fs");
 const inventory = JSON.parse(readFileSync("data/events/meteor-evidence-inventory-v1.json", "utf8"));
 const radiant = JSON.parse(readFileSync("data/events/meteor-radiants-gmn-2021.json", "utf8"));
 for (const changed of [{code: "DRA"}, {nominalFitDays: 9999}, {referenceSolarLongitudeDeg: 140.2}]) {
  assert.throws(() => validateMeteorEvidenceArtifacts(inventory, {...radiant, rows: radiant.rows.map((row: {code:string}) => row.code === "PER" ? {...row, ...changed} : row)}), /reviewed|domain/);
 }
});
