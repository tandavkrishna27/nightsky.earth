import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { PROVIDER_QUOTA_POLICIES, parseWeatherConfiguration } from '../../server/providers/weather/configuration';
import { SEVENTIMER_QUOTA_POLICY } from '../../server/providers/weather/sevenTimer';
import { SKY_QUOTA_POLICIES, parseSkyConfiguration } from '../../server/providers/skyConfiguration';
import { LIGHT_POLLUTION_QUOTA_POLICIES, parseLightPollutionConfiguration } from '../../server/providers/lightPollution/configuration';
import { PUBLIC_UNIVERSE_QUOTA_POLICY } from '../../server/providers/publicUniverse/configuration';

const profilePath = 'docs/operations/v1-api-source-profile-20261018.json';
test('V1 source profile pins actual operator ceilings without granting production admission', () => {
 const profile = JSON.parse(readFileSync(profilePath, 'utf8'));
 assert.equal(profile.schemaVersion, 1);
 assert.equal(profile.discoveryMode, 'api');
 assert.equal(profile.appliedToRuntime, false);
 assert.equal(profile.privateConfigurationInspected, false);
 assert.equal(profile.providerRequestsMade, 0);
 const ids = ['geonames','geoapify','met','weatherapi','openweather','seventimer','darkskyplanner','astronomyapi','nasa-donki','jpl','publicuniverse','darkskysites','noaa-swpc','openmeteo-history','lightpollutionmap-browser'];
 assert.deepEqual(profile.sources.map((row: {id: string}) => row.id).sort(), ids.sort());
 const policies = [...PROVIDER_QUOTA_POLICIES,SEVENTIMER_QUOTA_POLICY,...SKY_QUOTA_POLICIES,PUBLIC_UNIVERSE_QUOTA_POLICY,...LIGHT_POLLUTION_QUOTA_POLICIES];
 for (const policy of policies) {
  const row = profile.sources.find((row: {id: string}) => row.id === policy.providerId);
  assert.ok(row, policy.providerId);
  assert.deepEqual(row.operatorQuota, policy, policy.providerId);
 }
 for (const row of profile.sources) {
  assert.equal(row.productionAdmission, 'not-granted-by-profile');
  assert.ok(['proposed-core','optional-gated','operator-preparation','blocked-experimental'].includes(row.disposition), row.id);
  assert.ok(row.activationGates.length > 0, row.id);
  assert.ok(row.limitations.length > 0, row.id);
  for (const path of row.evidence) assert.ok(existsSync(path), `${row.id}: ${path}`);
 }
 assert.equal(profile.sources.find((row: {id: string}) => row.id === 'lightpollutionmap-browser').disposition, 'blocked-experimental');
 assert.equal(profile.sources.find((row: {id: string}) => row.id === 'astronomyapi').disposition, 'optional-gated');
 assert.equal(profile.sources.find((row: {id: string}) => row.id === 'geonames').apiTimeZoneEvidence, 'unknown');
 const sevenTimer = profile.sources.find((row: {id: string}) => row.id === 'seventimer');
 assert.ok(sevenTimer.activationGates.some((gate: string) => gate.includes('free or paid software')));
 assert.ok(!sevenTimer.activationGates.some((gate: string) => gate.startsWith('Noncommercial phase only')));
});

test('empty configuration and keys alone do not select optional source integrations', () => {
 assert.equal(parseWeatherConfiguration({}).providers, undefined);
 assert.deepEqual(parseSkyConfiguration({}).selected, []);
 assert.deepEqual(parseLightPollutionConfiguration({}).selected, []);
 const weather = parseWeatherConfiguration({ NIGHTSKY_WEATHERAPI_KEY: 'fixture-not-a-key', NIGHTSKY_OPENWEATHER_KEY: 'fixture-not-a-key' });
 assert.equal(weather.providers, undefined);
 assert.deepEqual(weather.admitted, []);
 assert.deepEqual(parseSkyConfiguration({ NIGHTSKY_ASTRONOMY_API_APP_ID:'fixture', NIGHTSKY_ASTRONOMY_API_APP_SECRET:'fixture', NIGHTSKY_NASA_API_KEY:'fixture' }).selected, []);
 assert.deepEqual(parseLightPollutionConfiguration({ NIGHTSKY_DARKSKYSITES_API_KEY:'fixture' }).selected, []);
 assert.throws(() => parseWeatherConfiguration({ NIGHTSKY_WEATHER_ADMITTED_PROVIDERS:'weatherapi' }));
 assert.throws(() => parseSkyConfiguration({ NIGHTSKY_SKY_ADMITTED_PROVIDERS:'publicuniverse' }));
 assert.throws(() => parseLightPollutionConfiguration({ NIGHTSKY_LIGHT_POLLUTION_API_ADMITTED:'darkskysites' }));
});
