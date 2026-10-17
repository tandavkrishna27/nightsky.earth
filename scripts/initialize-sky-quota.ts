/** Offline fresh-ledger setup. Serving startup never calls this initializer. */
import { open } from 'node:fs/promises';
import * as z from 'zod4';
import { isAbsolute, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createPersistentQuota } from '../server/providers/quotaState';
import { parseSkyConfiguration, SKY_QUOTA_POLICIES } from '../server/providers/skyConfiguration';
type Environment=Record<string,string|undefined>;
export function skyQuotaPoliciesForInitialization(environment:Environment) {
 const {selected}=parseSkyConfiguration(environment);
 if(!selected.length)throw Error('Select at least one optional sky provider.');
 return SKY_QUOTA_POLICIES.filter(p=>selected.includes(p.providerId as typeof selected[number])).map(p=>({...p}));
}
export async function initializeSkyQuota(environment:Environment) {
 const evidence=environment.NIGHTSKY_SKY_QUOTA_VERIFICATION_EVIDENCE,path=environment.NIGHTSKY_SKY_QUOTA_STATE_PATH;
 if(environment.NIGHTSKY_SKY_QUOTA_VERIFIED_UNUSED_BUDGET!=='yes'||!evidence||evidence.trim().length<8||evidence.length>500||/[\x00-\x1f\x7f]/.test(evidence)||!path||!isAbsolute(path))throw Error('Explicit verified unused budget attestation, nonsecret evidence and absolute sky quota path are required.');
 const identity=(p:string)=>process.platform==='win32'?resolve(p).toLowerCase():resolve(p);
 if(environment.NIGHTSKY_QUOTA_STATE_PATH&&identity(path)===identity(environment.NIGHTSKY_QUOTA_STATE_PATH))throw Error('Sky quotas require their own private ledger.');
 const policies=skyQuotaPoliciesForInitialization(environment);
 const quota=await createPersistentQuota({path,now:Date.now,policies});
 try{await quota.initializeVerifiedBudget({verifiedUnusedBudget:true,evidence});}finally{await quota.close();}
}
const usageSchema=z.strictObject({verifiedAllowance:z.literal(true),verifiedAllAccountUsage:z.literal(true),allConsumersQuiesced:z.literal(true),evidence:z.string().trim().min(8).max(500).regex(/^[^\x00-\x1f\x7f]+$/),observedAt:z.number().int().nonnegative(),usedLast24Hours:z.number().int().nonnegative(),usedCurrentMonth:z.number().int().nonnegative()});
const usagePacketSchema=z.strictObject({decision:z.literal('approved-initialize-sky-usage'),quotaPath:z.string().refine(isAbsolute),expiresAt:z.string().datetime(),usage:z.record(z.string(),usageSchema)});
async function initializeWithUsage(packetPath:string,environment:Environment) {
 const file=await open(packetPath,'r');let raw:unknown;
 try {const stat=await file.stat();if(!stat.isFile()||stat.size>16384)throw Error('Invalid usage packet');const bytes=Buffer.alloc(16385);const {bytesRead}=await file.read(bytes,0,bytes.length,0);if(bytesRead>16384)throw Error('Oversized usage packet');raw=JSON.parse(new TextDecoder('utf-8',{fatal:true}).decode(bytes.subarray(0,bytesRead)));}finally{await file.close();}
 const packet=usagePacketSchema.parse(raw),path=environment.NIGHTSKY_SKY_QUOTA_STATE_PATH;
 const identity=(p:string)=>process.platform==='win32'?resolve(p).toLowerCase():resolve(p);
 if(!path||!isAbsolute(path)||identity(path)!==identity(packet.quotaPath)||Date.parse(packet.expiresAt)<=Date.now()||(environment.NIGHTSKY_QUOTA_STATE_PATH&&identity(path)===identity(environment.NIGHTSKY_QUOTA_STATE_PATH)))throw Error('Invalid usage authority or ledger path');
 const quota=await createPersistentQuota({path,now:Date.now,policies:skyQuotaPoliciesForInitialization(environment)});
 try {if(Date.parse(packet.expiresAt)<=Date.now())throw Error('Expired usage authority');await quota.initializeVerifiedUsage(packet.usage);}finally{await quota.close();}
}
/** Empty args only propose public limits; no files are opened or created. */
export async function runSkyQuotaSetup(args:string[],environment:Environment) {
 if(args.length===2&&args[0]==='--initialize-with-usage'){await initializeWithUsage(args[1],environment);return {mode:'initialized-with-usage' as const};}
 if(args.length&&!(args.length===1&&args[0]==='--initialize'))throw Error('Only --initialize is accepted; existing state cannot be reset.');
 const policies=skyQuotaPoliciesForInitialization(environment);
 if(!args.length)return {mode:'proposal' as const,policies,instructions:'These are operator ceilings, not verified vendor allowances. Verify unused allowance across every consumer, set the private sky quota path and explicit attestation/evidence, then run with --initialize. Existing checkpoints and markers cannot be reset.'};
 await initializeSkyQuota(environment);
 return {mode:'initialized' as const,providers:policies.map(p=>p.providerId)};
}
if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url)){
 runSkyQuotaSetup(process.argv.slice(2),process.env).then(result=>console.log(JSON.stringify(result,null,2)),()=>{console.error('Sky quota setup refused. Check selected sources, private ledger configuration and verified unused budget evidence; retain existing checkpoints and markers.');process.exitCode=1;});
}
