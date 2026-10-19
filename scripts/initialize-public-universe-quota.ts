import { PUBLIC_UNIVERSE_QUOTA_POLICY, publicUniverseQuotaPath } from '../server/providers/publicUniverse/configuration';
import {createPersistentQuota, type VerifiedProviderUsage} from '../server/providers/quotaState';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
/** Preparation only. No ledger open, credit initialization, vendor request or usage attestation. */
export function publicUniverseAllocationPlan(args: string[], env: Record<string, string | undefined>) {
    if (args.length !== 1 || args[0] !== '--plan')
        throw Error('Preparation supports --plan only. Initialization requires a separately approved allocation packet.');
    return { status: 'preparation-only', path: publicUniverseQuotaPath(env) ?? null, proposedApplicationAllocation: PUBLIC_UNIVERSE_QUOTA_POLICY, activation: 'off until explicitly selected, admitted, and separately initialized', approvalRequired: 'Approve a new unused NightSky allocation, its dedicated path, accounting ownership and initial counters. This is not an assertion about vendor entitlement or other public-IP consumers.', writesPerformed: false };
}
/** Operator-only import, never invoked by the CLI plan command or application startup.
 * The generic quota store rejects existing checkpoints and incomplete usage evidence.
 */
export async function initializeVerifiedPublicUniverseQuota(env: Record<string,string|undefined>, usage: VerifiedProviderUsage, now: ()=>number = Date.now) {
    const path=publicUniverseQuotaPath(env);
    if(!path)throw Error('Dedicated Public Universe quota path required.');
    const quota=await createPersistentQuota({path,now,policies:[PUBLIC_UNIVERSE_QUOTA_POLICY]});
    try {await quota.initializeVerifiedUsage({publicuniverse:usage});}
    finally {await quota.close();}
    return {status:'verified-usage-imported' as const,path};
}
if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
    try {
        console.log(JSON.stringify(publicUniverseAllocationPlan(process.argv.slice(2), process.env), null, 2));
    }
    catch (error) {
        console.error(error instanceof Error ? error.message : 'Invalid preparation request.');
        process.exitCode = 1;
    }
}
