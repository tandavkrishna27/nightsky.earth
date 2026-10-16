import { z } from 'zod';
export const categoryLabels = { 'meteor-showers': 'Meteor showers', eclipses: 'Eclipses', moon: 'Moon', planets: 'Planets' } as const;
export type EventCategory = keyof typeof categoryLabels;
export function validDay(s:string) { return /^\d{4}-\d{2}-\d{2}$/.test(s) && !Number.isNaN(Date.parse(s)) && new Date(s).toISOString().slice(0,10)===s; }
const day=z.string().refine(validDay,'Invalid calendar date');
const stamp=z.string().refine(s=>/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(:\d{2})?Z$/.test(s) && validDay(s.slice(0,10)) && !Number.isNaN(Date.parse(s)),'Expected valid UTC timestamp');
const base={label:z.string().min(1),sourceId:z.string().min(1)};
const timingSchema=z.discriminatedUnion('kind',[
 z.object({...base,kind:z.literal('instant'),atUtc:stamp}),
 z.object({...base,kind:z.literal('interval'),startUtc:stamp,endUtcExclusive:stamp}),
 z.object({...base,kind:z.literal('approximate'),startDate:day,endDateInclusive:day,basis:z.enum(['UTC','source-calendar']),basisLabel:z.string().min(1)})
]);
export type EventTiming=z.infer<typeof timingSchema>;
const schema=z.object({id:z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),title:z.string().min(1),category:z.enum(['meteor-showers','eclipses','moon','planets']),synopsis:z.string().min(1),timing:timingSchema,activity:timingSchema.optional(),visibility:z.string().min(1),equipment:z.string().min(1),sections:z.array(z.object({heading:z.string().min(1),body:z.string().min(1)})).min(1),question:z.string().min(1),sources:z.array(z.object({id:z.string().min(1),title:z.string().min(1),url:z.string().url().refine(s=>{const u=new URL(s);return u.protocol==='https:'&&!u.username&&!u.password}),sourceTimeScale:z.string().min(1),conversionNote:z.string().optional()})).min(1),lastReviewedAt:day,reviewStatus:z.enum(['draft','reviewed','withdrawn'])});
export type SkyEvent=z.infer<typeof schema>;
export type EventSource=SkyEvent['sources'][number];
export type CoverageMonth={month:string;reviewedAt:string;scope:string};
export function validateSkyEvents(input:unknown):SkyEvent[]{
 const records=z.array(schema).parse(input);const ids=new Set<string>();
 for(const e of records){
  if(ids.has(e.id))throw Error('Duplicate event '+e.id);ids.add(e.id);
  if(new Set(e.sources.map(s=>s.id)).size!==e.sources.length)throw Error('Duplicate source '+e.id);
  for(const t of [e.timing,e.activity].filter(Boolean) as EventTiming[]){
   const source=e.sources.find(s=>s.id===t.sourceId);if(!source)throw Error('Unknown source '+e.id);
   if(t.kind!=='approximate'&&source.sourceTimeScale!=='UTC'&&!source.conversionNote)throw Error('Unverified UTC conversion '+e.id);
   if(t.kind==='interval'&&Date.parse(t.startUtc)>=Date.parse(t.endUtcExclusive))throw Error('Reversed interval '+e.id);
   if(t.kind==='approximate'&&t.startDate>t.endDateInclusive)throw Error('Reversed date range '+e.id);
  }
 }
 return records;
}
export function validateCoverage(months:readonly CoverageMonth[],now:Date):string[]{
 const seen=new Set<string>();for(const m of months){if(!/^\d{4}-(0[1-9]|1[0-2])$/.test(m.month)||!validDay(m.reviewedAt)||!m.scope.trim()||m.reviewedAt>now.toISOString().slice(0,10)||seen.has(m.month))throw Error('Invalid coverage '+m.month);seen.add(m.month);}
 return Array.from({length:12},(_,i)=>new Date(Date.UTC(now.getUTCFullYear(),now.getUTCMonth()+i,1)).toISOString().slice(0,7)).filter(m=>!seen.has(m));
}
