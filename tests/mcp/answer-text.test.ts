import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {createFixtureServer} from '../../scripts/complete-model-journey-test';

test('Geminids answer omits unrelated catalogue references while retaining full structured provenance',async()=>{
 const server=await createFixtureServer(mkdtempSync(join(tmpdir(),'nightsky-topic-credits-')));
 try{
  const response=await server.rpc('tools/call',{name:'plan_observing_session',arguments:{placeId:'place:v1:geonames:990001',activity:'meteor-shower',target:'Geminids',window:{startUtc:'2026-12-13T18:00:00Z',endUtc:'2026-12-14T06:00:00Z',timeZone:'Europe/London'}}});
  const plan=response.result.structuredContent,text=response.result.content.map((row:any)=>row.text??'').join('\n');
  const unrelated=plan.evidence.events.meteorCivilGuidance.find((row:any)=>row.code==='LYR').source;
  assert.ok(plan.sources.some((source:any)=>source.url===unrelated.url),'complete provenance remains in structured output');
  assert.ok(!text.includes(unrelated.url),'answer must not dump an unrelated Lyrid reference');
  const selected=plan.evidence.events.meteorCalendarGuidance.entries.find((row:any)=>row.code==='GEM').source;
  assert.ok(text.includes(selected.url),'selected shower guidance stays credited');
  assert.match(text,/https:\/\/github.com\/cosinekitty\/astronomy/);
  assert.match(text,/https:\/\/example.test\/forecast/);
 }finally{await server.close();}
});

test('answer source selection preserves distinct credits and shared evidence without mutating provenance',async()=>{
 const {planAnswerSources}=await import('../../server/mcp/answerText');
 const make=(name:string,url:string,attribution=name)=>({name,url,attribution,dataClass:'context' as const});
 const background=make('Background Lyrids','https://example.test/lyrids');
 const shared=make('Shared calculation','https://example.test/shared');
 const creditA=make('Provider A','https://example.test/credit','Credit A');
 const creditB=make('Provider B','https://example.test/credit','Credit B');
 const selected=make('Selected Geminids','https://example.test/geminids');
 const plan:any={goal:'meteor-shower',sources:[background,shared,creditA,creditB,selected],place:{sources:[creditA,creditB]},evidence:{astronomy:{sources:[shared]},events:{sources:[background,shared,selected],events:[],meteorCalendarGuidance:{entries:[{code:'GEM',source:selected},{code:'LYR',source:background}]}}}};
 const before=JSON.stringify(plan);
 const sources=planAnswerSources(plan,'Geminids');
 assert.deepEqual(sources,[shared,creditA,creditB,selected]);
 assert.equal(JSON.stringify(plan),before);
 assert.ok(!planAnswerSources(plan,'Unknown shower').includes(selected),'unknown target must not acquire another shower citation');
});

test('untargeted single-shower plans retain the civil-guidance source used by inferred planning',async()=>{
 const {planAnswerSources}=await import('../../server/mcp/answerText');
 const make=(name:string)=>({name,url:`https://example.test/${name}`,attribution:name,dataClass:'context' as const});
 const civil=make('lyrid-civil'),forecast=make('lyrid-forecast'),background=make('geminid-background');
 const plan:any={goal:'meteor-shower',sources:[civil,forecast,background],place:{sources:[]},evidence:{events:{sources:[civil,forecast,background],events:[{eventId:'meteor:LYR',name:'Lyrids',eventType:'meteor-shower',source:forecast}],meteorCivilGuidance:[{code:'LYR',source:civil}],meteorCalendarGuidance:{entries:[{code:'GEM',source:background}]}}}};
 assert.deepEqual(planAnswerSources(plan),[civil,forecast]);
 plan.evidence.events.events.push({eventId:'meteor:GEM',name:'Geminids',eventType:'meteor-shower',source:background});
 assert.ok(!planAnswerSources(plan).includes(civil),'multiple showers must not silently infer one civil-guidance target');
});

test('API planning text has a single relevant credit section with no duplicate bibliography',async()=>{
 const {planAnswerText,planAnswerSources}=await import('../../server/mcp/answerText');
 const {apiAttributionText}=await import('../../server/places/api/attribution');
 const server=await createFixtureServer(mkdtempSync(join(tmpdir(),'nightsky-single-credits-')));
 try{
  const response=await server.rpc('tools/call',{name:'plan_observing_session',arguments:{placeId:'place:v1:geonames:990001',activity:'general-stargazing',window:{startUtc:'2026-10-15T18:00:00Z',endUtc:'2026-10-16T06:00:00Z',timeZone:'Europe/London'}}});
  const plan=response.result.structuredContent;
  const text=apiAttributionText(planAnswerText(plan,{includeSourceLinks:false}),planAnswerSources(plan));
  assert.equal((text.match(/\n\nSource credits:/g)??[]).length,1);
  assert.ok(!text.includes('\n\nSources:'));
  assert.match(text,/https:\/\/www.geonames.org\//);
 }finally{await server.close();}
});

test('API-mode MCP boundary keeps location credits but omits duplicate and unrelated event sources',async()=>{
 const server=await createFixtureServer(mkdtempSync(join(tmpdir(),'nightsky-api-topic-')),{mode:'api'});
 try{
  const resolved=await server.rpc('tools/call',{name:'resolve_place',arguments:{placeQuery:'Fictionvale'}});
  const place=resolved.result.structuredContent.matches[0];assert.ok(place);
  const response=await server.rpc('tools/call',{name:'plan_observing_session',arguments:{placeId:place.placeId,sourceRevision:place.sourceRevision,activity:'meteor-shower',target:'Geminids',window:{startUtc:'2026-12-13T18:00:00Z',endUtc:'2026-12-14T06:00:00Z',timeZone:'Europe/London'}}});
  assert.ok(!response.result.isError,JSON.stringify(response.result));
  const plan=response.result.structuredContent,text=response.result.content.map((row:any)=>row.text??'').join('\n');
  assert.equal((text.match(/\n\nSource credits:/g)??[]).length,1);
  assert.ok(!text.includes('\n\nSources:'));
  const unrelated=plan.evidence.events.meteorCivilGuidance.find((row:any)=>row.code==='LYR').source;
  assert.ok(!text.includes(unrelated.url));assert.ok(plan.sources.some((s:any)=>s.url===unrelated.url));
  for(const source of plan.place.sources)assert.ok(text.includes(source.url),'location and underlying-data credits remain visible');
  assert.equal(server.externalAttempts(),0);
 }finally{await server.close();}
});

test('planning text exposes source links and only timestamped setup bearings',async()=>{
 const server=await createFixtureServer(mkdtempSync(join(tmpdir(),'nightsky-answer-text-')));
 try{
  const response=await server.rpc('tools/call',{name:'plan_observing_session',arguments:{placeId:'place:v1:geonames:990001',activity:'planet-observing',target:'Jupiter',window:{startUtc:'2026-10-15T18:00:00Z',endUtc:'2026-10-16T06:00:00Z',timeZone:'Europe/London'}}});
  const text=response.result.content.map((row:any)=>row.text??'').join('\n');
  assert.match(text,/https:\/\/www.geonames.org\//);
  assert.match(text,/https:\/\/github.com\/cosinekitty\/astronomy/);
  assert.match(text,/https:\/\/example.test\/forecast/);
  assert.match(text,/Orientation: returned instants only/);
  assert.match(text,/05:34.*Europe\/London/);
  assert.doesNotMatch(text,/looking SE|face SE/);
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
  const front=text.split('Orientation:')[0];
  assert.match(front,/Synthetic forecast; status available; issued 2026-10-15T12:00:00Z/);
  assert.match(front,/2026-10-15T22:00:00Z.*totalCloudCover 12 %.*instant/i);
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
  assert.match(text,/issued unknown/);
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
  plan.suggestions=['Moon','Saturn','Jupiter'].map(name=>({target:{targetId:`body:${name}`,name},sources:[],orientationSamples:[0,1,2].map(i=>({atUtc:`2026-10-15T${18+i}:00:00.000Z`,localTime:`Oct 16, 2026, ${5+i}:00 (Australia/Sydney)`,altitudeDegrees:20+i,azimuthDegrees:100+i}))}));
  const before=JSON.stringify(plan);
  const text=planAnswerText(plan),body=text.split('\n\nSources:')[0];
  assert.equal(JSON.stringify(plan),before,'formatting leaves structured evidence unchanged');
  for(let provider=0;provider<4;provider++)assert.match(body,new RegExp(`Provider ${provider}.*issued 2026-10-15T12:00:00Z.*13 relevant cloud entries`));
  assert.ok(!body.split('\n').filter(l=>l.includes('totalCloudCover')).some(l=>l.includes('T00:00:00.000Z')));
  assert.match(body,/full timestamped evidence.*structuredContent/i);
  assert.match(body,/Civil twilight phase:.*05:47.*06:17/);
  assert.match(body,/Nautical twilight phase:.*05:17.*05:47/);
  assert.match(body,/Astronomical twilight phase:.*05:00.*05:17/);
  assert.match(body,/Moon illumination.*impact remains unknown/);
  assert.match(body,/Moon maximum sampled altitude .*at Oct 16, 2026, 17:00 \(Australia\/Sydney\)/);
  for(const name of ['Moon','Saturn','Jupiter'])assert.match(body,new RegExp(`${name} at .*UTC 2026-10-15T`));
  assert.ok(Buffer.byteLength(body,'utf8')<=8000);
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
  assert.match(text,/status available.*issued 2026-10-15T12:00:00Z.*cloud unknown/);
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
  assert.ok(body.includes('A'+'\u{1f30c}'.repeat(23)+'...'));
  assert.doesNotMatch(body,/[\uD800-\uDBFF](?![\uDC00-\uDFFF])|(?<![\uD800-\uDBFF])[\uDC00-\uDFFF]|\uFFFD/);
 }finally{await server.close();}
});

test('Sydney brief labels twilight starts and ends and pairs Moon maximum with its own local instant',async()=>{
 const {planAnswerText}=await import('../../server/mcp/answerText');
 const {formatLocalInstant}=await import('../../shared/nightsky/format');
 const server=await createFixtureServer(mkdtempSync(join(tmpdir(),'nightsky-answer-endpoints-')));
 try{
  const response=await server.rpc('tools/call',{name:'plan_observing_session',arguments:{placeId:'place:v1:geonames:990002',activity:'astrophotography',window:{startUtc:'2026-10-15T18:00:00Z',endUtc:'2026-10-16T06:00:00Z',timeZone:'Australia/Sydney'}}});
  const plan=response.result.structuredContent,moon=plan.evidence.astronomy.moon;
  const front=planAnswerText(plan).split('Orientation:')[0];
  assert.match(front,/Civil twilight phase: START Oct 16, 2026, 05:47 \(Australia\/Sydney\); END Oct 16, 2026, 06:17 \(Australia\/Sydney\)/);
  assert.match(front,/Nautical twilight phase: START Oct 16, 2026, 05:17.*END Oct 16, 2026, 05:47/);
  assert.match(front,/Astronomical twilight phase: START Oct 16, 2026, 05:00.*END Oct 16, 2026, 05:17/);
  assert.ok(front.includes(`Moon maximum sampled altitude ${moon.maximumAltitudeDegrees.toFixed(1)} degrees at ${formatLocalInstant(moon.maximumAltitudeAtUtc,'Australia/Sydney','en')}`));
  delete moon.maximumAltitudeAtUtc;
  const unknown=planAnswerText(plan).split('Orientation:')[0];
  assert.match(unknown,/Moon maximum sampled altitude .*time unknown/);
  assert.doesNotMatch(unknown,/undefined/);
 }finally{await server.close();}
});


test('target MCP boundary exposes timestamped geometry without continuous visibility claims', async()=>{
 const server=await createFixtureServer(mkdtempSync(join(tmpdir(),'nightsky-orientation-')));
 try{
  const response=await server.rpc('tools/call',{name:'get_target_visibility',arguments:{placeId:'place:v1:geonames:990001',targetQuery:'Jupiter',window:{startUtc:'2026-10-15T18:00:00Z',endUtc:'2026-10-16T06:00:00Z',timeZone:'Europe/London'}}});
  const samples=response.result.structuredContent.orientationSamples;
  assert.equal(samples.length,3);
  const text=response.result.content.map((r:any)=>r.text??'').join('\n');
  assert.match(text,/returned instants only/);
  assert.match(text,/true north/);
  assert.match(text,/terrain/);
  assert.equal(server.externalAttempts(),0);
 }finally{await server.close();}
});


test('bounded plan retains viewing window and limitations before optional orientation',async()=>{
 const {planAnswerText}=await import('../../server/mcp/answerText');
 const server=await createFixtureServer(mkdtempSync(join(tmpdir(),'nightsky-orientation-budget-')));
 try{
  const response=await server.rpc('tools/call',{name:'plan_observing_session',arguments:{placeId:'place:v1:geonames:990001',activity:'planet-observing',target:'Jupiter',window:{startUtc:'2026-10-15T18:00:00Z',endUtc:'2026-10-16T06:00:00Z',timeZone:'Europe/London'}}});
  const plan=response.result.structuredContent;
  plan.summary='context '.repeat(350);
  plan.evidence.astronomy=undefined;
  plan.evidence.weather={...plan.evidence.weather,forecasts:[]};
  plan.candidateWindows=[{window:plan.requestedWindow,localStart:'ESSENTIAL_START',localEnd:'ESSENTIAL_END',darknessOverlapIntervals:[{localStart:'DARK_START',localEnd:'DARK_END'}]}];
  plan.gaps=['ESSENTIAL LIMITATION'];
  const text=planAnswerText(plan);
  assert.match(text,/ESSENTIAL_START to ESSENTIAL_END/);
  assert.match(text,/DARK_START to DARK_END/);
  assert.match(text,/ESSENTIAL LIMITATION/);
 }finally{await server.close();}
});


test('plan foreground exposes exact cloud rows and reuses suggested Moon/Saturn orientation samples',async()=>{
 const {planAnswerText}=await import('../../server/mcp/answerText');
 const server=await createFixtureServer(mkdtempSync(join(tmpdir(),'nightsky-time-bound-')));
 try{
  const response=await server.rpc('tools/call',{name:'plan_observing_session',arguments:{placeId:'place:v1:geonames:990001',activity:'visual-stargazing',window:{startUtc:'2026-10-18T15:00:00Z',endUtc:'2026-10-18T18:00:00Z',timeZone:'Europe/London'}}});
  const plan=response.result.structuredContent;plan.requestedWindow.timeZone='Asia/Kolkata';
  plan.evidence.weather.window=plan.requestedWindow;
  plan.evidence.weather.forecasts=[{source:{name:'MET Norway',dataClass:'forecast'},availability:{status:'partial'},samples:[{validAt:'2026-10-18T17:00:00.000Z',values:{totalCloudCover:{value:18,unit:'%'}}}],missingFields:[]}];
  plan.suggestions=['Moon','Saturn'].map((name,i)=>({target:{targetId:`body:${name.toLowerCase()}`,name},sources:[],orientationSamples:[{atUtc:'2026-10-18T16:30:00.000Z',localTime:'Oct 18, 2026, 22:00 (Asia/Kolkata)',altitudeDegrees:i?66.8:21.4,azimuthDegrees:i?131.1:234.3}]}));
  const before=JSON.stringify(plan),text=planAnswerText(plan,{includeSourceLinks:false});
  assert.match(text,/22:30.*17:00:00.000Z.*totalCloudCover 18 %/);
  assert.match(text,/Moon at .*22:00.*16:30:00.000Z.*21.4/);assert.match(text,/Saturn at .*22:00.*16:30:00.000Z.*66.8/);
  assert.doesNotMatch(text,/Time-specific orientation samples unavailable/);assert.equal(JSON.stringify(plan),before);
 }finally{await server.close();}
});


test('plan byte cap includes omission notice and newline separators',async()=>{
 const {planAnswerText}=await import('../../server/mcp/answerText');
 const plan:any={summary:'Summary',place:{sources:[]},sources:[],requestedWindow:{startUtc:'2026-10-18T15:00:00Z',endUtc:'2026-10-18T18:00:00Z',timeZone:'Asia/Kolkata'},evidence:{},suggestions:[],candidateWindows:[],gaps:[]};
 for(let width=150;width<210;width++){
  plan.gaps=Array.from({length:50},()=> 'x'.repeat(width));
  const text=planAnswerText(plan,{includeSourceLinks:false});
  assert.ok(Buffer.byteLength(text)<=8000,`width ${width}, bytes ${Buffer.byteLength(text)}`);
  assert.match(text,/Further intervals/);
 }
});


test('target answer labels cutoffs and unknown legacy boundaries without claiming rise or set',async()=>{
 const {orientationAnswerText}=await import('../../server/mcp/answerText');
 const target:any={target:{name:'Milky Way core'},intervals:[{localStart:'21:00',localEnd:'05:00',startBoundary:'horizon-crossing',endBoundary:'requested-window'}]};
 const text=orientationAnswerText(target);
 assert.match(text,/requested-window cutoff/);assert.match(text,/calculated geometric horizon crossing/);assert.match(text,/not a useful-altitude/);
 delete target.intervals[0].startBoundary;delete target.intervals[0].endBoundary;
 assert.match(orientationAnswerText(target),/boundary unknown/);
});


test('meteor timing brief preserves exact versus calendar precision and dated radiant samples',async()=>{
 const {meteorTimingAnswerText}=await import('../../server/mcp/answerText');
 const plan:any={goal:'meteor-shower',requestedWindow:{timeZone:'Asia/Kolkata'},evidence:{events:{events:[{name:'Geminids',eventType:'meteor-shower',peakUtc:'2026-12-14T06:00:00Z',source:{name:'Exact source'}},{name:'Geminids',eventType:'meteor-shower',peakCalendarDateWindow:{startDate:'2026-12-13',endDate:'2026-12-14'},source:{name:'Calendar source'}}]},meteorRadiantSamples:[{status:'available',code:'GEM',evaluatedAt:'2026-12-13T18:00:00Z',altitudeDeg:12,moonAltitudeDeg:5,source:{vintage:'fixture'},annualExtrapolation:true}]}};
 const text=meteorTimingAnswerText(plan,'Geminids').join('\n');
 assert.match(text,/2026-12-14T06:00:00Z/);assert.match(text,/2026-12-13 to 2026-12-14/);assert.match(text,/date-only; timezone basis not established/);assert.match(text,/12.0 degrees/);assert.match(text,/annual extrapolation/);assert.match(text,/not a local observing window/);
 assert.doesNotMatch(text,/meteors per hour|best window/);
 assert.doesNotMatch(meteorTimingAnswerText(plan,'Unknown shower').join('\n'),/Radiant sample|Radiant GEM/);
 assert.match(text,/GEM.*fixture/);
 assert.ok(Buffer.byteLength(text)<=1800);
});
