import assert from "node:assert/strict";
import test from "node:test";
import { once } from "node:events";
import { createServer } from "node:http";
import express from "express";
import { requestLogging } from "../../server/requestLogging";
test("request logs contain fixed route labels/status/duration without reading response bodies", async () => {
    const logs: string[] = [];
    const app = express();
    app.use(express.json());
    app.use(requestLogging(line => logs.push(line)));
    app.post("/api/news/:id", (req, res) => res.json({ private: "private-body-marker", echo: req.body }));
    const server = createServer(app).listen(0, "127.0.0.1");
    await once(server, "listening");
    const address = server.address();
    assert.ok(address && typeof address !== "string");
    try {
        const response = await fetch(`http://127.0.0.1:${address.port}/api/news/private-path-marker?search=private-query-marker`, { method: "POST", headers: { "content-type": "application/json", "x-private": "private-header-marker" }, body: JSON.stringify({ placeQuery: "private-input-marker" }) });
        await response.text();
        assert.equal(logs.length, 1);
        assert.match(logs[0], /^POST \/api\/news\/:id 200 in \d+ms$/);
        assert.doesNotMatch(logs[0], /private-/);
        await fetch(`http://127.0.0.1:${address.port}/api/unknown-private-marker`);
        assert.match(logs[1], /^GET \/api\/other 404 in \d+ms$/);
    }
    finally {
        server.closeAllConnections();
        await new Promise<void>(done => server.close(() => done()));
    }
});
