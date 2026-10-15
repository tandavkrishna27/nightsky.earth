import test from 'node:test';
import assert from 'node:assert/strict';
import { climateArtifactConfiguration, selectConfiguredClimateProvider } from '../../server/providers/climate/configuration';
import { GeoNamesPlaceIndex } from '../../server/places/geonames';

test('explicit historical release selection uses the paired names and normalizes only its digest', () => {
  assert.deepEqual(climateArtifactConfiguration({NIGHTSKY_ERA5_RELEASE_MANIFEST:'/release/manifest.json',NIGHTSKY_ERA5_RELEASE_SHA256:'A'.repeat(64)}), {format:'release',artifactPath:'/release/manifest.json',expectedSha256:'a'.repeat(64)});
  assert.deepEqual(climateArtifactConfiguration({}), {format:'auto',artifactPath:undefined,expectedSha256:undefined});
  assert.deepEqual(climateArtifactConfiguration({NIGHTSKY_CLIMATE_ARTIFACT:'legacy.json'}), {format:'auto',artifactPath:'legacy.json',expectedSha256:undefined});
});

test('partial, malformed and conflicting explicit historical release settings fail closed without values', () => {
  for (const env of [
    {NIGHTSKY_ERA5_RELEASE_MANIFEST:'/private/example'},
    {NIGHTSKY_ERA5_RELEASE_SHA256:'a'.repeat(64)},
    {NIGHTSKY_ERA5_RELEASE_MANIFEST:'',NIGHTSKY_ERA5_RELEASE_SHA256:'a'.repeat(64)},
    {NIGHTSKY_ERA5_RELEASE_MANIFEST:'/private/example',NIGHTSKY_ERA5_RELEASE_SHA256:'wrong'},
    ...['NIGHTSKY_CLIMATE_ARTIFACT','NIGHTSKY_CLIMATE_SHA256'].map(key=>({NIGHTSKY_ERA5_RELEASE_MANIFEST:'/private/example',NIGHTSKY_ERA5_RELEASE_SHA256:'a'.repeat(64),[key]:''})),
  ]) {
    assert.throws(()=>climateArtifactConfiguration(env), error=>error instanceof Error && error.message==='Invalid historical release configuration.');
  }
});

test('unconfigured and absent release artifacts remain unknown without fetching providers', async () => {
  const index=new GeoNamesPlaceIndex([[1,'Fixture','Fixture','',0,0,'GB','Fixture',0,'UTC']],'fixture');
  for(const env of [{},{NIGHTSKY_ERA5_RELEASE_MANIFEST:'not-installed.json',NIGHTSKY_ERA5_RELEASE_SHA256:'a'.repeat(64)}]) {
    const result=await selectConfiguredClimateProvider(index,env).getClimatology('place:v1:geonames:1',1);
    assert.notEqual(result.availability.status,'available');
  }
});
