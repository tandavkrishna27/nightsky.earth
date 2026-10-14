import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { buildGlobalCatalogue } from '../../scripts/osm/build-global-catalogue';
import { loadCatalogueFiles, CatalogueBudgetStop } from '../../server/places/catalogueFiles';
import { GeoNamesPlaceIndex } from '../../server/places/geonames';
import { discoveryScopeSchema, searchDiscoveryResultSchema } from '../../shared/nightsky/discovery';
import type { SourceRecord } from '../../shared/nightsky/common';
import type { CatalogueBudget, CatalogueCandidate, CoverageFootprint } from '../../server/places/catalogueFiles';
const source = { name: 'OSM', url: 'https://openstreetmap.org', attribution: 'OSM contributors', dataClass: 'catalog' as const, vintage: '2026' };
const region = (n: string) => ({ regionId: `region:v1:${n}`, name: n, countryCode: 'IND' as const, adminLevel: 0 as const, boundaryRevision: 'b1', sources: [source] });
const row = (id: number, latitude: number, longitude = 0, regionIds: string[] = []) => ({ placeId: `place:v1:osm:node:${id}`, name: 'Park', category: 'park' as const, latitude, longitude, accessEvidence: { status: 'unknown' as const }, sources: [source], caveats: [], catalogueRevision: 'test-v1', sourceCompleteness: id, regionIds, countryCode: 'IND' });
const cities = new GeoNamesPlaceIndex([[1, 'Origin', 'Origin', '', 0, 0, 'IN', 'India', 0, 'Asia/Kolkata'], [2, 'Date', 'Date', '', 0, 179.9, 'IN', 'India', 0, 'Asia/Kolkata'], [3, 'Pole', 'Pole', '', 89.9, 0, 'IN', 'India', 0, 'Asia/Kolkata']], 'test');
const fp = { geometryBasis: 'full-cell' as const, footprintId: 'world', bounds: { south: -90, north: 90, west: -180, east: 180 }, sources: [source], vintage: '2026', regionIds: ['region:v1:A', 'region:v1:B'] };
async function fixture(candidates: CatalogueCandidate[] = [row(1, .1, 0, ['region:v1:A']), row(2, .2, 0, ['region:v1:A', 'region:v1:B']), row(3, .3, 0, ['region:v1:B'])], footprints: CoverageFootprint[] = [fp], options = {}, buildOptions = { maxRows: 1, fanout: 2 }) {
    const dir = await mkdtemp(join(tmpdir(), 'cat-query-'));
    const built = await buildGlobalCatalogue({ catalogueRevision: 'test-v1', candidates, regions: [region('A'), region('B')], footprints }, dir, buildOptions);
    const files = await loadCatalogueFiles(built.path, { expectedSha256: built.sha256 });
    const { createGlobalCatalogue } = await import('../../server/places/globalCatalogue');
    return createGlobalCatalogue(files, { cities, ...options });
}
test('scopeResultsMatchBruteForce', async () => { const cat = await fixture(); for (const originMode of ['any', 'all'] as const)
    for (const regionMode of ['any', 'all'] as const)
        for (const excluded of [[], ['region:v1:B']]) {
            const scope = discoveryScopeSchema.parse({ origins: [{ placeId: 'place:v1:geonames:1', radiusKm: 50, minimumDistanceKm: 15 }], originMode, includeRegionIds: ['region:v1:A', 'region:v1:B'], excludeRegionIds: excluded, regionMode });
            const result = await cat.search(scope, { limit: 10 });
            searchDiscoveryResultSchema.parse(result);
            const expected = [row(2, .2, 0, ['region:v1:A', 'region:v1:B']), row(3, .3, 0, ['region:v1:B'])].filter(r => (regionMode === 'any' || r.regionIds.length === 2) && !r.regionIds.some(id => excluded.includes(id))).map(r => r.placeId);
            assert.deepEqual(result.candidates.map(r => r.placeId), expected);
            assert.equal(result.discoveryCoverage.searchCompleteness, 'complete');
        } });
test('emptyMissingAndTruncatedAreDifferent', async () => { const scope = discoveryScopeSchema.parse({ origins: [{ placeId: 'place:v1:geonames:1', radiusKm: 50 }] }); const empty = await (await fixture([])).search(scope, { limit: 5 }); assert.equal(empty.discoveryCoverage.footprintStatus, 'covered'); const missing = await (await fixture([], [])).search(scope, { limit: 5 }); assert.equal(missing.discoveryCoverage.searchCompleteness, 'unavailable'); const partial = await (await fixture(undefined, undefined, { budget: { maxLeaves: 1 } })).search(scope, { limit: 5 }); assert.equal(partial.discoveryCoverage.searchCompleteness, 'budget-limited'); assert.ok(partial.truncationReason); });
test('staleDetailsAndNamedCandidate', async () => { const cat = await fixture(); assert.equal((await cat.details({ placeId: 'place:v1:osm:node:2', catalogueRevision: 'test-v1' }))?.latitude, .2); await assert.rejects(cat.details({ placeId: 'place:v1:osm:node:2', catalogueRevision: 'old' }), /revision/i); assert.equal(await cat.details({ placeId: 'place:v1:osm:node:999', catalogueRevision: 'test-v1' }), undefined); assert.equal((await cat.findNames({ placeQuery: ' PARK ', countryCode: 'IND' })).length, 3); await assert.rejects(cat.details({ placeId: '../secret', catalogueRevision: 'test-v1' })); await assert.rejects(cat.search(discoveryScopeSchema.parse({ includeRegionIds: ['region:v1:missing'] }), { limit: 5 }), /unknown/i); });
test('dateline and polar routing preserve actual points', async () => { const cat = await fixture([row(1, 0, -179.9), row(2, 89.9, 180)]); for (const [id, expected] of [[2, 1], [3, 2]]) {
    const result = await cat.search(discoveryScopeSchema.parse({ origins: [{ placeId: `place:v1:geonames:${id}`, radiusKm: 50 }] }), { limit: 5 });
    assert.equal(result.candidates[0].placeId, `place:v1:osm:node:${expected}`);
    assert.ok(result.candidates[0].originDistances![0].distanceKm < 50);
} });
test('lookup budget stops cannot masquerade as absent ID', async () => { const cat = await fixture(undefined, undefined, { budget: { maxLeaves: 1 } }); await assert.rejects(cat.details({ placeId: 'place:v1:osm:node:2', catalogueRevision: 'test-v1' }), CatalogueBudgetStop); });
test('region-only any/all/exclusions and bounded top ten match complete reference', async () => { const candidates = Array.from({ length: 30 }, (_, i) => row(i + 1, i / 100, 0, i % 2 ? ['region:v1:A', 'region:v1:B'] : ['region:v1:A'])); const cat = await fixture(candidates); for (const regionMode of ['any', 'all'] as const) {
    const scope = discoveryScopeSchema.parse({ includeRegionIds: ['region:v1:A', 'region:v1:B'], regionMode });
    const result = await cat.search(scope, { limit: 10 });
    const expected = candidates.filter(c => regionMode === 'any' || c.regionIds.length === 2).sort((a, b) => b.sourceCompleteness - a.sourceCompleteness).slice(0, 10);
    assert.deepEqual(result.candidates.map(c => c.placeId), expected.map(c => c.placeId));
    assert.equal(result.sortBasis, 'source-completeness-then-name-id');
} assert.equal((await cat.findNames({ placeQuery: 'Park' })).length, 5); });
test('five origins compare exact per-origin distances and category filters', async () => { const cat = await fixture(); const origins = Array.from({ length: 5 }, () => ({ placeId: 'place:v1:geonames:1', radiusKm: 50 })); const result = await cat.search(discoveryScopeSchema.parse({ origins, originMode: 'all' }), { limit: 2, categories: ['park'] }); assert.equal(result.sortBasis, 'maximum-distance'); assert.equal(result.candidates[0].originDistances?.length, 5); assert.equal(result.candidates.length, 2); assert.equal((await cat.search(discoveryScopeSchema.parse({ origins }), { limit: 5, categories: ['beach'] })).candidates.length, 0); });
test('candidate origin requires edition and uses exact public point', async () => { const cat = await fixture(); const scope = discoveryScopeSchema.parse({ origins: [{ placeId: 'place:v1:osm:node:2', catalogueRevision: 'test-v1', radiusKm: 1 }] }); const result = await cat.search(scope, { limit: 5 }); assert.equal(result.candidates.length, 1); assert.equal(result.candidates[0].distanceKm, 0); assert.equal(result.originBasis[0].basis, 'catalogue-point'); await assert.rejects(cat.search(discoveryScopeSchema.parse({ origins: [{ placeId: 'place:v1:osm:node:2', radiusKm: 1 }] }), { limit: 5 }), /revision/i); });
test('conflicting duplicate source provenance is rejected', async () => { const cat = await fixture([{ ...row(1, .1), sources: [{ ...source, attribution: 'different' }] }]); await assert.rejects(cat.search(discoveryScopeSchema.parse({ origins: [{ placeId: 'place:v1:geonames:1' }] }), { limit: 5 }), /conflicting source/i); });
test('full circle covered by adjoining admitted cells is complete', async () => { const cat = await fixture([], [{ ...fp, footprintId: 'west', bounds: { south: -1, north: 1, west: -1, east: 0 } }, { ...fp, footprintId: 'east', bounds: { south: -1, north: 1, west: 0, east: 1 } }]); const result = await cat.search(discoveryScopeSchema.parse({ origins: [{ placeId: 'place:v1:geonames:1', radiusKm: 50 }] }), { limit: 5 }); assert.equal(result.discoveryCoverage.footprintStatus, 'covered'); });
test('region-only query routes through membership instead of scanning unrelated candidates', async () => { const candidates = Array.from({ length: 40 }, (_, i) => row(i + 1, i / 100)); candidates.push(row(99, 1, 0, ['region:v1:A'])); const cat = await fixture(candidates, undefined, { budget: { maxLeaves: 8 } }); const result = await cat.search(discoveryScopeSchema.parse({ includeRegionIds: ['region:v1:A'] }), { limit: 5 }); assert.equal(result.discoveryCoverage.searchCompleteness, 'complete'); assert.deepEqual(result.candidates.map(r => r.placeId), ['place:v1:osm:node:99']); });
test('dense region page is read once through member page pointers', async () => { const dir = await mkdtemp(join(tmpdir(), 'cat-dense-region-')); const candidates = Array.from({ length: 100 }, (_, i) => row(i + 1, i / 100, 0, ['region:v1:A'])); const built = await buildGlobalCatalogue({ catalogueRevision: 'test-v1', candidates, regions: [region('A')], footprints: [{ ...fp, regionIds: ['region:v1:A'] }] }, dir, { maxRows: 1000 }); const files = await loadCatalogueFiles(built.path, { expectedSha256: built.sha256 }); const { createGlobalCatalogue } = await import('../../server/places/globalCatalogue'); const cat = createGlobalCatalogue(files, { cities, budget: { maxLeaves: 6 } }); const result = await cat.search(discoveryScopeSchema.parse({ includeRegionIds: ['region:v1:A'] }), { limit: 10 }); assert.equal(result.discoveryCoverage.searchCompleteness, 'complete'); assert.equal(result.candidates[0].placeId, 'place:v1:osm:node:100'); });
test('source evidence admission stops at public provenance limit', async () => { const footprints = Array.from({ length: 70 }, (_, i) => ({ ...fp, footprintId: `edition-${i}`, sources: [{ ...source, product: `tile-${i}` }] })); const cat = await fixture([], footprints); const result = await cat.search(discoveryScopeSchema.parse({ origins: [{ placeId: 'place:v1:geonames:1' }] }), { limit: 5 }); assert.equal(result.sources.length, 64); assert.equal(result.discoveryCoverage.searchCompleteness, 'budget-limited'); assert.equal(result.discoveryCoverage.stopReason, 'source-limit'); searchDiscoveryResultSchema.parse(result); });
test('combined five-origin scopes equal independent spherical reference', async () => { const candidates = [row(1, .1, 0, ['region:v1:A']), row(2, .3, 0, ['region:v1:A', 'region:v1:B']), row(3, 0, -179.9, ['region:v1:B']), row(4, 89.9, 180, ['region:v1:A']), { ...row(5, .2, 0, ['region:v1:B']), category: 'beach' as const }]; const cat = await fixture(candidates); const points = [{ latitude: 0, longitude: 0 }, { latitude: 0, longitude: 179.9 }, { latitude: 89.9, longitude: 0 }, { latitude: 0, longitude: 0 }, { latitude: 0, longitude: 179.9 }]; const distance = (a: typeof points[number], b: typeof points[number]) => { const r = Math.PI / 180; return 6371.0088 * Math.acos(Math.min(1, Math.max(-1, Math.sin(a.latitude * r) * Math.sin(b.latitude * r) + Math.cos(a.latitude * r) * Math.cos(b.latitude * r) * Math.cos((a.longitude - b.longitude) * r)))); }; for (const originMode of ['any', 'all'] as const)
    for (const regionMode of ['any', 'all'] as const)
        for (const excludeRegionIds of [[], ['region:v1:B']])
            for (const category of ['park', 'beach'] as const) {
                const origins = points.map((_, i) => ({ placeId: `place:v1:geonames:${[1, 2, 3, 1, 2][i]}`, radiusKm: 50, minimumDistanceKm: i % 2 ? 10 : 0 }));
                const scope = discoveryScopeSchema.parse({ origins, originMode, regionMode, includeRegionIds: ['region:v1:A', 'region:v1:B'], excludeRegionIds });
                const result = await cat.search(scope, { limit: 10, categories: [category] });
                const expected = candidates.map(row => ({ row, distances: points.map(p => distance(p, row)) })).filter(({ row, distances }) => row.category === category && !row.regionIds.some(id => excludeRegionIds.includes(id)) && (regionMode === 'any' || row.regionIds.length === 2) && (originMode === 'any' ? distances.some((d, i) => d >= origins[i].minimumDistanceKm && d <= 50) : distances.every((d, i) => d >= origins[i].minimumDistanceKm && d <= 50))).sort((a, b) => (originMode === 'any' ? Math.min(...a.distances) - Math.min(...b.distances) : Math.max(...a.distances) - Math.max(...b.distances)) || b.row.sourceCompleteness - a.row.sourceCompleteness);
                assert.deepEqual(result.candidates.map(r => r.placeId), expected.map(r => r.row.placeId));
                for (const c of result.candidates) {
                    const r = expected.find(e => e.row.placeId === c.placeId)!;
                    c.originDistances?.forEach((d, i) => assert.ok(Math.abs(d.distanceKm - r.distances[i]) < .00001));
                }
            } });
async function pinnedDuplicateCatalogue(conflict:boolean){
 const {writeFile,readFile}=await import('node:fs/promises');const {createHash}=await import('node:crypto');const dir=await mkdtemp(join(tmpdir(),'cat-duplicate-leaves-'));
 const original=row(1,.1);const built=await buildGlobalCatalogue({catalogueRevision:'test-v1',candidates:[original],regions:[],footprints:[{...fp,regionIds:[]}]},dir);
 const root=JSON.parse(await readFile(built.path,'utf8'));
 async function publish(path:string,page:any){const bytes=Buffer.from(JSON.stringify(page));await writeFile(join(dir,path),bytes);return {path,sha256:createHash('sha256').update(bytes).digest('hex'),bytes:bytes.length,rows:page.kind==='directory'?page.entries.length:(page.rows?.length??0),kind:page.kind};}
 const leaves=[];for(let i=0;i<2;i++)leaves.push(await publish(`duplicate-${i}.json`,{schemaVersion:2,catalogueRevision:'test-v1',kind:'candidates',rows:[{...original,latitude:conflict&&i===1?.2:.1}]}));
 root.trees.spatial=await publish('duplicate-directory.json',{schemaVersion:2,catalogueRevision:'test-v1',kind:'directory',entries:leaves});const pinned=await publish('duplicate-root.json',root);const files=await loadCatalogueFiles(join(dir,pinned.path),{expectedSha256:pinned.sha256});const {createGlobalCatalogue}=await import('../../server/places/globalCatalogue');return createGlobalCatalogue(files,{cities});
}
test('identical identity rows in separately pinned valid leaves coalesce',async()=>{const cat=await pinnedDuplicateCatalogue(false);const result=await cat.search(discoveryScopeSchema.parse({origins:[{placeId:'place:v1:geonames:1'}]}),{limit:10});assert.deepEqual(result.candidates.map(c=>c.placeId),['place:v1:osm:node:1']);assert.equal(result.discoveryCoverage.searchCompleteness,'complete');});
test('conflicting identity rows in separately pinned valid leaves reject',async()=>{const cat=await pinnedDuplicateCatalogue(true);await assert.rejects(cat.search(discoveryScopeSchema.parse({origins:[{placeId:'place:v1:geonames:1'}]}),{limit:10}),/conflicting candidate identity/i);});

test('bounded scanned identity admission stops with honest incomplete ranking',async()=>{const cat=await fixture(undefined,undefined,{maxScannedIdentities:1});const result=await cat.search(discoveryScopeSchema.parse({origins:[{placeId:'place:v1:geonames:1'}]}),{limit:10});assert.equal(result.candidates.length,1);assert.equal(result.discoveryCoverage.searchCompleteness,'budget-limited');assert.equal(result.discoveryCoverage.stopReason,'scanned-identity-limit');assert.equal(result.truncationReason,'scanned-identity-limit');});

test('same canonical source retains distinct native editions and model time identities', async () => {
    const base: SourceRecord = { ...source, url: 'https://www.openstreetmap.org/copyright', product: 'OSM extract', vintage: '2026-10-01', model: 'v1', issuedAt: '2026-10-01T00:00:00Z', validStartUtc: '2026-10-01T00:00:00Z', validEndUtc: '2026-10-02T00:00:00Z' };
    const variants: SourceRecord[] = [base, { ...base, vintage: '2026-10-02' }, { ...base, model: 'v2' }, { ...base, issuedAt: '2026-10-02T00:00:00Z' }, { ...base, validStartUtc: '2026-10-01T01:00:00Z' }, { ...base, validEndUtc: '2026-10-03T00:00:00Z' }];
    const cat = await fixture(variants.slice(1).map((s, i) => ({ ...row(i + 1, .1), sources: [s] })), [{ ...fp, sources: [base] }]);
    const result = await cat.search(discoveryScopeSchema.parse({ origins: [{ placeId: 'place:v1:geonames:1' }] }), { limit: 10 });
    assert.equal(result.candidates.length, 5);
    assert.equal(result.sources.filter(s => s.product === 'OSM extract').length, 6);
    searchDiscoveryResultSchema.parse(result);
});

test('local query ignores 64 remote footprint editions within a two-leaf budget', async () => {
    const local = { ...fp, footprintId: 'local', bounds: { south: -1, north: 1, west: -1, east: 1 }, regionIds: [] };
    const remote = Array.from({ length: 64 }, (_, i) => ({ ...fp, footprintId: `remote-${i}`, bounds: { south: 59, north: 61, west: 59, east: 61 }, sources: [{ ...source, product: `remote-${i}` }], regionIds: [] }));
    const cat = await fixture([row(1, .1)], [local, ...remote], { budget: { maxLeaves: 2 } });
    const result = await cat.search(discoveryScopeSchema.parse({ origins: [{ placeId: 'place:v1:geonames:1' }] }), { limit: 5 });
    assert.deepEqual(result.candidates.map(c => c.placeId), ['place:v1:osm:node:1']);
    assert.equal(result.discoveryCoverage.footprintStatus, 'covered');
    assert.equal(result.discoveryCoverage.searchCompleteness, 'complete');
    assert.ok(result.sources.every(s => !s.product?.startsWith('remote-')));
});

test('mixed footprint leaf admits only local evidence before the provenance limit', async () => {
    const local = { ...fp, footprintId: 'local', bounds: { south: -1, north: 1, west: -1, east: 1 } };
    const remote = Array.from({ length: 64 }, (_, i) => ({ ...fp, footprintId: `remote-${i}`, bounds: { south: 59, north: 61, west: 59, east: 61 }, sources: [{ ...source, product: `remote-${i}` }] }));
    const result = await (await fixture([row(1, .1)], [local, ...remote], {}, { maxRows: 100, fanout: 2 })).search(discoveryScopeSchema.parse({ origins: [{ placeId: 'place:v1:geonames:1' }] }), { limit: 5 });
    assert.equal(result.candidates.length, 1);
    assert.equal(result.discoveryCoverage.searchCompleteness, 'complete');
    assert.ok(result.sources.every(s => !s.product?.startsWith('remote-')));
});

test('same source edition rejects contradictory metadata and coalesces reordered records', async () => {
    for (const change of [{ attribution: 'Other attribution' }, { name: 'Other name' }, { licenseUrl: 'https://example.com/license' }, { modified: true }, { dataClass: 'calculation' as const }]) {
        const cat = await fixture([{ ...row(1, .1), sources: [{ ...source, ...change }] }]);
        await assert.rejects(cat.search(discoveryScopeSchema.parse({ origins: [{ placeId: 'place:v1:geonames:1' }] }), { limit: 5 }), /conflicting source provenance/i);
    }
    const reordered = { vintage: source.vintage, dataClass: source.dataClass, attribution: source.attribution, url: source.url, name: source.name };
    const result = await (await fixture([{ ...row(1, .1), sources: [reordered] }])).search(discoveryScopeSchema.parse({ origins: [{ placeId: 'place:v1:geonames:1' }] }), { limit: 5 });
    assert.equal(result.sources.filter(s => s.url === source.url).length, 1);
    assert.equal(result.candidates.length, 1);
});

test('source edition identity remains bounded at 64 admitted records', async () => {
    const footprints = Array.from({ length: 70 }, (_, i) => ({ ...fp, footprintId: `edition-${i}`, sources: [{ ...source, vintage: `edition-${i}` }] }));
    const result = await (await fixture([], footprints)).search(discoveryScopeSchema.parse({ origins: [{ placeId: 'place:v1:geonames:1' }] }), { limit: 5 });
    assert.equal(result.sources.length, 64);
    assert.equal(result.discoveryCoverage.searchCompleteness, 'budget-limited');
    assert.equal(result.discoveryCoverage.stopReason, 'source-limit');
});

test('local footprint routing preserves uncovered holes and independent origin coverage', async () => {
    const footprints = [{ ...fp, footprintId: 'south', bounds: { south: -1, north: -.1, west: -1, east: 1 } }, { ...fp, footprintId: 'north', bounds: { south: .1, north: 1, west: -1, east: 1 } }];
    const cat = await fixture([row(1, .2)], footprints);
    const hole = await cat.search(discoveryScopeSchema.parse({ origins: [{ placeId: 'place:v1:geonames:1', radiusKm: 50, minimumDistanceKm: 15 }] }), { limit: 5 });
    assert.equal(hole.discoveryCoverage.footprintStatus, 'partial');
    assert.equal(hole.candidates.length, 1);
    for (const originMode of ['any', 'all'] as const) {
        const result = await cat.search(discoveryScopeSchema.parse({ origins: [{ placeId: 'place:v1:geonames:1' }, { placeId: 'place:v1:geonames:2' }], originMode }), { limit: 5 });
        assert.equal(result.discoveryCoverage.footprintStatus, 'partial');
        assert.equal(result.candidates.length, originMode === 'any' ? 1 : 0);
    }
});

test('region tags never admit a disjoint cell into a combined origin scope', async () => {
    const local = { ...fp, footprintId: 'local', bounds: { south: -1, north: 1, west: -1, east: 1 }, regionIds: [] };
    const remote = { ...fp, footprintId: 'remote', bounds: { south: 59, north: 61, west: 59, east: 61 }, sources: [{ ...source, product: 'remote' }], regionIds: ['region:v1:A'] };
    const cat = await fixture([row(1, .1, 0, ['region:v1:A']), row(2, .2, 0, ['region:v1:A', 'region:v1:B'])], [local, remote]);
    for (const regionMode of ['any', 'all'] as const) {
        const result = await cat.search(discoveryScopeSchema.parse({ origins: [{ placeId: 'place:v1:geonames:1' }], includeRegionIds: ['region:v1:A'], excludeRegionIds: ['region:v1:B'], regionMode }), { limit: 5 });
        assert.deepEqual(result.candidates.map(c => c.placeId), ['place:v1:osm:node:1']);
        assert.equal(result.discoveryCoverage.footprintStatus, 'partial');
        assert.ok(result.sources.every(s => s.product !== 'remote'));
    }
});

test('bounded region coverage admission leaves room for relevant membership search', async () => {
    const unrelated = Array.from({ length: 64 }, (_, i) => ({ ...fp, footprintId: `a-unrelated-${i}`, bounds: { south: 59, north: 61, west: 59, east: 61 }, sources: [{ ...source, product: `unrelated-${i}` }], regionIds: ['region:v1:B'] }));
    const relevant = { ...fp, footprintId: 'z-relevant', bounds: { south: -1, north: 1, west: -1, east: 1 }, regionIds: ['region:v1:A'] };
    const cat = await fixture([row(1, .1, 0, ['region:v1:A'])], [...unrelated, relevant], { budget: { maxLeaves: 4 } });
    let spent: CatalogueBudget | undefined, deadline: number | undefined;
    const createBudget = cat.files.createBudget;
    cat.files.createBudget = options => { spent = createBudget(options); deadline = spent.deadline; return spent; };
    const result = await cat.search(discoveryScopeSchema.parse({ includeRegionIds: ['region:v1:A'] }), { limit: 5 });
    assert.deepEqual(result.candidates.map(c => c.placeId), ['place:v1:osm:node:1']);
    assert.equal(result.discoveryCoverage.footprintStatus, 'partial');
    assert.equal(result.discoveryCoverage.searchCompleteness, 'budget-limited');
    assert.equal(result.discoveryCoverage.stopReason, 'leaf-limit');
    assert.ok(result.sources.every(s => !s.product?.startsWith('unrelated-')));
    assert.equal(spent!.leaves, 4);
    assert.ok(spent!.directoryBytes <= spent!.maxDirectoryBytes);
    assert.equal(spent!.deadline, deadline);
});

test('coverage partition honors a one-leaf total without extending its deadline', async () => {
    const cat = await fixture([row(1, .1)], [{ ...fp, bounds: { south: -1, north: 1, west: -1, east: 1 } }], { budget: { maxLeaves: 1, maxDirectoryBytes: 1 } });
    let spent: CatalogueBudget | undefined, deadline: number | undefined;
    const createBudget = cat.files.createBudget;
    cat.files.createBudget = options => { spent = createBudget(options); deadline = spent.deadline; return spent; };
    const result = await cat.search(discoveryScopeSchema.parse({ origins: [{ placeId: 'place:v1:geonames:1' }] }), { limit: 5 });
    assert.equal(result.candidates.length, 1);
    assert.equal(result.discoveryCoverage.footprintStatus, 'partial');
    assert.equal(result.discoveryCoverage.searchCompleteness, 'budget-limited');
    assert.equal(spent!.leaves, 1);
    assert.equal(spent!.directoryBytes, 0);
    assert.equal(spent!.deadline, deadline);
});
