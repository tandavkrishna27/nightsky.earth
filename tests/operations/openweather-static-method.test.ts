import assert from 'node:assert/strict';
import test from 'node:test';
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { methodSource, stageOpenWeatherMethod } from '../../scripts/stage-openweather-method.mjs';

test('website stages the exact reviewed OpenWeather alteration method', async () => {
  const directory = await mkdtemp(join(tmpdir(), 'openweather-method-'));
  try {
    const output = join(directory, 'openweather-normalization-method.json');
    const bytes = await stageOpenWeatherMethod(methodSource, output);
    const source = await readFile(methodSource);
    assert.equal(bytes, source.byteLength);
    assert.deepEqual(await readFile(output), source);
    const method = JSON.parse((await readFile(output)).toString('utf8'));
    assert.equal(method.source.endpoint, 'https://api.openweathermap.org/data/2.5/forecast');
  } finally { await rm(directory, { recursive: true, force: true }); }
});

test('website staging rejects a different provider method', async () => {
  const directory = await mkdtemp(join(tmpdir(), 'openweather-invalid-method-'));
  try {
    const source = join(directory, 'source.json');
    const output = join(directory, 'openweather-normalization-method.json');
    await writeFile(source, '{"schemaVersion":1,"source":{"endpoint":"https://example.test/other"}}');
    await assert.rejects(stageOpenWeatherMethod(source, output), /identity/);
    await assert.rejects(readFile(output), { code: 'ENOENT' });
  } finally { await rm(directory, { recursive: true, force: true }); }
});
