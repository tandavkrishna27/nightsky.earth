import assert from "node:assert/strict";
import { createServer } from "node:http";
import { once } from "node:events";
import { fileURLToPath } from "node:url";
import test from "node:test";
import express from "express";
import { GeoNamesPlaceIndex } from "../../server/places/geonames";
import { loadOsmCandidateIndex } from "../../server/places/osmCandidates";
import { mountMcpRoute } from "../../server/mcp/route";

test("regional source artifact composes named-place discovery, partial plans and exact reviewed meteor peaks through MCP", async () => {
  const cities = [
    { geonameId: 1277333, name: "Bengaluru", latitude: 12.97194, longitude: 77.59369 },
    { geonameId: 1253993, name: "Udagamandalam", latitude: 11.4134, longitude: 76.69521 },
    { geonameId: 1273874, name: "Kochi", latitude: 9.93988, longitude: 76.26022 },
    { geonameId: 1264527, name: "Chennai", latitude: 13.08784, longitude: 80.27847 },
  ];
  const index = new GeoNamesPlaceIndex(cities.map(city => ({ ...city, asciiName: city.name, alternateNames: "", countryCode: "IN", countryName: "India", featureClass: "P", featureCode: "PPL", population: 0, timeZone: "Asia/Kolkata", modificationDate: "2026-10-14" })), "regional-city-reference-fixture");
  const candidates = await loadOsmCandidateIndex(fileURLToPath(new URL("../osm/fixtures/real-regional-wave/candidates.json", import.meta.url)), {
    maxArtifactBytes: 4 * 1024 * 1024,
    expectedSha256: "e542a89ac7094acbd02f18dd7ea559001e21a4778214379b08839e1e553265ef",
  });
  assert.equal(candidates?.candidates.length, 1327);
  const app = express(); app.use(express.json({ limit: "32kb" }));
  mountMcpRoute(app, { allowedHosts: ["127.0.0.1"], placeIndex: index, osmCandidateIndex: candidates,
    weatherProvider: { getForecast: async () => ({ status: "unavailable", reason: "Offline transport fixture: no weather source calls." }) } });
  const server = createServer(app); server.listen(0, "127.0.0.1"); await once(server, "listening");
  const address = server.address(); assert.ok(address && typeof address !== "string"); let id = 0;
  async function request(method: string, params: unknown) {
    const response = await fetch(`http://127.0.0.1:${address.port}/mcp`, { method: "POST", headers: { "content-type": "application/json", accept: "application/json, text/event-stream", "mcp-protocol-version": "2025-11-25" }, body: JSON.stringify({ jsonrpc: "2.0", id: ++id, method, params }) });
    assert.equal(response.status, 200);
    const line = (await response.text()).split("\n").find(row => row.startsWith("data: ")); assert.ok(line);
    const payload = JSON.parse(line.slice(6)); assert.equal(payload.error, undefined);
    assert.equal(payload.result.isError, undefined, JSON.stringify(payload.result)); return payload.result.structuredContent;
  }
  const call = (name: string, args: unknown) => request("tools/call", { name, arguments: args });
  try {
    await request("initialize", { protocolVersion: "2025-11-25", capabilities: {}, clientInfo: { name: "regional-data-fixture", version: "1" } });
    const options = []; let sawWay = false;
    for (const city of cities) {
      const resolved = await call("resolve_place", { placeQuery: `${city.name}, India` });
      const place = resolved.matches[0]; assert.equal(place.placeId, `place:v1:geonames:${city.geonameId}`);
      const found = await call("search_observing_locations", { placeId: place.placeId, radiusKm: 50, limit: 10 });
      assert.ok(found.candidates.length > 0); assert.match(found.coverage, /bounding-box centers/);
      for (const candidate of found.candidates) {
        assert.equal(candidate.accessEvidence.status, "unknown");
        if (candidate.navigationUrl.includes("/way/")) { sawWay = true; assert.ok(candidate.caveats.some((caveat: string) => /entrance is unknown/.test(caveat))); }
      }
      const input = { placeId: place.placeId, window: { startUtc: "2026-12-14T12:30:00Z", endUtc: "2026-12-15T00:30:00Z", timeZone: "Asia/Kolkata" }, activity: "meteor-shower", target: "Geminids" };
      const plan = await call("plan_observing_session", input);
      assert.equal(plan.place.placeId, place.placeId); assert.equal(plan.availability.status, "partial");
      assert.equal(plan.evidence.meteorRadiantSamples.length, 49);
      assert.equal(plan.evidence.meteorRadiantSamples[0].evaluatedAt, "2026-12-14T12:30:00.000Z");
      assert.equal(plan.evidence.meteorRadiantSamples.at(-1).evaluatedAt, "2026-12-15T00:30:00.000Z");
      assert.ok(plan.factors.some((factor: { name: string }) => factor.name === "Nearby observing places"));
      options.push(input);
    }
    assert.ok(sawWay);
    const events = await call("search_sky_events", { placeId: options[0]!.placeId, window: { startUtc: "2026-12-14T12:00:00Z", endUtc: "2026-12-14T14:00:00Z", timeZone: "Asia/Kolkata" }, eventTypes: ["meteor-shower"] });
    assert.equal(events.availability.status, "partial"); assert.equal(events.events[0].peakUtc, "2026-12-14T13:00:00Z");
    assert.equal(events.events[0].activityCalendarDateWindow, undefined);
    const previousYear = await call("search_sky_events", { placeId: options[0]!.placeId, window: { startUtc: "2025-12-14T06:00:00Z", endUtc: "2025-12-14T08:00:00Z", timeZone: "Asia/Kolkata" }, eventTypes: ["meteor-shower"] });
    assert.equal(previousYear.events[0].peakUtc, "2025-12-14T06:55:00Z");
    assert.match(previousYear.events[0].source.url, /20240012381/);
    assert.match(previousYear.events[0].source.vintage, /NASA-MEO-2025/);
    assert.equal(previousYear.events[0].activityCalendarDateWindow, undefined);
    const cap = await call("plan_observing_session", { placeId: options[0]!.placeId, activity: "meteor-shower", target: "Alpha Capricornids", window: { startUtc: "2026-07-31T04:00:00Z", endUtc: "2026-07-31T12:00:00Z", timeZone: "Asia/Kolkata" } });
    assert.equal(cap.evidence.events.events[0].peakUtc, "2026-07-31T04:30:00Z");
    assert.ok(cap.evidence.meteorRadiantSamples.every((sample: { status: string; code: string }) => sample.status === "available" && sample.code === "CAP"));
    assert.equal(cap.availability.status, "partial");
    const comparison = await call("compare_observing_options", { options });
    assert.equal(comparison.comparisons.length, 4);
    assert.ok(comparison.comparisons.every((row: { availability: { status: string } }) => row.availability.status === "partial"));
  } finally { server.close(); await once(server, "close"); }
});
