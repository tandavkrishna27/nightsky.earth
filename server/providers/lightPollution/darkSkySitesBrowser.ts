import { lightPollutionResultSchema, type LightPollutionPoint, type LightPollutionResult } from '../../../shared/nightsky/lightPollution';
import { browserUnavailable } from './browser';

/** Synthetic contract only: no live DOM extractor has established these fields/labels.
 * Generation numbers must represent visible marker selection completion, never hover/network activity.
 * Exact coordinate evidence must be visible on the selected result, not echoed from form input.
 */
export interface DarkSkySitesEvidence {
 selectedText:string;
 previousSelectedText:string;
 selectedCount:number;
 previousSelectionGeneration:number;
 selectionGeneration:number;
 completedGeneration:number;
 coordinatePrecision:'exact'|'rounded'|'unknown';
 exactCoordinateEvidence:string|null;
}

/** Experimental parser for offline fixtures. This does not admit public browser operation. */
export function parseDarkSkySitesEvidence(point:LightPollutionPoint,e:DarkSkySitesEvidence):LightPollutionResult {
 const bad=(code:string)=>browserUnavailable(point,code,'darkskysites');
 if(e.selectedText.length>8000)return bad('malformed_evidence');
 if(/captcha|verify you are human|access denied|challenge/i.test(e.selectedText))return bad('browser_access_challenge');
 if(e.coordinatePrecision!=='exact'||!Number.isSafeInteger(e.previousSelectionGeneration)||e.previousSelectionGeneration<0||e.selectionGeneration<=e.previousSelectionGeneration||e.selectedCount!==1||!Number.isSafeInteger(e.selectionGeneration)||e.selectionGeneration<1||e.selectionGeneration!==e.completedGeneration||e.selectedText===e.previousSelectedText)return bad('coordinate_binding_failed');
 const coordinates=/^(-?\d+(?:\.\d+)?),\s*(-?\d+(?:\.\d+)?)$/.exec(e.exactCoordinateEvidence??'');
 if(!coordinates||Number(coordinates[1])!==point.latitude||Number(coordinates[2])!==point.longitude)return bad('coordinate_binding_failed');
 const fields=new Map<string,string>();
 for(const line of e.selectedText.split(/\r?\n/)){
  const match=/^([^:]+):\s*(.+)$/.exec(line.trim());
  if(match){if(fields.has(match[1]))return bad('ambiguous_evidence');fields.set(match[1],match[2]);}
 }
 // Require the card's coordinate field as well as independent selected-result evidence.
 if(fields.get('Coordinates')!==e.exactCoordinateEvidence)return bad('coordinate_binding_failed');
 const label=fields.get('Dataset'),yearText=fields.get('Year'),monthText=fields.get('Month'),attribution=fields.get('Attribution');
 if(!label||!attribution||!yearText||!/^\d{4}$/.test(yearText))return bad('dataset_evidence_missing');
 const coverage=fields.get('Coverage');
 if(coverage!=='verified')return bad(coverage==='unverified_zero'?'unverified_zero':'coverage_evidence_missing');
 const sqmText=fields.get('SQM'),bortleText=fields.get('Bortle');
 let sqm:number|null=null,bortleClasses:number[]|null=null;
 if(sqmText!==undefined){if(!/^\d+(?:\.\d+)?$/.test(sqmText)||Number(sqmText)<0||Number(sqmText)>30)return bad('malformed_evidence');sqm=Number(sqmText);}
 if(bortleText!==undefined){const range=/^([1-9])(?:\s*[-–]\s*([1-9]))?$/.exec(bortleText);if(!range||Number(range[2]??range[1])<Number(range[1]))return bad('malformed_evidence');bortleClasses=Array.from({length:Number(range[2]??range[1])-Number(range[1])+1},(_,index)=>Number(range[1])+index);}
 if(monthText!==undefined&&!/^(?:[1-9]|1[0-2])$/.test(monthText))return bad('malformed_evidence');
 if(sqm===null&&bortleClasses===null)return bad('unsupported_labels');
 const result={...bad('placeholder'),status:'available' as const,observedPoint:{latitude:Number(coordinates[1]),longitude:Number(coordinates[2])},coordinateBinding:'verified' as const,dataset:{label,id:null,year:Number(yearText),month:monthText===undefined?null:Number(monthText)},sqm,bortleClasses,quality:{coverage:'verified' as const,notes:[],assessments:[]},attribution,errorCode:null};
 const checked=lightPollutionResultSchema.safeParse(result);
 return checked.success?checked.data:bad('malformed_evidence');
}

/** Only the three named controls below were observed. Marker/card location and exact
 * binding remain unimplemented: a concrete port must establish them from visible UI.
 * This port deliberately supplies no guessed selectors, private state, or provider calls.
 */
export interface DarkSkySitesVisiblePort {
 clickButton(name:'Enter GPS coordinates'|'Go to Location'):Promise<void>;
 fillTextbox(name:'Coordinates',value:string):Promise<void>;
 selectRequestedMarker():Promise<void>;
 readSelectedEvidence():Promise<DarkSkySitesEvidence>;
}
export async function runDarkSkySitesVisibleWorkflow(point:LightPollutionPoint,port:DarkSkySitesVisiblePort,signal?:AbortSignal):Promise<LightPollutionResult>{
 const bad=(code:string)=>browserUnavailable(point,code,'darkskysites');
 const check=()=>{if(signal?.aborted)throw Error('cancelled');};
 // Settlement does not stop the underlying action; runtime cleanup remains required.
 const action=async<T>(invoke:()=>Promise<T>):Promise<T>=>{
  check();
  let abort:()=>void=()=>{};
  try{return await new Promise<T>((resolve,reject)=>{
   abort=()=>reject(Error('cancelled'));
   signal?.addEventListener('abort',abort,{once:true});
   if(signal?.aborted){abort();return;}
   // Observe late resolution/rejection after cancellation without starting another action.
   Promise.resolve().then(()=>{check();return invoke();}).then(resolve,reject);
  });}finally{signal?.removeEventListener('abort',abort);}
 };
 try{
  await action(()=>port.clickButton('Enter GPS coordinates'));
  await action(()=>port.fillTextbox('Coordinates',`${point.latitude}, ${point.longitude}`));
  await action(()=>port.clickButton('Go to Location'));
  await action(()=>port.selectRequestedMarker());
  const evidence=await action(()=>port.readSelectedEvidence());
  check();return parseDarkSkySitesEvidence(point,evidence);
 }catch{return bad(signal?.aborted?'browser_cancelled':'browser_workflow_unavailable');}
}
