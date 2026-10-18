/** Static MCP Apps resource: no network, cookies, storage or tool invocation. */
export const RESULT_CARD_HTML=String.raw`<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>NightSky planning result</title><style>
:root{color-scheme:light dark;font-family:system-ui,sans-serif}*{box-sizing:border-box}body{margin:0;padding:18px;color:light-dark(#172331,#edf2f7);background:light-dark(#fff,#141b25);font-size:14px;line-height:1.5;overflow-wrap:anywhere}h1{font-size:19px;margin:2px 0 5px}h2{font-size:13px;margin:0 0 10px}.brand{font-size:11px;letter-spacing:.12em;text-transform:uppercase;color:light-dark(#526579,#abbcd0)}p{margin:8px 0}.session{font-size:12px;color:light-dark(#526579,#abbcd0)}dl{display:grid;grid-template-columns:minmax(100px,1fr) 2fr;gap:8px 12px;padding:12px 0;border-block:1px solid light-dark(#dde4eb,#354355)}dt{font-weight:600}dd{margin:0}details{margin:14px 0}summary{cursor:pointer;font-weight:600}#detail-lines p{white-space:pre-wrap}footer{margin-top:16px;padding-top:12px;border-top:1px solid light-dark(#dde4eb,#354355);font-size:12px}ul{padding-left:18px;margin:6px 0}li{margin:7px 0}a{color:light-dark(#075bb5,#9dcbff)}a:focus-visible,summary:focus-visible{outline:2px solid currentColor;outline-offset:3px}.note{font-size:12px;color:light-dark(#526579,#abbcd0)}[hidden]{display:none!important}@media(max-width:380px){body{padding:12px}dl{grid-template-columns:1fr;gap:3px}dd{margin-bottom:7px}}
</style></head><body><main>
<div class="brand">NightSky.earth</div><p id="status" role="status">Waiting for the planning result. The complete text response remains available in chat.</p>
<article id="card" hidden><h1 id="place"></h1><p id="session" class="session"></p><p id="summary"></p><dl id="facts"></dl>
<details><summary>Calculated values and limitations</summary><div id="detail-lines"></div></details>
<p class="note">Calculated opportunities and modelled conditions do not verify access, safety or visibility. Recheck conditions before travelling.</p>
<footer><h2>Data credits</h2><ul id="credits"></ul></footer></article></main>
<script>
(()=>{'use strict';
 const byId=id=>document.getElementById(id);let ready=false,closed=false,observer;
 const status=byId('status'),card=byId('card');
 const clear=message=>{card.hidden=true;status.hidden=false;status.textContent=message;for(const id of ['place','session','summary','facts','detail-lines','credits'])byId(id).replaceChildren();};
 const safeUrl=value=>{if(typeof value!=='string')throw Error();const url=new URL(value);if(!['https:','http:'].includes(url.protocol)||url.username||url.password)throw Error();return url.href;};
 const text=(value,max)=>{if(typeof value!=='string'||!value.trim()||value.length>max)throw Error();return value;};
 const link=(label,url)=>{const a=document.createElement('a');a.textContent=label;a.href=safeUrl(url);a.target='_blank';a.rel='noopener noreferrer';return a;};
 const render=result=>{
  clear('The result card is unavailable. Use the text result and its source credits.');
  try{
   if(!result||result.isError===true) return;
   const data=result._meta&&result._meta.nightskyResultCard;
   if(!data||data.status!=='available'||data.schemaVersion!==1||new TextEncoder().encode(JSON.stringify(data)).byteLength>32768)return;
   if(!Array.isArray(data.facts)||data.facts.length>8||!Array.isArray(data.sources)||!data.sources.length||data.sources.length>256)throw Error();
   const facts=document.createDocumentFragment(),credits=document.createDocumentFragment(),lines=document.createDocumentFragment();
   for(const fact of data.facts){const dt=document.createElement('dt'),dd=document.createElement('dd');dt.textContent=text(fact.label,100);dd.textContent=text(fact.value,2000);facts.append(dt,dd);}
   for(const source of data.sources){const li=document.createElement('li');li.append(link(text(source.name,160),source.url),document.createTextNode(': '+text(source.attribution,2000)));if(source.modified===true)li.append(document.createTextNode(' Source record marks data modified.'));if(source.licenseUrl)li.append(document.createTextNode(' '),link('Licence',source.licenseUrl));credits.append(li);}
   for(const line of text(data.details,24000).split('\n')){const p=document.createElement('p');p.textContent=line;lines.append(p);}
   const place=text(data.place,160),session=text(data.session,2000),summary=text(data.summary,2000);
   byId('place').textContent=place;byId('session').textContent=session;byId('summary').textContent=summary;byId('facts').append(facts);byId('detail-lines').append(lines);byId('credits').append(credits);
   status.hidden=true;card.hidden=false;
  }catch{clear('The result card is unavailable. Use the text result and its source credits.');}
 };
 const notify=(method,params)=>window.parent.postMessage({jsonrpc:'2.0',method,params},'*');
 let lastHeight=0;
 const reportSize=()=>{if(!ready||!document.body||!document.body.getBoundingClientRect)return;const height=Math.ceil(document.body.getBoundingClientRect().height);if(height>0&&height<=30000&&height!==lastHeight){lastHeight=height;notify('ui/notifications/size-changed',{height});}};
 if(typeof ResizeObserver==='function'){observer=new ResizeObserver(reportSize);observer.observe(document.body);}
 const timer=setTimeout(()=>{if(!ready)clear('This host has not connected the result card. Use the complete text response in chat.');},5000);
 window.addEventListener('message',event=>{
  if(event.source!==window.parent||!event.data||event.data.jsonrpc!=='2.0')return;
  const message=event.data;
  if(closed)return;
  if(message.method==='ui/resource-teardown'){
   clearTimeout(timer);ready=false;closed=true;if(observer)observer.disconnect();clear('This planning card has closed.');window.parent.postMessage({jsonrpc:'2.0',id:message.id,result:{}},'*');return;
  }
  if(message.id===1&&message.method===undefined){
   if(ready)return;
   clearTimeout(timer);
   if(message.error||!message.result||message.result.protocolVersion!=='2026-01-26'){clear('This host could not connect the result card. Use the text response in chat.');return;}
   ready=true;notify('ui/notifications/initialized',{});reportSize();return;
  }
  if(ready&&message.method==='ui/notifications/tool-result')render(message.params);
  if(ready&&message.method==='ui/notifications/tool-input')clear('Updating the planning result. The previous card has been cleared.');
  if(ready&&message.method==='ui/notifications/tool-cancelled')clear('This planning request was cancelled. Use the conversation for the latest result.');
 },{passive:true});
 if(window.parent!==window)window.parent.postMessage({jsonrpc:'2.0',id:1,method:'ui/initialize',params:{appInfo:{name:'nightsky-planning-card',version:'0.1.0'},appCapabilities:{availableDisplayModes:['inline']},protocolVersion:'2026-01-26'}},'*');
})();
</script></body></html>`;
