import assert from "node:assert/strict";
import { once } from "node:events";
import { createServer } from "node:http";
import test from "node:test";
import { createNightSkyPluginApp, pluginListenerConfiguration, pluginDiscoveryMode } from "../../server/plugin";
test("plugin listener defaults to loopback and rejects invalid ports/hosts", () => {
    assert.deepEqual(pluginListenerConfiguration({}), { host: "127.0.0.1", port: 5000 });
    assert.deepEqual(pluginListenerConfiguration({ HOST: "::1", PORT: "65535" }), { host: "::1", port: 65535 });
    for (const PORT of ["0", "65536", "1.5", "-1", "abc", "", "5000\nsecret"])
        assert.throws(() => pluginListenerConfiguration({ PORT }), /Invalid plugin listener configuration/);
    for (const HOST of ["", "http://localhost", "bad\nsecret", "a".repeat(254)])
        assert.throws(() => pluginListenerConfiguration({ HOST }), /Invalid plugin listener configuration/);
});
test("standalone plugin entry exposes only bounded health and MCP without website APIs or provider traffic", async () => {
    let externalCalls = 0;
    const logs: string[] = [];
    const app = createNightSkyPluginApp({ fetcher: async () => { externalCalls++; throw Error("External traffic forbidden"); }, log: line => logs.push(line) });
    const server = createServer(app).listen(0, "127.0.0.1");
    await once(server, "listening");
    const address = server.address();
    assert.ok(address && typeof address !== "string");
    const base = `http://127.0.0.1:${address.port}`;
    try {
        const health = await fetch(`${base}/health`);
        assert.equal(health.status, 200);
        assert.equal((await health.json()).service, "nightsky");
        assert.equal((await fetch(`${base}/api/news?search=private-query`)).status, 404);
        assert.equal((await fetch(`${base}/`)).status, 404);
        const rpc = async (id: number, method: string, params: unknown) => {
            const response = await fetch(`${base}/mcp`, { method: "POST", headers: { "content-type": "application/json", accept: "application/json, text/event-stream", "mcp-protocol-version": "2025-11-25" }, body: JSON.stringify({ jsonrpc: "2.0", id, method, params }) });
            assert.equal(response.status, 200);
            const body = await response.text();
            const data = body.split("\n").find(line => line.startsWith("data: "));
            return JSON.parse(data ? data.slice(6) : body).result;
        };
        const initialized = await rpc(1, "initialize", { protocolVersion: "2025-11-25", capabilities: {}, clientInfo: { name: "offline-entry", version: "1" } });
        assert.equal(initialized.serverInfo.name, "nightsky-earth");
        assert.equal((await rpc(2, "tools/list", {})).tools.length, 14);
        const result = await rpc(3, "tools/call", { name: "recommend_specialist_tools", arguments: { activity: "general-stargazing" } });
        assert.equal(result.isError, undefined);
        assert.ok(result.structuredContent.recommendations.length);
        const malformed = await fetch(`${base}/mcp`, { method: "POST", headers: { "content-type": "application/json" }, body: "{ private-body-marker" });
        assert.equal(malformed.status, 400);
        assert.equal(await malformed.text(), JSON.stringify({ message: "Invalid request." }));
        const oversized = await fetch(`${base}/mcp`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ private: "x".repeat(33 * 1024) }) });
        assert.equal(oversized.status, 413);
        assert.equal(await oversized.text(), JSON.stringify({ message: "Invalid request." }));
        assert.equal(externalCalls, 0);
        assert.doesNotMatch(logs.join("\n"), /private-|\bsearch=/);
        assert.equal((await fetch(`${base}/health`)).status, 200, "body errors do not stop the listener");
    }
    finally {
        server.closeAllConnections();
        await new Promise<void>(done => server.close(() => done()));
    }
});

test('discovery mode rejects local files in API mode and requires explicit legacy manifests',()=>{
 assert.equal(pluginDiscoveryMode({}),'legacy');assert.equal(pluginDiscoveryMode({NIGHTSKY_DISCOVERY_MODE:'api'}),'api');
 for(const environment of [{NIGHTSKY_DISCOVERY_MODE:'unknown'},{NIGHTSKY_DISCOVERY_MODE:'api',NIGHTSKY_GEONAMES_INDEX:'cities.gz'},{NIGHTSKY_DISCOVERY_MODE:'api',NIGHTSKY_OSM_CANDIDATE_INDEX:'old.json'},{NIGHTSKY_DISCOVERY_MODE:'catalogue'},{NIGHTSKY_DISCOVERY_MODE:'regional'}])assert.throws(()=>pluginDiscoveryMode(environment));
});
