/** Offline desktop evidence only; no target-host claim. */
import { fileURLToPath } from "node:url";
import { loadOsmCandidateIndex, searchObservingLocations } from "../../server/places/osmCandidates";
const start=performance.now();
const path=fileURLToPath(new URL("../../tests/osm/fixtures/real-regional-wave/candidates.json",import.meta.url));
const index=await loadOsmCandidateIndex(path,{maxArtifactBytes:4*1024*1024,expectedSha256:"e542a89ac7094acbd02f18dd7ea559001e21a4778214379b08839e1e553265ef"});
const loadMs=performance.now()-start;
const queries=[];
for(const [name,id,latitude,longitude] of [["Bengaluru",1277333,12.9716,77.5946],["Udhagamandalam",1253993,11.4134,76.6952],["Kochi",1273874,9.9312,76.2673],["Chennai",1264527,13.0827,80.2707]] as const) {
  const place={placeId:`place:v1:geonames:${id}`,latitude,longitude};
  const times=[]; let returned=0;
  for(let i=0;i<31;i++){const at=performance.now();const result=await searchObservingLocations({placeId:place.placeId,radiusKm:20,limit:10},{index,place});times.push(performance.now()-at);returned=result.candidates.length;}
  const coldMs=times.shift();times.sort((a,b)=>a-b);
  queries.push({name,returned,coldMs,p50Ms:times[15],p95Ms:times[28]});
}
console.log(JSON.stringify({kind:"desktop-regional-wave-only",rows:index!.candidates.length,loadMs,queries,peakRssBytes:process.resourceUsage().maxRSS*1024,node:process.version},null,2));
