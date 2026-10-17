import { calculationPlaceSchema, type CalculationPlace } from "../../../shared/nightsky/discovery";
import { createHash } from "node:crypto";
import { aggregateDarkCloudSamples, statisticsForBin, summarizeMonth, type ClimateAggregate } from "../../../scripts/era5/aggregate";
import { climateContextResultSchema, CLIMATE_METHOD_VERSION } from "../../../shared/nightsky/climate";
import { utcInstantSchema } from "../../../shared/nightsky/common";
import { decodeOpenMeteoHistory, type HistoryPartition, type HistoryPoint } from "./openMeteoHistoryContract";
import { OPEN_METEO_HISTORY_METHOD as METHOD } from "./openMeteoHistoryMethod";
export interface RetainedHistoryChunk { partition: HistoryPartition; bytes: Uint8Array; retrievedAt: string }
export interface HostedHistoryOptions { timeZone: string; startNight: string; endNight: string; maxHours: number; maxRetainedBytes: number; maxElapsedMs: number }
export type HostedHistoryAggregate = Omit<ClimateAggregate,"methodVersion"> & { methodVersion: typeof METHOD.methodVersion; sourceId: typeof METHOD.sourceId; historicalAdmission: false; cacheKey: string; requestedPoint: HistoryPoint; receipts: {sha256:string; requestUrl:string; retrievedAt:string}[] };
/** Offline only: decode one retained chunk at a time, with independent astronomy clock. */
export function aggregateHostedHistory(chunks: Iterable<RetainedHistoryChunk>, options: HostedHistoryOptions): HostedHistoryAggregate {
  for (const limit of [options.maxHours,options.maxRetainedBytes,options.maxElapsedMs]) if (!Number.isSafeInteger(limit)||limit<1) throw Error("Invalid history budget");
  if(options.maxHours>263088 || options.maxRetainedBytes>128*1024*1024 || options.maxElapsedMs>300000) throw Error("History budget exceeds bounded integration limits");
  const clockHours=(Date.parse(`${options.endNight}T00:00:00Z`)-Date.parse(`${options.startNight}T00:00:00Z`))/3600000+120;
  if(!Number.isFinite(clockHours)||clockHours>options.maxHours)throw Error("History astronomy clock budget exceeded");
  const started=performance.now();
  let hours=0,bytes=0,previousEnd=-Infinity,cell:HistoryPoint|undefined,requested: string|undefined;
  const receipts: HostedHistoryAggregate["receipts"]=[];
  const check=()=>{if(performance.now()-started>options.maxElapsedMs)throw Error("History elapsed budget exceeded");};
  function* samples(){
    const input=chunks[Symbol.iterator]();
    try { for(let item=input.next();!item.done;item=input.next()){
      const chunk=item.value;
      check(); utcInstantSchema.parse(chunk.retrievedAt);
      hours+=chunk.partition.expectedHours; bytes+=chunk.bytes.byteLength;
      if(hours>options.maxHours||bytes>options.maxRetainedBytes)throw Error("History input budget exceeded");
      if(chunk.partition.startUnixSeconds<previousEnd)throw Error("History partition overlap or order mismatch");
      const point=JSON.stringify(chunk.partition.requestedPoint);
      if(requested!==undefined&&point!==requested)throw Error("History requested point drift");
      requested=point;
      const decoded=decodeOpenMeteoHistory(chunk.bytes,chunk.partition,cell);
      if(decoded.actualCell.latitude!==chunk.partition.requestedPoint.latitude||decoded.actualCell.longitude!==chunk.partition.requestedPoint.longitude)throw Error("Offline preview requires exact requested grid-cell match; nearest mapping is not admitted");
      cell=decoded.actualCell; previousEnd=chunk.partition.endUnixSeconds;
      receipts.push({sha256:decoded.receipt.sha256,requestUrl:decoded.receipt.requestUrl,retrievedAt:chunk.retrievedAt});
      for(const sample of decoded.samples)yield {atUtc:new Date(sample.unixSeconds*1000).toISOString(),cloudFraction:sample.cloudFraction};
    }
    } finally { input.return?.(); }
  }
  const iterator=samples(); const first=iterator.next();
  if(first.done||!cell)throw Error("No retained history samples");
  function* all(){try {yield first.value!; for(let item=iterator.next();!item.done;item=iterator.next())yield item.value;} finally {iterator.return(undefined);}}
  const mapping={...cell,cellId:`open-meteo:${cell.latitude}:${cell.longitude}`,timeZone:options.timeZone};
  let aggregate: ClimateAggregate;
  try { aggregate=aggregateDarkCloudSamples(all(),mapping,{startNight:options.startNight,endNight:options.endNight},check); } finally { iterator.return(undefined); }
  const identity={sourceId:METHOD.sourceId,methodVersion:METHOD.methodVersion,mapping,period:aggregate.period,receipts,astronomyVersion:aggregate.astronomyVersion,timezoneVersion:aggregate.timezoneVersion};
  return {...aggregate,methodVersion:METHOD.methodVersion,sourceId:METHOD.sourceId,historicalAdmission:false,requestedPoint:JSON.parse(requested!),receipts,cacheKey:createHash("sha256").update(JSON.stringify(identity)).digest("hex")};
}
export function hostedHistoryUnavailable(placeId:string,month:number,timeZone:string){
  return climateContextResultSchema.parse({schemaVersion:2,placeId,month,timeZone,dataClass:"reanalysis",historicalLabel:"historical-not-a-forecast",methodVersion:METHOD.methodVersion,sampleDefinition:"hourly-dark-time-samples",unit:"fraction",period:{...METHOD.baseline,kind:"baseline-1991-2020"},availability:{status:"unavailable",reason:"The exact 1991–2020 hosted baseline is not acquired or production admitted."},sources:[{name:"Open-Meteo Historical Weather",url:"https://open-meteo.com/en/docs/historical-weather-api",attribution:"ERA5 via Open-Meteo; hosted percent quantization; scientific deployed revision unverified.",dataClass:"reanalysis",model:"era5",modified:true}],caveats:["Hosted quantized method is distinct from native ERA5 dark-cloud-v1. No baseline numerical statistics are available."]});
}
/** Explicit offline preview provider; baseline aggregates remain unavailable until separate admission. */
function serveHostedHistorySample(aggregate:HostedHistoryAggregate,placeId:string,month:number){
  const fallback=hostedHistoryUnavailable(placeId,month,aggregate.mapping.timeZone);
  if(aggregate.period.kind!=="sample-only")return fallback;
  const {quality,...summary}=summarizeMonth({...aggregate,methodVersion:CLIMATE_METHOD_VERSION},month);
  // Summary year guard is independent of individual UTC-bin guards.
  summary.badYearCount=aggregate.yearMonthly.filter(year=>{const row=year[month-1]!;return row.expected>0&&row.valid/row.expected<0.8;}).length;
  return climateContextResultSchema.parse({...fallback,period:aggregate.period,availability:{status:summary.expectedEligibleSamples?"partial":"not-covered",reason:"Offline sample-only hosted preview; not the 1991–2020 baseline and not production admitted."},grid:{mapping:"nearest-supplied-cell",cellId:aggregate.mapping.cellId,spacingDegrees:0.25,displacementKm:111.195*Math.hypot(aggregate.mapping.latitude-aggregate.requestedPoint.latitude,(aggregate.mapping.longitude-aggregate.requestedPoint.longitude)*Math.cos(aggregate.requestedPoint.latitude*Math.PI/180)),placeIndexVintage:"offline-cell-preview"},summary,bins:Array.from({length:24},(_,utcHour)=>({utcHour,statistics:statisticsForBin(aggregate.bins[(month-1)*24+utcHour]!)})),caveats:["Sample-only preview for the exact requested point; displacement is latitude-scaled angular approximation.","Integer-percent hosted quantization; native ERA5 threshold equivalence is unsupported.",`Build rules: ${aggregate.astronomyVersion}; ${aggregate.timezoneVersion}. Receipt set: ${aggregate.cacheKey}.`]});
}


/** Injection seam shared by MCP and planner; never fetches or rebuilds during a request. */
export function createHostedHistoryPreviewProvider(aggregate: HostedHistoryAggregate) {
  // Snapshot avoids later caller mutation changing a configured provider's point binding.
  const retained=structuredClone(aggregate);
  return {async getClimatology(placeId:string,month:number,point?:CalculationPlace){
    const parsed=point?calculationPlaceSchema.parse(point):undefined;
    if(!parsed||parsed.placeId!==placeId||parsed.latitude!==retained.requestedPoint.latitude||parsed.longitude!==retained.requestedPoint.longitude||parsed.displayTimeZone!==retained.mapping.timeZone)
      return climateContextResultSchema.parse({...hostedHistoryUnavailable(placeId,month,parsed?.displayTimeZone??retained.mapping.timeZone),...(parsed?.placeId===placeId&&parsed.sourceRevision?{sourceRevision:parsed.sourceRevision}:{})});
    return climateContextResultSchema.parse({...serveHostedHistorySample(retained,placeId,month),...(parsed.sourceRevision?{sourceRevision:parsed.sourceRevision}:{})});
  }};
}
