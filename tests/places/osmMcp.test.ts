import assert from "node:assert/strict";
import { createServer as createHttpServer } from "node:http";
import { once } from "node:events";
import test from "node:test";
import express from "express";
import { mountMcpRoute } from "../../server/mcp/route";
import { GeoNamesPlaceIndex } from "../../server/places/geonames";
import { importOsmJson } from "../../server/places/importOsm";

const protocolVersion = "2025-11-25";
async function post(url: string, body: unknown) {
  const response = await fetch(url, { method: "POST", headers: { "content-type": "application/json", accept: "application/json, text/event-stream", "mcp-protocol-version": protocolVersion }, body: JSON.stringify(body) });
  const text = await response.text();
  const data = text.split("\n").find((line) => line.startsWith("data: "));
  return data ? JSON.parse(data.slice(6)) : text;
}

test("MCP exposes source-linked observing candidates and unverified location context", async () => {
  const placeIndex = new GeoNamesPlaceIndex([{
    geonameId: 1880252, name: "Pune", asciiName: "Pune", alternateNames: "",
    latitude: 18.5204, longitude: 73.8567, countryCode: "IN", countryName: "India",
    featureClass: "P", featureCode: "PPL", population: 100_000,
    timeZone: "Asia/Kolkata", modificationDate: "2026-10-01",
  }], "geonames-cities500-test");
  const osmIndex = importOsmJson({ elements: [{ type: "node", id: 101, lat: 18.52, lon: 73.86, tags: { leisure: "park", name: "Lakeside Park" } }] }, { vintage: "2026-10-01", coverage: "Pune fixture" });
  const app = express(); app.use(express.json({ limit: "32kb" }));
  mountMcpRoute(app, { allowedHosts: ["127.0.0.1"], placeIndex, osmCandidateIndex: osmIndex });
  const server = createHttpServer(app); server.listen(0, "127.0.0.1"); await once(server, "listening");
  const address = server.address(); assert.ok(address && typeof address !== "string"); const base = `http://127.0.0.1:${address.port}/mcp`;
  try {
    await post(base, { jsonrpc: "2.0", id: 1, method: "initialize", params: { protocolVersion, capabilities: {}, clientInfo: { name: "test", version: "1" } } });
    const listed = await post(base, { jsonrpc: "2.0", id: 2, method: "tools/list", params: {} });
    assert.ok(listed.result.tools.some((tool: { name: string }) => tool.name === "search_observing_locations"));
    const searched = await post(base, { jsonrpc: "2.0", id: 3, method: "tools/call", params: { name: "search_observing_locations", arguments: { placeId: "place:v1:geonames:1880252", radiusKm: 10 } } });
    const candidate = searched.result.structuredContent.candidates[0];
    assert.equal(candidate.name, "Lakeside Park");
    assert.equal(candidate.accessEvidence.status, "unknown");
    assert.match(candidate.sources[0].attribution, /OpenStreetMap contributors/);
    const context = await post(base, { jsonrpc: "2.0", id: 4, method: "tools/call", params: { name: "get_location_context", arguments: { placeId: "place:v1:geonames:1880252" } } });
    assert.equal(context.result.structuredContent.groundLightContext.status, "unknown");
    assert.equal(context.result.structuredContent.access.status, "unknown");
  } finally { server.close(); await once(server, "close"); }
});
