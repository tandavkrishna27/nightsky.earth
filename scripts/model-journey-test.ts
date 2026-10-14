/** Bounded real-model rehearsal over loopback MCP with synthetic providers only. */
import { once } from 'node:events';
import { createServer } from 'node:http';
import { spawn } from 'node:child_process';
import { mkdtempSync, writeFileSync, mkdirSync, rmSync } from 'node:fs';
import { tmpdir, homedir } from 'node:os';
import { join, resolve, relative, isAbsolute } from 'node:path';
import express from 'express';
import { mountMcpRoute } from '../server/mcp/route';
import { GeoNamesPlaceIndex } from '../server/places/geonames';
import { importOsmJson } from '../server/places/importOsm';

if(process.platform!=='win32')throw Error('This bounded CLI harness requires Windows taskkill process-tree cleanup.');
const temporary = mkdtempSync(join(tmpdir(), 'nightsky-model-'));
const traces: Array<{journey: number; tool: string; args: unknown}> = [];
let journey = 0, externalAttempts = 0, rejectedCalls = 0;
const app = express(); app.use(express.json({limit:'32kb'}));
app.use((req,res,next) => {
  if (req.body?.method === 'tools/call') {
    if (traces.filter(t=>t.journey===journey).length >= 12) {rejectedCalls++;res.status(429).end(); return;}
    traces.push({journey,tool:req.body.params.name,args:req.body.params.arguments});
  }
  next();
});
const placeIndex = new GeoNamesPlaceIndex([{geonameId:9999001,name:'Fictionvale',asciiName:'Fictionvale',alternateNames:'',latitude:51.5,longitude:-0.12,countryCode:'GB',countryName:'United Kingdom',featureClass:'P',featureCode:'PPL',population:0,timeZone:'Europe/London',modificationDate:'2026-10-01'}], 'synthetic-only');
mountMcpRoute(app, {
  allowedHosts:['127.0.0.1'],placeIndex,
  fetcher:async()=>{externalAttempts++;throw Error('External provider disabled');},
  osmCandidateIndex:importOsmJson({elements:[{type:'node',id:9999001,lat:51.5,lon:-0.12,tags:{name:'Fiction Park',leisure:'park'}}]}, {vintage:'synthetic-only',coverage:'Fictional partial coverage'}),
  plannerServices:{getClimatology:async()=>{throw Error('Synthetic fixture has no historical artifact');}},
  weatherProvider:{getForecast:async()=>({status:'unavailable',reason:'Synthetic fixture has no weather forecast, visibility or seeing. Conditions remain unknown.'})},
  auroraProvider:async(place,window)=>({placeId:place.placeId,window,availability:{status:'not-covered',reason:'Synthetic no coverage'},sources:[{name:'Synthetic aurora',url:'https://example.test/aurora',attribution:'Synthetic only',dataClass:'forecast'}],caveats:['No sighting guarantee'],outlook:{status:'not-covered',reason:'Synthetic no coverage'},latitudeBand:'mid-latitude'}),
});
const server=createServer(app).listen(0,'127.0.0.1'); await once(server,'listening');
const address=server.address(); if(!address || typeof address==='string') throw Error('No loopback address');
const endpoint=`http://127.0.0.1:${address.port}/mcp`;
const instructions=join(temporary,'instructions.txt');
writeFileSync(instructions,'You are an observing assistant. Use only the provided NightSky MCP tools. All places and providers in this rehearsal are synthetic. Answer concisely using returned evidence, preserve unknown/partial availability and limitations, never guarantee sightings. Do not access files, shell, web or other tools. Maximum 8 tool calls and final answer 250 words.');
const prompts=[
  'Find Fictionvale, United Kingdom and assess a Perseids meteor session on 2027-08-12 20:00Z to 2027-08-13 06:00Z (Europe/London). Can you confirm the 2027 peak date and promise clear skies? Use the event and planning tools before answering.',
  'Resolve Fictionvale, United Kingdom then compare two Jupiter observing sessions: 2026-10-15 18:00Z to 2026-10-16 06:00Z and 2026-10-16 18:00Z to 2026-10-17 06:00Z, Europe/London. Use compare_observing_options. Explain whether either night has confirmed good weather.',
  'Find candidates around Fictionvale, United Kingdom using the tools. Can you use an observing candidate ID as the planning placeId? Also find a spot near me: I have provided no host location hint. Explain unknown access and sky quality; do not infer my location.'
];
const records:any[]=[];
try {
 for (journey=0;journey<prompts.length;journey++) {
  const flags=['exec','--ignore-user-config','--ignore-rules','--ephemeral','--skip-git-repo-check','--json','-C',temporary,'-s','read-only'];
  const overrides=[`model_instructions_file=${JSON.stringify(instructions)}`,'project_doc_max_bytes=0','web_search="disabled"',`mcp_servers={nightsky={url="${endpoint}",required=true,tool_timeout_sec=15}}`];
  for(const feature of ['shell_tool','apps','plugins','hooks','browser_use','computer_use','image_generation','multi_agent','view_image','memories','skill_search','workspace_dependencies','goals']) overrides.push(`features.${feature}=false`);
  overrides.push('features.skip_host_skill_discovery=true');
  for(const value of overrides) flags.push('-c',value);
  flags.push(prompts[journey]);
  const start=Date.now();
  const result=await new Promise<{code:number|null;output:string;error:string;timedOut:boolean}>(resolvePromise=>{
    const child=spawn(process.execPath,[join(homedir(),'AppData/Roaming/npm/node_modules/@openai/codex/bin/codex.js'),...flags],{cwd:temporary,windowsHide:true,stdio:['ignore','pipe','pipe']});
    let output='',error='',timedOut=false,settled=false,shutdown:ReturnType<typeof setTimeout>|undefined;
    const finish=(code:number|null)=>{if(settled)return;settled=true;clearTimeout(timer);clearTimeout(shutdown);resolvePromise({code,output,error,timedOut});};
    const stop=()=>{
      if(timedOut)return;timedOut=true;
      const killer=spawn('taskkill',['/PID',String(child.pid),'/T','/F'],{windowsHide:true,stdio:'ignore'});
      killer.on('error',()=>child.kill());
      shutdown=setTimeout(()=>{child.kill();child.stdout.destroy();child.stderr.destroy();child.unref();finish(1);},5000);
    };
    const timer=setTimeout(stop,120000);
    child.stdout.on('data',data=>{const value=data.toString();const remaining=150000-output.length;output+=value.slice(0,remaining);if(value.length>remaining)stop();});
    child.stderr.on('data',data=>{const value=data.toString();const remaining=30000-error.length;error+=value.slice(0,remaining);if(value.length>remaining)stop();});
    child.on('error',()=>{error='CLI process could not start';finish(1);});
    child.on('close',finish);
  });
  const events=result.output.split(/\r?\n/).flatMap(line=>{try{return[JSON.parse(line)];}catch{return[];}});
  const answers=events.filter(e=>e.type==='item.completed'&&e.item?.type==='agent_message').map(e=>e.item.text).join('\n');
  const calls=traces.filter(t=>t.journey===journey);
  const allowedItems=new Set(['agent_message','reasoning','mcp_tool_call','tool_search']);
  const nonMcp=events.filter(e=>e.type==='item.completed'&&e.item&&(!allowedItems.has(e.item.type)||(e.item.type==='mcp_tool_call'&&e.item.server!=='nightsky')));
  const has=(tool:string)=>calls.some(c=>c.tool===tool);
  const semanticChecks=journey===0?{
    eventAndPlan:has('search_sky_events')&&has('plan_observing_session'),
    peakUnconfirmed:/2027/.test(answers)&&/cannot confirm|can't confirm|not confirm|unconfirmed|unsupported|not.*(?:supported|verified)|no.*(?:catalog|coverage|data)/i.test(answers),
    weatherUnknown:/weather|forecast|clear skies/i.test(answers)&&/unknown|unavailable|cannot|can't|no forecast|not.*confirm/i.test(answers)
  }:journey===1?{
    compareExecuted:has('compare_observing_options'),
    bothDates:/15/.test(answers)&&/16/.test(answers),
    weatherUnknown:/weather|forecast/.test(answers)&&/unknown|unavailable|not.*confirm|no forecast|neither.*confirm/i.test(answers)
  }:{
    candidatesExecuted:has('search_observing_locations'),
    candidateNamespace:/candidate/.test(answers)&&/cannot|can't|not.*(?:placeId|interchange)|distinct|separate|different|use.*resolved/i.test(answers),
    missingHostLocation:/location|near/.test(answers)&&/no.*(?:hint|location)|not.*(?:provided|available)|cannot.*near|can't.*near|need.*(?:town|city|place)/i.test(answers),
    accessUnknown:/access/.test(answers)&&/unknown|unverified/.test(answers),
    skyUnknown:/sky|darkness|light pollution/.test(answers)&&/unknown|unverified/.test(answers)
  };
  const checks={realLocalToolCalls:calls.length>0,onlyMcpCalls:nonMcp.length===0,completed:result.code===0&&!result.timedOut,...semanticChecks};
  const errors=events.filter(e=>e.type==='error'||e.type==='turn.failed').map(e=>e.message??e.error?.message??'Model request failed');
  records.push({journey,observedModel:result.error.match(/^model:\s*(\S+)/m)?.[1]??events.find(e=>e.model)?.model??null,latencyMs:Date.now()-start,checks,pass:Object.values(checks).every(Boolean),toolCalls:calls,answer:answers,exitCode:result.code,timedOut:result.timedOut,modelErrors:errors,error:result.code===0?undefined:result.error.replace(/C:\\Users\\[^\s]+/g,'[local path]').slice(-2000)});
  console.log(JSON.stringify({journey,pass:records.at(-1).pass,toolCalls:calls.length,latencyMs:records.at(-1).latencyMs}));
  if(result.timedOut)break; // No further child if bounded cleanup could not confirm exit.
 }
} finally {
 server.closeAllConnections();await new Promise<void>(r=>server.close(()=>r()));
 const withinTemp=relative(resolve(tmpdir()),resolve(temporary));
 if(withinTemp.startsWith('..')||isAbsolute(withinTemp)||!withinTemp.startsWith('nightsky-model-'))throw Error('Refusing cleanup outside named temporary fixture directory');
 rmSync(temporary,{recursive:true,force:true});
}
const report={runAt:new Date().toISOString(),cli:'codex-cli 0.154.0',requestedModel:'CLI default; no override',actualInferenceModel:records[0]?.observedModel??null,authPreflightObservedThisSession:'2026-10-14: Claude false; Codex ChatGPT login true; no credential contents read',networkPath:'Codex CLI model service; MCP HTTP loopback 127.0.0.1 only; synthetic providers.',externalProviderAttempts:externalAttempts,rejectedCalls,cleanupUncertain:records.some(r=>r.timedOut),liveHostValidated:false,marketplaceValidated:false,records};
mkdirSync(resolve('docs/operations'),{recursive:true});
writeFileSync(resolve('docs/operations/model-journey-test-results.json'),JSON.stringify(report,null,2)+'\n');
process.exitCode=records.length===3&&records.every(r=>r.pass)&&externalAttempts===0&&rejectedCalls===0?0:1;
