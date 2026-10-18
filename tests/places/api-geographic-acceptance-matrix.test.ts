import test from 'node:test';
import assert from 'node:assert/strict';
import { createApiServices } from '../../server/places/api/configuration';
import type { ApiSourceRecord } from '../../server/places/api/types';
import { discoveryScopeSchema } from '../../shared/nightsky/discovery';

// Exercises previously unpinned provider-composition branches, not live membership.
function fixture() {
  let time = Date.parse('2026-10-18T00:00:00Z');
  const urls: URL[] = [];
  const squares: Record<string, [number, number]> = { A: [0, 5], B: [2, 7], Exclude: [3, 4] };
  const api = createApiServices({ userAgent: 'Offline geographic acceptance fixture', geoapifyApiKey: 'fixture',
    geometryEnabled: true, geometrySourceAccepted: true, now: () => time,
    fetcher: async input => {
      const url = new URL(String(input)); urls.push(url); time += 1100;
      if (url.pathname === '/v2/place-details') {
        const id = url.searchParams.get('id')!;
        const [a, b] = squares[id]!;
        return Response.json({ type: 'FeatureCollection', features: [{ type: 'Feature',
          properties: { feature_type: 'details', place_id: id }, geometry: { type: 'Polygon',
            coordinates: [[[a, a], [b, a], [b, b], [a, b], [a, a]]] } }] });
      }
      assert.equal(url.pathname, '/v2/places');
      return Response.json({ features: [
        ['A-only', 1, 1], ['shared', 2.5, 2.5], ['excluded', 3.5, 3.5],
        ['B-only', 6, 6], ['exclusion-boundary', 3, 3.5]
      ].map(([name, longitude, latitude]) => ({ properties: { place_id: name, name, categories: ['leisure.park'] },
        geometry: { type: 'Point', coordinates: [longitude, latitude] } })) });
    } });
  function select(id: string, region: boolean, longitude = 2.5, latitude = 2.5) {
    const record: ApiSourceRecord = { providerId: 'geoapify', upstreamId: id, name: id, longitude, latitude,
      fetchedAt: new Date(time).toISOString(), expiresAt: new Date(time + 3600000).toISOString(),
      sourceUrl: 'https://www.geoapify.com/', attribution: 'Offline fixture', timeZoneEvidence: { status: 'unknown' },
      ...(region ? { regionEvidence: { countryCode: 'IND', adminLevel: 1 } } : {}) };
    return api.selectionStore.put(record);
  }
  const regions = ['A', 'B', 'Exclude'].map(id => {
    const selected = select(id, true);
    return { regionId: selected.placeId.replace('place:v1:', 'region:v1:'), sourceRevision: selected.sourceRevision };
  });
  return { api, urls, regions, select };
}

test('region-only intersection fetches each selected geometry without centroid distances', async () => {
  const { api, urls, regions } = fixture();
  const scope = discoveryScopeSchema.parse({ includeRegionIds: regions.slice(0, 2).map(r => r.regionId),
    regionSelections: regions.slice(0, 2), regionMode: 'all' });
  const result = await api.discoveryProvider.search({ scope, limit: 10 });
  assert.deepEqual(result.candidates.map(c => c.name).sort(), ['excluded', 'exclusion-boundary', 'shared']);
  assert.equal(result.sortBasis, 'name-then-id');
  assert.ok(result.candidates.every(c => c.distanceKm === undefined && c.originDistances?.length === 0));
  assert.deepEqual(result.queryScope, scope);
  assert.equal(result.geometryEvidence?.length, 2);
  assert.equal(result.availability.status, 'available');
  assert.deepEqual(urls.filter(u => u.pathname === '/v2/place-details').map(u => u.searchParams.get('id')), ['A', 'B']);
  assert.deepEqual(urls.filter(u => u.pathname === '/v2/places').map(u => u.searchParams.get('filter')), ['place:A', 'place:B']);
});

for (const regionMode of ['any', 'all'] as const) {
  test(`region-only ${regionMode} minus exclusion withholds boundary uncertainty`, async () => {
    const { api, urls, regions } = fixture();
    const scope = discoveryScopeSchema.parse({ includeRegionIds: regions.slice(0, 2).map(r => r.regionId),
      excludeRegionIds: [regions[2]!.regionId], regionSelections: regions, regionMode });
    const result = await api.discoveryProvider.search({ scope, limit: 10 });
    assert.deepEqual(result.candidates.map(c => c.name).sort(), regionMode === 'any' ? ['A-only', 'B-only', 'shared'] : ['shared']);
    assert.equal(result.availability.status, 'partial');
    assert.equal(result.discoveryCoverage.searchCompleteness, 'budget-limited');
    assert.deepEqual(result.queryScope, scope);
    assert.equal(result.geometryEvidence?.length, 3);
    assert.ok(result.geometryEvidence?.every(g => g.sourceVintage === 'unknown'));
    assert.deepEqual(urls.filter(u => u.pathname === '/v2/places').map(u => u.searchParams.get('filter')), ['place:A', 'place:B']);
    const candidate = result.candidates.find(c => c.name === 'shared')!;
    const chosen = await api.selectedPlaceResolver.resolve({ placeId: candidate.placeId,
      sourceRevision: candidate.sourceRevision, displayTimeZone: 'UTC' });
    assert.equal(chosen.longitude, 2.5);
    assert.equal(chosen.latitude, 2.5);
    assert.equal(chosen.sourceRevision, candidate.sourceRevision);
  });
}

test('origin minus exclusion needs no positive administrative region or centroid substitution', async () => {
  const { api, urls, regions, select } = fixture();
  const origin = select('Origin', false);
  const scope = discoveryScopeSchema.parse({ origins: [{ ...origin, radiusKm: 300 }],
    excludeRegionIds: [regions[2]!.regionId], regionSelections: [regions[2]!] });
  const result = await api.discoveryProvider.search({ scope, limit: 10 });
  assert.deepEqual(result.candidates.map(c => c.name).sort(), ['A-only', 'shared']);
  assert.equal(result.geometryEvidence?.length, 1);
  assert.equal(result.availability.status, 'partial');
  assert.deepEqual(result.queryScope, scope);
  assert.deepEqual(urls.filter(u => u.pathname === '/v2/places').map(u => u.searchParams.get('filter')), ['circle:2.5,2.5,300000']);
  assert.ok(result.candidates.every(c => c.originDistances?.length === 1));
});

test('exclusion-only search is rejected before geometry or candidate transport', async () => {
  const { api, urls, regions } = fixture();
  await assert.rejects(api.discoveryProvider.search({ scope: { excludeRegionIds: [regions[2]!.regionId],
    regionSelections: [regions[2]!] }, limit: 5 }), /origin or included region|exclusion-only/i);
  assert.equal(urls.length, 0);
});

test('five included plus five excluded regions use the existing ten-geometry and five-page budget', async () => {
  let time = Date.parse('2026-10-18T00:00:00Z');
  const urls: URL[] = [], charges: number[] = [];
  const api = createApiServices({ userAgent: 'Offline ten-region fixture', geoapifyApiKey: 'fixture',
    geometryEnabled: true, geometrySourceAccepted: true, now: () => time,
    quota: { reserve: async (_id, cost) => { charges.push(cost); return { allowed: true, reason: 'offline allowance' }; } },
    fetcher: async input => {
      const url = new URL(String(input)); urls.push(url); time += 1100;
      if (url.pathname === '/v2/place-details') {
        const id = url.searchParams.get('id')!, a = id.startsWith('include') ? 0 : 20, b = a + 10;
        return Response.json({ type: 'FeatureCollection', features: [{ type: 'Feature',
          properties: { feature_type: 'details', place_id: id }, geometry: { type: 'Polygon',
            coordinates: [[[a, a], [b, a], [b, b], [a, b], [a, a]]] } }] });
      }
      assert.equal(url.pathname, '/v2/places');
      return Response.json({ features: [{ properties: { place_id: 'shared-site', name: 'Shared site', categories: ['leisure.park'] },
        geometry: { type: 'Point', coordinates: [3, 3] } }] });
    } });
  const refs = Array.from({ length: 10 }, (_, index) => {
    const upstreamId = `${index < 5 ? 'include' : 'exclude'}-${index}`;
    const selected = api.selectionStore.put({ providerId: 'geoapify', upstreamId, name: upstreamId, longitude: 3, latitude: 3,
      fetchedAt: new Date(time).toISOString(), expiresAt: new Date(time + 3600000).toISOString(),
      sourceUrl: 'https://www.geoapify.com/', attribution: 'Offline fixture', timeZoneEvidence: { status: 'unknown' },
      regionEvidence: { countryCode: 'IND', adminLevel: 1 } });
    return { regionId: selected.placeId.replace('place:v1:', 'region:v1:'), sourceRevision: selected.sourceRevision };
  });
  const scope = discoveryScopeSchema.parse({ includeRegionIds: refs.slice(0, 5).map(r => r.regionId),
    excludeRegionIds: refs.slice(5).map(r => r.regionId), regionSelections: refs, regionMode: 'all' });
  const result = await api.discoveryProvider.search({ scope, limit: 10 });
  assert.deepEqual(result.queryScope, scope);
  assert.equal(result.geometryEvidence?.length, 10);
  assert.deepEqual(result.candidates.map(c => c.name), ['Shared site']);
  assert.equal(result.availability.status, 'available');
  assert.equal(urls.filter(u => u.pathname === '/v2/place-details').length, 10);
  assert.equal(urls.filter(u => u.pathname === '/v2/places').length, 5);
  assert.deepEqual(charges, [...Array(10).fill(2), ...Array(5).fill(1)]);
  assert.equal(charges.reduce((sum, cost) => sum + cost, 0), 25);
});
