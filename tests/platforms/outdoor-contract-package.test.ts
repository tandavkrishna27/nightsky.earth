import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';
import { unzipSync, strFromU8 } from 'fflate';
import { buildPluginPackage, validatePackageFiles } from '../../scripts/build-plugin-package';
import { buildLocalPluginPackage } from '../../scripts/build-local-plugin-package';
const names = ['find-observing-place', 'plan-stargazing-night', 'plan-astrophotography', 'plan-sky-event', 'prepare-outing'];
for (const host of ['portable', 'codex', 'claude'] as const) test(`${host} delivers outdoor conversation contract in every workflow`, () => {
  const files = unzipSync(host === 'portable' ? buildPluginPackage().zip : buildLocalPluginPackage({host, endpoint:'http://localhost:4010/mcp'}).zip);
  for (const name of names) {
    const text = strFromU8(files[`skills/${name}/references/workflow.md`]);
    const canonical = readFileSync(`docs/product/workflows/${name}.md`, 'utf8');
    const contract = readFileSync('docs/product/outdoor-conversation-contract.md', 'utf8').trimEnd();
    assert.equal(text, canonical.replace('<!-- outdoor-conversation -->', () => contract));
    assert.equal(text.split('## Outdoor discovery and conversation contract').length - 1, 1);
    assert.ok(text.indexOf('## Outdoor discovery and conversation contract') < text.indexOf('## First decision'));
    assert.doesNotMatch(text, /<!-- outdoor-conversation -->/);
    assert.match(strFromU8(files[`skills/${name}/SKILL.md`]).slice(0, 1400), /Default to outdoor observing/);
  }
});
test('portable validator rejects altered canonical workflow bytes', () => {
  const files = unzipSync(buildPluginPackage().zip);
  files['skills/find-observing-place/references/workflow.md'] = new TextEncoder().encode('Changed instructions');
  assert.throws(() => validatePackageFiles(files), /reference mismatch/);
});
