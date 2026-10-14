/** Offline manifest assembly only. Never acquires source data; output directory must be new. */
import { mkdir, writeFile, open } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { resolve, join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { loadOsmCandidateIndex } from '../../server/places/osmCandidates';
import { regionalOsmManifestSchema, type RegionalOsmManifest } from '../../server/places/regionalOsm';
export async function buildRegionalManifest(output:string,inputs:{id:string;path:string;sha256:string}[]) {
 if(!inputs.length||inputs.length>32)throw new RangeError('Require 1 to 32 reviewed regions.');
 const regions:RegionalOsmManifest['regions']=[];const copies:Buffer[]=[];let aggregateRows=0;
 for(const item of inputs){if(!/^[a-z0-9-]{1,64}$/.test(item.id)||regions.some(r=>r.id===item.id))throw new TypeError('Unique safe region ID required.');
 const index=await loadOsmCandidateIndex(item.path,{maxArtifactBytes:4*1024*1024,expectedSha256:item.sha256});if(!index)throw new TypeError('Reviewed region missing.');
 if(index.candidates.length>10000||(aggregateRows+=index.candidates.length)>100000)throw new RangeError('Regional/aggregate row budget exceeded.');
 if(!index.candidates.length)throw new TypeError('Cannot derive point bounds for empty region.');
 const handle=await open(item.path,'r');let bytes:Buffer;
 try{const limit=4*1024*1024;if((await handle.stat()).size>limit)throw new RangeError('Region byte budget exceeded.');const buffer=Buffer.alloc(limit+1);let total=0;while(total<buffer.length){const result=await handle.read(buffer,total,buffer.length-total,null);if(!result.bytesRead)break;total+=result.bytesRead;}if(total>limit)throw new RangeError('Region byte budget exceeded.');bytes=buffer.subarray(0,total);}finally{await handle.close();}
 if(bytes.length>4*1024*1024||createHash('sha256').update(bytes).digest('hex')!==item.sha256.toLowerCase())throw new TypeError('Reviewed copy checksum mismatch.');
 const lat=index.candidates.map(c=>c.latitude),lon=index.candidates.map(c=>c.longitude);
 regions.push({id:item.id,path:item.id+'.json',sha256:item.sha256.toLowerCase(),bytes:bytes.length,rows:index.candidates.length,vintage:index.vintage,coverage:index.coverage,source:index.source,bounds:{south:Math.min(...lat),north:Math.max(...lat),west:Math.min(...lon),east:Math.max(...lon)}});copies.push(bytes);
 }
 const manifest=regionalOsmManifestSchema.parse({schemaVersion:1,regions});const payload=Buffer.from(JSON.stringify(manifest,null,2)+'\n');
 await mkdir(output); // immutable version directory, never overwrite a reviewed version
 for(let i=0;i<regions.length;i++)await writeFile(join(output,regions[i].path),copies[i],{flag:'wx'});
 await writeFile(join(output,'manifest.json'),payload,{flag:'wx'});
 return {manifest,manifestSha256:createHash('sha256').update(payload).digest('hex'),manifestBytes:payload.length};
}
if(process.argv[1]&&import.meta.url===pathToFileURL(resolve(process.argv[1])).href){
 const [output,...entries]=process.argv.slice(2);if(!output||entries.length%3)throw new Error('Use OUTPUT ID PATH SHA256 [ID PATH SHA256 ...]');
 const inputs=[];for(let i=0;i<entries.length;i+=3)inputs.push({id:entries[i],path:entries[i+1],sha256:entries[i+2]});
 console.log(JSON.stringify(await buildRegionalManifest(resolve(output),inputs),null,2));
}
