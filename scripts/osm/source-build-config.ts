/** Explicit, checksum-pinned controls; no commands, partition merge or cap increases. */

import {createHash} from 'node:crypto';
import {z} from 'zod4';
import {catalogueRevisionSchema} from '../../shared/nightsky/discovery';
import {safe,jsonlRows} from './build-source-catalogue';
const integer=(maximum:number,minimum=1)=>z.number().int().safe().min(minimum).max(maximum);
const pin=z.object({bytes:integer(10*1024**3,0),sha256:z.string().regex(/^[a-f0-9]{64}$/)}).strict();
export const streamLimitsSchema=z.object({maxRowBytes:integer(4*1024**2).optional(),maxBytes:integer(10*1024**3).optional(),maxRows:integer(10000000).optional()}).strict();
export const catalogueOptionsSchema=z.object({chunkRows:integer(10000).optional(),mergeFanIn:integer(16,2).optional(),maxRows:integer(10000).optional(),fanout:integer(256,2).optional(),maxInputRows:integer(10000000).optional(),maxMetadataRows:integer(10000).optional(),maxInputBytes:integer(10*1024**3).optional(),maxOutputBytes:integer(10*1024**3).optional(),maxScratchBytes:integer(10*1024**3).optional(),timeoutMs:integer(1800000).optional()}).strict();
export const buildConfigSchema=z.object({schemaVersion:z.literal(1),catalogueRevision:catalogueRevisionSchema,stream:streamLimitsSchema,catalogue:catalogueOptionsSchema,files:z.object({regions:pin,footprints:pin}).strict()}).strict();
export async function loadBuildConfig(path:string,sha256:string){
 if(!/^[a-f0-9]{64}$/.test(sha256))throw new TypeError('Build config digest required');
 const absolute=await safe(path);
 // Bounded read through the same handle-based reader used for descriptors.
 const {open}=await import('node:fs/promises');const h=await open(absolute,'r');let payload:Buffer;
 try{const stat=await h.stat();if(!stat.isFile()||stat.size>65536)throw new RangeError('Build config byte limit');payload=Buffer.alloc(stat.size);let at=0;while(at<payload.length){const {bytesRead}=await h.read(payload,at,payload.length-at,null);if(!bytesRead)throw new TypeError('Build config mutation');at+=bytesRead;}const after=await h.stat();if(after.size!==stat.size||after.mtimeMs!==stat.mtimeMs)throw new TypeError('Build config mutation');}finally{await h.close();}
 if(createHash('sha256').update(payload).digest('hex')!==sha256)throw new TypeError('Build config digest mismatch');
 return buildConfigSchema.parse(JSON.parse(new TextDecoder('utf8',{fatal:true}).decode(payload)));
}
export type SourceBuildConfig=z.infer<typeof buildConfigSchema>;
export async function verifyMetadata(path:string,pinValue:z.infer<typeof pin>,stream:z.infer<typeof streamLimitsSchema>){
 for await(const row of jsonlRows(path,{...stream,maxRows:10000,pin:pinValue}))void row;
}
