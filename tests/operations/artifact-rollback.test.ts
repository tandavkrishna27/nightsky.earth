import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { once } from "node:events";
import { mkdtemp, mkdir, readFile, writeFile, rm } from "node:fs/promises";
import { createServer } from "node:http";
import { tmpdir } from "node:os";
import { join, resolve, sep } from "node:path";
import test from "node:test";
import express from "express";
import { mountMcpRoute } from "../../server/mcp/route";
import { GeoNamesPlaceIndex } from "../../server/places/geonames";
const expectedSha256 = "7d07f347d8e5dfff06cdfc59a72e262b61760528bd5cac14b091f75e26f23755";
const keys = ["NIGHTSKY_OSM_CANDIDATE_INDEX", "NIGHTSKY_OSM_CANDIDATE_SHA256", "NIGHTSKY_OSM_CANDIDATE_MAX_BYTES"] as const;
const index = new GeoNamesPlaceIndex([[1266425, "Kodaikanal", "Kodaikanal", "", 10.239, 77.49, "IN", "India", 36501, "Asia/Kolkata"]], "public pilot fixture");
async function mountedRelease() {
    const app = express();
    app.use(express.json({ limit: "32kb" }));
    mountMcpRoute(app, { placeIndex: index });
    const server = createServer(app).listen(0, "127.0.0.1");
    await once(server, "listening");
    const address = server.address();
    assert.ok(address && typeof address !== "string");
    let id = 0;
    return {
        async call() {
            const response = await fetch(`http://127.0.0.1:${address.port}/mcp`, { method: "POST", headers: { "content-type": "application/json", accept: "application/json, text/event-stream", "mcp-protocol-version": "2025-11-25" }, body: JSON.stringify({ jsonrpc: "2.0", id: ++id, method: "tools/call", params: { name: "search_observing_locations", arguments: { placeId: "place:v1:geonames:1266425" } } }) });
            const body = await response.text();
            const data = body.split("\n").find(line => line.startsWith("data: "));
            return { body, result: JSON.parse(data ? data.slice(6) : body).result };
        },
        async close() { server.closeAllConnections(); await new Promise<void>(done => server.close(() => done())); },
    };
}
test("immutable public OSM artifact release rolls back after checksum failure through fresh MCP routes", async () => {
    const bytes = await readFile(new URL("../osm/fixtures/real-three-boxes/candidates.json", import.meta.url));
    assert.equal(createHash("sha256").update(bytes).digest("hex"), expectedSha256);
    const temporary = await mkdtemp(join(tmpdir(), "nightsky-artifact-rollback-"));
    const oldValues = Object.fromEntries(keys.map(key => [key, process.env[key]]));
    const active: Awaited<ReturnType<typeof mountedRelease>>[] = [];
    try {
        const previousDir = join(temporary, "previous");
        const candidateDir = join(temporary, "candidate");
        await mkdir(previousDir);
        await mkdir(candidateDir);
        const previousPath = join(previousDir, "candidates.json");
        const candidatePath = join(candidateDir, "candidates.json");
        await writeFile(previousPath, bytes);
        await writeFile(candidatePath, Buffer.concat([bytes, Buffer.from("\n")]));
        process.env.NIGHTSKY_OSM_CANDIDATE_SHA256 = expectedSha256;
        process.env.NIGHTSKY_OSM_CANDIDATE_MAX_BYTES = "2097152";
        process.env.NIGHTSKY_OSM_CANDIDATE_INDEX = previousPath;
        const previous = await mountedRelease();
        active.push(previous);
        // Mount-time snapshot must still select previous bytes after environment changes.
        process.env.NIGHTSKY_OSM_CANDIDATE_INDEX = candidatePath;
        const original = await previous.call();
        assert.equal(original.result.isError, undefined);
        assert.ok(original.result.structuredContent.candidates.length > 0);
        await previous.close();
        active.pop();
        const candidate = await mountedRelease();
        active.push(candidate);
        const failed = await candidate.call();
        assert.equal(failed.result.isError, true);
        assert.equal(failed.result.structuredContent, undefined);
        assert.equal(failed.body.includes(temporary), false);
        await candidate.close();
        active.pop();
        process.env.NIGHTSKY_OSM_CANDIDATE_INDEX = previousPath;
        const restored = await mountedRelease();
        active.push(restored);
        assert.deepEqual((await restored.call()).result.structuredContent, original.result.structuredContent);
        assert.equal(createHash("sha256").update(await readFile(previousPath)).digest("hex"), expectedSha256);
        await restored.close();
        active.pop();
        // Explicit byte ceiling is exercised through the same runtime environment wiring.
        process.env.NIGHTSKY_OSM_CANDIDATE_MAX_BYTES = "1";
        const undersized = await mountedRelease();
        active.push(undersized);
        assert.equal((await undersized.call()).result.isError, true);
    }
    finally {
        for (const release of active)
            await release.close();
        for (const key of keys) {
            const old = oldValues[key];
            if (old === undefined)
                delete process.env[key];
            else
                process.env[key] = old;
        }
        assert.ok(resolve(temporary).startsWith(resolve(tmpdir()) + sep));
        await rm(temporary, { recursive: true, force: true });
    }
});
