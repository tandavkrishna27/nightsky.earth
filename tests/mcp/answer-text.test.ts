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

test('answer brief leads with issued forecast values and exclusive Sydney twilight phases',async()=>{
 const {planAnswerText}=await import('../../server/mcp/answerText');
 const server=await createFixtureServer(mkdtempSync(join(tmpdir(),'nightsky-answer-brief-')));
 try{
  const response=await server.rpc('tools/call',{name:'plan_observing_session',arguments:{placeId:'place:v1:geonames:990002',activity:'astrophotography',window:{startUtc:'2026-10-15T18:00:00Z',endUtc:'2026-10-16T06:00:00Z',timeZone:'Australia/Sydney'}}});
  const plan=response.result.structuredContent;
  // Long geometry previously pushed provider facts outside the bounded text entirely.
  plan.candidateWindows=Array.from({length:8},()=>({window:plan.requestedWindow,localStart:'geometry '.repeat(50),localEnd:'geometry '.repeat(50)}));
  const text=planAnswerText(plan);
  const front=text.split('No compass-direction')[0];
  assert.match(front,/Synthetic forecast issued 2026-10-15T12:00:00Z/);
  assert.match(front,/valid 2026-10-15T22:00:00Z.*totalCloudCover 12 %.*instant sample/i);
  assert.match(front,/visibility unknown/);
  assert.match(front,/Civil twilight phase:.*05:47.*06:17/);
  assert.match(front,/Nautical twilight phase:.*05:17.*05:47/);
  assert.match(front,/Astronomical twilight phase:.*05:00.*05:17/);
  assert.match(front,/clipped.*not.*sunrise.*sunset/i);
  assert.match(front,/Moon illumination.*impact remains unknown/);
  assert.ok(Buffer.byteLength(text,'utf8')<11500);
 }finally{await server.close();}
});

test('answer brief preserves unknown issue time and missing astronomy evidence',async()=>{
 const {planAnswerText}=await import('../../server/mcp/answerText');
 const server=await createFixtureServer(mkdtempSync(join(tmpdir(),'nightsky-answer-unknown-')));
 try{
  const response=await server.rpc('tools/call',{name:'plan_observing_session',arguments:{placeId:'place:v1:geonames:990001',activity:'general-stargazing',window:{startUtc:'2026-10-15T18:00:00Z',endUtc:'2026-10-16T06:00:00Z',timeZone:'Europe/London'}}});
  const plan=response.result.structuredContent;
  delete plan.evidence.astronomy;
  delete plan.evidence.weather.forecasts[0].source.issuedAt;
  const text=planAnswerText(plan);
  assert.match(text,/issued at an unavailable time/);
  assert.match(text,/Twilight phases unknown/);
  assert.doesNotMatch(text,/Civil twilight phase:/);
 }finally{await server.close();}
});

test('many forecast samples keep essential phases and Moon warning inside the bounded brief',async()=>{
 const {planAnswerText}=await import('../../server/mcp/answerText');
 const server=await createFixtureServer(mkdtempSync(join(tmpdir(),'nightsky-answer-many-')));
 try{
  const response=await server.rpc('tools/call',{name:'plan_observing_session',arguments:{placeId:'place:v1:geonames:990002',activity:'astrophotography',window:{startUtc:'2026-10-15T18:00:00Z',endUtc:'2026-10-16T06:00:00Z',timeZone:'Australia/Sydney'}}});
  const plan=response.result.structuredContent;
  const base=plan.evidence.weather.forecasts[0];
  plan.evidence.weather.forecasts=Array.from({length:4},(_,provider)=>({...base,source:{...base.source,name:`Provider ${provider} ${'long name '.repeat(15)}`},samples:Array.from({length:48},(_,i)=>({validAt:new Date(Date.parse('2026-10-15T00:00:00Z')+i*3600000).toISOString(),values:{totalCloudCover:{value:i===0?12:99,unit:'%'+ 'long unit '.repeat(3)},temperature:{value:20,unit:'C'},windSpeed:{value:3,unit:'m/s'},visibility:{value:100,unit:'m'},relativeHumidity:{value:80,unit:'%'},dewPoint:{value:12,unit:'C'}}}))}));
  const before=JSON.stringify(plan);
  const text=planAnswerText(plan),body=text.split('\n\nSources:')[0];
  assert.equal(JSON.stringify(plan),before,'formatting leaves structured evidence unchanged');
  for(let provider=0;provider<4;provider++)assert.match(body,new RegExp(`Provider ${provider}.*issued 2026-10-15T12:00:00Z.*48 samples.*2026-10-15T00:00:00.000Z.*2026-10-16T23:00:00.000Z`));
  assert.match(body,/First sample example.*totalCloudCover 12/);
  assert.match(body,/remaining samples.*structuredContent/i);
  assert.match(body,/Civil twilight phase:.*05:47.*06:17/);
  assert.match(body,/Nautical twilight phase:.*05:17.*05:47/);
  assert.match(body,/Astronomical twilight phase:.*05:00.*05:17/);
  assert.match(body,/Moon illumination.*impact remains unknown/);
  assert.ok(Buffer.byteLength(body,'utf8')<4200);
  assert.match(text,/https:\/\/example.test\/forecast/);
 }finally{await server.close();}
});

test('empty forecast samples retain issue and availability while validity and values stay unknown',async()=>{
 const {planAnswerText}=await import('../../server/mcp/answerText');
 const server=await createFixtureServer(mkdtempSync(join(tmpdir(),'nightsky-answer-empty-')));
 try{
  const response=await server.rpc('tools/call',{name:'plan_observing_session',arguments:{placeId:'place:v1:geonames:990001',activity:'general-stargazing',window:{startUtc:'2026-10-15T18:00:00Z',endUtc:'2026-10-16T06:00:00Z',timeZone:'Europe/London'}}});
  const plan=response.result.structuredContent;
  plan.evidence.weather.forecasts[0].samples=[];
  plan.evidence.weather.forecasts[0].source.name='Provider '+ 'long name '.repeat(15);
  const text=planAnswerText(plan);
  assert.match(text,/issued 2026-10-15T12:00:00Z.*0 samples.*valid times unknown.*values unknown.*availability available/);
  assert.doesNotMatch(text,/undefined|\uFFFD/);
 }finally{await server.close();}
});

test('forecast synopsis labels distinguish identical Unicode name prefixes without splitting codepoints',async()=>{
 const {planAnswerText}=await import('../../server/mcp/answerText');
 const server=await createFixtureServer(mkdtempSync(join(tmpdir(),'nightsky-answer-unicode-')));
 try{
  const response=await server.rpc('tools/call',{name:'plan_observing_session',arguments:{placeId:'place:v1:geonames:990001',activity:'general-stargazing',window:{startUtc:'2026-10-15T18:00:00Z',endUtc:'2026-10-16T06:00:00Z',timeZone:'Europe/London'}}});
  const plan=response.result.structuredContent,base=plan.evidence.weather.forecasts[0];
  const prefix='A'+'\u{1f30c}'.repeat(40);
  plan.evidence.weather.forecasts=[{...base,source:{...base.source,name:prefix+'one'}},{...base,source:{...base.source,name:prefix+'two'}}];
  const text=planAnswerText(plan),body=text.split('\n\nSources:')[0];
  assert.match(body,/Forecast 1:/);assert.match(body,/Forecast 2:/);
  assert.ok(body.includes('A'+'\u{1f30c}'.repeat(39)+'...'));
  assert.doesNotMatch(body,/[\uD800-\uDBFF](?![\uDC00-\uDFFF])|(?<![\uD800-\uDBFF])[\uDC00-\uDFFF]|\uFFFD/);
 }finally{await server.close();}
});
