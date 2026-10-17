/** Opt-in real runtime. Imports and --plan never load private configuration or start a listener. */
import {openSync,writeSync,fsyncSync,closeSync,existsSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {createServer} from 'node:http';
import {resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
import {createConfiguredNightSkyPluginApp,closeConfiguredNightSkyPluginApp} from '../server/plugin';

export const NATIVE_SESSION_PLAN={maxRequests:8,durationMs:600000,requestMs:15000,maxBodyBytes:1048576,maxAcceptedBytes:8388608,host:'127.0.0.1',port:8765,optionalSky:'exposed but unadmitted',synthetic:false};
const endpoints=new Set(['secure.geonames.org/searchJSON','api.geoapify.com/v1/geocode/search','api.geoapify.com/v2/places','api.geoapify.com/v2/place-details','api.met.no/weatherapi/locationforecast/2.0/complete','api.weatherapi.com/v1/forecast.json','api.openweathermap.org/data/2.5/forecast','www.7timer.info/bin/api.pl','services.swpc.noaa.gov/json/ovation_aurora_latest.json']);

/** Bound all injected provider transport without replacing global fetch. */
export function createNativeSessionTransport(journalPath:string,transport:typeof fetch=fetch){
 const fd=openSync(journalPath,'wx',0o600);let failed=false,closed=false,count=0;
 const controller=new AbortController(),seen=new Set<string>();
 const record=(value:unknown)=>{if(failed||closed)throw Error('Journal unavailable');try{const bytes=Buffer.from(JSON.stringify(value)+'\n');for(let offset=0;offset<bytes.length;){const n=writeSync(fd,bytes,offset,bytes.length-offset);if(n<=0)throw Error();offset+=n;}fsyncSync(fd);}catch{failed=true;controller.abort();throw Error('Journal unavailable');}};
 try{record({plan:NATIVE_SESSION_PLAN,startedAt:new Date().toISOString()});}catch(error){closeSync(fd);throw error;}
 const timer=setTimeout(()=>controller.abort(),NATIVE_SESSION_PLAN.durationMs);
 const fetcher=(async(input:RequestInfo|URL,init?:RequestInit)=>{
  const url=new URL(String(input)),endpoint=url.hostname+url.pathname;
  const fingerprint=createHash('sha256').update(url.href).digest('hex');
  if(failed||closed||controller.signal.aborted||count>=NATIVE_SESSION_PLAN.maxRequests||url.protocol!=='https:'||url.port||url.username||url.password||!endpoints.has(endpoint)||(init?.method??'GET')!=='GET'||init?.body||seen.has(fingerprint))throw Error('Session request refused');
  // Synchronous durable reservation prevents concurrent requests exceeding the cap.
  seen.add(fingerprint);count++;const attempt=count;record({attempt,endpoint,at:new Date().toISOString()});
  const deadline=AbortSignal.timeout(NATIVE_SESSION_PLAN.requestMs);
  const signal=AbortSignal.any([controller.signal,deadline,...(init?.signal?[init.signal]:[])]);
  try{
   const response=await transport(url,{...init,redirect:'error',signal});
   if(response.redirected||Number(response.headers.get('content-length'))>NATIVE_SESSION_PLAN.maxBodyBytes){void response.body?.cancel().catch(()=>{});throw Error('Rejected response');}
   if(!response.body)throw Error('Missing response body');
   const reader=response.body.getReader(),chunks:Uint8Array[]=[];let size=0;
   const cancel=()=>{void reader.cancel().catch(()=>{});};signal.addEventListener('abort',cancel,{once:true});
   try{for(;;){signal.throwIfAborted();const part=await reader.read();if(part.done)break;size+=part.value.byteLength;if(size>NATIVE_SESSION_PLAN.maxBodyBytes)throw Error('Response limit');chunks.push(part.value);}signal.throwIfAborted();}
   finally{signal.removeEventListener('abort',cancel);void reader.cancel().catch(()=>{});reader.releaseLock();}
   record({response:attempt,endpoint,status:response.status,bytes:size});
   return new Response(Buffer.concat(chunks),{status:response.status,headers:response.headers});
  }catch{if(!failed&&!closed)record({endpoint,result:signal.aborted?'deadline':'unavailable'});throw Error('Bounded upstream request unavailable');}
 }) as typeof fetch;
 return {fetcher,signal:controller.signal,close(){if(closed)return;clearTimeout(timer);controller.abort();try{if(!failed)record({stoppedAt:new Date().toISOString(),attempts:count});}finally{closed=true;closeSync(fd);}}};
}

/** Every cleanup runs even if an earlier journal or listener cleanup fails. */
export async function cleanupNativeSession(closeSession:()=>void,closeListener:()=>Promise<void>,closeApp:()=>Promise<void>){
 try{closeSession();}finally{try{await closeListener();}finally{await closeApp();}}
}

/** Standalone launcher owns its process environment; it never reads credential files. */
export async function serveNativeBounded(journalPath:string){
 if(process.env.NIGHTSKY_DISCOVERY_MODE!=='api')throw Error('Real API discovery must be configured');
 const quotaPath=process.env.NIGHTSKY_QUOTA_STATE_PATH;
 if(!quotaPath||!existsSync(quotaPath)||!existsSync(quotaPath+'.initialized'))throw Error('Existing initialized durable quota configuration required');
 process.env.NIGHTSKY_SKY_PROVIDERS='darkskyplanner,astronomyapi,nasa-donki,jpl';
 process.env.NIGHTSKY_SKY_ADMITTED_PROVIDERS='';
 delete process.env.NIGHTSKY_SKY_QUOTA_STATE_PATH;
 process.env.NIGHTSKY_MCP_TOOL_MODE='full';
 process.env.NIGHTSKY_MCP_ALLOWED_HOSTS='127.0.0.1';
 const session=createNativeSessionTransport(journalPath);let app:Awaited<ReturnType<typeof createConfiguredNightSkyPluginApp>>|undefined;
 const server=createServer();
 try{
  app=await createConfiguredNightSkyPluginApp({fetcher:session.fetcher,log:()=>{}});session.signal.throwIfAborted();server.on('request',app);
  await new Promise<void>((done,reject)=>{server.once('error',reject);server.listen(NATIVE_SESSION_PLAN.port,NATIVE_SESSION_PLAN.host,done);});
  console.log(JSON.stringify({endpoint:'http://127.0.0.1:8765/mcp',synthetic:false,optionalSkyAdmitted:false,expiresInSeconds:600}));
  await new Promise<void>(done=>{const stop=()=>done();session.signal.addEventListener('abort',stop,{once:true});process.once('SIGINT',stop);process.once('SIGTERM',stop);if(session.signal.aborted)done();});
 }finally{await cleanupNativeSession(
  ()=>session.close(),
  async()=>{try{server.closeAllConnections();}finally{if(server.listening)await new Promise<void>((done,reject)=>server.close(error=>error?reject(error):done()));}},
  async()=>{if(app)await closeConfiguredNightSkyPluginApp(app);},
 );}
}
if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url)){
 const args=process.argv.slice(2);
 if(!args.length||args.length===1&&args[0]==='--plan')console.log(JSON.stringify(NATIVE_SESSION_PLAN));
 else if(args.length===2&&args[0]==='--serve')serveNativeBounded(resolve(args[1])).catch(()=>{console.error('Native session stopped; inspect sanitized journal. No automatic retry.');process.exitCode=1;});
 else{console.error('Use --plan or --serve <new-journal-path>');process.exitCode=1;}
}
