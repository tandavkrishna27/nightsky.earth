import assert from "node:assert/strict";
import test from "node:test";
import { readFile } from "node:fs/promises";
import { normalizeWave, QUERY, retrieveWave, buildWave } from "../../scripts/osm/regional_wave";
const vintage = { timestamp_osm_base: "2026-10-14T00:00:00Z" };
test("regional wave retains real node and supplied way centers deterministically", () => {
  const input = { osm3s: vintage, elements: [
    { type: "way", id: 2, center: { lat: 12.9, lon: 77.6 }, tags: { name: "Park", leisure: "park" } },
    { type: "node", id: 1, lat: 12.9, lon: 77.6, tags: { name: "Lookout", tourism: "viewpoint" } },
  ] };
  assert.equal(normalizeWave(input).candidates.length, 2);
  assert.deepEqual(normalizeWave(input), normalizeWave(input));
  assert.match(QUERY, /way\[/);
  assert.match(QUERY, /out body center/);
});
test("retained licensed regional response rebuilds the reviewed immutable artifact", async () => {
  const source = await readFile(new URL("./fixtures/real-regional-wave/response.json", import.meta.url));
  const artifact = await readFile(new URL("./fixtures/real-regional-wave/candidates.json", import.meta.url));
  const built = buildWave(source, "ff62e1f4fc812e12ae32bb04e4fac6c78995dc6ca09d66b1ccd306e3221efff4");
  assert.deepEqual(built.normalized, artifact);
  assert.equal(built.index.candidates.length, 1327);
  assert.equal(built.index.candidates.filter(x => x.osmType === "way").length, 1142);
  assert.equal(built.artifactSha256, "e542a89ac7094acbd02f18dd7ea559001e21a4778214379b08839e1e553265ef");
});
test("regional reader rejects decoded oversize and performs exactly one request", async () => {
  let calls = 0;
  await assert.rejects(retrieveWave(async () => { calls++; return new Response(new Uint8Array(4*1024*1024+1)); }), /4 MiB/);
  assert.equal(calls, 1);
  assert.throws(() => buildWave(Buffer.alloc(4*1024*1024+1)), /4 MiB/);
});
test("regional wave rejects partial data and never fabricates missing way coordinates", () => {
  assert.throws(() => normalizeWave({ osm3s: vintage, remark: "timeout", elements: [] }), /partial/i);
  assert.throws(() => normalizeWave({ osm3s: vintage, elements: [{ type: "way", id: 1, tags: { name: "Park", leisure: "park" } }] }), /center/i);
  assert.throws(() => normalizeWave({ osm3s: vintage, elements: [{ type: "relation", id: 1 }] }), /type/i);
});
test("offline rebuild refuses a changed reviewed source checksum", () => {
  const payload=Buffer.from(JSON.stringify({osm3s:vintage,elements:[]}));
  assert.throws(() => buildWave(payload, "0".repeat(64)), /checksum/i);
});
test("selected regional rows reject malformed IDs, tags and names instead of silently disappearing", () => {
  const valid = { type: "node", id: 1, lat: 12.9, lon: 77.6, tags: { name: "Park", leisure: "park" } };
  for (const changed of [
    { id: "broken" }, { id: 0 }, { id: -1 }, { id: 1.5 }, { id: Number.MAX_SAFE_INTEGER + 1 },
    { tags: undefined }, { tags: null }, { tags: [] }, { tags: "park" },
    { tags: { leisure: "park" } }, { tags: { name: 12, leisure: "park" } },
    { tags: { name: " \u0000 ", leisure: "park" } }, { tags: { name: "Park", leisure: 12 } },
    { tags: { name: "Cafe", amenity: "cafe" } }, { tags: { name: "Park", leisure: "park", access: false } },
  ]) {
    assert.throws(() => normalizeWave({ osm3s: vintage, elements: [{ ...valid, ...changed }] }), /selected|id|tags|name|category/i, JSON.stringify(changed));
  }
});
test("duplicate selected source identities are refused before artifact publication", () => {
  const node = { type: "node", id: 1, lat: 12.9, lon: 77.6, tags: { name: "Park", leisure: "park" } };
  assert.throws(() => normalizeWave({ osm3s: vintage, elements: [node, node] }), /duplicate/i);
});
