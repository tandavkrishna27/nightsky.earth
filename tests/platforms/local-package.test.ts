import assert from 'node:assert/strict';
import test from 'node:test';
import { createHash } from 'node:crypto';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { unzipSync, strFromU8, strToU8 } from 'fflate';
import { buildLocalPluginPackage, validateLocalPackageFiles } from '../../scripts/build-local-plugin-package';
import { composeWorkflowReference, buildPluginPackage } from '../../scripts/build-plugin-package';

const names = ['find-observing-place', 'plan-stargazing-night', 'plan-astrophotography', 'plan-sky-event', 'prepare-outing'];
const digest = (bytes: Uint8Array) => createHash('sha256').update(bytes).digest('hex');
test('Claude manifest uses the metadata subset accepted by Code 2.1.126', () => {
  const files = unzipSync(buildLocalPluginPackage({ host: 'claude', endpoint: 'http://localhost:4010/mcp' }).zip);
  const manifest = JSON.parse(strFromU8(files['.claude-plugin/plugin.json']));
  const allowed = new Set(['name', 'version', 'description', 'keywords', 'author']);
  assert.deepEqual(Object.keys(manifest).filter(key => !allowed.has(key)), []);
  assert.equal(manifest.name, 'nightsky');
});
test('Claude validator rejects optional UI fields unsupported by the compatibility target', () => {
  const files = unzipSync(buildLocalPluginPackage({ host: 'claude', endpoint: 'http://localhost:4010/mcp' }).zip);
  const manifest = JSON.parse(strFromU8(files['.claude-plugin/plugin.json']));
  manifest.displayName = 'NightSky.earth';
  assert.throws(() => validateLocalPackageFiles({ ...files, '.claude-plugin/plugin.json': strToU8(JSON.stringify(manifest)) }, 'claude'), /manifest/);
});
for (const host of ['codex', 'claude'] as const) {
  test(`${host} local package has deterministic host layout and exact canonical references`, () => {
    const options = { host, endpoint: 'http://127.0.0.1:4010/mcp' };
    const a = buildLocalPluginPackage(options); const b = buildLocalPluginPackage(options);
    assert.deepEqual(a.zip, b.zip); assert.equal(a.sha256, digest(a.zip));
    assert.equal(a.submissionReady, false); assert.equal(a.hostInstallationVerified, false);
    const files = unzipSync(a.zip);
    const manifestPath = host === 'codex' ? 'plugin.json' : '.claude-plugin/plugin.json';
    const mcpPath = host === 'codex' ? 'mcp.json' : '.mcp.json';
    assert.equal(JSON.parse(strFromU8(files[manifestPath])).name, 'nightsky');
    assert.deepEqual(JSON.parse(strFromU8(files[mcpPath])).mcpServers, { nightsky: { type: host === 'codex' ? 'streamable-http' : 'http', url: options.endpoint } });
    assert.equal(files[host === 'codex' ? '.mcp.json' : 'mcp.json'], undefined);
    assert.equal(files[host === 'codex' ? '.claude-plugin/plugin.json' : 'plugin.json'], undefined);
    assert.deepEqual(a.inventory.map(x => x.path), Object.keys(files).sort());
    for (const entry of a.inventory) { assert.equal(entry.bytes, files[entry.path].length); assert.equal(entry.sha256, digest(files[entry.path])); }
    for (const name of names) {
      const reference = `skills/${name}/references/workflow.md`;
      assert.deepEqual(Buffer.from(files[reference]), Buffer.from(composeWorkflowReference(name)));
      assert.match(strFromU8(files[`skills/${name}/SKILL.md`]), /`references\/workflow\.md`/);
      assert.doesNotMatch(strFromU8(files[`skills/${name}/SKILL.md`]), /docs\/product\/workflows/);
      const missing = { ...files }; delete missing[reference];
      assert.throws(() => validateLocalPackageFiles(missing, host), /workflow reference/);
      assert.throws(() => validateLocalPackageFiles({ ...files, [reference]: strToU8('different canonical bytes') }, host), /reference mismatch/);
    }
    assert.ok(files['assets/logo.svg']); assert.ok(files['assets/composer.svg']);
    assert.doesNotMatch(strFromU8(files['RELEASE-NOTES.md']), /uses an example endpoint/);
  });
  test(`${host} local validator rejects injected connections, paths and secrets`, () => {
    const files = unzipSync(buildLocalPluginPackage({ host, endpoint: 'http://localhost:4010/mcp' }).zip);
    const mcpPath = host === 'codex' ? 'mcp.json' : '.mcp.json';
    const connection = { type: host === 'codex' ? 'streamable-http' : 'http', url: 'http://localhost:4010/mcp' };
    for (const config of [{ mcpServers: { nightsky: connection, other: connection } }, { mcpServers: { nightsky: { ...connection, headers: {} } } }, { mcpServers: { nightsky: connection }, extra: {} }]) {
      assert.throws(() => validateLocalPackageFiles({ ...files, [mcpPath]: strToU8(JSON.stringify(config)) }, host), /connection|configuration/);
    }
    const manifestPath = host === 'codex' ? 'plugin.json' : '.claude-plugin/plugin.json';
    const manifest = JSON.parse(strFromU8(files[manifestPath])); manifest.mcpServers = { hidden: connection };
    assert.throws(() => validateLocalPackageFiles({ ...files, [manifestPath]: strToU8(JSON.stringify(manifest)) }, host), /manifest/);
    for (const path of [manifestPath, mcpPath]) {
      assert.throws(() => validateLocalPackageFiles({ ...files, [path]: strToU8(' '.repeat(1024 * 1024) + strFromU8(files[path])) }, host), /large/);
      assert.throws(() => validateLocalPackageFiles({ ...files, [path]: new Uint8Array([0xff]) }, host), /UTF-8/);
      assert.throws(() => validateLocalPackageFiles({ ...files, [path]: new Uint8Array() }, host), /Empty/);
      const clean = strFromU8(files[path]);
      for (const value of ['sk-' + 'a'.repeat(30), 'C:\\Users\\private']) {
        const duplicate = clean.replace('{', '{"hidden":' + JSON.stringify(value) + ',"hidden":null,');
        assert.throws(() => validateLocalPackageFiles({ ...files, [path]: strToU8(duplicate) }, host), /secret|local path/);
      }
    }
    const shadowServer = '{"mcpServers":{"hidden":{"url":"sk-' + 'a'.repeat(30) + '"}},' + strFromU8(files[mcpPath]).slice(1);
    assert.throws(() => validateLocalPackageFiles({ ...files, [mcpPath]: strToU8(shadowServer) }, host), /secret/);
    const oversizedTotal = { ...files };
    for (let index = 0; index < 33; index++) oversizedTotal[`padding-${index}.md`] = new Uint8Array(1024 * 1024).fill(32);
    assert.throws(() => validateLocalPackageFiles(oversizedTotal, host), /total bytes too large/);
    for (const value of ['sk-' + 'a'.repeat(30), 'C:\\Users\\private', '/home/private', '-----BEGIN PRIVATE KEY-----']) {
      assert.throws(() => validateLocalPackageFiles({ ...files, 'skills/prepare-outing/leak.md': strToU8(value) }, host), /secret|local path/);
    }
    for (const path of ['../escape', '.env', 'server/index.ts', 'data/raw.json', '.codex-plugin/plugin.json', 'skills/prepare-outing/model-trace.md']) {
      assert.throws(() => validateLocalPackageFiles({ ...files, [path]: strToU8('unwanted') }, host), /path/);
    }
  });
}
test('local endpoint requires exact literal loopback, explicit valid port and /mcp', () => {
  for (const endpoint of ['http://localhost:80/mcp', 'http://127.0.0.1:65535/mcp', 'http://[::1]:4010/mcp']) assert.equal(buildLocalPluginPackage({ host: 'codex', endpoint }).endpoint, endpoint);
  for (const endpoint of ['http://example.com:4010/mcp', 'http://10.0.0.1:4010/mcp', 'http://0.0.0.0:4010/mcp', 'https://localhost:4010/mcp', 'http://localhost/mcp', 'http://localhost:0/mcp', 'http://localhost:65536/mcp', 'http://localhost:04010/mcp', 'http://user:pass@localhost:4010/mcp', 'http://localhost:4010/mcp?', 'http://localhost:4010/mcp#', 'http://localhost:4010/mcp/', 'http://localhost:4010/x/../mcp', 'http://127.1:4010/mcp', 'http://2130706433:4010/mcp', 'http://LOCALHOST:4010/mcp', ' http://localhost:4010/mcp', 'http://localhost.:4010/mcp']) assert.throws(() => buildLocalPluginPackage({ host: 'codex', endpoint }), /endpoint/);
  assert.throws(() => buildLocalPluginPackage({ host: 'other' as 'codex', endpoint: 'http://localhost:4010/mcp' }), /host/);
  assert.throws(() => buildPluginPackage({ endpoint: 'http://localhost:4010/mcp' }), /endpoint/);
});
test('local CLI rejects incomplete, unknown and duplicate arguments before writing', () => {
  const script = fileURLToPath(new URL('../../scripts/build-local-plugin-package.ts', import.meta.url));
  for (const args of [[], ['--host', 'codex'], ['--host', 'codex', '--endpoint', 'http://localhost:4010/mcp', '--host', 'claude'], ['--host', 'codex', '--endpoint', 'http://localhost:4010/mcp', '--unknown', 'x'], ['--host', 'claude', '--endpoint', 'https://localhost:4010/mcp']]) {
    const result = spawnSync(process.execPath, ['--import', 'tsx', script, ...args], { encoding: 'utf8' });
    assert.notEqual(result.status, 0); assert.match(result.stderr, /required|unique|endpoint/);
  }
});

test('every native skill and workflow explicitly reject inferred Moon timing and visibility guarantees', () => {
  const files = unzipSync(buildLocalPluginPackage({ host: 'claude', endpoint: 'http://localhost:4010/mcp' }).zip);
  for (const name of names) {
    for (const path of [`skills/${name}/SKILL.md`, `skills/${name}/references/workflow.md`]) {
      const text = strFromU8(files[path]);
      assert.match(text, /Do not infer moonrise, moonset or a moonless window from illumination or sampled altitude/);
      assert.match(text, /Low Moon altitude does not establish negligible moonlight/);
      assert.match(text, /not a rise-time or whole-session bearing/);
      assert.match(text, /no supported event was returned/);
      assert.match(text, /Preserve relevant returned source links/);
    }
  }
});

test('discovery workflow does not advertise a historical fixture as runtime coverage', () => {
  const files = unzipSync(buildLocalPluginPackage({ host: 'claude', endpoint: 'http://localhost:4010/mcp' }).zip);
  const workflow = strFromU8(files['skills/find-observing-place/references/workflow.md']);
  assert.doesNotMatch(workflow, /1,327 named nodes/);
  assert.match(workflow, /Determine installed coverage only from current tool results/);
});

test('all complete workflows prefer aggregate planning and require evidence checks before answering', () => {
  const files = unzipSync(buildLocalPluginPackage({host:'claude',endpoint:'http://localhost:4010/mcp'}).zip);
  for (const name of names) for(const path of [`skills/${name}/SKILL.md`,`skills/${name}/references/workflow.md`]) {
    const text=strFromU8(files[path]);
    assert.match(text,/aggregate planning evidence/);
    assert.match(text,/Do not name a failed provider unless returned evidence identifies it/);
    assert.match(text,/Copy returned localStart and localEnd/);
    assert.match(text,/Never add permit requirements or an uncalculated target from memory/);
    assert.match(text,/complete returned source URLs/);
  }
});

test('each packaged skill puts clarification and timestamped-direction rules ahead of historical guidance',()=>{
 const files=unzipSync(buildLocalPluginPackage({host:'claude',endpoint:'http://localhost:4010/mcp'}).zip);
 for(const name of names){const text=strFromU8(files[`skills/${name}/SKILL.md`]);const primary=text.slice(0,2500);assert.match(primary,/Give on-site directions only from timestamped returned orientation evidence/);assert.match(primary,/stop and ask one display-time-zone question/);assert.match(primary,/complete source links/);}
});

test('every packaged workflow ends with a final orientation and source audit',()=>{
 const files=unzipSync(buildLocalPluginPackage({host:'claude',endpoint:'http://localhost:4010/mcp'}).zip);
 for(const name of names)for(const path of [`skills/${name}/SKILL.md`,`skills/${name}/references/workflow.md`]){
  const text=strFromU8(files[path]); const tail=text.slice(text.lastIndexOf('## Final answer audit'));
  assert.match(tail,/Final answer audit/);
  assert.match(tail,/including parenthetical advice/);
  assert.match(tail,/candidate distance or access/);
  assert.match(tail,/Shorten advice before dropping a required credit or claim-supporting source/);
 }
});

test('packaged answer procedure reserves evidence and safety within a bounded answer', () => {
 const files = unzipSync(buildLocalPluginPackage({host:'claude',endpoint:'http://localhost:4010/mcp'}).zip);
 for (const name of names) for (const path of [`skills/${name}/SKILL.md`,`skills/${name}/references/workflow.md`]) {
  const text = strFromU8(files[path]); const audit = text.slice(text.indexOf('## Final answer audit'));
  for (const rule of [/1\. Core answer/, /2\. Evidence/, /3\. Next step/, /issuedAt.*valid.*value.*instant/, /120 words.*before Sources/, /count.*whitespace/, /both years.*both.*URLs/, /pole-facing/, /Moon-free.*favourable/, /clipped.*sunset/, /Ordinary sunglasses are unsafe/, /Omit optional unrelated events and catalogue counts/]) assert.match(audit, rule, path);
  assert.match(text, /If no location capability or supplied hint is exposed.*ask only for town and country/);
  assert.doesNotMatch(text, /For “near me,” ask for location permission or a city/);
 }
});

test('packaged aggregate citation procedure keeps relevant credits and full structured provenance', () => {
 const files = unzipSync(buildLocalPluginPackage({host:'claude',endpoint:'http://localhost:4010/mcp'}).zip);
 for (const name of names) for (const path of [`skills/${name}/SKILL.md`,`skills/${name}/references/workflow.md`]) {
  const text = strFromU8(files[path]); const audit = text.slice(text.indexOf('## Final answer audit'));
  assert.match(audit, /aggregate plan.*relevant answer-ready references.*not as a mandatory block to copy/);
  assert.match(audit, /Keep full catalogue provenance in structured output/);
  assert.doesNotMatch(audit, /copy its complete Sources URL block/);
  assert.match(audit, /Negative or empty-event claims use sources/);
  assert.match(audit, /Omit incidental empty-event sentences from non-event plans/);
  assert.match(audit, /focused tool answers.*relevant sources only/);
  assert.match(audit, /Copy required provider\/datasource attribution text and licence links.*mandatory safety/);
  assert.doesNotMatch(audit, /URLs without long labels/);
 }
});

test('packaged answers reserve citations with scenario budgets and explicit Moon unknowns', () => {
 const files = unzipSync(buildLocalPluginPackage({host:'claude',endpoint:'http://localhost:4010/mcp'}).zip);
 for (const name of names) for (const path of [`skills/${name}/SKILL.md`,`skills/${name}/references/workflow.md`]) {
  const audit = strFromU8(files[path]).split('## Final answer audit')[1];
  assert.match(audit, /mandatory factual core.*120 words.*before Sources/i);
  assert.match(audit, /family.*150 words total.*URLs/i);
  assert.match(audit, /one 20–30 minute block.*returned opportunity/);
  assert.match(audit, /unsupported or clarification.*100 words total/i);
  assert.match(audit, /one boundary sentence per request.*one question or next step/);
  assert.match(audit, /Moon impact unknown.*even for Moon viewing/);
  assert.match(audit, /Do not invent later-night or next-night darkness comparisons/);
 }
});

test('packaged guides distinguish absent dark targets from impossible photography', () => {
 const files = unzipSync(buildLocalPluginPackage({host:'claude',endpoint:'http://localhost:4010/mcp'}).zip);
 for (const name of names) for (const path of [`skills/${name}/SKILL.md`,`skills/${name}/references/workflow.md`]) {
  const text = strFromU8(files[path]);
  assert.match(text, /No astronomical darkness or no selected targets does not make photography impossible/);
  assert.match(text, /Preserve any returned predawn or twilight interval/);
  assert.match(text, /Twilight Moon or landscape photography is only a general possibility/);
 }
});

test('packaged final answer audit preserves downstream credits and sparse sample scope', () => {
 const files = unzipSync(buildLocalPluginPackage({host:'codex',endpoint:'http://localhost:4010/mcp'}).zip);
 for (const name of names) for (const path of [`skills/${name}/SKILL.md`,`skills/${name}/references/workflow.md`]) {
  const text = strFromU8(files[path]);
  const audit = text.split('## Final answer audit')[1];
  assert.match(text, /© OpenStreetMap contributors \(ODbL\).*https:\/\/www\.openstreetmap\.org\/copyright/, path);
  assert.match(audit, /required source names.*downstream credits.*survive compression/, path);
  assert.match(audit, /lowest-cloud returned sample.*timestamp and value/, path);
  assert.match(audit, /earlier hours look more promising.*continuous weather coverage/, path);
 }
});


test('packaged credits retain exact returned notices even in selection clarifications', () => {
 const files = unzipSync(buildLocalPluginPackage({host:'codex',endpoint:'http://localhost:4010/mcp'}).zip);
 for (const name of names) for (const path of [`skills/${name}/SKILL.md`,`skills/${name}/references/workflow.md`]) {
  const text = strFromU8(files[path]);
  assert.match(path.endsWith('/SKILL.md') ? text.slice(0, 2500) : text, /complete source links.*provider\/datasource contributor, copyright and licence names.*selection-reporting clarifications/, path);
  assert.ok(text.includes('Powered by [Geoapify](https://www.geoapify.com/); map data [© OpenStreetMap contributors (ODbL)](https://www.openstreetmap.org/copyright).'), path);
  assert.match(text, /Use this credit only when the returned source identifies Geoapify\/OSM/, path);
  assert.match(text.split('## Final answer audit')[1], /selection-reporting clarifications/, path);
 }
});
