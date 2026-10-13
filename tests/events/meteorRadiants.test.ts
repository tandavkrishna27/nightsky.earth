import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {evaluateRadiant, solarLongitudeJ2000} from "../../server/events/meteorRadiants";
const codes=["PER","GEM","ORI","ETA","LYR","SDA","QUA","LEO"];
const additionalCodes=["CAP","NTA","STA","HYD"];
const observer={latitude:18.5204,longitude:73.8567,height:0};
const catalog=()=>JSON.parse(readFileSync(new URL("../../data/events/meteor-radiants-gmn-2021.json",import.meta.url),"utf8"));
const difference=(a:number,b:number)=>((a-b+540)%360)-180;
function dateAt(longitude:number,year=2026) {
 let low=Date.UTC(year,0,1), high=Date.UTC(year+1,0,1);
 // Select the annual root by scanning two-day brackets, then bisection.
 let previous=low;
 for(let time=low+2*86400000; time<=high; time+=2*86400000) {
  if(difference(solarLongitudeJ2000(new Date(previous)),longitude)<=0 && difference(solarLongitudeJ2000(new Date(time)),longitude)>=0) {low=previous;high=time;break;} previous=time;
 }
 for(let i=0;i<45;i++) {const mid=(low+high)/2;if(difference(solarLongitudeJ2000(new Date(mid)),longitude)<0) low=mid;else high=mid;}
 return new Date(Math.round((low+high)/2));
}

test("GMN catalog retains all eight original fitted rows, uncertainty, frames and rights",()=>{
 const data=catalog();
 assert.equal(data.licenseUrl,"https://creativecommons.org/licenses/by/4.0/");
 assert.equal(data.frame,"J2000 mean ecliptic; Sun-centered geocentric radiant");
 assert.deepEqual(data.rows.slice(0,8).map((row:any)=>row.code),codes);
 const expected=[ [140.10,283.531,.068,38.362,-.059,9],[262.20,207.995,-.092,10.466,-.103,3],[209.20,246.670,-.242,-7.557,.063,7],[45.12,293.813,-.254,7.696,.063,9],[32.50,240.927,.64,56.639,-.22,3],[126.70,208.629,-.237,-7.488,-.123,5],[283,275.67,.22,63.458,.17,1],[235.50,272.525,-.295,10.225,-.169,7] ];
 data.rows.slice(0,8).forEach((row:any,index:number)=>{
  assert.deepEqual([row.referenceSolarLongitudeDeg,row.longitudeInterceptDeg,row.longitudeSlopeDegPerSolarDeg,row.latitudeInterceptDeg,row.latitudeSlopeDegPerSolarDeg,row.nominalFitDays],expected[index]);
  assert.ok(row.uncertainty.longitudeInterceptDeg>0 && row.uncertainty.latitudeSlopeDegPerSolarDeg>0);
 });
});

test("additional original GMN fits preserve bounded direction at polar observers",()=>{
 assert.deepEqual(catalog().rows.slice(8).map((row:any)=>row.code),additionalCodes);
 for(const code of additionalCodes) {
  const row=catalog().rows.find((entry:any)=>entry.code===code);
  assert.ok(row);
  for(const latitude of [-90,0,90]) {
   const result=evaluateRadiant(code,dateAt(row.referenceSolarLongitudeDeg),{latitude,longitude:180});
   assert.equal(result.status,"available");if(result.status!=="available") continue;
   assert.ok(Number.isFinite(result.altitudeDeg));
   assert.ok(result.altitudeDeg>=-90 && result.altitudeDeg<=90);
   assert.ok(result.azimuthDeg>=0 && result.azimuthDeg<=360);
   assert.equal(result.annualExtrapolation,true);
  }
 }
});

test("J2000 solar longitude matches GMN independent raw UTC reference",()=>{
 assert.ok(Math.abs(difference(solarLongitudeJ2000(new Date("2018-12-10T01:06:56.588Z")),257.653525))<.005);
});

test("all eight evaluate fitted radiants at reference and both sides without treating reference as exact annual peak",()=>{
 for(const row of catalog().rows) for(const offset of [-.2,0,.2]) {
  const result=evaluateRadiant(row.code,dateAt(row.referenceSolarLongitudeDeg+offset),observer);
  assert.equal(result.status,"available"); if(result.status!=="available") continue;
  assert.ok(Math.abs(difference(result.eclipticLongitudeJ2000Deg,row.referenceSolarLongitudeDeg+offset+row.longitudeInterceptDeg+row.longitudeSlopeDegPerSolarDeg*offset))<.00001);
  assert.ok(Math.abs(result.eclipticLatitudeJ2000Deg-(row.latitudeInterceptDeg+row.latitudeSlopeDegPerSolarDeg*offset))<.00001);
  assert.ok(result.moonSeparationDeg>=0 && result.moonSeparationDeg<=180);
  assert.equal(result.moonDirection,"topocentric equatorial of date; no atmospheric refraction");
  assert.match(result.caveat,/geocentric mean/);
 }
});

test("every fit boundary is inclusive and outside-model returns no fabricated direction",()=>{
 for(const row of catalog().rows) {
  const half=row.nominalFitDays*.986/2;
  for(const sign of [-1,1]) {
   assert.equal(evaluateRadiant(row.code,dateAt(row.referenceSolarLongitudeDeg+sign*(half-.00001)),observer).status,"available");
   const outside=evaluateRadiant(row.code,dateAt(row.referenceSolarLongitudeDeg+sign*(half+.001)),observer);
   assert.equal(outside.status,"outside-model");
   assert.equal("altitudeDeg" in outside,false); assert.equal("moonSeparationDeg" in outside,false);
  }
 }
});

test("radiant horizontal direction agrees with independent spherical geometry across hemispheres",()=>{
 // Classical GMST and J2000 precession, independently expressed here. Nutation is
 // intentionally omitted; 0.08 degree allowance covers that and different precession models.
 const date=dateAt(140.10); const jd=date.getTime()/86400000+2440587.5, t=(jd-2451545)/36525;
 const epsilon=23.439291111*Math.PI/180, lon=63.631*Math.PI/180, lat=38.362*Math.PI/180;
 const x=Math.cos(lat)*Math.cos(lon), y=Math.cos(epsilon)*Math.cos(lat)*Math.sin(lon)-Math.sin(epsilon)*Math.sin(lat), z=Math.sin(epsilon)*Math.cos(lat)*Math.sin(lon)+Math.cos(epsilon)*Math.sin(lat);
 const ra=Math.atan2(y,x), dec=Math.asin(z);
 const conv=Math.PI/(180*3600), ze=(2306.2181*t+.30188*t*t+.017998*t*t*t)*conv, zz=(2306.2181*t+1.09468*t*t+.018203*t*t*t)*conv, theta=(2004.3109*t-.42665*t*t-.041833*t*t*t)*conv;
 const a=Math.cos(dec)*Math.sin(ra+ze), b=Math.cos(theta)*Math.cos(dec)*Math.cos(ra+ze)-Math.sin(theta)*Math.sin(dec), c=Math.sin(theta)*Math.cos(dec)*Math.cos(ra+ze)+Math.cos(theta)*Math.sin(dec);
 const raDate=Math.atan2(a,b)+zz, decDate=Math.asin(c);
 const gmst=(280.46061837+360.98564736629*(jd-2451545)+.000387933*t*t-t*t*t/38710000)*Math.PI/180;
 for(const [latitude,longitude] of [[18.52,73.86],[-33.92,18.42],[78.22,15.65],[-90,0],[90,0],[0,-180]]) {
  const result=evaluateRadiant("PER",date,{latitude,longitude,height:0});assert.equal(result.status,"available");if(result.status!=="available") continue;
  const phi=latitude*Math.PI/180,h=gmst+longitude*Math.PI/180-raDate;
  const altitude=Math.asin(Math.sin(phi)*Math.sin(decDate)+Math.cos(phi)*Math.cos(decDate)*Math.cos(h))*180/Math.PI;
  assert.ok(Math.abs(result.altitudeDeg-altitude)<.08,`${latitude}: ${result.altitudeDeg} vs ${altitude}`);
 }
});

test("invalid inputs and unsupported code never produce plausible measurements",()=>{
 assert.throws(()=>evaluateRadiant("PER",new Date("bad"),observer),/date/i);
 assert.throws(()=>evaluateRadiant("PER",dateAt(140.1),{...observer,latitude:91}),/observer/i);
 assert.equal(evaluateRadiant("FAKE",dateAt(140.1),observer).status,"unsupported");
 assert.equal(evaluateRadiant("PER",dateAt(140.1,2040),observer).status,"outside-model");
});

test("Moon separation agrees with independent J2000 spherical angle and responds to observer parallax",async()=>{
 const {createRequire}=await import("node:module");const engine=createRequire(import.meta.url)("astronomy-engine");
 const date=dateAt(140.10);const separations:number[]=[];
 for(const point of [{latitude:18.52,longitude:73.86,height:0},{latitude:-33.92,longitude:18.42,height:0}]) {
  const result=evaluateRadiant("PER",date,point); assert.equal(result.status,"available");if(result.status!=="available") continue;
  // Independent matching-frame route: topocentric Moon EQJ and analytic great-circle law;
  // implementation rotates radiant EQJ to EQD before its vector-angle calculation.
  const moon=engine.Equator(engine.Body.Moon,date,new engine.Observer(point.latitude,point.longitude,0),false,true);
  const radians=Math.PI/180, a=result.declinationJ2000Deg*radians,b=moon.dec*radians;
  const cosine=Math.sin(a)*Math.sin(b)+Math.cos(a)*Math.cos(b)*Math.cos((result.rightAscensionJ2000Deg-moon.ra*15)*radians);
  const expected=Math.acos(Math.max(-1,Math.min(1,cosine)))/radians;
  assert.ok(Math.abs(result.moonSeparationDeg-expected)<.000001);
  separations.push(result.moonSeparationDeg);
 }
 assert.ok(Math.abs(separations[0]-separations[1])>.01,"Topocentric Moon direction must reflect observer parallax.");
});

test("fit-anchor source values wrap radiant longitude without treating fit window as physical season",()=>{
 const result=evaluateRadiant("QUA",dateAt(283),observer);assert.equal(result.status,"available");if(result.status!=="available")return;
 assert.ok(Math.abs(result.eclipticLongitudeJ2000Deg-198.67)<.000001);
 assert.equal(result.annualExtrapolation,true);
 assert.match(result.caveat,/not a full activity season/);
});
