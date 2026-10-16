import { createRequire } from "node:module";
import type * as AstronomyTypes from "astronomy-engine";
import { PLANET_PAIR_BODIES, type PlanetPairCoverage, type SkyEvent } from "../../shared/nightsky/events";
import type { SourceRecord } from "../../shared/nightsky/common";

const Astronomy = createRequire(import.meta.url)("astronomy-engine") as typeof AstronomyTypes;
const DAY = 86_400_000;
const HOUR = 3_600_000;
const ROOT_MS = 100;
const MATCH_MS = 2000;
const ROOT_DEG = 1e-6;
const MIN = Date.parse("2025-01-01T00:00:00.000Z");
const MAX = Date.parse("2027-12-31T23:59:59.999Z");
type Bodies = NonNullable<SkyEvent["pairConjunction"]>["bodies"];
type Direction = "ascending" | "descending";
type Interval = { start: number; end: number; reason: string };
type Root = { time: number; start: number; end: number; crossingDirection: Direction };
type Stationary = { start: number; end: number; time: number };
export type PairScreening = { roots: Root[]; unresolved: Interval[]; evaluations: number; completeness: "not-certified" };
class ScreeningFailure extends Error {}
const offset = (degrees: number) => ((degrees % 360 + 540) % 360)-180;

/** Numerical screening, not a proof of interval completeness. The injected
 * function returns RA(second canonical body) - RA(first), in degrees. Lower
 * limits support callers with tighter budgets; the production ceilings apply. */
export function screenPairCrossings(start: number, end: number, angleAt: (time: number) => number, limits: { evaluationLimit?: number; refinementLimit?: number; unresolvedLimit?: number } = {}): PairScreening {
  if (!Number.isFinite(start) || !Number.isFinite(end) || end <= start || end-start > 368*DAY) throw new RangeError("Invalid pair screening interval.");
  const evaluationLimit = limits.evaluationLimit ?? 30_000;
  const refinementLimit = limits.refinementLimit ?? 80;
  const unresolvedLimit = limits.unresolvedLimit ?? 256;
  for (const [value, ceiling] of [[evaluationLimit,30_000],[refinementLimit,80],[unresolvedLimit,256]]) {
    if (!Number.isInteger(value) || value! < 1 || value! > ceiling!) throw new RangeError("Invalid pair screening budget.");
  }
  let evaluations = 0;
  const samples = new Map<number, { angle: number; sin: number; cos: number }>();
  const evaluate = (time: number) => {
    const cached = samples.get(time);
    if (cached) return cached;
    if (evaluations >= evaluationLimit) throw new ScreeningFailure("signal-evaluation-budget-exceeded");
    evaluations++;
    const angle = angleAt(time);
    if (!Number.isFinite(angle)) throw new ScreeningFailure("nonfinite-signal");
    const radians = offset(angle)*Math.PI/180;
    const value = { angle: offset(angle), sin: Math.sin(radians), cos: Math.cos(radians) };
    samples.set(time, value);
    return value;
  };
  const unresolved: Interval[] = [];
  const uncertain = (interval: Interval) => {
    if (unresolved.some(row => row.reason === interval.reason && row.start === interval.start && row.end === interval.end)) return;
    if (unresolved.length >= unresolvedLimit) throw new ScreeningFailure("unresolved-output-budget-exceeded");
    unresolved.push(interval);
  };
  const refineRoot = (left: number, right: number): Root | undefined => {
    let a=left, b=right, fa=evaluate(a).sin, fb=evaluate(b).sin;
    if (fa*fb > 0) return;
    if (fa===0 && fb===0) {
      if(evaluate(a).cos>0 || evaluate(b).cos>0) uncertain({start:left,end:right,reason:"ambiguous-sampled-equal-ra"});
      return;
    }
    const bracketDirection:Direction|undefined=fa*fb<0 ? (fb>fa?"ascending":"descending") : undefined;
    for (let iteration=0; iteration<refinementLimit; iteration++) {
      // Secant interpolation inside the final bracket improves the residual
      // without confusing the width tolerance with a physical accuracy bound.
      const candidate = fa === 0 ? a : fb === 0 ? b : a+(b-a)*Math.abs(fa)/(Math.abs(fa)+Math.abs(fb));
      const time = Math.round(candidate);
      const value = evaluate(time);
      if (b-a <= ROOT_MS && Math.abs(value.angle) <= ROOT_DEG && value.cos > 0) {
        if(bracketDirection) return {time,start:a,end:b,crossingDirection:bracketDirection};
        const before=evaluate(time-1000).sin, after=evaluate(time+1000).sin;
        if (before*after >= 0) {
          uncertain({start:left,end:right,reason:"stationary-or-ambiguous-root-direction"});
          return;
        }
        return { time, start:a, end:b, crossingDirection: after > before ? "ascending" : "descending" };
      }
      if (b-a <= ROOT_MS && value.cos <= 0) return; // opposite RA, not equality
      const mid=(a+b)/2, fm=evaluate(mid).sin;
      if (fm === 0) { a=mid; b=mid; fa=0; fb=0; }
      else if (fa === 0) { b=a; fb=fa; }
      else if (fb === 0) { a=b; fa=fb; }
      else if (fa*fm < 0) { b=mid; fb=fm; }
      else { a=mid; fa=fm; }
    }
    throw new ScreeningFailure("root-refinement-budget-exceeded");
  };
  const refineStationary = (left: number, right: number, maximum: boolean) => {
    let a=left,b=right;
    const score=(time:number)=>(maximum ? -1 : 1)*evaluate(time).sin;
    for (let iteration=0; iteration<refinementLimit; iteration++) {
      if (b-a <= ROOT_MS) return (a+b)/2;
      const c=a+(b-a)/3,d=b-(b-a)/3;
      if (score(c) < score(d)) b=d; else a=c;
    }
    throw new ScreeningFailure("stationary-refinement-budget-exceeded");
  };
  try {
    const inventories: Root[][]=[];
    const stationary: Stationary[]=[];
    for (const [step, shift] of [[24*HOUR,0],[12*HOUR,0],[6*HOUR,0],[6*HOUR,3*HOUR]]) {
      const times=[start];
      for (let time=start+shift!; time<end; time+=step!) if (time>start) times.push(time);
      times.push(end);
      const values=times.map(time=>evaluate(time));
      const roots: Root[]=[];
      const addRoot=(left:number,right:number)=> {
        const root=refineRoot(left,right);
        if (!root) return;
        // Duplicate *brackets* from the same sampled crossing may overlap;
        // mere proximity never merges two distinct nearby roots.
        const duplicates=roots.filter(other=>other.crossingDirection===root.crossingDirection && Math.max(other.start,root.start)<=Math.min(other.end,root.end));
        if (!duplicates.length) roots.push(root);
        else if (duplicates.length>1) uncertain({start:left,end:right,reason:"ambiguous-overlapping-root-brackets"});
      };
      for (let i=1;i<times.length;i++) {
        const previous=values[i-1]!,current=values[i]!;
        if(previous.sin===current.sin && previous.cos>0 && current.cos>0 && Math.abs(previous.angle)<=0.01 && Math.abs(current.angle)<=0.01) uncertain({start:times[i-1]!,end:times[i]!,reason:"flat-or-stationary-near-equal-ra"});
        if (previous.sin*current.sin <= 0) addRoot(times[i-1]!,times[i]!);
      }
      for (let i=1;i<times.length-1;i++) {
        const first=values[i]!.sin-values[i-1]!.sin, second=values[i+1]!.sin-values[i]!.sin;
        if (first*second >= 0 || first === 0 || second === 0) continue;
        const left=times[i-1]!,right=times[i+1]!;
        const time=refineStationary(left,right,first>0);
        const value=evaluate(time);
        if (value.cos <= 0) continue;
        if (evaluate(left).sin*value.sin < 0) addRoot(left,time);
        if (value.sin*evaluate(right).sin < 0) addRoot(time,right);
        if (Math.abs(value.angle) <= 0.01) stationary.push({start:left,end:right,time});
      }
      inventories.push(roots.sort((a,b)=>a.time-b.time));
    }
    const fine=inventories[2]!;
    const others=[inventories[0]!,inventories[1]!,inventories[3]!];
    const matches=(root:Root,rows:Root[])=>rows.filter(other=>other.crossingDirection===root.crossingDirection && Math.abs(other.time-root.time)<=MATCH_MS);
    const roots=fine.filter(root=>others.every(rows=> {
      const found=matches(root,rows);
      return found.length===1 && matches(found[0]!,fine).length===1;
    }));
    for (const inventory of inventories) for (const root of inventory) {
      if (!roots.some(other=>other.crossingDirection===root.crossingDirection && Math.abs(other.time-root.time)<=MATCH_MS)) uncertain({start:root.start,end:root.end,reason:"grid-inventory-disagreement-or-ambiguous-matching"});
    }
    for (const candidate of stationary) {
      const left=roots.some(root=>root.time>=candidate.start && root.time<candidate.time);
      const right=roots.some(root=>root.time>candidate.time && root.time<=candidate.end);
      if (!left || !right) uncertain({start:candidate.start,end:candidate.end,reason:"stationary-or-tangent-near-equal-ra"});
    }
    // Never present a crossing inside explicitly unresolved coverage as a
    // confirmed dated event, even when other grids found a candidate nearby.
    return { roots:roots.filter(root=>!unresolved.some(row=>root.time>=row.start && root.time<=row.end)), unresolved, evaluations, completeness:"not-certified" };
  } catch (error) {
    const reason=error instanceof ScreeningFailure ? error.message : "signal-evaluation-failed";
    return {roots:[],unresolved:[{start,end,reason}],evaluations,completeness:"not-certified"};
  }
}

type Draft = Omit<SkyEvent,"source">;
type Annual = { events:Draft[]; unresolved:PlanetPairCoverage["unresolved"]; evaluations:number; maxPairEvaluations:number; screenedPairs:number; vectorEvaluations:number; durationMs:number };
const annualCache=new Map<number,Annual>();
const pairs: Bodies[]=[];
for(let i=0;i<PLANET_PAIR_BODIES.length;i++) for(let j=i+1;j<PLANET_PAIR_BODIES.length;j++) pairs.push([PLANET_PAIR_BODIES[i]!,PLANET_PAIR_BODIES[j]!]);

function annualInventory(year:number): Annual {
  const cached=annualCache.get(year);
  if(cached) return cached;
  const started=performance.now();
  const start=Date.UTC(year,0,1),end=Date.UTC(year+1,0,1);
  const inventory:Annual={events:[],unresolved:[],evaluations:0,maxPairEvaluations:0,screenedPairs:0,vectorEvaluations:0,durationMs:0};
  // Only regular three-hour nodes are shared across pairs. Root refinements
  // remain in each screen's bounded memo, keeping annual scratch memory small.
  const regular=new Map<number,Map<string,{vector:AstronomyTypes.Vector;ra:number}>>();
  const coordinates=(body:string,time:number)=> {
    const shared=time%(3*HOUR)===0;
    const node=shared ? regular.get(time) : undefined;
    const cached=node?.get(body);
    if(cached) return cached;
    const date=new Date(time);
    const vector=Astronomy.GeoVector(body as AstronomyTypes.Body,date,true);
    const rotation=Astronomy.Rotation_EQJ_EQD(date);
    const ra=Astronomy.SphereFromVector(Astronomy.RotateVector(rotation,vector)).lon;
    inventory.vectorEvaluations++;
    const result={vector,ra};
    if(shared) { const values=node ?? new Map(); values.set(body,result); regular.set(time,values); }
    return result;
  };
  for(const bodies of pairs) {
    const screened=screenPairCrossings(start-DAY,end+DAY,time=>coordinates(bodies[1],time).ra-coordinates(bodies[0],time).ra);
    inventory.evaluations+=screened.evaluations;
    inventory.maxPairEvaluations=Math.max(inventory.maxPairEvaluations,screened.evaluations);
    inventory.screenedPairs++;
    for(const interval of screened.unresolved) {
      const lo=Math.max(start,Math.floor(interval.start)),hi=Math.min(end-1,Math.ceil(interval.end));
      if(hi>=lo) inventory.unresolved.push({bodies:[...bodies],startUtc:new Date(lo).toISOString(),endUtc:new Date(hi).toISOString(),reason:interval.reason});
    }
    for(const root of screened.roots) if(root.time>=start && root.time<end) {
      const peakUtc=new Date(root.time).toISOString();
      const angle=Astronomy.AngleBetween(coordinates(bodies[0],root.time).vector,coordinates(bodies[1],root.time).vector);
      inventory.events.push({eventId:`planet-pair-ra-of-date:${bodies[0].toLowerCase()}:${bodies[1].toLowerCase()}:${peakUtc}`,name:`${bodies.join(" / ")} Conjunction (geocentric RA of date)`,eventType:"planetary-conjunction",peakUtc,localVisibility:"not-evaluated",pairConjunction:{bodies:[...bodies],definition:"geocentric-right-ascension-of-date",corrections:"light-time-and-aberration",angularSeparationDeg:angle,crossingDirection:root.crossingDirection},description:"Crossing of equal geocentric right ascension in the true equator/equinox of date, with light-time correction and aberration, using Astronomy Engine 2.1.19. Reported 3D separation is at this RA crossing, not minimum separation or closest approach. Inventory is numerically screened; completeness is not certified. Local horizon, darkness and detectability are not evaluated."});
    }
  }
  if(inventory.unresolved.length>256) {
    inventory.events=[];
    inventory.unresolved=pairs.map(bodies=>({bodies:[...bodies],startUtc:new Date(start).toISOString(),endUtc:new Date(end-1).toISOString(),reason:"annual-unresolved-output-budget-exceeded"}));
  }
  inventory.durationMs=performance.now()-started;
  // Only these three years can reach this function through the public adapter.
  if(annualCache.size>=3) throw new Error("Planet pair annual cache budget exceeded.");
  annualCache.set(year,inventory);
  return inventory;
}

/** Read-only operational counters for measuring the bounded annual computation. */
export function planetPairSearchDiagnostics() {
  return Array.from(annualCache).map(([year,inventory])=>({year,evaluations:inventory.evaluations,maxPairEvaluations:inventory.maxPairEvaluations,screenedPairs:inventory.screenedPairs,vectorEvaluations:inventory.vectorEvaluations,durationMs:inventory.durationMs}));
}

export function findPlanetPairConjunctions(start:number,end:number,source:SourceRecord):{events:SkyEvent[];coverage:PlanetPairCoverage} {
  const covered=Number.isFinite(start)&&Number.isFinite(end)&&start>=MIN&&end<=MAX&&end>start&&end-start<=366*DAY;
  const coverage:PlanetPairCoverage={status:covered?"partial":"out-of-horizon",completeness:"not-certified",supportedStartUtc:"2025-01-01T00:00:00.000Z",supportedEndUtc:"2027-12-31T23:59:59.999Z",pairCount:21,unresolved:[]};
  if(!covered) return {events:[],coverage};
  const events:SkyEvent[]=[];
  for(let year=new Date(start).getUTCFullYear();year<=new Date(end).getUTCFullYear();year++) {
    const annual=annualInventory(year);
    for(const row of annual.events) if(Date.parse(row.peakUtc!)>=start&&Date.parse(row.peakUtc!)<=end) events.push({...row,pairConjunction:{...row.pairConjunction!,bodies:[...row.pairConjunction!.bodies]},source});
    for(const interval of annual.unresolved) if(Date.parse(interval.endUtc)>=start&&Date.parse(interval.startUtc)<=end) coverage.unresolved.push({...interval,bodies:[...interval.bodies],startUtc:new Date(Math.max(start,Date.parse(interval.startUtc))).toISOString(),endUtc:new Date(Math.min(end,Date.parse(interval.endUtc))).toISOString()});
  }
  if(coverage.unresolved.length>256) {
    coverage.unresolved=pairs.map(bodies=>({bodies:[...bodies],startUtc:new Date(start).toISOString(),endUtc:new Date(end).toISOString(),reason:"query-unresolved-output-budget-exceeded"}));
    return {events:[],coverage};
  }
  return {events,coverage};
}
