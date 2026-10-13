import assert from "node:assert/strict";
import { createServer } from "node:http";
import { once } from "node:events";
import test from "node:test";
import express from "express";
import { mountMcpRoute } from "../../server/mcp/route";
import { GeoNamesPlaceIndex } from "../../server/places/geonames";
import { climateContextResultSchema } from "../../shared/nightsky/climate";

const placeId = "place:v1:geonames:2643743";
const index = new GeoNamesPlaceIndex([{ geonameId: 2643743, name: "London", asciiName: "London", alternateNames: "", latitude: 51.5, longitude: -0.12, countryCode: "GB", countryName: "United Kingdom", featureClass: "P", featureCode: "PPLC", population: 8000000, timeZone: "Europe/London", modificationDate: "2026-10-01" }], "fixture");
const history = climateContextResultSchema.parse({
  schemaVersion: 2, placeId, month: 10, timeZone: "Europe/London", dataClass: "reanalysis", historicalLabel: "historical-not-a-forecast", methodVersion: "dark-cloud-v1", sampleDefinition: "hourly-dark-time-samples", unit: "fraction",
  period: {startNight: "2025-01-01", endNight: "2025-12-31", kind: "sample-only"}, availability: {status: "partial", reason: "One-year sample only."}, caveats: [],
  sources: [{name: "Copernicus ERA5 fixture", url: "https://doi.org/10.24381/cds.adbb2d47", attribution: "Contains modified Copernicus Climate Change Service information.", dataClass: "reanalysis"}],
  grid: {mapping: "nearest-supplied-cell", cellId: "fixture", spacingDegrees: 0.25, displacementKm: 1, placeIndexVintage: "fixture"},
  summary: {expectedEligibleSamples: 10, validEligibleSamples: 10, representedYears: 1, badYearCount: 0, completeness: 1, meanCloudFraction: 0.4, thresholds: [{fraction: 0.1, count: 2, frequency: 0.2}, {fraction: 0.25, count: 4, frequency: 0.4}, {fraction: 0.5, count: 6, frequency: 0.6}]},
});

test("MCP resolve → historical samples → plan → comparison shares one offline climate service", async () => {
  let calls = 0;
  const app = express(); app.use(express.json());
  mountMcpRoute(app, {placeIndex: index, climateProvider: {getClimatology: async () => { throw new Error("Planner override must take precedence."); }}, plannerServices: {getClimatology: async (id, month) => {calls++; assert.equal(id, placeId); assert.equal(month, 10); return history;}}, weatherProvider: {getForecast: async () => ({status: "unavailable", reason: "Offline forecast fixture."})}, fetcher: async () => {throw new Error("Network forbidden.");}});
  const server = createServer(app); server.listen(0, "127.0.0.1"); await once(server, "listening");
  const address = server.address(); assert.ok(address && typeof address !== "string");
  const call = async (name: string, args: unknown) => {
    const response = await fetch(`http://127.0.0.1:${address.port}/mcp`, {method: "POST", headers: {"content-type": "application/json", accept: "application/json, text/event-stream", "mcp-protocol-version": "2025-11-25"}, body: JSON.stringify({jsonrpc: "2.0", id: calls + 1, method: "tools/call", params: {name, arguments: args}})});
    const line = (await response.text()).split("\n").find(row => row.startsWith("data: ")); assert.ok(line);
    const result = JSON.parse(line.slice(6)).result; assert.ok(result, line); assert.equal(result.isError, undefined); return result;
  };
  try {
    const resolved = await call("resolve_place", {placeQuery: "London"}); assert.equal(resolved.structuredContent.matches[0].placeId, placeId);
    const direct = await call("get_clear_sky_climatology", {placeId, month: 10}); assert.deepEqual(direct.structuredContent, history); assert.match(direct.content[0].text, /sample-only.*historical-not-a-forecast/);
    const option = {placeId, activity: "general-stargazing", window: {startUtc: "2026-10-15T18:00:00Z", endUtc: "2026-10-16T06:00:00Z", timeZone: "Europe/London"}};
    const planned = await call("plan_observing_session", option); assert.ok(planned.structuredContent.factors.some((factor: any) => factor.name === "Historical context" && /sample-only/.test(factor.assessment)));
    const compared = await call("compare_observing_options", {options: [option, {...option, activity: "astrophotography"}]}); assert.equal(compared.structuredContent.comparisons.length, 2); assert.ok(compared.structuredContent.comparisons.every((row: any) => row.sources.some((source: any) => source.dataClass === "reanalysis")));
    assert.equal(calls, 4);
  } finally {server.close(); await once(server, "close");}
});

// The reader is injected here so these transport cases cannot pick up host artifact settings.
test("MCP missing and corrupt climate artifacts fail closed with useful unavailable output", async () => {
  const { createEra5ClimateProvider } = await import("../../server/providers/climate/era5");
  const { mkdtemp, writeFile, rm } = await import("node:fs/promises");
  const { tmpdir } = await import("node:os");
  const { join } = await import("node:path");
  const directory = await mkdtemp(join(tmpdir(), "nightsky-mcp-climate-"));
  const corrupt = join(directory, "corrupt.json"); await writeFile(corrupt, "invalid artifact");
  try {
    for (const artifactPath of [undefined, corrupt]) {
      const app = express(); app.use(express.json());
      mountMcpRoute(app, {placeIndex: index, climateProvider: createEra5ClimateProvider({index, artifactPath, expectedSha256: "0".repeat(64)})});
      const server = createServer(app); server.listen(0, "127.0.0.1"); await once(server, "listening");
      const address = server.address(); assert.ok(address && typeof address !== "string");
      try {
        const invoke = async (month: number, extra = {}) => {
          const response = await fetch(`http://127.0.0.1:${address.port}/mcp`, {method: "POST", headers: {"content-type": "application/json", accept: "application/json, text/event-stream", "mcp-protocol-version": "2025-11-25"}, body: JSON.stringify({jsonrpc: "2.0", id: month, method: "tools/call", params: {name: "get_clear_sky_climatology", arguments: {placeId, month, ...extra}}})});
          const line = (await response.text()).split("\n").find(row => row.startsWith("data: ")); assert.ok(line); return JSON.parse(line.slice(6));
        };
        for (let repeat = 0; repeat < 2; repeat++) {
          const response = await invoke(10); assert.equal(response.result.isError, undefined);
          const result = climateContextResultSchema.parse(response.result.structuredContent); assert.equal(result.availability.status, "unavailable"); assert.ok(result.availability.reason.length > 10); assert.equal(result.summary, undefined); assert.equal(result.bins, undefined); assert.match(response.result.content[0].text, /No numeric cloud statistic/);
        }
        const badMonth = await invoke(13); assert.ok(badMonth.error || badMonth.result?.isError);
        const extraInput = await invoke(10, {latitude: 51.5}); assert.ok(extraInput.error || extraInput.result?.isError);
      } finally {server.close(); await once(server, "close");}
    }
  } finally {await rm(directory, {recursive: true, force: true});}
});
