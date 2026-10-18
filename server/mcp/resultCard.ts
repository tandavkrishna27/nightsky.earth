import type {McpServer} from '@modelcontextprotocol/server';
import type {PlanResult} from '../../shared/nightsky/planning';
import {planResultSchema} from '../../shared/nightsky/planning';
import type {SourceRecord} from '../../shared/nightsky/common';
import {MAX_STRUCTURED_RESULT_BYTES} from '../../shared/nightsky/common';
import {formatLocalInstant} from '../../shared/nightsky/format';
import {planAnswerSources,planAnswerText} from './answerText';
import {RESULT_CARD_HTML} from './resultCardView';
export const RESULT_CARD_URI='ui://nightsky/planning-card-v1.html';
export type PlanningCard = {status:'available';schemaVersion:1;place:string;session:string;summary:string;facts:Array<{label:string;value:string}>;details:string;sources:SourceRecord[]}|{status:'unavailable';reason:string};
export const RESULT_CARD_TOOL_META={ui:{resourceUri:RESULT_CARD_URI},'openai/outputTemplate':RESULT_CARD_URI};
const safeLink=(value:string)=>{const url=new URL(value);if(!['http:','https:'].includes(url.protocol)||url.username||url.password)throw Error('Unsafe card link');};

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
   details:planAnswerText(plan,{target,includeSourceLinks:false}).split('\n').slice(1).join('\n'),sources};
  if(Buffer.byteLength(JSON.stringify(card),'utf8')>32768||Buffer.byteLength(JSON.stringify({...result,_meta:{nightskyResultCard:card}}),'utf8')>MAX_STRUCTURED_RESULT_BYTES)throw Error('Card budget');
 }catch{card={status:'unavailable',reason:'The result card is unavailable. Use the complete text result and its source credits.'};}
 return {...result,_meta:{nightskyResultCard:card}};
}
