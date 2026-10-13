import {createRequire} from "node:module";
import {readFileSync} from "node:fs";
import type * as AstronomyTypes from "astronomy-engine";
import * as z from "zod4";
const Astronomy=createRequire(import.meta.url)("astronomy-engine") as typeof AstronomyTypes;
const finite=z.number().finite();
const uncertaintySchema=z.object({longitudeInterceptDeg:finite.positive(),longitudeSlopeDegPerSolarDeg:finite.positive(),latitudeInterceptDeg:finite.positive(),latitudeSlopeDegPerSolarDeg:finite.positive()});
const rowSchema=z.object({code:z.string(),name:z.string(),referenceSolarLongitudeDeg:finite.min(0).max(360),longitudeInterceptDeg:finite,longitudeSlopeDegPerSolarDeg:finite,latitudeInterceptDeg:finite,latitudeSlopeDegPerSolarDeg:finite,nominalFitDays:finite.positive(),uncertainty:uncertaintySchema});
const catalogSchema=z.object({vintage:z.string(),sourceUrl:z.string().url(),licenseUrl:z.literal("https://creativecommons.org/licenses/by/4.0/"),attribution:z.string(),frame:z.literal("J2000 mean ecliptic; Sun-centered geocentric radiant"),observationStart:z.string(),observationEnd:z.string(),localCalculationYears:z.object({first:z.number().int(),last:z.number().int()}),fitWindowConversionDegPerDay:finite.positive(),rows:z.array(rowSchema).length(12)});
// Match the project's existing event-catalog path: production starts at project
// root, while bundled import.meta.url belongs to dist/index.js.
const catalog=catalogSchema.parse(JSON.parse(readFileSync("data/events/meteor-radiants-gmn-2021.json","utf8")));
if(new Set(catalog.rows.map(row=>row.code)).size!==12) throw new TypeError("Duplicate radiant catalog code.");
export interface RadiantObserver {latitude:number;longitude:number;height?:number;}
export interface RadiantEvidence {
 status:"available"; code:string; evaluatedAt:string; solarLongitudeJ2000Deg:number; referenceSolarLongitudeDeg:number; signedSolarOffsetDeg:number;
 eclipticLongitudeJ2000Deg:number;eclipticLatitudeJ2000Deg:number;rightAscensionJ2000Deg:number;declinationJ2000Deg:number;
 altitudeDeg:number;azimuthDeg:number;moonSeparationDeg:number;moonAltitudeDeg:number;
 radiantDirection:"geocentric mean radiant rotated to equatorial of date; no zenith attraction or refraction";
 moonDirection:"topocentric equatorial of date; no atmospheric refraction";
 modelValidSolarOffsetDeg:{min:number;max:number};parameterUncertainty:z.infer<typeof uncertaintySchema>;
 source:{url:string;licenseUrl:string;attribution:string;vintage:string;modified:true;}; annualExtrapolation:boolean;caveat:string;
}
export type RadiantResult=RadiantEvidence | {status:"outside-model"|"unsupported";code:string;reason:string;};
const wrap=(angle:number)=>((angle%360)+360)%360;
const signedOffset=(angle:number)=>wrap(angle+180)-180;
function checkedDate(value:Date|string|number):Date {
 const date=value instanceof Date?new Date(value.getTime()):new Date(value);
 if(!Number.isFinite(date.getTime())) throw new TypeError("Invalid radiant evaluation date.");
 return date;
}
/** Geometric heliocentric Earth direction reversed into the Sun, fixed J2000
 * mean ecliptic frame. Do not substitute apparent solar longitude of date. */
export function solarLongitudeJ2000(value:Date|string|number):number {
 const date=checkedDate(value);
 const earth=Astronomy.HelioVector(Astronomy.Body.Earth,date);
 const ecliptic=Astronomy.RotateVector(Astronomy.Rotation_EQJ_ECL(),earth);
 return wrap(Math.atan2(ecliptic.y,ecliptic.x)*180/Math.PI+180);
}
/** Internal planning approximation only: no activity season/rate or forecast peak. */
export function evaluateRadiant(code:string,value:Date|string|number,place:RadiantObserver):RadiantResult {
 const date=checkedDate(value);
 if(!Number.isFinite(place.latitude)||Math.abs(place.latitude)>90||!Number.isFinite(place.longitude)||Math.abs(place.longitude)>180||!Number.isFinite(place.height??0)||Math.abs(place.height??0)>10000) throw new TypeError("Invalid radiant observer.");
 const row=catalog.rows.find(entry=>entry.code===code);
 if(!row) return {status:"unsupported",code,reason:"No reviewed radiant model exists for this shower code."};
 const year=date.getUTCFullYear();
 if(year<catalog.localCalculationYears.first||year>catalog.localCalculationYears.last) return {status:"outside-model",code,reason:"Outside the prototype's reviewed calendar evaluation bound (2018-2030)."};
 const solarLongitudeJ2000Deg=solarLongitudeJ2000(date);
 const offset=signedOffset(solarLongitudeJ2000Deg-row.referenceSolarLongitudeDeg);
 const half=row.nominalFitDays*catalog.fitWindowConversionDegPerDay/2;
 if(Math.abs(offset)>half) return {status:"outside-model",code,reason:"Outside the source's nominal radiant fit window; no seasonal extrapolation was made."};
 const eclipticLongitudeJ2000Deg=wrap(solarLongitudeJ2000Deg+row.longitudeInterceptDeg+row.longitudeSlopeDegPerSolarDeg*offset);
 const eclipticLatitudeJ2000Deg=row.latitudeInterceptDeg+row.latitudeSlopeDegPerSolarDeg*offset;
 const ecl=Astronomy.VectorFromSphere(new Astronomy.Spherical(eclipticLatitudeJ2000Deg,eclipticLongitudeJ2000Deg,1),date);
 const eqJ=Astronomy.RotateVector(Astronomy.Rotation_ECL_EQJ(),ecl);
 const jSphere=Astronomy.SphereFromVector(eqJ);
 const eqDate=Astronomy.RotateVector(Astronomy.Rotation_EQJ_EQD(date),eqJ);
 const dateSphere=Astronomy.SphereFromVector(eqDate);
 const observer=new Astronomy.Observer(place.latitude,place.longitude,place.height??0);
 const horizon=Astronomy.Horizon(date,observer,dateSphere.lon/15,dateSphere.lat);
 const moon=Astronomy.Equator(Astronomy.Body.Moon,date,observer,true,true);
 const moonVector=Astronomy.VectorFromSphere(new Astronomy.Spherical(moon.dec,moon.ra*15,1),date);
 const moonSeparationDeg=Astronomy.AngleBetween(eqDate,moonVector);
 const moonAltitudeDeg=Astronomy.Horizon(date,observer,moon.ra,moon.dec).altitude;
 return {status:"available",code,evaluatedAt:date.toISOString(),solarLongitudeJ2000Deg,referenceSolarLongitudeDeg:row.referenceSolarLongitudeDeg,signedSolarOffsetDeg:offset,
 eclipticLongitudeJ2000Deg,eclipticLatitudeJ2000Deg,rightAscensionJ2000Deg:jSphere.lon,declinationJ2000Deg:jSphere.lat,altitudeDeg:horizon.altitude,azimuthDeg:horizon.azimuth,moonSeparationDeg,moonAltitudeDeg,
 radiantDirection:"geocentric mean radiant rotated to equatorial of date; no zenith attraction or refraction",moonDirection:"topocentric equatorial of date; no atmospheric refraction",
 modelValidSolarOffsetDeg:{min:-half,max:half},parameterUncertainty:{...row.uncertainty},source:{url:catalog.sourceUrl,licenseUrl:catalog.licenseUrl,attribution:catalog.attribution,vintage:catalog.vintage,modified:true},annualExtrapolation:date.toISOString().slice(0,10)<catalog.observationStart||date.toISOString().slice(0,10)>catalog.observationEnd,
 caveat:"Modeled geocentric mean radiant; individual meteor apparent radiants, zenith attraction, terrain and atmosphere are not modeled. Reference longitude is a fit anchor, not an exact annual peak. Nominal fit validity is not a full activity season; annual reuse outside 2018-2021 observations is extrapolation. Parameter uncertainty is not a propagated confidence interval or meteor sighting probability."};
}
