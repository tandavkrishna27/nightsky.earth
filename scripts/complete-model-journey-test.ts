/** Opt-in local CLI rehearsal. Imports never start a model or server.
 * --api-fixture uses fake API responses and real selection/discovery/planning;
 * the default retains legacy catalogue fixtures. Either mode still requires
 * explicit --run for model execution and is not native acceptance evidence.
 */
import { spawn } from 'node:child_process';
import { mkdirSync, writeFileSync, readFileSync, existsSync, mkdtempSync } from 'node:fs';
import { resolve, relative, isAbsolute } from 'node:path';
import { pathToFileURL } from 'node:url';
import { once } from 'node:events';
import { createServer } from 'node:http';
import express from 'express';
import { unzipSync, strFromU8 } from 'fflate';
import { mountMcpRoute } from '../server/mcp/route';
import { GeoNamesPlaceIndex } from '../server/places/geonames';
import { buildGlobalCatalogue } from './osm/build-global-catalogue';
import { loadCatalogueFiles } from '../server/places/catalogueFiles';
import { createGlobalCatalogue } from '../server/places/globalCatalogue';
import { buildLocalPluginPackage } from './build-local-plugin-package';
import { createApiServices } from '../server/places/api/configuration';
import type { NightSkyDependencies } from '../server/mcp/registerTools';

export type LoadingMode='native'|'prompt-fed';
export const limits={deadlineMs:120000,shutdownMs:5000,calls:12,stdout:250*1024,stderr:32*1024,batchMs:30*60*1000};
export const journeys=[
 ['casual','What can I see tonight as a casual sky gazer in Fictionvale?'],
 ['learner','Teach a beginner what to look for tonight in Fictionvale.'],
 ['family','Plan a short family astronomy outing with children in Fictionvale.'],
 ['urban','Can I observe Jupiter from urban Fictionvale tonight?'],
 ['meteor','Plan an Orionids meteor session from Fictionvale.'],
 ['milky-way','Plan Milky Way photography in Synthetic Sydney.'],
 ['first-photo','I am taking my first sky photograph in Synthetic Sydney. Help me prepare.'],
 ['telescope','Plan visual telescope observations of Jupiter from Fictionvale.'],
 ['deep-sky','Plan deep sky imaging of M31 in Synthetic Sydney; explain supported evidence.'],
 ['moon','Plan Moon viewing from Fictionvale.'],
 ['aurora','Can I see aurora from Synthetic Tromso tonight?'],
 ['eclipse','Help me safely observe an eclipse from Synthetic Sydney; is one confirmed?'],
 ['long-ahead','Plan February 15 2027 stargazing from Synthetic Sydney using historical conditions.'],
 ['replan','Replan tonight in Fictionvale after checking the newest forecast.'],
 ['access','Find a wheelchair accessible observing place near Fictionvale and plan an outing.'],
 ['intersection','Find observing candidates within Synthetic State, Synthetic Country and near Fictionvale.'],
 ['multi-origin','Compare observing candidates near Fictionvale and Synthetic Sydney, with distance limits and exclusions.'],
 ['selected','Choose an observing candidate near Fictionvale and plan then revise the outing using its timezone.'],
 ['host-boundary','Find a spot near me. I have supplied no host location hint or city.'],
 ['unsupported-boundary','Use raw GPS coordinates for a route and set a recurring observing reminder. Explain what is supported.'],
].map(([id,prompt])=>({id,prompt:`${prompt} Date: 2026-10-15; use 18:00Z to 06:00Z next day unless another date is requested. All fixture places/data are synthetic. Use the NightSky package workflow and local tools. Answer in at most 250 words.`}));
export function validateExecution(args:string[],count:number){if(!args.includes('--run'))throw Error('Model execution requires explicit --run');if(count>20||count<1)throw Error('Batch requires 1 to 20 cases');}
export function sanitize(value:string){return value.replace(/Bearer\s+\S+/gi,'Bearer [redacted]').replace(/sk-[\w-]+/g,'[redacted]').replace(/[A-Z]:\\Users\\[^\s"\n]+/gi,'[local path]').replace(/[\w.+-]+@[\w.-]+\.[A-Za-z]+/g,'[account redacted]');}
export class EvidenceBudget {
 stdout=Buffer.alloc(0);stderr=Buffer.alloc(0);traces:Array<{tool:string;args:unknown}>=[];
 call(tool:string,args:unknown){if(this.traces.length>=limits.calls)throw Error('MCP call cap');this.traces.push({tool,args});}
 capture(stream:'stdout'|'stderr',bytes:Buffer){if(this[stream].length+bytes.length>limits[stream])throw Error(`${stream} byte cap`);this[stream]=Buffer.concat([this[stream],bytes]);}
}
export function remainingCases(ids:string[],records:Array<{id:string;status:string;attempt?:number}>){return ids.filter(id=>{if(records.some(r=>r.id===id&&r.status==='passed'))return false;if(records.filter(r=>r.id===id).some(r=>(r.attempt??1)>=2))throw Error('Diagnostic retry cap reached');return true;});}
export function assertContained(root:string,path:string){const target=resolve(root,path),r=relative(resolve(root),target);if(!r||r.startsWith('..')||isAbsolute(r))throw Error('Path outside task folder');return target;}
export function validateResume(base:string,folder:string){return assertContained(base,resolve(folder));}
export function buildClientCommand(client:'codex'|'claude',mode:LoadingMode,pkg:string,config:string,prompt:string,nativeConfigured=false):string[]{
 if(client==='claude')return ['--print','--verbose','--output-format','stream-json','--no-session-persistence','--no-chrome','--permission-mode','dontAsk','--setting-sources','','--settings','{"disableAllHooks":true}','--strict-mcp-config','--mcp-config',config,'--tools','Skill,Read','--allowedTools','Skill,Read,mcp__nightsky__*',...(mode==='native'?['--plugin-dir',pkg]:['--append-system-prompt',pkg]),prompt];
 if(mode==='native'&&!nativeConfigured)throw Error('Codex native loading requires verified local marketplace configuration; prompt-fed evidence is insufficient');
 return ['exec','--ignore-user-config','--ignore-rules','--ephemeral','--skip-git-repo-check','--json','-s','read-only',...(mode==='prompt-fed'?['-c',`model_instructions_file=${JSON.stringify(pkg)}`,'-c','features.skip_host_skill_discovery=true']:[]),'-c','web_search="disabled"','-c','features.shell_tool=false','-c',`features.plugins=${mode==='native'}`,'-c','features.hooks=false','-c','features.apps=false','-c','features.multi_agent=false','-c','features.browser_use=false','-c','features.computer_use=false','-c','features.memories=false','-c',config,prompt];
}
/** One child at a time; reject cap breaches and terminate Windows descendants. */
export async function boundedChild(command:string,args:string[],cwd:string,deadlineMs=limits.deadlineMs){
 const budget=new EvidenceBudget();const started=Date.now();
 return await new Promise<{code:number|null;reason:string;stdout:string;stderr:string;elapsedMs:number}>(done=>{
  const child=spawn(command,args,{cwd,windowsHide:true,stdio:['ignore','pipe','pipe']});let reason='',settled=false;let shutdown:ReturnType<typeof setTimeout>|undefined;
  const finish=(code:number|null)=>{if(settled)return;settled=true;clearTimeout(timer);clearTimeout(shutdown);done({code,reason,stdout:budget.stdout.toString(),stderr:sanitize(budget.stderr.toString()),elapsedMs:Date.now()-started});};
  const stop=(why:string)=>{if(reason)return;reason=why;if(process.platform==='win32'&&child.pid){const killer=spawn('taskkill',['/PID',String(child.pid),'/T','/F'],{windowsHide:true,stdio:'ignore'});killer.on('error',()=>child.kill());}else child.kill();shutdown=setTimeout(()=>{child.kill();child.stdout.destroy();child.stderr.destroy();child.unref();finish(null);},limits.shutdownMs);};
  const timer=setTimeout(()=>stop('deadline'),deadlineMs);
  for(const stream of ['stdout','stderr'] as const)child[stream].on('data',(b:Buffer)=>{try{budget.capture(stream,b);}catch{stop(`${stream} byte cap`);}});
  child.on('error',()=>{reason='CLI startup failed';finish(1);});child.on('close',finish);
 });
}
export function checkpoint(path:string,records:unknown[]){mkdirSync(resolve(path,'..'),{recursive:true});writeFileSync(path,JSON.stringify({updatedAt:new Date().toISOString(),records},null,2)+'\n');}
export function readCheckpoint(path:string):Array<{id:string;status:string}>{return existsSync(path)?JSON.parse(readFileSync(path,'utf8')).records:[];}

async function catalogueFixtureDependencies(root:string){
 const cities=new GeoNamesPlaceIndex([[990001,'Fictionvale','Fictionvale','',51.5,-.12,'GB','Synthetic Country',0,'Europe/London'],[990002,'Synthetic Sydney','Synthetic Sydney','',-33.87,151.21,'AU','Synthetic Australia',0,'Australia/Sydney'],[990003,'Synthetic Tromso','Synthetic Tromso','',69.65,18.96,'NO','Synthetic Norway',0,'Europe/Oslo']],'synthetic-model-only');
 const source={name:'Synthetic catalogue',url:'https://example.test/synthetic-catalogue',attribution:'Invented local fixture only',dataClass:'catalog' as const,vintage:'synthetic-2026'};
 const regions=[{regionId:'region:v1:synthetic-country',name:'Synthetic Country',countryCode:'GBR',adminLevel:0 as const,boundaryRevision:'synthetic-v1',sources:[source]},{regionId:'region:v1:synthetic-state',name:'Synthetic State',countryCode:'GBR',adminLevel:1 as const,boundaryRevision:'synthetic-v1',sources:[source]}];
 const candidates=[{placeId:'place:v1:osm:node:990001',name:'Fiction Park',category:'park' as const,latitude:51.52,longitude:-.1,accessEvidence:{status:'unknown' as const},sources:[source],caveats:['Synthetic fixture; access and sky quality unverified'],catalogueRevision:'synthetic-v1',sourceCompleteness:1,countryCode:'GBR',regionIds:regions.map(r=>r.regionId)}];
 const built=await buildGlobalCatalogue({catalogueRevision:'synthetic-v1',candidates,regions,footprints:[{geometryBasis:'full-cell',footprintId:'synthetic-cell',bounds:{south:51,north:52,west:-1,east:0},sources:[source],vintage:'synthetic',regionIds:regions.map(r=>r.regionId)}]},assertContained(root,'catalogue'));
 const catalogue=createGlobalCatalogue(await loadCatalogueFiles(built.path,{expectedSha256:built.sha256}),{cities});
 return {placeIndex:cities,catalogue,regionIndex:catalogue.regions};
}
export type FixtureMode = 'catalogue' | 'api';
export const fixtureClockStart = '2026-10-15T12:00:00Z';
/** Fixture-only presentation. Never changes timestamps, selections or expiry checks. */
function describeSyntheticGeography<T>(value:T, now:number):T {
 const notice=`Synthetic offline fixture; no live Geoapify/GeoNames data. Simulated clock starts ${fixtureClockStart}, now ${new Date(now).toISOString()}; freshness uses this clock, not host wall-clock time. Expired selections still require resolution again. Dates are rehearsal dates, not tonight's forecast.`;
 const visit=(input:unknown):unknown=>{
  if(Array.isArray(input))return input.map(visit);
  if(!input || typeof input!=='object')return input;
  const record=Object.fromEntries(Object.entries(input).map(([key,item])=>[key,visit(item)]));
  if(typeof record.attribution==='string' && typeof record.dataClass==='string'){
   record.name=`Synthetic fixture (${record.name})`;
   record.attribution=notice;
   record.url='https://example.test/synthetic-geography';
   delete record.licenseUrl;
  }
  return record;
 };
 const result=visit(value) as T;
 const root=result as {availability?:{reason:string}};
 if(root.availability)root.availability.reason=`${notice} ${root.availability.reason}`;
 return result;
}
export function selectFixtureMode(args:string[]):FixtureMode { return args.includes('--api-fixture')?'api':'catalogue'; }
export function validateFixtureResume(records:Array<{fixtureMode?:string;id?:string}>, mode:FixtureMode){
 if(records.some(record=>(record.fixtureMode??'catalogue')!==mode)) throw Error('Cannot mix fixture modes in resumed evidence');
}
export async function createFixtureServer(root:string, options:{mode?:FixtureMode;port?:number;weatherApiNotice?:boolean;openWeatherCredit?:boolean} = {}){
 const fixtureMode = options.mode ?? 'catalogue';
 if (!['catalogue','api'].includes(fixtureMode)) throw Error('Unknown fixture mode');
 if(options.weatherApiNotice && options.openWeatherCredit) throw Error('Select one synthetic forecast source');
 let fixtureAttempts = 0;
 let logicalTime = Date.parse(fixtureClockStart);
 const apiFetcher:typeof fetch = async input => {
  if (++fixtureAttempts > 500) throw Error('API fixture transport cap');
  const url = new URL(String(input));
  const places = [
   {geonameId:990001,name:'Fictionvale',lat:51.5,lng:-.12,zone:'Europe/London'},
   {geonameId:990002,name:'Synthetic Sydney',lat:-33.87,lng:151.21,zone:'Australia/Sydney'},
   {geonameId:990003,name:'Synthetic Tromso',lat:69.65,lng:18.96,zone:'Europe/Oslo'},
  ];
  if(url.hostname==='secure.geonames.org'&&url.pathname==='/searchJSON'){
   const query=(url.searchParams.get('q')??'').toLowerCase();
   if(query==='synthetic provider outage') return Response.json({error:'Synthetic unavailable'}, {status:503});
   // GeoNames carries no trusted timezone in this adapter. Ordinary cities
   // intentionally fall back to Geoapify's source-supplied timezone field.
   return Response.json({geonames:query==='synthetic unknown zone'?[{geonameId:990004,name:'Synthetic Unknown Zone',lat:51.5,lng:-.12}]:[]});
  }
  if(url.hostname==='api.geoapify.com'&&['/v1/geocode/search','/v2/places'].includes(url.pathname)){
   const query=(url.searchParams.get('text')??url.searchParams.get('state')??url.searchParams.get('country')??'').toLowerCase();
   if(query==='synthetic provider outage') return Response.json({error:'Synthetic unavailable'}, {status:503});
   const city = places.find(p=>query===p.name.toLowerCase());
   const cityFeature = (p:typeof places[number], id=String(p.geonameId)) => ({type:'Feature',properties:{place_id:`synthetic-city-${id}`,name:p.name,timezone:{name:p.zone}},geometry:{type:'Point',coordinates:[p.lng,p.lat]}});
   if(url.pathname==='/v1/geocode/search'&&city) return Response.json({features:[cityFeature(city)]});
   if(query==='synthetic ambiguous') return Response.json({features:[cityFeature({...places[0],name:'Synthetic Ambiguous West'},'ambiguous-west'),cityFeature({...places[0],name:'Synthetic Ambiguous East',lng:.2},'ambiguous-east')]});
   if(query==='synthetic source conflict') return Response.json({features:[cityFeature(places[0]),cityFeature({...places[0],lng:1})]});
   const region=query==='synthetic country'?'country':query==='synthetic state'?'state':undefined;
   const filter=url.searchParams.get('filter')??'';
   const local = filter.startsWith('circle:-0.12,51.5,') || filter.startsWith('circle:-0.1,51.52,') || ['place:synthetic-country','place:synthetic-state'].includes(filter);
   const properties=region?{place_id:`synthetic-${region}`,name:`Synthetic ${region==='country'?'Country':'State'}`,result_type:region,country_code:'gb'}:{place_id:'synthetic-fiction-park',name:'Fiction Park',categories:['leisure.park'],timezone:{name:'Europe/London'}};
   return Response.json({features:(region||url.pathname==='/v2/places'&&local)?[{type:'Feature',properties,geometry:{type:'Point',coordinates:[-.1,51.52]}}]:[]});
  }
  throw Error('Unexpected API fixture request; no live fallback');
 };
 const api=createApiServices({geonamesUsername:'synthetic-fixture',geoapifyApiKey:'synthetic-fixture',userAgent:'NightSky offline journey (fixture@example.invalid)',fetcher:apiFetcher,now:()=>logicalTime+=1001});
 const dependencies:NightSkyDependencies = fixtureMode==='api'
  ? {discoveryProvider:{
      resolvePlace:async input=>describeSyntheticGeography(await api.discoveryProvider.resolvePlace(input),logicalTime),
      resolveRegion:async input=>describeSyntheticGeography(await api.discoveryProvider.resolveRegion(input),logicalTime),
      search:async input=>describeSyntheticGeography(await api.discoveryProvider.search(input),logicalTime),
      details:async input=>describeSyntheticGeography(await api.discoveryProvider.details(input),logicalTime),
     },selectedPlaceResolver:{resolve:async input=>describeSyntheticGeography(await api.selectedPlaceResolver.resolve(input),logicalTime)},
     placeIndexLoader:async()=>{throw Error('API fixture must not load local cities');}}
  : await catalogueFixtureDependencies(root);
 let external=0,id=0,revision=0;let budget=new EvidenceBudget();const app=express();app.use(express.json({limit:'32kb'}));
 app.use((req,res,next)=>{if(req.body?.method==='tools/call'){try{budget.call(req.body.params.name,req.body.params.arguments);}catch{res.status(429).end();return;}}next();});
 mountMcpRoute(app,{allowedHosts:['127.0.0.1'],...dependencies,resultCardPrototype:!!options.openWeatherCredit,maxRequestsPerWindow:1000,maxGlobalRequestsPerWindow:1000,
 fetcher:async()=>{external++;throw Error('External provider forbidden');},osmCandidateIndexLoader:async()=>undefined,
 plannerServices:{getClimatology:async()=>{throw Error('Synthetic historical context unavailable');}},
 weatherProvider:{getForecast:async(_place,window)=>window.startUtc.startsWith('2027')?{status:'out-of-horizon',reason:'Synthetic future forecast unavailable',source:{name:'Synthetic forecast',url:'https://example.test/forecast',attribution:'Invented local fixture; no actual provider request',dataClass:'forecast'}}:{status:'available',reason:'Synthetic fixture only',forecast:{availability:{status:'available',reason:'Synthetic fixture only'},source:options.openWeatherCredit?{name:'OpenWeather',url:'https://openweathermap.org/api/forecast5',attribution:'Synthetic fixture only; no OpenWeather request or real forecast.',dataClass:'forecast',issuedAt:revision?'2026-10-15T15:00:00Z':'2026-10-15T12:00:00Z'}:options.weatherApiNotice?{name:'WeatherAPI.com',url:'https://www.weatherapi.com/docs/forecast-api/',attribution:'WeatherAPI.com. Weather information is for general information. Forecasts are probabilistic and may be inaccurate for your location or time. Never use as the sole basis for personal safety, aviation, marine navigation, emergency planning or other safety-critical decisions; consult official meteorological services and relevant authorities. Synthetic fixture only; no WeatherAPI request or real forecast.',dataClass:'forecast',issuedAt:revision?'2026-10-15T15:00:00Z':'2026-10-15T12:00:00Z'}:{name:'Synthetic forecast',url:'https://example.test/forecast',attribution:'Invented local fixture; no visibility accuracy claim',dataClass:'forecast',issuedAt:revision?'2026-10-15T15:00:00Z':'2026-10-15T12:00:00Z'},forecastHorizonHours:48,samples:[{validAt:'2026-10-15T22:00:00Z',values:{totalCloudCover:{value:revision?85:12,unit:'%'}}}],missingFields:[{field:'visibility',reason:'Not supplied'}]}}},
 auroraProvider:async()=>{throw Error('Synthetic aurora unavailable');}});
 const server=createServer(app).listen(options.port ?? 0,'127.0.0.1');await once(server,'listening');const address=server.address();if(!address||typeof address==='string')throw Error('Loopback unavailable');const endpoint=`http://127.0.0.1:${address.port}/mcp`;
 return {endpoint,fixtureMode,get budget(){return budget;},fixtureAttempts:()=>fixtureAttempts,advanceFixtureTime:(milliseconds:number)=>{if(!Number.isSafeInteger(milliseconds)||milliseconds<0||milliseconds>86400000)throw Error('Invalid fixture clock advance');logicalTime+=milliseconds;},externalAttempts:()=>external,beginCase:(name:string)=>{budget=new EvidenceBudget();revision=name==='replan'?1:0;},rpc:async(method:string,params:unknown)=>{const response=await fetch(endpoint,{method:'POST',headers:{'content-type':'application/json',accept:'application/json, text/event-stream','mcp-protocol-version':'2025-11-25'},body:JSON.stringify({jsonrpc:'2.0',id:++id,method,params})});const raw=await response.text();const line=raw.split('\n').find(l=>l.startsWith('data: '));return JSON.parse(line?line.slice(6):raw);},close:async()=>{server.closeAllConnections();await new Promise<void>(r=>server.close(()=>r()));}};
}
export function materializePackages(root:string,endpoint:string){
 const result={} as Record<'codex'|'claude',{directory:string;sha256:string}>;
 for(const host of ['codex','claude'] as const){const pkg=buildLocalPluginPackage({host,endpoint});const directory=assertContained(root,`plugins/${host}`);mkdirSync(directory,{recursive:true});for(const [path,bytes]of Object.entries(unzipSync(pkg.zip))){const target=assertContained(directory,path);mkdirSync(resolve(target,'..'),{recursive:true});writeFileSync(target,bytes);}result[host]={directory,sha256:pkg.sha256};}
 return result;
}
export function nativeSkillFor(id: string): string {
 return ['milky-way','first-photo','deep-sky'].includes(id) ? 'plan-astrophotography'
  : ['meteor','eclipse'].includes(id) ? 'plan-sky-event'
  : id === 'family' ? 'prepare-outing'
  : ['access','intersection','multi-origin','host-boundary','unsupported-boundary'].includes(id) ? 'find-observing-place'
  : 'plan-stargazing-night';
}
export function nativeClaudePrompt(id: string, prompt: string): string {
 return `First invoke the Skill tool with skill="nightsky:${nativeSkillFor(id)}" and Read its entire bundled references/workflow.md without offset or limit. Follow that actual packaged workflow, not copied prompt-fed instructions. Then answer: ${prompt}`;
}
export function selectJourneyIds(args: string[]): string[] {
 if (!args.includes('--cases')) return journeys.map(journey => journey.id);
 if (args.filter(arg => arg === '--cases').length !== 1) throw Error('Select unique known journey IDs');
 const ids = (args[args.indexOf('--cases') + 1] ?? '').split(',');
 if (!ids.length || ids.some(id => !journeys.some(journey => journey.id === id))) throw Error('Select known journey IDs');
 if (new Set(ids).size !== ids.length) throw Error('Select unique journey IDs');
 return ids;
}
export function nativeClaudeLoading(events: any[], id: string, packageDirectory: string) {
 const blocks = events.flatMap(event => Array.isArray(event.message?.content) ? event.message.content : []);
 const uses = blocks.filter(block => block.type === 'tool_use');
 const results = blocks.filter(block => block.type === 'tool_result');
 const succeeded = (use: any) => results.some(result => result.tool_use_id === use.id && !result.is_error);
 const skill = nativeSkillFor(id);
 const reference = resolve(packageDirectory, `skills/${skill}/references/workflow.md`);
 const skillFile = resolve(packageDirectory, `skills/${skill}/SKILL.md`);
 const reads = uses.filter(use => use.name === 'Read');
 const readPath = (use: any) => typeof use.input?.file_path === 'string' ? resolve(use.input.file_path) : '';
 const normalizeRead = (text: string) => text.split(/\r?\n/).map(line => line.replace(/^\s*\d+[→\t]\s?/, '').trim()).filter(Boolean).join('\n');
 const expected = existsSync(reference) ? normalizeRead(readFileSync(reference, 'utf8')) : '';
 const completeReference = (use: any) => {
  if (use.input?.offset !== undefined || use.input?.limit !== undefined || !expected) return false;
  return results.some(result => {
   if (result.tool_use_id !== use.id || result.is_error) return false;
   const text = typeof result.content === 'string' ? result.content : Array.isArray(result.content) ? result.content.filter((block: any) => block.type === 'text').map((block: any) => block.text).join('\n') : '';
   return normalizeRead(text).includes(expected);
  });
 };
 return {
  skillInvoked: uses.some(use => use.name === 'Skill' && use.input?.skill === `nightsky:${skill}` && succeeded(use)),
  referenceRead: reads.some(use => readPath(use) === reference && completeReference(use)),
  allowedOnly: reads.every(use => [reference, skillFile].includes(readPath(use))) && uses.every(use => use.name === 'Read' || use.name.startsWith('mcp__nightsky__') || (use.name === 'Skill' && use.input?.skill === `nightsky:${skill}`)),
 };
}
async function main(){
 const args=process.argv.slice(2);const selectedIds=selectJourneyIds(args);validateExecution(args,selectedIds.length);
 const client=args.includes('--claude')?'claude':'codex';const mode:LoadingMode=args.includes('--prompt-fed')?'prompt-fed':'native';
 const base=resolve('.superpowers/sdd/2026-10-15-nightsky-global-discovery/model-rehearsal');mkdirSync(base,{recursive:true});const resume=args[args.indexOf('--resume')+1];const root=args.includes('--resume')?validateResume(base,resume):mkdtempSync(resolve(base,`${client}-`));
 const fixtureMode=selectFixtureMode(args);const records:any[]=args.includes('--resume')?readCheckpoint(resolve(root,'checkpoint.json')):[];
 validateFixtureResume(records,fixtureMode);
 const server=await createFixtureServer(root,{mode:fixtureMode});const started=Date.now();
 try{
  const inventory=await server.rpc('tools/list',{});if(inventory.result?.tools?.length!==14)throw Error('Complete fourteen-tool backend required');
  const packages=materializePackages(root,server.endpoint);writeFileSync(resolve(root,'packages.json'),JSON.stringify(packages,null,2));
  const cfg=resolve(root,'mcp.json');writeFileSync(cfg,JSON.stringify({mcpServers:{nightsky:{type:'http',url:server.endpoint}}}));
  const instructions=resolve(root,'instructions.txt');const files=unzipSync(buildLocalPluginPackage({host:'codex',endpoint:server.endpoint}).zip);writeFileSync(instructions,'Use only NightSky MCP tools and minimum read-only skill/resource access. No shell, edits, browsing, other services or background agents. Every place and forecast here is synthetic. Preserve unavailable/partial access, weather, historical and event limitations. Do not infer host location or guarantee observations. At most 12 calls and 250 words. The complete package skill content below is prompt-fed evidence, not native loading proof.\n\n'+Object.entries(files).filter(([p])=>p.endsWith('.md')).map(([p,b])=>`${p}\n${strFromU8(b)}`).join('\n\n'));
  if(client==='codex'&&mode==='native'){
   mkdirSync(resolve(root,'.agents/plugins'),{recursive:true});mkdirSync(resolve(root,'.codex'),{recursive:true});
   writeFileSync(resolve(root,'.agents/plugins/marketplace.json'),JSON.stringify({name:'nightsky-model-rehearsal',interface:{displayName:'NightSky task rehearsal'},plugins:[{name:'nightsky',source:{source:'local',path:'./plugins/codex'},policy:{installation:'INSTALLED_BY_DEFAULT',authentication:'ON_INSTALL'},category:'Productivity'}]},null,2));
   writeFileSync(resolve(root,'.codex/config.toml'),'[plugins."nightsky@nightsky-model-rehearsal"]\nenabled = true\n');
  }
  const cli=resolve(process.env.APPDATA??'',client==='codex'?'npm/node_modules/@openai/codex/bin/codex.js':'npm/node_modules/@anthropic-ai/claude-code/bin/claude.exe');
  const pending=remainingCases(selectedIds,records);const requested=journeys.filter(j=>selectedIds.includes(j.id));const selected=(args.includes('--preflight')?requested.slice(0,1):requested).filter(j=>pending.includes(j.id));
  for(const journey of selected){
   if(Date.now()-started>limits.batchMs)break;server.beginCase(journey.id);
   const config=client==='claude'?cfg:`mcp_servers={nightsky={url="${server.endpoint}",required=true,tool_timeout_sec=15}}`;
   const prompt=client==='claude'&&mode==='native'?nativeClaudePrompt(journey.id,journey.prompt):journey.prompt;
   const commandArgs=buildClientCommand(client,mode,mode==='native'?packages[client].directory:client==='claude'?readFileSync(instructions,'utf8'):instructions,config,prompt,mode==='native');
   const result=await boundedChild(client==='codex'?process.execPath:cli,client==='codex'?[cli,...commandArgs]:commandArgs,root);
   const events=result.stdout.split(/\r?\n/).flatMap(l=>{try{return[JSON.parse(l)];}catch{return[];}});
   const answer=client==='codex'?events.filter(e=>e.type==='item.completed'&&e.item?.type==='agent_message').map(e=>e.item.text).join('\n'):events.filter(e=>e.type==='result').map(e=>e.result??'').join('\n');
   const loadingEvidence=events.filter(e=>e.type==='system'||e.item?.type==='tool_search'||e.item?.type==='mcp_tool_call'||e.message?.content?.some?.((c:any)=>c.type==='tool_use'&&c.name==='Skill'));
   const nativeLoading=client==='claude'&&mode==='native'?nativeClaudeLoading(events,journey.id,packages.claude.directory):undefined;
   const loadingComplete=!nativeLoading||(nativeLoading.skillInvoked&&nativeLoading.referenceRead&&nativeLoading.allowedOnly);
   records.push({id:journey.id,fixtureMode,fixtureAttempts:server.fixtureAttempts(),attempt:records.filter(r=>r.id===journey.id).length+1,runAt:new Date().toISOString(),client,loadingMode:mode,status:result.code===0&&answer&&loadingComplete?'manual-review':'blocked',transportComplete:result.code===0&&!result.reason,nativeLoading,answer:sanitize(answer),traces:server.budget.traces,loadingEvidence:JSON.parse(sanitize(JSON.stringify(loadingEvidence))),model:events.find(e=>e.model)?.model??null,...result,stdout:sanitize(result.stdout),externalAttempts:server.externalAttempts()});
   checkpoint(resolve(root,'checkpoint.json'),records);console.log(JSON.stringify({client,id:journey.id,status:records.at(-1).status,toolCalls:server.budget.traces.length,reason:result.reason}));
   if(!answer||result.reason||!loadingComplete)break;
  }
  writeFileSync(resolve(root,'complete-model-report.md'),`# Complete model rehearsal\n\nDate: ${new Date().toISOString()}\nClient: ${client}; requested loading: ${mode}; fixture mode: ${fixtureMode}.\nComplete packages: five skills each; backend: thirteen core tools.\nExternal provider attempts: ${server.externalAttempts()}; synthetic API transport attempts: ${server.fixtureAttempts()}.\nAPI fixtures use an advancing synthetic provider clock; they do not measure provider pacing or live performance. Catalogue and API results must not be combined as one acceptance run.\nCases recorded: ${records.length}. Whole answers and skill loading require manual review in checkpoint.json; transport success is not semantic success. Native loading has not been claimed by this runner.\n`);console.log(JSON.stringify({evidenceFolder:root,client,mode,fixtureMode,cases:records.length}));
 }finally{await server.close();}
}
if(process.argv[1]&&import.meta.url===pathToFileURL(resolve(process.argv[1])).href)main().catch(e=>{console.error(sanitize(e.message));process.exitCode=1;});
