/** Explicit, bounded API pilot. Empty arguments only describe the approval packet. */
import {openSync,writeSync,fsyncSync,closeSync} from 'node:fs';
import {lstat,readFile} from 'node:fs/promises';
import {resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
import {createConfiguredLightPollutionProviders,parseLightPollutionConfiguration,type LightPollutionEnvironment} from '../server/providers/lightPollution/configuration';
import type {LightPollutionResult} from '../shared/nightsky/lightPollution';

export const LIGHT_POLLUTION_PILOT={version:1,sourceId:'darkskysites',transport:'api',endpoint:'https://darkskysites.com/api/sqm',points:[{candidateId:'hyderabad',latitude:17.3850,longitude:78.4867},{candidateId:'shamirpet-area',latitude:17.6100,longitude:78.5630}],maxRequests:2,maxResponseBytes:262144,maxTotalResponseBytes:524288,deadlineMs:60000,retries:0} as const;
interface Attempt {candidateId:string;status:number|null;bytes:number;outcome:'started'|'received'|'stopped'}
interface Options {fetcher?:typeof fetch;signal?:AbortSignal;/** May shorten, never extend the approval deadline. */deadlineMs?:number}
export async function runLightPollutionValidation(args:string[],env:LightPollutionEnvironment,options:Options={}) {
 const plan=structuredClone(LIGHT_POLLUTION_PILOT);
 if(!args.length||(args.length===1&&['--plan','--dry-run'].includes(args[0])))return {mode:'proposal' as const,plan,approvalPacket:{...plan,approved:false,accountUsageReconciled:false},attempts:[] as Attempt[],results:[] as LightPollutionResult[],elapsedMs:0};
 if(args.length!==6||args[0]!=='--live'||args[1]!=='--acknowledge-light-pollution-pilot'||args[2]!=='--approval-packet'||args[4]!=='--journal')throw Error('Invalid pilot arguments.');
 const config=parseLightPollutionConfiguration(env);
 if(config.selected.length!==1||config.selected[0]!=='darkskysites'||!config.admitted.includes('darkskysites')||!env.NIGHTSKY_DARKSKYSITES_API_KEY||!config.quotaPath)throw Error('Existing private API admission and dedicated accounting required.');
 // Refuse a missing ledger before the factory can create even its lock file.
 const ledger=await lstat(config.quotaPath);if(!ledger.isFile()||ledger.isSymbolicLink())throw Error('Existing project ledger required.');
 const packetStat=await lstat(args[3]);if(!packetStat.isFile()||packetStat.isSymbolicLink()||packetStat.size>8192)throw Error('Invalid approval packet.');
 const packet=JSON.parse(await readFile(args[3],'utf8'));
 const expected={...plan,approved:true,accountUsageReconciled:true};
 if(!packet||Object.keys(packet).length!==Object.keys(expected).length||Object.entries(expected).some(([key,value])=>JSON.stringify(packet[key])!==JSON.stringify(value)))throw Error('Explicit matching approval and reconciled account usage required.');
 const duration=options.deadlineMs??plan.deadlineMs;if(!Number.isFinite(duration)||duration<=0||duration>plan.deadlineMs)throw Error('Invalid pilot deadline.');
 const fd=openSync(resolve(args[5]),'wx',0o600),controller=new AbortController(),started=performance.now();
 const attempts:Attempt[]=[],results:LightPollutionResult[]=[];let totalBytes=0;
 const secret=env.NIGHTSKY_DARKSKYSITES_API_KEY;
 const sanitize=(value:unknown):unknown=>typeof value==='string'?value.split(secret).join('[redacted]'):Array.isArray(value)?value.map(sanitize):value&&typeof value==='object'?Object.fromEntries(Object.entries(value).map(([k,v])=>[k,sanitize(v)])):value;
 const record=(value:unknown)=>{writeSync(fd,JSON.stringify(sanitize(value))+'\n');fsyncSync(fd);};
 const cancel=()=>controller.abort();options.signal?.addEventListener('abort',cancel,{once:true});if(options.signal?.aborted)controller.abort();const timer=setTimeout(cancel,duration);
 const remaining=()=>{if(controller.signal.aborted||performance.now()-started>=duration){controller.abort();throw Error('Pilot stopped.');}};
 const bounded=async<T>(pending:Promise<T>,signal:AbortSignal):Promise<T>=>{signal.throwIfAborted();let abort!:()=>void;try{return await Promise.race([pending,new Promise<T>((_resolve,reject)=>{abort=()=>reject(Error('Pilot stopped.'));signal.addEventListener('abort',abort,{once:true});if(signal.aborted)abort();})]);}finally{signal.removeEventListener('abort',abort);}};
 const fetcher=(async(input:RequestInfo|URL,init?:RequestInit)=>{
  remaining();const point=plan.points[attempts.length],url=new URL(String(input));
  if(!point||url.toString()!==`${plan.endpoint}?lat=${point.latitude}&lng=${point.longitude}`||init?.method&&init.method!=='GET')throw Error('Pilot dispatch refused.');
  const attempt:Attempt={candidateId:point.candidateId,status:null,bytes:0,outcome:'started'};attempts.push(attempt);record({attempt});
  const signal=AbortSignal.any([controller.signal,...(init?.signal?[init.signal]:[])]);let reader:ReadableStreamDefaultReader<Uint8Array>|undefined;
  try{
   const response=await bounded((options.fetcher??fetch)(url,{...init,redirect:'error',signal}),signal);attempt.status=response.status;
   if(response.redirected||(response.url&&response.url!==url.toString())||Number(response.headers.get('content-length'))>Math.min(plan.maxResponseBytes,plan.maxTotalResponseBytes-totalBytes)){void response.body?.cancel().catch(()=>{});throw Error('Pilot response rejected.');}
   const chunks:Uint8Array[]=[];reader=response.body?.getReader();
   if(reader)for(;;){remaining();const part=await bounded(reader.read(),signal);if(part.done)break;attempt.bytes+=part.value.byteLength;totalBytes+=part.value.byteLength;if(attempt.bytes>plan.maxResponseBytes||totalBytes>plan.maxTotalResponseBytes)throw Error('Pilot response limit.');chunks.push(part.value);}
   remaining();attempt.outcome='received';return new Response(response.body===null?null:Buffer.concat(chunks),{status:response.status,headers:response.headers});
  }catch{attempt.outcome='stopped';controller.abort();throw Error('Pilot transport stopped.');}
  finally{if(reader)void reader.cancel().catch(()=>{});record({attempt});}
 }) as typeof fetch;
 let configured:Awaited<ReturnType<typeof createConfiguredLightPollutionProviders>>|undefined;
 try{
  record({plan,startedAt:new Date().toISOString(),approval:{approved:true,accountUsageReconciled:true}});
  configured=await createConfiguredLightPollutionProviders(env,{fetcher});
  for(const point of plan.points){if(controller.signal.aborted)break;const result=await configured.providers[0].lookup(point,controller.signal);results.push(sanitize(result) as LightPollutionResult);record({result:results.at(-1)});if(result.status==='unavailable')break;}
  const report={mode:'executed' as const,plan,attempts,results,totalResponseBytes:totalBytes,elapsedMs:Math.round(performance.now()-started),limitations:['Synthetic tests and this pilot do not establish accuracy or browser admission.','Bytes count received response body chunks, including rejected chunks; transport buffering may overshoot a limit by one chunk. No raw responses retained.']};record({report});return report;
 }finally{clearTimeout(timer);controller.abort();options.signal?.removeEventListener('abort',cancel);try{await configured?.close();}finally{closeSync(fd);}}
}
if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url))runLightPollutionValidation(process.argv.slice(2),process.env).then(result=>console.log(JSON.stringify(result,null,2)),()=>{console.error('Light pollution pilot refused or stopped. Review sanitized journal and existing accounting; no automatic retry.');process.exitCode=1;});
