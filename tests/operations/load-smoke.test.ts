import assert from "node:assert/strict";
import { once } from "node:events";
import { createServer } from "node:http";
import { performance } from "node:perf_hooks";
import test from "node:test";
import express from "express";
import { mountMcpRoute } from "../../server/mcp/route";
import { GeoNamesPlaceIndex } from "../../server/places/geonames";
import { parseOvationAurora } from "../../server/providers/aurora/noaaSwpc";

const initialize = JSON.stringify({ jsonrpc: "2.0", id: 1, method: "initialize", params: {
  protocolVersion: "2025-11-25", capabilities: {}, clientInfo: { name: "offline-load", version: "1" },
} });

test("bounded offline MCP load enforces global ceiling and recovers next window", async (t) => {
  const app = express();
  app.use(express.json({ limit: "32kb" }));
  mountMcpRoute(app, { maxGlobalRequestsPerWindow: 8, maxRequestsPerWindow: 100, maxConcurrentRequests: 4, rateWindowMs: 1500 });
  const server = createServer(app).listen(0, "127.0.0.1");
  await once(server, "listening");
  const address = server.address();
  assert.ok(address && typeof address !== "string");
  const url = `http://127.0.0.1:${address.port}/mcp`;
  const samples: number[] = [];
  const statuses: number[] = [];
  const start = performance.now();
  const post = async () => {
    const before = performance.now();
    const response = await fetch(url, { method: "POST", headers: { "content-type": "application/json", accept: "application/json, text/event-stream" }, body: initialize });
    await response.text();
    samples.push(performance.now() - before);
    statuses.push(response.status);
    return response;
  };
  try {
    for (let wave = 0; wave < 5; wave++) await Promise.all(Array.from({ length: 4 }, post));
    assert.equal(statuses.filter((status) => status === 200).length, 8);
    assert.equal(statuses.filter((status) => status === 429).length, 12);
    const durationMs = performance.now() - start;
    samples.sort((a, b) => a - b);
    t.diagnostic(JSON.stringify({ environment: "local offline; not target capacity", mix: "20 MCP initialize", concurrency: 4, durationMs: Math.round(durationMs), throughputPerSecond: Math.round(20_000 / durationMs), p50Ms: Math.round(samples[9]!), p95Ms: Math.round(samples[18]!), rssBytes: process.memoryUsage().rss, successes: 8, expectedRejections: 12, unexpectedErrors: 0 }));
    await new Promise((resolve) => setTimeout(resolve, 1550));
    assert.equal((await post()).status, 200, "global window and concurrency slots recover");
  } finally { server.closeAllConnections(); server.close(); await once(server, "close"); }
});

test("invalid MCP control values fail during mounting", () => {
  for (const value of [0, -1, NaN, Infinity, 1.5]) {
    assert.throws(() => mountMcpRoute(express(), { maxGlobalRequestsPerWindow: value }), /positive safe integers/);
  }
});

test("delayed fixture tool occupies concurrency slot until release, then admission recovers", { timeout: 5000 }, async () => {
  let signalEntered!: () => void;
  let release!: () => void;
  const entered = new Promise<void>((resolve) => { signalEntered = resolve; });
  const blocked = new Promise<void>((resolve) => { release = resolve; });
  const app = express();
  app.use(express.json({ limit: "32kb" }));
  const placeIndex = new GeoNamesPlaceIndex([[1259229, "Pune", "Pune", "", 18.52, 73.85, "IN", "India", 1_000_000, "Asia/Kolkata"]], "offline fixture");
  mountMcpRoute(app, {
    placeIndex, maxConcurrentRequests: 1,
    auroraProvider: async (place, window) => {
      signalEntered();
      await blocked;
      return parseOvationAurora({ "Observation Time": "2026-10-11T08:57:00Z", "Forecast Time": "2026-10-11T09:46:00Z", "Data Format": "[Longitude, Latitude, Aurora]", type: "MultiPoint", coordinates: [[74, 19, 0]] }, place, window, "2026-10-11T09:00:00Z");
    },
  });
  const server = createServer(app).listen(0, "127.0.0.1");
  await once(server, "listening");
  const address = server.address();
  assert.ok(address && typeof address !== "string");
  const url = `http://127.0.0.1:${address.port}/mcp`;
  const post = (body: string) => fetch(url, { method: "POST", headers: { "content-type": "application/json", accept: "application/json, text/event-stream", "mcp-protocol-version": "2025-11-25" }, body });
  try {
    const pending = post(JSON.stringify({ jsonrpc: "2.0", id: 2, method: "tools/call", params: {
      name: "get_aurora_outlook", arguments: { placeId: "place:v1:geonames:1259229", window: { startUtc: "2026-10-11T08:00:00Z", endUtc: "2026-10-11T10:00:00Z", timeZone: "Asia/Kolkata" } },
    } }));
    await entered;
    const rejected = await post(initialize);
    assert.equal(rejected.status, 503, "fixture tool still owns the single concurrency slot");
    assert.match(await rejected.text(), /busy/);
    release();
    const completed = await pending;
    assert.equal(completed.status, 200);
    const text = await completed.text();
    assert.doesNotMatch(text, /"isError":true/, "fixture tool completes successfully");
    const recovered = await post(initialize);
    assert.equal(recovered.status, 200, "slot is released after tool completion");
    await recovered.text();
  } finally { release(); server.closeAllConnections(); server.close(); await once(server, "close"); }
});
