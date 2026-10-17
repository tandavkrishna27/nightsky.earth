/** Public Ceres parameter diagnostic; no private environment or credentials are used. */
import {openSync,writeSync,fsyncSync,closeSync} from 'node:fs';
import {resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
export const JPL_ERROR_PLAN={requests:1,maxBodyBytes:262144,totalDeadlineMs:30000,retries:0,command:'1;',scope:'Public Ceres numbered-target diagnostic, different from prior SPK request. Fixed synthetic Hyderabad observer, elevation zero. Retain error text only, not full response.'};
export function publicJplError(body:string){
 let value:unknown;try{value=JSON.parse(body);}catch{return {kind:'invalid-json' as const};}
 const data=value as {signature?:{version?:unknown};error?:unknown;result?:unknown}|null;
 const version=typeof data?.signature?.version==='string'&&/^\d{1,4}\.\d{1,4}$/.test(data.signature.version)?data.signature.version:undefined;
 const error=typeof data?.error==='string'?data.error.replace(/[\x00-\x1f\x7f-\x9f]/g,' ').replace(/[\u202a-\u202e\u2066-\u2069]/g,'').slice(0,1000):undefined;
 return {kind:data?.error!==undefined?'provider-error' as const:'json' as const,version,error,hasTable:typeof data?.result==='string'&&data.result.includes('$$SOE')&&data.result.includes('$$EOE')};
}
export async function runJplErrorProbe(journalPath:string,errorPath:string,transport:typeof fetch=fetch){
 const journal=openSync(journalPath,'wx',0o600);let errorFile:number|undefined;const started=Date.now();
 const write=(fd:number,value:string)=>{const bytes=Buffer.from(value);let offset=0;while(offset<bytes.length){const count=writeSync(fd,bytes,offset,bytes.length-offset);if(count<=0)throw Error('Write failed');offset+=count;}fsyncSync(fd);};
 const record=(value:unknown)=>write(journal,JSON.stringify(value)+'\n');
 const controller=new AbortController();const timer=setTimeout(()=>controller.abort(),JPL_ERROR_PLAN.totalDeadlineMs);
 try{
  errorFile=openSync(errorPath,'wx',0o600);record({plan:JPL_ERROR_PLAN,startedAt:new Date(started).toISOString()});
  const jd=started/86400000+2440587.5,url=new URL('https://ssd.jpl.nasa.gov/api/horizons.api');
  const params={COMMAND:'1;',OBJ_DATA:'NO',MAKE_EPHEM:'YES',EPHEM_TYPE:'OBSERVER',CENTER:'coord@399',COORD_TYPE:'GEODETIC',SITE_COORD:'78.474,17.361,0',TLIST:String(jd),TLIST_TYPE:'JD',TIME_TYPE:'UT',CAL_FORMAT:'JD',CAL_TYPE:'GREGORIAN',QUANTITIES:'4',CSV_FORMAT:'YES',APPARENT:'AIRLESS',EXTRA_PREC:'YES'};
  url.searchParams.set('format','json');for(const [key,value] of Object.entries(params))url.searchParams.set(key,"'"+value+"'");
  record({reservation:1,attempt:'ssd.jpl.nasa.gov/api/horizons.api',command:'1;'});controller.signal.throwIfAborted();
  const response=await transport(url,{redirect:'error',signal:controller.signal,headers:{Accept:'application/json'}});
  const length=response.headers.get('content-length');
  if(response.redirected||(length!==null&&(!/^\d+$/.test(length)||Number(length)>JPL_ERROR_PLAN.maxBodyBytes))){await response.body?.cancel();throw Error('Response rejected');}
  if(!response.body)throw Error('Missing body');const reader=response.body.getReader();const chunks:Uint8Array[]=[];let bytes=0;
  const cancel=()=>{void reader.cancel().catch(()=>{});};controller.signal.addEventListener('abort',cancel,{once:true});
  try{for(;;){controller.signal.throwIfAborted();const part=await reader.read();if(part.done)break;bytes+=part.value.byteLength;if(bytes>JPL_ERROR_PLAN.maxBodyBytes)throw Error('Body limit');chunks.push(part.value);}controller.signal.throwIfAborted();}
  finally{controller.signal.removeEventListener('abort',cancel);await reader.cancel().catch(()=>{});reader.releaseLock();}
  const diagnostic=publicJplError(Buffer.concat(chunks).toString('utf8'));
  // Only the sanitized error field is retained; never save the full upstream response.
  write(errorFile,'error' in diagnostic&&diagnostic.error?diagnostic.error+'\n':'No string error returned.\n');
  const report={status:response.status,bytes,elapsedMs:Date.now()-started,command:'1;',diagnostic};record({report});return report;
 }catch{record({failure:controller.signal.aborted?'deadline':'request-or-persistence-failed',elapsedMs:Date.now()-started});throw Error('JPL diagnostic stopped; no retry.');}
 finally{clearTimeout(timer);controller.abort();if(errorFile!==undefined)closeSync(errorFile);closeSync(journal);}
}
if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url)){
 const args=process.argv.slice(2);
 if(!args.length||(args.length===1&&args[0]==='--plan'))console.log(JSON.stringify(JPL_ERROR_PLAN));
 else if(args.length===3&&args[0]==='--live')runJplErrorProbe(resolve(args[1]),resolve(args[2])).then(r=>console.log(JSON.stringify(r)),()=>{console.error('JPL diagnostic stopped. Check local journal; no retry.');process.exitCode=1;});
 else {console.error('Use --plan or --live <new-journal-path> <new-error-path>.');process.exitCode=1;}
}
