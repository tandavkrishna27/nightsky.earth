/** Offline artifact proof only: never installs a plugin or starts a provider/model. */
import assert from 'node:assert/strict';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { unzipSync, strFromU8 } from 'fflate';
import { buildLocalPluginPackage } from './build-local-plugin-package';

const skillNames = ['find-observing-place', 'plan-stargazing-night', 'plan-astrophotography', 'plan-sky-event', 'prepare-outing'];
const endpoint = 'http://127.0.0.1:43127/mcp';
const reports = [];
for (const host of ['codex', 'claude'] as const) {
  const result = buildLocalPluginPackage({ host, endpoint });
  const repeat = buildLocalPluginPackage({ host, endpoint });
  assert.deepEqual(result.zip, repeat.zip, `${host} package must be deterministic`);
  assert.equal(result.submissionReady, false);
  assert.equal(result.hostInstallationVerified, false);
  const files = unzipSync(result.zip);
  const connectionPath = host === 'claude' ? '.mcp.json' : 'mcp.json';
  const manifestPath = host === 'claude' ? '.claude-plugin/plugin.json' : 'plugin.json';
  assert.ok(files[manifestPath]);
  const connections = JSON.parse(strFromU8(files[connectionPath])).mcpServers;
  assert.equal(Object.keys(connections).length, 1);
  assert.equal((Object.values(connections)[0] as { url: string }).url, endpoint);
  for (const name of skillNames) {
    const skill = strFromU8(files[`skills/${name}/SKILL.md`]);
    assert.ok(skill.includes('references/workflow.md'));
    assert.ok(!skill.includes('docs/product/workflows/'));
    assert.deepEqual(Buffer.from(files[`skills/${name}/references/workflow.md`]), readFileSync(`docs/product/workflows/${name}.md`));
  }
  const directory = resolve('dist/local-plugin-rehearsal', host);
  mkdirSync(directory, { recursive: true });
  writeFileSync(resolve(directory, 'nightsky-local.zip'), result.zip);
  reports.push({ host, sha256: result.sha256, inventory: result.inventory, submissionReady: false, hostInstallationVerified: false });
}
writeFileSync(resolve('dist/local-plugin-rehearsal/verification.json'), JSON.stringify({ scope: 'offline artifact verification only', endpoint, modelInvoked: false, providerRequested: false, pluginInstalled: false, reports }, null, 2) + '\n');
console.log(JSON.stringify({ localPackageHosts: reports.map(report => report.host), canonicalWorkflowsPerHost: skillNames.length, pluginInstalled: false, submissionReady: false }));
