import assert from "node:assert/strict";
import { once } from "node:events";
import { createServer } from "node:http";
import test from "node:test";
import express from "express";
import { mountHealthRoute } from "../../server/health";

test("health reports local readiness, disables caching, and redacts failures", async () => {
  let ready = true;
  const app = express();
  mountHealthRoute(app, { checks: { placeIndex: () => {
    if (!ready) throw new Error("secret-token; location=12.1234,44.5678");
    return "ready";
  } } });
  const server = createServer(app).listen(0, "127.0.0.1");
  await once(server, "listening");
  const address = server.address();
  assert.ok(address && typeof address !== "string");
  try {
    const url = `http://127.0.0.1:${address.port}/health`;
    const response = await fetch(url);
    assert.equal(response.status, 200);
    assert.equal(response.headers.get("cache-control"), "no-store");
    const body = await response.json();
    assert.equal(body.probe, "readiness");
    assert.deepEqual(body.components, { placeIndex: "ready" });
    assert.ok(Number.isInteger(body.uptimeSeconds) && body.uptimeSeconds >= 0);
    ready = false;
    const failed = await fetch(url);
    assert.equal(failed.status, 503);
    const text = await failed.text();
    assert.doesNotMatch(text, /secret|location|12\.1234|stack|Error/);
    assert.equal(JSON.parse(text).components.placeIndex, "unavailable");
  } finally { server.closeAllConnections(); server.close(); await once(server, "close"); }
});

test("unconfigured health accurately identifies itself as liveness", async () => {
  let handler: any;
  mountHealthRoute({ get: (_path: string, callback: unknown) => { handler = callback; } } as any);
  let body: any;
  const response = { set: () => response, status: (status: number) => { assert.equal(status, 200); return response; }, json: (value: unknown) => { body = value; } };
  handler({}, response);
  assert.equal(body.probe, "liveness");
  assert.deepEqual(body.components, {});
});
