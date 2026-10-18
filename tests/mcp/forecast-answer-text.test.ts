import test from 'node:test';
import assert from 'node:assert/strict';
import {forecastAnswerText} from '../../server/mcp/forecastAnswerText';
import type {NightConditionsResult} from '../../shared/nightsky/weather';
const window={startUtc:'2026-10-18T15:00:00.000Z',endUtc:'2026-10-18T18:00:00.000Z',timeZone:'Asia/Kolkata'};
const source=(name:string)=>({name,url:'https://example.test/weather',attribution:'Synthetic test',dataClass:'forecast' as const});
const forecast=(name:string,points:[string,number][])=>({source:source(name),availability:{status:'partial',reason:'Synthetic'},samples:points.map(([validAt,value])=>({validAt,values:{totalCloudCover:{value,unit:'%'}}})),missingFields:[],forecastHorizonHours:24});
const result=(forecasts:any[],extra:any={})=>({window,forecasts,...extra}) as NightConditionsResult;

test('Hyderabad rows bind each provider value to exact native UTC and local time without invented slots',()=>{
 const data=result([forecast('MET Norway',[['2026-10-18T15:00:00.000Z',80.5],['2026-10-18T16:00:00.000Z',47.7],['2026-10-18T17:00:00.000Z',18],['2026-10-18T18:00:00.000Z',30.5]]),forecast('WeatherAPI',[['2026-10-18T15:30:00.000Z',62],['2026-10-18T16:30:00.000Z',6],['2026-10-18T17:30:00.000Z',50]]),forecast('OpenWeather',[['2026-10-18T15:00:00.000Z',100],['2026-10-18T18:00:00.000Z',77]])]);
 const before=JSON.stringify(data),lines=forecastAnswerText(data),text=lines.join('\n');
 for(const [provider,utc,local,value] of [['MET Norway','15:00','20:30','80.5'],['MET Norway','16:00','21:30','47.7'],['MET Norway','17:00','22:30','18'],['WeatherAPI','16:30','22:00','6'],['OpenWeather','18:00','23:30','77']])assert.ok(lines.some(l=>l.includes(provider)&&l.includes(`T${utc}:00.000Z`)&&l.includes(local)&&l.includes(`totalCloudCover ${value} %`)),`${provider} ${local}`);
 assert.doesNotMatch(text,/totalCloudCover 25 %|interpolated value/);assert.match(text,/not continuous/);assert.equal(JSON.stringify(data),before);
});

test('quarter-hour zones and repeated DST hours retain their UTC identity',()=>{
 const ktm=result([forecast('A',[['2026-10-18T18:30:00.000Z',12]])],{window:{startUtc:'2026-10-18T18:00:00Z',endUtc:'2026-10-18T19:00:00Z',timeZone:'Asia/Kathmandu'}});
 assert.match(forecastAnswerText(ktm).join('\n'),/Oct 19, 2026, 00:15.*18:30:00.000Z/);
 const dst=result([forecast('A',[['2026-11-01T05:30:00.000Z',10],['2026-11-01T06:30:00.000Z',90]])],{window:{startUtc:'2026-11-01T05:00:00Z',endUtc:'2026-11-01T07:00:00Z',timeZone:'America/New_York'}});
 const rows=forecastAnswerText(dst).filter(l=>l.includes('totalCloudCover'));assert.equal(rows.length,2);assert.ok(rows.every(l=>l.includes('01:30')));assert.ok(rows[0].includes('05:30:00.000Z'));assert.ok(rows[1].includes('06:30:00.000Z'));
});

test('instant and category evidence is selected by instant; aggregates retain positively overlapping original bounds',()=>{
 const f:any=forecast('A',[['2026-10-18T14:00:00.000Z',99],['2026-10-18T16:00:00.000Z',10]]);
 f.samples[0].values.totalCloudCover.periodStartUtc='2026-10-18T14:00:00.000Z';f.samples[0].values.totalCloudCover.periodEndUtc='2026-10-18T16:00:00.000Z';
 f.samples[0].bands={totalCloudCover:{code:4,range:'75–100',unit:'%'}};f.samples[1].bands={totalCloudCover:{code:1,range:'0–6',unit:'%'}};
 f.samples.push({validAt:'2026-10-18T13:00:00.000Z',values:{totalCloudCover:{value:55,unit:'%',periodStartUtc:'2026-10-18T14:00:00.000Z',periodEndUtc:window.startUtc}}});
 const text=forecastAnswerText(result([f])).join('\n');assert.match(text,/aggregate.*14:00:00.000Z.*16:00:00.000Z/);assert.match(text,/category 1/);assert.doesNotMatch(text,/category 4|totalCloudCover 55/);assert.match(text,/totalCloudCover 10 %/);
});

test('failed providers, stale rows, and unknown cloud remain distinct from omitted rows',()=>{
 const f:any=forecast('Old',[['2026-10-18T16:00:00.000Z',10]]);f.availability.status='stale';
 const unknown:any=forecast('Unknown',[]);unknown.samples=[{validAt:window.startUtc,values:{temperature:{value:20,unit:'celsius'}}}];
 const text=forecastAnswerText(result([f,unknown],{providerOutcomes:[{providerId:'openweather',status:'unavailable',reason:'Synthetic unavailable',source:source('Failed')}]})).join('\n');
 assert.match(text,/Old.*stale/);assert.match(text,/Old.*stale.*totalCloudCover/);assert.match(text,/Failed.*unavailable/);assert.match(text,/Unknown.*cloud unknown/);assert.doesNotMatch(text,/Unknown.*omitted/);
});

test('long multi-provider output reserves all statuses and exact omissions without partial rows',()=>{
 const fs=Array.from({length:4},(_,i)=>forecast(`Provider ${i} ${'星'.repeat(100)}`,Array.from({length:48},(_,n)=>[new Date(Date.parse(window.startUtc)+n*60000).toISOString(),n] as [string,number])));
 const lines=forecastAnswerText(result(fs,{providerOutcomes:fs.map((f,i)=>({providerId:['met','weatherapi','openweather','seventimer'][i],source:f.source,status:'unavailable',reason:'Synthetic failure'}))})),text=lines.join('\n');assert.ok(Buffer.byteLength(text)<=3200);
 for(let i=0;i<4;i++){assert.match(text,new RegExp(`Provider ${i}.*status partial`));assert.match(text,new RegExp(`Provider ${i}.*omitted [0-9]+`));}
 for(const row of lines.filter(l=>l.includes('totalCloudCover')))assert.match(row,/\(instant\)$/);
 assert.doesNotMatch(text,/Best window:|Clearest:/);
});
