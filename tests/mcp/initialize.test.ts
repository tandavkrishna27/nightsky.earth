import assert from "node:assert/strict";
import { createServer as createHttpServer } from "node:http";
import { once } from "node:events";
import test from "node:test";
import express from "express";
import { mountMcpRoute } from "../../server/mcp/route";
import { GeoNamesPlaceIndex } from "../../server/places/geonames";
import { parseOvationAurora } from "../../server/providers/aurora/noaaSwpc";

const protocolVersion = "2025-11-25";

async function post(url: string, body: unknown) {
  const response = await fetch(url, { method: "POST", headers: { "content-type": "application/json", accept: "application/json, text/event-stream", "mcp-protocol-version": protocolVersion }, body: JSON.stringify(body) });
  const text = await response.text();
  const data = text.split("\n").find((line) => line.startsWith("data: "));
  return { status: response.status, payload: data ? JSON.parse(data.slice(6)) : text };
}

test("NightSky MCP initializes and lists completed domain tools", async () => {
  const app = express();
  app.use(express.json({ limit: "32kb" }));
  mountMcpRoute(app, { allowedHosts: ["127.0.0.1"] });
  const server = createHttpServer(app);
  server.listen(0, "127.0.0.1");
  await once(server, "listening");
  const address = server.address();
  assert.ok(address && typeof address !== "string");
  const base = `http://127.0.0.1:${address.port}/mcp`;
  try {
    const init = await post(base, { jsonrpc: "2.0", id: 1, method: "initialize", params: { protocolVersion, capabilities: {}, clientInfo: { name: "test", version: "1" } } });
    assert.equal(init.status, 200);
    assert.equal(init.payload.result.serverInfo.name, "nightsky-earth");
    const listed = await post(base, { jsonrpc: "2.0", id: 2, method: "tools/list", params: {} });
    assert.deepEqual(listed.payload.result.tools.map((tool: { name: string }) => tool.name), ["resolve_place", "get_astronomy_window", "get_target_visibility", "get_night_conditions", "get_aurora_outlook", "search_sky_events", "search_observing_locations", "resolve_observing_region", "get_observing_location_details", "get_location_context", "get_clear_sky_climatology", "plan_observing_session", "compare_observing_options", "recommend_specialist_tools"]);
  } finally {
    server.close();
    await once(server, "close");
  }
});

test("recommend_specialist_tools returns source-linked structured recommendations", async () => {
  const app = express();
  app.use(express.json({ limit: "32kb" }));
  mountMcpRoute(app, { allowedHosts: ["127.0.0.1"] });
  const server = createHttpServer(app);
  server.listen(0, "127.0.0.1");
  await once(server, "listening");
  const address = server.address();
  assert.ok(address && typeof address !== "string");
  const base = `http://127.0.0.1:${address.port}/mcp`;
  try {
    await post(base, { jsonrpc: "2.0", id: 1, method: "initialize", params: { protocolVersion, capabilities: {}, clientInfo: { name: "test", version: "1" } } });
    const response = await post(base, { jsonrpc: "2.0", id: 2, method: "tools/call", params: { name: "recommend_specialist_tools", arguments: { activity: "astrophotography" } } });
    const result = response.payload.result.structuredContent;
    assert.ok(result.recommendations.some((item: { name: string }) => item.name === "PhotoPills"));
    assert.ok(result.sources.every((source: { url: string }) => source.url.startsWith("https://")));
    assert.equal(result.recommendations.find((item: { name: string }) => item.name === "SkySafari")?.pricing, "paid");
    assert.equal(result.recommendations.find((item: { name: string }) => item.name === "Light Pollution Map")?.pricing, "unknown");
  } finally {
    server.close();
    await once(server, "close");
  }
});

test("resolve_place is registered with attribution and validated structured output", async () => {
  const index = new GeoNamesPlaceIndex([{
    geonameId: 1880252, name: "Pune", asciiName: "Pune", alternateNames: "Poona",
    latitude: 18.5204, longitude: 73.8567, countryCode: "IN", countryName: "India",
    featureClass: "P", featureCode: "PPL", population: 100_000,
    timeZone: "Asia/Kolkata", modificationDate: "2026-10-01",
  }], "geonames-cities500-test");
  const app = express();
  app.use(express.json({ limit: "32kb" }));
  mountMcpRoute(app, { allowedHosts: ["127.0.0.1"], placeIndex: index });
  const server = createHttpServer(app);
  server.listen(0, "127.0.0.1");
  await once(server, "listening");
  const address = server.address();
  assert.ok(address && typeof address !== "string");
  const base = `http://127.0.0.1:${address.port}/mcp`;
  try {
    await post(base, { jsonrpc: "2.0", id: 1, method: "initialize", params: { protocolVersion, capabilities: {}, clientInfo: { name: "test", version: "1" } } });
    const listed = await post(base, { jsonrpc: "2.0", id: 2, method: "tools/list", params: {} });
    assert.deepEqual(listed.payload.result.tools.map((tool: { name: string }) => tool.name), ["resolve_place", "get_astronomy_window", "get_target_visibility", "get_night_conditions", "get_aurora_outlook", "search_sky_events", "search_observing_locations", "resolve_observing_region", "get_observing_location_details", "get_location_context", "get_clear_sky_climatology", "plan_observing_session", "compare_observing_options", "recommend_specialist_tools"]);
    const call = await post(base, { jsonrpc: "2.0", id: 3, method: "tools/call", params: { name: "resolve_place", arguments: { placeQuery: "Pune" } } });
    const result = call.payload.result;
    assert.equal(result.structuredContent.matches[0].displayName, "Pune, India");
    assert.ok(result.structuredContent.sources[0].attribution.includes("CC BY 4.0"));
    assert.match(result.content[0].text, /GeoNames \(CC BY 4.0/);
    const invalid = await post(base, { jsonrpc: "2.0", id: 4, method: "tools/call", params: { name: "resolve_place", arguments: { placeQuery: "18.5204,73.8567" } } });
    assert.equal(invalid.payload.result.isError, true);
  } finally {
    server.close();
    await once(server, "close");
  }
});

test("astronomy MCP tools return schema-valid structured calculations", async () => {
  const index = new GeoNamesPlaceIndex([{
    geonameId: 1880252, name: "Pune", asciiName: "Pune", alternateNames: "",
    latitude: 18.5204, longitude: 73.8567, countryCode: "IN", countryName: "India",
    featureClass: "P", featureCode: "PPL", population: 100_000,
    timeZone: "Asia/Kolkata", modificationDate: "2026-10-01",
  }], "geonames-cities500-test");
  const auroraFixture = { "Observation Time": "2026-10-11T08:57:00Z", "Forecast Time": "2026-10-11T09:46:00Z", "Data Format": "[Longitude, Latitude, Aurora]", type: "MultiPoint", coordinates: [[74, 18, 0]] };
  const app = express(); app.use(express.json({ limit: "32kb" })); mountMcpRoute(app, { allowedHosts: ["127.0.0.1"], placeIndex: index, weatherProvider: { getForecast: async () => ({ status: "available", reason: "Fixture forecast available.", forecast: { availability: { status: "available", reason: "Fixture forecast available." }, source: { name: "MET Norway", url: "https://api.met.no/weatherapi/locationforecast/2.0/documentation", attribution: "Weather forecast from MET Norway, licensed under CC BY 4.0.", dataClass: "forecast", product: "Locationforecast 2.0", licenseUrl: "https://creativecommons.org/licenses/by/4.0/", issuedAt: "2026-10-11T00:00:00.000Z", validStartUtc: "2026-10-11T18:00:00.000Z", validEndUtc: "2026-10-11T18:00:00.000Z" }, forecastHorizonHours: 18, samples: [{ validAt: "2026-10-11T18:00:00.000Z", values: { totalCloudCover: { value: 25, unit: "%" } } }], missingFields: [] } }) }, auroraProvider: async (place, window) => parseOvationAurora(auroraFixture, place, window, "2026-10-11T09:00:00Z") });
  const server = createHttpServer(app); server.listen(0, "127.0.0.1"); await once(server, "listening");
  const address = server.address(); assert.ok(address && typeof address !== "string"); const base = `http://127.0.0.1:${address.port}/mcp`;
  const placeId = "place:v1:geonames:1880252";
  try {
    await post(base, { jsonrpc: "2.0", id: 1, method: "initialize", params: { protocolVersion, capabilities: {}, clientInfo: { name: "test", version: "1" } } });
    const args = { placeId, window: { startUtc: "2026-10-11T00:00:00Z", endUtc: "2026-10-12T00:00:00Z", timeZone: "Asia/Kolkata" } };
    const astro = await post(base, { jsonrpc: "2.0", id: 2, method: "tools/call", params: { name: "get_astronomy_window", arguments: args } });
    assert.equal(astro.payload.result.structuredContent.placeId, placeId);
    assert.ok(astro.payload.result.structuredContent.sources[0].vintage.includes("2.1.19"));
    const target = await post(base, { jsonrpc: "2.0", id: 3, method: "tools/call", params: { name: "get_target_visibility", arguments: { ...args, targetQuery: "Jupiter" } } });
    assert.equal(target.payload.result.structuredContent.target.name, "Jupiter");
    assert.ok(target.payload.result.structuredContent.intervals.length > 0);
    const events = await post(base, { jsonrpc: "2.0", id: 4, method: "tools/call", params: { name: "search_sky_events", arguments: { placeId, window: { startUtc: "2026-10-01T00:00:00Z", endUtc: "2026-11-10T00:00:00Z", timeZone: "Asia/Kolkata" }, eventTypes: ["meteor-shower"] } } });
    assert.equal(events.payload.result.structuredContent.availability.status, "partial");
    const reviewedPeak = events.payload.result.structuredContent.events.find((event: { name: string }) => event.name === "October Draconids");
    assert.equal(reviewedPeak?.peakUtc, "2026-10-09T02:10:00Z");
    assert.equal(reviewedPeak?.activityCalendarDateWindow, undefined);
    assert.deepEqual(events.payload.result.structuredContent.meteorCalendarGuidance.entries.map((row: { sourceWording: string }) => row.sourceWording), ["early May", "late October", "December", "April", "August", "around Nov. 17 or 18", "early-January", "late September and early October", "on or near June 8th", "late July", "October", "middle and late November", "October and early November", "December", "early November", "end of July", "December", "first half of June"]);
    assert.equal(events.payload.result.structuredContent.meteorCalendarGuidance.entries[1].requestedWindowOverlap, "not-evaluated");
    assert.match(events.payload.result.structuredContent.availability.reason, /18 approximate verbal calendar periods/);
    const weather = await post(base, { jsonrpc: "2.0", id: 5, method: "tools/call", params: { name: "get_night_conditions", arguments: args } });
    assert.equal(weather.payload.result.structuredContent.availability.status, "available");
    assert.equal(weather.payload.result.structuredContent.nightContext.moonIlluminationPercent >= 0, true);
    assert.ok(weather.payload.result.structuredContent.nightContext.forecastStepsDuringDarkness[0].validTimesUtc.includes("2026-10-11T18:00:00.000Z"));
    const aurora = await post(base, { jsonrpc: "2.0", id: 6, method: "tools/call", params: { name: "get_aurora_outlook", arguments: args } });
    assert.equal(aurora.payload.result.structuredContent.outlook.status, "available");
  } finally { server.close(); await once(server, "close"); }
});
