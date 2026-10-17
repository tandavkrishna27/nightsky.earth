import { createHash } from 'node:crypto';
import * as z from 'zod4';
import { apiRegionSelectionRefSchema } from './regionMembership';
import { utcInstantSchema } from '../../../shared/nightsky/common';

// Offline only: no fetch, configuration import, registration or endpoint permission.
export const GEOMETRY_POLICY = 'snapshot-planar-v1';
export const GEOMETRY_EPSILON_DEGREES = 1e-9;
const position = z.tuple([z.number().finite().min(-180).max(180), z.number().finite().min(-90).max(90)]);
type Position = z.infer<typeof position>;
type Ring = Position[];
const ring = z.array(position).min(4).max(1024);
const polygon = z.array(ring).min(1).max(32);
const geometrySchema = z.discriminatedUnion('type', [
    z.strictObject({ type: z.literal('Polygon'), coordinates: polygon }),
    z.strictObject({ type: z.literal('MultiPolygon'), coordinates: z.array(polygon).min(1).max(32) })
]);
const metadataSchema = z.strictObject({
    region: apiRegionSelectionRefSchema,
    upstreamId: z.string().min(1).max(2048),
    requestedFeatures: z.literal('details,details.full_geometry'),
    fetchedAt: utcInstantSchema,
    expiresAt: utcInstantSchema
});
type State = 'inside' | 'outside' | 'unknown';
function nearSegment(p: Position, a: Position, b: Position): boolean {
    const dx = b[0] - a[0], dy = b[1] - a[1];
    const t = Math.max(0, Math.min(1, ((p[0] - a[0]) * dx + (p[1] - a[1]) * dy) / (dx * dx + dy * dy)));
    return Math.hypot(p[0] - a[0] - t * dx, p[1] - a[1] - t * dy) <= GEOMETRY_EPSILON_DEGREES;
}
function inRing(p: Position, r: Ring): State {
    let inside = false;
    for (let i = 0; i < r.length - 1; i++) {
        const a = r[i]!, b = r[i + 1]!;
        if (nearSegment(p, a, b)) return 'unknown';
        if ((a[1] > p[1]) !== (b[1] > p[1]) && p[0] < (b[0] - a[0]) * (p[1] - a[1]) / (b[1] - a[1]) + a[0]) inside = !inside;
    }
    return inside ? 'inside' : 'outside';
}
function orientation(a: Position, b: Position, c: Position) { return (b[0] - a[0]) * (c[1] - a[1]) - (b[1] - a[1]) * (c[0] - a[0]); }
function intersects(a: Position, b: Position, c: Position, d: Position): boolean {
    if (nearSegment(a, c, d) || nearSegment(b, c, d) || nearSegment(c, a, b) || nearSegment(d, a, b)) return true;
    return ((orientation(a, b, c) > 0) !== (orientation(a, b, d) > 0)) && ((orientation(c, d, a) > 0) !== (orientation(c, d, b) > 0));
}
function validateTopology(polygons: Ring[][]) {
    const rings = polygons.flat();
    if (rings.length > 32 || rings.reduce((sum, r) => sum + r.length, 0) > 1024) throw new RangeError('Geometry complexity exceeds offline bound.');
    const segments: Array<{ a: Position; b: Position; ring: number; index: number }> = [];
    rings.forEach((r, ri) => {
        if (r[0]![0] !== r.at(-1)![0] || r[0]![1] !== r.at(-1)![1]) throw new RangeError('Ring must be closed.');
        for (let i = 0; i < r.length - 1; i++) {
            const a = r[i]!, b = r[i + 1]!;
            if (Math.hypot(a[0] - b[0], a[1] - b[1]) <= GEOMETRY_EPSILON_DEGREES) throw new RangeError('Degenerate edge.');
            if (Math.abs(a[0] - b[0]) >= 180 || Math.abs(a[1]) === 90 || Math.abs(b[1]) === 90) throw new RangeError('Unsplit antimeridian or polar geometry is unsupported.');
            segments.push({ a, b, ring: ri, index: i });
        }
        const area = r.slice(0, -1).reduce((sum, a, i) => sum + a[0] * r[i + 1]![1] - r[i + 1]![0] * a[1], 0);
        if (Math.abs(area) <= GEOMETRY_EPSILON_DEGREES) throw new RangeError('Degenerate ring.');
    });
    for (let i = 0; i < segments.length; i++) for (let j = i + 1; j < segments.length; j++) {
        const a = segments[i]!, b = segments[j]!;
        if (a.ring === b.ring && (Math.abs(a.index - b.index) === 1 || Math.abs(a.index - b.index) === rings[a.ring]!.length - 2)) {
            const consecutive = b.index === a.index + 1;
            const shared = consecutive ? a.b : a.a;
            const first = consecutive ? a.a : a.b;
            const last = consecutive ? b.b : b.a;
            // Adjacent edges may share their endpoint, but cannot double back over one another.
            if (nearSegment(first, shared, last) || nearSegment(last, first, shared)) throw new RangeError('Adjacent edges backtrack.');
            continue;
        }
        if (intersects(a.a, a.b, b.a, b.b)) throw new RangeError('Intersecting or touching rings are unsupported.');
    }
    for (const p of polygons) {
        for (let i = 1; i < p.length; i++) {
            if (inRing(p[i]![0]!, p[0]!) !== 'inside') throw new RangeError('Hole must be inside shell.');
            for (let j = 1; j < i; j++) if (inRing(p[i]![0]!, p[j]!) !== 'outside' || inRing(p[j]![0]!, p[i]!) !== 'outside') throw new RangeError('Nested holes are unsupported.');
        }
    }
    for (let i = 0; i < polygons.length; i++) for (let j = 0; j < i; j++) {
        if (inRing(polygons[i]![0]![0]!, polygons[j]![0]!) !== 'outside' || inRing(polygons[j]![0]![0]!, polygons[i]![0]!) !== 'outside') throw new RangeError('Nested or overlapping polygon shells are unsupported.');
    }
}

/** Decode a response obtained for already resolved identity. Request metadata is a caller
 * receipt, not proof of live acquisition. No raw response or credentials are retained.
 * Source vintage remains unknown; SHA-256 identifies this normalized snapshot only.
 */
export function decodeOriginalGeometrySnapshot(body: string, metadata: unknown) {
    if (Buffer.byteLength(body, 'utf8') > 262144) throw new RangeError('Geometry response exceeds byte cap.');
    const meta = metadataSchema.parse(metadata);
    if (Date.parse(meta.expiresAt) <= Date.parse(meta.fetchedAt) || Date.parse(meta.expiresAt) - Date.parse(meta.fetchedAt) > 3600000) throw new RangeError('Invalid snapshot lifetime.');
    const response = z.object({ type: z.literal('FeatureCollection'), features: z.array(z.object({
        type: z.literal('Feature'), properties: z.object({ feature_type: z.literal('details'), place_id: z.string() }), geometry: geometrySchema
    })).length(1) }).parse(JSON.parse(body));
    const feature = response.features[0]!;
    if (feature.properties.place_id !== meta.upstreamId) throw new RangeError('Selected region identity mismatch.');
    const geometry = feature.geometry;
    const polygons = geometry.type === 'Polygon' ? [geometry.coordinates] : geometry.coordinates;
    validateTopology(polygons);
    const revision = createHash('sha256').update(JSON.stringify({ ...meta, geometry, policy: GEOMETRY_POLICY })).digest('hex');
    // Closure owns validated coordinates: callers cannot mutate geometry after hashing.
    return Object.freeze({ region: Object.freeze({ ...meta.region }), geometryRevision: revision, sourceVintage: 'unknown' as const,
        fetchedAt: meta.fetchedAt, expiresAt: meta.expiresAt, policy: GEOMETRY_POLICY,
        classify(coordinates: unknown, now: number): State {
            const p = position.parse(coordinates);
            if (!Number.isFinite(now) || now < Date.parse(meta.fetchedAt) || now >= Date.parse(meta.expiresAt)) return 'unknown';
            const states = polygons.map(poly => {
                const shell = inRing(p, poly[0]!);
                const holes = poly.slice(1).map(h => inRing(p, h));
                if (shell === 'unknown' || holes.includes('unknown')) return 'unknown';
                return shell === 'inside' && !holes.includes('inside') ? 'inside' : 'outside';
            });
            return states.includes('unknown') ? 'unknown' : states.includes('inside') ? 'inside' : 'outside';
        }
    });
}
