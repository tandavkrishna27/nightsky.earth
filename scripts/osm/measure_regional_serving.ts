/** Measure an explicitly supplied reviewed regional manifest. No acquisition. */
import { loadRegionalOsmProvider } from '../../server/places/regionalOsm';
const [manifestPath,expectedSha256]=process.argv.slice(2);
if(!manifestPath||!expectedSha256)throw new Error('Use MANIFEST_PATH EXPECTED_SHA256');
const provider=await loadRegionalOsmProvider(manifestPath,{expectedSha256,maxCacheRegions:1});
const queries=[];
for(const [name,latitude,longitude] of [['Bengaluru',12.9716,77.5946],['Thimphu',27.4728,89.639],['gap',40,-70],['Bengaluru-return',12.9716,77.5946]] as const){const start=performance.now();const result=await provider.search({placeId:'place:v1:geonames:1',radiusKm:50,limit:10},{place:{placeId:'place:v1:geonames:1',latitude,longitude}});queries.push({name,elapsedMs:performance.now()-start,status:result.availability.status,candidates:result.candidates.length,vintages:Array.from(new Set(result.candidates.flatMap(c=>c.sources.map(s=>s.vintage)))),stats:provider.stats()});}
console.log(JSON.stringify({manifestSha256:expectedSha256,regions:provider.manifest.regions.map(r=>({id:r.id,rows:r.rows,bytes:r.bytes,sha256:r.sha256,vintage:r.vintage})),queries,peakRssBytes:process.resourceUsage().maxRSS*1024},null,2));
