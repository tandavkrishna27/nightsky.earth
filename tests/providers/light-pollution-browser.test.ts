import test from 'node:test';
import assert from 'node:assert/strict';
import { parseLightpollutionmapEvidence, BrowserBoundary, isPublicAddress, validateResourceUrl, decodeBrowserRequest } from '../../server/providers/lightPollution/browser';
const point={candidateId:'a',latitude:12.345678,longitude:76.543219};
// Synthetic visible popup text. This is not a claim about the live site's labels.
const text='Coordinates: 12.345678, 76.543219\nLayer: World Atlas 2015\nYear: 2015\nSQM: 21.7\nBortle: 8-9\nAttribution: Synthetic model owner';
const evidence={text,previousText:'',fresh:true,selectedCount:1};
test('exact fresh selected coordinates retain model and class range',()=>{
 const r=parseLightpollutionmapEvidence(point,evidence); assert.equal(r.sqm,21.7); assert.deepEqual(r.bortleClasses,[8,9]); assert.equal(r.dataset.year,2015);
});
for(const [name,patch] of Object.entries({stale:{fresh:false},unchanged:{previousText:text},ambiguous:{selectedCount:2},rounded:{text:text.replace('12.345678, 76.543219','12.35, 76.54')},mismatch:{text:text.replace('12.345678','12.345679')},missingLayer:{text:text.replace('Layer: World Atlas 2015\n','')},missingYear:{text:text.replace('Year: 2015\n','')},changedLabel:{text:text.replace('SQM:','Brightness:').replace('Bortle:','Class:')},malformed:{text:text.replace('21.7','NaN').replace('8-9','10')},challenge:{text:'Verify you are human CAPTCHA'}})){
 test(`rejects ${name} evidence without metrics`,()=>{const r=parseLightpollutionmapEvidence(point,{...evidence,...patch});assert.equal(r.status,'unavailable');assert.equal(r.sqm,null);assert.equal(r.bortleClasses,null);});
}
test('identical rounded labels cannot bind nearby distinct points',()=>{
 const e={...evidence,text:text.replace('12.345678, 76.543219','12.35, 76.54')};
 for(const p of [point,{...point,latitude:12.345679}])assert.equal(parseLightpollutionmapEvidence(p,e).sqm,null);
});
test('strict protocol disallows URL, scripts, invalid coordinates and oversized lines',()=>{
 const request={requestId:'abc',sourceId:'lightpollutionmap',points:[point]};assert.equal(decodeBrowserRequest(JSON.stringify(request)).requestId,'abc');
 for(const v of [{...request,url:'https://example.org'}, {...request,points:[{...point,latitude:91}]}]) assert.throws(()=>decodeBrowserRequest(JSON.stringify(v)));
 assert.throws(()=>decodeBrowserRequest(' '.repeat(17000)));
});
test('network policy blocks private IPv4, IPv6, mapped, and unlisted origins',async()=>{
 for(const ip of ['127.0.0.1','10.0.0.1','169.254.1.2','0.0.0.0','224.0.0.1','::1','::','fc00::1','fe80::1','::ffff:127.0.0.1','2001:db8::1']) assert.equal(isPublicAddress(ip),false,ip);
 assert.equal(isPublicAddress('8.8.8.8'),true);assert.equal(isPublicAddress('2606:4700:4700::1111'),true);
 assert.equal(await validateResourceUrl('https://www.lightpollutionmap.info/',async()=>['8.8.8.8']),true);
 assert.equal(await validateResourceUrl('https://www.lightpollutionmap.info/',async()=>['127.0.0.1']),false);
 assert.equal(await validateResourceUrl('https://evil.example/',async()=>['8.8.8.8']),false);
});
test('disabled/public-unadmitted boundary never starts optional worker',async()=>{
 const b=new BrowserBoundary();assert.equal((await b.compare([point]))[0].errorCode,'browser_not_admitted');b.close();
});
test('one comparison runs, two queue, fourth is busy; queued deadline includes waiting',async()=>{
 const b=new BrowserBoundary({enabled:true,run:async(_p,s)=>new Promise((_,reject)=>s.addEventListener('abort',()=>reject(Error('aborted')),{once:true})),comparisonMs:35,pointMs:100});
 const jobs=[b.compare([point]),b.compare([point]),b.compare([point])];assert.equal((await b.compare([point]))[0].errorCode,'browser_busy');
 const all=await Promise.all(jobs);for(const rows of all)assert.equal(rows[0].errorCode,'browser_timeout');b.close();
});
test('partial completion survives deadline, cancellation, crash and next comparison recovers',async()=>{
 let crash=true;
 const b=new BrowserBoundary({enabled:true,comparisonMs:100,pointMs:20,run:async(p,s)=>{if(p.candidateId==='slow')return new Promise((_,reject)=>s.addEventListener('abort',()=>reject(Error('aborted')),{once:true}));if(crash){crash=false;throw Error('private details');}return parseLightpollutionmapEvidence(p,evidence);}});
 assert.equal((await b.compare([point]))[0].errorCode,'browser_worker_failed');
 const rows=await b.compare([point,{...point,candidateId:'slow'}]);assert.equal(rows[0].sqm,21.7);assert.equal(rows[1].errorCode,'browser_timeout');
 const c=new AbortController();const pending=b.compare([{...point,candidateId:'slow'}],c.signal);c.abort();assert.equal((await pending)[0].errorCode,'browser_cancelled');
 assert.equal((await b.compare([point]))[0].sqm,21.7);b.close();
});

test('child process returns bounded admission response without Playwright or Chromium',async()=>{
 const {runBrowserChild}=await import('../../server/providers/lightPollution/browser');
 const c=new AbortController();const timer=setTimeout(()=>c.abort(),2000);
 try{const r=await runBrowserChild(point,c.signal);assert.equal(r.errorCode,'browser_not_admitted');assert.equal(r.sqm,null);}finally{clearTimeout(timer);}
});
test('supported visible actions wait for changed selected popup and reject previous popup',async()=>{
 const {readLightpollutionmapPage}=await import('../../scripts/light-pollution-browser-worker');
 let reads=0;const actions:string[]=[];
 const page={locator:(selector:string)=>({fill:async(value:string)=>{actions.push(selector+'='+value);},press:async(value:string)=>{actions.push(value);},count:async()=>1,isVisible:async()=>true,innerText:async()=>{reads++;return reads<3?'old popup':text;}})};
 const r=await readLightpollutionmapPage(page,point,new AbortController().signal,100);
 assert.equal(r.sqm,21.7);assert.deepEqual(actions,['#searchBox=12.345678, 76.543219','Enter']);
 const stale={locator:()=>({fill:async()=>{},press:async()=>{},count:async()=>1,isVisible:async()=>true,innerText:async()=>text})};
 assert.equal((await readLightpollutionmapPage(stale,point,new AbortController().signal,10)).sqm,null);
});

test('synthetic HTML selected card excludes conflicting hover values',async()=>{
 // Local hand-authored HTML, not copied provider layout or map data.
 const html='<section id="hover">SQM: 15</section><section id="popup">'+text.replaceAll('\n','<br>')+'</section>';
 const selected=/<section id="popup">([\s\S]*?)<\/section>/.exec(html)![1].replaceAll('<br>','\n');
 assert.equal(parseLightpollutionmapEvidence(point,{...evidence,text:selected}).sqm,21.7);
});
test('worker exits on oversized protocol and parent pipe disappearance',async()=>{
 const {spawn}=await import('node:child_process');const {fileURLToPath}=await import('node:url');const {browserWorkerUrl,credentialFreeBrowserEnvironment}=await import('../../server/providers/lightPollution/browser');
 for(const payload of [' '.repeat(17000),'']){const child=spawn(process.execPath,[fileURLToPath(browserWorkerUrl)],{stdio:['pipe','pipe','pipe'],env:credentialFreeBrowserEnvironment(),windowsHide:true});
 const exited=new Promise<number|null>((resolve,reject)=>{child.once('exit',code=>resolve(code));child.once('error',reject);});child.stdin.on('error',()=>{});child.stdin.end(payload);assert.equal(await exited,payload?2:0);}
});
test('browser deadline does not block independent event loop work',async()=>{
 const b=new BrowserBoundary({enabled:true,pointMs:30,run:async()=>new Promise(()=>{})});const pending=b.compare([point]);let served=false;await new Promise<void>(resolve=>setImmediate(()=>{served=true;resolve();}));assert.equal(served,true);assert.equal((await pending)[0].errorCode,'browser_timeout');b.close();
});

test('one scheduler caps comparisons across both browser sources',async()=>{
 const {createLightPollutionBrowserProviders}=await import('../../server/providers/lightPollution/browser');const runtime=createLightPollutionBrowserProviders({NIGHTSKY_LIGHT_POLLUTION_BROWSER_ENABLED:'true'});
 assert.equal(runtime.boundaries.lightpollutionmap,runtime.boundaries.darkskysites);await runtime.close();
});
test('boundary rejects runner evidence assigned to the wrong candidate',async()=>{
 const b=new BrowserBoundary({enabled:true,run:async()=>({...parseLightpollutionmapEvidence(point,evidence),candidateId:'wrong'})});
 assert.equal((await b.compare([point]))[0].errorCode,'browser_protocol_invalid');b.close();
});
