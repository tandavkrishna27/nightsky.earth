import { createHash } from 'node:crypto';
import { apiSourceRecordSchema, type ApiSourceRecord } from './types';
import { apiSelectionRefSchema, type ApiSelectionRef } from '../../../shared/nightsky/common';
const hash = (value: string) => createHash('sha256').update(value).digest('hex');
/** Immutable revision-keyed snapshots; eviction and restart require a fresh resolution. */
export class ApiSelectionStore {
    private entries = new Map<string, {
        json: string;
        bytes: number;
        expires: number;
    }>();
    private bytes = 0;
    constructor(private options: {
        now?: () => number;
        maxEntries?: number;
        maxBytes?: number;
    } = {}) {
        for (const [value, cap] of [[options.maxEntries ?? 512, 512], [options.maxBytes ?? 2097152, 2097152]])
            if (!Number.isSafeInteger(value) || value < 1 || value > cap)
                throw new TypeError("Invalid API selection store bounds.");
    }
    private get now() {
        return this.options.now ?? Date.now;
    }
    put(value: ApiSourceRecord): ApiSelectionRef {
        const r = apiSourceRecordSchema.parse(value);
        const expiry = Date.parse(r.expiresAt);
        const fetched = Date.parse(r.fetchedAt);
        if (expiry <= this.now() || expiry - fetched > 3600000 || fetched > this.now() + 1000)
            throw new RangeError('Invalid API snapshot freshness.');
        const json = JSON.stringify(r);
        const bytes = Buffer.byteLength(json);
        if (bytes > 16384)
            throw new RangeError('API snapshot byte limit exceeded.');
        const ref = {
            placeId: `place:v1:api:${r.providerId}:${hash(r.upstreamId)}`, sourceRevision: hash(json)
        };
        const key = ref.placeId + ':' + ref.sourceRevision;
        this.prune();
        if (this.entries.has(key))
            return ref;
        while (this.entries.size >= (this.options.maxEntries ?? 512) || this.bytes + bytes > (this.options.maxBytes ?? 2097152)) {
            const first = this.entries.keys().next().value;
            if (!first)
                throw new RangeError('API snapshot cache capacity exceeded.');
            this.remove(first);
        }
        this.entries.set(key, {
            json, bytes, expires: expiry
        });
        this.bytes += bytes;
        return ref;
    }
    get(value: ApiSelectionRef): ApiSourceRecord | undefined {
        const ref = apiSelectionRefSchema.parse(value);
        this.prune();
        const entry = this.entries.get(ref.placeId + ':' + ref.sourceRevision);
        return entry ? JSON.parse(entry.json) : undefined;
    }
    private remove(key: string) {
        this.bytes -= this.entries.get(key)!.bytes;
        this.entries.delete(key);
    }
    private prune() {
        for (const [key, e] of Array.from(this.entries))
            if (e.expires <= this.now())
                this.remove(key);
    }
    get occupancy() {
        this.prune();
        return {
            entries: this.entries.size, bytes: this.bytes
        };
    }
}
