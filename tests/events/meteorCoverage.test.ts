import test from "node:test";
import assert from "node:assert/strict";
import { meteorCoverage, validateMeteorCoverage } from "../../server/events/meteorCoverage";

const proposed = ["QUA","LYR","ETA","SDA","CAP","PER","ORI","DRA","NTA","STA","LEO","GEM","URS"];

test("offline inventory preserves nineteen identities with owner selection pending", () => {
 const rows = meteorCoverage(2026);
 assert.equal(rows.length, 19);
 assert.equal(new Set(rows.map(row => row.code)).size, 19);
 assert.ok(rows.every(row => row.selection === "pending-owner-decision" && row.activity.status === "missing"));
 assert.deepEqual(rows.filter(row => !proposed.includes(row.code)).map(row => row.code).sort(), ["AND","ARI","DSX","HYD","SSG","ZPE"]);
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
 assert.equal(rows.find(row => row.code === "ETA")?.activity.contextReferences?.length, 1);
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
