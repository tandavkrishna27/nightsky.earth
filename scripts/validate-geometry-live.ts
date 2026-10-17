/** Explicit bounded selection/geometry packets. Import/default are offline. Never saves response bodies. */
import {open,lstat} from 'node:fs/promises';
import {dirname,join,resolve} from 'node:path';
import {pathToFileURL} from 'node:url';
import {createHash} from 'node:crypto';
import {ApiHttpClient} from '../server/places/api/http';
import {decodeOriginalGeometrySnapshot,selectOriginalGeometryFeature} from '../server/places/api/geometrySnapshot';
import {geoapifyRegionQuery} from '../server/places/api/geoapify';
import {createPersistentQuota} from '../server/providers/quotaState';
import {PROVIDER_QUOTA_POLICIES} from '../server/providers/weather/configuration';
import {checkedValidationQuota} from './validate-api-live';
// v1's stopped allowance is consumed; these revised packets require new authority.
export const GEOMETRY_ENVELOPE='geometry-live-v2-6-9-120-zero-retries';
export const GEOMETRY_SELECTION_ENVELOPE='geometry-selection-v2-va-1-1-30-zero-retries';
export const countryQuery=(name:string,code:'va'|'sm')=>geoapifyRegionQuery({regionQuery:name,countryCode:code==='va'?'VAT':'SMR',adminLevel:0});
const fail=()=>Error('Geometry validation refused or stopped.');
const hash=(v:unknown)=>createHash('sha256').update(JSON.stringify(v)).digest('hex');
const id=(v:unknown):v is string=>typeof v==='string'&&v.length>=3&&v.length<=2048&&!/[\x00-\x1f\x7f-\x9f]/.test(v);
type StopReason='selection-malformed'|'selection-empty'|'selection-over-limit'|'selection-ambiguous'|'selection-no-eligible-country'|'selection-unsafe-identity'|'geometry-parser-rejected'|'parks-malformed'|'transport-quota-or-persistence-failed';
class PacketStop extends Error { constructor(readonly reason:StopReason){super('Geometry validation stopped.');} }
/** Booleans/counts only: no upstream text or IDs are echoed even when malformed. */
export function selectionFacts(value:any,code:'va'|'sm') {
 const rows=Array.isArray(value?.features)?value.features:null;
 const features=(rows??[]).slice(0,5).map((f:any)=>({featureValid:f?.type==='Feature',expectedCountry:f?.properties?.country_code===code,countryType:f?.properties?.result_type==='country',idPresent:typeof f?.properties?.place_id==='string'&&f.properties.place_id.length>0,idValid:id(f?.properties?.place_id)}));
 return {featureCollectionValid:value?.type==='FeatureCollection',featuresArrayValid:rows!==null,featureCount:rows?.length??null,withinLimit:rows!==null&&rows.length<=5,eligibleCount:features.filter((f:any)=>f.featureValid&&f.expectedCountry&&f.countryType&&f.idValid).length,features};
}
export function selectCountry(value:any,code:'va'|'sm'):string {
 const facts=selectionFacts(value,code);
 if(!facts.featureCollectionValid||!facts.featuresArrayValid)throw new PacketStop('selection-malformed');
 if(!facts.withinLimit)throw new PacketStop('selection-over-limit');
 if(facts.featureCount===0)throw new PacketStop('selection-empty');
 const rows=value.features as any[];
 const matches=rows.filter(f=>f?.type==='Feature'&&f?.properties?.country_code===code&&f?.properties?.result_type==='country'&&id(f?.properties?.place_id));
 if(matches.length!==1)throw new PacketStop(matches.length>1?'selection-ambiguous':'selection-no-eligible-country');return matches[0].properties.place_id;
}
export function createGeometryGuard(o:{key:string;fetcher:typeof fetch;persist:(r:unknown)=>Promise<void>;deadlineMs?:number;now?:()=>number;packet?:'selection'|'geometry'}) {
 const selectionOnly=o.packet==='selection',maxRequests=selectionOnly?1:6,maxCredits=selectionOnly?1:9,maxMilliseconds=selectionOnly?30000:120000;
 const now=o.now??Date.now,deadlineMs=Math.min(maxMilliseconds,Math.max(1,o.deadlineMs??maxMilliseconds));
 const started=now(),abort=new AbortController();let fatal=false,total=0,sequence=0,credits=0,expected:{path:string;query:Record<string,string>}|undefined;
 const timer=setTimeout(()=>abort.abort(),deadlineMs);
 const rows:unknown[]=[];const selectedIds:string[]=[];
 const stopped=()=>fatal||abort.signal.aborted||now()-started>=deadlineMs;
 const fetcher:typeof fetch=async(input,init)=>{
 let reader:ReadableStreamDefaultReader<Uint8Array>|undefined;const at=Date.now();let row:any;
 try {
  if(stopped()||!expected||input instanceof Request)throw fail();const plan=expected;expected=undefined;
  const u=new URL(String(input));const query={...plan.query,apiKey:o.key};
  if(u.origin!=='https://api.geoapify.com'||u.pathname!==plan.path||u.hash||u.username||u.password||(init?.method??'GET')!=='GET'||init?.body||[...u.searchParams].length!==Object.keys(query).length||Object.entries(query).some(([k,v])=>u.searchParams.get(k)!==v))throw fail();
  const cost=plan.path==='/v2/place-details'?2:1;if(++sequence>maxRequests||(credits+=cost)>maxCredits)throw fail();
  row={sequence,path:plan.path,query:plan.query,cost,status:null,bytes:0,elapsedMs:0,outcome:'started'};rows.push(row);
  await o.persist({...row});if(stopped())throw fail();
  const signal=AbortSignal.any([abort.signal,...(init?.signal?[init.signal]:[])]);
  const expired=new Promise<never>((_,reject)=>{signal.addEventListener('abort',()=>reject(fail()),{once:true});});
  signal.throwIfAborted();const pending=o.fetcher(u,{...init,redirect:'error',signal});void pending.then(r=>{if(signal.aborted)void r.body?.cancel().catch(()=>{});},()=>{});
  const response=await Promise.race([pending,expired]);row.status=response.status;
  if(response.redirected||(response.status>=300&&response.status<400)||Number(response.headers.get('content-length'))>262144){void response.body?.cancel().catch(()=>{});throw fail();}
  reader=response.body?.getReader();const chunks:Uint8Array[]=[];
  if(reader)for(;;){const part=await Promise.race([reader.read(),expired]);if(part.done)break;row.bytes+=part.value.byteLength;total+=part.value.byteLength;if(row.bytes>262144||total>maxRequests*262144)throw fail();chunks.push(part.value);}
  row.outcome='received';const headers=new Headers();for(const k of ['content-type','retry-after']){const v=response.headers.get(k);if(v)headers.set(k,v);}
  return new Response([204,205,304].includes(response.status)?null:Buffer.concat(chunks),{status:response.status,headers});
 }catch{fatal=true;abort.abort();if(row)row.outcome='failed';void reader?.cancel().catch(()=>{});throw fail();}
 finally{if(row){row.elapsedMs=Date.now()-at;try{await o.persist({...row});}catch{fatal=true;abort.abort();throw fail();}}}
 };
 return {fetcher,rows,get stopped(){return stopped();},selectCountries(vatican:string,sanMarino:string){if(sequence!==2||selectedIds.length||!id(vatican)||!id(sanMarino)||vatican===sanMarino||vatican.includes(o.key)||sanMarino.includes(o.key))throw fail();selectedIds.push(vatican,sanMarino);},expect(path:string,query:Record<string,string>){
  if(expected||stopped()||sequence>=maxRequests)throw fail();
  let required:Record<string,string>;let route:string;
  if(sequence<2){route='/v1/geocode/search';required=countryQuery(sequence===0?'Vatican City':'San Marino',sequence===0?'va':'sm');}
  else if(sequence===4){route='/v2/places';required={categories:'leisure.park',filter:'place:'+selectedIds[0],limit:'20'};}
  else {route='/v2/place-details';if(selectedIds.length!==2)throw fail();required={id:sequence===5?selectedIds[0]!:selectedIds[sequence-2]!,features:'details,details.full_geometry'};}
  if(path!==route||Object.keys(query).length!==Object.keys(required).length||Object.entries(required).some(([k,v])=>query[k]!==v))throw fail();
  expected={path,query:{...query}};
 },close(){clearTimeout(timer);abort.abort();}};
}
/** Whitelisted metadata only; arbitrary source strings, URLs and coordinates never enter receipts. */
export function geometryFacts(value:any,selected:string){
 const features=Array.isArray(value?.features)?value.features.slice(0,20):[];
 return {featureCount:Array.isArray(value?.features)?value.features.length:null,features:features.map((f:any)=>{
  const p=f?.properties,g=f?.geometry;let vertices=0,rings=0,visits=0,countsTruncated=false;const pending:unknown[]=[g?.coordinates];
  while(pending.length&&visits++<4096){const v=pending.pop();if(!Array.isArray(v))continue;if(v.length&&Array.isArray(v[0])&&typeof v[0][0]==='number'){rings++;vertices+=v.length;}else for(let i=0;i<v.length;i++){if(pending.length>=4096){countsTruncated=true;break;}pending.push(v[i]);}}
  countsTruncated ||= pending.length>0;
  return {featureType:typeof p?.feature_type==='string'&&/^[a-z][a-z0-9_.]{0,79}$/.test(p.feature_type)?p.feature_type:'unknown',identityMatches:p?.place_id===selected,placeId:id(p?.place_id)?p.place_id:null,geometryType:['Polygon','MultiPolygon','Point','LineString','MultiLineString','GeometryCollection'].includes(g?.type)?g.type:'unknown',vertices,rings,countsTruncated,sourceVintage:'unknown'};
 })};
}
export async function runGeometryValidation(args:string[],env:Record<string,string|undefined>,deps:{fetcher?:typeof fetch}={}) {
 if(!args.length)return {mode:'offline',envelope:GEOMETRY_ENVELOPE,maxRequests:6,maxCredits:9,maxBodyBytes:262144,maxTotalBytes:1572864,deadlineMs:120000,retries:0,selectionCheck:{envelope:GEOMETRY_SELECTION_ENVELOPE,args:['--selection-live'],path:'/v1/geocode/search',query:countryQuery('Vatican City','va'),maxRequests:1,maxCredits:1,maxBodyBytes:262144,maxTotalBytes:262144,deadlineMs:30000,retries:0}};
 const selectionOnly=args.length===1&&args[0]==='--selection-live',envelope=selectionOnly?GEOMETRY_SELECTION_ENVELOPE:GEOMETRY_ENVELOPE;
 const key=env.NIGHTSKY_GEOAPIFY_API_KEY,path=env.NIGHTSKY_QUOTA_STATE_PATH,batch=env.NIGHTSKY_LIVE_BATCH_ID;
 if(args.length!==1||(!selectionOnly&&args[0]!=='--live')||env.NIGHTSKY_LIVE_APPROVED_ENVELOPE!==envelope||!key||!path||!batch||!/^[a-z0-9][a-z0-9-]{0,63}$/.test(batch)||env.NIGHTSKY_LIVE_GEOAPIFY_ADMITTED!=='yes'||env.NIGHTSKY_DISCOVERY_MODE!=='api'||env.NIGHTSKY_GEOMETRY_ENABLED==='yes'||env.NIGHTSKY_GEOMETRY_SOURCE_ACCEPTED==='yes')throw fail();
 const stat=await lstat(path);if(!stat.isFile()||stat.isSymbolicLink())throw fail();
 const quota=await createPersistentQuota({path,now:Date.now,policies:PROVIDER_QUOTA_POLICIES});
 let journal:Awaited<ReturnType<typeof open>>|undefined,g:ReturnType<typeof createGeometryGuard>|undefined;
 try {
  journal=await open(join(dirname(path),`geometry-live-${batch}.jsonl`),'wx',0o600);let bytes=0;
  const persist=async(value:unknown)=>{const line=JSON.stringify(value)+'\n';if(line.includes(key)||(bytes+=Buffer.byteLength(line))>262144)throw fail();await journal!.write(line);await journal!.sync();};
  await persist({envelope,batch,startedAt:new Date().toISOString(),productionEnabled:false});
  g=createGeometryGuard({key,fetcher:deps.fetcher??fetch,persist,packet:selectionOnly?'selection':'geometry'});
  // Dedicated validation client only; no environment or production admission mutation.
  const http=new ApiHttpClient({geoapifyApiKey:key,userAgent:env.NIGHTSKY_LOCATION_USER_AGENT??'NightSky.earth/1.0 (nightsky.earth2026@gmail.com)',geometryEnabled:true,geometrySourceAccepted:true,quota:checkedValidationQuota(quota,()=>g!.close()),fetcher:g.fetcher});
  const deadline=Date.now()+(selectionOnly?30000:120000);const request=async(path:string,query:Record<string,string>)=>{g!.expect(path,query);return http.json('geoapify',path,query,deadline);};
  const results:unknown[]=[];let status='stopped';let stopReason:StopReason|null=null;let phase='vatican-geocode';
  const country=async(text:string,code:'va'|'sm')=>{
   const value=await request('/v1/geocode/search',countryQuery(text,code));
   await persist({selectionFacts:{expectedCountry:code,...selectionFacts(value,code)}});
   const selected=selectCountry(value,code);if(selected.includes(key))throw new PacketStop('selection-unsafe-identity');
   await persist({selection:{countryCode:code,placeId:selected}});return selected;
  };
  try {
   const va=await country('Vatican City','va');
   if(selectionOnly){if(g.stopped)throw fail();const report={mode:'live',envelope,status:'selection-completed',stopReason:null,phase,attempts:g.rows,results:[],selection:{countryCode:'va',placeId:va},productionEnabled:false,sourceAccepted:false};await persist({report});return report;}
   phase='san-marino-geocode';
   const sm=await country('San Marino','sm');if(va===sm)throw new PacketStop('selection-unsafe-identity');g.selectCountries(va,sm);
   const details=async(selected:string)=>{
    const value:any=await request('/v2/place-details',{id:selected,features:'details,details.full_geometry'});
    const facts=geometryFacts(value,selected);await persist({shape:facts});
    const now=Date.now(),metadata={region:{regionId:`region:v1:${hash(selected)}`,sourceRevision:hash(selected)},upstreamId:selected,requestedFeatures:'details,details.full_geometry',fetchedAt:new Date(now).toISOString(),expiresAt:new Date(now+3600000).toISOString()};
    let snapshot:ReturnType<typeof decodeOriginalGeometrySnapshot>;
    try {snapshot=decodeOriginalGeometrySnapshot(JSON.stringify(value),metadata);}
    catch{await persist({parser:'rejected',selected});throw new PacketStop('geometry-parser-rejected');}
     const geometry=selectOriginalGeometryFeature(JSON.stringify(value),selected).geometry;
     const vertex=geometry.type==='Polygon'?geometry.coordinates[0][0]:geometry.coordinates[0][0][0];
     const shell:number[][]=geometry.type==='Polygon'?geometry.coordinates[0]:geometry.coordinates[0][0];
     const minX=Math.min(...shell.map(p=>p[0])),maxX=Math.max(...shell.map(p=>p[0])),minY=Math.min(...shell.map(p=>p[1])),maxY=Math.max(...shell.map(p=>p[1]));
     let insideFound=false;for(let x=1;x<10&&!insideFound;x++)for(let y=1;y<10&&!insideFound;y++)insideFound=snapshot.classify([minX+(maxX-minX)*x/10,minY+(maxY-minY)*y/10],now)==='inside';
     const result={selected,parser:'accepted',...facts,normalizedHash:hash(geometry),receiptHash:snapshot.geometryRevision,expiresAt:snapshot.expiresAt,classification:{inside:insideFound?'inside':'not-found-by-bounded-probe',boundary:snapshot.classify(vertex,now),outside:snapshot.classify([0,0],now),expired:snapshot.classify(vertex,now+3600000)}};
     results.push(result);await persist({result});return result;
   };
   phase='vatican-details';const first=await details(va);phase='san-marino-details';await details(sm);
   phase='vatican-parks';const parks:any=await request('/v2/places',{categories:'leisure.park',filter:`place:${va}`,limit:'20'});if(parks?.type!=='FeatureCollection'||!Array.isArray(parks.features)||parks.features.length>20)throw new PacketStop('parks-malformed');await persist({parks:{count:parks.features.length}});
   // No geometry cache is used: each closure becomes unreachable when details returns.
   phase='vatican-details-repeat';const repeat=await details(va);await persist({repeat:{normalizedEqual:first.normalizedHash===repeat.normalizedHash,receiptEqual:first.receiptHash===repeat.receiptHash}});if(g.stopped)throw fail();status='completed';
  }catch(error){stopReason=error instanceof PacketStop?error.reason:'transport-quota-or-persistence-failed';await persist({stopped:true,phase,reason:stopReason});}
  const report={mode:'live',envelope,status,stopReason,phase,attempts:g.rows,results,productionEnabled:false,sourceAccepted:false};await persist({report});return report;
 }finally{g?.close();await journal?.close();await quota.close();}
}
if(process.argv[1]&&import.meta.url===pathToFileURL(resolve(process.argv[1])).href)runGeometryValidation(process.argv.slice(2),process.env).then(r=>console.log(JSON.stringify(r)),()=>{console.error(JSON.stringify({status:'refused-or-failed',envelope:process.argv.length===3&&process.argv[2]==='--selection-live'?GEOMETRY_SELECTION_ENVELOPE:GEOMETRY_ENVELOPE}));process.exitCode=1;});

