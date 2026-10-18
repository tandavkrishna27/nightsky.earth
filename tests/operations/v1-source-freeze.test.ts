import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync, existsSync} from 'node:fs';
import {isAbsolute, join} from 'node:path';
import {tmpdir} from 'node:os';
import {validateApiSourceManifest} from '../../server/operations/apiSourceManifest';
import {parseWeatherConfiguration} from '../../server/providers/weather/configuration';
import {parseSkyConfiguration} from '../../server/providers/skyConfiguration';
import {parseLightPollutionConfiguration} from '../../server/providers/lightPollution/configuration';

const read=(name:string)=>JSON.parse(readFileSync(`docs/operations/${name}`, 'utf8'));
// Translate documented synthetic examples only; never open or initialize a ledger.
const nativeDeclaration=(input:any)=>{
 const result=structuredClone(input);
 const paths=new Map([
  ['C:/nightsky-declaration-fixture/general-existing.json',join(tmpdir(),'nightsky-declaration-fixture','general-existing.json')],
  ['C:/nightsky-declaration-fixture/darkskysites-existing.json',join(tmpdir(),'nightsky-declaration-fixture','darkskysites-existing.json')],
 ]);
 for(const release of [result.current,result.rollback])for(const key of ['NIGHTSKY_QUOTA_STATE_PATH','NIGHTSKY_LIGHT_POLLUTION_QUOTA_STATE_PATH']){
  const raw=release.environment[key];
  if(raw!==undefined){assert.ok(paths.has(raw),'only known synthetic fixture scopes may be materialized');release.environment[key]=paths.get(raw);}
 }
 return result;
};
test('declaration fixture materializes only synthetic ledger paths with portable shared and dedicated scopes',()=>{
 const raw=read('v1-source-declaration-fixture-20261019.json');
 const before=structuredClone(raw),native=nativeDeclaration(raw);
 const general=join(tmpdir(),'nightsky-declaration-fixture','general-existing.json');
 const dedicated=join(tmpdir(),'nightsky-declaration-fixture','darkskysites-existing.json');
 assert.equal(native.current.environment.NIGHTSKY_QUOTA_STATE_PATH,general);
 assert.equal(native.rollback.environment.NIGHTSKY_QUOTA_STATE_PATH,general);
 assert.equal(native.current.environment.NIGHTSKY_LIGHT_POLLUTION_QUOTA_STATE_PATH,dedicated);
 assert.ok(isAbsolute(general)&&isAbsolute(dedicated));
 assert.notEqual(general,dedicated);
 const restored=structuredClone(native);
 for(const release of ['current','rollback'])for(const key of ['NIGHTSKY_QUOTA_STATE_PATH','NIGHTSKY_LIGHT_POLLUTION_QUOTA_STATE_PATH']){
  if(key in raw[release].environment)restored[release].environment[key]=raw[release].environment[key];
 }
 assert.deepEqual(restored,before,'all non-path fields remain exact');
 assert.deepEqual(raw,before,'raw documented examples remain unchanged');
 const aliased=structuredClone(native);
 aliased.current.environment.NIGHTSKY_LIGHT_POLLUTION_QUOTA_STATE_PATH=general;
 assert.throws(()=>validateApiSourceManifest(aliased),'dedicated scope cannot alias shared account scope');
});
test('frozen V1 intent preserves core breadth, exact existing ceilings and separate external gates',()=>{
 const freeze=read('v1-source-freeze-20261019.json');
 const inventory=read('v1-api-source-profile-20261018.json');
 assert.equal(freeze.appliedToRuntime,false);
 assert.equal(freeze.accountOrHostEntitlementVerified,false);
 assert.equal(freeze.providerRequestsMade,0);
 assert.deepEqual(freeze.intendedCore,['geoapify','met','weatherapi','openweather','darkskysites','noaa-swpc','astronomy-engine']);
 assert.deepEqual(freeze.retainedProposedEnrichment,['publicuniverse']);
 assert.equal(freeze.history,'unavailable');
 assert.equal(freeze.geometry,'disabled-pending-selected-source-acceptance');
 assert.equal(freeze.events,'supported-with-explicit-coverage-gaps-all-19-identities');
 assert.deepEqual(freeze.sources.map((r:any)=>r.id).sort(),inventory.sources.map((r:any)=>r.id).sort());
 for(const row of freeze.sources){
  assert.deepEqual(row.operatorQuota,inventory.sources.find((r:any)=>r.id===row.id).operatorQuota,row.id);
  assert.ok(row.creditContract.length>0,row.id);
  assert.ok(row.externalAcceptance.length>0,row.id);
 }
 assert.deepEqual(freeze.optionalUnadmitted,['geonames','seventimer','darkskyplanner','astronomyapi','nasa-donki','jpl','publicuniverse']);
});
test('frozen current and rollback declarations validate offline without activation evidence',()=>{
 const input=nativeDeclaration(read('v1-source-declaration-fixture-20261019.json'));
 const manifest=validateApiSourceManifest(input);
 assert.deepEqual(manifest.current.discoveryProviders,['geoapify']);
 assert.deepEqual(parseWeatherConfiguration(manifest.current.environment).providers,['met','weatherapi','openweather']);
 assert.deepEqual(parseWeatherConfiguration(manifest.current.environment).admitted,['weatherapi','openweather']);
 assert.deepEqual(parseLightPollutionConfiguration(manifest.current.environment).admitted,['darkskysites']);
 assert.deepEqual(parseSkyConfiguration(manifest.current.environment).selected,[]);
 assert.deepEqual(parseWeatherConfiguration(manifest.rollback.environment).providers,['met']);
 assert.deepEqual(parseWeatherConfiguration(manifest.rollback.environment).admitted,[]);
 assert.deepEqual(parseLightPollutionConfiguration(manifest.rollback.environment).selected,[]);
 for(const release of [manifest.current,manifest.rollback]){
  assert.equal(release.environment.NIGHTSKY_GEOMETRY_ENABLED,'no');
  assert.equal(release.environment.NIGHTSKY_GEOMETRY_SOURCE_ACCEPTED,'no');
  for(const refs of Object.values(release.evidence))for(const ref of refs)assert.ok(existsSync(ref),ref);
 }
 assert.equal(manifest.current.environment.NIGHTSKY_QUOTA_STATE_PATH,manifest.rollback.environment.NIGHTSKY_QUOTA_STATE_PATH);
 const unresolved=structuredClone(input);
 unresolved.current.environment.NIGHTSKY_SKY_PROVIDERS='publicuniverse';
 unresolved.current.environment.NIGHTSKY_SKY_ADMITTED_PROVIDERS='publicuniverse';
 assert.throws(()=>validateApiSourceManifest(unresolved));
 const brokenRollback=structuredClone(input);
 delete brokenRollback.rollback.evidence.met;
 assert.throws(()=>validateApiSourceManifest(brokenRollback));
});
