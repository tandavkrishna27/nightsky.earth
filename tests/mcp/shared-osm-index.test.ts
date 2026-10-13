import assert from "node:assert/strict";
import test from "node:test";
import { once } from "node:events";
import { createServer } from "node:http";
import express from "express";
import { mountMcpRoute } from "../../server/mcp/route";
import { GeoNamesPlaceIndex } from "../../server/places/geonames";
import { importOsmJson } from "../../server/places/importOsm";
import type { OSMCandidateIndex } from "../../server/places/osmCandidates";
const placeId = "place:v1:geonames:1259229";
const index = new GeoNamesPlaceIndex([[1259229, "Pune", "Pune", "", 18.52, 73.85, "IN", "India", 1000000, "Asia/Kolkata"]], "fixture");
const osm = importOsmJson({ elements: [{ type: "node", id: 101, lat: 18.52, lon: 73.86, tags: { leisure: "park", name: "Fixture Park" } }] }, { vintage: "2026-10-01", coverage: "fixture" });
async function runWithLoader(loader: () => Promise<OSMCandidateIndex | undefined>, run: (call: (name?: string) => Promise<any>) => Promise<void>, injected?: OSMCandidateIndex) {
    const app = express();
    app.use(express.json({ limit: "32kb" }));
    mountMcpRoute(app, { placeIndex: index, osmCandidateIndexLoader: loader, osmCandidateIndex: injected, fetcher: async () => { throw Error("Offline fixture"); }, plannerServices: { getNightConditions: async () => { throw Error("Offline unavailable weather"); } } });
    const server = createServer(app).listen(0, "127.0.0.1");
    await once(server, "listening");
    const address = server.address();
    assert.ok(address && typeof address !== "string");
    let id = 0;
    const call = async (name = "search_observing_locations") => {
        const args = name === "plan_observing_session" ? { placeId, activity: "general-stargazing", window: { startUtc: "2026-10-13T12:00:00Z", endUtc: "2026-10-14T12:00:00Z", timeZone: "Asia/Kolkata" } } : { placeId };
        const response = await fetch(`http://127.0.0.1:${address.port}/mcp`, { method: "POST", headers: { "content-type": "application/json", accept: "application/json, text/event-stream", "mcp-protocol-version": "2025-11-25" }, body: JSON.stringify({ jsonrpc: "2.0", id: ++id, method: "tools/call", params: { name, arguments: args } }) });
        const body = await response.text();
        const event = body.split("\n").find(line => line.startsWith("data: "));
        return JSON.parse(event ? event.slice(6) : body).result;
    };
    try {
        await run(call);
    }
    finally {
        server.closeAllConnections();
        await new Promise<void>(done => server.close(() => done()));
    }
}
test("OSM lazy route cache coalesces requests and planner/direct search share it", async () => {
    let loads = 0;
    await runWithLoader(async () => { loads++; await new Promise(done => setTimeout(done, 20)); return osm; }, async (call) => {
        assert.equal(loads, 0);
        for (const result of await Promise.all([call(), call(), call()]))
            assert.equal(result.structuredContent.candidates[0].name, "Fixture Park");
        const plan = await call("plan_observing_session");
        assert.equal(plan.isError, undefined);
        assert.match(JSON.stringify(plan.structuredContent), /Fixture Park/);
        assert.equal(loads, 1);
    });
});
test("missing/failed OSM cache reads recover and injected artifacts bypass loader", async () => {
    for (const first of ["missing", "failed"]) {
        let loads = 0;
        await runWithLoader(async () => { if (++loads === 1) {
            if (first === "failed")
                throw Error("private failure");
            return undefined;
        } return osm; }, async (call) => {
            await call();
            assert.equal((await call()).structuredContent.candidates.length, 1);
            assert.equal(loads, 2);
        });
    }
    let loads = 0;
    await runWithLoader(async () => { loads++; return undefined; }, async (call) => { assert.equal((await call()).structuredContent.candidates.length, 1); assert.equal(loads, 0); }, osm);
});
