import {open,lstat,realpath} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {resolve,dirname,parse,join} from 'node:path';
import {catalogueTreeLeafKinds,catalogueRootSchema,cataloguePageSchema,pageRefSchema,freezeDeep,MAX_DIRECTORY_BYTES,MAX_LEAF_BYTES,type PageRef,type CataloguePage,type CatalogueTree} from './catalogueFormat';
export * from './catalogueFormat';
export interface CatalogueBudget {leaves:number;directoryBytes:number;deadline:number;maxLeaves:number;maxDirectoryBytes:number;stopReason?:'leaf-limit'|'directory-byte-limit'|'time-limit';}
export class CatalogueBudgetStop extends Error {constructor(public readonly reason:string){super(`Catalogue budget stop: ${reason}`);}}
export function createCatalogueBudget(options:{maxLeaves?:number;maxDirectoryBytes?:number;timeoutMs?:number}={}):CatalogueBudget {const maxLeaves=options.maxLeaves??256,maxDirectoryBytes=options.maxDirectoryBytes??32*1024*1024,timeoutMs=options.timeoutMs??10000;for(const [n,max]of [[maxLeaves,256],[maxDirectoryBytes,32*1024*1024],[timeoutMs,10000]])if(!Number.isSafeInteger(n)||n<1||n>max)throw new RangeError('Invalid catalogue query budget');return {leaves:0,directoryBytes:0,deadline:Date.now()+timeoutMs,maxLeaves,maxDirectoryBytes};}
function checkpoint(b:CatalogueBudget){if(b.stopReason)throw new CatalogueBudgetStop(b.stopReason);if(Date.now()>=b.deadline){b.stopReason='time-limit';throw new CatalogueBudgetStop(b.stopReason);}}
async function rejectLinks(path:string){const absolute=resolve(path);let cursor=parse(absolute).root;for(const part of absolute.slice(cursor.length).split(/[\\/]/).filter(Boolean)){cursor=join(cursor,part);if((await lstat(cursor)).isSymbolicLink())throw new TypeError('Symlink artifact path rejected');}return absolute;}
async function boundedRead(path:string,limit:number,hash:string,exact?:number){await rejectLinks(path);const h=await open(path,'r');try{const st=await h.stat();if(!st.isFile()||st.size>limit)throw new RangeError('Catalogue artifact byte limit');if(exact!==undefined&&st.size!==exact)throw new TypeError('Catalogue byte count mismatch');const buffer=Buffer.alloc(limit+1);let n=0;while(n<buffer.length){const r=await h.read(buffer,n,buffer.length-n,null);if(!r.bytesRead)break;n+=r.bytesRead;}if(n>limit)throw new RangeError('Catalogue artifact byte limit');const data=buffer.subarray(0,n);if(exact!==undefined&&n!==exact)throw new TypeError('Catalogue byte count mismatch');if(createHash('sha256').update(data).digest('hex')!==hash)throw new TypeError('Catalogue checksum mismatch');return data;}finally{await h.close();}}
export async function loadCatalogueFiles(path:string,options:{expectedSha256:string;maxCachePages?:number;maxCacheBytes?:number;maxCacheRows?:number;maxQueuedReads?:number}){
 if(!/^[a-f0-9]{64}$/.test(options.expectedSha256))throw new TypeError('Pinned root checksum required');
 const canonical=await rejectLinks(path),rootDir=dirname(await realpath(canonical));const root=freezeDeep(catalogueRootSchema.parse(JSON.parse((await boundedRead(canonical,MAX_DIRECTORY_BYTES,options.expectedSha256)).toString('utf8'))));
 const maxPages=options.maxCachePages??2,maxBytes=options.maxCacheBytes??8*1024*1024,maxRows=options.maxCacheRows??20000,maxQueue=options.maxQueuedReads??8;
 for(const[n,max]of [[maxPages,2],[maxBytes,8*1024*1024],[maxRows,20000],[maxQueue,8]])if(!Number.isSafeInteger(n)||n<1||n>max)throw new RangeError('Invalid catalogue cache limit');
 const cache=new Map<string,{ref:PageRef,page:CataloguePage}>();let bytes=0,rows=0,loads=0,evictions=0,queued=0;let tail:Promise<unknown>=Promise.resolve();
 async function perform(raw:PageRef,budget:CatalogueBudget){checkpoint(budget);const ref=pageRefSchema.parse(raw);if(ref.kind==='directory'){if(budget.directoryBytes+ref.bytes>budget.maxDirectoryBytes){budget.stopReason='directory-byte-limit';throw new CatalogueBudgetStop(budget.stopReason);}budget.directoryBytes+=ref.bytes;}else{if(budget.leaves>=budget.maxLeaves){budget.stopReason='leaf-limit';throw new CatalogueBudgetStop(budget.stopReason);}budget.leaves++;}
 const key=ref.path+':'+ref.sha256;const cached=cache.get(key);if(cached){if(JSON.stringify(cached.ref)!==JSON.stringify(ref))throw new TypeError('Conflicting page references');cache.delete(key);cache.set(key,cached);return cached.page;}
 if(ref.bytes>maxBytes||ref.rows>maxRows)throw new RangeError('Page exceeds resident budget');
 const payload=await boundedRead(resolve(rootDir,ref.path),ref.kind==='directory'?MAX_DIRECTORY_BYTES:MAX_LEAF_BYTES,ref.sha256,ref.bytes);checkpoint(budget);const page=cataloguePageSchema.parse(JSON.parse(payload.toString('utf8')));if(page.catalogueRevision!==root.catalogueRevision||page.kind!==ref.kind)throw new TypeError('Catalogue edition or page kind mismatch');const count=page.kind==='directory'?page.entries.length:page.rows.length;if(count!==ref.rows)throw new TypeError('Catalogue row count mismatch');
  if(page.kind==='directory'){const paths=new Set<string>();for(const child of page.entries){if(paths.has(child.path))throw new TypeError('Duplicate directory child');paths.add(child.path);if(ref.bounds&&(!child.bounds||child.bounds.south<ref.bounds.south||child.bounds.north>ref.bounds.north||child.bounds.west<ref.bounds.west||child.bounds.east>ref.bounds.east))throw new TypeError('Directory child outside routing bounds');if(ref.minKey!==undefined&&(child.minKey===undefined||child.maxKey===undefined||child.minKey<ref.minKey||child.maxKey>ref.maxKey!))throw new TypeError('Directory child outside routing key range');}}
 if(page.kind!=='directory'&&page.kind!=='candidates'){for(const r of page.rows){const key='key'in r?r.key:'regionId'in r?r.regionId:r.footprintId;if(ref.minKey!==undefined&&(key<ref.minKey||key>ref.maxKey!))throw new TypeError('Row outside routing key range');if(page.kind==='footprints'){const b=(r as Extract<CataloguePage,{kind:'footprints'}>['rows'][number]).bounds;if(ref.bounds&&(b.south<ref.bounds.south||b.north>ref.bounds.north||b.west<ref.bounds.west||b.east>ref.bounds.east))throw new TypeError('Footprint outside routing bounds');}}}
 if(page.kind==='candidates'){const ids=new Set<string>();for(const r of page.rows){if(r.catalogueRevision!==root.catalogueRevision||ids.has(r.placeId))throw new TypeError('Candidate revision or duplicate identity mismatch');ids.add(r.placeId);if(ref.bounds&&(r.latitude<ref.bounds.south||r.latitude>ref.bounds.north||r.longitude<ref.bounds.west||r.longitude>ref.bounds.east))throw new TypeError('Candidate outside point bounds');}}
 while(cache.size>=maxPages||bytes+ref.bytes>maxBytes||rows+ref.rows>maxRows){const oldKey=cache.keys().next().value!;const old=cache.get(oldKey)!;cache.delete(oldKey);bytes-=old.ref.bytes;rows-=old.ref.rows;evictions++;}freezeDeep(page);cache.set(key,{ref,page});bytes+=ref.bytes;rows+=ref.rows;loads++;return page;
 }
 function readPage(ref:PageRef,budget=createCatalogueBudget()){if(queued>=maxQueue)return Promise.reject(new RangeError('Catalogue read queue limit'));queued++;const result=tail.then(()=>perform(ref,budget));tail=result.catch(()=>undefined);return result.finally(()=>{queued--;});}
 async function* walk(tree:CatalogueTree,opts:{accept?:(ref:PageRef)=>boolean;budget?:CatalogueBudget}={}) {
  const budget=opts.budget??createCatalogueBudget();
  const expectedKind=catalogueTreeLeafKinds[tree];
  const stack=[root.trees[tree]];
  const seen=new Set<string>();
  const validateTreeRef=(ref:PageRef)=>{
   if(ref.kind!=='directory'&&ref.kind!==expectedKind)throw new TypeError(`Unexpected ${tree} tree leaf kind: ${ref.kind}`);
  };
  try {
   while(stack.length) {
    checkpoint(budget);
    const ref=stack.pop()!;
    validateTreeRef(ref);
    if(opts.accept&&!opts.accept(ref))continue;
    if(seen.has(ref.path))throw new TypeError('Repeated or cyclic catalogue page');
    seen.add(ref.path);
    const page=await readPage(ref,budget);
    if(page.kind==='directory') {
     for(const child of page.entries)validateTreeRef(child);
     for(let i=page.entries.length-1;i>=0;i--)stack.push(page.entries[i]);
    } else {
     yield page;
    }
   }
  } catch(error) {
   if(!(error instanceof CatalogueBudgetStop))throw error;
  }
 } return {root,readPage,walk,createBudget:createCatalogueBudget,stats:()=>({residentPages:cache.size,residentBytes:bytes,residentRows:rows,loads,evictions,queuedReads:queued,maxConcurrentLoads:1})};
}
export type CatalogueFiles=Awaited<ReturnType<typeof loadCatalogueFiles>>;
