import * as z from 'zod4';
import {candidateRefSchema,catalogueRevisionSchema,countryCodeSchema,regionIdSchema,regionRefSchema} from '../../shared/nightsky/discovery';
import {sourceRecordSchema,placeIdSchema} from '../../shared/nightsky/common';
export const MAX_LEAF_BYTES=4*1024*1024,MAX_DIRECTORY_BYTES=1024*1024,MAX_PAGE_ROWS=10000;
export const boundsSchema=z.strictObject({south:z.number().finite().min(-90).max(90),north:z.number().finite().min(-90).max(90),west:z.number().finite().min(-180).max(180),east:z.number().finite().min(-180).max(180)}).refine(b=>b.south<=b.north&&b.west<=b.east,'Ordered split-dateline bounds required');
export type Bounds=z.infer<typeof boundsSchema>;
export const catalogueCandidateSchema=candidateRefSchema.extend({sourceCompleteness:z.number().finite().min(0).max(100),countryCode:countryCodeSchema.optional(),regionIds:z.array(regionIdSchema).max(16)});
export type CatalogueCandidate=z.infer<typeof catalogueCandidateSchema>;
/** Bounds denote fully admitted rectangular coverage cells, never irregular clip bounding boxes. */
export const footprintSchema=z.strictObject({geometryBasis:z.literal('full-cell'),footprintId:z.string().min(1).max(160),bounds:boundsSchema,sources:z.array(sourceRecordSchema).min(1).max(4),vintage:z.string().min(1).max(100),regionIds:z.array(regionIdSchema).max(16).optional()});
export type CoverageFootprint=z.infer<typeof footprintSchema>;
const safePath=z.string().min(1).max(240).refine(p=>!p.includes('\\')&&!p.includes(':')&&!p.startsWith('/')&&p.split('/').every(s=>s!=='.'&&s!=='..'&&s.length>0),'Unsafe artifact path');
export const pageKindSchema=z.enum(['directory','candidates','ids','names','memberships','regions','footprints']);
export const pageRefSchema=z.strictObject({path:safePath,sha256:z.string().regex(/^[a-f0-9]{64}$/),bytes:z.number().int().positive().max(MAX_LEAF_BYTES),rows:z.number().int().min(0).max(MAX_PAGE_ROWS),kind:pageKindSchema,bounds:boundsSchema.optional(),minKey:z.string().max(320).optional(),maxKey:z.string().max(320).optional()}).refine(r=>r.kind!=='directory'||r.bytes<=MAX_DIRECTORY_BYTES,'Directory byte limit').refine(r=>(r.minKey===undefined&&r.maxKey===undefined)||(r.minKey!==undefined&&r.maxKey!==undefined&&r.minKey<=r.maxKey),'Ordered key range required');
export type PageRef=z.infer<typeof pageRefSchema>;
const base={schemaVersion:z.literal(2),catalogueRevision:catalogueRevisionSchema};
export const cataloguePageSchema=z.discriminatedUnion('kind',[
 z.strictObject({...base,kind:z.literal('directory'),entries:z.array(pageRefSchema).max(256)}),
 z.strictObject({...base,kind:z.literal('candidates'),rows:z.array(catalogueCandidateSchema).max(MAX_PAGE_ROWS)}),
 z.strictObject({...base,kind:z.literal('ids'),rows:z.array(z.strictObject({key:placeIdSchema,page:pageRefSchema})).max(MAX_PAGE_ROWS)}),
 z.strictObject({...base,kind:z.literal('names'),rows:z.array(z.strictObject({key:z.string().min(1).max(320),placeId:placeIdSchema,countryCode:countryCodeSchema.optional()})).max(MAX_PAGE_ROWS)}),
 z.strictObject({...base,kind:z.literal('memberships'),rows:z.array(z.strictObject({key:regionIdSchema,placeId:placeIdSchema,page:pageRefSchema.optional()})).max(MAX_PAGE_ROWS)}),
 z.strictObject({...base,kind:z.literal('regions'),rows:z.array(regionRefSchema).max(MAX_PAGE_ROWS)}),
 z.strictObject({...base,kind:z.literal('footprints'),rows:z.array(footprintSchema).max(MAX_PAGE_ROWS)})]);
export type CataloguePage=z.infer<typeof cataloguePageSchema>;
export const catalogueTreeLeafKinds = {
 spatial: 'candidates',
 id: 'ids',
 name: 'names',
 membership: 'memberships',
 regions: 'regions',
 footprints: 'footprints',
} as const;
export const catalogueRootSchema=z.strictObject({...base,trees:z.strictObject({spatial:pageRefSchema,id:pageRefSchema,name:pageRefSchema,membership:pageRefSchema,regions:pageRefSchema,footprints:pageRefSchema})}).superRefine((root,ctx)=>{
 for(const tree of Object.keys(catalogueTreeLeafKinds) as (keyof typeof catalogueTreeLeafKinds)[]){
  const ref=root.trees[tree];
  if(ref.kind!=='directory'&&ref.kind!==catalogueTreeLeafKinds[tree])ctx.addIssue({code:'custom',path:['trees',tree,'kind'],message:'Unexpected catalogue tree leaf kind'});
 }
});
export type CatalogueRoot=z.infer<typeof catalogueRootSchema>;
export type CatalogueTree=keyof CatalogueRoot['trees'];
export function freezeDeep<T>(value:T):T {if(value&&typeof value==='object'){for(const child of Object.values(value))freezeDeep(child);Object.freeze(value);}return value;}
export function normalizeCatalogueName(name:string){return name.normalize('NFKC').toLowerCase().trim().replace(/\s+/g,' ');}
