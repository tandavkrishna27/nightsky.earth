import assert from "node:assert/strict";
import test from "node:test";
import { retrievePilot, normalizePilot } from "../../scripts/osm/overpass_pilot";

test("offline pilot refuses partial replies, missing vintage and excess rows", () => {
  assert.throws(() => normalizePilot({ remark: "timed out", elements: [], osm3s: { timestamp_osm_base: "2026-10-13T00:00:00Z" } }), /partial/i);
  assert.throws(() => normalizePilot({ elements: [] }), /timestamp/);
  assert.throws(() => normalizePilot({ elements: Array(10001).fill({}), osm3s: { timestamp_osm_base: "2026-10-13T00:00:00Z" } }), /10,000/);
});

test("offline response reader caps actual decoded bytes without retries", async () => {
  let calls = 0;
  await assert.rejects(retrievePilot(async () => { calls++; return new Response(new Uint8Array(2 * 1024 * 1024 + 1)); }), /2 MiB/);
  assert.equal(calls, 1);
});

test("real-shaped normalization is repeatable and explicitly node-only", () => {
  const raw = { elements: [{ type: "node", id: 1, lat: 10.2, lon: 77.4, tags: { name: "Park", leisure: "park" } }], osm3s: { timestamp_osm_base: "2026-10-13T00:00:00Z" } };
  assert.deepEqual(normalizePilot(raw), normalizePilot(raw));
  assert.match(normalizePilot(raw).coverage, /node-only/);
  assert.match(normalizePilot(raw).source.attribution, /ODbL/);
});
