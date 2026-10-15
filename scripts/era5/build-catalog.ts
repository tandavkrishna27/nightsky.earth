import {randomUUID} from 'node:crypto';
import {fileURLToPath} from 'node:url';
import * as z from 'zod4';
import {resolve} from 'node:path';
/** Offline catalog publication over existing pinned release roots. No acquisition. */
import {open,link,unlink} from 'node:fs/promises';
import {dirname,isAbsolute,join} from 'node:path';
import {readTrustedClimateFile} from '../../server/providers/climate/tiledEra5';
import {releasePath,releaseSha,canonicalRelease,releaseEra5Schema,validateRelease,sharedReleaseMetadata,mergeReleaseRevisions} from '../../server/providers/climate/releaseEra5';
import {catalogEra5Schema,validateCatalog,coverageIdentity,catalogInventoryIdentity,type Era5Catalog} from '../../server/providers/climate/catalogEra5';
export async function publishClimateCatalog(options:{outputPath:string;inputs:ReadonlyArray<{path:string;sha256:string}>}|import('./build-lineage-release').LineageCatalogOptions){
 if('schemaVersion' in options){if(options.schemaVersion!==5)throw Error('Unknown catalog format');return (await import('./build-lineage-release')).publishLineageCatalog(options);}
 if(!isAbsolute(options.outputPath)||options.inputs.length<1||options.inputs.length>256)throw Error('Catalog absolute output and 1..256 children required');
 const began=performance.now(),check=()=>{if(performance.now()-began>30*60*1000)throw Error('Catalog deadline');};
 const children:Era5Catalog['children']=[];let shared:string|undefined,totalBytes=0;let revisions:ReturnType<typeof mergeReleaseRevisions>=[];
 for(const input of options.inputs){check();const path=await releasePath(dirname(options.outputPath),input.path);const bytes=await readTrustedClimateFile(path,input.sha256,4*1024*1024);totalBytes+=bytes.length;if(totalBytes>1024*1024*1024)throw Error('Catalog input byte budget');const data=releaseEra5Schema.parse(JSON.parse(bytes.toString('utf8')));validateRelease(data);revisions=mergeReleaseRevisions([revisions,data.metadata.sourceRevisions]);const metadata=canonicalRelease(sharedReleaseMetadata(data.metadata));if(shared!==undefined&&shared!==metadata)throw Error('Catalog child method/period/grid/policy mismatch');shared=metadata;const keys=data.shards.flatMap(s=>s.keys).sort();children.push({path:input.path,sha256:input.sha256,bytes:bytes.length,first:keys[0]!,last:keys.at(-1)!,pairCount:keys.length,inventorySha256:coverageIdentity(keys)});}
 children.sort((a,b)=>a.first<b.first?-1:a.first>b.first?1:0);
 const catalog=catalogEra5Schema.parse({schemaVersion:4,coverage:'explicit-cell-timezone-pairs; missing-is-unknown',pairCount:children.reduce((n,c)=>n+c.pairCount,0),inventorySha256:catalogInventoryIdentity(children),sharedMetadataSha256:releaseSha(shared!),sourceRevisionsSha256:releaseSha(canonicalRelease(revisions)),metadata:JSON.parse(shared!),children});validateCatalog(catalog);const bytes=canonicalRelease(catalog)+'\n';if(Buffer.byteLength(bytes)>256*1024)throw Error('Catalog output byte budget');for(const input of options.inputs){check();totalBytes+=(await readTrustedClimateFile(await releasePath(dirname(options.outputPath),input.path),input.sha256,4*1024*1024)).length;if(totalBytes>1024*1024*1024)throw Error('Catalog input byte budget');}const temporary=join(dirname(options.outputPath),'.catalog-'+randomUUID()+'.tmp');const file=await open(temporary,'wx');try{try{await file.writeFile(bytes);await file.sync();}finally{await file.close();}check();await link(temporary,options.outputPath);}finally{await unlink(temporary);}return {manifestPath:options.outputPath,manifestSha256:releaseSha(bytes),pairCount:catalog.pairCount};
}

const configSchema=z.strictObject({outputPath:z.string().min(1),inputs:z.array(z.strictObject({path:z.string().min(1).max(300),sha256:z.string().regex(/^[a-f0-9]{64}$/)})).min(1).max(256)});
if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url)){
 (async()=>{const args=process.argv.slice(2);if(args.length!==4||args[0]!=='--config'||args[2]!=='--expected-config-sha256')throw Error('Required --config PATH --expected-config-sha256 SHA256');const bytes=await readTrustedClimateFile(resolve(args[1]!),args[3]!,1024*1024);const raw=JSON.parse(new TextDecoder('utf-8',{fatal:true}).decode(bytes));const config=raw.schemaVersion===5?(await import('./build-lineage-release')).lineageCatalogOptionsSchema.parse(raw):configSchema.parse(raw);console.log(JSON.stringify(await publishClimateCatalog(config)));})().catch(e=>{console.error(e instanceof Error?e.message:'Catalog publication failed');process.exitCode=1;});
}
