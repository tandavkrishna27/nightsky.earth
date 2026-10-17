import { createHash, randomUUID } from 'node:crypto';
import type { ReferenceDomain } from '../../../shared/nightsky/reference';
export function canonicalJson(value: unknown): string {
    if (Array.isArray(value))
        return '[' + value.map(canonicalJson).join(',') + ']';
    if (value !== null && typeof value === 'object')
        return '{' + Object.entries(value).filter(([, v]) => v !== undefined).sort(([a], [b]) => a < b ? -1 : a > b ? 1 : 0).map(([k, v]) => JSON.stringify(k) + ':' + canonicalJson(v)).join(',') + '}';
    return JSON.stringify(value);
}
export interface IdentitySnapshot {
    domain: ReferenceDomain | 'meteor-shower' | 'exoplanet-host';
    upstreamId: string;
    upstreamSourceIdentity?: {
        lineage: string;
        [key: string]: string | null;
    } | null;
    coordinateFrame?: string | null;
    coordinateEpoch?: string | null;
    motionModel?: string | null;
    hostId?: string | null;
}
export interface Selection {
    referenceId: string;
    revision: string;
}
export class ReferenceStore {
    private entries = new Map<string, {
        snapshot: IdentitySnapshot;
        revision: string;
        expires: number;
    }>();
    private closed = false;
    private now: () => number;
    private max: number;
    constructor(options: {
        now?: () => number;
        maxEntries?: number;
    } = {}) {
        this.now = options.now ?? Date.now;
        this.max = options.maxEntries ?? 256;
        if (!Number.isInteger(this.max) || this.max < 1 || this.max > 256)
            throw new Error('Invalid store bound');
    }
    put(input: IdentitySnapshot): Selection {
        if (this.closed)
            throw new Error('Store closed');
        // Explicit projection prevents observing positions/windows from entering selection state.
        const snapshot: IdentitySnapshot = { domain: input.domain, upstreamId: input.upstreamId, upstreamSourceIdentity: input.upstreamSourceIdentity ?? null, coordinateFrame: input.coordinateFrame ?? null, coordinateEpoch: input.coordinateEpoch ?? null, motionModel: input.motionModel ?? null, hostId: input.hostId ?? null };
        if (!['solar-system', 'starter-targets', 'exoplanets', 'meteor-shower', 'exoplanet-host'].includes(snapshot.domain) || typeof snapshot.upstreamId !== 'string' || !snapshot.upstreamId || snapshot.upstreamId.length > 160)
            throw new Error('Invalid identity');
        if (snapshot.upstreamSourceIdentity && (typeof snapshot.upstreamSourceIdentity.lineage !== 'string' || !snapshot.upstreamSourceIdentity.lineage || Object.keys(snapshot.upstreamSourceIdentity).length > 30 || Object.values(snapshot.upstreamSourceIdentity).some(v => v !== null && (typeof v !== 'string' || v.length > 2048))))
            throw new Error('Invalid source identity');
        for (const key of ['coordinateFrame', 'coordinateEpoch', 'motionModel', 'hostId'] as const)
            if (snapshot[key] !== null && (typeof snapshot[key] !== 'string' || snapshot[key]!.length > 500))
                throw new Error('Invalid identity metadata');
        const json = canonicalJson(snapshot);
        if (Buffer.byteLength(json) > 65536)
            throw new Error('Identity size');
        const revisionInput = { domain: snapshot.domain, upstreamId: snapshot.upstreamId, upstreamSourceIdentity: snapshot.upstreamSourceIdentity, coordinateFrame: snapshot.coordinateFrame, coordinateEpoch: snapshot.coordinateEpoch, motionModel: snapshot.motionModel };
        const revision = createHash('sha256').update(canonicalJson(revisionInput), 'utf8').digest('hex');
        for (const [key, v] of Array.from(this.entries))
            if (v.expires <= this.now())
                this.entries.delete(key);
        while (this.entries.size >= this.max)
            this.entries.delete(this.entries.keys().next().value!);
        const referenceId = randomUUID();
        this.entries.set(referenceId, { snapshot: JSON.parse(json), revision, expires: this.now() + 3600000 });
        return { referenceId, revision };
    }
    get(selection: Selection): IdentitySnapshot {
        const found = this.entries.get(selection.referenceId);
        if (this.closed || !found || found.revision !== selection.revision || found.expires <= this.now())
            throw new Error('stale-selection');
        return structuredClone(found.snapshot);
    }
    compare(selection: Selection, remote: Pick<IdentitySnapshot, 'upstreamId' | 'upstreamSourceIdentity' | 'coordinateFrame' | 'coordinateEpoch' | 'motionModel' | 'hostId'>): {
        association: 'verified' | 'unverified';
    } {
        const stored = this.get(selection);
        if (stored.upstreamId !== remote.upstreamId || (stored.hostId && remote.hostId && stored.hostId !== remote.hostId))
            throw new Error('stale-selection');
        const a = stored.upstreamSourceIdentity, b = remote.upstreamSourceIdentity;
        let compared = false;
        if (a && b && a.lineage === b.lineage) {
            for (const key of Object.keys(a))
                if (key !== 'lineage' && a[key] != null && b[key] != null) {
                    compared = true;
                    if (a[key] !== b[key])
                        throw new Error('stale-selection');
                }
            for (const key of ['coordinateFrame', 'coordinateEpoch', 'motionModel'] as const)
                if (stored[key] != null && remote[key] != null) {
                    compared = true;
                    if (stored[key] !== remote[key])
                        throw new Error('stale-selection');
                }
        }
        return { association: compared ? 'verified' : 'unverified' };
    }
    close() { this.closed = true; this.entries.clear(); }
}
