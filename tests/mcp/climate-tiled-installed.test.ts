import assert from "node:assert/strict";
import { access } from "node:fs/promises";
import { resolve } from "node:path";
import { createServer } from "node:http";
import { once } from "node:events";
import test from "node:test";
import express from "express";
import { loadGeoNamesPlaceIndex } from "../../server/places/geonames";
import { createEra5ClimateProvider } from "../../server/providers/climate/era5";
import { mountMcpRoute } from "../../server/mcp/route";

test("installed tiled history reproduces all 36 real months through MCP and composed plans", async t => {
  const input = resolve(".data/era5/pilot-2025/full-year-sample.json");
  const manifest = resolve(".data/era5/tiles-2025-v3/manifest.json");
  try { await access(input); await access(manifest); } catch { t.skip("Reviewed ignored legacy/tiled source artifacts are not installed."); return; }
  const index = await loadGeoNamesPlaceIndex();
  assert.ok(index);
  const original = createEra5ClimateProvider({ index, artifactPath: input, expectedSha256: "0ac43235fa7c0585d87a4e821e25d0bb9c799a1042f329a411923a4fa0dc2580" });
  const tiled = createEra5ClimateProvider({ index, artifactPath: manifest, expectedSha256: "9ffc58e9033984b235241525471d4e5b6571a6f1640147502b57d014c31181e8" });
  const app = express(); app.use(express.json());
  mountMcpRoute(app, { placeIndex: index, climateProvider: tiled, weatherProvider: { getForecast: async () => ({ status: "unavailable", reason: "Explicit offline weather fixture." }) } });
  const server = createServer(app).listen(0, "127.0.0.1");
  await once(server, "listening");
  const address = server.address(); assert.ok(address && typeof address !== "string");
  let id = 0;
  async function call(name: string, args: unknown) {
    const response = await fetch(`http://127.0.0.1:${(address as { port: number }).port}/mcp`, { method: "POST", headers: { "content-type": "application/json", accept: "application/json, text/event-stream", "mcp-protocol-version": "2025-11-25" }, body: JSON.stringify({ jsonrpc: "2.0", id: ++id, method: "tools/call", params: { name, arguments: args } }) });
    assert.equal(response.status, 200);
    const line = (await response.text()).split("\n").find(value => value.startsWith("data: ")); assert.ok(line);
    const result = JSON.parse(line.slice(6)).result; assert.equal(result?.isError, undefined);
    assert.ok(result?.structuredContent); return result.structuredContent;
  }
  try {
    const options = [];
    for (const numericId of [1270426, 1266425, 1262463]) {
      const placeId = `place:v1:geonames:${numericId}`;
      for (let month = 1; month <= 12; month++) {
        const actual = await call("get_clear_sky_climatology", { placeId, month });
        const expected = await original.getClimatology(placeId, month);
        assert.equal(actual.availability.status, "partial");
        for (const key of ["summary", "bins", "period", "sources", "timeZone"] as const) assert.deepEqual(actual[key], expected[key], `${numericId}/${month}/${key}`);
      }
      const option = { placeId, activity: "general-stargazing", window: { startUtc: "2026-01-15T14:00:00Z", endUtc: "2026-01-16T00:00:00Z", timeZone: "Asia/Kolkata" } };
      const plan = await call("plan_observing_session", option);
      assert.equal(plan.evidence.history.period.kind, "sample-only");
      assert.equal(plan.evidence.history.availability.status, "partial");
      options.push(option);
    }
    const comparison = await call("compare_observing_options", { options });
    assert.equal(comparison.comparisons.length, 3);
    for (const row of comparison.comparisons) assert.equal(row.evidence.history.period.kind, "sample-only");
  } finally { server.closeAllConnections(); await new Promise<void>(done => server.close(() => done())); }
});
