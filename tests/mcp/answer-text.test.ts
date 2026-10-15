import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {createFixtureServer} from '../../scripts/complete-model-journey-test';

test('planning text exposes complete source links and omits setup bearings',async()=>{
 const server=await createFixtureServer(mkdtempSync(join(tmpdir(),'nightsky-answer-text-')));
 try{
  const response=await server.rpc('tools/call',{name:'plan_observing_session',arguments:{placeId:'place:v1:geonames:990001',activity:'planet-observing',target:'Jupiter',window:{startUtc:'2026-10-15T18:00:00Z',endUtc:'2026-10-16T06:00:00Z',timeZone:'Europe/London'}}});
  const text=response.result.content.map((row:any)=>row.text??'').join('\n');
  assert.match(text,/https:\/\/www.geonames.org\//);
  assert.match(text,/https:\/\/github.com\/cosinekitty\/astronomy/);
  assert.match(text,/https:\/\/example.test\/forecast/);
  assert.match(text,/No compass-direction setup advice/);
  assert.match(text,/05:34.*Europe\/London/);
  assert.doesNotMatch(text,/looking SE|face SE|azimuth/i);
 }finally{await server.close();}
});

test('candidate details text requires an actual user choice before planning an unknown site timezone',async()=>{
 const server=await createFixtureServer(mkdtempSync(join(tmpdir(),'nightsky-zone-text-')));
 try{
  const response=await server.rpc('tools/call',{name:'get_observing_location_details',arguments:{placeId:'place:v1:osm:node:990001',catalogueRevision:'synthetic-v1'}});
  const text=response.result.content.map((row:any)=>row.text??'').join('\n');
  assert.match(text,/Ask the user.*display time zone/);
  assert.match(text,/do not infer.*city|do not infer.*window/i);
  assert.match(text,/https:\/\/example.test\/synthetic-catalogue/);
 }finally{await server.close();}
});

test('candidate display timezone schema explicitly requires a user choice rather than a city inference',async()=>{
 const server=await createFixtureServer(mkdtempSync(join(tmpdir(),'nightsky-zone-schema-')));
 try{const result=await server.rpc('tools/list',{});const plan=result.result.tools.find((tool:any)=>tool.name==='plan_observing_session');assert.match(plan.inputSchema.properties.displayTimeZone.description,/user.*explicit/i);assert.match(plan.description,/user.*chosen/i);}finally{await server.close();}
});

test('source text keeps complete safe links, deduplicates URLs and never renders credentials or unsafe schemes',async()=>{
 const {sourceLinkedText}=await import('../../server/mcp/answerText');
 const make=(name:string,url:string)=>({name,url,attribution:'fixture',dataClass:'context' as const});
 const text=sourceLinkedText('Facts',[make('A [title] <tag>','https://example.test/path/(a)'),make('duplicate','https://example.test/path/(a)'),make('unsafe','javascript:alert(1)'),make('secret','https://username:password@example.test/private')]);
 assert.equal((text.match(/https:\/\/example.test\/path/g)??[]).length,1);
 assert.match(text,/https:\/\/example.test\/path\/\(a\)/);
 assert.doesNotMatch(text,/javascript:|username|password|<tag>|\[title\]/);
});

test('source link text bounds UTF-8 bytes without emitting partial URL lines',async()=>{
 const {sourceLinkedText}=await import('../../server/mcp/answerText');
 const sources=Array.from({length:20},(_,i)=>({name:'星空'.repeat(60),url:`https://example.test/${i}/${'a'.repeat(1800)}`,attribution:'fixture',dataClass:'context' as const}));
 const text=sourceLinkedText('Facts',sources);
 assert.ok(Buffer.byteLength(text,'utf8')<7600);
 assert.match(text,/Additional source records/);
 for(const line of text.split('\n').filter(line=>line.startsWith('- [')))assert.match(line,/>\)$/);
});

test('empty dark-session suggestions do not deny targets above the geometric horizon',async()=>{
 const server=await createFixtureServer(mkdtempSync(join(tmpdir(),'nightsky-no-suggestion-')));
 const window={startUtc:'2026-10-15T18:00:00Z',endUtc:'2026-10-16T06:00:00Z',timeZone:'Australia/Sydney'};
 try{
  const target=await server.rpc('tools/call',{name:'get_target_visibility',arguments:{placeId:'place:v1:geonames:990002',targetQuery:'Jupiter',window}});
  assert.ok(target.result.structuredContent.intervals.length>0,'fixture has geometric Jupiter intervals');
  const response=await server.rpc('tools/call',{name:'plan_observing_session',arguments:{placeId:'place:v1:geonames:990002',activity:'astrophotography',window}});
  const result=response.result.structuredContent;
  assert.equal(result.suggestions.length,0);
  assert.doesNotMatch(result.gaps.join('\n'),/No supported bright target is geometrically visible/);
  assert.match(result.gaps.join('\n'),/No target suggestions.*does not establish.*below the horizon/);
 }finally{await server.close();}
});
