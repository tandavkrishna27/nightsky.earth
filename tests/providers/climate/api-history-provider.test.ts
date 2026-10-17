import assert from "node:assert/strict";
import test from "node:test";
import { planApiHistory } from "../../../server/providers/climate/apiHistoryPlan";
import { syntheticApiCacheBytes } from "./api-history-fixtures";
import { climateContextResultSchema } from "../../../shared/nightsky/climate";

const point = { placeId: "place:v1:api:geonames:1111111111111111111111111111111111111111111111111111111111111111", name: "Synthetic point", latitude: 28.51, longitude: 77.24, displayTimeZone: "Asia/Kolkata", timeZoneBasis: "explicit-display" as const, sourceRevision: "a".repeat(64), sources: [{ name: "Synthetic", url: "https://example.com", attribution: "Synthetic", dataClass: "context" as const }] };
const admission = { sourceId: "open-meteo-hosted-era5-cloud-percent-v1" as const, methodVersion: "open-meteo-quantized-dark-cloud-v1" as const, policyRevision: "b".repeat(64), acceptsQuantizationAndUnverifiedRevision: true as const };

test("cache serving requires explicit hosted qualification and preserves selected point revision", async () => {
  const api = await import("../../../server/providers/climate/apiHistoryProvider").catch(() => undefined);
  assert.equal(typeof api?.createApiHistoryProvider, "function", "source-qualified cache provider missing");
  if (!api) return;
  const p = planApiHistory(point, point.displayTimeZone, { rangeDays: 1827 });
  let reads = 0;
  const cache = { async readSummary(key: string) { reads++; return key === p.cacheKey ? syntheticApiCacheBytes(p) : undefined; } };
  const disabled = await api.createApiHistoryProvider({ cache }).getClimatology(point.placeId, 1, point);
  assert.equal(disabled.availability.status, "unavailable"); assert.equal(disabled.summary, undefined);
  const provider = api.createApiHistoryProvider({ cache, admission });
  const result = await provider.getClimatology(point.placeId, 1, point);
  assert.equal(result.availability.status, "available"); assert.equal(result.sourceRevision, point.sourceRevision);
  assert.equal(result.grid?.cellId, "open-meteo:28.5:77.25"); assert.ok(result.grid!.displacementKm > 0);
  assert.equal(result.hostedMethodAdmission?.policyRevision, admission.policyRevision);
  assert.equal(result.summary!.validEligibleSamples, 720);
  assert.equal(result.summary!.meanCloudFraction, 0.4);
  assert.equal(result.bins!.length, 24); assert.ok(climateContextResultSchema.safeParse(result).success);
  const second = await provider.getClimatology("place:v1:api:geoapify:2222222222222222222222222222222222222222222222222222222222222222", 2, { ...point, placeId: "place:v1:api:geoapify:2222222222222222222222222222222222222222222222222222222222222222", latitude: 28.52, sourceRevision: "c".repeat(64) });
  assert.equal(second.availability.status, "available"); assert.equal(second.sourceRevision, "c".repeat(64));
  assert.equal((await provider.getClimatology(point.placeId, 1, { ...point, displayTimeZone: "UTC" })).availability.status, "unavailable");
  await assert.rejects(provider.getClimatology(point.placeId, 1), /sourceRevision/);
  assert.ok(reads >= 2);
});

test("cache corruption, missing year rows and bad coverage never create available history", async () => {
  const { createApiHistoryProvider } = await import("../../../server/providers/climate/apiHistoryProvider");
  const p = planApiHistory(point, point.displayTimeZone, { rangeDays: 1827 });
  for (const mutate of [(x: any) => { x.aggregate.yearMonthly.pop(); }, (x: any) => { x.aggregate.bins[0].valid = 31; }, (x: any) => { x.aggregate.receipts[0].requestUrl = "https://example.com"; }]) {
    const value = JSON.parse(syntheticApiCacheBytes(p).toString()); mutate(value);
    const result = await createApiHistoryProvider({ cache: { async readSummary() { return Buffer.from(JSON.stringify(value)); } }, admission }).getClimatology(point.placeId, 1, point);
    assert.equal(result.availability.status, "unavailable"); assert.equal(result.summary, undefined);
  }
  const full = await createApiHistoryProvider({ cache: { async readSummary() { return syntheticApiCacheBytes(p); } }, admission }).getClimatology(point.placeId, 1, point);
  assert.equal(climateContextResultSchema.safeParse({ ...full, hostedMethodAdmission: undefined }).success, false);
});

test("independent year guard makes otherwise complete monthly history partial; zero darkness has no numeric values", async () => {
  const { createApiHistoryProvider } = await import("../../../server/providers/climate/apiHistoryProvider");
  const p = planApiHistory(point, point.displayTimeZone, { rangeDays: 1827 });
  const value = JSON.parse(syntheticApiCacheBytes(p).toString());
  value.aggregate.yearMonthly[0][0].valid = 12;
  for (const bin of value.aggregate.bins.slice(0, 12)) { bin.valid = 29; bin.sum = 11.6; bin.counts[2] = 29; bin.yearsMask = 0x3ffffffe; }
  const result = await createApiHistoryProvider({ cache: { async readSummary() { return Buffer.from(JSON.stringify(value)); } }, admission }).getClimatology(point.placeId, 1, point);
  assert.equal(result.availability.status, "partial"); assert.equal(result.summary!.badYearCount, 1);
  for (const bin of value.aggregate.bins) Object.assign(bin, { expected: 0, valid: 0, counts: [0, 0, 0], sum: 0, yearsMask: 0, badYearsMask: 0 });
  for (const row of value.aggregate.yearMonthly) for (const month of row) Object.assign(month, { expected: 0, valid: 0 });
  const dark = await createApiHistoryProvider({ cache: { async readSummary() { return Buffer.from(JSON.stringify(value)); } }, admission }).getClimatology(point.placeId, 1, point);
  assert.equal(dark.availability.status, "not-covered"); assert.equal(dark.summary!.meanCloudFraction, undefined); assert.equal(dark.summary!.thresholds, undefined);
});

test("API revision-pinned MCP climate and planner share the cache provider without network work", async () => {
  const { registerNightSkyTools } = await import("../../../server/mcp/registerTools");
  const { createApiHistoryProvider } = await import("../../../server/providers/climate/apiHistoryProvider");
  const p = planApiHistory(point, point.displayTimeZone, { rangeDays: 1827 }); let reads = 0;
  const provider = createApiHistoryProvider({ cache: { async readSummary(key) { reads++; assert.equal(key, p.cacheKey); return syntheticApiCacheBytes(p); } }, admission });
  const tools = new Map<string, any>();
  const forbidden = async (): Promise<never> => { throw Error("Offline fixture: external work forbidden"); };
  registerNightSkyTools({ registerTool(name: string, config: any, handler: any) { tools.set(name, { config, handler }); } } as unknown as import("@modelcontextprotocol/server").McpServer, {
    discoveryProvider: { resolvePlace: forbidden, resolveRegion: forbidden, search: forbidden, details: forbidden },
    selectedPlaceResolver: { async resolve(input) { assert.equal(input.placeId, point.placeId); assert.equal(input.sourceRevision, point.sourceRevision); return point; } },
    climateProvider: provider, fetcher: forbidden, placeIndexLoader: forbidden,
    plannerServices: { searchEvents: forbidden, getAuroraOutlook: forbidden, searchCandidates: forbidden },
    weatherProvider: { async getForecast() { return { status: "unavailable", reason: "Offline fixture" }; } },
  });
  async function invoke(name: string, input: unknown) { const tool = tools.get(name); const response = await tool.handler(tool.config.inputSchema.parse(input), { mcpReq: { _meta: {} } }); return tool.config.outputSchema.parse(response.structuredContent); }
  const ref = { placeId: point.placeId, sourceRevision: point.sourceRevision, displayTimeZone: point.displayTimeZone };
  const direct = await invoke("get_clear_sky_climatology", { ...ref, month: 10 });
  assert.equal(direct.availability.status, "available"); assert.equal(direct.sourceRevision, point.sourceRevision);
  const planned = await invoke("plan_observing_session", { ...ref, activity: "general-stargazing", window: { startUtc: "2026-10-18T14:00:00Z", endUtc: "2026-10-18T22:00:00Z", timeZone: point.displayTimeZone } });
  assert.equal(planned.place.sourceRevision, point.sourceRevision);
  assert.ok(planned.factors.some((factor: any) => factor.name === "Historical context" && /1991/.test(factor.assessment)));
  assert.equal(reads, 2);
});

test("configured serving is absent by default and requires both bounded directory and explicit admission", async () => {
  const api = await import("../../../server/providers/climate/apiHistoryConfiguration").catch(() => undefined);
  assert.equal(typeof api?.createConfiguredApiHistoryProvider, "function"); if (!api) return;
  assert.equal(await api.createConfiguredApiHistoryProvider({}), undefined);
  await assert.rejects(api.createConfiguredApiHistoryProvider({ NIGHTSKY_API_HISTORY_CACHE_DIRECTORY: "missing-admission" }), /both/);
  await assert.rejects(api.createConfiguredApiHistoryProvider({ NIGHTSKY_API_HISTORY_CACHE_DIRECTORY: "relative", NIGHTSKY_API_HISTORY_ADMISSION: JSON.stringify(admission) }), /directory/);
  const { mkdtemp } = await import("node:fs/promises"), { tmpdir } = await import("node:os"), { join } = await import("node:path");
  const directory = await mkdtemp(join(tmpdir(), "nightsky-history-config-"));
  await assert.rejects(api.createConfiguredApiHistoryProvider({ NIGHTSKY_API_HISTORY_CACHE_DIRECTORY: directory, NIGHTSKY_API_HISTORY_ADMISSION: JSON.stringify({ ...admission, acceptsQuantizationAndUnverifiedRevision: false }) }));
  const provider = await api.createConfiguredApiHistoryProvider({ NIGHTSKY_API_HISTORY_CACHE_DIRECTORY: directory, NIGHTSKY_API_HISTORY_ADMISSION: JSON.stringify(admission) });
  assert.equal((await provider!.getClimatology(point.placeId, 1, point)).availability.status, "unavailable");
});
