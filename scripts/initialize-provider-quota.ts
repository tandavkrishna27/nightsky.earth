/** Explicit offline initialization. Never invoked by serving startup. No keys or URLs in arguments. */
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createPersistentQuota } from '../server/providers/quotaState';
import { parseWeatherConfiguration, PROVIDER_QUOTA_POLICIES } from '../server/providers/weather/configuration';
import { SEVENTIMER_QUOTA_POLICY } from '../server/providers/weather/sevenTimer';
/** Fresh-ledger policy selection only. Existing checkpoints still cannot be reset. */
export function quotaPoliciesForInitialization(environment:Record<string,string|undefined>) {
 const config=parseWeatherConfiguration(environment);
 return [...PROVIDER_QUOTA_POLICIES,...(config.providers?.includes('seventimer')?[SEVENTIMER_QUOTA_POLICY]:[])];
}
export async function initializeProviderQuota(environment:Record<string,string|undefined>) {
 if(environment.NIGHTSKY_QUOTA_VERIFIED_UNUSED_BUDGET!=='yes' || !environment.NIGHTSKY_QUOTA_VERIFICATION_EVIDENCE || !environment.NIGHTSKY_QUOTA_STATE_PATH) throw Error('Explicit verified unused budget attestation, nonsecret evidence and quota path are required.');
 const quota=await createPersistentQuota({path:environment.NIGHTSKY_QUOTA_STATE_PATH,now:Date.now,policies:quotaPoliciesForInitialization(environment)});
 try {await quota.initializeVerifiedBudget({verifiedUnusedBudget:true,evidence:environment.NIGHTSKY_QUOTA_VERIFICATION_EVIDENCE});}finally{await quota.close();}
}
if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url)) {
 if(process.argv.length!==2) {console.error('Quota initialization accepts no command arguments.');process.exitCode=1;}
 else initializeProviderQuota(process.env).then(()=>console.log('Provider quota initialized from operator verified unused budget.'),()=>{console.error('Provider quota initialization refused. Check private configuration and verified unused budget evidence; retain existing checkpoint and markers.');process.exitCode=1;});
}
