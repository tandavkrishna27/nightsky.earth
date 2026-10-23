import test from "node:test";
import assert from "node:assert/strict";
import { once } from "node:events";
import { createServer } from "node:http";
import express from "express";
import { mountMcpRoute, type McpRouteDependencies } from "../../server/mcp/route";
import { GeoNamesPlaceIndex } from "../../server/places/geonames";
import { createNightSkyMcpServer } from "../../server/mcp/index";
import { pluginToolMode } from "../../server/plugin";

test("operator tool scope defaults to full and rejects unknown modes", () => {
  assert.equal(pluginToolMode({}), "full");
  assert.equal(pluginToolMode({ NIGHTSKY_MCP_TOOL_MODE: "full" }), "full");
  assert.equal(pluginToolMode({ NIGHTSKY_MCP_TOOL_MODE: "resolver-only" }), "resolver-only");
  for (const value of ["", "all", "resolver_only", "resolve_place", "FULL"]) {
    assert.throws(() => pluginToolMode({ NIGHTSKY_MCP_TOOL_MODE: value }));
    assert.throws(() => createNightSkyMcpServer({ toolMode: value as "full" }));
  }
});

test("resolver-only rehearsal exposes one guarded tool and never starts a provider", async () => {
  const index = new GeoNamesPlaceIndex([[1270426, "Hanle", "Hanle", "", 32.78943, 78.9962, "IN", "India", 0, "Asia/Kolkata"]], "resolver-only-fixture");
  let providers = 0;
  const app = express(); app.use(express.json({ limit: "32kb" }));
  const dependencies = { toolMode: "resolver-only", placeIndex: index, fetcher: async () => { providers++; throw Error("provider must not run"); } } as McpRouteDependencies & { toolMode: "resolver-only" };
  mountMcpRoute(app, dependencies);
  const server = createServer(app).listen(0, "127.0.0.1"); await once(server, "listening");
  const address = server.address(); assert.ok(address && typeof address !== "string"); let id = 0;
  async function rpc(method: string, params: unknown) {
    const response = await fetch(`http://127.0.0.1:${address.port}/mcp`, { method: "POST", headers: { "content-type": "application/json", accept: "application/json, text/event-stream", "mcp-protocol-version": "2025-11-25" }, body: JSON.stringify({ jsonrpc: "2.0", id: ++id, method, params }) });
    assert.equal(response.status, 200);
    const raw = await response.text(); const line = raw.split("\n").find(row => row.startsWith("data: ")); assert.ok(line);
    return JSON.parse(line.slice(6));
  }
  try {
    await rpc("initialize", { protocolVersion: "2025-11-25", capabilities: {}, clientInfo: { name: "resolver-only", version: "1" } });
    const list = await rpc("tools/list", {});
    assert.deepEqual(list.result.tools.map((tool: { name: string }) => tool.name), ["resolve_place"]);
    assert.equal(list.result.tools[0].annotations.readOnlyHint, true);
    const resolved = await rpc("tools/call", { name: "resolve_place", arguments: { placeQuery: "Hanle, India" } });
    assert.equal(resolved.result.structuredContent.matches[0].placeId, "place:v1:geonames:1270426");
    assert.doesNotMatch(JSON.stringify(resolved), /latitude|longitude|32\.78943|78\.9962/);
    const coordinates = await rpc("tools/call", { name: "resolve_place", arguments: { placeQuery: "12.97, 77.59" } });
    assert.ok(coordinates.error || coordinates.result.isError);
    for (const name of ["get_night_conditions", "plan_observing_session", "get_clear_sky_climatology"]) {
      const blocked = await rpc("tools/call", { name, arguments: {} });
      assert.ok(blocked.error || blocked.result.isError, name);
    }
    assert.equal(providers, 0);
  } finally { server.closeAllConnections(); await new Promise<void>(done => server.close(() => done())); }
});
