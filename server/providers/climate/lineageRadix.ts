/** Bounded, pinned radix lineage. Object hashes include the domain and version. */
import {createHash} from 'node:crypto';
import {lstat,realpath} from 'node:fs/promises';
import {isAbsolute,resolve} from 'node:path';
import * as z from 'zod4';
import {readTrustedClimateFile} from './tiledEra5';

export const LINEAGE_LEAF_ROWS=2000,LINEAGE_LEAF_BYTES=512*1024,LINEAGE_NODE_BYTES=16*1024;
const digest=z.string().regex(/^[a-f0-9]{64}$/);
const integer=z.number().int().min(0).max(Number.MAX_SAFE_INTEGER);
const totalsShape={count:integer,rawCount:integer,decodedCount:integer,manifestCount:integer};
export const sourceRowSchema=z.strictObject({kind:z.enum(['raw','decoded','manifest']),revision:z.string().min(1).max(100),sha256:digest});
// Delimiters are excluded from identities so canonical membership keys cannot alias.
const identity=z.string().min(1).max(300).refine(value=>!value.includes('|'),'Membership identity delimiter');
export const membershipRowSchema=z.strictObject({edge:z.enum(['catalog-release','release-shard','shard-sources']),parent:identity,child:identity,sha256:digest,...totalsShape}).refine(row=>row.count===row.rawCount+row.decodedCount+row.manifestCount,'Membership source counts');
const format=z.enum(['era5-lineage-radix-v1','era5-membership-radix-v1']);
const pathSchema=z.string().min(1).max(300).refine(value=>!isAbsolute(value)&&!value.includes('\\')&&!value.includes(':')&&!value.split('/').some(part=>!part||part==='.'||part==='..'),'Lineage path');
export const rootDescriptorSchema=z.strictObject({format,rootPath:pathSchema,rootSha256:digest,rootBytes:z.number().int().min(1).max(LINEAGE_NODE_BYTES),...totalsShape});
export type SourceRow=z.infer<typeof sourceRowSchema>;
export type MembershipRow=z.infer<typeof membershipRowSchema>;
export type RootDescriptor=z.infer<typeof rootDescriptorSchema>;
export type LineageRow=SourceRow|MembershipRow;
export type LineageKind='source'|'membership';
export type LineageTotals={count:number;rawCount:number;decodedCount:number;manifestCount:number};
export interface ObjectRef {path:string;sha256:string;bytes:number}
export interface ChildDescriptor extends ObjectRef,LineageTotals {nibble:string;firstKey:string;lastKey:string}
export interface LineageObject extends LineageTotals {domain:RootDescriptor['format'];version:1;type:'node'|'leaf';prefix:string;children?:ChildDescriptor[];rows?:LineageRow[]}
const childSchema=z.strictObject({path:pathSchema,sha256:digest,bytes:z.number().int().min(1).max(LINEAGE_LEAF_BYTES),nibble:z.string().regex(/^[a-f0-9]$/),firstKey:z.string().min(1).max(1000),lastKey:z.string().min(1).max(1000),...totalsShape});
const common={domain:format,version:z.literal(1),prefix:z.string().regex(/^[a-f0-9]{0,4}$/),...totalsShape};
const nodeSchema=z.strictObject({...common,type:z.literal('node'),children:z.array(childSchema).max(16)});
const leafSchema=z.strictObject({...common,type:z.literal('leaf'),rows:z.array(z.union([sourceRowSchema,membershipRowSchema])).min(1).max(LINEAGE_LEAF_ROWS)});
export const lineageSha=(value:Buffer|string)=>createHash('sha256').update(value).digest('hex');
export function canonicalLineage(value:unknown):string {
 if(Array.isArray(value))return '['+value.map(canonicalLineage).join(',')+']';
 if(value!==null&&typeof value==='object')return '{'+Object.entries(value).sort(([a],[b])=>asciiCompare(a,b)).map(([key,item])=>JSON.stringify(key)+':'+canonicalLineage(item)).join(',')+'}';
 return JSON.stringify(value);
}
export const asciiCompare=(a:string,b:string)=>a<b?-1:a>b?1:0;
export const lineageKey=(row:LineageRow)=>'kind' in row?row.kind+'|'+row.revision:row.edge+'|'+row.parent+'|'+row.child;
export const lineagePrefix=(key:string)=>lineageSha(key).slice(0,4);
export function validateRootDescriptor(value:unknown):RootDescriptor {
 const descriptor=rootDescriptorSchema.parse(value);
 if(descriptor.format==='era5-lineage-radix-v1'&&descriptor.count!==descriptor.rawCount+descriptor.decodedCount+descriptor.manifestCount)throw Error('Lineage root count mismatch');
 return descriptor;
}
export function lineageTotals(rows:LineageRow[]):LineageTotals {
 const result={count:rows.length,rawCount:0,decodedCount:0,manifestCount:0};
 for(const row of rows){if('kind' in row)result[`${row.kind}Count`]++;else {result.rawCount+=row.rawCount;result.decodedCount+=row.decodedCount;result.manifestCount+=row.manifestCount;}}
 return result;
}
export const emptyLineageTotals=():LineageTotals=>({count:0,rawCount:0,decodedCount:0,manifestCount:0});
const totalKeys=['count','rawCount','decodedCount','manifestCount'] as const;
export function sumLineageTotals(items:LineageTotals[]):LineageTotals {const result=emptyLineageTotals();for(const item of items)for(const key of totalKeys){result[key]+=item[key];if(!Number.isSafeInteger(result[key]))throw Error('Lineage count overflow');}return result;}
function checkTotals(actual:LineageTotals,expected:LineageTotals){for(const key of totalKeys)if(actual[key]!==expected[key])throw Error('Lineage count mismatch');}

export interface LineageCache {get(key:string):Buffer|undefined;set(key:string,bytes:Buffer):void;inspect():{bytes:number;entries:number}}
export function createLineageCache(maxBytes=2*1024*1024):LineageCache {
 if(!Number.isSafeInteger(maxBytes)||maxBytes<0||maxBytes>2*1024*1024)throw Error('Lineage cache budget');
 const entries=new Map<string,Buffer>();let bytes=0;
 return {get(key){const result=entries.get(key);if(result){entries.delete(key);entries.set(key,result);}return result;},set(key,value){const prior=entries.get(key);if(prior){entries.delete(key);bytes-=prior.length;}if(value.length>maxBytes)return;while(bytes+value.length>maxBytes){const oldest=entries.keys().next().value!;bytes-=entries.get(oldest)!.length;entries.delete(oldest);}entries.set(key,value);bytes+=value.length;},inspect(){return {bytes,entries:entries.size};}};
}
export interface LineageReaderOptions {baseDirectory:string;cache?:LineageCache;onRead?:()=>void;onObject?:(ref:ObjectRef,buffer:Buffer)=>void|Promise<void>}
export function createLineageReader(options:LineageReaderOptions){
 const cache=options.cache??createLineageCache();
 async function safePath(path:string){
  pathSchema.parse(path);const base=await realpath(options.baseDirectory);if(resolve(base)!==resolve(options.baseDirectory))throw Error('Lineage root symlink');
  let cursor=base;for(const part of path.split('/')){cursor=resolve(cursor,part);if((await lstat(cursor)).isSymbolicLink())throw Error('Lineage symlink');}
  if(resolve(await realpath(cursor))!==cursor)throw Error('Lineage alias');return cursor;
 }
 async function read(ref:ObjectRef,prefix:string,descriptor:RootDescriptor):Promise<LineageObject>{
  const limit=prefix.length===4?LINEAGE_LEAF_BYTES:LINEAGE_NODE_BYTES;
  if(ref.bytes>limit)throw Error('Lineage object byte bound');
  const key=resolve(options.baseDirectory)+'|'+ref.path+'|'+ref.sha256;let bytes=cache.get(key);
  if(!bytes){bytes=await readTrustedClimateFile(await safePath(ref.path),ref.sha256,ref.bytes,options.onRead);if(bytes.length!==ref.bytes)throw Error('Lineage object bytes');cache.set(key,bytes);}
  // Validate expected size even when a different descriptor used this digest before.
  if(bytes.length!==ref.bytes)throw Error('Lineage object bytes');
  const parsed:unknown=JSON.parse(new TextDecoder('utf-8',{fatal:true}).decode(bytes));
  const object:LineageObject=prefix.length===4?leafSchema.parse(parsed):nodeSchema.parse(parsed);
  if(canonicalLineage(object)!==bytes.toString('utf8'))throw Error('Lineage canonical bytes');
  if(object.prefix!==prefix||object.domain!==descriptor.format)throw Error('Lineage radix prefix or domain');
  if(object.type==='leaf'){
   let previous:string|undefined;
   for(const row of object.rows!){if(('kind' in row)!==(descriptor.format==='era5-lineage-radix-v1'))throw Error('Lineage row domain');const key=lineageKey(row);if(previous!==undefined&&asciiCompare(previous,key)>=0)throw Error('Lineage duplicate or reordered keys');if(lineagePrefix(key)!==prefix)throw Error('Lineage radix prefix');previous=key;}
   checkTotals(object,lineageTotals(object.rows!));
  }else{
   let previous='';const paths=new Set<string>();
   for(const child of object.children!){if(child.nibble<=previous||paths.has(child.path)||child.count<1||child.firstKey>child.lastKey)throw Error('Lineage child order, key range or duplicate');if(prefix.length<3&&child.bytes>LINEAGE_NODE_BYTES)throw Error('Lineage node byte bound');previous=child.nibble;paths.add(child.path);}
   checkTotals(object,sumLineageTotals(object.children!));
  }
  await options.onObject?.(ref,bytes);return object;
 }
 function rootRef(root:RootDescriptor):ObjectRef{return {path:root.rootPath,sha256:root.rootSha256,bytes:root.rootBytes};}
 async function rootObject(value:RootDescriptor){const descriptor=validateRootDescriptor(value);const object=await read(rootRef(descriptor),'',descriptor);checkTotals(object,descriptor);return {descriptor,object};}
 async function childObject(child:ChildDescriptor,prefix:string,descriptor:RootDescriptor){const object=await read(child,prefix+child.nibble,descriptor);checkTotals(object,child);const keys=object.type==='leaf'?object.rows!.map(lineageKey):object.children!.flatMap(item=>[item.firstKey,item.lastKey]);keys.sort(asciiCompare);if(keys[0]!==child.firstKey||keys.at(-1)!==child.lastKey)throw Error('Lineage child key range');return object;}
 return {
  async verifyRoot(descriptor:RootDescriptor):Promise<void>{await rootObject(descriptor);},
  async lookup(value:RootDescriptor,key:string):Promise<LineageRow|undefined>{const {descriptor,object:root}=await rootObject(value);const route=lineagePrefix(key);let object=root;for(let depth=0;depth<4;depth++){const child=object.children!.find(item=>item.nibble===route[depth]);if(!child)return undefined;object=await childObject(child,route.slice(0,depth),descriptor);}return object.rows!.find(row=>lineageKey(row)===key);},
  async *walk(value:RootDescriptor):AsyncGenerator<LineageRow>{const {descriptor,object}=await rootObject(value);async function* visit(current:LineageObject):AsyncGenerator<LineageRow>{if(current.type==='leaf'){yield* current.rows!;return;}for(const child of current.children!)yield* visit(await childObject(child,current.prefix,descriptor));}yield* visit(object);},
 };
}
