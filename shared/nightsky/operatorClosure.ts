import {loadCatalogueFiles} from '../../server/places/catalogueFiles';
/** Exhaustive offline traversal of published formats; never promotes or contacts a host. */
import {posix,resolve} from 'node:path';
import {catalogueRootSchema,catalogueTreeLeafKinds,type PageRef} from '../../server/places/catalogueFormat';
import {releaseEra5Schema,validateRelease,releaseMetadata,sharedReleaseMetadata,canonicalRelease,releasePath} from '../../server/providers/climate/releaseEra5';
import {readTrustedClimateFile,tiledEra5ManifestSchema,tiledEra5TileSchema,validateTiledEra5Manifest,validateTiledEra5Tile} from '../../server/providers/climate/tiledEra5';
import type {OperatorArtifact} from './operator';
export async function validateOperatorReleaseClosure(root:string,inventory:OperatorArtifact[]){
 const byPath=new Map(inventory.map(a=>[a.path,a]));
 async function json(a:OperatorArtifact,limit:number){if(a.bytes>limit)throw Error('Closure bound');const path=await releasePath(resolve(root),a.path);const body=await readTrustedClimateFile(path,a.sha256,limit);if(body.length!==a.bytes)throw Error('Closure bytes');return JSON.parse(new TextDecoder('utf-8',{fatal:true}).decode(body));}
 function child(base:string,ref:{path:string;sha256:string;bytes:number}){if(ref.path.includes('\\')||ref.path.includes(':')||ref.path.startsWith('/')||ref.path.split('/').some(p=>!p||p==='.'||p==='..'))throw Error('Closure path');const path=posix.join(base,ref.path),a=byPath.get(path);if(!a||a.sha256!==ref.sha256||a.bytes!==ref.bytes)throw Error('Closure inventory');return a;}
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
   const release=releaseEra5Schema.parse(await json(a,4*1024*1024));validateRelease(release);const base=posix.dirname(a.path);
   for(const ref of release.shards){const shard=child(base,ref),manifest=tiledEra5ManifestSchema.parse(await json(shard,4*1024*1024));validateTiledEra5Manifest(manifest);if(manifest.tiles.length>10||canonicalRelease(sharedReleaseMetadata(releaseMetadata(manifest)))!==canonicalRelease(sharedReleaseMetadata(release.metadata))||canonicalRelease(manifest.sourceRevisions)!==canonicalRelease(ref.sourceRevisions)||canonicalRelease(manifest.tiles.map(t=>t.key).sort())!==canonicalRelease([...ref.keys].sort()))throw Error('Closure shard identity');for(const tile of manifest.tiles){const file=child(posix.dirname(shard.path),tile),data=tiledEra5TileSchema.parse(await json(file,8*1024*1024));validateTiledEra5Tile(data,manifest,tile);}}
  }
 }
}
