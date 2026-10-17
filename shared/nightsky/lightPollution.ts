import * as z from 'zod4';
import { calculationPlaceInputSchema } from './discovery';
const latitude = z.number().finite().min(-90).max(90);
const longitude = z.number().finite().min(-180).max(180);
const boundedText = z.string().trim().min(1).max(2000);
const optionalText = boundedText.nullable().optional();
const candidateId = z.string().trim().min(1).max(100);
export const lightPollutionCoordinatesSchema = z.strictObject({latitude,longitude});
export const lightPollutionPointSchema = z.strictObject({candidateId,latitude,longitude});
export type LightPollutionPoint = z.infer<typeof lightPollutionPointSchema>;
export const lightPollutionAdapterSchema = z.strictObject({sourceId:z.enum(['darkskysites','lightpollutionmap']),transport:z.enum(['api','browser'])});
export const compareLightPollutionInputSchema = z.strictObject({
 candidates:z.array(z.strictObject({candidateId,location:z.discriminatedUnion('kind',[
 z.strictObject({kind:z.literal('selected-place'),place:calculationPlaceInputSchema}),
 z.strictObject({kind:z.literal('coordinates'),latitude,longitude}),
 ])})).min(1).max(5),
 adapters:z.array(lightPollutionAdapterSchema).min(1).max(4).optional(),
}).superRefine((value,ctx)=>{if(new Set(value.candidates.map(p=>p.candidateId)).size!==value.candidates.length)ctx.addIssue({code:'custom',path:['candidates'],message:'Candidate IDs must be unique.'});});
export type CompareLightPollutionInput = z.infer<typeof compareLightPollutionInputSchema>;
export const lightPollutionPointsSchema = z.array(lightPollutionPointSchema).min(1).max(5).superRefine((points,ctx)=>{if(new Set(points.map(p=>p.candidateId)).size!==points.length)ctx.addIssue({code:'custom',message:'Candidate IDs must be unique.'});});
export const lightPollutionResultSchema = z.strictObject({
 candidateId,sourceId:lightPollutionAdapterSchema.shape.sourceId,transport:lightPollutionAdapterSchema.shape.transport,
 status:z.enum(['available','partial','unavailable']),requestedPoint:lightPollutionCoordinatesSchema,observedPoint:lightPollutionCoordinatesSchema.nullable(),coordinateBinding:z.enum(['verified','rounded','unverified']),retrievedAt:z.string().max(30).datetime().refine(value=>/T\d{2}:\d{2}:\d{2}(?:\.\d{1,3})?Z$/.test(value),'Use at most millisecond precision.'),
 dataset:z.strictObject({label:boundedText.nullable(),id:boundedText.nullable(),year:z.number().int().min(1900).max(9999).nullable(),month:z.number().int().min(1).max(12).nullable(),fallbackUsed:z.boolean().nullable().optional(),fallbackFrom:optionalText,fallbackReason:optionalText,datasetsChecked:z.number().int().min(0).max(1000000).nullable().optional(),requestedDate:optionalText}),
 sqm:z.number().finite().nullable(),unit:z.literal('mag/arcsec2'),bortleClasses:z.array(z.number().int().min(1).max(9)).min(1).max(9).refine(v=>new Set(v).size===v.length,'Classes must be unique.').nullable(),
 quality:z.strictObject({coverage:z.enum(['verified','unknown','unverified_zero']),notes:z.array(boundedText).max(100),assessments:z.array(z.strictObject({label:boundedText,attribution:boundedText})).max(100),status:optionalText,method:optionalText,coverageVerified:z.boolean().nullable().optional(),flags:z.array(boundedText).max(100).nullable().optional()}),
 attribution:boundedText,sourceUrl:z.url().max(2048),limitations:z.array(boundedText).max(100),errorCode:z.string().min(1).max(100).nullable(),
}).superRefine((r,ctx)=>{
 const issue=(message:string)=>ctx.addIssue({code:'custom',message});
 let url:URL;
 try {url=new URL(r.sourceUrl);} catch {issue('Source URL must be valid.');return;}
 const hosts=r.sourceId==='darkskysites'?['darkskysites.com','www.darkskysites.com']:['lightpollutionmap.info','www.lightpollutionmap.info'];
 if(url.protocol!=='https:'||!hosts.includes(url.hostname)||url.username||url.password||url.port)issue('Source URL must belong to the selected public source.');
 const metrics=r.sqm!==null||r.bortleClasses!==null;
 if(metrics&&(r.status==='unavailable'||r.coordinateBinding!=='verified'||r.quality.coverage==='unverified_zero'))issue('Metrics require usable evidence and verified coordinates.');
 if(r.coordinateBinding==='verified'&&(!r.observedPoint||r.observedPoint.latitude!==r.requestedPoint.latitude||r.observedPoint.longitude!==r.requestedPoint.longitude))issue('Verified binding requires matching observed coordinates.');
 const provenance=r.dataset.label!==null||r.dataset.id!==null;
 if((metrics||r.quality.coverage==='verified')&&!provenance)issue('Usable evidence requires dataset provenance.');
 if(r.dataset.month!==null&&r.dataset.year===null)issue('Dataset month requires year.');
 if(r.status==='available'&&!metrics)issue('Available results require a metric.');
 if(r.status==='available'&&r.errorCode!==null)issue('Available results cannot carry an error.');
 if(r.status==='unavailable'&&r.errorCode===null)issue('Unavailable results require an error code.');
});
export type LightPollutionResult = z.infer<typeof lightPollutionResultSchema>;
export interface LightPollutionProvider {sourceId:LightPollutionResult['sourceId'];transport:LightPollutionResult['transport'];lookup(point:LightPollutionPoint,signal?:AbortSignal):Promise<LightPollutionResult>;lookupMany?(points:LightPollutionPoint[],signal?:AbortSignal):Promise<LightPollutionResult[]>}

