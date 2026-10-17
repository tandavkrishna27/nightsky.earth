import assert from 'node:assert/strict';
import test from 'node:test';
import { mkdtemp, access, readdir } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import * as plugin from '../../server/plugin';
import { operatorConfigSchema, operatorPreflight } from '../../shared/nightsky/operator';
import { readFileSync } from 'node:fs';
const admission = JSON.stringify({ sourceId: 'open-meteo-hosted-era5-cloud-percent-v1', methodVersion: 'open-meteo-quantized-dark-cloud-v1', policyRevision: 'a'.repeat(64), acceptsQuantizationAndUnverifiedRevision: true });
const settings = (directory: string) => ({ NIGHTSKY_DISCOVERY_MODE: 'api', NIGHTSKY_API_HISTORY_CACHE_DIRECTORY: directory, NIGHTSKY_API_HISTORY_ADMISSION: admission });

test('history runtime contract requires paired strict admission, API mode and no legacy climate source', () => {
  const parse = (plugin as any).pluginApiHistoryConfiguration;
  assert.equal(typeof parse, 'function');
  assert.equal(parse({}), undefined);
  assert.ok(parse(settings(join(tmpdir(), 'history-contract'))));
  for (const change of [
    { NIGHTSKY_DISCOVERY_MODE: 'legacy' }, { NIGHTSKY_API_HISTORY_ADMISSION: undefined },
    { NIGHTSKY_API_HISTORY_CACHE_DIRECTORY: 'relative' }, { NIGHTSKY_API_HISTORY_ADMISSION: '{}' },
    { NIGHTSKY_API_HISTORY_ADMISSION: admission.replace('true', 'false') },
    { NIGHTSKY_API_HISTORY_ADMISSION: admission.slice(0, -1) + ',"extra":true}' },
    { NIGHTSKY_API_HISTORY_ADMISSION: ' '.repeat(2049) },
    ...['NIGHTSKY_CLIMATE_ARTIFACT','NIGHTSKY_CLIMATE_SHA256','NIGHTSKY_ERA5_RELEASE_MANIFEST','NIGHTSKY_ERA5_RELEASE_SHA256'].map(key => ({ [key]: 'configured' })),
  ]) assert.throws(() => parse({ ...settings(join(tmpdir(), 'history-contract')), ...change }));
});

test('configured API app creates only explicitly configured history store and rejects conflicts before side effects', async () => {
  const root = await mkdtemp(join(tmpdir(), 'history-runtime-'));
  const keys = Object.keys(process.env).filter(k => k.startsWith('NIGHTSKY_') || ['MET_NORWAY_USER_AGENT'].includes(k));
  const saved = Object.fromEntries(keys.map(k => [k, process.env[k]]));
  const clear = () => { for (const k of Object.keys(process.env)) if (k.startsWith('NIGHTSKY_') || k === 'MET_NORWAY_USER_AGENT') delete process.env[k]; };
  const forbidden = async (): Promise<never> => { throw Error('No network in runtime configuration test'); };
  try {
    clear(); process.env.NIGHTSKY_DISCOVERY_MODE = 'api';
    const absent = await plugin.createConfiguredNightSkyPluginApp({ fetcher: forbidden, log: () => {} });
    await plugin.closeConfiguredNightSkyPluginApp(absent);
    assert.deepEqual(await readdir(root), []);
    Object.assign(process.env, settings(join(root, 'cache')));
    const app = await plugin.createConfiguredNightSkyPluginApp({ fetcher: forbidden, log: () => {} });
    await plugin.closeConfiguredNightSkyPluginApp(app);
    await access(join(root, 'cache'));
    process.env.NIGHTSKY_QUOTA_STATE_PATH = join(root, 'must-not-open-quota.json');
    for (const mode of ['legacy', 'api']) {
      Object.assign(process.env, settings(join(root, 'must-not-create')), { NIGHTSKY_DISCOVERY_MODE: mode });
      if (mode === 'api') process.env.NIGHTSKY_CLIMATE_ARTIFACT = 'legacy';
      await assert.rejects(plugin.createConfiguredNightSkyPluginApp({ fetcher: forbidden, log: () => {} }), /history/i);
      await assert.rejects(access(join(root, 'must-not-create')));
      assert.deepEqual(await readdir(root), ['cache'], 'Rejected history must not open quota state or locks');
      delete process.env.NIGHTSKY_CLIMATE_ARTIFACT;
    }
  } finally { clear(); Object.assign(process.env, saved); }
});

test('operator accepts strict history settings while retaining admission and resource validation gates', async () => {
  const config = JSON.parse(readFileSync('config/plugin-operator.example.json', 'utf8'));
  Object.assign(config.runtimeEnvironment, settings(join(tmpdir(), 'operator-history-fixture')));
  assert.equal(operatorConfigSchema.safeParse(config).success, true);
  const result = await operatorPreflight(config, '.');
  assert.equal(result.deploymentReady, false);
  assert.ok(result.findings.includes('API_HISTORY_ADMISSION_RESOURCE_VALIDATION_PENDING'));
  delete config.runtimeEnvironment.NIGHTSKY_API_HISTORY_ADMISSION;
  assert.ok((await operatorPreflight(config, '.')).findings.includes('RUNTIME_CONTRACT_INVALID'));
});
