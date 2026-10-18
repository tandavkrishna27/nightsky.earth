import assert from "node:assert/strict";
import { createServer as createHttpServer } from "node:http";
import { request as httpRequest } from "node:http";
import { once } from "node:events";
import test from "node:test";
import express from "express";
import { mountMcpRoute } from "../../server/mcp/route";

test("MCP route bounds bodies, handles malformed requests safely, and rejects unexpected hosts", async () => {
  const app = express();
  app.use(express.json({ limit: "32kb" }));
  mountMcpRoute(app, { allowedHosts: ["127.0.0.1"] });
  app.use((error: unknown, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
    res.status(400).json({ error: "Invalid request body." });
  });
  const server = createHttpServer(app);
  server.listen(0, "127.0.0.1");
  await once(server, "listening");
  const address = server.address();
  assert.ok(address && typeof address !== "string");
  const url = `http://127.0.0.1:${address.port}/mcp`;
  try {
    const malformed = await fetch(url, { method: "POST", headers: { "content-type": "application/json" }, body: "{" });
    assert.equal(malformed.status, 400);
    assert.doesNotMatch(await malformed.text(), /stack|node_modules|Error:/i);
    const oversized = await fetch(url, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ blob: "x".repeat(40_000) }) });
    assert.equal(oversized.status, 400);
    const hostStatus = await new Promise<number>((resolve, reject) => {
      const request = httpRequest(new URL(url), { method: "POST", headers: { host: "attacker.example", "content-type": "application/json" } }, (response) => {
        response.resume();
        response.on("end", () => resolve(response.statusCode ?? 0));
      });
      request.on("error", reject);
      request.end("{}");
    });
    assert.equal(hostStatus, 403);
  } finally {
    server.close();
    await once(server, "close");
  }
});

test("rate-limited requests do not consume active-request capacity", async () => {
  const app = express();
  app.use(express.json({ limit: "32kb" }));
  mountMcpRoute(app, { allowedHosts: ["127.0.0.1"], maxRequestsPerWindow: 1, maxProtocolRequestsPerWindow: 1, maxConcurrentRequests: 1 });
  const server = createHttpServer(app);
  server.listen(0, "127.0.0.1");
  await once(server, "listening");
  const address = server.address();
  assert.ok(address && typeof address !== "string");
  const url = `http://127.0.0.1:${address.port}/mcp`;
  const body = JSON.stringify({ jsonrpc: "2.0", id: 1, method: "initialize", params: { protocolVersion: "2025-11-25", capabilities: {}, clientInfo: { name: "test", version: "1" } } });
  try {
    const first = await fetch(url, { method: "POST", headers: { "content-type": "application/json", accept: "application/json, text/event-stream" }, body });
    assert.equal(first.status, 200);
    await first.text();

    const rateLimited = await fetch(url, { method: "POST", headers: { "content-type": "application/json", accept: "application/json, text/event-stream" }, body });
    assert.equal(rateLimited.status, 429);
    await rateLimited.text();

    const stillRateLimited = await fetch(url, { method: "POST", headers: { "content-type": "application/json", accept: "application/json, text/event-stream" }, body });
    assert.equal(stillRateLimited.status, 429, "the rate limit must not leave a phantom active request behind");
  } finally {
    server.close();
    await once(server, "close");
  }
});
