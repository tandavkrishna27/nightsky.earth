import test from 'node:test';
import assert from 'node:assert/strict';
import { ApiSelectionStore } from '../../server/places/api/selectionStore';
import { resolveApiCalculationPlace } from '../../server/places/calculationPlace';
const record = {
    providerId: 'geonames' as const, upstreamId: '123', fetchedAt: '2026-10-17T00:00:00.000Z', expiresAt: '2026-10-17T01:00:00.000Z', sourceUrl: 'https://www.geonames.org/123', attribution: 'GeoNames CC BY 4.0', name: 'Test site', latitude: 12, longitude: 77, timeZoneEvidence: {
        status: 'unknown' as const
    }
};
test('expired_selection_requires_resolve_again', () => {
    let now = Date.parse(record.fetchedAt);
    const store = new ApiSelectionStore({
        now: () => now
    });
    const ref = store.put(record);
    now += 3600000;
    assert.equal(store.get(ref), undefined);
});
test('same_id_changed_point_does_not_rebind', () => {
    const store = new ApiSelectionStore({
        now: () => Date.parse(record.fetchedAt)
    });
    const old = store.put(record);
    store.put({
        ...record, latitude: 13
    });
    assert.equal(store.get(old)?.latitude, 12);
});
test('unknown_site_zone_requires_explicit_display_zone', () => {
    const store = new ApiSelectionStore({
        now: () => Date.parse(record.fetchedAt)
    });
    const ref = store.put(record);
    assert.throws(() => resolveApiCalculationPlace(ref, store), /display time zone/i);
});
test('named_api_place_does_not_require_geonames', () => {
    const store = new ApiSelectionStore({
        now: () => Date.parse(record.fetchedAt)
    });
    const ref = store.put(record);
    const point = resolveApiCalculationPlace({
        ...ref, displayTimeZone: 'Asia/Kolkata'
    }, store);
    assert.equal(point.latitude, 12);
    assert.equal(point.sourceRevision, ref.sourceRevision);
});
test('API store enforces total entries, bytes and immutable returned copies', () => {
    const store = new ApiSelectionStore({
        now: () => Date.parse(record.fetchedAt), maxEntries: 1
    });
    const first = store.put(record);
    const second = store.put({
        ...record, upstreamId: 'second'
    });
    assert.equal(store.get(first), undefined);
    const copy = store.get(second)!;
    copy.latitude = 90;
    assert.equal(store.get(second)?.latitude, 12);
    assert.equal(store.occupancy.entries, 1);
    assert.ok(store.occupancy.bytes <= 2097152);
    assert.throws(() => new ApiSelectionStore({
        maxEntries: 513
    }));
});
test('mixed revision kinds and malformed API namespaces cannot calculate', () => {
    const store = new ApiSelectionStore({
        now: () => Date.parse(record.fetchedAt)
    });
    const ref = store.put(record);
    assert.throws(() => resolveApiCalculationPlace({
        ...ref, catalogueRevision: 'edition', displayTimeZone: 'UTC'
    }, store));
    assert.throws(() => resolveApiCalculationPlace({
        ...ref, placeId: 'place:v1:api:geonames:unhashed', displayTimeZone: 'UTC'
    }, store));
});

test('source zone and explicit display choice remain distinct across a DST boundary', () => {
    const store = new ApiSelectionStore({ now: () => Date.parse(record.fetchedAt) });
    const source = { name: 'Fixture', url: 'https://example.org/', attribution: 'Offline fixture', dataClass: 'context' as const };
    const verified = store.put({ ...record, timeZoneEvidence: { status: 'verified', timeZone: 'America/New_York', source } });
    const point = resolveApiCalculationPlace(verified, store);
    assert.equal(point.displayTimeZone, 'America/New_York');
    assert.equal(point.timeZoneBasis, 'api-source');
    assert.equal(new Intl.DateTimeFormat('en', { timeZone: point.displayTimeZone, hour: 'numeric', hourCycle: 'h23' }).format(new Date('2026-11-01T05:30:00Z')), '01');
    assert.equal(new Intl.DateTimeFormat('en', { timeZone: point.displayTimeZone, hour: 'numeric', hourCycle: 'h23' }).format(new Date('2026-11-01T06:30:00Z')), '01');
    const unknown = store.put(record);
    const explicit = resolveApiCalculationPlace({ ...unknown, displayTimeZone: 'Asia/Kolkata' }, store);
    assert.equal(explicit.timeZoneBasis, 'explicit-display');
    assert.equal(explicit.timeZoneEvidence?.status, 'unknown');
    assert.equal(explicit.latitude, record.latitude);
    assert.equal(explicit.longitude, record.longitude);
    assert.throws(() => resolveApiCalculationPlace({ ...verified, displayTimeZone: 'Asia/Kolkata' }, store), /time zone/i);
});
test('same identity timezone change creates a new immutable revision', () => {
    const store = new ApiSelectionStore({ now: () => Date.parse(record.fetchedAt) });
    const source = { name: 'Fixture', url: 'https://example.org/', attribution: 'Offline fixture', dataClass: 'context' as const };
    const old = store.put({ ...record, timeZoneEvidence: { status: 'verified', timeZone: 'America/New_York', source } });
    const changed = store.put({ ...record, timeZoneEvidence: { status: 'verified', timeZone: 'America/Chicago', source } });
    assert.equal(old.placeId, changed.placeId);
    assert.notEqual(old.sourceRevision, changed.sourceRevision);
    assert.equal(resolveApiCalculationPlace(old, store).displayTimeZone, 'America/New_York');
    assert.equal(resolveApiCalculationPlace(changed, store).displayTimeZone, 'America/Chicago');
});
