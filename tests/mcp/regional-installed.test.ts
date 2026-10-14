import assert from "node:assert/strict";
import test from "node:test";
import { access } from "node:fs/promises";
import { once } from "node:events";
import { createServer } from "node:http";
import { createNightSkyPluginApp } from "../../server/plugin";
import { loadRegionalOsmProvider } from "../../server/places/regionalOsm";
import { loadGeoNamesPlaceIndex } from "../../server/places/geonames";

test("installed India and Bhutan regional artifacts retain vintages through actual direct and composed MCP", async context => {
  const path = ".data/osm/regional-serving-20261014-v1/manifest.json";
  try { await access(path); await access(".data/geonames/cities500.json.gz"); } catch { context.skip("Reviewed ignored regional manifest and GeoNames artifacts are not installed."); return; }
  const provider = await loadRegionalOsmProvider(path, { expectedSha256: "c79a278ffddde390a5ce5709c9e3d9884f60be12f1c0706703837c2f681998bb", maxCacheRegions: 1 });
  const index = await loadGeoNamesPlaceIndex(".data/geonames/cities500.json.gz"); assert.ok(index);
  let externalAttempts = 0;
  const app = createNightSkyPluginApp({ candidateProvider: provider, placeIndex: index, log: () => {}, fetcher: async () => { externalAttempts++; throw Error("External traffic prohibited"); }, plannerServices: { getNightConditions: async () => { throw Error("Offline unavailable weather"); }, getClimatology: async () => { throw Error("Offline unavailable history"); } } });
  const server = createServer(app).listen(0, "127.0.0.1"); await once(server, "listening"); const address = server.address(); assert.ok(address && typeof address !== "string");
  let id = 0;
  const call = async (name: string, args: unknown) => {
    const response = await fetch(`http://127.0.0.1:${address.port}/mcp`, { method: "POST", headers: { "content-type": "application/json", accept: "application/json, text/event-stream" }, body: JSON.stringify({ jsonrpc: "2.0", id: ++id, method: "tools/call", params: { name, arguments: args } }), signal: AbortSignal.timeout(5000) });
    assert.equal(response.status, 200); const raw = await response.text(); const line = raw.split("\n").find(value => value.startsWith("data: ")); const result = JSON.parse(line ? line.slice(6) : raw).result; assert.equal(result.isError, undefined); return result.structuredContent;
  };
  try {
    const vintages = new Set<string>();
    for (const geonameId of [1277333, 1252416, 1277333]) {
      const city = index.getById(geonameId); assert.ok(city); const placeId = `place:v1:geonames:${geonameId}`;
      const result = await call("search_observing_locations", { placeId, radiusKm: 50, limit: 10 }); assert.equal(result.candidates.length, 10);
      assert.ok(result.candidates.every((candidate: any) => candidate.accessEvidence.status === "unknown"));
      for (const candidate of result.candidates) vintages.add(candidate.sources[0].vintage);
      const plan = await call("plan_observing_session", { placeId, activity: "general-stargazing", window: { startUtc: "2026-10-13T12:00:00Z", endUtc: "2026-10-14T12:00:00Z", timeZone: city.timeZone } });
      assert.match(JSON.stringify(plan), new RegExp(result.candidates[0].placeId.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
    }
    assert.equal(vintages.size, 2); assert.equal(provider.stats().loads, 3); assert.equal(provider.stats().evictions, 2); assert.equal(externalAttempts, 0);
  } finally { server.closeAllConnections(); await new Promise<void>(done => server.close(() => done())); }
});
