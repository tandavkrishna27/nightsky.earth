import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, readdirSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createFixtureServer } from '../../scripts/complete-model-journey-test';
import * as harness from '../../scripts/complete-model-journey-test';

test('API fixture CLI selection and resume cannot mix catalogue evidence', () => {
    assert.equal(harness.selectFixtureMode(['--api-fixture']), 'api');
    assert.equal(harness.selectFixtureMode([]), 'catalogue');
    assert.throws(() => harness.validateFixtureResume([{id:'casual'}], 'api'), /fixture/);
    assert.throws(() => harness.validateFixtureResume([{fixtureMode:'api'}], 'catalogue'), /fixture/);
    harness.validateFixtureResume([{fixtureMode:'api'}], 'api');
    harness.validateFixtureResume([{id:'casual'}], 'catalogue');
});

test('API rehearsal resolves immutable snapshots and plans discovered candidates without catalogue files', async () => {
    const root = mkdtempSync(join(tmpdir(), 'nightsky-api-journey-'));
    const realFetch = globalThis.fetch;
    globalThis.fetch = async (input, init) => {
        const url = new URL(input instanceof Request ? input.url : String(input));
        assert.equal(url.hostname, '127.0.0.1', 'Only loopback MCP transport may use real fetch');
        return realFetch(input, init);
    };
    const server = await createFixtureServer(root, { mode: 'api' });
    const call = async (name: string, args: unknown) => {
        const response = await server.rpc('tools/call', { name, arguments: args });
        assert.equal(response.result?.isError, undefined, JSON.stringify(response));
        return response.result.structuredContent;
    };
    try {
        assert.equal((await server.rpc('tools/list', {})).result.tools.length, 13);
        assert.deepEqual(readdirSync(root), []);
        const resolved = await call('resolve_place', { placeQuery: 'Fictionvale' });
        const origin = resolved.matches[0];
        assert.match(origin.placeId, /^place:v1:api:/);
        assert.match(origin.sourceRevision, /^[a-f0-9]{64}$/);
        assert.equal(origin.timeZoneEvidence.status, 'verified');
        assert.equal(origin.timeZone, 'Europe/London');
        const found = await call('search_observing_locations', { placeId: origin.placeId, sourceRevision: origin.sourceRevision });
        assert.match(found.availability.reason,/Synthetic offline fixture/);
        assert.ok(found.sources.every((source:{name:string})=>source.name.startsWith('Synthetic fixture')));
        const selected = found.candidates[0];
        assert.equal(selected.name, 'Fiction Park');
        assert.equal(selected.accessEvidence.status, 'unknown');
        const ref = { placeId: selected.placeId, sourceRevision: selected.sourceRevision };
        const details = await call('get_observing_location_details', ref);
        assert.equal(details.matches[0].sourceRevision, selected.sourceRevision);
        const window = { startUtc: '2026-10-15T18:00:00Z', endUtc: '2026-10-16T06:00:00Z', timeZone: 'Europe/London' };
        const plan = await call('plan_observing_session', { ...ref, window, activity: 'general-stargazing' });
        const geographySources=plan.sources.filter((source:{name:string})=>/geoapify/i.test(source.name));
        assert.ok(geographySources.length>0);
        assert.ok(geographySources.every((source:{name:string;attribution:string})=>source.name.startsWith('Synthetic fixture') && /host wall-clock/.test(source.attribution)));
        assert.equal(plan.place.placeId, selected.placeId);
        assert.equal(plan.place.sourceRevision, selected.sourceRevision);
        assert.equal(plan.evidence.weather.forecasts[0].samples[0].values.totalCloudCover.value, 12);
        server.beginCase('replan');
        const revised = await call('plan_observing_session', { ...ref, window, activity: 'general-stargazing' });
        assert.equal(revised.evidence.weather.forecasts[0].samples[0].values.totalCloudCover.value, 85);
        assert.equal(server.externalAttempts(), 0);
        assert.ok(server.fixtureAttempts() > 0);
        assert.deepEqual(readdirSync(root), []);
    } finally { await server.close(); globalThis.fetch = realFetch; }
});

test('API rehearsal retains unknown-zone, stale-selection and unsupported-region boundaries', async () => {
    const server = await createFixtureServer(mkdtempSync(join(tmpdir(), 'nightsky-api-boundary-')), { mode: 'api' });
    const call = (name:string, args:unknown) => server.rpc('tools/call', {name, arguments:args});
    try {
        const r = await call('resolve_place', {placeQuery:'Synthetic Unknown Zone'});
        const p = r.result.structuredContent.matches[0];
        const args = {placeId:p.placeId, sourceRevision:p.sourceRevision, activity:'general-stargazing', window:{startUtc:'2026-10-15T18:00:00Z',endUtc:'2026-10-16T06:00:00Z',timeZone:'Europe/London'}};
        const unknown = await call('plan_observing_session', args);
        assert.equal(unknown.result.isError, true);
        assert.match(JSON.stringify(unknown), /display.time.zone/i);
        const stale = await call('plan_observing_session', {...args, sourceRevision:'0'.repeat(64), displayTimeZone:'Europe/London'});
        assert.equal(stale.result.isError, true);
        const explicit = await call('plan_observing_session', {...args, displayTimeZone:'Europe/London'});
        assert.equal(explicit.result.structuredContent.place.timeZoneBasis, 'explicit-display');
        server.advanceFixtureTime(3600001);
        const expired = await call('get_observing_location_details', {placeId:p.placeId,sourceRevision:p.sourceRevision});
        assert.equal(expired.result.isError, true);
        assert.match(JSON.stringify(expired), /unavailable.*select.*again/i);
        const fresh = await call('resolve_place', {placeQuery:'Synthetic Unknown Zone'});
        assert.notEqual(fresh.result.structuredContent.matches[0].sourceRevision, p.sourceRevision);
        p.sourceRevision = fresh.result.structuredContent.matches[0].sourceRevision;
        const region = await call('resolve_observing_region', {regionQuery:'Synthetic Country'});
        const selected = region.result.structuredContent.matches[0];
        assert.match(selected.regionId, /^region:v1:api:/);
        const unsupported = await call('search_observing_locations', {scope:{origins:[{placeId:p.placeId,sourceRevision:p.sourceRevision}], includeRegionIds:[selected.regionId],regionSelections:[{regionId:selected.regionId,sourceRevision:selected.sourceRevision}]}});
        assert.equal(unsupported.result.structuredContent.availability.status, 'unsupported');
        const host = await call('resolve_place', {useApproximateHostLocation:true});
        assert.equal(host.result.structuredContent.availability.status, 'unavailable');
        assert.equal(server.externalAttempts(), 0);
        server.beginCase('cap');
        for(let i=0;i<12;i++) await call('resolve_place', {placeQuery:'Fictionvale'});
        await assert.rejects(call('resolve_place', {placeQuery:'Fictionvale'}));
        assert.equal(server.budget.traces.length, 12);
    } finally { await server.close(); }
});

test('API fixture supports source timezones, ambiguity, failures and conflicting records', async () => {
    for (const [query, zone, matches, status] of [
        ['Synthetic Sydney','Australia/Sydney',1,'available'],
        ['Synthetic Tromso','Europe/Oslo',1,'available'],
        ['Synthetic Ambiguous','Europe/London',2,'available'],
        ['Synthetic Provider Outage',undefined,0,'unavailable'],
        ['Synthetic Source Conflict',undefined,0,'unavailable'],
    ] as const) {
        const server = await createFixtureServer(mkdtempSync(join(tmpdir(),'nightsky-api-cases-')), {mode:'api'});
        try {
            const response = await server.rpc('tools/call', {name:'resolve_place',arguments:{placeQuery:query}});
            const result = response.result.structuredContent;
            assert.equal(result.availability.status, status, query);
            assert.equal(result.matches.length, matches, query);
            if(zone) assert.equal(result.matches[0].timeZone, zone);
            if(matches===2) assert.equal(result.selectionRequired, true);
            if(status==='unavailable') assert.ok(result.sourceAttempts.some((s:{status:string})=>['unavailable','invalid-response'].includes(s.status)));
            assert.equal(server.externalAttempts(),0);
        } finally { await server.close(); }
    }
});
