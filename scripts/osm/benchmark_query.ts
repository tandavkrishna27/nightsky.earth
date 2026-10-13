/** Synthetic 100k-row query benchmark; no downloads or regional processing. */
import { performance } from "node:perf_hooks";
import { searchObservingLocations } from "../../server/places/osmCandidates";
import { OSM_SOURCE, type OSMCandidateIndexData } from "../../server/places/importOsm";

const index: OSMCandidateIndexData = {
  schemaVersion: 1, vintage: "synthetic", coverage: "Synthetic global lattice; no real coverage",
  source: { ...OSM_SOURCE, vintage: "synthetic" },
  candidates: Array.from({ length: 100_000 }, (_, i) => ({
    osmType: "node", osmId: i + 1, name: `Synthetic ${i}`, category: "park",
    latitude: -80 + (i % 1600) / 10, longitude: -180 + (i % 3600) / 10, sourceCompleteness: 1,
  })),
};
const place = { placeId: "place:v1:geonames:1880252", latitude: 18.5204, longitude: 73.8567 };
const start = performance.now();
await searchObservingLocations({ placeId: place.placeId, radiusKm: 20 }, { index, place });
const firstQueryMs = performance.now() - start;
const times: number[] = [];
for (let i = 0; i < 30; i++) {
  const start = performance.now();
  await searchObservingLocations({ placeId: place.placeId, radiusKm: 20 }, { index, place });
  times.push(performance.now() - start);
}
times.sort((a, b) => a - b);
console.log(JSON.stringify({ kind: "synthetic-only", rows: index.candidates.length,
  jsonBytes: Buffer.byteLength(JSON.stringify(index)), firstQueryMs,
  warmRuns: times.length, p50Ms: times[15], p95Ms: times[28],
  processPeakRssBytes: process.resourceUsage().maxRSS * 1024,
  node: process.version }, null, 2));
