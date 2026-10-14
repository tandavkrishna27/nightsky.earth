/** Bounded offline synthetic scale probe; does not represent real coverage. */
import assert from 'node:assert/strict';
import { mergeOsmCandidateShards, searchObservingLocations } from '../../server/places/osmCandidates';
import { OSM_SOURCE, type OSMCandidateRecord } from '../../server/places/importOsm';
let seed=41;
const random=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};
const candidates:OSMCandidateRecord[]=Array.from({length:100000},(_,i)=>({osmType:'node',osmId:i+1,name:`Synthetic ${i+1}`,category:'park',latitude:random()*180-90,longitude:random()*360-180,sourceCompleteness:1}));
const start=performance.now();
const index=mergeOsmCandidateShards([{schemaVersion:1,vintage:'synthetic-fixture',coverage:'Fictional random points; no real coverage',source:OSM_SOURCE,candidates}], 'Fictional synthetic scale fixture; no real coverage');
const mergeMs=performance.now()-start;
const times:number[]=[];
const rad=(d:number)=>d*Math.PI/180;
for(let i=0;i<24;i++) {
  const latitude=i===0?89.9:i===1?-89.9:random()*180-90;
  const longitude=i===2?179.99:i===3?-179.99:random()*360-180;
  const place={placeId:'place:v1:geonames:1252416',latitude,longitude};
  const begin=performance.now();
  const result=await searchObservingLocations({placeId:place.placeId,radiusKm:50,limit:10},{index,place});
  times.push(performance.now()-begin);
  const expected=candidates.map(row=>{
    const a=Math.sin(rad(row.latitude-latitude)/2)**2+Math.cos(rad(latitude))*Math.cos(rad(row.latitude))*Math.sin(rad(row.longitude-longitude)/2)**2;
    return {row,distance:6371.0088*2*Math.asin(Math.sqrt(Math.max(0,Math.min(1,a))))};
  }).filter(x=>x.distance<=50).sort((a,b)=>a.distance-b.distance||a.row.osmId-b.row.osmId).slice(0,10).map(x=>`place:v1:osm:node:${x.row.osmId}`);
  assert.deepEqual(result.candidates.map(row=>row.placeId),expected);
}
times.sort((a,b)=>a-b);
console.log(JSON.stringify({fixture:'fictional-fixed-seed-100000',rows:candidates.length,queries:24,referenceMatches:24,mergeMs,queryP50Ms:times[11],queryP95Ms:times[22],peakRssBytes:process.resourceUsage().maxRSS*1024}));
