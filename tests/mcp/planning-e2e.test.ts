import assert from "node:assert/strict";
import { createServer as createHttpServer } from "node:http";
import { once } from "node:events";
import test from "node:test";
import express from "express";
import { mountMcpRoute } from "../../server/mcp/route";
import { GeoNamesPlaceIndex } from "../../server/places/geonames";

const protocolVersion = "2025-11-25";
const index = new GeoNamesPlaceIndex([{ geonameId: 2643743, name: "London", asciiName: "London", alternateNames: "", latitude: 51.5, longitude: -0.12, countryCode: "GB", countryName: "United Kingdom", featureClass: "P", featureCode: "PPLC", population: 8_000_000, timeZone: "Europe/London", modificationDate: "2026-10-01" }], "fixture-2026-10");

function eventPayload(body: string): Record<string, any> {
  const data = body.split("\n").find((line) => line.startsWith("data: "));
  assert.ok(data, `Expected an MCP SSE data event, got: ${body}`);
  return JSON.parse(data.slice("data: ".length));
}

async function post(url: string, body: unknown) {
  const response = await fetch(url, { method: "POST", headers: { "content-type": "application/json", accept: "application/json, text/event-stream", "mcp-protocol-version": protocolVersion }, body: JSON.stringify(body) });
  return { status: response.status, payload: eventPayload(await response.text()) };
}

test("local MCP journey resolves a named place and returns an evidence-aware plan without network calls", async () => {
  const app = express();
  app.use(express.json({ limit: "32kb" }));
  mountMcpRoute(app, {
    allowedHosts: ["127.0.0.1"],
    placeIndex: index,
    weatherProvider: { getForecast: async () => ({ status: "available", reason: "Fixture forecast returned.", forecast: {
      availability: { status: "available", reason: "Fixture values." },
      source: { name: "Fixture weather", url: "https://example.test/weather", attribution: "Deterministic fixture.", dataClass: "forecast", product: "Night sample" },
      forecastHorizonHours: 48,
      samples: [{ validAt: "2026-10-15T22:00:00Z", values: { totalCloudCover: { value: 18, unit: "%" }, windSpeed: { value: 4, unit: "m/s" } } }],
      missingFields: [{ field: "visibility", reason: "Fixture does not provide visibility." }],
    } }) },
  });
  const server = createHttpServer(app);
  server.listen(0, "127.0.0.1");
  await once(server, "listening");
  const address = server.address();
  assert.ok(address && typeof address !== "string");
  const base = `http://127.0.0.1:${address.port}/mcp`;
  try {
    const initialized = await post(base, { jsonrpc: "2.0", id: 1, method: "initialize", params: { protocolVersion, capabilities: {}, clientInfo: { name: "local-planning-test", version: "1" } } });
    assert.equal(initialized.status, 200);

    const resolved = await post(base, { jsonrpc: "2.0", id: 2, method: "tools/call", params: { name: "resolve_place", arguments: { placeQuery: "London" } } });
    assert.equal(resolved.status, 200);
    const place = resolved.payload.result.structuredContent.matches[0];
    assert.equal(place.displayName, "London, United Kingdom");

    const planned = await post(base, { jsonrpc: "2.0", id: 3, method: "tools/call", params: { name: "plan_observing_session", arguments: {
      placeId: place.placeId, activity: "meteor-shower", window: { startUtc: "2026-10-15T18:00:00Z", endUtc: "2026-10-16T06:00:00Z", timeZone: place.timeZone }, experience: "beginner",
    } } });
    assert.equal(planned.status, 200);
    assert.equal(planned.payload.result.isError, undefined);
    const result = planned.payload.result.structuredContent;
    assert.equal(result.place.placeId, place.placeId);
    assert.equal(result.availability.status, "partial");
    assert.ok(result.factors.some((factor: { name: string; assessment: string }) => /cloud/i.test(factor.name) && /18\s*%/.test(factor.assessment)));
    assert.ok(result.factors.some((factor: { name: string; assessment: string }) => factor.name === "Historical context" && /unavailable/i.test(factor.assessment)));
    assert.ok(result.factors.some((factor: { name: string; assessment: string }) => factor.name === "Nearby observing places" && /unsupported|unavailable/i.test(factor.assessment)));
    assert.ok(result.preparation.some((step: string) => /dark adaptation/i.test(step)));
    assert.ok(result.gaps.some((gap: string) => /visibility/i.test(gap)));

    const candidatePlan = await post(base, { jsonrpc: "2.0", id: 30, method: "tools/call", params: { name: "plan_observing_session", arguments: {
      placeId: "place:v1:osm:node:123", activity: "general-stargazing", window: { startUtc: "2026-10-15T18:00:00Z", endUtc: "2026-10-16T06:00:00Z", timeZone: "Europe/London" },
    } } });
    assert.equal(candidatePlan.status, 200);
    assert.equal(candidatePlan.payload.result.isError, true);
    assert.equal(candidatePlan.payload.result.structuredContent, undefined);


    const compared = await post(base, { jsonrpc: "2.0", id: 4, method: "tools/call", params: { name: "compare_observing_options", arguments: { options: [
      { placeId: place.placeId, activity: "meteor-shower", window: { startUtc: "2026-10-15T18:00:00Z", endUtc: "2026-10-16T06:00:00Z", timeZone: place.timeZone } },
      { placeId: place.placeId, activity: "astrophotography", window: { startUtc: "2026-10-15T18:00:00Z", endUtc: "2026-10-16T06:00:00Z", timeZone: place.timeZone } },
    ] } } });
    assert.equal(compared.status, 200);
    assert.equal(compared.payload.result.structuredContent.comparisons.length, 2);
    assert.ok(compared.payload.result.structuredContent.comparisons[0].sources.some((record: { name: string }) => record.name === "Fixture weather"));
  } finally {
    server.close();
    await once(server, "close");
  }
});
