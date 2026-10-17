import { isAbsolute, resolve, win32 } from 'node:path';
import type { QuotaPolicy, PersistentQuota } from '../quotaState';
export const PUBLIC_UNIVERSE_QUOTA_POLICY: QuotaPolicy = { providerId: 'publicuniverse', accountLabel: 'operator-publicuniverse', hourlyLimit: 20, dailyLimit: 100 };
export type PublicUniverseQuota = Pick<PersistentQuota, 'reserve' | 'setProviderState'>;
/** A disabled stub cannot dispatch; it never invents or replenishes allocation. */
export const unavailablePublicUniverseQuota: PublicUniverseQuota = { reserve: async () => ({ allowed: false, reason: 'publicuniverse-quota-unavailable' }), setProviderState: async () => { throw Error('Public Universe quota unavailable.'); } };
export function publicUniverseQuotaPath(env: Record<string, string | undefined>) {
    const path = env.NIGHTSKY_PUBLICUNIVERSE_QUOTA_STATE_PATH;
    if (path === undefined)
        return undefined;
    if (!path.trim() || path.length > 4096 || /[\x00-\x1f\x7f]/.test(path) || (!isAbsolute(path) && !win32.isAbsolute(path)) || path.replace(/\\/g, '/').startsWith('//'))
        throw Error('Absolute private Public Universe quota path required.');
    const identity = (p: string) => process.platform === 'win32' || win32.isAbsolute(p) ? win32.resolve(p).toLowerCase() : resolve(p);
    for (const other of [env.NIGHTSKY_QUOTA_STATE_PATH, env.NIGHTSKY_SKY_QUOTA_STATE_PATH, env.NIGHTSKY_LIGHT_POLLUTION_QUOTA_STATE_PATH])
        if (other && identity(other) === identity(path))
            throw Error('Public Universe requires a distinct dedicated ledger.');
    return path;
}
