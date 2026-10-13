import assert from "node:assert/strict";
import {createHash} from "node:crypto";
import {mkdir, readFile, writeFile} from "node:fs/promises";
import {resolve} from "node:path";
import {getMetNorwayForecast, type MetForecastCache} from "../server/providers/weather/metNorway";
import {UpstreamControls} from "../server/providers/upstreamControls";

assert.ok(process.argv.includes("--live"), "Explicit --live required.");
const userAgent = process.env.MET_NORWAY_USER_AGENT;
assert.ok(userAgent, "Set the owner-controlled MET contact identity.");
const directory = resolve(".data/met/source-coverage");
await mkdir(directory, {recursive:true});
const controls = new UpstreamControls({providerConcurrency:1, maxResponseBytes:1024*1024});
const entries = new Map<string,{value:unknown;expiresAt:number}>();
const cache: MetForecastCache = {
 async get<T>(key:string) {return entries.get(key) as {value:T;expiresAt:number}|undefined;},
 async set<T>(key:string,value:T,ttlMs:number) {entries.set(key,{value,expiresAt:Date.now()+ttlMs});},
};
const points = [
 {key:"longyearbyen", label:"Longyearbyen named Arctic reference", latitude:78.2232,longitude:15.6469,timeZone:"Arctic/Longyearbyen"},
 {key:"north-atlantic-point", label:"North Atlantic ocean coordinate; no named-place resolution claimed",latitude:40,longitude:-30,timeZone:"UTC"},
];
let sourceCalls=0;
const report:any={retrievedAt:new Date().toISOString(),source:"MET Norway Locationforecast 2.0 complete",points:[],sourceCalls:0};
for (const point of points) {
 const file = resolve(directory,point.key+".json");
 const url=`https://api.met.no/weatherapi/locationforecast/2.0/complete?lat=${point.latitude.toFixed(4)}&lon=${point.longitude.toFixed(4)}`;
 let stored:any;
 try {stored=JSON.parse(await readFile(file,"utf8"));
 assert.equal(createHash("sha256").update(JSON.stringify(stored.payload)).digest("hex"),stored.sha256);
 entries.set(url,{value:{payload:stored.payload,lastModified:stored.lastModified},expiresAt:Date.parse(stored.expires??"") || 0});
 } catch(error:any) {if(error.code!=="ENOENT") throw error;}
 const callsBefore=sourceCalls;
 let evidence:any=stored;
 const fetcher:typeof fetch=async(input,init)=>{
 assert.ok(sourceCalls<2,"Maximum two upstream GETs per invocation."); sourceCalls++;
 const response=await fetch(input,init);
 // Shared controls enforce decoded-body bytes and deadline before adapter parsing.
 evidence={retrievedAt:new Date().toISOString(),status:response.status,lastModified:response.headers.get("Last-Modified")??stored?.lastModified,expires:response.headers.get("Expires"),sentIfModifiedSince:new Headers(init?.headers).get("If-Modified-Since")};
 return response;
 };
 const window={startUtc:new Date().toISOString(),endUtc:new Date(Date.now()+24*3600000).toISOString(),timeZone:point.timeZone};
 const result=await getMetNorwayForecast({...point,placeId:`source-check:${point.key}`},window,{userAgent,cache,controls,fetcher});
 const entry=entries.get(url) as any;
 if (sourceCalls>callsBefore && entry && [200,203,304].includes(evidence.status)) {
 evidence.payload=entry.value.payload;
 evidence.sha256=createHash("sha256").update(JSON.stringify(evidence.payload)).digest("hex");
 await writeFile(file,JSON.stringify(evidence,null,2));
 }
 const first=evidence?.payload?.properties?.timeseries?.[0];
 report.points.push({...point,url,status:result.status,reusedFreshSnapshot:sourceCalls===callsBefore,headers:{status:evidence?.status,lastModified:evidence?.lastModified,expires:evidence?.expires},retrievedAt:evidence?.retrievedAt,sha256:evidence?.sha256,issuedAt:result.forecast?.source.issuedAt,validStartUtc:result.forecast?.source.validStartUtc,validEndUtc:result.forecast?.source.validEndUtc,samples:result.forecast?.samples.length,missingFields:result.forecast?.missingFields,instantFields:Object.keys(first?.data?.instant?.details??{}),periods:Object.keys(first?.data??{}).filter(key=>key!=="instant"),conditionalRefresh:sourceCalls===callsBefore?"Skipped before actual provider expiry":evidence?.sentIfModifiedSince?`Conditional request returned ${evidence.status}`:"Initial request; conditional refresh requires a later invocation after actual Expires"});
}
report.sourceCalls=sourceCalls;
await writeFile(resolve(directory,"report.json"),JSON.stringify(report,null,2));
console.log(JSON.stringify(report,null,2));
