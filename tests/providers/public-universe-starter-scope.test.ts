import test from 'node:test';
import assert from 'node:assert/strict';
import { createPublicUniverseProvider } from '../../server/providers/publicUniverse';
import { parseSkyConfiguration } from '../../server/providers/skyConfiguration';
import {syntheticNight, syntheticMethod} from '../fixtures/public-universe/synthetic';

const quota = { reserve: async () => ({ allowed: true, reason: 'synthetic' }), setProviderState: async () => {} };
const reviewed = {
  source: 'bsc5p',
  snapshot_sha256: '7fe926d80b535f9422ca81f8f3fee1d6422de29adaecfbd2f14b1a93fe5134b9',
  upstream_sha256: 'b'.repeat(64),
  source_url: 'https://heasarc.gsfc.nasa.gov/FTP/heasarc/dbase/tdat_files/heasarc_bsc5p.tdat.gz',
  retrieved_at: '2026-10-18T12:00:00Z',
  license: 'NASA government-works; HEASARC free-use policy',
  license_url: 'https://heasarc.gsfc.nasa.gov/docs/heasarc/data_policy.html',
  attribution: 'Hoffleit and Warren (1991), Bright Star Catalog, 5th revised preliminary edition; NASA/GSFC HEASARC',
};
const star = { id: 'bsc5p:hr2491', name: 'Synthetic star', source: 'bsc5p', aliases: [], families: ['bright_star'], object_type: 'star', ra_deg: 1, dec_deg: 2, astrometry: { status: 'verified', frame: 'FK5', equinox: 'J2000', reference_epoch_jyear: 2000, observation_epoch_jyear: null, motion_model: 'static_catalogue_direction' } };

test('configured Public Universe admission requires explicit starter-only scope', () => {
  assert.throws(() => parseSkyConfiguration({ NIGHTSKY_SKY_PROVIDERS: 'publicuniverse', NIGHTSKY_SKY_ADMITTED_PROVIDERS: 'publicuniverse' }));
  assert.throws(() => parseSkyConfiguration({ NIGHTSKY_SKY_PROVIDERS: 'publicuniverse', NIGHTSKY_SKY_ADMITTED_PROVIDERS: 'publicuniverse', NIGHTSKY_PUBLICUNIVERSE_SCOPE: 'all' }));
  assert.equal(parseSkyConfiguration({ NIGHTSKY_SKY_PROVIDERS: 'publicuniverse', NIGHTSKY_SKY_ADMITTED_PROVIDERS: 'publicuniverse', NIGHTSKY_PUBLICUNIVERSE_SCOPE: 'starter-only' }).publicUniverseScope, 'starter-only');
});

test('starter-only scope denies unreviewed features before provider transport', async () => {
  let calls = 0;
  const provider = createPublicUniverseProvider({ quota, quotaOwner: 'synthetic', admitted: true, scope: 'starter-only', fetcher: async () => { calls++; throw Error('No dispatch allowed'); } });
  try {
    for (const domain of ['solar-system', 'exoplanets']) {
      const result = await provider.searchReferenceObjects({ domain, query: 'Mars' });
      assert.equal(result.status, 'unavailable');
      assert.equal(result.errorCode, 'unsupported-feature');
    }
    for (const input of [{ kind: 'meteor-shower', code: 'GEM' }, { kind: 'close-approaches', referenceId: 'forged', revision: 'a'.repeat(64), from: '2026-10-18', to: '2026-10-19' }]) {
      const result = await provider.getReferenceDetails(input);
      assert.equal(result.status, 'unavailable');
    }
    const solarPreference=await provider.discoverObservingTargets({placeId:'test',displayTimeZone:'UTC',localNightDate:'2026-10-18',window:{startUtc:'2026-10-18T18:00:00Z',endUtc:'2026-10-19T03:00:00Z'},equipment:'binocular',preference:'solar_system',shortlistLimit:3},{latitude:12.345,longitude:23.456});
    assert.equal(solarPreference.status,'unavailable');
    assert.equal(solarPreference.errorCode,'unsupported-feature');
    assert.equal(calls, 0);
  } finally { await provider.close(); }
});

test('starter-only search keeps reviewed credit and rejects changed lineage', async () => {
  let source = { ...reviewed };
  let calls = 0;
  const provider = createPublicUniverseProvider({ quota, quotaOwner: 'synthetic', admitted: true, scope: 'starter-only', fetcher: async () => {
    calls++;
    return Response.json({ available: true, results: [star], total: 1, limit: 10, offset: 0, sources: { bsc5p: source }, coverage: 'synthetic' });
  } });
  try {
    const good = await provider.searchReferenceObjects({ domain: 'starter-targets', query: 'Synthetic', limit: 10 });
    assert.equal(good.status, 'available', JSON.stringify(good));
    assert.equal(good.sources[0].attribution, reviewed.attribution);
    assert.equal(good.sources[0].licenceUrl, reviewed.license_url);
    source = { ...reviewed, snapshot_sha256: 'd'.repeat(64) };
    const changed = await provider.searchReferenceObjects({ domain: 'starter-targets', query: 'Changed', limit: 10 });
    assert.equal(changed.status, 'unavailable');
    assert.equal(changed.data, null);
    assert.equal(calls, 2);
  } finally { await provider.close(); }
});

test('starter-only rejects altered source URL, licence text and attribution', async () => {
  let source={...reviewed};
  let calls=0;
  const provider=createPublicUniverseProvider({quota,quotaOwner:'synthetic',admitted:true,scope:'starter-only',fetcher:async()=>{calls++;return Response.json({available:true,results:[star],total:1,limit:10,offset:0,sources:{bsc5p:source},coverage:'synthetic'});}});
  try {
    const changes=[
      {source_url:'https://example.org/other'},
      {license:'Public domain'},
      {license_url:'https://example.org/other-license'},
      {attribution:'NASA'},
    ];
    for(let i=0;i<changes.length;i++){
      source={...reviewed,...changes[i]};
      const result=await provider.searchReferenceObjects({domain:'starter-targets',query:`changed-${i}`,limit:10});
      assert.equal(result.status,'unavailable',JSON.stringify(result));
      assert.equal(result.data,null);
    }
    assert.equal(calls,changes.length);
  } finally {await provider.close();}
});

test('starter-only selected detail refuses changed or incomplete identity instead of returning an available record', async () => {
  let detail={...star,provenance:reviewed};
  let calls=0;
  const provider=createPublicUniverseProvider({quota,quotaOwner:'synthetic',admitted:true,scope:'starter-only',fetcher:async url=>{
    calls++;
    return Response.json(new URL(String(url)).searchParams.has('q')?{available:true,results:[star],total:1,limit:10,offset:0,sources:{bsc5p:reviewed},coverage:'synthetic'}:detail);
  }});
  try {
    const search=await provider.searchReferenceObjects({domain:'starter-targets',query:'Synthetic',limit:10});
    assert.equal(search.status,'available',JSON.stringify(search));
    const selection=search.data!.matches[0].selection!;
    const good=await provider.getReferenceDetails({kind:'selected-object',...selection,sections:[]});
    assert.equal(good.status,'available');
    assert.equal(good.data?.record?.remoteRevisionAssociation,'verified');
    detail={...star,astrometry:{...star.astrometry,frame:null},provenance:reviewed} as typeof detail;
    const changed=await provider.getReferenceDetails({kind:'selected-object',...selection,sections:[]});
    assert.equal(changed.status,'stale');
    assert.equal(changed.data,null);
    detail={...star,provenance:{...reviewed,snapshot_sha256:'d'.repeat(64)}};
    const changedSnapshot=await provider.getReferenceDetails({kind:'selected-object',...selection,sections:[]});
    assert.equal(changedSnapshot.status,'stale');
    assert.equal(changedSnapshot.data,null);
    assert.equal(calls,4);
  } finally {await provider.close();}
});

test('starter-only discovery omits unscreened solar-system target records', async () => {
  const startUtc='2026-10-18T18:00:00Z',endUtc='2026-10-19T03:00:00Z';
  const input={placeId:'test',displayTimeZone:'UTC',localNightDate:'2026-10-18',window:{startUtc,endUtc},equipment:'binocular',preference:'stars',shortlistLimit:3};
  const solar={id:'planet-saturn',name:'Saturn',status:'no_matching_window',windows:[],constraint_coverage:{scope:'selected_interval',start_utc:startUtc,end_utc:endUtc,altitude:'partial',darkness:'partial'},samples:[]};
  const payload={schema_version:1,request:{date:input.localNightDate,timezone:'UTC',lat:12.35,lon:23.46,min_altitude_deg:20,sun_altitude_deg:-12,min_moon_separation_deg:0,window_start_utc:startUtc,window_end_utc:endUtc,horizon_mask:null},discovery:{options:{equipment_mode:'binocular',preference:'stars',shortlist_limit:3,true_field_deg:null,max_catalogue_v_magnitude:null},scope:'Synthetic bounded sample',catalogue_records:1,solar_system_targets:1,unsupported_catalogue_records:0,coarse_step_seconds:1200,sample_count:73,incomplete_between_samples:true,coarse_matching_candidates:0,refined_candidates:0,selected_without_refined_window:0,brightness_excluded:0,unknown_or_non_v_brightness_excluded:0,ranking_policy:'Synthetic',limitations:[],source_snapshots:[],calculation:syntheticMethod.calculation,planner_calculation:syntheticMethod.calculation},candidates:[],plan:{...syntheticNight,targets:[solar]},method:syntheticMethod};
  const provider=createPublicUniverseProvider({quota,quotaOwner:'synthetic',admitted:true,scope:'starter-only',fetcher:async()=>Response.json(payload)});
  try {
    const result=await provider.discoverObservingTargets(input,{latitude:12.345,longitude:23.456});
    assert.equal(result.status,'available',JSON.stringify(result));
    assert.deepEqual(result.data?.targets,[]);
    assert.equal(JSON.stringify(result.data).includes('Saturn'),false);
  } finally {await provider.close();}
});
