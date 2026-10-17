import test from 'node:test';
import assert from 'node:assert/strict';

// This contract remains disconnected from runtime discovery until source admission.
const point = (id = 'a', revision = '1') => ({ placeId: `place:v1:api:geoapify:${id.repeat(64)}`, sourceRevision: revision.repeat(64) });
const region = (id: string, revision = '2') => ({ regionId: `region:v1:api:geoapify:${id.repeat(64)}`, sourceRevision: revision.repeat(64) });
const country = region('b');
const state = region('c');
const excluded = region('d');
const now = Date.parse('2026-10-17T00:00:00Z');
const evidence = (r: ReturnType<typeof region>, membership: 'inside' | 'outside' | 'unknown', overrides = {}) => ({
    point: point(), region: r, membership,
    source: { name: 'Synthetic membership', url: 'https://example.org/', attribution: 'Synthetic fixture; no geographic claim', dataClass: 'context' },
    method: 'synthetic-reviewed-boundary-v1', fetchedAt: '2026-10-17T00:00:00Z', expiresAt: '2026-10-17T01:00:00Z', ...overrides
});
async function contract() { return import('../../server/places/api/regionMembership'); }
test('bounded membership composition contract exists without enabling runtime support', async () => {
    let available = false;
    try { available = typeof (await contract()).composeRegionMembership === 'function'; } catch {}
    assert.equal(available, true);
});
test('origin any/all intersect region any/all and exclusions win', async () => {
    const { composeRegionMembership } = await contract();
    const provider = { async classify() { return [evidence(country, 'inside'), evidence(state, 'outside'), evidence(excluded, 'outside')]; } };
    const rows = await provider.classify();
    for (const originMode of ['any', 'all'] as const) for (const regionMode of ['any', 'all'] as const) {
        const result = composeRegionMembership({ candidates: [{ point: point(), originMatches: [true, false] }], originMode, includeRegions: [country, state], regionMode, excludeRegions: [excluded], evidence: rows, now });
        assert.equal(result.decisions[0]!.status, originMode === 'any' && regionMode === 'any' ? 'qualified' : 'excluded');
    }
    const overlap = composeRegionMembership({ candidates: [{ point: point(), originMatches: [] }], includeRegions: [country], excludeRegions: [country], evidence: [evidence(country, 'inside')], now });
    assert.equal(overlap.decisions[0]!.status, 'excluded');
});
test('country and state intersection accepts both inside and rejects disjoint states', async () => {
    const { composeRegionMembership } = await contract();
    for (const member of ['inside', 'outside'] as const) {
        const result = composeRegionMembership({ candidates: [{ point: point(), originMatches: [] }], includeRegions: [country, state], regionMode: 'all', evidence: [evidence(country, 'inside'), evidence(state, member)], now });
        assert.equal(result.decisions[0]!.status, member === 'inside' ? 'qualified' : 'excluded');
    }
});
test('boundary hole and dateline classifications are consumed only as sourced evidence', async () => {
    const { composeRegionMembership } = await contract();
    for (const [reason, membership] of [['boundary policy unresolved', 'unknown'], ['inside admitted hole', 'outside'], ['dateline polygon interior', 'inside']] as const) {
        const result = composeRegionMembership({ candidates: [{ point: point(), originMatches: [] }], includeRegions: [country], evidence: [evidence(country, membership, { reason })], now });
        assert.equal(result.decisions[0]!.status, membership === 'unknown' ? 'unknown' : membership === 'inside' ? 'qualified' : 'excluded');
    }
});
test('unknown failed expired conflicting and mismatched revision evidence never qualifies', async () => {
    const { composeRegionMembership } = await contract();
    for (const rows of [[], [evidence(country, 'unknown')], [evidence(country, 'inside', { expiresAt: '2026-10-17T00:00:00Z' })], [evidence(country, 'inside', { region: region('b', '3') })], [evidence(country, 'inside', { point: point('a', '3') })], [evidence(country, 'inside'), evidence(country, 'outside')]]) {
        const result = composeRegionMembership({ candidates: [{ point: point(), originMatches: [] }], includeRegions: [country], evidence: rows, now });
        assert.equal(result.decisions[0]!.status, 'unknown');
        assert.equal(result.coverage, 'partial');
    }
    const unknownExclusion = composeRegionMembership({ candidates: [{ point: point(), originMatches: [] }], includeRegions: [country], excludeRegions: [excluded], evidence: [evidence(country, 'inside')], now });
    assert.equal(unknownExclusion.decisions[0]!.status, 'unknown');
});
test('membership composition rejects unbounded and exclusion-only scopes', async () => {
    const { composeRegionMembership } = await contract();
    const base = { candidates: [{ point: point(), originMatches: [] }], includeRegions: [country], evidence: [], now };
    assert.throws(() => composeRegionMembership({ ...base, candidates: Array(101).fill(base.candidates[0]) }));
    assert.throws(() => composeRegionMembership({ ...base, includeRegions: Array(6).fill(country) }));
    assert.throws(() => composeRegionMembership({ ...base, includeRegions: [], excludeRegions: [excluded] }));
    assert.throws(() => composeRegionMembership({ ...base, evidence: Array(1001).fill(evidence(country, 'inside')) }));
});

test('one failed membership subquery leaves other candidates usable with partial coverage', async () => {
    const { composeRegionMembership } = await contract();
    const second = point('e');
    const fake = { async classify() { return [evidence(country, 'inside'), evidence(country, 'unknown', { point: second, reason: 'Synthetic timeout in one bounded subquery' })]; } };
    const result = composeRegionMembership({ candidates: [{ point: point(), originMatches: [true] }, { point: second, originMatches: [true] }], includeRegions: [country], evidence: await fake.classify(), now });
    assert.deepEqual(result.decisions.map(d => d.status), ['qualified', 'unknown']);
    assert.equal(result.coverage, 'partial');
});
test('unknown relevant union membership is conservative and no-region origin scope stays bounded', async () => {
    const { composeRegionMembership } = await contract();
    const union = composeRegionMembership({ candidates: [{ point: point(), originMatches: [] }], includeRegions: [country, state], regionMode: 'any', evidence: [evidence(country, 'inside')], now });
    assert.equal(union.decisions[0]!.status, 'unknown');
    const candidates = Array.from({ length: 100 }, (_, i) => ({ point: { placeId: `place:v1:api:geoapify:${i.toString(16).padStart(64, '0')}`, sourceRevision: '1'.repeat(64) }, originMatches: [true] }));
    assert.equal(composeRegionMembership({ candidates, evidence: [], now }).decisions.filter(d => d.status === 'qualified').length, 100);
    assert.throws(() => composeRegionMembership({ candidates: [candidates[0], candidates[0]], evidence: [], now }));
    assert.throws(() => composeRegionMembership({ candidates: [candidates[0], { ...candidates[1], originMatches: [] }], evidence: [], now }));
});
