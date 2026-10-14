import test from 'node:test';
import assert from 'node:assert/strict';
import { buildClientCommand, EvidenceBudget, remainingCases, sanitize, validateExecution, journeys, boundedChild, assertContained, createFixtureServer, materializePackages, validateResume, checkpoint, readCheckpoint } from '../../scripts/complete-model-journey-test';
import { mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, relative, resolve } from 'node:path';

test('real execution is explicit and bounded', () => {
  assert.throws(()=>validateExecution([], 1), /--run/);
  assert.throws(()=>validateExecution(['--run'], 21), /20/);
  assert.equal(journeys.length,20);
});
test('relative resume resolves existing checkpoint without nested scratch or passed repeat',()=>{
 const base=mkdtempSync(join(tmpdir(),'nightsky-resume-test-'));const folder=join(base,'codex-case');
 const rel=relative(process.cwd(),folder);const legacy=resolve(base,rel);
 assert.notEqual(legacy,folder,'replays observed legacy nested-path bug');
 checkpoint(join(folder,'checkpoint.json'),[{id:'casual',status:'passed'}]);
 assert.equal(validateResume(base,rel),folder);
 assert.deepEqual(remainingCases(['casual','learner'],readCheckpoint(join(validateResume(base,rel),'checkpoint.json'))),['learner']);
});
test('synthetic server exposes complete tools and local-only discovery evidence',async()=>{
 const root=mkdtempSync(join(tmpdir(),'nightsky-complete-test-'));
 const server=await createFixtureServer(root);
 try {
  const tools=await server.rpc('tools/list',{});assert.equal(tools.result.tools.length,14);
  server.beginCase('fixture');
  const r=await server.rpc('tools/call',{name:'resolve_place',arguments:{placeQuery:'Fictionvale'}});
  assert.ok(r.result.structuredContent.matches.length);
  assert.equal(server.budget.traces.length,1);assert.equal(server.externalAttempts(),0);
  const pkg=materializePackages(root,server.endpoint);assert.ok(pkg.codex.sha256);assert.ok(pkg.claude.sha256);
  for(let i=1;i<12;i++)await server.rpc('tools/call',{name:'resolve_place',arguments:{placeQuery:'Fictionvale'}});
  await assert.rejects(server.rpc('tools/call',{name:'resolve_place',arguments:{placeQuery:'Fictionvale'}}));
  assert.equal(server.budget.traces.length,12);assert.equal(server.externalAttempts(),0);
  server.beginCase('future-source');
  const future=await server.rpc('tools/call',{name:'get_night_conditions',arguments:{placeId:'place:v1:geonames:990002',window:{startUtc:'2027-02-15T18:00:00Z',endUtc:'2027-02-16T06:00:00Z',timeZone:'Australia/Sydney'}}});
  assert.equal(future.result.structuredContent.sources[0].name,'Synthetic forecast');
  assert.ok(!JSON.stringify(future.result).includes('MET Norway'));
 }finally{await server.close();}
});
test('resume requires contained task folder and failed cases cannot loop retries',()=>{
 assert.throws(()=>validateResume('C:/task','C:/elsewhere'),/outside/);
 assert.throws(()=>remainingCases(['a'],[{id:'a',status:'blocked',attempt:2} as any]),/retry/);
 assert.equal(validateResume(process.cwd(),join(process.cwd(),'dist')),join(process.cwd(),'dist'));
});
test('deadline stops child and contained paths reject escape', async()=>{
 const r=await boundedChild(process.execPath,['-e','setInterval(()=>{},1000)'],process.cwd(),30);
 assert.equal(r.reason,'deadline'); assert.ok(r.elapsedMs<6000);
 assert.throws(()=>assertContained(process.cwd(),'../escape'),/outside/);
 assert.ok(assertContained(process.cwd(),'dist/evidence').endsWith('evidence'));
});
test('native Claude loading preserves OAuth and limits built-ins', () => {
  const c=buildClientCommand('claude','native','pkg','cfg','prompt');
  assert.ok(c.includes('--plugin-dir')); assert.ok(c.includes('--strict-mcp-config'));
  assert.ok(!c.includes('--bare')); assert.ok(c.includes('Skill,Read')); assert.ok(c.includes('--permission-mode'));
});
test('Codex native loading requires independent proof; fallback is labelled', () => {
  assert.throws(()=>buildClientCommand('codex','native','pkg','cfg','prompt'),/native loading/);
  const c=buildClientCommand('codex','prompt-fed','pkg','cfg','prompt');
  assert.ok(c.includes('--ignore-user-config')); assert.ok(!c.includes('--plugin-dir'));
});
test('byte and call limits reject before retaining extra evidence', () => {
  const b=new EvidenceBudget(); for(let i=0;i<12;i++)b.call('resolve_place',{});
  assert.throws(()=>b.call('resolve_place',{}),/call cap/);
  assert.throws(()=>b.capture('stdout',Buffer.alloc(250*1024+1)),/byte cap/);
  assert.equal(b.traces.length,12); assert.equal(b.stdout.length,0);
});
test('checkpoints skip completed successes and sanitize account/path secrets', () => {
  assert.deepEqual(remainingCases(['a','b'],[{id:'a',status:'passed'}]),['b']);
  assert.ok(!sanitize('Bearer abcdefghijklmnopqrstuvwxyz C:\\Users\\Person\\foo person@example.com').includes('Person'));
});
