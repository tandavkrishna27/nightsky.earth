import test from 'node:test';
import assert from 'node:assert/strict';
import {runInNewContext} from 'node:vm';
import {RESULT_CARD_HTML} from '../../server/mcp/resultCardView';

class Element{
 children:Element[]=[];hidden=false;value='';href='';target='';rel='';
 constructor(public tag='div'){}
 set textContent(value:string){this.children=[];this.value=value;}
 get textContent():string{return this.value+this.children.map(c=>c.textContent).join('');}
 append(...nodes:Element[]){for(const node of nodes)if(node.tag==='fragment')this.children.push(...node.children);else this.children.push(node);}
 replaceChildren(){this.children=[];this.value='';}
}
function harness(){
 const ids=new Map<string,Element>();for(const id of ['status','card','place','session','summary','facts','detail-lines','credits'])ids.set(id,new Element());
 ids.get('card')!.hidden=true;
 const sent:any[]=[];let listener:(event:any)=>void=()=>{},timeout=()=>{};
 const parent={postMessage:(message:any)=>sent.push(message)};
 const window={parent,addEventListener:(_type:string,fn:any)=>{listener=fn;}};
 const document={getElementById:(id:string)=>ids.get(id),createElement:(tag:string)=>new Element(tag),createDocumentFragment:()=>new Element('fragment'),createTextNode:(s:string)=>{const el=new Element('text');el.textContent=s;return el;}};
 const script=RESULT_CARD_HTML.match(/<script>([\s\S]*?)<\/script>/)![1];
 runInNewContext(script,{window,document,URL,TextEncoder,setTimeout:(fn:any)=>{timeout=fn;return 1;},clearTimeout:()=>{}});
 const send=(message:any,source:any=parent)=>listener({source,data:{jsonrpc:'2.0',...message}});
 return {ids,sent,send,timeout:()=>timeout(),initialize:()=>send({id:1,result:{protocolVersion:'2026-01-26'}})};
}
const payload=()=>({status:'available',schemaVersion:1,place:'Hyderabad',session:'13–14 December2026 IST',summary:'Conditional observing opportunity.',facts:[{label:'Moon',value:'18.9%; impact unknown'}],details:'Cloud forecast unavailable.\nNo confirmed site access.',sources:[{name:'GeoNames',url:'https://www.geonames.org/',attribution:'GeoNames. Modified by NightSky.earth.',modified:true,licenseUrl:'https://creativecommons.org/licenses/by/4.0/'}]});
const result=(data:any)=>({method:'ui/notifications/tool-result',params:{_meta:{nightskyResultCard:data}}});

test('card handshake precedes rendering and foreign frames cannot replace the result',()=>{
 const h=harness();assert.equal(h.sent[0].method,'ui/initialize');
 h.send(result(payload()));assert.equal(h.ids.get('card')!.hidden,true);
 h.initialize();assert.equal(h.sent[1].method,'ui/notifications/initialized');
 h.send(result(payload()),{});assert.equal(h.ids.get('card')!.hidden,true);
 h.send(result(payload()));assert.equal(h.ids.get('card')!.hidden,false);
 assert.equal(h.ids.get('place')!.textContent,'Hyderabad');
 assert.equal(h.ids.get('credits')!.children.length,1);
 assert.equal(h.ids.get('credits')!.children[0].children[0].href,'https://www.geonames.org/');
 assert.match(h.ids.get('credits')!.textContent,/Modified by NightSky/);
 assert.equal(h.sent.length,2,'rendering makes no tool, network or permission request');
});

test('card treats markup as text, preserves distinct same-URL credits and never activates unsafe links',()=>{
 const h=harness();h.initialize();const data=payload();data.place='<img src=x onerror=alert(1)>';data.summary='<script>danger()</script>';
 data.sources.push({...data.sources[0],attribution:'Another dataset at the same URL.'});
 h.send(result(data));assert.equal(h.ids.get('place')!.textContent,data.place);assert.equal(h.ids.get('credits')!.children.length,2);
 for(const url of ['javascript:alert(1)','https://user:secret@example.test/','not-a-url']){
  h.send(result({...data,sources:[{...data.sources[0],url}]}));assert.equal(h.ids.get('card')!.hidden,true);assert.equal(h.ids.get('credits')!.children.length,0);
 }
 h.send(result(data));h.send({method:'ui/notifications/tool-result',params:{isError:true,_meta:{nightskyResultCard:data}}});assert.equal(h.ids.get('card')!.hidden,true);
 h.send(result(data));h.send(result({...data,sources:[]}));assert.equal(h.ids.get('card')!.hidden,true);
 h.send(result(data));h.send({method:'ui/notifications/tool-input',params:{}});assert.equal(h.ids.get('card')!.hidden,true);
});

test('card clears stale data on missing, oversized and failed results, and bridge timeout is honest',()=>{
 const h=harness();h.initialize();
 for(const invalid of [undefined,{status:'unavailable'}, {...payload(),summary:'x'.repeat(40000)}]){
  h.send(result(payload()));h.send(result(invalid));assert.equal(h.ids.get('card')!.hidden,true);assert.equal(h.ids.get('place')!.textContent,'');
 }
 const disconnected=harness();disconnected.timeout();assert.match(disconnected.ids.get('status')!.textContent,/host has not connected/);
 const failed=harness();failed.send({id:1,error:{code:-1}});failed.send(result(payload()));assert.equal(failed.ids.get('card')!.hidden,true);
});

test('card closes on standard teardown id1, cancellation clears results, and UTF8 limits count bytes',()=>{
 const h=harness();h.initialize();h.send(result(payload()));
 h.send({method:'ui/notifications/tool-cancelled',params:{reason:'cancelled'}});assert.equal(h.ids.get('card')!.hidden,true);
 h.send(result(payload()));h.send({id:1,method:'ui/resource-teardown',params:{reason:'closed'}});
 assert.equal(h.ids.get('card')!.hidden,true);assert.deepEqual(JSON.parse(JSON.stringify(h.sent.at(-1))),{jsonrpc:'2.0',id:1,result:{}});
 h.send(result(payload()));assert.equal(h.ids.get('card')!.hidden,true);
 const bytes=harness();bytes.initialize();bytes.send(result({...payload(),details:'🌌'.repeat(10000)}));assert.equal(bytes.ids.get('card')!.hidden,true);
});

test('card renders long bounded evidence without imposing a smaller field budget than its producer',()=>{
 const h=harness();h.initialize();
 const data={...payload(),details:'Evidence '.repeat(2700),facts:[{label:'Astronomical darkness',value:'Calculated interval; '.repeat(120)}]};
 assert.ok(new TextEncoder().encode(JSON.stringify(data)).byteLength<32768);
 h.send(result(data));
 assert.equal(h.ids.get('card')!.hidden,false,'a producer-sized card must not fall back because details exceed 24000 characters or one fact exceeds 2000');
 assert.equal(h.ids.get('detail-lines')!.textContent,data.details);
 assert.equal(h.ids.get('credits')!.children.length,1);
});

test('visible credits collapse only identical displayed notices and combine evidence roles',()=>{
 const h=harness();h.initialize();const data=payload();
 data.sources.push({...data.sources[0],issuedAt:'2026-10-19T00:00:00Z'} as any);
 h.send(result({...data,sourceUses:[['location'],['history-reference']]}));
 assert.equal(h.ids.get('credits')!.children.length,1);
 assert.match(h.ids.get('credits')!.textContent,/Location evidence/);
 assert.match(h.ids.get('credits')!.textContent,/Historical reference; no historical values supplied/);
 h.send(result({...data,sourceUses:[['location'],['reference']]}));
 assert.match(h.ids.get('credits')!.textContent,/Location evidence; Additional reference\/context/);
 assert.doesNotMatch(h.ids.get('credits')!.textContent,/contribution to displayed values not established/,'an additional reference must not negate an established location role');
 const distinct={...data.sources[0],licenseUrl:'https://example.test/other-licence'};
 h.send(result({...data,sources:[...data.sources,distinct],sourceUses:[['location'],['history-reference'],['reference']]}));
 assert.equal(h.ids.get('credits')!.children.length,2,'different licence links must remain separate');
 for(const sourceUses of [[['made-up-role'],['location']],[],[['location']], [[],['location']], [['location'],'reference'],null]){
  h.send(result({...data,sourceUses}));assert.equal(h.ids.get('card')!.hidden,false,'malformed role metadata must not hide valid raw notices');
  assert.match(h.ids.get('credits')!.textContent,/Source use not classified/);
  assert.doesNotMatch(h.ids.get('credits')!.textContent,/Location evidence/);
 }
 h.send(result({...data,sources:[data.sources[0],{...data.sources[0],modified:false}],sourceUses:[['location'],['reference']]}));
 assert.equal(h.ids.get('credits')!.children.length,2,'different modification notices remain separate');
 h.send(result(payload()));assert.match(h.ids.get('credits')!.textContent,/Source use not classified/,'old schemaVersion1 payload is honest and renderable');
});
