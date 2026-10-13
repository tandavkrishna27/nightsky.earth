import assert from "node:assert/strict";
import test from "node:test";
import { once } from "node:events";
import { createServer } from "node:http";
import express from "express";
import { consentedHostLocation, deriveSubjectRateKey, SubjectRateLimiter } from "../../server/mcp/metadata";
import { mountMcpRoute } from "../../server/mcp/route";
import { GeoNamesPlaceIndex } from "../../server/places/geonames";
test("location metadata is allowlisted, rounded and consent gated", () => {
    const metadata = { "openai/userLocation": { latitude: 18.523456, longitude: 73.856789, city: "private-label" }, "openai/session": "private-session" };
    assert.equal(consentedHostLocation(metadata, false), undefined);
    assert.deepEqual(consentedHostLocation(metadata, true), { latitude: 18.52, longitude: 73.86 });
    for (const location of [null, { latitude: "18.52", longitude: 73.85 }, { latitude: Infinity, longitude: 73.85 }, { latitude: 91, longitude: 73.85 }, { latitude: 18.52, longitude: -181 }])
        assert.equal(consentedHostLocation({ "openai/userLocation": location }, true), undefined);
});
test("subject counters are salted, bounded, expire and never rely on missing identity", () => {
    assert.notEqual(deriveSubjectRateKey("private-subject", Buffer.alloc(32, 1)), deriveSubjectRateKey("private-subject", Buffer.alloc(32, 2)));
    assert.equal(deriveSubjectRateKey("private-subject", Buffer.alloc(32, 1)).includes("private-subject"), false);
    const limiter = new SubjectRateLimiter({ maxRequests: 1, maxKeys: 2, windowMs: 1000 });
    const meta = (subject: string) => ({ "openai/subject": subject });
    assert.equal(limiter.admit(meta("a"), 0).allowed, true);
    assert.equal(limiter.admit(meta("a"), 1).allowed, false);
    assert.equal(limiter.admit(meta("b"), 1).allowed, true);
    assert.equal(limiter.admit(meta("c"), 2).allowed, false);
    assert.equal(limiter.keyCount, 2);
    assert.equal(limiter.admit(meta("c"), 1001).allowed, true);
    assert.equal(limiter.admit(meta("x".repeat(129)), 1002).allowed, true);
    assert.equal(limiter.admit({}, 1002).allowed, true);
    assert.equal(limiter.keyCount, 1);
    for (const value of [0, -1, 1.5, Infinity])
        assert.throws(() => new SubjectRateLimiter({ maxRequests: value }), /positive safe integers/);
});
async function withMetadataRoute(run: (call: (args: unknown, meta?: unknown) => Promise<{
    status: number;
    body: string;
    result: any;
}>) => Promise<void>, limits: Record<string, number> = {}) {
    const app = express();
    app.use(express.json({ limit: "32kb" }));
    const index = new GeoNamesPlaceIndex([[1259229, "Pune", "Pune", "", 18.52, 73.85, "IN", "India", 1000000, "Asia/Kolkata"], [2643743, "London", "London", "", 51.5, -.12, "GB", "United Kingdom", 8000000, "Europe/London"]], "fixture");
    mountMcpRoute(app, { placeIndex: index, ...limits });
    const server = createServer(app).listen(0, "127.0.0.1");
    await once(server, "listening");
    const address = server.address();
    assert.ok(address && typeof address !== "string");
    let id = 0;
    const call = async (args: unknown, meta?: unknown) => {
        const response = await fetch(`http://127.0.0.1:${address.port}/mcp`, { method: "POST", headers: { "content-type": "application/json", accept: "application/json, text/event-stream", "mcp-protocol-version": "2025-11-25" }, body: JSON.stringify({ jsonrpc: "2.0", id: ++id, method: "tools/call", params: { name: "resolve_place", arguments: args, _meta: meta } }) });
        const body = await response.text();
        const data = body.split("\n").find(line => line.startsWith("data: "));
        return { status: response.status, body, result: JSON.parse(data ? data.slice(6) : body).result };
    };
    try {
        await run(call);
    }
    finally {
        server.closeAllConnections();
        await new Promise<void>(done => server.close(() => done()));
    }
}
test("MCP location hint resolves only with consent and never echoes raw metadata", async () => {
    await withMetadataRoute(async (call) => {
        const meta = { "openai/userLocation": { latitude: 18.523456, longitude: 73.856789, city: "private-label" }, "openai/subject": "private-subject", "openai/session": "private-session", "openai/userAgent": "private-useragent" };
        const named = await call({ placeQuery: "London, United Kingdom" }, meta);
        assert.equal(named.result.structuredContent.matches[0].placeId, "place:v1:geonames:2643743");
        const nearby = await call({ useApproximateHostLocation: true }, meta);
        assert.equal(nearby.result.structuredContent.matches[0].placeId, "place:v1:geonames:1259229");
        for (const marker of ["18.523456", "73.856789", "private-label", "private-subject", "private-session", "private-useragent"])
            assert.equal(nearby.body.includes(marker), false);
        for (const metadata of [undefined, { "openai/userLocation": { latitude: 999, longitude: 73 } }]) {
            const absent = await call({ useApproximateHostLocation: true }, metadata);
            assert.equal(absent.result.structuredContent.availability.reason, "host-location-unavailable");
        }
    });
});
test("subject rejection does not occupy active capacity and changing subjects cannot bypass IP/global", async () => {
    await withMetadataRoute(async (call) => {
        assert.equal((await call({ placeQuery: "Pune" }, { "openai/subject": "a" })).status, 200);
        assert.equal((await call({ placeQuery: "Pune" }, { "openai/subject": "a" })).status, 429);
        assert.equal((await call({ placeQuery: "Pune" }, { "openai/subject": "b" })).status, 200);
        assert.equal((await call({ placeQuery: "Pune" }, { "openai/subject": "c" })).status, 429);
    }, { maxSubjectRequestsPerWindow: 1, maxRequestsPerWindow: 2, maxGlobalRequestsPerWindow: 10, maxConcurrentRequests: 1 });
    await withMetadataRoute(async (call) => {
        assert.equal((await call({ placeQuery: "Pune" }, { "openai/subject": "a" })).status, 200);
        assert.equal((await call({ placeQuery: "Pune" }, { "openai/subject": "b" })).status, 429);
    }, { maxSubjectRequestsPerWindow: 1, maxRequestsPerWindow: 10, maxGlobalRequestsPerWindow: 1 });
});
test("subject window recovers without replacing IP/global controls", async () => {
    await withMetadataRoute(async (call) => {
        const args = { placeQuery: "Pune" }, meta = { "openai/subject": "private-subject" };
        assert.equal((await call(args, meta)).status, 200);
        const rejected = await call(args, meta);
        assert.equal(rejected.status, 429);
        assert.equal(rejected.body.includes("private-subject"), false);
        await new Promise(done => setTimeout(done, 120));
        assert.equal((await call(args, meta)).status, 200);
    }, { maxSubjectRequestsPerWindow: 1, maxRequestsPerWindow: 10, maxGlobalRequestsPerWindow: 10, rateWindowMs: 100, maxConcurrentRequests: 1 });
});
