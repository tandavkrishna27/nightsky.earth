import * as z from 'zod4';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { lookup } from 'node:dns/promises';
import { isIP, BlockList } from 'node:net';
import { lightPollutionPointsSchema, lightPollutionResultSchema, type LightPollutionPoint, type LightPollutionResult, type LightPollutionProvider } from '../../../shared/nightsky/lightPollution';
export const BROWSER_PROTOCOL_LIMIT=16384;
export const browserRequestSchema=z.strictObject({requestId:z.string().regex(/^[a-zA-Z0-9_-]{1,100}$/),sourceId:z.enum(['lightpollutionmap','darkskysites']),points:lightPollutionPointsSchema});
export function decodeBrowserRequest(line:string){if(Buffer.byteLength(line)>BROWSER_PROTOCOL_LIMIT)throw Error('protocol_limit');return browserRequestSchema.parse(JSON.parse(line));}
export function browserUnavailable(point:LightPollutionPoint,errorCode:string,sourceId:LightPollutionResult['sourceId']='lightpollutionmap'):LightPollutionResult {
 return {candidateId:point.candidateId,sourceId,transport:'browser',status:'unavailable',requestedPoint:{latitude:point.latitude,longitude:point.longitude},observedPoint:null,coordinateBinding:'unverified',retrievedAt:new Date().toISOString(),dataset:{label:null,id:null,year:null,month:null},sqm:null,unit:'mag/arcsec2',bortleClasses:null,quality:{coverage:'unknown',notes:[],assessments:[]},attribution:sourceId==='lightpollutionmap'?'Lightpollutionmap.info':'DarkSkySites.com',sourceUrl:sourceId==='lightpollutionmap'?'https://www.lightpollutionmap.info/':'https://darkskysites.com/',limitations:['Modeled estimates; public browser admission pending rights, visible binding, egress and capacity evidence.'],errorCode};
}
export interface SelectedEvidence {text:string;previousText:string;fresh:boolean;selectedCount:number}
/** Strict synthetic grammar, pending validation against an authorized live selected popup. */
export function parseLightpollutionmapEvidence(point:LightPollutionPoint,e:SelectedEvidence):LightPollutionResult {
 const bad=(code:string)=>browserUnavailable(point,code);
 if(e.text.length>8000||/captcha|verify you are human|access denied|challenge/i.test(e.text))return bad('browser_access_challenge');
 if(!e.fresh||e.selectedCount!==1||e.text===e.previousText)return bad('coordinate_binding_failed');
 const fields=new Map<string,string>();for(const line of e.text.split(/\r?\n/)){const m=/^([^:]+):\s*(.+)$/.exec(line.trim());if(m){if(fields.has(m[1]))return bad('ambiguous_evidence');fields.set(m[1],m[2]);}}
 const c=/^(-?\d+(?:\.\d+)?),\s*(-?\d+(?:\.\d+)?)$/.exec(fields.get('Coordinates')??'');
 if(!c||Number(c[1])!==point.latitude||Number(c[2])!==point.longitude)return bad('coordinate_binding_failed');
 const layer=fields.get('Layer'),year=fields.get('Year'),credit=fields.get('Attribution');
 if(!layer||!year||!/^\d{4}$/.test(year)||Number(year)<1900||!credit)return bad('dataset_evidence_missing');
 const sqmText=fields.get('SQM'),bortle=fields.get('Bortle');let sqm:number|null=null;let classes:number[]|null=null;
 if(sqmText!==undefined){if(!/^\d+(?:\.\d+)?$/.test(sqmText)||Number(sqmText)<0||Number(sqmText)>30)return bad('malformed_evidence');sqm=Number(sqmText);}
 if(bortle!==undefined){const b=/^([1-9])(?:\s*[-–]\s*([1-9]))?$/.exec(bortle);if(!b||Number(b[2]??b[1])<Number(b[1]))return bad('malformed_evidence');classes=Array.from({length:Number(b[2]??b[1])-Number(b[1])+1},(_,i)=>Number(b[1])+i);}
 if(sqm===null&&classes===null)return bad('unsupported_labels');
 const base=bad('placeholder');const result={...base,status:'available' as const,observedPoint:{latitude:Number(c[1]),longitude:Number(c[2])},coordinateBinding:'verified' as const,dataset:{label:layer,id:null,year:Number(year),month:null},sqm,bortleClasses:classes,attribution:credit,errorCode:null};
 const checked=lightPollutionResultSchema.safeParse(result);return checked.success?checked.data:bad('malformed_evidence');
}
const nonPublicV6=new BlockList();
for(const [network,prefix] of [['2001:db8::',32],['2001::',32],['2001:10::',28],['2001:20::',28],['2002::',16],['3fff::',20]] as const)nonPublicV6.addSubnet(network,prefix,'ipv6');
export function isPublicAddress(address:string):boolean {
 const ip=address.toLowerCase();const family=isIP(ip);if(family===4){const p=ip.split('.').map(Number);return !(p[0]===0||p[0]===10||p[0]===127||p[0]>=224||(p[0]===100&&p[1]>=64&&p[1]<=127)||(p[0]===169&&p[1]===254)||(p[0]===172&&p[1]>=16&&p[1]<=31)||(p[0]===192&&(p[1]===168||p[1]===0||p[1]===2))||(p[0]===198&&(p[1]===18||p[1]===19||p[1]===51))||(p[0]===203&&p[1]===0&&p[2]===113));}
 // Only globally routed 2000::/3; conservatively exclude transition/documentation ranges.
 return family===6&&/^[23]/.test(ip)&&!nonPublicV6.check(ip,'ipv6');
}
export async function validateResourceUrl(raw:string,resolve:(host:string)=>Promise<string[]>=async host=>(await lookup(host,{all:true})).map(r=>r.address)):Promise<boolean>{
 try{const u=new URL(raw);if(u.protocol!=='https:'||u.username||u.password||u.port||u.origin!=='https://www.lightpollutionmap.info')return false;const ips=await resolve(u.hostname);return ips.length>0&&ips.every(isPublicAddress);}catch{return false;}
}
export function credentialFreeBrowserEnvironment():NodeJS.ProcessEnv {
 const env:NodeJS.ProcessEnv={};for(const key of ['SystemRoot','WINDIR','PATH','TEMP','TMP'])if(process.env[key])env[key]=process.env[key];return env;
}
export async function terminateBrowserTree(pid:number):Promise<void> {
 if(process.platform==='win32'){await new Promise<void>(resolve=>{const killer=spawn('taskkill',['/pid',String(pid),'/T','/F'],{windowsHide:true,stdio:'ignore',env:credentialFreeBrowserEnvironment()});killer.on('error',()=>{try{process.kill(pid);}catch{}});killer.once('exit',()=>resolve());killer.once('error',()=>resolve());});}
 else {try{process.kill(-pid,'SIGKILL');}catch{try{process.kill(pid,'SIGKILL');}catch{}}}
}
export const browserWorkerUrl=new URL(import.meta.url.includes('/server/providers/lightPollution/')?'../../../dist/light-pollution-browser-worker.js':'./light-pollution-browser-worker.js',import.meta.url);
// Bundled plugin.js lives in dist; source module lives under server/providers/lightPollution.
function workerPath(){return fileURLToPath(browserWorkerUrl);}
export async function runBrowserChild(point:LightPollutionPoint,signal:AbortSignal,sourceId:LightPollutionResult['sourceId']='lightpollutionmap'):Promise<LightPollutionResult>{
 const requestId=crypto.randomUUID();return new Promise(resolve=>{
 const child=spawn(process.execPath,[workerPath()],{stdio:['pipe','pipe','pipe'],env:credentialFreeBrowserEnvironment(),detached:process.platform!=='win32',windowsHide:true});let settled=false,buffer='',errorBytes=0;const exited=new Promise<void>(done=>{child.once('exit',()=>done());child.once('error',()=>done());});
 const finish=(r:LightPollutionResult)=>{if(settled)return;settled=true;signal.removeEventListener('abort',abort);void (async()=>{if(child.pid){await terminateBrowserTree(child.pid);await exited;}resolve(r);})();};const bad=(code:string)=>finish(browserUnavailable(point,code,sourceId));const abort=()=>bad('browser_cancelled');
 signal.addEventListener('abort',abort,{once:true});if(signal.aborted){abort();return;}
 child.on('error',()=>bad('browser_worker_failed'));child.on('exit',()=>bad('browser_worker_failed'));child.stderr.on('data',(chunk:Buffer)=>{errorBytes+=chunk.length;if(errorBytes>BROWSER_PROTOCOL_LIMIT)bad('browser_protocol_invalid');});
 child.stdout.on('data',(chunk:Buffer)=>{buffer+=chunk.toString('utf8');if(Buffer.byteLength(buffer)>BROWSER_PROTOCOL_LIMIT){bad('browser_protocol_invalid');return;}const i=buffer.indexOf('\n');if(i<0)return;try{const raw=JSON.parse(buffer.slice(0,i));if(raw.requestId!==requestId||Object.keys(raw).some(k=>k!=='requestId'&&k!=='results')||!Array.isArray(raw.results)||raw.results.length!==1)throw Error();const result=lightPollutionResultSchema.parse(raw.results[0]);if(result.candidateId!==point.candidateId||result.sourceId!==sourceId||result.transport!=='browser'||result.requestedPoint.latitude!==point.latitude||result.requestedPoint.longitude!==point.longitude)throw Error();finish(result);}catch{bad('browser_protocol_invalid');}});
 child.stdin.on('error',()=>bad('browser_worker_failed'));child.stdin.write(JSON.stringify({requestId,sourceId,points:[point]})+'\n');
 });
}
type Runner=(point:LightPollutionPoint,signal:AbortSignal)=>Promise<LightPollutionResult>;
interface BoundaryOptions {enabled?:boolean;run?:Runner;comparisonMs?:number;pointMs?:number;sourceId?:LightPollutionResult['sourceId']}
interface Job {sourceId:LightPollutionResult['sourceId'];points:LightPollutionPoint[];signal?:AbortSignal;resolve:(r:LightPollutionResult[])=>void;controller:AbortController;timer:ReturnType<typeof setTimeout>;abort:()=>void;results:LightPollutionResult[];done:boolean}
export class BrowserBoundary {
 private queue:Job[]=[];private active?:Job;private closed=false;private running?:Promise<void>;
 constructor(private options:BoundaryOptions={}){}
 compare(points:LightPollutionPoint[],signal?:AbortSignal,sourceId:LightPollutionResult['sourceId']=this.options.sourceId??'lightpollutionmap'):Promise<LightPollutionResult[]>{
 const checked=lightPollutionPointsSchema.parse(points);const unavailable=(code:string)=>checked.map(p=>browserUnavailable(p,code,sourceId));
 if(!this.options.enabled||this.closed)return Promise.resolve(unavailable('browser_not_admitted'));
 if(signal?.aborted)return Promise.resolve(unavailable('browser_cancelled'));
 if(this.active&&this.queue.length>=2)return Promise.resolve(unavailable('browser_busy'));
 return new Promise(resolve=>{const job={} as Job;Object.assign(job,{sourceId,points:checked,signal,resolve,controller:new AbortController(),results:[],done:false});job.abort=()=>this.finish(job,'browser_cancelled');job.timer=setTimeout(()=>this.finish(job,'browser_timeout'),Math.min(this.options.comparisonMs??90000,90000));signal?.addEventListener('abort',job.abort,{once:true});this.queue.push(job);this.drain();});
 }
 private finish(job:Job,code:string){if(job.done)return;job.done=true;clearTimeout(job.timer);job.signal?.removeEventListener('abort',job.abort);job.controller.abort();this.queue=this.queue.filter(j=>j!==job);job.resolve(job.points.map((p,i)=>job.results[i]??browserUnavailable(p,code,job.sourceId)));if(this.active!==job)this.drain();}
 private drain(){if(this.active||this.closed)return;const job=this.queue.shift();if(!job)return;this.active=job;this.running=this.execute(job);}
 private async execute(job:Job){
 for(const point of job.points){if(job.done){if(this.active===job)this.active=undefined;this.drain();return;}const controller=new AbortController();let expired=false;const abort=()=>controller.abort();job.controller.signal.addEventListener('abort',abort,{once:true});const timer=setTimeout(()=>{expired=true;controller.abort();},Math.min(this.options.pointMs??30000,30000));
 let running:Promise<LightPollutionResult>|undefined;try{const runner=this.options.run??((p,s)=>runBrowserChild(p,s,job.sourceId));const result=await new Promise<LightPollutionResult>((resolve,reject)=>{controller.signal.addEventListener('abort',()=>reject(Error('cancelled')),{once:true});running=Promise.resolve().then(()=>runner(point,controller.signal));running.then(resolve,reject);});if(!job.done){const r=lightPollutionResultSchema.parse(result);job.results.push(r.candidateId===point.candidateId&&r.sourceId===job.sourceId&&r.transport==='browser'&&r.requestedPoint.latitude===point.latitude&&r.requestedPoint.longitude===point.longitude?r:browserUnavailable(point,'browser_protocol_invalid',job.sourceId));}}
 catch{if(!job.done)job.results.push(browserUnavailable(point,expired?'browser_timeout':'browser_worker_failed',job.sourceId));}
 finally{clearTimeout(timer);job.controller.signal.removeEventListener('abort',abort);if(!this.options.run&&running)await running.catch(()=>{});}
 }
 this.finish(job,'browser_worker_failed');if(this.active===job)this.active=undefined;this.drain();
 }
 async close():Promise<void>{this.closed=true;if(this.active)this.finish(this.active,'browser_cancelled');for(const job of [...this.queue])this.finish(job,'browser_cancelled');await this.running;}
}
export function createLightpollutionmapBrowserProvider(boundary=new BrowserBoundary()):LightPollutionProvider{return {sourceId:'lightpollutionmap',transport:'browser',lookup:async(point,signal)=>(await boundary.compare([point],signal))[0],lookupMany:(points,signal)=>boundary.compare(points,signal)};}

export function createLightPollutionBrowserProviders(env:NodeJS.ProcessEnv=process.env):{providers:LightPollutionProvider[];boundaries:Record<'lightpollutionmap'|'darkskysites',BrowserBoundary>;close():Promise<void>} {
 const scheduler=new BrowserBoundary({enabled:env.NIGHTSKY_LIGHT_POLLUTION_BROWSER_ENABLED==='true'});const boundaries={lightpollutionmap:scheduler,darkskysites:scheduler};
 const providers:LightPollutionProvider[]=[createLightpollutionmapBrowserProvider(boundaries.lightpollutionmap),{sourceId:'darkskysites',transport:'browser',lookup:async(point,signal)=>(await boundaries.darkskysites.compare([point],signal,'darkskysites'))[0],lookupMany:(points,signal)=>boundaries.darkskysites.compare(points,signal,'darkskysites')}];
 return {providers,boundaries,close:async()=>{await scheduler.close();}};
}
