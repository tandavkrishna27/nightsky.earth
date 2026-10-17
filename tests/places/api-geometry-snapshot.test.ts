import test from 'node:test';
import assert from 'node:assert/strict';
import { decodeOriginalGeometrySnapshot, selectOriginalGeometryFeature } from '../../server/places/api/geometrySnapshot';

const meta = { region: { regionId: `region:v1:api:geoapify:${'b'.repeat(64)}`, sourceRevision: '2'.repeat(64) }, upstreamId: 'selected-region', requestedFeatures: 'details,details.full_geometry', fetchedAt: '2026-10-17T00:00:00Z', expiresAt: '2026-10-17T01:00:00Z' };
const now = Date.parse(meta.fetchedAt);
const square = (a: number, b: number, c: number, d: number) => [[a,b],[c,b],[c,d],[a,d],[a,b]];
const outer = square(0, 0, 10, 10), hole = square(2, 2, 4, 4);
const body = (geometry: unknown, id = meta.upstreamId) => JSON.stringify({ type: 'FeatureCollection', features: [{ type: 'Feature', properties: { feature_type: 'details', place_id: id }, geometry }] });
const decode = (coordinates: unknown) => decodeOriginalGeometrySnapshot(body({ type: 'Polygon', coordinates }), meta);
const details = (geometry: unknown = { type: 'Polygon', coordinates: [outer] }, id = meta.upstreamId, datasource?: unknown) => ({
    type: 'Feature', properties: { feature_type: 'details', place_id: id, ...(datasource === undefined ? {} : { datasource }) }, geometry
});
const collection = (features: unknown[]) => JSON.stringify({ type: 'FeatureCollection', features });
const unrelated = { type: 'Feature', properties: { feature_type: 'walk_10' }, geometry: { type: 'MultiPolygon', coordinates: [[square(20,20,30,30)]] } };

test('official response shape selects details identity independently of collection order', () => {
    // Constructed from the official Details/other-feature contract, not a live receipt.
    for (const features of [[unrelated, details()], [details(), unrelated]]) {
        const snapshot = decodeOriginalGeometrySnapshot(collection(features), meta);
        assert.equal(snapshot.classify([1,1], now), 'inside');
        assert.equal(snapshot.classify([25,25], now), 'outside');
    }
});

test('details selection rejects ambiguity and cannot borrow an unrelated area', () => {
    for (const features of [[], [unrelated], [details(), details()], [details(), details(undefined, 'wrong')],
        [details(undefined, 'wrong'), unrelated], [details({ type: 'Point', coordinates: [1,1] }), unrelated]]) {
        assert.throws(() => decodeOriginalGeometrySnapshot(collection(features), meta));
    }
    const twenty = [details(), ...Array(19).fill(unrelated)];
    assert.equal(decodeOriginalGeometrySnapshot(collection(twenty), meta).classify([1,1], now), 'inside');
    assert.throws(() => decodeOriginalGeometrySnapshot(collection([...twenty, unrelated]), meta));
    assert.throws(() => decodeOriginalGeometrySnapshot(collection([details(), { type: 'Feature', properties: {} }]), meta));
});

test('snapshot retains immutable bounded public datasource and hashes only sanitized provenance', () => {
    const datasource = { sourcename: 'openstreetmap', attribution: '© OpenStreetMap contributors', license: 'Open Database License', url: 'https://www.openstreetmap.org/copyright' };
    const snapshot = decodeOriginalGeometrySnapshot(collection([details(undefined, undefined, { ...datasource, raw: { osm_id: 35158438, osm_type: 'w' } })]), meta);
    assert.deepEqual(snapshot.datasource, datasource);
    assert.equal(Object.isFrozen(snapshot.datasource), true);
    assert.equal(snapshot.sourceVintage, 'unknown');
    const sanitized = decodeOriginalGeometrySnapshot(collection([details(undefined, undefined, datasource)]), meta);
    assert.equal(snapshot.geometryRevision, sanitized.geometryRevision);
    assert.notEqual(snapshot.geometryRevision, decode([outer]).geometryRevision);
    assert.notEqual(snapshot.geometryRevision, decodeOriginalGeometrySnapshot(collection([details(undefined, undefined, { ...datasource, attribution: 'changed' })]), meta).geometryRevision);
    for (const invalid of [{ sourcename: 's'.repeat(121) }, { attribution: 'a'.repeat(501) }, { license: 'l'.repeat(161) },
        { url: 'https://example.com/' + 'x'.repeat(2048) }, { url: 'invalid' }, { sourcename: 1 }]) {
        assert.throws(() => decodeOriginalGeometrySnapshot(collection([details(undefined, undefined, invalid)]), meta));
    }
});

test('reusable feature selector owns a fresh validated parse and preserves decoder bounds', () => {
    const json = collection([details()]);
    const selected = selectOriginalGeometryFeature(json, meta.upstreamId);
    const snapshot = decodeOriginalGeometrySnapshot(json, meta);
    assert.equal(selected.geometry.type, 'Polygon');
    if (selected.geometry.type !== 'Polygon') throw Error('Expected Polygon fixture');
    selected.geometry.coordinates[0]![0]![0] = 99;
    assert.equal(snapshot.classify([1,1], now), 'inside');
    const fresh = selectOriginalGeometryFeature(json, meta.upstreamId);
    assert.deepEqual(fresh.geometry, { type: 'Polygon', coordinates: [outer] });
    assert.throws(() => selectOriginalGeometryFeature(' '.repeat(262145), meta.upstreamId), /byte cap/);
    assert.throws(() => selectOriginalGeometryFeature(body({ type: 'Polygon', coordinates: [square(170,-5,-170,5)] }), meta.upstreamId), /antimeridian/);
    assert.throws(() => selectOriginalGeometryFeature(body({ type: 'Polygon', coordinates: Array(33).fill(outer) }), meta.upstreamId));
});

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
