/** Desktop capacity evidence; promises share a single event loop. */
import { fileURLToPath } from 'node:url';
import { loadOsmCandidateIndex, searchObservingLocations } from '../../server/places/osmCandidates';
const path=fileURLToPath(new URL('../../tests/osm/fixtures/real-offline-bhutan/candidates.json',import.meta.url));
const options={maxArtifactBytes: 4*1024*1024, expectedSha256:'d800a935abd54b8cda8e98d02c7e2bce50c7ca6f8e469cadfc735289704f41ff'};
const at=performance.now();
const index=await loadOsmCandidateIndex(path, options);
const loadMs=performance.now()-at;
const place={placeId:'place:v1:geonames:1252416',latitude:27.4661,longitude:89.6419};
const query=()=>searchObservingLocations({placeId:place.placeId,radiusKm:50,limit:10},{index,place});
const coldAt=performance.now(); const result=await query(); const coldMs=performance.now()-coldAt;
const times=[];
for(let i=0;i<100;i++){const start=performance.now();await query();times.push(performance.now()-start);}
times.sort((a,b)=>a-b);
const batchAt=performance.now();await Promise.all(Array.from({length:32},query));const batch32Ms=performance.now()-batchAt;
const loadsAt=performance.now();const loaded=await Promise.all(Array.from({length:8},()=>loadOsmCandidateIndex(path,options)));const load8Ms=performance.now()-loadsAt;
console.log(JSON.stringify({kind:'desktop-offline-bhutan-only',node:process.version,rows:index!.candidates.length,loadMs,coldMs,returned:result.candidates.length,p95Ms:times[94],batch32Ms,load8Ms,loadedCopies:loaded.length,peakRssBytes:process.resourceUsage().maxRSS*1024},null,2));
