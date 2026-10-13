import assert from "node:assert/strict";
import { createServer } from "node:http";
import { once } from "node:events";
import { fileURLToPath } from "node:url";
import { readFile } from "node:fs/promises";
import test from "node:test";
import express from "express";
import { mountMcpRoute } from "../../server/mcp/route";
import { GeoNamesPlaceIndex } from "../../server/places/geonames";
import { loadOsmCandidateIndex } from "../../server/places/osmCandidates";
import { normalizePilot } from "../../scripts/osm/overpass_pilot";

const artifact = fileURLToPath(new URL("../osm/fixtures/real-three-boxes/candidates.json", import.meta.url));
const checksum = "7d07f347d8e5dfff06cdfc59a72e262b61760528bd5cac14b091f75e26f23755";
// Reviewed GeoNames source identities; CC BY 4.0, https://download.geonames.org/export/dump/.
const places = [
  { geonameId: 1270426, name: "Hanle", latitude: 32.78943, longitude: 78.9962 },
  { geonameId: 1266425, name: "Kodaikanal", latitude: 10.23925, longitude: 77.48932 },
  { geonameId: 1262463, name: "Munnar", latitude: 10.08818, longitude: 77.06239 },
];

test("reviewed real pilot normalization repeats exactly without upstream access", async () => {
  const index = await loadOsmCandidateIndex(artifact, { maxArtifactBytes: 2 * 1024 * 1024, expectedSha256: checksum });
  assert.equal(index?.candidates.length, 59);
  const nodes = index!.candidates.map(row => ({ type: row.osmType, id: row.osmId, lat: row.latitude, lon: row.longitude, tags: {
    name: row.name, ...(row.category === "park" ? { leisure: "park" } : { tourism: row.category === "viewpoint" ? "viewpoint" : "camp_site" }),
    ...(row.sourceCompleteness >= 2 ? { website: "source field present" } : {}), ...(row.sourceCompleteness >= 3 ? { access: "source field present" } : {}),
  } }));
  assert.deepEqual(normalizePilot({ osm3s: { timestamp_osm_base: index!.vintage }, elements: nodes }), JSON.parse(await readFile(artifact, "utf8")));
});

test("real three-place MCP resolve candidate plan compare journey remains source-linked and partial", async () => {
  const index = new GeoNamesPlaceIndex(places.map(place => ({ ...place, asciiName: place.name, alternateNames: "", countryCode: "IN", countryName: "India", featureClass: "P", featureCode: "PPL", population: 0, timeZone: "Asia/Kolkata", modificationDate: "2026-10-13" })), "reviewed-three-place-fixture");
  const osmCandidateIndex = await loadOsmCandidateIndex(artifact, { maxArtifactBytes: 2 * 1024 * 1024, expectedSha256: checksum });
  const app = express(); app.use(express.json({ limit: "32kb" }));
  mountMcpRoute(app, { allowedHosts: ["127.0.0.1"], placeIndex: index, osmCandidateIndex, weatherProvider: { getForecast: async () => ({ status: "unavailable", reason: "Offline fixture weather unavailable." }) } });
  const server = createServer(app); server.listen(0, "127.0.0.1"); await once(server, "listening");
  const address = server.address(); assert.ok(address && typeof address !== "string");
  const port = address.port;
  let id = 0;
  async function request(method: string, params: unknown) {
    const response = await fetch(`http://127.0.0.1:${port}/mcp`, { method: "POST", headers: { "content-type": "application/json", accept: "application/json, text/event-stream", "mcp-protocol-version": "2025-11-25" }, body: JSON.stringify({ jsonrpc: "2.0", id: ++id, method, params }) });
    assert.equal(response.status, 200);
    const line = (await response.text()).split("\n").find(line => line.startsWith("data: ")); assert.ok(line);
    const result = JSON.parse(line.slice(6)).result; assert.equal(result.isError, undefined, JSON.stringify(result)); return result.structuredContent;
  }
  const call = (name: string, args: unknown) => request("tools/call", { name, arguments: args });
  try {
    await request("initialize", { protocolVersion: "2025-11-25", capabilities: {}, clientInfo: { name: "offline-real-osm-pilot", version: "1" } });
    const options = [];
    const counts: Record<string, number> = {};
    for (const source of places) {
      const resolved = await call("resolve_place", { placeQuery: `${source.name}, India` });
      const place = resolved.matches[0]; assert.equal(place.placeId, `place:v1:geonames:${source.geonameId}`);
      const candidates = await call("search_observing_locations", { placeId: place.placeId, radiusKm: 20, limit: 10 });
      counts[source.name] = candidates.candidates.length;
      assert.match(candidates.coverage, /node-only/);
      assert.equal(candidates.sortBasis, "distance-then-source-completeness");
      for (const candidate of candidates.candidates) {
        assert.equal(candidate.accessEvidence.status, "unknown");
        assert.match(candidate.sources[0].url, /^https:\/\/www.openstreetmap.org\/node\/\d+$/);
        assert.match(candidate.sources[0].attribution, /ODbL/);
      }
      const input = { placeId: place.placeId, activity: "general-stargazing", window: { startUtc: "2026-10-15T13:00:00Z", endUtc: "2026-10-15T23:00:00Z", timeZone: place.timeZone } };
      const plan = await call("plan_observing_session", input);
      assert.equal(plan.place.placeId, place.placeId);
      assert.equal(plan.availability.status, "partial");
      assert.ok(plan.factors.some((factor: any) => factor.name === "Nearby observing places"));
      options.push(input);
    }
    const compared = await call("compare_observing_options", { options });
    assert.equal(compared.comparisons.length, 3);
    assert.ok(counts.Hanle > 0 && counts.Kodaikanal > 0 && counts.Munnar > 0);
    const empty = await call("search_observing_locations", { placeId: "place:v1:geonames:1270426", radiusKm: 1, categories: ["beach"] });
    assert.equal(empty.candidates.length, 0);
    assert.equal(empty.availability.status, "not-covered");
    assert.match(empty.availability.reason, /does not establish/);
  } finally { server.close(); await once(server, "close"); }
});
