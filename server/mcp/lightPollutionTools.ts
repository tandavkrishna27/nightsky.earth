import * as z from 'zod4';
import type {McpServer} from '@modelcontextprotocol/server';
import {calculationPlaceInputSchema} from '../../shared/nightsky/discovery';
import {compareLightPollutionInputSchema,lightPollutionResultSchema,type LightPollutionProvider,type LightPollutionResult} from '../../shared/nightsky/lightPollution';
import {compareLightPollution} from '../providers/lightPollution';
export const LIGHT_POLLUTION_TOOL_NAMES=['compare_light_pollution'] as const;
function missing(sourceId:LightPollutionResult['sourceId'],transport:LightPollutionResult['transport']):LightPollutionProvider {return {sourceId,transport,lookup:async p=>({candidateId:p.candidateId,sourceId,transport,status:'unavailable',requestedPoint:{latitude:p.latitude,longitude:p.longitude},observedPoint:null,coordinateBinding:'unverified',retrievedAt:new Date().toISOString(),dataset:{label:null,id:null,year:null,month:null},sqm:null,unit:'mag/arcsec2',bortleClasses:null,quality:{coverage:'unknown',notes:[],assessments:[]},attribution:sourceId,sourceUrl:sourceId==='darkskysites'?'https://darkskysites.com':'https://www.lightpollutionmap.info',limitations:['Requested adapter is not configured or admitted.'],errorCode:'adapter_unavailable'})};}
/** Keep provider method and uncertainty visible even when the API supplies no dataset label. */
function evidenceQualifiers(r:LightPollutionResult):string {
 const fields:Array<[string,unknown]>=[
  ['method',r.quality.method],['quality status',r.quality.status],
  ['quality flags',r.quality.flags?.length?r.quality.flags.join(', '):undefined],
  ['coverage verified',r.quality.coverageVerified],['fallback used',r.dataset.fallbackUsed],
  ['fallback from',r.dataset.fallbackFrom],['fallback reason',r.dataset.fallbackReason],
  ['datasets checked',r.dataset.datasetsChecked],['requested date',r.dataset.requestedDate],
 ];
 const text=fields.filter(([,value])=>value!==undefined&&value!==null).map(([label,value])=>`${label}: ${value}`).join('; ');
 return text?`${text}. `:'';
}
export function registerLightPollutionTools(server:McpServer,providers:LightPollutionProvider[],resolvePoint:(input:z.infer<typeof calculationPlaceInputSchema>)=>Promise<{latitude:number;longitude:number}>) {
 server.registerTool('compare_light_pollution',{title:'Compare modelled light pollution',description:'Compare 1–5 evaluated points. Default DarkSkySites API only. Browser transports must be explicitly requested and admitted; unavailable API never triggers browser fallback. Selected places require current revisions. Results retain dataset, coordinate binding and coverage uncertainty; this does not establish tonight’s weather or site access.',inputSchema:compareLightPollutionInputSchema,outputSchema:z.object({results:z.array(lightPollutionResultSchema)}),annotations:{readOnlyHint:true,destructiveHint:false,openWorldHint:true}},async(raw,context)=>{
 const input=compareLightPollutionInputSchema.parse(raw);
 // Finish all revision-aware resolution before dispatching any provider operation.
 const points=await Promise.all(input.candidates.map(async c=>{const p=c.location.kind==='coordinates'?c.location:await resolvePoint(c.location.place);return {candidateId:c.candidateId,latitude:p.latitude,longitude:p.longitude};}));
 const adapters=input.adapters??[{sourceId:'darkskysites' as const,transport:'api' as const}];
 const selected=adapters.map(a=>providers.find(p=>p.sourceId===a.sourceId&&p.transport===a.transport)??missing(a.sourceId,a.transport));
 const result=await compareLightPollution(points,selected,context.mcpReq.signal);
 const lines=result.results.map(r=>{const date=r.dataset.year===null?'unknown dataset date':`${r.dataset.year}${r.dataset.month===null?'':`-${String(r.dataset.month).padStart(2,'0')}`}`;return `${r.candidateId}: ${r.sqm===null?'SQM unknown':`SQM ${r.sqm} ${r.unit}`}; ${r.attribution} (${r.sourceId}/${r.transport}), ${date}, dataset ${r.dataset.label??r.dataset.id??'unknown'}; ${r.status}; point ${r.coordinateBinding}; coverage ${r.quality.coverage}; retrieved ${r.retrievedAt}. Bortle ${r.bortleClasses?.join('–')??'unknown'}. ${r.sourceUrl}. ${evidenceQualifiers(r)}${[...r.quality.notes,...r.limitations].join(' ')}${r.errorCode?` Error: ${r.errorCode}.`:''}`;});
 return {structuredContent:result,content:[{type:'text' as const,text:[...lines,'Modelled sky brightness, not a live measurement. API and browser transports of one source are not independent corroboration. Compare only evaluated candidates with comparable datasets/models and usable coordinate/coverage evidence; do not average sources or treat tiny differences as decisive. Higher comparable SQM means darker sky; preserve artificial-versus-total metric distinctions. Site access, horizon, seeing and transparency remain unknown; assess clouds and Moon separately before travel.'].join('\n')}]};
 });
}
