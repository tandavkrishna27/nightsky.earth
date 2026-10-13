import assert from "node:assert/strict";
import { createServer } from "node:http";
import { once } from "node:events";
import test from "node:test";
import express from "express";
import { mountMcpRoute } from "../../server/mcp/route";
import { GeoNamesPlaceIndex } from "../../server/places/geonames";
import { UpstreamControls } from "../../server/providers/upstreamControls";
import { astronomyWindowResultSchema, targetVisibilityResultSchema } from "../../shared/nightsky/astronomy";

test("MCP direct weather, composed planning and aurora share one upstream budget", async () => {
  const index = new GeoNamesPlaceIndex([{ geonameId: 2643743, name: "London", asciiName: "London", alternateNames: "", latitude: 51.5, longitude: -0.12, countryCode: "GB", countryName: "United Kingdom", featureClass: "P", featureCode: "PPLC", population: 8_000_000, timeZone: "Europe/London", modificationDate: "2026-10-01" }], "fixture");
  const window = { startUtc: "2026-10-15T18:00:00Z", endUtc: "2026-10-16T06:00:00Z", timeZone: "Europe/London" };
  let upstreamCalls = 0;
  const app = express();
  app.use(express.json({ limit: "32kb" }));
  mountMcpRoute(app, {
    placeIndex: index,
    weatherUserAgent: "NightSky fixture https://example.test/contact",
    upstreamControls: new UpstreamControls({ globalCallsPerMinute: 1 }),
    cache: { get: async <T>() => undefined, set: async <T>() => {} },
    fetcher: async (url) => {
      upstreamCalls++;
      if (String(url).includes("swpc.noaa.gov")) return new Response(JSON.stringify({
        "Observation Time": "2026-10-15T18:00:00Z", "Forecast Time": "2026-10-15T18:30:00Z",
        "Data Format": "[Longitude, Latitude, Aurora]", type: "MultiPoint", coordinates: [[0, 52, 10]],
      }));
      return new Response(JSON.stringify({ properties: {
        meta: { updated_at: "2026-10-15T12:00:00Z" },
        timeseries: [{ time: "2026-10-15T22:00:00Z", data: { instant: { details: { cloud_area_fraction: 20 } } } }],
      } }));
    },
  });
  const server = createServer(app);
  server.listen(0, "127.0.0.1");
  await once(server, "listening");
  const address = server.address();
  assert.ok(address && typeof address !== "string");
  let id = 0;
  const call = async (name: string, args: unknown) => {
    const response = await fetch(`http://127.0.0.1:${address.port}/mcp`, {
      method: "POST", headers: { "content-type": "application/json", accept: "application/json, text/event-stream", "mcp-protocol-version": "2025-11-25" },
      body: JSON.stringify({ jsonrpc: "2.0", id: ++id, method: "tools/call", params: { name, arguments: args } }),
    });
    assert.equal(response.status, 200);
    const data = (await response.text()).split("\n").find(line => line.startsWith("data: "));
    assert.ok(data);
    const result = JSON.parse(data.slice(6)).result;
    assert.equal(result.isError, undefined, JSON.stringify(result));
    return result.structuredContent;
  };
  try {
    const args = { placeId: "place:v1:geonames:2643743", window };
    const astronomy = await call("get_astronomy_window", args);
    assert.equal(astronomyWindowResultSchema.safeParse(astronomy).success, true);
    const target = await call("get_target_visibility", { ...args, targetQuery: "Jupiter" });
    assert.equal(targetVisibilityResultSchema.safeParse(target).success, true);
    const weather = await call("get_night_conditions", args);
    assert.equal(weather.forecasts.length, 1);
    const plan = await call("plan_observing_session", { ...args, activity: "general-stargazing" });
    assert.ok(plan.gaps.some((gap: string) => /forecast|weather/i.test(gap)));
    const aurora = await call("get_aurora_outlook", args);
    assert.equal(aurora.availability.status, "unavailable");
    const comparison = await call("compare_observing_options", { options: [
      { ...args, activity: "general-stargazing" }, { ...args, activity: "astrophotography" },
    ] });
    assert.equal(comparison.comparisons.length, 2);
    assert.equal(upstreamCalls, 1, "the same budget must survive separate stateless MCP requests and provider types");
  } finally {
    server.close();
    await once(server, "close");
  }
});
