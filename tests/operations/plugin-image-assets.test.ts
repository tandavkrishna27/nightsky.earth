import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import test from "node:test";

// The runtime imports these reviewed assets synchronously, before HTTP startup.
// Keep the list explicit so admission of another year needs a packaging review.
const requiredEvents = [
  "meteor-evidence-inventory-v1.json",
  "meteor-radiants-gmn-2021.json",
  "meteor-peaks-nasa-2025.json",
  "meteor-peaks-nasa-2026.json",
  "meteor-peaks-nasa-2027.json",
];

test('standalone build includes the pure aggregate module imported by the dormant history adapter',()=>{
 const recipe=readFileSync('Dockerfile.plugin','utf8');
 assert.match(recipe,/COPY scripts\/era5\/aggregate\.ts \.\/scripts\/era5\//);
 const ignore=readFileSync('.dockerignore','utf8');
 assert.ok(ignore.includes('!scripts/era5/aggregate.ts'));
});

test("standalone image copies every admitted startup event asset explicitly", () => {
  const recipe = readFileSync("Dockerfile.plugin", "utf8");
  const copies = recipe.split(/\r?\n/).filter(line => /^COPY data\/events\//.test(line));
  const assets = copies.flatMap(line => line.trim().split(/\s+/).slice(1, -1));
  assert.deepEqual(assets.slice().sort(), requiredEvents.map(name => `data/events/${name}`).sort());
  for (const path of assets) assert.ok(existsSync(path), `Missing reviewed image source ${path}`);
  assert.doesNotMatch(copies.join("\n"), /\*|meteor-showers-v1\.json/);
});

test("image context keeps operator secrets and unreviewed recurring events excluded", () => {
  const ignore = readFileSync(".dockerignore", "utf8").split(/\r?\n/);
  for (const pattern of ["**", "**/.env", "**/.env.*", "**/credentials*", "**/secrets*", "**/.data/**", "data/events/meteor-showers-v1.json"])
    assert.ok(ignore.includes(pattern), `Missing image exclusion ${pattern}`);
  assert.ok(ignore.includes("!data/events/*.json"));
  for (const name of requiredEvents) assert.ok(!ignore.includes(`data/events/${name}`));
});
