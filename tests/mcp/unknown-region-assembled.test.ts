import assert from "node:assert/strict";
import test from "node:test";
import express from "express";
import { createServer } from "node:http";
import { once } from "node:events";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { mountMcpRoute } from "../../server/mcp/route";
import { GeoNamesPlaceIndex } from "../../server/places/geonames";
import { buildGlobalCatalogue } from "../../scripts/osm/build-global-catalogue";
import { loadCatalogueFiles } from "../../server/places/catalogueFiles";
import { createGlobalCatalogue } from "../../server/places/globalCatalogue";
import { registerNightSkyTools } from "../../server/mcp/registerTools";
import type { McpServer } from "@modelcontextprotocol/server";

// This tests the assembled product boundary: a catalogue point is usable even
// when administrative attribution is absent. It deliberately does no GIS join.
test("unknown administrative membership preserves exact-point planning and explicit data gaps through MCP", async t => {
  const dir = await mkdtemp(join(tmpdir(), "nightsky-unknown-region-"));
  const index = new GeoNamesPlaceIndex([[1259229, "Pune", "Pune", "", 18.52, 73.85, "IN", "India", 1000000, "Asia/Kolkata"]], "synthetic");
  const source = { name: "Synthetic mapped site", url: "https://www.openstreetmap.org/node/9077", attribution: "Offline synthetic fixture; OSM contributors", dataClass: "catalog" as const, vintage: "synthetic-2026" };
  const candidate = { placeId: "place:v1:osm:node:9077", name: "Unknown-region observing point", category: "park" as const, latitude: 28.6, longitude: 77.2, accessEvidence: { status: "unknown" as const }, sources: [source], caveats: ["Administrative region is unknown; coordinates are retained."], catalogueRevision: "unknown-region-fixture", sourceCompleteness: 1, regionIds: [] };
  const regionId = "region:v1:india";
  let server: ReturnType<typeof createServer> | undefined;
  let externalAttempts = 0;
  const weatherPoints: Array<{ latitude: number; longitude: number }> = [];
  try {
    const built = await buildGlobalCatalogue({ catalogueRevision: candidate.catalogueRevision, candidates: [candidate], regions: [{ regionId, name: "India", countryCode: "IND", adminLevel: 0, boundaryRevision: "synthetic", sources: [source] }], footprints: [{ geometryBasis: "full-cell", footprintId: "synthetic-world-cell", bounds: { south: -90, north: 90, west: -180, east: 180 }, sources: [source], vintage: "synthetic" }] }, dir);
    const catalogue = createGlobalCatalogue(await loadCatalogueFiles(built.path, { expectedSha256: built.sha256 }), { cities: index });
    const dependencies = {
      placeIndex: index, catalogue, regionIndex: catalogue.regions,
      fetcher: async () => { externalAttempts++; throw Error("External network forbidden"); },
      weatherProvider: { async getForecast(point: { latitude: number; longitude: number }) { weatherPoints.push(point); return { status: "unavailable" as const, reason: "Offline fixture has no weather forecast.", source: { name: "Offline missing weather", url: "https://example.test/weather", attribution: "Synthetic unavailable weather fixture", dataClass: "forecast" as const } }; } },
    };
    const tools = new Map<string, { config: any; handler: any }>();
    registerNightSkyTools({ registerTool(name: string, config: any, handler: any) { tools.set(name, { config, handler }); } } as unknown as McpServer, dependencies);
    const app = express(); app.use(express.json()); mountMcpRoute(app, { ...dependencies, allowedHosts: ["127.0.0.1"] });
    server = createServer(app).listen(0, "127.0.0.1"); await once(server, "listening");
    const address = server.address(); assert.ok(address && typeof address !== "string"); let id = 0;
    async function rpc(method: string, params: unknown) {
      const response = await fetch(`http://127.0.0.1:${address.port}/mcp`, { method: "POST", headers: { "content-type": "application/json", accept: "application/json, text/event-stream", "mcp-protocol-version": "2025-11-25" }, body: JSON.stringify({ jsonrpc: "2.0", id: ++id, method, params }) });
      assert.equal(response.status, 200); const body = await response.text(); const data = body.split("\n").find(line => line.startsWith("data: ")); assert.ok(data, body); const payload = JSON.parse(data.slice(6)); assert.equal(payload.error, undefined); return payload.result;
    }
    async function call(name: string, args: unknown) {
      const tool = tools.get(name)!; const result = await rpc("tools/call", { name, arguments: tool.config.inputSchema.parse(args) });
      assert.equal(result.isError, undefined, JSON.stringify(result)); tool.config.outputSchema.parse(result.structuredContent); return result.structuredContent;
    }
    await rpc("initialize", { protocolVersion: "2025-11-25", capabilities: {}, clientInfo: { name: "unknown-region-assembled", version: "1" } });
    const selection = { placeId: candidate.placeId, catalogueRevision: candidate.catalogueRevision, displayTimeZone: "Asia/Kolkata" };
    const window = { startUtc: "2026-10-15T12:00:00Z", endUtc: "2026-10-16T00:00:00Z", timeZone: "Asia/Kolkata" };
    await t.test("name selection and radius discovery retain the source point", async () => {
      const details = await call("get_observing_location_details", { placeQuery: candidate.name });
      assert.equal(details.matches[0].placeId, candidate.placeId); assert.equal(details.matches[0].latitude, candidate.latitude); assert.equal(details.matches[0].longitude, candidate.longitude);
      const found = await call("search_observing_locations", { scope: { origins: [{ placeId: candidate.placeId, catalogueRevision: candidate.catalogueRevision, radiusKm: 10 }] } });
      assert.equal(found.candidates[0].placeId, candidate.placeId); assert.equal(found.discoveryCoverage.mappedFeatureCompleteness, "unknown");
    });
    await t.test("astronomy uses the retained point and requires explicit display time zone", async () => {
      const missingZone = await rpc("tools/call", { name: "get_astronomy_window", arguments: { placeId: candidate.placeId, catalogueRevision: candidate.catalogueRevision, window } });
      assert.equal(missingZone.isError, true); assert.match(missingZone.content[0].text, /display time zone/i);
      const astronomy = await call("get_astronomy_window", { ...selection, window });
      assert.ok(astronomy.solarThresholdIntervals.length); assert.ok(astronomy.sources.length);
      const city = await call("get_astronomy_window", { placeId: "place:v1:geonames:1259229", window });
      assert.notDeepEqual(astronomy.solarThresholdIntervals, city.solarThresholdIntervals);
    });
    await t.test("missing forecasts and historical evidence stay explicit in plan and comparison", async () => {
      const weather = await call("get_night_conditions", { ...selection, window });
      assert.equal(weather.availability.status, "unavailable"); assert.deepEqual(weather.forecasts, []); assert.equal(weather.sources[0].name, "Offline missing weather");
      const history = await call("get_clear_sky_climatology", { ...selection, month: 10 });
      assert.equal(history.availability.status, "not-covered");
      const option = { ...selection, window, activity: "general-stargazing" };
      const plan = await call("plan_observing_session", option);
      const comparison = await call("compare_observing_options", { options: [option, { ...option, activity: "astrophotography" }] });
      for (const row of [plan, ...comparison.comparisons]) {
        assert.equal(row.place?.placeId ?? row.placeId, candidate.placeId); assert.equal(row.availability.status, "partial");
        assert.ok(row.evidence.astronomy); assert.deepEqual(row.evidence.weather.forecasts, []);
        assert.ok(row.gaps.some((gap: string) => /forecast|weather/i.test(gap))); assert.ok(row.gaps.some((gap: string) => /historical/i.test(gap)));
        assert.ok(row.candidateWindows.every((candidateWindow: any) => candidateWindow.score === undefined));
      }
      assert.ok(weatherPoints.length >= 4); for (const point of weatherPoints) { assert.equal(point.latitude, candidate.latitude); assert.equal(point.longitude, candidate.longitude); }
    });
    await t.test("region filters expose unknown membership instead of treating it as verified geography", async () => {
      const origin = { placeId: candidate.placeId, catalogueRevision: candidate.catalogueRevision, radiusKm: 10 };
      for (const filters of [{ includeRegionIds: [regionId] }, { excludeRegionIds: [regionId] }]) {
        const result = await call("search_observing_locations", { scope: { origins: [origin], ...filters } });
        assert.deepEqual(result.candidates, [], "Unknown membership cannot verify inclusion or exclusion.");
        assert.match([result.availability.reason, result.coverage, ...result.caveats].join(" "), /(?:region|administrative|membership).*(?:unknown|unverified|incomplete)|(?:unknown|unverified|incomplete).*(?:region|administrative|membership)/i);
        assert.equal(result.discoveryCoverage.mappedFeatureCompleteness, "unknown");
      }
    });
    assert.equal(externalAttempts, 0);
  } finally {
    if (server) { server.closeAllConnections(); await new Promise<void>(done => server!.close(() => done())); }
    await rm(dir, { recursive: true, force: true });
  }
});
