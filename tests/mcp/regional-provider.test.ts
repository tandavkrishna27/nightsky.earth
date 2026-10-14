import assert from "node:assert/strict";
import test from "node:test";
import { once } from "node:events";
import { createServer } from "node:http";
import express from "express";
import { mountMcpRoute } from "../../server/mcp/route";
import type { NightSkyDependencies } from "../../server/mcp/registerTools";
import { GeoNamesPlaceIndex } from "../../server/places/geonames";
import { importOsmJson } from "../../server/places/importOsm";
import { searchObservingLocations } from "../../server/places/osmCandidates";
import type { SearchObservingLocationsInput } from "../../shared/nightsky/places";
import type { SearchPlace } from "../../server/places/osmCandidates";

const placeId = "place:v1:geonames:1259229";
const places = new GeoNamesPlaceIndex([[1259229, "Pune", "Pune", "", 18.52, 73.85, "IN", "India", 1000000, "Asia/Kolkata"]], "fixture");
const candidateIndex = importOsmJson({ elements: [{ type: "node", id: 501, lat: 18.52, lon: 73.86, tags: { leisure: "park", name: "Regional Fixture Park" } }] }, { vintage: "regional-fixture-v1", coverage: "Partial fixture region" });
type CandidateProvider = { search(input: SearchObservingLocationsInput, options: { place: SearchPlace }): ReturnType<typeof searchObservingLocations> };

async function withProvider(provider: CandidateProvider, run: (call: (name: string) => Promise<any>, flatReads: () => number) => Promise<void>) {
  let flatLoads = 0;
  const dependencies: NightSkyDependencies & { candidateProvider: CandidateProvider } = {
    placeIndex: places, candidateProvider: provider,
    osmCandidateIndexLoader: async () => { flatLoads++; return undefined; },
    fetcher: async () => { throw Error("External provider traffic prohibited"); },
    plannerServices: {
      getNightConditions: async () => { throw Error("Offline unavailable weather"); },
      getClimatology: async () => { throw Error("Offline unavailable history"); },
    },
  };
  const app = express(); app.use(express.json()); mountMcpRoute(app, dependencies);
  const server = createServer(app).listen(0, "127.0.0.1"); await once(server, "listening");
  const address = server.address(); assert.ok(address && typeof address !== "string");
  let id = 0;
  const call = async (name: string) => {
    const args = name === "plan_observing_session" ? { placeId, activity: "general-stargazing", window: { startUtc: "2026-10-13T12:00:00Z", endUtc: "2026-10-14T12:00:00Z", timeZone: "Asia/Kolkata" } } : { placeId };
    const response = await fetch(`http://127.0.0.1:${address.port}/mcp`, { method: "POST", headers: { "content-type": "application/json", accept: "application/json, text/event-stream", "mcp-protocol-version": "2025-11-25" }, body: JSON.stringify({ jsonrpc: "2.0", id: ++id, method: "tools/call", params: { name, arguments: args } }) });
    const raw = await response.text(); const event = raw.split("\n").find(line => line.startsWith("data: "));
    return JSON.parse(event ? event.slice(6) : raw).result;
  };
  try { await run(call, () => flatLoads); } finally { server.closeAllConnections(); await new Promise<void>(done => server.close(() => done())); }
}

test("regional candidate provider is shared by direct MCP and composed planning without flat fallback", async () => {
  let searches = 0;
  await withProvider({ search: async (input, options) => { searches++; return searchObservingLocations(input, { index: candidateIndex, place: options.place }); } }, async (call, flatReads) => {
    const direct = await call("search_observing_locations");
    assert.equal(direct.structuredContent.candidates[0]?.name, "Regional Fixture Park");
    const plan = await call("plan_observing_session");
    assert.match(JSON.stringify(plan.structuredContent), /Regional Fixture Park/);
    assert.match(JSON.stringify(plan.structuredContent), /regional-fixture-v1/);
    assert.equal(searches, 2); assert.equal(flatReads(), 0);
  });
});

test("regional provider integrity failure remains explicit in composed planning without flat fallback", async () => {
  await withProvider({ search: async () => { throw Error("private-artifact-path checksum failure"); } }, async (call, flatReads) => {
    const direct = await call("search_observing_locations"); assert.equal(direct.isError, true);
    assert.doesNotMatch(JSON.stringify(direct), /private-artifact-path/);
    const plan = await call("plan_observing_session");
    assert.match(JSON.stringify(plan.structuredContent), /candidate.*unavailable|candidate.*could not|candidate.*failed/i);
    assert.doesNotMatch(JSON.stringify(plan), /private-artifact-path/);
    assert.equal(flatReads(), 0);
  });
});
