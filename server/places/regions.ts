type Coordinate = [number,number];
import { regionRefSchema,resolveObservingRegionInputSchema,regionIdSchema,type RegionRef,type RegionIndex } from '../../shared/nightsky/discovery';
import {type CatalogueFiles,type CatalogueBudget,CatalogueBudgetStop} from './catalogueFiles';
import {normalizeCatalogueName} from './catalogueFormat';
export type AdministrativeBoundary={region:RegionRef;geometry:AdministrativeGeometry;geometryBasis:'full'};
export function compileAdministrativeBoundaries(boundaries:readonly AdministrativeBoundary[]):readonly CompiledAdministrativeBoundary[]{
 const seen=new Set<string>();
 return Object.freeze(boundaries.map(boundary=>{
  const region=regionRefSchema.parse(boundary.region);
  if(boundary.geometryBasis!=='full')throw new Error('Administrative membership requires full geometry');
  if(!region.sources.some(s=>s.licenseUrl&&s.vintage))throw new Error('Administrative boundary license and edition required');
  if(seen.has(region.regionId))throw new Error('Duplicate administrative region ID');seen.add(region.regionId);
  const frozenRegion=Object.freeze({...region,sources:Object.freeze(region.sources.map(s=>Object.freeze(s)))}) as unknown as RegionRef;
  return Object.freeze({region:frozenRegion,geometry:compileAdministrativeGeometry(boundary.geometry)});
 }));
}
export type CompiledAdministrativeBoundary={region:RegionRef;geometry:CompiledAdministrativeGeometry};
export type CompiledAdministrativeGeometry={readonly bounds:Readonly<{west:number;east:number;south:number;north:number}>;contains(point:unknown):boolean};
export function assignAdministrativeRegionIds(point:unknown,boundaries:readonly CompiledAdministrativeBoundary[]):string[]{
 coordinate(point);
 const ids:string[]=[];const seen=new Set<string>();
 for(const boundary of boundaries){
  const region=boundary.region;
  if(seen.has(region.regionId))throw new Error('Duplicate administrative region ID');seen.add(region.regionId);
  if(boundary.geometry.contains(point))ids.push(region.regionId);
 }
 return ids.sort();
}
export function createRegionIndex(
 files:CatalogueFiles,
 options:{maxLeaves?:number;maxDirectoryBytes?:number;timeoutMs?:number}={},
):RegionIndex & {resolveKnownRegion(regionId:string):Promise<RegionRef>} {
 const containsKey=(id:string)=>(ref:{minKey?:string;maxKey?:string})=>
  (ref.minKey===undefined||ref.minKey<=id)&&(ref.maxKey===undefined||id<=ref.maxKey);

 async function findKnownRegion(regionId:string,budget:CatalogueBudget):Promise<RegionRef> {
  regionIdSchema.parse(regionId);
  let match:RegionRef|undefined;
  for await(const page of files.walk('regions',{accept:containsKey(regionId),budget})) {
   if(page.kind!=='regions')throw new Error('Unexpected administrative page kind');
   for(const row of page.rows) {
    if(row.regionId!==regionId)continue;
    if(match)throw new Error('Duplicate administrative region ID');
    match=row;
   }
  }
  if(budget.stopReason)throw new CatalogueBudgetStop(budget.stopReason);
  if(!match)throw new Error(`Unknown administrative region ID: ${regionId}`);
  return match;
 }

 return {
  resolveKnownRegion(regionId) {
   return findKnownRegion(regionId,files.createBudget(options));
  },
  async resolve(raw) {
   const input=resolveObservingRegionInputSchema.parse(raw);
   const name=normalizeCatalogueName(input.regionQuery);
   const budget=files.createBudget(options);
   const matches:RegionRef[]=[];
   for await(const page of files.walk('regions',{budget})) {
    if(page.kind!=='regions')throw new Error('Unexpected administrative page kind');
    for(const row of page.rows) {
     if(normalizeCatalogueName(row.name)!==name)continue;
     if(input.countryCode!==undefined&&row.countryCode!==input.countryCode)continue;
     if(input.adminLevel!==undefined&&row.adminLevel!==input.adminLevel)continue;
     matches.push(row);
     matches.sort((a,b)=>a.regionId.localeCompare(b.regionId));
     if(matches.length>5)matches.pop();
    }
   }
   if(budget.stopReason)throw new CatalogueBudgetStop(budget.stopReason);
   return matches.sort((a,b)=>a.regionId.localeCompare(b.regionId)).slice(0,5);
  },
  async *members(regionId) {
   const budget=files.createBudget(options);
   // Metadata validation and membership traversal are one bounded operation.
   await findKnownRegion(regionId,budget);
   for await(const page of files.walk('membership',{accept:containsKey(regionId),budget})) {
    if(page.kind!=='memberships')throw new Error('Unexpected membership page kind');
    for(const row of page.rows)if(row.key===regionId)yield row.placeId;
   }
   if(budget.stopReason)throw new CatalogueBudgetStop(budget.stopReason);
  },
 };
}
export type AdministrativeGeometry = {type:'Polygon';coordinates:number[][][]} | {type:'MultiPolygon';coordinates:number[][][][]};
function coordinate(value:unknown):Coordinate {
  if(!Array.isArray(value)||value.length!==2||!value.every(Number.isFinite)||Math.abs(value[0])>180||Math.abs(value[1])>90) throw new Error('Invalid administrative coordinate');
  return [value[0],value[1]];
}
function segmentsIntersect(a:Coordinate,b:Coordinate,c:Coordinate,d:Coordinate):boolean{
 if(Math.max(a[0],b[0])<Math.min(c[0],d[0])||Math.max(c[0],d[0])<Math.min(a[0],b[0])||Math.max(a[1],b[1])<Math.min(c[1],d[1])||Math.max(c[1],d[1])<Math.min(a[1],b[1]))return false;
 const side=(x:Coordinate,y:Coordinate,p:Coordinate)=>(y[0]-x[0])*(p[1]-x[1])-(y[1]-x[1])*(p[0]-x[0]);
 return side(a,b,c)*side(a,b,d)<=0&&side(c,d,a)*side(c,d,b)<=0;
}
function ringsIntersect(a:Coordinate[],b:Coordinate[],checkpoint:()=>void){
 for(let i=1;i<a.length;i++){checkpoint();for(let j=1;j<b.length;j++)if(segmentsIntersect(a[i-1],a[i],b[j-1],b[j]))return true;}
 return false;
}
function validateRing(value:unknown,checkpoint:()=>void):Coordinate[] {
  if(!Array.isArray(value)||value.length<4) throw new Error('Administrative ring must be closed');
  const vertices=value.map(coordinate),first=vertices[0],last=vertices[vertices.length-1];
  if(first[0]!==last[0]||first[1]!==last[1]) throw new Error('Administrative ring must be closed');
  let area=0;
  for(let i=1;i<vertices.length;i++){
    const a=vertices[i-1],b=vertices[i];
    if(a[0]===b[0]&&a[1]===b[1])throw new Error('Degenerate administrative edge');
    // RFC 7946 section 3.1.9 requires cutting geometries at the antimeridian.
    // A complete longitude span on a polar cut is an explicit Cartesian edge.
    if(Math.abs(a[0]-b[0])>180&&!(Math.abs(a[0]-b[0])===360&&a[1]===b[1]))throw new Error('Administrative geometry must be cut at the antimeridian');
    area+=a[0]*b[1]-b[0]*a[1];
  }
  if(Math.abs(area)<1e-12)throw new Error('Degenerate administrative ring');
  for(let i=1;i<vertices.length;i++){checkpoint();for(let j=i+2;j<vertices.length;j++){
    if(i===1&&j===vertices.length-1)continue;
    if(segmentsIntersect(vertices[i-1],vertices[i],vertices[j-1],vertices[j]))throw new Error('Self-intersecting administrative ring');
  }}
  return vertices;
}
function ringContains(p:Coordinate,ring:Coordinate[]):'edge'|'inside'|'outside' {
  let inside=false;
  for(let i=1;i<ring.length;i++) {
    const a=ring[i-1],b=ring[i];
    const cross=(p[0]-a[0])*(b[1]-a[1])-(p[1]-a[1])*(b[0]-a[0]);
    if(Math.abs(cross)<1e-10&&p[0]>=Math.min(a[0],b[0])-1e-12&&p[0]<=Math.max(a[0],b[0])+1e-12&&p[1]>=Math.min(a[1],b[1])-1e-12&&p[1]<=Math.max(a[1],b[1])+1e-12)return 'edge';
    if((a[1]>p[1])!==(b[1]>p[1])&&p[0]<(b[0]-a[0])*(p[1]-a[1])/(b[1]-a[1])+a[0])inside=!inside;
  }
  return inside?'inside':'outside';
}
/** Build-time admission only. RFC 7946 Cartesian edges; antimeridian cuts must be explicit. */
export function pointInAdministrativeGeometry(point:unknown,geometry:unknown):boolean {
 return compileAdministrativeGeometry(geometry).contains(point);
}
/** Admission caps are deliberately small; larger sources require separately reviewed budgets. */
export function compileAdministrativeGeometry(geometry:unknown,options:{maxVertices?:number;validationTimeoutMs?:number}={}):CompiledAdministrativeGeometry {
  const maxVertices=options.maxVertices??10000,timeout=options.validationTimeoutMs??1000;
  if(!Number.isSafeInteger(maxVertices)||maxVertices<4||maxVertices>10000||!Number.isSafeInteger(timeout)||timeout<1||timeout>1000)throw new Error('Invalid administrative admission limit');
  const deadline=performance.now()+timeout,checkpoint=()=>{if(performance.now()>=deadline)throw new Error('Administrative geometry validation time limit');};
  if(!geometry||typeof geometry!=='object') throw new Error('Invalid administrative geometry');
  const g=geometry as AdministrativeGeometry;
  if(g.type!=='Polygon'&&g.type!=='MultiPolygon') throw new Error('Full Polygon or MultiPolygon required');
  const polygons=g.type==='Polygon'?[g.coordinates]:g.coordinates;
  if(!Array.isArray(polygons)||!polygons.length) throw new Error('Empty administrative geometry');
  let count=0;
  for(const polygon of polygons){
    checkpoint();if(!Array.isArray(polygon)||!polygon.length)throw new Error('Empty administrative polygon');
    for(const ring of polygon){checkpoint();if(!Array.isArray(ring))throw new Error('Invalid administrative ring');count+=ring.length;if(count>maxVertices)throw new Error('Administrative geometry vertex limit');}
  }
  const bounds={west:180,east:-180,south:90,north:-90};
  const validated=polygons.map(polygon=>{
    if(!Array.isArray(polygon)||!polygon.length) throw new Error('Empty administrative polygon');
    const rings=polygon.map(ring=>validateRing(ring,checkpoint));
    for(const ring of rings)for(const [lon,lat] of ring){bounds.west=Math.min(bounds.west,lon);bounds.east=Math.max(bounds.east,lon);bounds.south=Math.min(bounds.south,lat);bounds.north=Math.max(bounds.north,lat);}
    for(let i=1;i<rings.length;i++){
      checkpoint();
      if(ringContains(rings[i][0],rings[0])!=='inside'||ringsIntersect(rings[0],rings[i],checkpoint))throw new Error('Invalid administrative hole');
      for(let j=1;j<i;j++)if(ringsIntersect(rings[j],rings[i],checkpoint)||ringContains(rings[i][0],rings[j])!=='outside'||ringContains(rings[j][0],rings[i])!=='outside')throw new Error('Overlapping administrative holes');
    }
    return rings;
  });
  checkpoint();
  return Object.freeze({bounds:Object.freeze(bounds),contains(point:unknown){
   const p=coordinate(point);
   const points:Coordinate[]=Math.abs(p[0])===180?[p,[-p[0],p[1]]]:[p];
   return points.some(point=>{
    if(point[0]<bounds.west||point[0]>bounds.east||point[1]<bounds.south||point[1]>bounds.north)return false;
    return validated.some(rings=>{
    const exterior=ringContains(point,rings[0]);
    const holes=rings.slice(1).map(r=>ringContains(point,r));
    return exterior!=='outside'&&holes.every(h=>h==='outside');
    });
   });
  }});
}
