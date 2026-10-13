import test from "node:test";
import assert from "node:assert/strict";
import { importOsmJson, OSM_SOURCE } from "../../server/places/importOsm";

const payload = {
  elements: [
    { type: "node", id: 8, lat: 18.52, lon: 73.86, tags: { leisure: "park", name: "A Park" } },
    { type: "way", id: 4, center: { lat: 18.53, lon: 73.87 }, tags: { tourism: "viewpoint", name: "A View" } },
  ],
};

test("importsRepeatably", () => {
  const a = importOsmJson(payload, { vintage: "2026-10-01", coverage: "Pune fixture" });
  const b = importOsmJson(payload, { vintage: "2026-10-01", coverage: "Pune fixture" });
  assert.deepEqual(a.candidates, b.candidates);
  assert.deepEqual(a.candidates.map((row) => row.osmId), [8, 4]);
});

test("preservesOdbLAttribution", () => {
  assert.match(OSM_SOURCE.attribution, /OpenStreetMap contributors/i);
  assert.equal(OSM_SOURCE.url, "https://www.openstreetmap.org/copyright");
  assert.equal(OSM_SOURCE.licenseUrl, "https://opendatacommons.org/licenses/odbl/1-0/");
  const result = importOsmJson(payload, { vintage: "2026-10-01", coverage: "Pune fixture" });
  assert.equal(result.source.vintage, "2026-10-01");
});
