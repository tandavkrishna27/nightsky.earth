import assert from "node:assert/strict";
import { createServer } from "node:http";
import { once } from "node:events";
import test from "node:test";
import express from "express";
import { mountMcpRoute } from "../../server/mcp/route";
import { GeoNamesPlaceIndex } from "../../server/places/geonames";

test("MCP named-place transport ignores unrequested location and never echoes assistant identifiers", async () => {
  const index = new GeoNamesPlaceIndex([{ geonameId: 2643743, name: "London", asciiName: "London", alternateNames: "", latitude: 51.5, longitude: -0.12, countryCode: "GB", countryName: "United Kingdom", featureClass: "P", featureCode: "PPLC", population: 8000000, timeZone: "Europe/London", modificationDate: "2026-10-01" }], "fixture");
  const app = express();
  app.use(express.json());
  mountMcpRoute(app, { placeIndex: index });
  const server = createServer(app).listen(0, "127.0.0.1");
  await once(server, "listening");
  const address = server.address();
  assert.ok(address && typeof address !== "string");
  try {
    const response = await fetch(`http://127.0.0.1:${address.port}/mcp`, {
      method: "POST", headers: { "content-type": "application/json", accept: "application/json, text/event-stream", "mcp-protocol-version": "2025-11-25" },
      body: JSON.stringify({ jsonrpc: "2.0", id: 1, method: "tools/call", params: {
        name: "resolve_place", arguments: { placeQuery: "London" },
        _meta: { "openai/userLocation": { latitude: 51.5, longitude: -0.12, city: "London" }, "openai/subject": "private-subject-marker", "openai/session": "private-session-marker" },
      } }),
    });
    assert.equal(response.status, 200);
    const body = await response.text();
    const line = body.split("\n").find(value => value.startsWith("data: "));
    assert.ok(line);
    const result = JSON.parse(line.slice(6)).result;
    assert.equal(result.isError, undefined);
    assert.equal(result.structuredContent.availability.status, "available");
    assert.equal(result.structuredContent.matches[0].placeId, "place:v1:geonames:2643743");
    for (const marker of ["private-subject-marker", "private-session-marker", "51.5", "-0.12"]) assert.equal(body.includes(marker), false);
  } finally {
    server.closeAllConnections();
    await new Promise<void>(done => server.close(() => done()));
  }
});
