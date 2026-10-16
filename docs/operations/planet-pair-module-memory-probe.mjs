// Run from repository root: node --import tsx docs/operations/planet-pair-module-memory-probe.mjs
// Direct module measurement only. No server, MCP transport, providers or S3.
import { writeFileSync, mkdirSync } from "node:fs";

const snapshots = [];
const snapshot = stage => snapshots.push({ stage, rssBytes: process.memoryUsage().rss, heapUsedBytes: process.memoryUsage().heapUsed, processPeakRssKiB: process.resourceUsage().maxRSS });
snapshot("startup-with-tsx-preloaded");
const { GeoNamesPlaceIndex } = await import("../../server/places/geonames.ts");
const { searchSkyEvents } = await import("../../server/events/catalog.ts");
const { planetPairSearchDiagnostics } = await import("../../server/events/planetPairConjunctions.ts");
const index = new GeoNamesPlaceIndex([{ geonameId: 1, name: "Pune", asciiName: "Pune", alternateNames: "", latitude: 18.5204, longitude: 73.8567, countryCode: "IN", countryName: "India", featureClass: "P", featureCode: "PPL", population: 1, timeZone: "Asia/Kolkata", modificationDate: "2026-01-01" }], "fixture");
snapshot("imports-and-single-place-fixture");
const input = { placeId: "place:v1:geonames:1", window: { startUtc: "2026-06-09T10:00:00Z", endUtc: "2026-06-09T14:00:00Z", timeZone: "Asia/Kolkata" } };
const start = performance.now();
const cold = await searchSkyEvents(input, index);
const coldMs = performance.now() - start;
snapshot("cold-four-hour-default-query-complete");
const warmStart = performance.now();
const warm = await searchSkyEvents(input, index);
const warmMs = performance.now() - warmStart;
snapshot("warm-identical-query-complete");
if (JSON.stringify(cold) !== JSON.stringify(warm)) throw Error("Warm output changed");
const report = { scope: "direct searchSkyEvents module only; not MCP transport, full server, production GeoNames index or S3", command: "node --import tsx docs/operations/planet-pair-module-memory-probe.mjs", environment: { node: process.version, platform: process.platform, arch: process.arch, execArgv: process.execArgv }, query: input, forceGc: false, coldMs, warmMs, resultBytes: Buffer.byteLength(JSON.stringify(cold)), events: cold.events.length, pairCoverage: cold.planetPairCoverage, snapshots, diagnostics: planetPairSearchDiagnostics() };
mkdirSync("dist", { recursive: true });
writeFileSync("dist/pair-module-memory-profile.json", JSON.stringify(report, null, 2) + "\n");
console.log(JSON.stringify(report, null, 2));
