import type {NightConditionsResult} from '../../shared/nightsky/weather';
import {formatLocalInstant} from '../../shared/nightsky/format';

const MAX_BYTES=3200,MAX_ROWS=6;
// Serve the unaltered official white logo from our website so chat hosts can render it reliably.
export const OPENWEATHER_BRAND_LOGO_URL='https://nightsky.earth/openweather-logo.png';
const plain=(s:string)=>s.replace(/[\\[\]<>`*_~|\r\n]/g,' ').replace(/\s+/g,' ').trim();
const name=(s:string)=>{const chars=Array.from(plain(s));return chars.slice(0,24).join('')+(chars.length>24?'...':'');};

/** Pure display projection: never interpolate, rank, re-time or mutate provider evidence. */
export function forecastAnswerText(result:NightConditionsResult,options:{omitOpenWeather?:boolean}={}):string[]{
 const zone=result.window.timeZone,start=Date.parse(result.window.startUtc),end=Date.parse(result.window.endUtc);
 const local=(utc:string)=>`${formatLocalInstant(utc,zone,'en')} [UTC ${utc}]`;
 const displayedForecasts=options.omitOpenWeather?result.forecasts.filter(f=>f.source.name!=='OpenWeather'||f.source.url!=='https://openweathermap.org/api/forecast5'):result.forecasts;
 const groups=displayedForecasts.map((forecast,index)=>{
  const issued=forecast.source.issuedAt,issueLabel=issued&&issued.length>48?'see structuredContent (timestamp omitted)':issued??'unknown';
  const label=`F${index+1} ${name(forecast.source.name)}`,status=forecast.availability.status,rows:{at:number;text:string}[]=[];
  for(const sample of forecast.samples){
   const at=Date.parse(sample.validAt),inside=at>=start&&at<=end,value=sample.values.totalCloudCover,band=sample.bands?.totalCloudCover;
   if(value){
    const a=value.periodStartUtc,b=value.periodEndUtc;
    if(a&&b){if(Date.parse(b)>start&&Date.parse(a)<end)rows.push({at:Date.parse(a),text:`${label} [${status}] | aggregate ${local(a)} to ${local(b)} | totalCloudCover ${value.value} ${plain(value.unit)} (native anchor UTC ${sample.validAt})`});}
    else if(inside)rows.push({at,text:`${label} [${status}] | ${local(sample.validAt)} | totalCloudCover ${value.value} ${plain(value.unit)} (instant)`});
   }
   if(band&&inside)rows.push({at,text:`${label} [${status}] | ${local(sample.validAt)} | totalCloudCover category ${band.code}: ${plain(band.range)} ${plain(band.unit)} (instant category, not numeric cloud percentage)`});
  }
  rows.sort((a,b)=>a.at-b.at);
  const selected=rows.length<=MAX_ROWS?rows:[...rows.slice(0,3),...rows.slice(-3)];
  return {label,rows,selected,shown:0,header:`Forecast ${index+1}: ${label}; status ${status}; issued ${issueLabel}; ${rows.length?`${rows.length} relevant cloud entries`:'cloud unknown (no relevant cloud entries)'}; ${forecast.missingFields.slice(0,3).map(f=>`${f.field} unknown`).join('; ')}.`};
 });
 const weatherApi=displayedForecasts.find(f=>f.source.name==='WeatherAPI.com'&&f.source.url==='https://www.weatherapi.com/docs/forecast-api/'&&['available','partial'].includes(f.availability.status)&&f.samples.length>0);
 const openWeather=displayedForecasts.find(f=>f.source.name==='OpenWeather'&&f.source.url==='https://openweathermap.org/api/forecast5'&&['available','partial'].includes(f.availability.status)&&f.samples.length>0);
 const openWeatherCredit=openWeather?`OpenWeather visible attribution for every answer using its forecast: [Weather data provided by OpenWeather](https://openweathermap.org/) ![OpenWeather logo](<${OPENWEATHER_BRAND_LOGO_URL}>). Preserve both the linked text and rendered logo beside the forecast; a sources page alone is insufficient.`:undefined;
 const headers=['Cloud evidence: exact native instants/periods only; not continuous coverage. Hourly point samples do not establish cloud conditions between them or a weather-supported best observing time. Do not suggest an in-between time range from nearby samples, move values between times, interpolate, or average providers.',...groups.map(g=>g.header),...(weatherApi?[`WeatherAPI.com weather notice: ${plain(weatherApi.source.attribution)}`]:[]),...(openWeatherCredit?[openWeatherCredit]:[]),...(result.providerOutcomes??[]).map(o=>`Provider outcome: ${o.providerId} (${name(o.source.name)}); status ${o.status}.`)];
 const omitted=(g:typeof groups[number],count:number)=>`${g.label}: omitted ${count} cloud entries from this text; full timestamped evidence remains in structuredContent.`;
 // Reserve complete metadata and worst-case omission notes before any data row.
 const reserved=groups.filter(g=>g.rows.length).reduce((n,g)=>n+Buffer.byteLength(omitted(g,g.rows.length)+'\n'),0);
 const lines=[...headers];let bytes=Buffer.byteLength(lines.join('\n')+'\n');
 for(let slot=0;slot<MAX_ROWS;slot++)for(const g of groups){const row=g.selected[slot];if(!row)continue;const size=Buffer.byteLength(row.text+'\n');if(bytes+size+reserved<=MAX_BYTES){lines.push(row.text);bytes+=size;g.shown++;}}
 for(const g of groups)if(g.shown<g.rows.length)lines.push(omitted(g,g.rows.length-g.shown));
 if(!groups.length)lines.push(options.omitOpenWeather?'OpenWeather sample values appear in the branded card only if its official logo loads.':'Cloud unknown in this response: no forecast samples returned. This response does not invalidate earlier timestamped evidence, if any; retain its original times and status, with current freshness unverified.');
 return lines;
}
