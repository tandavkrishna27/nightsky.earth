import test from "node:test";
import assert from "node:assert/strict";
import { evaluateRadiant, solarLongitudeJ2000 } from "../../server/events/meteorRadiants";
import { createRequire } from "node:module";
import type * as AstronomyTypes from "astronomy-engine";
import { findPlanetPairConjunctions } from "../../server/events/planetPairConjunctions";

const radians = Math.PI / 180;
const signed = (angle:number) => ((angle % 360 + 540) % 360) - 180;
function meanOfDate(ra:number, dec:number, jd:number) {
  // Classical IAU 1976 precession, independent of the runtime rotation API.
  // Nutation omitted: 0.08 deg engineering envelope, not physical uncertainty.
  const t=(jd-2451545)/36525, c=radians/3600;
  const zeta=(2306.2181*t+.30188*t*t+.017998*t*t*t)*c;
  const z=(2306.2181*t+1.09468*t*t+.018203*t*t*t)*c;
  const theta=(2004.3109*t-.42665*t*t-.041833*t*t*t)*c;
  const a=Math.cos(dec)*Math.sin(ra+zeta);
  const b=Math.cos(theta)*Math.cos(dec)*Math.cos(ra+zeta)-Math.sin(theta)*Math.sin(dec);
  const d=Math.sin(theta)*Math.cos(dec)*Math.cos(ra+zeta)+Math.cos(theta)*Math.sin(dec);
  return { ra:Math.atan2(a,b)+z, dec:Math.asin(d) };
}
function anchorDate(longitude:number) {
  // Only selects an evaluation date, never supplies the expected direction.
  for(let lo=Date.UTC(2026,0,1);lo<Date.UTC(2027,0,1);lo+=86400000) {
    let a=lo,b=lo+86400000;
    if(signed(solarLongitudeJ2000(a)-longitude)>0 || signed(solarLongitudeJ2000(b)-longitude)<0) continue;
    for(let i=0;i<35;i++) {const mid=(a+b)/2;if(signed(solarLongitudeJ2000(mid)-longitude)<0)a=mid;else b=mid;}
    return new Date(Math.round((a+b)/2));
  }
  throw new Error("Anchor date not bracketed");
}

test("radiant azimuth is north through east and altitude follows independent spherical geometry in both hemispheres", () => {
  // Narrow facts from the already admitted GMN fit rows. Catches reversed
  // longitude, wrong azimuth origin, or ecliptic/equatorial frame confusion.
  // Includes north/south ecliptic latitudes and longitude wrap.
  for(const [code, solar, intercept, beta] of [
    ["PER",140.1,283.531,38.362], ["QUA",283,275.67,63.458],
    ["HYD",254.8,231.099,-16.421],
  ] as const) {
    const date=anchorDate(solar), jd=date.getTime()/86400000+2440587.5;
    const lambda=(solar+intercept)*radians, latitude=beta*radians, eps=23.439291111*radians;
    const x=Math.cos(latitude)*Math.cos(lambda);
    const y=Math.cos(eps)*Math.cos(latitude)*Math.sin(lambda)-Math.sin(eps)*Math.sin(latitude);
    const z=Math.sin(eps)*Math.cos(latitude)*Math.sin(lambda)+Math.cos(eps)*Math.sin(latitude);
    const eq=meanOfDate(Math.atan2(y,x),Math.asin(z),jd);
    const t=(jd-2451545)/36525;
    const gmst=(280.46061837+360.98564736629*(jd-2451545)+.000387933*t*t-t*t*t/38710000)*radians;
    for(const [phiDeg,lonDeg] of [[35,30],[-35,30],[0,-150]]) {
      const sample=evaluateRadiant(code,date,{latitude:phiDeg,longitude:lonDeg});
      assert.equal(sample.status,"available");if(sample.status!=="available") continue;
      const phi=phiDeg*radians,h=gmst+lonDeg*radians-eq.ra;
      const east=-Math.cos(eq.dec)*Math.sin(h);
      const north=Math.cos(phi)*Math.sin(eq.dec)-Math.sin(phi)*Math.cos(eq.dec)*Math.cos(h);
      const up=Math.sin(phi)*Math.sin(eq.dec)+Math.cos(phi)*Math.cos(eq.dec)*Math.cos(h);
      const az=Math.atan2(east,north)/radians;
      assert.ok(Math.abs(signed(sample.azimuthDeg-az))<.08,`${code} azimuth at ${phiDeg}`);
      assert.ok(Math.abs(sample.altitudeDeg-Math.asin(up)/radians)<.08,`${code} altitude at ${phiDeg}`);
    }
  }
});

test("representative real planet crossings retain the canonical second-minus-first direction under independent mean-date projection", () => {
  // This checks convention wiring, not independent ephemeris accuracy: engine
  // geocentric vectors are shared, while RA extraction/precession below is separate.
  const engine=createRequire(import.meta.url)("astronomy-engine") as typeof AstronomyTypes;
  const source={name:"Astronomy Engine",url:"https://github.com/cosinekitty/astronomy",attribution:"Don Cross, MIT",dataClass:"calculation" as const};
  for(const [start,end] of [["2025-08-11","2025-08-14"],["2026-06-08","2026-06-11"]]) {
    const result=findPlanetPairConjunctions(Date.parse(start),Date.parse(end),source);
    const event=result.events.find(row=>row.pairConjunction?.bodies.join("/")==="Venus/Jupiter");
    assert.ok(event?.peakUtc);
    const pair=event.pairConjunction!;
    const delta=(instant:number)=> {
      const jd=instant/86400000+2440587.5;
      const ra=pair.bodies.map(body=>{
        const v=engine.GeoVector(body as AstronomyTypes.Body,new Date(instant),true);
        return meanOfDate(Math.atan2(v.y,v.x),Math.atan2(v.z,Math.hypot(v.x,v.y)),jd).ra/radians;
      });
      return signed(ra[1]-ra[0]);
    };
    const peak=Date.parse(event.peakUtc);
    assert.ok(Math.abs(delta(peak))<.08);
    const before=delta(peak-3600000),after=delta(peak+3600000);
    assert.ok(before*after<0,"mean-date geometry must bracket equality");
    assert.equal(pair.crossingDirection,after>before?"ascending":"descending");
    assert.ok(pair.angularSeparationDeg>0.1,"same RA is not coincident direction");
    assert.equal(result.coverage.completeness,"not-certified");
    assert.equal(event.localVisibility,"not-evaluated");
  }
});
