/** Offline fresh-ledger setup. Serving startup never calls this initializer. */
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
/** Empty args only propose public limits; no files are opened or created. */
export async function runSkyQuotaSetup(args:string[],environment:Environment) {
 if(args.length&&!(args.length===1&&args[0]==='--initialize'))throw Error('Only --initialize is accepted; existing state cannot be reset.');
 const policies=skyQuotaPoliciesForInitialization(environment);
 if(!args.length)return {mode:'proposal' as const,policies,instructions:'These are operator ceilings, not verified vendor allowances. Verify unused allowance across every consumer, set the private sky quota path and explicit attestation/evidence, then run with --initialize. Existing checkpoints and markers cannot be reset.'};
 await initializeSkyQuota(environment);
 return {mode:'initialized' as const,providers:policies.map(p=>p.providerId)};
}
if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url)){
 runSkyQuotaSetup(process.argv.slice(2),process.env).then(result=>console.log(JSON.stringify(result,null,2)),()=>{console.error('Sky quota setup refused. Check selected sources, private ledger configuration and verified unused budget evidence; retain existing checkpoints and markers.');process.exitCode=1;});
}
