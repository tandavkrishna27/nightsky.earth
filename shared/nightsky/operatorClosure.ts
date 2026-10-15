import {catalogEra5Schema,validateCatalog,coverageIdentity} from '../../server/providers/climate/catalogEra5';
import {loadCatalogueFiles} from '../../server/places/catalogueFiles';
/** Exhaustive offline traversal of published formats; never promotes or contacts a host. */
import {posix,resolve} from 'node:path';
import {catalogueRootSchema,catalogueTreeLeafKinds,type PageRef} from '../../server/places/catalogueFormat';
import {releaseEra5Schema,validateRelease,releaseMetadata,sharedReleaseMetadata,canonicalRelease,releasePath,releaseSha,mergeReleaseRevisions} from '../../server/providers/climate/releaseEra5';
import {readTrustedClimateFile,tiledEra5ManifestSchema,tiledEra5TileSchema,validateTiledEra5Manifest,validateTiledEra5Tile} from '../../server/providers/climate/tiledEra5';
import type {OperatorArtifact} from './operator';
export interface OperatorClosureLimits { maxTotalBytes?:number; maxArtifactBytes?:number; maxReferences?:number; maxElapsedMs?:number }
export async function validateOperatorReleaseClosure(root:string,inventory:OperatorArtifact[],limits:OperatorClosureLimits={}){
 const maxTotal=limits.maxTotalBytes??Number.MAX_SAFE_INTEGER,maxArtifact=limits.maxArtifactBytes??16*1024**3,maxReferences=limits.maxReferences??3_000_000,maxElapsedMs=limits.maxElapsedMs??30*60*1000;
 if([maxTotal,maxArtifact,maxReferences,maxElapsedMs].some(n=>!Number.isSafeInteger(n)||n<0)||maxArtifact>16*1024**3||maxReferences>3_000_000||maxElapsedMs>30*60*1000)throw Error('Closure limits');
 const started=performance.now();let references=0,totalBytes=inventory.reduce((n,a)=>n+BigInt(a.bytes),BigInt(0));
 function bound(){if(totalBytes>BigInt(maxTotal)||performance.now()-started>maxElapsedMs)throw Error('Closure budget');}
 bound();
 if(inventory.length>10000)throw Error('Closure inventory bound');
 const byPath=new Map(inventory.map(a=>[a.path,a]));
 if(new Set(inventory.map(a=>a.path.toLowerCase())).size!==inventory.length)throw Error('Closure inventory alias');
 async function json(a:OperatorArtifact,limit:number){bound();if(++references>maxReferences||a.bytes>limit||a.bytes>maxArtifact)throw Error('Closure bound');const path=await releasePath(resolve(root),a.path);const body=await readTrustedClimateFile(path,a.sha256,limit);bound();if(body.length!==a.bytes)throw Error('Closure bytes');return JSON.parse(new TextDecoder('utf-8',{fatal:true}).decode(body));}
 function child(base:string,ref:{path:string;sha256:string;bytes:number},derived=false){if(ref.path.includes('\\')||ref.path.includes(':')||ref.path.startsWith('/')||ref.path.split('/').some(p=>!p||p==='.'||p==='..'))throw Error('Closure path');const path=posix.join(base,ref.path),a=byPath.get(path);if(a){if(a.sha256!==ref.sha256||a.bytes!==ref.bytes)throw Error('Closure inventory');return a;}if(!derived)throw Error('Closure inventory');totalBytes+=BigInt(ref.bytes);bound();return {id:path,kind:'component' as const,path,sha256:ref.sha256,bytes:ref.bytes,version:'manifest-derived'};}
 for(const a of inventory){
  if(a.kind==='global-catalogue'){
   const manifest=catalogueRootSchema.parse(await json(a,1024*1024)),base=posix.dirname(a.path),seen=new Map<string,string>();
   const files=await loadCatalogueFiles(await releasePath(resolve(root),a.path),{expectedSha256:a.sha256});
   const page=async(ref:PageRef,ancestors:Set<string>,expected:string,treeSeen:Set<string>):Promise<void>=>{
    if(ref.kind!=='directory'&&ref.kind!==expected)throw Error('Closure tree kind');
    const item=child(base,ref),identity=JSON.stringify(ref);
    if(ancestors.has(item.path))throw Error('Closure cycle');
    // Match one production walk: every directory/leaf path occurs only once in that tree.
    if(treeSeen.has(item.path))throw Error('Closure repeated tree page');
    treeSeen.add(item.path);
    const old=seen.get(item.path);
    if(old&&old!==identity)throw Error('Closure descriptor alias');
    seen.set(item.path,identity);
    if(seen.size>inventory.length)throw Error('Closure bound');
    await json(item,ref.kind==='directory'?1024*1024:4*1024*1024);
    const data=await files.readPage(ref);
    if(data.kind!==ref.kind||data.catalogueRevision!==manifest.catalogueRevision||(data.kind==='directory'?data.entries.length:data.rows.length)!==ref.rows)throw Error('Closure page identity');
    const next=new Set(ancestors).add(item.path);
    if(data.kind==='directory'){
     for(const entry of data.entries)await page(entry,next,expected,treeSeen);
    }else if(data.kind==='ids'||data.kind==='memberships'){
     // Index row pointers are independent reads and may share candidate pages.
     for(const row of data.rows)if(row.page)await page(row.page,next,'candidates',new Set());
    }
   };
   for(const tree of Object.keys(manifest.trees) as (keyof typeof manifest.trees)[])await page(manifest.trees[tree],new Set(),catalogueTreeLeafKinds[tree],new Set());
  }
  if(a.kind==='era5-release'){
   const parsed=await json(a,4*1024*1024);
   const walkRelease=async(item:OperatorArtifact,release:ReturnType<typeof releaseEra5Schema.parse>,derived:boolean)=>{
    validateRelease(release);const base=posix.dirname(item.path);
    for(const ref of release.shards){
     const shard=child(base,ref,derived),manifest=tiledEra5ManifestSchema.parse(await json(shard,4*1024*1024));validateTiledEra5Manifest(manifest);
     if(manifest.tiles.length>10||canonicalRelease(sharedReleaseMetadata(releaseMetadata(manifest)))!==canonicalRelease(sharedReleaseMetadata(release.metadata))||canonicalRelease(manifest.sourceRevisions)!==canonicalRelease(ref.sourceRevisions)||canonicalRelease(manifest.tiles.map(t=>t.key).sort())!==canonicalRelease([...ref.keys].sort()))throw Error('Closure shard identity');
     for(const tile of manifest.tiles){const file=child(posix.dirname(shard.path),tile,derived),data=tiledEra5TileSchema.parse(await json(file,8*1024*1024));validateTiledEra5Tile(data,manifest,tile);}
    }
   }
   if(parsed.schemaVersion===4){
    // Only this explicitly pinned root grants descriptor-derived authority.
    const catalog=catalogEra5Schema.parse(parsed);validateCatalog(catalog);let revisions:ReturnType<typeof mergeReleaseRevisions>=[];
    for(const ref of catalog.children){
     const item=child(posix.dirname(a.path),ref,true),data=releaseEra5Schema.parse(await json(item,4*1024*1024));validateRelease(data);
     revisions=mergeReleaseRevisions([revisions,data.metadata.sourceRevisions]);const keys=data.shards.flatMap(s=>s.keys).sort();
     if(keys.length!==ref.pairCount||keys[0]!==ref.first||keys.at(-1)!==ref.last||coverageIdentity(keys)!==ref.inventorySha256||releaseSha(canonicalRelease(sharedReleaseMetadata(data.metadata)))!==catalog.sharedMetadataSha256)throw Error('Closure catalog identity');
     await walkRelease(item,data,true);
    }
    if(releaseSha(canonicalRelease(revisions))!==catalog.sourceRevisionsSha256)throw Error('Closure catalog source union');
   }else await walkRelease(a,releaseEra5Schema.parse(parsed),false);
  }
 }
 bound();return {accountedBytes:Number(totalBytes),references};
}
