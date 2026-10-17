import { ApiHttpClient, ApiProviderError } from './http';
import { decodeOriginalGeometrySnapshot } from './geometrySnapshot';
import type { ApiRegionSelectionRef } from './regionMembership';
export type GeometrySnapshot = ReturnType<typeof decodeOriginalGeometrySnapshot>;
export class UnsupportedGeometryError extends Error {}
/** Transient bounded original geometry, shared with the discovery provider's HTTP queue. */
export class GeometryAcquisition {
    private cache = new Map<string, { snapshot: GeometrySnapshot; bytes: number }>();
    private bytes = 0;
    constructor(private http: ApiHttpClient, private now: () => number) {}
    async acquire(regions: Array<{ ref: ApiRegionSelectionRef; upstreamId: string; expiresAt: string }>, deadline: number) {
        const unique = new Map(regions.map(r => [r.ref.regionId + ':' + r.ref.sourceRevision, r]));
        if (unique.size > 10) throw new UnsupportedGeometryError('At most ten selected geometries are supported.');
        const result = new Map<string, GeometrySnapshot>();
        for (const [key, value] of Array.from(this.cache)) if (Date.parse(value.snapshot.expiresAt) <= this.now()) { this.cache.delete(key); this.bytes -= value.bytes; }
        for (const [key, region] of Array.from(unique)) {
            const cached = this.cache.get(key);
            if (cached) { this.cache.delete(key); this.cache.set(key, cached); result.set(region.ref.regionId, cached.snapshot); continue; }
            const fetchedAt = this.now();
            const expiresAt = Math.min(fetchedAt + 3600000, Date.parse(region.expiresAt));
            if (expiresAt <= fetchedAt) throw new UnsupportedGeometryError('Selected region expired.');
            let body: string;
            try { body = JSON.stringify(await this.http.json('geoapify', '/v2/place-details', { id: region.upstreamId, features: 'details,details.full_geometry' }, deadline)); }
            catch (error) {
                if (error instanceof ApiProviderError && error.status === 'invalid-response') throw new UnsupportedGeometryError('Selected geometry response is malformed or exceeds the supported response bound.');
                throw error;
            }
            let snapshot: GeometrySnapshot;
            try { snapshot = decodeOriginalGeometrySnapshot(body, { region: region.ref, upstreamId: region.upstreamId, requestedFeatures: 'details,details.full_geometry', fetchedAt: new Date(fetchedAt).toISOString(), expiresAt: new Date(expiresAt).toISOString() }); }
            catch { throw new UnsupportedGeometryError('Selected geometry is missing, mismatched, oversized or outside the supported topology subset.'); }
            const bytes = Buffer.byteLength(body);
            // Retain only validated closures; no raw payload or credentials. Conservative byte accounting.
            const replaced = this.cache.get(key);
            if (replaced) { this.bytes -= replaced.bytes; this.cache.delete(key); }
            while (this.cache.size >= 32 || this.bytes + bytes > 1048576) {
                const oldest = this.cache.keys().next().value;
                if (!oldest) break;
                this.bytes -= this.cache.get(oldest)!.bytes; this.cache.delete(oldest);
            }
            this.cache.set(key, { snapshot, bytes }); this.bytes += bytes;
            result.set(region.ref.regionId, snapshot);
        }
        return result;
    }
}
