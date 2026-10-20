/** Static MCP Apps resource: no network, cookies, storage or tool invocation. */
export const RESULT_CARD_HTML=String.raw`<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>NightSky planning result</title><style>
:root{color-scheme:light dark;font-family:system-ui,sans-serif}*{box-sizing:border-box}body{margin:0;padding:18px;color:light-dark(#172331,#edf2f7);background:light-dark(#fff,#141b25);font-size:14px;line-height:1.5;overflow-wrap:anywhere}h1{font-size:19px;margin:2px 0 5px}h2{font-size:13px;margin:0 0 10px}.brand{font-size:11px;letter-spacing:.12em;text-transform:uppercase;color:light-dark(#526579,#abbcd0)}p{margin:8px 0}.session{font-size:12px;color:light-dark(#526579,#abbcd0)}dl{display:grid;grid-template-columns:minmax(100px,1fr) 2fr;gap:8px 12px;padding:12px 0;border-block:1px solid light-dark(#dde4eb,#354355)}dt{font-weight:600}dd{margin:0}details{margin:14px 0}summary{cursor:pointer;font-weight:600}#detail-lines p{white-space:pre-wrap}.openweather-credit{display:flex;flex-wrap:wrap;align-items:center;gap:12px}.openweather-credit img{display:block;flex:none}footer{margin-top:16px;padding-top:12px;border-top:1px solid light-dark(#dde4eb,#354355);font-size:12px}ul{padding-left:18px;margin:6px 0}li{margin:7px 0}a{color:light-dark(#075bb5,#9dcbff)}a:focus-visible,summary:focus-visible{outline:2px solid currentColor;outline-offset:3px}.note{font-size:12px;color:light-dark(#526579,#abbcd0)}[hidden]{display:none!important}@media(max-width:380px){body{padding:12px}dl{grid-template-columns:1fr;gap:3px}dd{margin-bottom:7px}}
</style></head><body><main>
<div class="brand">NightSky.earth</div><p id="status" role="status">Waiting for the planning result. The complete text response remains available in chat.</p>
<article id="card" hidden><h1 id="place"></h1><p id="session" class="session"></p><p id="summary"></p><dl id="facts"></dl>
<p id="openweather-status" class="note" hidden>OpenWeather card values are hidden until its official logo loads.</p>
<section id="openweather" hidden aria-label="OpenWeather forecast evidence"><h2>OpenWeather forecast samples</h2><div id="openweather-rows"></div><p class="openweather-credit"><a id="openweather-credit" href="https://openweathermap.org/" target="_blank" rel="noopener noreferrer">Weather data provided by OpenWeather</a><img id="openweather-logo" alt="OpenWeather logo" width="118" height="28"></p><p id="openweather-notice" class="note"></p></section>
<details><summary>Calculated values and limitations</summary><div id="detail-lines"></div></details>
<p class="note">Calculated opportunities and modelled conditions do not verify access, safety or visibility. Recheck conditions before travelling.</p>
<footer><h2>Data credits</h2><ul id="credits"></ul></footer></article></main>
<script>
(()=>{'use strict';
 const byId=id=>document.getElementById(id);let ready=false,closed=false,observer;
 const status=byId('status'),card=byId('card');
 const clear=message=>{card.hidden=true;status.hidden=false;status.textContent=message;byId('openweather').hidden=true;byId('openweather-status').hidden=true;const logo=byId('openweather-logo');logo.onload=null;logo.onerror=null;logo.removeAttribute('src');for(const id of ['place','session','summary','facts','detail-lines','credits','openweather-rows','openweather-notice'])byId(id).replaceChildren();};
 const safeUrl=value=>{if(typeof value!=='string')throw Error();const url=new URL(value);if(!['https:','http:'].includes(url.protocol)||url.username||url.password)throw Error();return url.href;};
 // The complete UTF8 payload is already bounded to 32KiB; do not add smaller field limits that reject producer-accepted evidence.
 const text=value=>{if(typeof value!=='string'||!value.trim())throw Error();return value;};
 const link=(label,url)=>{const a=document.createElement('a');a.textContent=label;a.href=safeUrl(url);a.target='_blank';a.rel='noopener noreferrer';return a;};
 const render=result=>{
  clear('The result card is unavailable. Use the text result and its source credits.');
  try{
   if(!result||result.isError===true) return;
   const data=result._meta&&result._meta.nightskyResultCard;
   if(!data||data.status!=='available'||data.schemaVersion!==1||new TextEncoder().encode(JSON.stringify(data)).byteLength>32768)return;
   if(!Array.isArray(data.facts)||data.facts.length>8||!Array.isArray(data.sources)||!data.sources.length||data.sources.length>256)throw Error();
   const facts=document.createDocumentFragment(),credits=document.createDocumentFragment(),lines=document.createDocumentFragment();
   for(const fact of data.facts){const dt=document.createElement('dt'),dd=document.createElement('dd');dt.textContent=text(fact.label);dd.textContent=text(fact.value);facts.append(dt,dd);}
   const roleLabels={location:'Location evidence',calculation:'Calculated values',forecast:'Cloud samples/periods relevant to the requested session',history:'Historical sample values (not a forecast)','history-reference':'Historical reference; no historical values supplied',reference:'Reference/context; contribution to displayed values not established'};
   const classified=Array.isArray(data.sourceUses)&&data.sourceUses.length===data.sources.length&&data.sourceUses.every(roles=>Array.isArray(roles)&&roles.length>0&&roles.length<=6&&roles.every(role=>Object.prototype.hasOwnProperty.call(roleLabels,role)));
   const visible=new Map();
   data.sources.forEach((source,index)=>{
    const name=text(source.name),notice=text(source.attribution),url=safeUrl(source.url),licence=source.licenseUrl?safeUrl(source.licenseUrl):undefined;
    const roles=classified?data.sourceUses[index]:['unclassified'];
    // Collapse only the exact displayed notice/link/modification identity; raw records stay in the payload.
    const key=JSON.stringify([name,notice,url,licence,source.modified===true]);
    if(!visible.has(key))visible.set(key,{name,notice,url,licence,modified:source.modified===true,roles:new Set()});
    for(const role of roles)visible.get(key).roles.add(role);
   });
   for(const row of visible.values()){
    const li=document.createElement('li');li.append(link(row.name,row.url),document.createTextNode(': '+row.notice));if(row.modified)li.append(document.createTextNode(' Source record marks data modified.'));if(row.licence)li.append(document.createTextNode(' '),link('Licence',row.licence));
    const use=document.createElement('p');use.className='note';use.textContent='Use: '+Array.from(row.roles,role=>role==='unclassified'?'Source use not classified':role==='reference'&&row.roles.size>1?'Additional reference/context':roleLabels[role]).join('; ')+'.';li.append(use);credits.append(li);
   }
   for(const line of text(data.details).split('\n')){const p=document.createElement('p');p.textContent=line;lines.append(p);}
   const place=text(data.place),session=text(data.session),summary=text(data.summary);
   byId('place').textContent=place;byId('session').textContent=session;byId('summary').textContent=summary;byId('facts').append(facts);byId('detail-lines').append(lines);byId('credits').append(credits);
   const ow=data.openWeather;
   if(ow){
    if(!Array.isArray(ow.samples)||ow.samples.length<1||ow.samples.length>6||ow.logoUrl!=='https://nightsky.earth/openweather-logo.png')throw Error();
    const rows=document.createDocumentFragment();
    for(const sample of ow.samples){const p=document.createElement('p');p.textContent=text(sample.time)+' — '+text(sample.cloud);rows.append(p);}
    byId('openweather-rows').append(rows);byId('openweather-notice').textContent=text(ow.notice);
    byId('openweather-status').hidden=false;
    const img=byId('openweather-logo');img.onload=()=>{byId('openweather-status').hidden=true;byId('openweather').hidden=false;reportSize();};
    img.onerror=()=>{byId('openweather-status').textContent='OpenWeather logo could not load; forecast values are hidden in this card.';reportSize();};
    img.src=ow.logoUrl;
   }
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
