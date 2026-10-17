import assert from 'node:assert/strict';
import test from 'node:test';
import { createRequire } from 'node:module';
import { GeoNamesPlaceIndex, GEONAMES_SOURCE } from '../../server/places/geonames';
import { getAstronomyWindow, getTargetVisibility } from '../../server/nightsky/astronomy';
import { searchSkyEvents } from '../../server/events/catalog';
import { planObservingSession, type PlannerServices } from '../../server/nightsky/planner';
import { compareObservingOptions } from '../../server/nightsky/compare';
import * as resolver from '../../server/places/calculationPlace';
import type { CalculationPlace, CatalogueReader, CandidateRef } from '../../shared/nightsky/discovery';
const A = createRequire(import.meta.url)('astronomy-engine');
const index = new GeoNamesPlaceIndex([[1,'London','London','',51.5,-0.12,'GB','United Kingdom',100,'Europe/London']], 'fixture');
const candidate: CandidateRef = { placeId:'place:v1:osm:node:7', name:'Southern viewpoint', category:'viewpoint', latitude:-33.9, longitude:151.2, catalogueRevision:'edition-1', accessEvidence:{status:'unknown'}, sources:[GEONAMES_SOURCE], caveats:[] };
const catalogue = { details: async (ref: {placeId:string;catalogueRevision:string}) => ref.placeId === candidate.placeId && ref.catalogueRevision === candidate.catalogueRevision ? candidate : undefined } as CatalogueReader;
const window = {startUtc:'2026-10-15T06:00:00Z',endUtc:'2026-10-15T18:00:00Z',timeZone:'Asia/Kolkata'};
const input = {placeId:candidate.placeId,catalogueRevision:'edition-1',displayTimeZone:window.timeZone};
const deps = {cities:index,catalogue};
async function point() { return resolver.resolveCalculationPlace(input,deps); }
function services(): PlannerServices { return { index, resolveCalculationPlace: value => resolver.resolveCalculationPlace(value,deps), getAstronomy:(p,w,c)=>getAstronomyWindow(p,w,index,c), getTargetVisibility:(p,t,w,c)=>getTargetVisibility(t,p,w,index,c), getNightConditions:async (id,w,c)=> { assert.equal(c?.latitude,-33.9); assert.equal(c?.longitude,151.2); return {availability:{status:'unavailable',reason:'Offline fixture'},sources:[GEONAMES_SOURCE],caveats:[],placeId:id,window:w,forecasts:[],nightContext:{darkness:{status:'unknown',reason:'Offline fixture'},forecastStepsDuringDarkness:[]}}; }, searchEvents:(id,w,c)=>searchSkyEvents({placeId:id,window:w,eventTypes:['moon-phase']},index,c), getLocationContext:async id=>({availability:{status:'unknown',reason:'Unknown'},sources:[GEONAMES_SOURCE],caveats:[],placeId:id,groundLightContext:{status:'unknown',reason:'Unknown'},access:{status:'unknown'}}) }; }
test('candidate point requires a fresh revision and explicit valid display zone',async()=>{
 assert.equal(typeof resolver.resolveCalculationPlace,'function');
 await assert.rejects(()=>resolver.resolveCalculationPlace({placeId:candidate.placeId,catalogueRevision:'edition-1'},deps),/display.*time.*zone|time.*zone.*display/i);
 await assert.rejects(()=>resolver.resolveCalculationPlace({...input,catalogueRevision:'old'},deps),/resolve.*again/i);
 await assert.rejects(()=>resolver.resolveCalculationPlace({...input,displayTimeZone:'invalid'},deps));
 const p=await point(); assert.equal(p.latitude,-33.9); assert.equal(p.timeZoneBasis,'explicit-display');
});
test('site lunar astronomy matches direct Astronomy Engine instead of London',async()=>{
 const p=await point(); const result=await getAstronomyWindow({placeId:p.placeId,timeZone:p.displayTimeZone},window,index,p);
 const observer=new A.Observer(-33.9,151.2,0); let max=-90;
 for(let t=Date.parse(window.startUtc);t<=Date.parse(window.endUtc);t+=900000){ const d=new Date(t); const e=A.Equator(A.Body.Moon,d,observer,true,true); max=Math.max(max,A.Horizon(d,observer,e.ra,e.dec).altitude); }
 assert.ok(Math.abs(result.moon.maximumAltitudeDegrees-max)<1e-9);
 const london=await getAstronomyWindow({placeId:'place:v1:geonames:1',timeZone:'Europe/London'},{...window,timeZone:'Europe/London'},index); assert.notEqual(result.moon.maximumAltitudeDegrees,london.moon.maximumAltitudeDegrees);
 await assert.rejects(()=>getAstronomyWindow({placeId:p.placeId,timeZone:p.displayTimeZone},{...window,timeZone:'UTC'},index,p),/time zone/i);
});
test('local moon event altitude uses selected site',async()=>{
 const p=await point(); const w={startUtc:'2026-10-01T00:00:00Z',endUtc:'2026-10-05T00:00:00Z',timeZone:p.displayTimeZone}; const result=await searchSkyEvents({placeId:p.placeId,window:w,eventTypes:['moon-phase']},index,p);
 assert.ok(result.events.length); for(const e of result.events){const d=new Date(e.peakUtc!);const o=new A.Observer(-33.9,151.2,0);const eq=A.Equator(A.Body.Moon,d,o,true,true);const alt=A.Horizon(d,o,eq.ra,eq.dec).altitude;assert.equal(e.localVisibility,alt>=0?'visible':'not-visible');}
});
test('planning and comparison retain candidate revision and private point propagation',async()=>{
 const option={...input,activity:'general-stargazing',window}; const result=await planObservingSession(option,services()); assert.equal(result.place.catalogueRevision,'edition-1'); assert.equal(result.place.timeZoneBasis,'explicit-display'); assert.equal(result.place.timeZone,'Asia/Kolkata'); assert.equal(result.evidence?.weather?.placeId,candidate.placeId); assert.ok(!('latitude' in result.place)); assert.ok(result.suggestions?.length); assert.equal(result.evidence?.location?.access.status,'unknown');
 const comparison=await compareObservingOptions({options:[option,{...option,displayTimeZone:'UTC',window:{...window,timeZone:'UTC'}}]},services()); assert.equal(comparison.comparisons[0].catalogueRevision,'edition-1');assert.equal(comparison.comparisons[1].displayTimeZone,'UTC');
});
test('named city keeps assigned timezone equality',async()=>{ const p=await resolver.resolveCalculationPlace({placeId:'place:v1:geonames:1'},deps); assert.equal(p.displayTimeZone,'Europe/London'); await assert.rejects(()=>resolver.resolveCalculationPlace({placeId:p.placeId,displayTimeZone:'UTC'},deps),/time zone/i); });


import { evaluateRadiant } from '../../server/events/meteorRadiants';
test('candidate plans label display timezone as unverified and radiant uses selected coordinates', async()=>{
 const meteorWindow={startUtc:'2026-08-12T06:00:00Z',endUtc:'2026-08-12T18:00:00Z',timeZone:'Asia/Kolkata'};
 const result=await planObservingSession({...input,window:meteorWindow,activity:'meteor-shower',target:'Perseids'},services());
 assert.ok(result.caveats.some(c=>/explicit.*display.*time zone.*unverified/i.test(c)));
 const samples=result.evidence?.meteorRadiantSamples!;assert.equal(samples.length,49);
 assert.equal(samples[0].evaluatedAt,'2026-08-12T06:00:00.000Z');
 assert.equal(samples.at(-1)!.evaluatedAt,'2026-08-12T18:00:00.000Z');
 for(const sample of samples) assert.deepEqual(sample,evaluateRadiant('PER',Date.parse(sample.evaluatedAt),{latitude:-33.9,longitude:151.2}));
});
test('candidate target visibility preserves geometry across display zones',async()=>{
 const p=await point();const a=await getTargetVisibility('Moon',{placeId:p.placeId,timeZone:p.displayTimeZone},window,index,p);
 const b=await getTargetVisibility('Moon',{placeId:p.placeId,timeZone:'UTC'},{...window,timeZone:'UTC'},index,{...p,displayTimeZone:'UTC'});
 assert.ok(a.intervals.length);assert.deepEqual(a.intervals.map(({localStart,localEnd,maximumAltitudeLocal,...geometry})=>geometry),b.intervals.map(({localStart,localEnd,maximumAltitudeLocal,...geometry})=>geometry));assert.notEqual(a.intervals[0].localStart,b.intervals[0].localStart);assert.notEqual(a.intervals[0].maximumAltitudeLocal,b.intervals[0].maximumAltitudeLocal);
});
test('comparison stale candidate preserves a clear resolve again explanation',async()=>{
 const option={...input,activity:'moon-observing',window};const result=await compareObservingOptions({options:[option,{...option,catalogueRevision:'old'}]},services());assert.equal(result.comparisons[1].availability?.status,'unavailable');assert.match(result.comparisons[1].summary,/resolve.*again/i);assert.equal(result.comparisons[1].catalogueRevision,'old');
});
test('event seam rejects mismatched candidate revision or display choice',async()=>{const p=await point();await assert.rejects(()=>searchSkyEvents({...input,catalogueRevision:'old',window,eventTypes:['moon-phase']},index,p),/revision|resolve.*again/i);await assert.rejects(()=>searchSkyEvents({...input,displayTimeZone:'UTC',window,eventTypes:['moon-phase']},index,p),/time zone/i);});
test('candidate history remains not covered without a city history substitution',async()=>{
 const s=services();s.getClimatology=async(id,month,p)=>({availability:{status:'not-covered',reason:'No selected-point history is installed'},sources:[{...GEONAMES_SOURCE,dataClass:'reanalysis'}],caveats:[],schemaVersion:2,placeId:id,month,timeZone:p!.displayTimeZone,dataClass:'reanalysis',historicalLabel:'historical-not-a-forecast',methodVersion:'dark-cloud-v1',sampleDefinition:'hourly-dark-time-samples',unit:'fraction',period:{startNight:'2025-01-01',endNight:'2025-12-31',kind:'sample-only'}});
 const result=await planObservingSession({...input,activity:'general-stargazing',window},s);assert.equal(result.evidence?.history?.availability.status,'not-covered');assert.equal(result.evidence?.history?.placeId,candidate.placeId);assert.equal(result.evidence?.history?.summary,undefined);assert.ok(result.gaps.some(g=>/not-covered|historical/i.test(g)));
});
test('standalone astronomy and events label candidate timezone as a display choice',async()=>{const p=await point();const a=await getAstronomyWindow({placeId:p.placeId,timeZone:p.displayTimeZone},window,index,p);const e=await searchSkyEvents({...input,window,eventTypes:['moon-phase']},index,p);assert.ok(a.caveats.some(c=>/explicit.*display.*unverified/i.test(c)));assert.ok(e.caveats.some(c=>/explicit.*display.*unverified/i.test(c)));});
async function realCatalogue(){const {mkdtemp}=await import('node:fs/promises');const {tmpdir}=await import('node:os');const {join}=await import('node:path');const {buildGlobalCatalogue}=await import('../../scripts/osm/build-global-catalogue');const {loadCatalogueFiles}=await import('../../server/places/catalogueFiles');const {createGlobalCatalogue}=await import('../../server/places/globalCatalogue');const dir=await mkdtemp(join(tmpdir(),'candidate-real-catalogue-'));const built=await buildGlobalCatalogue({catalogueRevision:'edition-1',candidates:[{...candidate,sourceCompleteness:1,regionIds:[]}],regions:[],footprints:[]},dir);return createGlobalCatalogue(await loadCatalogueFiles(built.path,{expectedSha256:built.sha256}),{cities:index});}
test('real catalogue stale revision becomes typed resolve-again clarification',async()=>{const real=await realCatalogue();await assert.rejects(resolver.resolveCalculationPlace({...input,catalogueRevision:'old'},{cities:index,catalogue:real}),error=>error instanceof resolver.CalculationPlaceClarificationError&&error.code==='resolve-again');const s=services();s.resolveCalculationPlace=value=>resolver.resolveCalculationPlace(value,{cities:index,catalogue:real});const result=await compareObservingOptions({options:[{...input,activity:'moon-observing',window},{...input,catalogueRevision:'old',activity:'moon-observing',window}]},s);assert.match(result.comparisons[1].summary,/resolve.*again/i);});
test('operational catalogue failure preserves its exact error',async()=>{const failure=new Error('Pinned catalogue integrity failure');const failing={...catalogue,details:async()=>{throw failure;}};await assert.rejects(resolver.resolveCalculationPlace(input,{cities:index,catalogue:failing}),error=>error===failure);});
