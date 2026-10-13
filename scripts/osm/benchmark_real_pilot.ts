/** Offline desktop measurement; never represents target-host acceptance. */
import { performance } from "node:perf_hooks";
import { fileURLToPath } from "node:url";
import { loadOsmCandidateIndex, searchObservingLocations } from "../../server/places/osmCandidates";
const path = fileURLToPath(new URL("../../tests/osm/fixtures/real-three-boxes/candidates.json", import.meta.url));
const start = performance.now();
const index = await loadOsmCandidateIndex(path, { maxArtifactBytes: 2*1024*1024, expectedSha256: "7d07f347d8e5dfff06cdfc59a72e262b61760528bd5cac14b091f75e26f23755" });
const loadMs = performance.now()-start;
const results = [];
for (const [name,id,latitude,longitude] of [["Hanle",1270426,32.78943,78.9962],["Kodaikanal",1266425,10.23925,77.48932],["Munnar",1262463,10.08818,77.06239]] as const) {
  const place = { placeId: `place:v1:geonames:${id}`, latitude, longitude };
  const cold = performance.now();
  const result = await searchObservingLocations({ placeId: place.placeId, radiusKm: 20, limit: 10 }, { index, place });
  const coldMs = performance.now()-cold;
  const times = [];
  for (let i=0;i<30;i++) { const at=performance.now(); await searchObservingLocations({ placeId:place.placeId,radiusKm:20,limit:10 },{index,place}); times.push(performance.now()-at); }
  times.sort((a,b)=>a-b);
  results.push({name,returned:result.candidates.length,coldMs,p50Ms:times[15],p95Ms:times[28]});
}
console.log(JSON.stringify({kind:"desktop-real-pilot-only",loadMs,rows:index!.candidates.length,queries:results,peakRssBytes:process.resourceUsage().maxRSS*1024,node:process.version},null,2));
