import assert from "node:assert/strict";
import test from "node:test";
import express from "express";
import { createServer } from "node:http";
import { once } from "node:events";
import { mountMcpRoute } from "../../server/mcp/route";
import { GeoNamesPlaceIndex } from "../../server/places/geonames";
import { assertStructuredResultSize } from "../../shared/nightsky/common";

const cities = [
  [1, "London", 51.5, -.12, "Europe/London", "GB"],
  [2, "Sydney", -33.87, 151.21, "Australia/Sydney", "AU"],
  [3, "Tromso", 69.65, 18.96, "Europe/Oslo", "NO"],
] as const;
const index = new GeoNamesPlaceIndex(cities.map(([geonameId,name,latitude,longitude,timeZone,countryCode]) => ({geonameId,name,asciiName:name,alternateNames:"",latitude,longitude,timeZone,countryCode,countryName:countryCode,featureClass:"P",featureCode:"PPL",population:100000,modificationDate:"2026-10-01"})), "offline-journey-fixture");
const journeys = [
  ["casual sky gazer", "general-stargazing", 1, undefined, "suggestions"],
  ["curious beginner", "learning", 2, undefined, "learning"],
  ["family educator", "general-stargazing", 1, undefined, "family"],
  ["urban observer", "planet-observing", 1, "Jupiter", "target"],
  ["meteor watcher", "meteor-shower", 1, "Orionids", "radiant"],
  ["Milky Way photographer", "astrophotography", 2, "Milky Way core", "target"],
  ["first astrophotography learner", "astrophotography", 2, undefined, "gear"],
  ["visual telescope observer", "visual-stargazing", 1, "Jupiter", "target"],
  ["deep sky imager", "deep-sky-imaging", 2, "M31", "unsupported"],
  ["planet Moon observer", "moon-observing", 1, "Moon", "target"],
  ["aurora chaser", "aurora", 3, undefined, "aurora"],
  ["eclipse observer", "eclipse", 2, undefined, "eclipse"],
  ["months ahead traveler", "general-stargazing", 2, undefined, "season"],
  ["observer replanning", "general-stargazing", 1, undefined, "replan"],
  ["mobility access needs", "general-stargazing", 1, undefined, "access"],
] as const;

test("all fifteen product journeys return validated source-linked offline MCP evidence and explicit boundaries", async t => {
  let revision = 0;
  const app = express(); app.use(express.json());
  mountMcpRoute(app, {allowedHosts:["127.0.0.1"], placeIndex:index, maxRequestsPerWindow:200, maxGlobalRequestsPerWindow:200,
    osmCandidateIndexLoader:async()=>undefined,
    plannerServices:{getClimatology:async()=>{throw new Error("Offline historical context unavailable");}},
    auroraProvider:async()=>{throw new Error("Offline aurora unavailable");},
    fetcher:async()=>{throw new Error("External network forbidden in offline journey fixtures");},
    weatherProvider:{ getForecast: async (_place, requested) => requested.startUtc.startsWith("2027") ? {status:"out-of-horizon",reason:"No offline forecast for months ahead"} : ({status:"available",reason:"Offline fixture",forecast:{availability:{status:"available",reason:"Offline fixture"},source:{name:"Offline model",url:"https://example.test/model",attribution:"Offline fixture",dataClass:"forecast",issuedAt:revision ? "2026-10-15T15:00:00Z" : "2026-10-15T12:00:00Z"},forecastHorizonHours:48,samples:[{validAt:"2026-10-15T22:00:00Z",values:{totalCloudCover:{value:revision?85:12,unit:"%"}}}],missingFields:[{field:"visibility",reason:"Not supplied"}]}})},
  });
  const server=createServer(app); server.listen(0,"127.0.0.1"); await once(server,"listening");
  const address=server.address(); assert.ok(address&&typeof address!=="string");
  let id=0;
  async function request(method:string,params?:unknown) {
    const response=await fetch(`http://127.0.0.1:${address.port}/mcp`,{method:"POST",headers:{"content-type":"application/json",accept:"application/json, text/event-stream","mcp-protocol-version":"2025-11-25"},body:JSON.stringify({jsonrpc:"2.0",id:++id,method,params})});
    assert.equal(response.status,200);
    const text=await response.text(); const line=text.split("\n").find(line=>line.startsWith("data: ")); assert.ok(line,text);
    const payload=JSON.parse(line.slice(6)); assert.equal(payload.error,undefined); return payload.result;
  }
  async function call(name:string,args:unknown) {const result=await request("tools/call",{name,arguments:args}); assert.equal(result.isError,undefined,JSON.stringify(result)); assertStructuredResultSize(result.structuredContent); return result.structuredContent;}
  try {
    await request("initialize",{protocolVersion:"2025-11-25",capabilities:{},clientInfo:{name:"offline-journeys",version:"1"}});
    for(const [name,activity,city,target,expected] of journeys) await t.test(name,async()=>{
      const resolved=await call("resolve_place",{placeQuery:cities[city-1]![1]}); const place=resolved.matches[0]; assert.ok(place);
      const window={startUtc:expected==="season"?"2027-02-15T18:00:00Z":"2026-10-15T18:00:00Z",endUtc:expected==="season"?"2027-02-16T06:00:00Z":"2026-10-16T06:00:00Z",timeZone:place.timeZone};
      const args={placeId:place.placeId,window,activity,target,experience:"beginner"};
      const result=await call("plan_observing_session",args);
      assert.ok(result.sources.every((source:any)=>source.url&&source.attribution)); assert.ok(result.gaps.length); assert.equal(result.availability.status,"partial");
      assert.equal(result.factors.some((factor:any)=>/polar/i.test(factor.name)),false);
      assert.ok(result.candidateWindows.every((candidate:any)=>candidate.score===undefined));
      if(expected==="suggestions") assert.ok(result.suggestions.length>=1&&result.suggestions.length<=3);
      if(expected==="learning") {assert.ok(result.sources.some((source:any)=>/NASA|ESO/.test(source.name))); assert.ok(result.preparation.some((step:string)=>/south|Southern/.test(step)));}
      if(expected==="family") assert.ok(result.timedPreparation.some((step:any)=>/Families|children/.test(step.instruction)));
      if(expected==="target") assert.ok(result.evidence.target.target.name);
      if(expected==="radiant") assert.ok(result.evidence.meteorRadiantSamples.length);
      if(expected==="gear") {assert.ok(result.preparation.some((step:string)=>/camera|lens|device/i.test(step))); assert.ok(result.gaps.some((gap:string)=>/seeing/.test(gap)));}
      if(expected==="unsupported") assert.ok(result.gaps.some((gap:string)=>/target.*unsupported/i.test(gap)));
      if(expected==="aurora") assert.ok(result.gaps.some((gap:string)=>/aurora/i.test(gap)));
      if(expected==="eclipse") assert.ok(result.preparation.some((step:string)=>/ISO 12312-2/.test(step)));
      if(expected==="season") {assert.ok(result.gaps.some((gap:string)=>/historical/i.test(gap))); assert.ok(result.gaps.some((gap:string)=>/forecast|horizon/i.test(gap)));}
      if(expected==="replan") {revision=1; const updated=await call("plan_observing_session",args); assert.equal(updated.evidence.weather.forecasts[0].samples[0].values.totalCloudCover.value,85); assert.equal(updated.evidence.weather.forecasts[0].source.issuedAt,"2026-10-15T15:00:00Z"); revision=0;}
      if(expected==="access") {assert.equal(result.evidence.location.access.status,"unknown"); assert.ok(result.gaps.some((gap:string)=>/access/.test(gap)));}
    });
    await t.test("polar summer never invents a dark window",async()=>{
      const result=await call("plan_observing_session",{placeId:"place:v1:geonames:3",activity:"general-stargazing",window:{startUtc:"2026-06-21T18:00:00Z",endUtc:"2026-06-22T06:00:00Z",timeZone:"Europe/Oslo"}});
      assert.equal(result.evidence.astronomy.darknessState,"none"); assert.equal(result.candidateWindows.length,0);
    });
    await t.test("five options retain missing future forecasts through MCP",async()=>{
      const options=Array.from({length:5},(_,i)=>({placeId:"place:v1:geonames:1",activity:i===4?"astrophotography":"general-stargazing",window:{startUtc:i===4?"2027-02-15T18:00:00Z":"2026-10-15T18:00:00Z",endUtc:i===4?"2027-02-16T06:00:00Z":"2026-10-16T06:00:00Z",timeZone:"Europe/London"}}));
      const result=await call("compare_observing_options",{options}); assert.equal(result.comparisons.length,5); assert.equal(result.comparisons[4].evidence.weather.forecasts.length,0); assert.ok(result.comparisons[4].gaps.some((gap:string)=>/forecast/i.test(gap))); assert.ok(result.comparisons[0].evidence.weather.forecasts[0].source.issuedAt);
    });
  } finally {server.close();await once(server,"close");}
});
