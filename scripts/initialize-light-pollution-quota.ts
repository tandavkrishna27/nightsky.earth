/** Explicit offline fresh-ledger setup. Never called by serving startup. */
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createPersistentQuota } from '../server/providers/quotaState';
import { LIGHT_POLLUTION_QUOTA_POLICIES,validateLightPollutionQuotaPath,type LightPollutionEnvironment } from '../server/providers/lightPollution/configuration';
export async function runLightPollutionQuotaSetup(args:string[],env:LightPollutionEnvironment,options:{now?:()=>number}={}){
 if(args.length&&!(args.length===1&&args[0]==='--initialize'))throw Error('Only --initialize accepted; existing state cannot be reset.');
 if(!args.length)return {mode:'proposal' as const,policies:LIGHT_POLLUTION_QUOTA_POLICIES,instructions:'Verify complete unused project allowance across all keys/consumers. Set a dedicated absolute quota path and explicit unused-budget attestation/evidence; then --initialize. Existing state is never replaced.'};
 const path=validateLightPollutionQuotaPath(env),evidence=env.NIGHTSKY_LIGHT_POLLUTION_QUOTA_VERIFICATION_EVIDENCE;
 if(!path||env.NIGHTSKY_LIGHT_POLLUTION_QUOTA_VERIFIED_UNUSED_BUDGET!=='yes'||!evidence||evidence.trim().length<8||evidence.length>500||/[\x00-\x1f\x7f]/.test(evidence))throw Error('Explicit unused project budget attestation and nonsecret evidence required.');
 const quota=await createPersistentQuota({path,now:options.now??Date.now,policies:LIGHT_POLLUTION_QUOTA_POLICIES});try{await quota.initializeVerifiedBudget({verifiedUnusedBudget:true,evidence});}finally{await quota.close();}return {mode:'initialized' as const};
}
if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url))runLightPollutionQuotaSetup(process.argv.slice(2),process.env).then(result=>console.log(JSON.stringify(result,null,2)),()=>{console.error('Light pollution quota setup refused. Check private ledger and unused project budget evidence; retain existing state.');process.exitCode=1;});
