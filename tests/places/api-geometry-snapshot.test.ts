import test from 'node:test';
import assert from 'node:assert/strict';
import { decodeOriginalGeometrySnapshot } from '../../server/places/api/geometrySnapshot';

const meta = { region: { regionId: `region:v1:api:geoapify:${'b'.repeat(64)}`, sourceRevision: '2'.repeat(64) }, upstreamId: 'selected-region', requestedFeatures: 'details,details.full_geometry', fetchedAt: '2026-10-17T00:00:00Z', expiresAt: '2026-10-17T01:00:00Z' };
const now = Date.parse(meta.fetchedAt);
const square = (a: number, b: number, c: number, d: number) => [[a,b],[c,b],[c,d],[a,d],[a,b]];
const outer = square(0, 0, 10, 10), hole = square(2, 2, 4, 4);
const body = (geometry: unknown, id = meta.upstreamId) => JSON.stringify({ type: 'FeatureCollection', features: [{ type: 'Feature', properties: { feature_type: 'details', place_id: id }, geometry }] });
const decode = (coordinates: unknown) => decodeOriginalGeometrySnapshot(body({ type: 'Polygon', coordinates }), meta);

test('snapshot-relative shell hole and tie policy is explicit, orientation independent', () => {
    for (const rings of [[outer, hole], [outer.toReversed(), hole.toReversed()]]) {
        const s = decode(rings);
        assert.equal(s.sourceVintage, 'unknown');
        assert.equal(s.classify([1, 1], now), 'inside');
        assert.equal(s.classify([3, 3], now), 'outside');
        assert.equal(s.classify([12, 3], now), 'outside');
        for (const p of [[0, 0], [0, 3], [2, 3], [1e-10, 3]]) assert.equal(s.classify(p, now), 'unknown');
        assert.equal(s.classify([1e-7, 3], now), 'inside');
    }
});
test('split antimeridian MultiPolygon supports islands without wrapping an unsplit edge', () => {
    const s = decodeOriginalGeometrySnapshot(body({ type: 'MultiPolygon', coordinates: [[square(170, -5, 180, 5)], [square(-180, -5, -170, 5)]] }), meta);
    assert.equal(s.classify([175, 0], now), 'inside');
    assert.equal(s.classify([-175, 0], now), 'inside');
    assert.equal(s.classify([0, 0], now), 'outside');
    assert.equal(s.classify([180, 0], now), 'unknown');
    assert.throws(() => decode([square(170, -5, -170, 5)]), /antimeridian/);
});
test('snapshot is bound to identity revision lifetime and immutable geometry', () => {
    const s = decode([outer]);
    assert.equal(s.classify([1, 1], now - 1), 'unknown');
    assert.equal(s.classify([1, 1], Date.parse(meta.expiresAt)), 'unknown');
    assert.throws(() => decodeOriginalGeometrySnapshot(body({ type: 'Polygon', coordinates: [outer] }, 'wrong'), meta), /identity/);
    const changed = decodeOriginalGeometrySnapshot(body({ type: 'Polygon', coordinates: [outer] }), { ...meta, region: { ...meta.region, sourceRevision: '3'.repeat(64) } });
    assert.notEqual(s.geometryRevision, changed.geometryRevision);
    assert.equal(Object.isFrozen(s.region), true);
});
test('decoder rejects malformed unsupported topology and bounded payloads', () => {
    for (const rings of [[outer.slice(0, -1)], [outer, square(20, 20, 21, 21)], [outer, hole, square(3, 3, 5, 5)], [[[0,0],[5,5],[0,5],[5,0],[0,0]]], [square(0, 89, 10, 90)]]) assert.throws(() => decode(rings));
    assert.throws(() => decodeOriginalGeometrySnapshot(' '.repeat(262145), meta), /byte cap/);
    assert.throws(() => decode(Array(33).fill(outer)));
    assert.throws(() => decode([[[0,0],[5,0],[2,0],[5,5],[0,5],[0,0]]]), /backtrack/);
    assert.throws(() => decodeOriginalGeometrySnapshot(body({ type: 'MultiPolygon', coordinates: [[outer], [square(1, 1, 3, 3)]] }), meta), /Nested/);
    const many = Array.from({ length: 1025 }, (_, i) => [Math.cos(i * 2 * Math.PI / 1024), Math.sin(i * 2 * Math.PI / 1024)]);
    many[1024] = many[0]!;
    assert.throws(() => decode([many]));
    assert.throws(() => decodeOriginalGeometrySnapshot(body({ type: 'Point', coordinates: [1, 1] }), meta));
    assert.throws(() => decodeOriginalGeometrySnapshot(body({ type: 'Polygon', coordinates: [outer] }), { ...meta, requestedFeatures: 'details' }));
    assert.throws(() => decodeOriginalGeometrySnapshot(body({ type: 'Polygon', coordinates: [outer] }), { ...meta, expiresAt: '2026-10-18T00:00:00Z' }));
});
