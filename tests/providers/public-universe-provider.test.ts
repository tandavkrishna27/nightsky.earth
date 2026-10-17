import test from 'node:test';
import assert from 'node:assert/strict';
import { createPublicUniverseProvider } from '../../server/providers/publicUniverse/index';
import { syntheticNight, syntheticSource, syntheticMethod } from '../fixtures/public-universe/synthetic';
const quota = { reserve: async () => ({ allowed: true, reason: 'ok' }), setProviderState: async () => { } };
test('search issues fresh local refs on normalized cache hits and details retain successful base on section failure', async () => {
    let calls = 0,time=0;
    const provider = createPublicUniverseProvider({ quota, quotaOwner: 'test', admitted: true,now:()=>time, fetcher: async (url) => {
            calls++;
            const path = new URL(String(url)).pathname;
            if (path.endsWith('/search'))
                return new Response(JSON.stringify({ query: 'Mars', results: [{ id: 'mars', name: 'Mars', object_type: 'planet' }] }), { headers: { 'Cache-Control': 'max-age=7200' } });
            if (path.endsWith('/objects/mars'))
                return new Response(JSON.stringify({ id: 'mars', name: 'Mars', object_type: 'planet', sources: [], physical: { mass_kg: 6.4e23 } }));
            return new Response('{}', { status: 503 });
        } });
    const first = await provider.searchReferenceObjects({ domain: 'solar-system', query: 'Mars', limit: 10 });
    time+=3600001;
    const second = await provider.searchReferenceObjects({ domain: 'solar-system', query: 'Mars', limit: 10 });
    assert.equal(first.status, 'available');
    assert.equal(calls, 1);
    assert.notEqual(first.data!.matches[0].selection!.referenceId, second.data!.matches[0].selection!.referenceId);
    assert.equal(first.retrievedAt,second.retrievedAt);
    assert.equal((await provider.getReferenceDetails({kind:'selected-object',...first.data!.matches[0].selection!,sections:[]})).status,'stale');
    const detail = await provider.getReferenceDetails({ kind: 'selected-object', ...second.data!.matches[0].selection!, sections: ['rings'] });
    assert.equal(detail.status, 'partial');
    assert.equal(detail.data!.record!.measurements[0].unit, 'kg');
    assert.equal(detail.data!.sections[0].status, 'unavailable');
    assert.equal(calls, 3);
    await provider.close();
});
test('malformed upstream data is unavailable while malformed user input is invalid-input', async () => {
    const p = createPublicUniverseProvider({ quota, quotaOwner: 'test', admitted: true, fetcher: async () => new Response('{}') });
    assert.equal((await p.searchReferenceObjects({ domain: 'solar-system', query: 'Mars' })).errorCode, 'invalid-response');
    assert.equal((await p.searchReferenceObjects({ domain: 'bad', query: 'Mars' })).status, 'invalid-input');
    await p.close();
});
const starter = { id: 'bsc5p:hr2491', name: 'Synthetic', source: 'bsc5p', aliases: [], families: ['bright_star'], object_type: 'star', ra_deg: 1, dec_deg: 2, astrometry: { status: 'verified', frame: 'FK5', equinox: 'J2000', reference_epoch_jyear: 2000, observation_epoch_jyear: null, motion_model: 'static_catalogue_direction' } };
const search = { available: true, results: [starter], total: 1, limit: 10, offset: 0, sources: { bsc5p: syntheticSource }, coverage: 'synthetic' };
const base = { placeId: 'test', displayTimeZone: 'UTC', localNightDate: '2026-10-18', window: { startUtc: '2026-10-18T18:00:00Z', endUtc: '2026-10-19T03:00:00Z' } };
const coordinates = { latitude: 12.345, longitude: 23.456 };
const catalogue = { ...syntheticSource, appearance: { families: ['bright_star'], magnitude: null, magnitude_band: null, magnitude_flag: null, magnitude_code: null, major_axis_arcmin: null, minor_axis_arcmin: null }, input_coordinates: { ra_deg: 1, dec_deg: 2, frame: 'FK5', equinox: 'J2000', reference_epoch_jyear: 2000, observation_epoch_jyear: null }, motion_model: 'static_catalogue_direction', proper_motion_applied: false, frame_transform: 'synthetic', pm_ra_cosdec_arcsec_per_year: null, pm_dec_arcsec_per_year: null, distance_au: null, refraction: 'none', accuracy_note: 'Synthetic' };
const target = { id: starter.id, name: starter.name, catalogue, status: 'windows_found', windows: [{ start_utc: base.window.startUtc, end_utc: '2026-10-18T19:00:00Z' }], constraint_coverage: { scope: 'selected_interval', start_utc: base.window.startUtc, end_utc: base.window.endUtc, altitude: 'partial', darkness: 'partial' }, samples: ['17', '18', '19', '20', '21'].map(h => ({ time_utc: `2026-10-18T${h}:00:00Z`, altitude_deg: 30, azimuth_deg: 40 })) };
test('starter windows require same snapshot/frame/model, reduce only selected samples, never cache observing', async () => {
    let time = Date.now(), calls = 0;
    let night: any = { ...syntheticNight, targets: [target] };
    const p = createPublicUniverseProvider({ quota, quotaOwner: 'test', admitted: true, now: () => time, fetcher: async (url) => { calls++; return new Response(JSON.stringify(String(url).includes('/observing/night') ? night : search)); } });
    const found = await p.searchReferenceObjects({ domain: 'starter-targets', query: 'Synthetic' });
    assert.equal(found.status, 'available');
    assert.equal(found.data!.matches[0].sources[0].licence, 'Synthetic licence');
    const input = { ...base, targets: [found.data!.matches[0].selection!] };
    const first = await p.getCatalogueTargetWindows(input, coordinates);
    assert.equal(first.status, 'available', JSON.stringify(first));
    assert.equal(first.data!.targets[0].samples.length, 3);
    assert.equal(first.data!.targets[0].sampling.originalCount, 5);
    assert.equal(first.data!.targets[0].sampling.inWindowCount, 4);
    time += 8000;
    night = structuredClone(night);
    night.targets[0].catalogue.snapshot_sha256 = 'e'.repeat(64);
    assert.equal((await p.getCatalogueTargetWindows(input, coordinates)).status, 'stale');
    assert.equal(calls, 3);
    await p.close();
});
test('source changes stale detail selection; absent comparable tokens remain unverified', async () => {
    let source = syntheticSource;
    const p = createPublicUniverseProvider({ quota, quotaOwner: 'test', admitted: true, fetcher: async (url) => new Response(JSON.stringify(String(url).includes('?') ? search : { ...starter, provenance: source })) });
    const found = await p.searchReferenceObjects({ domain: 'starter-targets', query: 'Synthetic' });
    const input = { kind: 'selected-object', ...found.data!.matches[0].selection!, sections: [] };
    source = { ...syntheticSource, snapshot_sha256: 'f'.repeat(64) };
    assert.equal((await p.getReferenceDetails(input)).status, 'stale');
    await p.close();
});
test('meteor parameter sets retain order and explicit total/truncation', async () => {
    const payload = { iau_no: 1, code: 'PER', name: 'Synthetic', status_label: null, parent: null, parameter_sets: Array.from({ length: 21 }, (_, ad_no) => ({ iau_no: 1, ad_no, code: 'PER', name: 'Synthetic', source: 'Synthetic' })) };
    const p = createPublicUniverseProvider({ quota, quotaOwner: 'test', admitted: true, fetcher: async () => new Response(JSON.stringify(payload)) });
    const result = await p.getReferenceDetails({ kind: 'meteor-shower', code: 'PER' });
    assert.equal(result.status, 'available');
    assert.equal(result.data!.meteor!.totalParameterSets, 21);
    assert.equal(result.data!.meteor!.truncated, true);
    assert.equal(result.data!.meteor!.parameter_sets[19].ad_no, 19);
    await p.close();
});
test('exoplanet list retains transaction snapshot; details preserve signed errors, omit uncertain limit semantics', async () => {
    const row = { id: 'synthetic-b', name: 'Synthetic b', host_id: 'synthetic', source: 'Archive', source_url: 'https://example.org', retrieved_at: '2026-01-01', radius_earth: 2, mass_earth: 3, source_data: { pl_radeerr1: .2, pl_radeerr2: -.1, pl_radelim: 0, pl_rade_reflink: '<a>Paper</a>', pl_bmasselim: 1 } };
    const snapshot = { schema_version: 1, association: 'same-read-transaction', status: 'available', reason: null, catalogue_id: 'synthetic', build_identifier: 'build', hash_policy: 'synthetic' };
    const p = createPublicUniverseProvider({ quota, quotaOwner: 'test', admitted: true, fetcher: async (url) => new Response(JSON.stringify(String(url).includes('?') ? { available: true, results: [row], total: 1, limit: 10, offset: 0, has_more: false, catalogue_snapshot: snapshot } : row)) });
    const found = await p.searchReferenceObjects({ domain: 'exoplanets', query: 'Synthetic' });
    assert.equal(found.data!.catalogueSnapshot!.build_identifier, 'build');
    const result = await p.getReferenceDetails({ kind: 'selected-object', ...found.data!.matches[0].selection!, sections: [] });
    assert.equal(result.status, 'available');
    assert.equal(result.data!.record!.measurements[0].uncertaintyMinus, .1);
    assert.equal(result.data!.record!.measurements[0].reference, 'Paper');
    assert.equal(result.data!.record!.measurements.some(m => m.name === 'mass'), false);
    await p.close();
});
test('null discovery plan remains available incomplete screening and request binding survives normalization', async () => {
    const calculation = syntheticMethod.calculation;
    const payload = { schema_version: 1, request: { date: base.localNightDate, timezone: 'UTC', lat: 12.35, lon: 23.46, min_altitude_deg: 20, sun_altitude_deg: -12, min_moon_separation_deg: 0, window_start_utc: base.window.startUtc, window_end_utc: base.window.endUtc, horizon_mask: null }, discovery: { options: { equipment_mode: 'binocular', preference: 'stars', shortlist_limit: 3, true_field_deg: null, max_catalogue_v_magnitude: null }, scope: 'Synthetic bounded sample', catalogue_records: 1, solar_system_targets: 8, unsupported_catalogue_records: 1, coarse_step_seconds: 1200, sample_count: 73, incomplete_between_samples: true, coarse_matching_candidates: 0, refined_candidates: 0, selected_without_refined_window: 0, brightness_excluded: 0, unknown_or_non_v_brightness_excluded: 0, ranking_policy: 'Synthetic', limitations: [], source_snapshots: [], calculation, planner_calculation: calculation }, candidates: [], plan: null, method: syntheticMethod };
    const p = createPublicUniverseProvider({ quota, quotaOwner: 'test', admitted: true, fetcher: async () => new Response(JSON.stringify(payload)) });
    const result = await p.discoverObservingTargets({ ...base, equipment: 'binocular', preference: 'stars', shortlistLimit: 3 }, coordinates);
    assert.equal(result.status, 'available', JSON.stringify(result));
    assert.equal(result.data!.night, null);
    assert.equal(result.data!.discovery!.incomplete_between_samples, true);
    await p.close();
    const nonempty = {...payload,discovery:{...payload.discovery,coarse_matching_candidates:1,refined_candidates:1,source_snapshots:[syntheticSource]},candidates:[{id:starter.id,name:starter.name,aliases:[],appearance:catalogue.appearance,preference_reasons:['Synthetic preference'],field_context:'Synthetic field',coarse_matching_samples:1,sampled_peak_altitude_deg:30,brightness_status:'Synthetic V',refined_status:'windows_found'}],plan:{...syntheticNight,targets:[target]}};
    const p2=createPublicUniverseProvider({quota,quotaOwner:'test2',admitted:true,fetcher:async()=>new Response(JSON.stringify(nonempty))});
    const full=await p2.discoverObservingTargets({...base,equipment:'binocular',preference:'stars',shortlistLimit:3},coordinates);
    assert.equal(full.status,'available',JSON.stringify(full));assert.equal(full.data!.targets[0].preferenceReasons![0],'Synthetic preference');assert.equal(full.data!.targets[0].catalogue!.source,'bsc5p');assert.ok(full.data!.targets[0].record.selection);await p2.close();
});
test('default unadmitted provider and invalid/forged selections never dispatch', async () => {
    let calls = 0;
    const p = createPublicUniverseProvider({ quota, quotaOwner: 'test', admitted: false, fetcher: async () => { calls++; throw Error(); } });
    assert.equal((await p.searchReferenceObjects({ domain: 'solar-system', query: 'Mars', limit: 10 })).status, 'unavailable');
    assert.equal((await p.getReferenceDetails({ kind: 'selected-object', referenceId: 'forged', revision: 'a'.repeat(64), sections: [] })).status, 'stale');
    assert.equal(calls, 0);
    await p.close();
});
test('all section routes preserve explicit association, inline reuse, units and at most three dispatches', async () => {
    const paths: string[] = [];
    const payloads: Record<string, unknown> = { discovery: { object_id: 'mars', source: 'Synthetic', discovered_on: 'unknown' }, designations: { results: [{ designation: 'Synthetic designation', kind: 'name', source: 'Synthetic' }] }, moons: { results: [{ id: 'synthetic-moon', name: 'Synthetic moon', radius_km: 4, mass_kg: 5 }] }, rings: { results: [{ id: 1, name: 'Synthetic ring', inner_radius_km: 2, outer_radius_km: 3, width_km: 1, thickness_km: .1, notes: 'Synthetic' }] }, atmosphere: { object_id: 'mars', source: 'Synthetic', surface_pressure_bar: .01, composition: [{ species: 'CO2', fraction: 95, unit: '%' }] } };
    const p = createPublicUniverseProvider({ quota, quotaOwner: 'test', admitted: true, fetcher: async (url) => {
            const path = new URL(String(url)).pathname;
            paths.push(path);
            if (path.endsWith('/search'))
                return new Response(JSON.stringify({ query: 'Mars', results: [{ id: 'mars', name: 'Mars' }] }));
            if (path.endsWith('/objects/mars'))
                return new Response(JSON.stringify({ id: 'mars', name: 'Mars', object_type: 'planet', sources: [], discovery: payloads.discovery }));
            return new Response(JSON.stringify(payloads[path.split('/').at(-1)!]));
        } });
    const found = await p.searchReferenceObjects({ domain: 'solar-system', query: 'Mars' });
    const selection = found.data!.matches[0].selection!;
    let r = await p.getReferenceDetails({ kind: 'selected-object', ...selection, sections: ['discovery', 'designations'] });
    assert.equal(r.data!.sections[0].status, 'available');
    assert.equal(r.data!.sections[1].status, 'partial');
    assert.equal(paths.length, 3);
    assert.equal(paths.some(p => p.endsWith('/discovery')), false);
    r = await p.getReferenceDetails({ kind: 'selected-object', ...selection, sections: ['moons', 'rings'] });
    assert.equal(paths.length, 6);
    assert.equal(r.data!.sections[0].records[0].measurements[0].unit, 'kg');
    assert.equal(r.data!.sections[0].records[0].sources.length, 0);
    assert.ok(r.data!.sections[1].facts!.some(f => f.name === 'rings.width_km'));
    r = await p.getReferenceDetails({ kind: 'selected-object', ...selection, sections: ['atmosphere'] });
    assert.equal(r.data!.sections[0].status, 'available');
    assert.equal(r.data!.sections[0].facts!.find(f => f.name === 'composition.CO2')!.value, '95 %');
    await p.close();
});
test('close approaches bind selected exact id, dates and Earth; host detail maps bounded actual coordinate metadata', async () => {
    const row = { id: 'synthetic-b', name: 'Synthetic b', host_id: 'synthetic', source: 'Archive', source_url: 'https://example.org', retrieved_at: '2026-01-01', source_data: {} };
    const host = { id: 'synthetic', name: 'Synthetic host', source: 'Archive', retrieved_at: '2026-01-01', coordinate_source_planet: row.id, coordinate_metadata: { input: 'ICRS without proper motion', heliocentric: 'Synthetic', unit: 'pc', galactocentric: { galcen_distance_pc: 8000, z_sun_pc: 20, roll_deg: 0, galcen_ra_deg: 266, galcen_dec_deg: -29 }, astropy_version: 'synthetic' }, planets: [row] };
    const p = createPublicUniverseProvider({ quota, quotaOwner: 'test', admitted: true, fetcher: async (url) => {
            const u = new URL(String(url));
            if (u.pathname.endsWith('/search'))
                return new Response(JSON.stringify({ query: 'Mars', results: [{ id: 'mars', name: 'Mars' }] }));
            if (u.pathname.includes('/close-approaches')) {
                assert.equal(u.searchParams.get('body'), 'Earth');
                return new Response(JSON.stringify({ object: 'mars', results: [{ body: 'Earth', cd_jd: 2461332, cd_iso: '2026-10-18 12:00', dist_au: .1, v_rel_km_s: 2, source: 'Synthetic' }] }));
            }
            if (u.pathname.endsWith('/exoplanets'))
                return new Response(JSON.stringify({ available: true, results: [row], total: 1, limit: 10, offset: 0, has_more: false, catalogue_snapshot: { schema_version: 1, association: 'same-read-transaction', status: 'available', reason: null, catalogue_id: null, build_identifier: null, hash_policy: null } }));
            return new Response(JSON.stringify(host));
        } });
    const solar = await p.searchReferenceObjects({ domain: 'solar-system', query: 'Mars' });
    const ca = await p.getReferenceDetails({ kind: 'close-approaches', ...solar.data!.matches[0].selection!, from: '2026-10-18', to: '2026-10-19' });
    assert.equal(ca.status, 'available');
    assert.equal(ca.data!.closeApproaches![0].dist_au, .1);
    const exo = await p.searchReferenceObjects({ domain: 'exoplanets', query: 'Synthetic' });
    const h = await p.getReferenceDetails({ kind: 'exoplanet-host', ...exo.data!.matches[0].selection! });
    assert.equal(h.status, 'available', JSON.stringify(h));
    assert.equal(h.data!.host!.coordinateMetadata!.unit, 'pc');
    assert.equal(h.data!.host!.planets[0].upstreamId, row.id);
    await p.close();
});
test('detail sections share one deadline and retain successful base after deadline expires', async () => {
    let time = 0, calls = 0;
    const p = createPublicUniverseProvider({ quota, quotaOwner: 'test', admitted: true, now: () => time, fetcher: async (url) => {
            calls++;
            const path = new URL(String(url)).pathname;
            if (path.endsWith('/search'))
                return new Response(JSON.stringify({ query: 'Mars', results: [{ id: 'mars', name: 'Mars' }] }));
            if (path.endsWith('/objects/mars')) {
                time += 14000;
                return new Response(JSON.stringify({ id: 'mars', name: 'Mars', object_type: 'planet', sources: [] }));
            }
            time += 2000;
            return new Response(JSON.stringify({ results: [] }));
        } });
    const found = await p.searchReferenceObjects({ domain: 'solar-system', query: 'Mars' });
    const r = await p.getReferenceDetails({ kind: 'selected-object', ...found.data!.matches[0].selection!, sections: ['rings', 'moons'] });
    assert.equal(r.status, 'partial');
    assert.equal(r.data!.record!.upstreamId, 'mars');
    assert.equal(calls, 3);
    assert.equal(r.data!.sections.every(s => s.status === 'unavailable'), true);
    await p.close();
});
