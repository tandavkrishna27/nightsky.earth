import assert from 'node:assert/strict';
import test from 'node:test';
import { unzipSync, strFromU8 } from 'fflate';
import { composeWorkflowReference, buildPluginPackage, validatePackageFiles } from '../../scripts/build-plugin-package';

test('package rehearsal emits deterministic root ZIP, remote endpoint and digest inventory', () => {
  const a = buildPluginPackage(); const b = buildPluginPackage();
  assert.deepEqual(a.zip, b.zip);
  assert.match(a.sha256, /^[a-f0-9]{64}$/);
  const files = unzipSync(a.zip);
  assert.ok(files['plugin.json']); assert.ok(files['mcp.json']);
  assert.equal(Object.keys(JSON.parse(strFromU8(files['mcp.json'])).mcpServers).length, 1);
  assert.equal(a.submissionReady, false);
  assert.ok(a.gates.includes('publisher identity'));
  const extension = JSON.parse(strFromU8(files['plugin.json'])).extensions['com.openai'];
  const cases = extension.review.test_cases;
  assert.equal(cases.positive.length, 5); assert.equal(cases.negative.length, 3);
  assert.equal(extension.interface.category, 'Education & Research');
  assert.equal(extension.review.prompts.length, 3);
  assert.match(extension.publication.release_notes, /Public Universe/);
  assert.ok(a.inventory.every(x => x.bytes > 0 && /^[a-f0-9]{64}$/.test(x.sha256)));
});

test('parameterized endpoint rejects insecure, private and credential bearing URLs', () => {
  for (const endpoint of ['http://example.com/mcp', 'https://localhost/mcp', 'https://127.0.0.1/mcp', 'https://10.0.0.1/mcp', 'https://0.0.0.0/mcp', 'https://user:pass@example.com/mcp', 'https://example.com/mcp?token=abc']) {
    assert.throws(() => buildPluginPackage({ endpoint }), /endpoint/);
  }
  const result = buildPluginPackage({ endpoint: 'https://staging.example.com/mcp' });
  assert.equal(JSON.parse(strFromU8(unzipSync(result.zip)['mcp.json'])).mcpServers.nightsky.url, 'https://staging.example.com/mcp');
  assert.equal(result.submissionReady, false);
});

test('package lint rejects secrets, machine paths, traversal, extra server and missing assets', () => {
  const clean = unzipSync(buildPluginPackage().zip);
  for (const content of ['sk-' + 'a'.repeat(30), 'Bearer ' + 'a'.repeat(30), 'C:\\Users\\Someone\\private', '/home/someone/private', '-----BEGIN PRIVATE KEY-----']) {
    assert.throws(() => validatePackageFiles({ ...clean, 'skills/plan-stargazing-night/leak.md': new TextEncoder().encode(content) }), /secret|local path/);
  }
  assert.throws(() => validatePackageFiles({ ...clean, '../escape': new Uint8Array([1]) }), /path/);
  const multi = structuredClone(clean);
  multi['mcp.json'] = new TextEncoder().encode(JSON.stringify({ mcpServers: { one: {type: 'streamable-http',url:'https://example.com/mcp'}, two: {type:'streamable-http',url:'https://example.com/mcp'} } }));
  assert.throws(() => validatePackageFiles(multi), /one remote/);
  delete clean['assets/logo.png'];
  assert.throws(() => validatePackageFiles(clean), /asset/);
});

test('package includes submission-sized PNG artwork with intact signatures', () => {
  const files = unzipSync(buildPluginPackage().zip);
  const listing = JSON.parse(strFromU8(files['plugin.json'])).extensions['com.openai'].interface;
  assert.equal(listing.logo, './assets/logo.png');
  assert.equal(listing.composerIcon, './assets/composer.png');
  for (const [path, minimum] of [['assets/logo.png', 256], ['assets/composer.png', 48]] as const) {
    const png = files[path];
    assert.ok(png.length < 5 * 1024 * 1024);
    assert.deepEqual(Array.from(png.subarray(0, 8)), [137, 80, 78, 71, 13, 10, 26, 10]);
    const dimensions = new DataView(png.buffer, png.byteOffset, png.byteLength);
    const width = dimensions.getUint32(16), height = dimensions.getUint32(20);
    assert.equal(width, height);
    assert.ok(width >= minimum);
    const broken = { ...files, [path]: new TextEncoder().encode('not a PNG') };
    assert.throws(() => validatePackageFiles(broken), /PNG/);
  }
});



test('installed skills carry exact canonical workflows with working local references', () => {
  const files = unzipSync(buildPluginPackage().zip);
  for (const name of ['find-observing-place', 'plan-stargazing-night', 'plan-astrophotography', 'plan-sky-event', 'prepare-outing']) {
    const reference = `skills/${name}/references/workflow.md`;
    assert.ok(files[reference], `missing installed reference for ${name}`);
    assert.deepEqual(Buffer.from(files[reference]), Buffer.from(composeWorkflowReference(name)));
    const skill = strFromU8(files[`skills/${name}/SKILL.md`]);
    assert.match(skill, /`references\/workflow\.md`/);
    assert.doesNotMatch(skill, /docs\/product\/workflows/);
    const missing = { ...files }; delete missing[reference];
    assert.throws(() => validatePackageFiles(missing), /workflow reference/);
  }
  assert.throws(() => validatePackageFiles({ ...files, 'skills/unknown/references/workflow.md': new TextEncoder().encode('unexpected') }), /path/);
  assert.throws(() => validatePackageFiles({ ...files, 'skills/plan-sky-event/references/other.md': new TextEncoder().encode('unexpected') }), /path/);
});

test('packaged workflows only reference registered tool names',()=>{
 const files=unzipSync(buildPluginPackage().zip);
 const reference='skills/find-observing-place/references/workflow.md';
 files[reference]=new TextEncoder().encode(strFromU8(files[reference])+'\nCall get_observing_magic to infer site safety.');
 assert.throws(()=>validatePackageFiles(files),/tool inventory/);
});

test('package report separates optional tools from the default fourteen and checks optional find names',()=>{
 const report=buildPluginPackage();
 assert.equal(report.toolNames.length,14);
 assert.ok(!report.toolNames.includes('search_astronomy_objects'));
 assert.deepEqual(report.optionalToolNames,['compare_light_pollution','discover_observing_targets','find_moon_aware_windows','get_catalogue_target_windows','get_external_body_positions','get_reference_details','get_small_body_ephemeris','get_space_weather_events','resolve_small_body','search_astronomy_objects','search_reference_objects']);
 const files=unzipSync(report.zip), reference='skills/find-observing-place/references/workflow.md';
 files[reference]=new TextEncoder().encode(strFromU8(files[reference])+'\nCall find_moon_magic.');
 assert.throws(()=>validatePackageFiles(files),/Unknown tool inventory reference: find_moon_magic/);
});
