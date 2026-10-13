import assert from "node:assert/strict";
import { once } from "node:events";
import { createServer } from "node:http";
import test from "node:test";
import express from "express";
import { mountMcpRoute } from "../../server/mcp/route";
import { GeoNamesPlaceIndex } from "../../server/places/geonames";
const index = new GeoNamesPlaceIndex([[1259229, "Pune", "Pune", "", 18.52, 73.85, "IN", "India", 1000000, "Asia/Kolkata"]], "fixture");
async function withRoute(loader: () => Promise<GeoNamesPlaceIndex | undefined>, run: (call: (params?: unknown) => Promise<any>) => Promise<void>, injected?: GeoNamesPlaceIndex) {
    const app = express();
    app.use(express.json({ limit: "32kb" }));
    mountMcpRoute(app, { placeIndexLoader: loader, placeIndex: injected });
    const server = createServer(app).listen(0, "127.0.0.1");
    await once(server, "listening");
    const address = server.address();
    assert.ok(address && typeof address !== "string");
    let id = 0;
    const call = async (params: unknown = { name: "resolve_place", arguments: { placeQuery: "Pune, India" } }) => {
        const response = await fetch(`http://127.0.0.1:${address.port}/mcp`, { method: "POST", headers: { "content-type": "application/json", accept: "application/json, text/event-stream" }, body: JSON.stringify({ jsonrpc: "2.0", id: ++id, method: "tools/call", params }) });
        const body = await response.text();
        const data = body.split("\n").find(line => line.startsWith("data: "));
        return JSON.parse(data ? data.slice(6) : body);
    };
    try {
        await run(call);
    }
    finally {
        server.closeAllConnections();
        await new Promise<void>(done => server.close(() => done()));
    }
}
test("route lazily coalesces concurrent index reads across stateless requests", async () => {
    let loads = 0;
    await withRoute(async () => { loads++; await new Promise(done => setTimeout(done, 20)); return index; }, async (call) => {
        assert.equal(loads, 0);
        const responses = await Promise.all([call(), call(), call()]);
        for (const response of responses)
            assert.equal(response.result.structuredContent.matches[0].placeId, "place:v1:geonames:1259229");
        await call();
        const climate = await call({ name: "get_clear_sky_climatology", arguments: { placeId: "place:v1:geonames:1259229", month: 10 } });
        assert.ok(climate.result?.structuredContent, "history handler uses route index even without an installed fixture artifact");
        assert.equal(loads, 1);
    });
});
test("missing and failed index loads can recover on the next request", async () => {
    for (const first of ["missing", "failed"]) {
        let loads = 0;
        await withRoute(async () => { if (++loads === 1) {
            if (first === "failed")
                throw Error("fixture failure");
            return undefined;
        } return index; }, async (call) => {
            await call();
            const response = await call();
            assert.equal(response.result.structuredContent.matches[0].placeId, "place:v1:geonames:1259229");
            assert.equal(loads, 2);
        });
    }
});
test("injected index takes precedence over lazy loader", async () => {
    let loads = 0;
    await withRoute(async () => { loads++; return undefined; }, async (call) => {
        const response = await call();
        assert.equal(response.result.structuredContent.matches.length, 1);
        assert.equal(loads, 0);
    }, index);
});
