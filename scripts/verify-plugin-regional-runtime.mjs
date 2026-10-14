/** Compiled runtime rehearsal with fictional artifacts; no source/account traffic. */
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { mkdtemp, writeFile, rm } from "node:fs/promises";
import { basename, dirname, join, resolve } from "node:path";
import { tmpdir } from "node:os";
import { gzipSync } from "node:zlib";
import { once } from "node:events";
import { startNightSkyPlugin } from "../dist/plugin.js";

const checksum = bytes => createHash("sha256").update(bytes).digest("hex");
const directory = await mkdtemp(join(tmpdir(), "nightsky-compiled-regions-"));
const originalFetch = globalThis.fetch;
let externalAttempts = 0, server;
globalThis.fetch = (url, options) => {
  const parsed = new URL(typeof url === "string" ? url : url.url ?? String(url));
  if (parsed.hostname !== "127.0.0.1") { externalAttempts++; throw Error("External traffic prohibited in compiled fixture"); }
  return originalFetch(url, options);
};
try {
  const cities = [[9999991, "Fictional India Town", "Fictional India Town", "", 18.52, 73.85, "IN", "India", 1, "Asia/Kolkata"], [9999992, "Fictional Bhutan Town", "Fictional Bhutan Town", "", 27.47, 89.64, "BT", "Bhutan", 1, "Asia/Thimphu"]];
  await writeFile(join(directory, "cities.gz"), gzipSync(JSON.stringify({ schemaVersion: 2, vintage: "fictional-compiled-cities", generatedAt: "2026-10-14T00:00:00Z", cities })));
  const regions = [];
  for (const [i, city] of cities.entries()) {
    const source = { name: "OpenStreetMap contributors", url: "https://www.openstreetmap.org/copyright", attribution: "Fictional runtime fixture; no real candidate coverage.", dataClass: "catalog", vintage: `fictional-region-${i}`, licenseUrl: "https://opendatacommons.org/licenses/odbl/1-0/" };
    const coverage = `Fictional region ${i}; no real coverage`;
    const index = { schemaVersion: 1, vintage: source.vintage, coverage, source, candidates: [{ osmType: "node", osmId: i + 1, name: `Fictional Park ${i}`, category: "park", latitude: city[4], longitude: city[5], sourceCompleteness: 1 }] };
    const payload = Buffer.from(JSON.stringify(index)); const path = `region-${i}.json`; await writeFile(join(directory, path), payload);
    regions.push({ id: `region-${i}`, path, sha256: checksum(payload), bytes: payload.length, rows: 1, vintage: index.vintage, coverage, source, bounds: { south: city[4], north: city[4], west: city[5], east: city[5] } });
  }
  const manifest = Buffer.from(JSON.stringify({ schemaVersion: 1, regions })); await writeFile(join(directory, "manifest.json"), manifest);
  process.env.NIGHTSKY_GEONAMES_INDEX = join(directory, "cities.gz");
  process.env.NIGHTSKY_OSM_REGIONAL_MANIFEST = join(directory, "manifest.json");
  process.env.NIGHTSKY_OSM_REGIONAL_SHA256 = checksum(manifest);
  delete process.env.NIGHTSKY_OSM_CANDIDATE_INDEX;
  delete process.env.NIGHTSKY_CLIMATE_ARTIFACT;
  delete process.env.NIGHTSKY_CLIMATE_SHA256;
  process.env.MET_NORWAY_USER_AGENT = "";
  process.env.NIGHTSKY_MCP_TOOL_MODE = "full";
  process.env.NIGHTSKY_MCP_TRUSTED_PROXIES = "127.0.0.1";
  process.env.NIGHTSKY_MCP_ALLOWED_HOSTS = "127.0.0.1";
  process.env.HOST = "127.0.0.1";
  // Listener configuration rejects port zero; reserve an ephemeral port first.
  const { createServer } = await import("node:net"); const probe = createServer().listen(0, "127.0.0.1"); await once(probe, "listening");
  process.env.PORT = String(probe.address().port); await new Promise(done => probe.close(done));
  server = await startNightSkyPlugin(); const base = `http://127.0.0.1:${process.env.PORT}`;
  let id = 0;
  const call = async (name, args) => {
    const response = await fetch(`${base}/mcp`, { method: "POST", headers: { "content-type": "application/json", accept: "application/json, text/event-stream", "x-forwarded-for": "198.51.100.1" }, body: JSON.stringify({ jsonrpc: "2.0", id: ++id, method: "tools/call", params: { name, arguments: args } }), signal: AbortSignal.timeout(5000) });
    assert.equal(response.status, 200); const raw = await response.text(); const event = raw.split("\n").find(line => line.startsWith("data: ")); const result = JSON.parse(event ? event.slice(6) : raw).result;
    assert.equal(result.isError, undefined); return result.structuredContent;
  };
  for (const [i] of cities.entries()) {
    const result = await call("search_observing_locations", { placeId: `place:v1:geonames:${9999991 + i}` });
    assert.equal(result.candidates[0].name, `Fictional Park ${i}`); assert.equal(result.candidates[0].sources[0].vintage, `fictional-region-${i}`);
  }
  const events = await call("search_sky_events", { placeId: "place:v1:geonames:9999991", window: { startUtc: "2026-01-09T00:00:00Z", endUtc: "2026-01-11T00:00:00Z", timeZone: "Asia/Kolkata" }, eventTypes: ["opposition"] });
  assert.ok(events.events.some(event => event.name.startsWith("Jupiter Opposition")));
  const plan = await call("plan_observing_session", { placeId: "place:v1:geonames:9999991", activity: "general-stargazing", window: { startUtc: "2026-01-09T12:00:00Z", endUtc: "2026-01-10T12:00:00Z", timeZone: "Asia/Kolkata" } });
  assert.match(JSON.stringify(plan), /Fictional Park 0/); assert.equal(externalAttempts, 0);
  const malformed = await fetch(`${base}/mcp`, { method: "POST", headers: { "content-type": "application/json", "x-forwarded-for": "198.51.100.1,198.51.100.2" }, body: "{}", signal: AbortSignal.timeout(5000) });
  assert.equal(malformed.status, 400); await malformed.text();
  server.closeAllConnections(); await new Promise(done => server.close(done)); server = undefined;
  await writeFile(join(directory, "manifest.json"), "{}");
  await assert.rejects(startNightSkyPlugin(), /checksum/);
  await writeFile(join(directory, "manifest.json"), manifest);
  server = await startNightSkyPlugin();
  const restored = await call("search_observing_locations", { placeId: "place:v1:geonames:9999992" });
  assert.equal(restored.candidates[0].sources[0].vintage, "fictional-region-1"); assert.equal(externalAttempts, 0);
  console.log("Compiled regional runtime verified: two fictional vintages, direct/composed search, Jupiter alignment, strict proxy startup and checksum rejection/restoration; external attempts 0.");
} finally {
  globalThis.fetch = originalFetch;
  if (server) { server.closeAllConnections(); await new Promise(done => server.close(done)); }
  const target = resolve(directory); assert.equal(dirname(target), resolve(tmpdir())); assert.ok(basename(target).startsWith("nightsky-compiled-regions-")); await rm(target, { recursive: true, force: true });
}
