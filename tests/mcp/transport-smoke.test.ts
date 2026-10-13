import assert from "node:assert/strict";
import { createServer as createHttpServer, request as httpRequest, type Server } from "node:http";
import { once } from "node:events";
import test from "node:test";
import type express from "express";
import { createMcpSmokeApp } from "./inspector-smoke-server";

const protocolVersion = "2025-11-25";

function eventPayload(body: string): Record<string, any> {
  const data = body.split("\n").find((line) => line.startsWith("data: "));
  assert.ok(data, `Expected an MCP SSE data event, got: ${body}`);
  return JSON.parse(data.slice("data: ".length));
}

async function postMcp(url: string, body: unknown): Promise<{ status: number; payload: Record<string, any> }> {
  const response = await fetch(url, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      accept: "application/json, text/event-stream",
      "mcp-protocol-version": protocolVersion,
    },
    body: JSON.stringify(body),
  });
  return { status: response.status, payload: eventPayload(await response.text()) };
}

async function withServer(
  app: express.Express,
  run: (baseUrl: string, server: Server) => Promise<void>,
): Promise<void> {
  const httpServer = createHttpServer(app);
  httpServer.listen(0, "127.0.0.1");
  await once(httpServer, "listening");
  const address = httpServer.address();
  assert.ok(address && typeof address !== "string");
  try {
    await run(`http://127.0.0.1:${address.port}`, httpServer);
  } finally {
    httpServer.close();
    await once(httpServer, "close");
  }
}

test("Express serves MCP initialize, list, valid/invalid calls, and concurrent stateless requests", async () => {
  const app = createMcpSmokeApp();

  await withServer(app, async (baseUrl) => {
    const initialize = await postMcp(`${baseUrl}/mcp`, {
      jsonrpc: "2.0",
      id: 1,
      method: "initialize",
      params: {
        protocolVersion,
        capabilities: {},
        clientInfo: { name: "smoke-test", version: "1.0.0" },
      },
    });
    assert.equal(initialize.status, 200);
    assert.equal(initialize.payload.result.protocolVersion, protocolVersion);

    const listed = await postMcp(`${baseUrl}/mcp`, {
      jsonrpc: "2.0",
      id: 2,
      method: "tools/list",
      params: {},
    });
    assert.equal(listed.status, 200);
    assert.deepEqual(listed.payload.result.tools.map((tool: { name: string }) => tool.name), ["echo"]);

    const validCall = await postMcp(`${baseUrl}/mcp`, {
      jsonrpc: "2.0",
      id: 3,
      method: "tools/call",
      params: { name: "echo", arguments: { message: "transport works" } },
    });
    assert.equal(validCall.status, 200);
    assert.equal(validCall.payload.result.structuredContent.message, "transport works");

    const invalidCall = await postMcp(`${baseUrl}/mcp`, {
      jsonrpc: "2.0",
      id: 4,
      method: "tools/call",
      params: { name: "echo", arguments: { message: "" } },
    });
    assert.equal(invalidCall.status, 200);
    assert.equal(invalidCall.payload.result.isError, true);

    const concurrentLists = await Promise.all(
      Array.from({ length: 4 }, (_, index) => postMcp(`${baseUrl}/mcp`, {
        jsonrpc: "2.0",
        id: 10 + index,
        method: "tools/list",
        params: {},
      })),
    );
    assert.ok(concurrentLists.every(({ status, payload }) => status === 200 && payload.result.tools.length === 1));

    const siteRoute = await fetch(`${baseUrl}/api/news`);
    assert.deepEqual(await siteRoute.json(), { ok: true, source: "existing-site-route" });
  });
});

test("Express adapter rejects unexpected Host headers", async () => {
  await withServer(createMcpSmokeApp(), async (baseUrl) => {
    const status = await new Promise<number>((resolve, reject) => {
      const request = httpRequest(new URL(`${baseUrl}/mcp`), {
        method: "POST",
        headers: {
          host: "attacker.example",
          "content-type": "application/json",
          accept: "application/json, text/event-stream",
        },
      }, (response) => {
        response.resume();
        response.on("end", () => resolve(response.statusCode ?? 0));
      });
      request.on("error", reject);
      request.end(JSON.stringify({ jsonrpc: "2.0", id: 1, method: "tools/list", params: {} }));
    });
    assert.equal(status, 403);
  });
});
