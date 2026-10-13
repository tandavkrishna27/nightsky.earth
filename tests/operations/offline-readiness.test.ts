import assert from 'node:assert/strict';
import test from 'node:test';
import { unzipSync, strToU8 } from 'fflate';
import { buildPluginPackage, validatePackageFiles } from '../../scripts/build-plugin-package';

test('package lint rejects quoted credential assignments, forward-slash Windows paths and invalid UTF-8', () => {
  const clean = unzipSync(buildPluginPackage().zip);
  for (const content of ['{"token": "' + 'a'.repeat(24) + '"}', 'C:/Users/Someone/private']) {
    assert.throws(() => validatePackageFiles({ ...clean, 'RELEASE-NOTES.md': strToU8(content) }), /secret|local path/);
  }
  assert.throws(() => validatePackageFiles({ ...clean, 'assets/logo.svg': new Uint8Array([0xc3, 0x28]) }), /UTF-8/);
});

test('package lint has total archive bounds and rejects empty entries', () => {
  const clean = unzipSync(buildPluginPackage().zip);
  assert.throws(() => validatePackageFiles({ ...clean, 'assets/logo.svg': new Uint8Array() }), /empty/i);
  const excess = { ...clean };
  for (let i = 0; i < 33; i++) excess[`assets/filler-${i}.svg`] = strToU8('x'.repeat(1024 * 1024));
  assert.throws(() => validatePackageFiles(excess), /total.*large/i);
});
