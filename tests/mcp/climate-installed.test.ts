import assert from "node:assert/strict";
import { createServer } from "node:http";
import { once } from "node:events";
import { access } from "node:fs/promises";
import { resolve } from "node:path";
import test from "node:test";
import express from "express";
import { mountMcpRoute } from "../../server/mcp/route";
import { loadGeoNamesPlaceIndex } from "../../server/places/geonames";
import { createEra5ClimateProvider } from "../../server/providers/climate/era5";

const artifactPath = resolve(".data/era5/pilot-2025/full-year-sample.json");
const expectedSha256 = "0ac43235fa7c0585d87a4e821e25d0bb9c799a1042f329a411923a4fa0dc2580";

test("installed reviewed 2025 sample follows the real MCP history → plan → compare journey", async (t) => {
  try { await access(artifactPath); } catch { t.skip("Ignored reviewed historical artifact is not installed."); return; }
  const index = await loadGeoNamesPlaceIndex();
  assert.ok(index);
  const app = express();
  app.use(express.json());
  // Source data is real; the weather provider deliberately remains an offline fixture.
  mountMcpRoute(app, {
    placeIndex: index,
    climateProvider: createEra5ClimateProvider({ index, artifactPath, expectedSha256 }),
    weatherProvider: { getForecast: async () => ({ status: "unavailable", reason: "Offline fixture: no live forecast requested." }) },
  });
  const server = createServer(app);
  server.listen(0, "127.0.0.1");
  await once(server, "listening");
  const address = server.address();
  assert.ok(address && typeof address !== "string");
  let id = 0;
  async function call(name: string, args: unknown) {
    const response = await fetch(`http://127.0.0.1:${(address as { port: number }).port}/mcp`, {
      method: "POST", headers: { "content-type": "application/json", accept: "application/json, text/event-stream", "mcp-protocol-version": "2025-11-25" },
      body: JSON.stringify({ jsonrpc: "2.0", id: ++id, method: "tools/call", params: { name, arguments: args } }),
    });
    assert.equal(response.status, 200);
    const line = (await response.text()).split("\n").find(value => value.startsWith("data: "));
    assert.ok(line);
    const payload = JSON.parse(line.slice(6));
    assert.equal(payload.result?.isError, undefined, JSON.stringify(payload));
    assert.ok(payload.result?.structuredContent, JSON.stringify(payload));
    return payload.result.structuredContent;
  }
  try {
    const options = [];
    for (const [name, placeId, expected] of [["Hanle", "1270426", 341], ["Kodaikanal", "1266425", 294], ["Munnar", "1262463", 299]] as const) {
      const resolved = await call("resolve_place", { placeQuery: name });
      const place = resolved.matches.find((value: { placeId: string }) => value.placeId === `place:v1:geonames:${placeId}`);
      assert.ok(place, name);
      const history = await call("get_clear_sky_climatology", { placeId: place.placeId, month: 1 });
      assert.equal(history.availability.status, "partial");
      assert.equal(history.period.kind, "sample-only");
      assert.equal(history.summary.validEligibleSamples, expected);
      assert.equal(history.summary.expectedEligibleSamples, expected);
      const option = { placeId: place.placeId, activity: "meteor-shower", window: { startUtc: "2026-01-15T14:00:00Z", endUtc: "2026-01-16T00:00:00Z", timeZone: place.timeZone } };
      const plan = await call("plan_observing_session", option);
      assert.ok(plan.factors.some((factor: { name: string; assessment: string }) => factor.name === "Historical context" && /sample-only/.test(factor.assessment)));
      assert.ok(plan.sources.some((source: { dataClass: string }) => source.dataClass === "reanalysis"));
      options.push(option);
    }
    const compared = await call("compare_observing_options", { options });
    assert.equal(compared.comparisons.length, 3);
    for (const row of compared.comparisons) assert.ok(row.factors.some((factor: { name: string; assessment: string }) => factor.name === "Historical context" && /sample-only/.test(factor.assessment)));
  } finally {
    server.close();
    await once(server, "close");
  }
});
