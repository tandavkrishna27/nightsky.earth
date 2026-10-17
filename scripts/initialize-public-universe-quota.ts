import { PUBLIC_UNIVERSE_QUOTA_POLICY, publicUniverseQuotaPath } from '../server/providers/publicUniverse/configuration';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
/** Preparation only. No ledger open, credit initialization, vendor request or usage attestation. */
export function publicUniverseAllocationPlan(args: string[], env: Record<string, string | undefined>) {
    if (args.length !== 1 || args[0] !== '--plan')
        throw Error('Preparation supports --plan only. Initialization requires a separately approved allocation packet.');
    return { status: 'preparation-only', path: publicUniverseQuotaPath(env) ?? null, proposedApplicationAllocation: PUBLIC_UNIVERSE_QUOTA_POLICY, activation: 'off until explicitly selected, admitted, and separately initialized', approvalRequired: 'Approve a new unused NightSky allocation, its dedicated path, accounting ownership and initial counters. This is not an assertion about vendor entitlement or other public-IP consumers.', writesPerformed: false };
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
