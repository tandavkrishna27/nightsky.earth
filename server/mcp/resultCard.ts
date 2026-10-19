import type {McpServer} from '@modelcontextprotocol/server';
import type {PlanResult} from '../../shared/nightsky/planning';
import {planResultSchema} from '../../shared/nightsky/planning';
import type {SourceRecord} from '../../shared/nightsky/common';
import {MAX_STRUCTURED_RESULT_BYTES} from '../../shared/nightsky/common';
import {formatLocalInstant} from '../../shared/nightsky/format';
import {planAnswerSources,planAnswerText} from './answerText';
import {RESULT_CARD_HTML} from './resultCardView';
export const RESULT_CARD_URI='ui://nightsky/planning-card-v1.html';
export type CardSourceUse='location'|'calculation'|'forecast'|'history'|'history-reference'|'reference';
export type PlanningCard = {status:'available';schemaVersion:1;place:string;session:string;summary:string;facts:Array<{label:string;value:string}>;details:string;sources:SourceRecord[];sourceUses?:CardSourceUse[][]}|{status:'unavailable';reason:string};
export const RESULT_CARD_TOOL_META={ui:{resourceUri:RESULT_CARD_URI},'openai/outputTemplate':RESULT_CARD_URI};
const safeLink=(value:string)=>{const url=new URL(value);if(!['http:','https:'].includes(url.protocol)||url.username||url.password)throw Error('Unsafe card link');};

/** Presentation roles do not alter provenance or infer a contribution from a provider name/URL. */
export function planningCardSourceUses(plan:PlanResult,sources:SourceRecord[]):CardSourceUse[][]{
 const identity=(source:SourceRecord)=>JSON.stringify(Object.entries(source).sort(([a],[b])=>a.localeCompare(b)));
 const uses=new Map<string,Set<CardSourceUse>>();
 const add=(rows:SourceRecord[],use:CardSourceUse)=>{for(const row of rows){const key=identity(row);if(!uses.has(key))uses.set(key,new Set());uses.get(key)!.add(use);}};
 add(plan.place.sources,'location');
 const evidence=plan.evidence;
 const active=(value:{availability:{status:string}})=>['available','partial'].includes(value.availability.status);
 const astronomy=evidence?.astronomy;
 if(astronomy&&active(astronomy)&&(astronomy.moon||astronomy.solarThresholdIntervals!==undefined))add(astronomy.sources,'calculation');
 for(const target of [...(evidence?.target?[evidence.target]:[]),...(plan.suggestions??[])]){
  if(active(target)&&(target.intervals.length||target.orientationSamples?.length))add(target.sources,'calculation');
 }
 for(const forecast of evidence?.weather?.forecasts??[]){
  const start=Date.parse(plan.requestedWindow.startUtc),end=Date.parse(plan.requestedWindow.endUtc);
  // Match forecastAnswerText's native cloud instant/period selection, not just its anchor.
  const relevant=forecast.samples.some(sample=>{
   const at=Date.parse(sample.validAt),inside=at>=start&&at<=end;
   const cloud=sample.values.totalCloudCover,band=sample.bands?.totalCloudCover;
   const numeric=cloud&&Number.isFinite(cloud.value)&&(cloud.periodStartUtc&&cloud.periodEndUtc
    ?Date.parse(cloud.periodEndUtc)>start&&Date.parse(cloud.periodStartUtc)<end:inside);
   return !!numeric||!!band&&inside;
  });
  if(active(forecast)&&relevant)add([forecast.source],'forecast');
 }
 const history=evidence?.history;
 if(history)add(history.sources,active(history)&&!!history.summary?.validEligibleSamples?'history':'history-reference');
 return sources.map(source=>Array.from(uses.get(identity(source))??['reference']));
}

export function registerResultCardResource(server:McpServer):void{
 server.registerResource('nightsky-planning-card',RESULT_CARD_URI,{title:'NightSky planning result',mimeType:'text/html;profile=mcp-app'},async()=>({contents:[{
  uri:RESULT_CARD_URI,mimeType:'text/html;profile=mcp-app',text:RESULT_CARD_HTML,
  _meta:{ui:{prefersBorder:true,csp:{connectDomains:[],resourceDomains:[]},permissions:{}}},
 }]}));
}

/** Component-only view of existing validated evidence; no fetching or model-authored values. */
export function attachPlanningCard<T extends {content:unknown;structuredContent:PlanResult}>(result:T,input:PlanResult,target?:string):T&{_meta:{nightskyResultCard:PlanningCard}}{
 let card:PlanningCard;
 try{
  const plan=planResultSchema.parse(input),zone=plan.requestedWindow.timeZone;
  const local=(at:string)=>formatLocalInstant(at,zone,'en');
  const sources=planAnswerSources(plan,target);
  if(!sources.length)throw Error('Missing card credits');
  for(const source of sources){safeLink(source.url);if(source.licenseUrl)safeLink(source.licenseUrl);}
  const astronomy=plan.evidence?.astronomy;
  const dark=astronomy?.solarThresholdIntervals?.filter(row=>row.sunAltitudeThresholdDegrees===-18)??[];
  const moon=astronomy?.moon;
  card={status:'available',schemaVersion:1,place:plan.place.displayName,
   session:`${local(plan.requestedWindow.startUtc)} to ${local(plan.requestedWindow.endUtc)}`,
   summary:'Planning evidence for your selected place and time. Visibility and site access are not guaranteed.',
   facts:[{label:'Astronomical darkness',value:astronomy?.availability.status==='available'?(dark.length?dark.map(row=>`${local(row.startUtc)} to ${local(row.endUtc)}`).join('; '):'No calculated dark interval in this session'):'Unavailable'},
    {label:'Moon',value:moon?`${moon.illuminationPercent.toFixed(1)}% illuminated; observing impact remains unknown`:'Unavailable'},
    {label:'Location basis',value:plan.place.sourceRevision?'Selected API point; site suitability unverified':'Named record; not a verified observing site'}],
   // The legacy aggregate summary can summarize samples outside this session.
   // Keep the time-labelled answer rows rather than promoting that summary.
   details:planAnswerText(plan,{target,includeSourceLinks:false}).split('\n').slice(1).join('\n'),sources,sourceUses:planningCardSourceUses(plan,sources)};
  if(Buffer.byteLength(JSON.stringify(card),'utf8')>32768||Buffer.byteLength(JSON.stringify({...result,_meta:{nightskyResultCard:card}}),'utf8')>MAX_STRUCTURED_RESULT_BYTES)throw Error('Card budget');
 }catch{card={status:'unavailable',reason:'The result card is unavailable. Use the complete text result and its source credits.'};}
 return {...result,_meta:{nightskyResultCard:card}};
}
