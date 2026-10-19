import test from 'node:test';
import assert from 'node:assert/strict';
import {validateApiSourceManifest} from '../../server/operations/apiSourceManifest';
const release=()=>({environment:{},discoveryProviders:['geoapify'],evidence:{geoapify:['retained-selection-credit-record'],met:['credit/contact/cache record'],'noaa-swpc':['source/validity record'],'astronomy-engine':['finite calculation/credit record']}});
const fixture=()=>({schemaVersion:1,current:release(),rollback:release()});
test('source manifest accepts offline declarations and independently validates rollback',()=>{assert.ok(validateApiSourceManifest(fixture()));const m=fixture();m.rollback.discoveryProviders.push('geoapify');assert.throws(()=>validateApiSourceManifest(m));});
test('source manifest refuses secrets unknown flags and unresolved branches',()=>{
 for(const environment of [{NIGHTSKY_OPENWEATHER_KEY:'not-a-real-key'},{NIGHTSKY_SKY_PROVIDERS:'publicuniverse',NIGHTSKY_SKY_ADMITTED_PROVIDERS:'publicuniverse'},{NIGHTSKY_LIGHT_POLLUTION_BROWSER_ENABLED:'true'},{NIGHTSKY_LIGHT_POLLUTION_SOURCES:'lightpollutionmap'},{NIGHTSKY_GEOMETRY_ENABLED:'yes'},{NIGHTSKY_WEATHER_PROVIDERS:'openweather',NIGHTSKY_WEATHER_ADMITTED_PROVIDERS:'openweather'}]){const m=fixture();m.current.environment=environment;assert.throws(()=>validateApiSourceManifest(m));}
});
test('source manifest requires actual parser correspondence and geometry evidence',()=>{const m=fixture();m.current.environment={NIGHTSKY_GEOMETRY_ENABLED:'yes',NIGHTSKY_GEOMETRY_SOURCE_ACCEPTED:'yes'};assert.throws(()=>validateApiSourceManifest(m));Object.assign(m.current.evidence,{'geoapify-geometry':['selected details/full geometry and credit acceptance']});assert.ok(validateApiSourceManifest(m));});

test('source manifest refuses missing default sources and ledger aliases',()=>{const m=fixture();delete (m.current.evidence as Record<string,string[]>).met;assert.throws(()=>validateApiSourceManifest(m));const n=fixture();n.current.environment={NIGHTSKY_QUOTA_STATE_PATH:'C:\\quota\\state.json',NIGHTSKY_SKY_QUOTA_STATE_PATH:'c:\\quota\\x\\..\\STATE.json'};assert.throws(()=>validateApiSourceManifest(n));});

test('starter-only Public Universe manifest requires reviewed evidence and a distinct quota path',()=>{
 const m=fixture();
 m.current.environment={NIGHTSKY_SKY_PROVIDERS:'publicuniverse',NIGHTSKY_SKY_ADMITTED_PROVIDERS:'publicuniverse',NIGHTSKY_PUBLICUNIVERSE_SCOPE:'starter-only'};
 assert.throws(()=>validateApiSourceManifest(m));
 m.current.environment.NIGHTSKY_PUBLICUNIVERSE_QUOTA_STATE_PATH='C:\\quota\\public-universe.json';
 assert.throws(()=>validateApiSourceManifest(m));
 m.current.evidence['publicuniverse-starter-targets']=['BSC5P/OpenNGC reviewed lineage, original-source credits and rendered notice acceptance'];
 assert.ok(validateApiSourceManifest(m));
 m.current.environment.NIGHTSKY_QUOTA_STATE_PATH='c:\\QUOTA\\public-universe.json';
 assert.throws(()=>validateApiSourceManifest(m));
});
