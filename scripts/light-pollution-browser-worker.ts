import { pathToFileURL } from 'node:url';
import { setTimeout as delay } from 'node:timers/promises';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { BROWSER_PROTOCOL_LIMIT, browserUnavailable, decodeBrowserRequest, parseLightpollutionmapEvidence, validateResourceUrl } from '../server/providers/lightPollution/browser';
import type { LightPollutionPoint, LightPollutionResult } from '../shared/nightsky/lightPollution';
interface VisibleLocator {fill(value:string):Promise<void>;press(key:string):Promise<void>;count():Promise<number>;isVisible():Promise<boolean>;innerText():Promise<string>}
export interface VisiblePage {locator(selector:string):VisibleLocator}
/** Uses only previously observed controls. Text grammar still needs a live acceptance fixture. */
export async function readLightpollutionmapPage(page:VisiblePage,point:LightPollutionPoint,signal:AbortSignal,deadlineMs=30000):Promise<LightPollutionResult>{
 const popup=page.locator('#popup');const previousText=await popup.count()===1&&await popup.isVisible()?await popup.innerText():'';
 if(signal.aborted)return browserUnavailable(point,'browser_cancelled');
 await page.locator('#searchBox').fill(`${point.latitude}, ${point.longitude}`);await page.locator('#searchBox').press('Enter');
 const until=Date.now()+Math.min(deadlineMs,30000);
 while(Date.now()<until&&!signal.aborted){const count=await popup.count();if(count>1)return browserUnavailable(point,'ambiguous_evidence');if(count===1&&await popup.isVisible()){const text=await popup.innerText();const result=parseLightpollutionmapEvidence(point,{text,previousText,fresh:text!==previousText,selectedCount:count});if(result.status==='available'||result.errorCode==='browser_access_challenge')return result;}
 try{await delay(Math.min(10,Math.max(1,until-Date.now())),undefined,{signal});}catch{break;}}
 return browserUnavailable(point,signal.aborted?'browser_cancelled':'coordinate_binding_failed');
}
/** Dormant fixed-site workflow. Caller must enforce deployment egress; public dispatcher never admits it yet. */
export async function runLightpollutionmapWorkflow(point:LightPollutionPoint,signal:AbortSignal):Promise<LightPollutionResult>{
 // No browser dependency is imported by the API or the unadmitted worker path.
 const packageName='playwright-core';const {chromium}=await import(packageName);
 const root=await mkdtemp(join(tmpdir(),'nightsky-browser-'));let browser:any;let context:any;
 const close=()=>{void context?.close().catch(()=>{});void browser?.close().catch(()=>{});};signal.addEventListener('abort',close,{once:true});
 try{
 if(signal.aborted)return browserUnavailable(point,'browser_cancelled');
 browser=await chromium.launch({headless:true,downloadsPath:root,env:{},chromiumSandbox:true});
 context=await browser.newContext({acceptDownloads:false,serviceWorkers:'block',permissions:[],storageState:{cookies:[],origins:[]}});
 // DNS checks are defense in depth only, not socket-level rebinding protection.
 await context.route('**/*',async(route:any)=>{if(await validateResourceUrl(route.request().url()))await route.continue();else await route.abort('blockedbyclient');});
 // WebSockets are not needed for admitted origins; never permit an un-routed socket.
 await context.routeWebSocket('**/*',(socket:any)=>socket.close());
 const page=await context.newPage();page.setDefaultTimeout(30000);await page.goto('https://www.lightpollutionmap.info/',{waitUntil:'domcontentloaded',timeout:30000});
 return await readLightpollutionmapPage(page,point,signal);
 }finally{signal.removeEventListener('abort',close);await context?.close().catch(()=>{});await browser?.close().catch(()=>{});await rm(root,{recursive:true,force:true});}
}
export function startBrowserWorker():void {
 let buffer='',handled=false;const parent=process.ppid;const controller=new AbortController();
 const cleanup=()=>{controller.abort();clearInterval(parentWatch);process.exit(0);};
 const parentWatch=setInterval(()=>{if(process.ppid!==parent||process.ppid===1)cleanup();else try{process.kill(parent,0);}catch{cleanup();}},1000);parentWatch.unref();
 process.on('SIGTERM',cleanup);process.on('SIGINT',cleanup);process.on('disconnect',cleanup);process.stdin.on('end',cleanup);
 process.stdin.on('data',(chunk:Buffer)=>{if(handled)return;buffer+=chunk.toString('utf8');if(Buffer.byteLength(buffer)>BROWSER_PROTOCOL_LIMIT){process.exitCode=2;process.stdin.destroy();clearInterval(parentWatch);return;}const i=buffer.indexOf('\n');if(i<0)return;handled=true;
 try{if(buffer.slice(i+1).trim())throw Error();const request=decodeBrowserRequest(buffer.slice(0,i));
 // Immutable fail-closed public gate: rights, exact live binding, complete resource inventory,
 // deployment socket egress enforcement, process memory limits and host capacity are unverified.
 const results=request.points.map(point=>browserUnavailable(point,'browser_not_admitted',request.sourceId));const line=JSON.stringify({requestId:request.requestId,results})+'\n';if(Buffer.byteLength(line)>BROWSER_PROTOCOL_LIMIT)throw Error();process.stdout.write(line,()=>cleanup());
 }catch{process.exitCode=2;process.stdin.destroy();clearInterval(parentWatch);}
 });
}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href)startBrowserWorker();
