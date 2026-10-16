import * as z from 'zod4';
import {sourceRecordSchema} from '../../shared/nightsky/common';
import {regionRefSchema,type RegionRef} from '../../shared/nightsky/discovery';
export type Point=[number,number];type Ring=Point[];export type Polygon=Ring[];
export const unresolvedBoundarySchema=z.strictObject({kind:z.literal('unresolved-boundary'),boundaryId:z.string().min(1).max(400),providerId:z.string().min(1).max(100),adminLevel:z.union([z.literal(0),z.literal(1)]),boundaryRevision:z.string().min(1).max(200),sources:z.array(sourceRecordSchema).min(1).max(4),sourceLayer:z.union([z.literal(0),z.literal(1)]),reason:z.enum(['missing-name','country-assignment','region-identity'])}).refine(value=>value.sourceLayer===value.adminLevel,'Conflicting unresolved administrative level').refine(value=>value.boundaryId===`unresolved:ne:${value.sourceLayer}:${encodeURIComponent(value.providerId)}`,'Conflicting unresolved provider identity');
export type BoundaryIdentity=RegionRef|z.infer<typeof unresolvedBoundarySchema>;
export const isUnresolved=(value:BoundaryIdentity):value is z.infer<typeof unresolvedBoundarySchema>=>'kind' in value;
export const boundaryId=(value:BoundaryIdentity)=>isUnresolved(value)?value.boundaryId:value.regionId;
interface Boundary {region:BoundaryIdentity;polygons:Polygon[]}
const cross=(a:Point,b:Point,c:Point)=>(b[0]-a[0])*(c[1]-a[1])-(b[1]-a[1])*(c[0]-a[0]);
const on=(a:Point,b:Point,p:Point)=>Math.abs(cross(a,b,p))<=1e-10&&p[0]>=Math.min(a[0],b[0])-1e-10&&p[0]<=Math.max(a[0],b[0])+1e-10&&p[1]>=Math.min(a[1],b[1])-1e-10&&p[1]<=Math.max(a[1],b[1])+1e-10;
export function intersects(a:Point,b:Point,c:Point,d:Point){return on(a,b,c)||on(a,b,d)||on(c,d,a)||on(c,d,b)||(cross(a,b,c)>0)!==(cross(a,b,d)>0)&&(cross(c,d,a)>0)!==(cross(c,d,b)>0);}
const same=(a:Point,b:Point)=>a[0]===b[0]&&a[1]===b[1];
const pointKey=(p:Point)=>`${p[0]},${p[1]}`;
/** Only exact shared endpoints are supported. Conservative on-edge uncertainty rejects. */
function vertexContact(a:Point,b:Point,c:Point,d:Point,contacts:Set<string>,tick:()=>void){
 tick();const shared=[a,b].filter(p=>same(p,c)||same(p,d));if(shared.length!==1)return false;
 const p=shared[0],u=same(a,p)?b:a,v=same(c,p)?d:c;
 if(on(p,u,v)||on(p,v,u))return false;
 contacts.add(pointKey(p));return true;
}
type RingBox={west:number;east:number;south:number;north:number};
function ringBoxes(rings:Polygon,tick:()=>void):RingBox[]{return rings.map(ring=>{const box={west:Infinity,east:-Infinity,south:Infinity,north:-Infinity};for(const [x,y] of ring){tick();box.west=Math.min(box.west,x);box.east=Math.max(box.east,x);box.south=Math.min(box.south,y);box.north=Math.max(box.north,y);}return box;});}
/** Same conservative predicate as inside; y buckets only discard irrelevant edges.
 * Every insertion is metered, with a fixed reference ceiling before allocation.
 * Adjacent bins are included to cover rounding at a bucket boundary. */
export function indexRingInside(ring:Ring,tick:()=>void):(p:Point)=>number {
 const box=ringBoxes([ring],tick)[0],count=Math.min(256,Math.max(1,Math.ceil(Math.sqrt(ring.length-1)))),span=box.north-box.south;
 const bin=(y:number)=>span===0?0:Math.max(0,Math.min(count-1,Math.floor((y-box.south)/span*count)));
 const buckets:number[][]=Array.from({length:count},()=>[]);let references=0;
 for(let i=0;i<ring.length-1;i++){
  tick();const first=Math.max(0,bin(Math.min(ring[i][1],ring[i+1][1])-1e-10)-1),last=Math.min(count-1,bin(Math.max(ring[i][1],ring[i+1][1])+1e-10)+1);
  for(let j=first;j<=last;j++){tick();if(++references>1000000)throw new Error('Contact index reference budget');buckets[j].push(i);}
 }
 return (p:Point)=>{
  tick();if(p[0]<box.west-1e-10||p[0]>box.east+1e-10||p[1]<box.south-1e-10||p[1]>box.north+1e-10)return 0;
  let hit=false;for(const i of buckets[bin(p[1])]){tick();const a=ring[i],b=ring[i+1];if(on(a,b,p))return -1;if((a[1]>p[1])!==(b[1]>p[1])&&p[0]<(b[0]-a[0])*(p[1]-a[1])/(b[1]-a[1])+a[0])hit=!hit;}return hit?1:0;
 };
}
function polygonInside(p:Point,rings:Polygon,tick:()=>void,classifiers?:((p:Point)=>number)[]){
 const classify=(i:number)=>classifiers?classifiers[i](p):inside(p,rings[i],tick);
 const outer=classify(0);if(outer!==1)return outer;for(let i=1;i<rings.length;i++){const hole=classify(i);if(hole===-1)return -1;if(hole===1)return 0;}return 1;
}
/** With only vertex contacts, every open edge is a contact-free interval. */
function proveEdges(rings:Polygon,other:Polygon,expected:0|1,contacts:Set<string>,tick:()=>void){
 const classifiers=other.map(ring=>indexRingInside(ring,tick));
 for(const ring of rings)for(let i=0;i<ring.length-1;i++){
  tick();const a=ring[i],b=ring[i+1],v=polygonInside(a,other,tick,classifiers);
  if(v!==expected&&!(v===-1&&contacts.has(pointKey(a))))throw new Error('Unsupported contact interior topology');
  const midpoint:Point=[a[0]+(b[0]-a[0])/2,a[1]+(b[1]-a[1])/2];
  if(same(midpoint,a)||same(midpoint,b)||polygonInside(midpoint,other,tick,classifiers)!==expected)throw new Error('Unsupported ambiguous contact edge');
 }
}
/** Bounding-box sweep: every active-pair inspection consumes the caller's work budget.
 * Worst-case overlap remains bounded by that budget; no topology predicate is relaxed. */
export function ringsIntersect(a:Ring,b:Ring|undefined,tick:()=>void,contacts?:Set<string>):boolean {
 let segments=[...a.slice(0,-1).map((p,i)=>({a:p,b:a[i+1],i,group:0})),...(b?b.slice(0,-1).map((p,i)=>({a:p,b:b[i+1],i,group:1})):[])].map(s=>({...s,minX:Math.min(s.a[0],s.b[0]),maxX:Math.max(s.a[0],s.b[0]),minY:Math.min(s.a[1],s.b[1]),maxY:Math.max(s.a[1],s.b[1])}));
 // Cross-ring intersections require each segment box to meet the other ring box.
 if(b){const boxes=[{minX:Infinity,maxX:-Infinity,minY:Infinity,maxY:-Infinity},{minX:Infinity,maxX:-Infinity,minY:Infinity,maxY:-Infinity}];for(const segment of segments){tick();const box=boxes[segment.group];box.minX=Math.min(box.minX,segment.minX);box.maxX=Math.max(box.maxX,segment.maxX);box.minY=Math.min(box.minY,segment.minY);box.maxY=Math.max(box.maxY,segment.maxY);}segments=segments.filter(segment=>{tick();const other=boxes[1-segment.group];return segment.maxX>=other.minX-1e-10&&segment.minX<=other.maxX+1e-10&&segment.maxY>=other.minY-1e-10&&segment.minY<=other.maxY+1e-10;});}
 segments.sort((a,b)=>{tick();return a.minX-b.minX||a.i-b.i;});
 let active:typeof segments=[];
 for(const segment of segments){tick();const retained:typeof segments=[];for(const other of active){tick();if(other.maxX<segment.minX-1e-10)continue;retained.push(other);if(b&&segment.group===other.group)continue;if(!b&&(Math.abs(segment.i-other.i)===1||Math.abs(segment.i-other.i)===a.length-2))continue;if(other.maxY<segment.minY-1e-10||segment.maxY<other.minY-1e-10)continue;if(intersects(segment.a,segment.b,other.a,other.b)){if(!contacts||!vertexContact(segment.a,segment.b,other.a,other.b,contacts,tick))return true;}}retained.push(segment);active=retained;}
 return false;
}
/** -1 border, 0 outside, 1 strict interior. */
export function inside(p:Point,r:Ring,tick:()=>void){let hit=false;for(let i=0;i<r.length-1;i++){tick();const a=r[i],b=r[i+1];if(on(a,b,p))return -1;if((a[1]>p[1])!==(b[1]>p[1])&&p[0]<(b[0]-a[0])*(p[1]-a[1])/(b[1]-a[1])+a[0])hit=!hit;}return hit?1:0;}
export function contains(p:Point,b:Boundary,tick:()=>void){let hit=false;for(const rings of b.polygons){const exterior=inside(p,rings[0],tick);if(exterior===-1)return -1;if(!exterior)continue;let hole=false;for(const ring of rings.slice(1)){const result=inside(p,ring,tick);if(result===-1)return -1;if(result===1)hole=true;}if(!hole)hit=true;}return hit?1:0;}
export function boundaries(raw:unknown,maxVertices:number,tick:()=>void,allowUnresolved=false):Boundary[]{
 const root=z.strictObject({type:z.literal('FeatureCollection'),features:z.array(z.unknown()).max(10000)}).parse(raw);let vertices=0;const ids=new Set<string>();
 return root.features.map(value=>{const f=z.strictObject({type:z.literal('Feature'),properties:allowUnresolved?z.union([regionRefSchema,unresolvedBoundarySchema]):regionRefSchema,geometry:z.strictObject({type:z.enum(['Polygon','MultiPolygon']),coordinates:z.unknown()})}).parse(value);if(ids.has(boundaryId(f.properties)))throw new Error('Duplicate region');ids.add(boundaryId(f.properties));
 const coords=z.array(z.array(z.array(z.tuple([z.number().finite().min(-180).max(180),z.number().finite().min(-90).max(90)])))).parse(f.geometry.type==='Polygon'?[f.geometry.coordinates]:f.geometry.coordinates) as Polygon[];
 if(!coords.length)throw new Error('Empty polygon');
 for(const rings of coords){if(!rings.length)throw new Error('Empty rings');for(const ring of rings){vertices+=ring.length;if(vertices>maxVertices)throw new RangeError('Vertex budget');if(ring.length<4||JSON.stringify(ring[0])!==JSON.stringify(ring.at(-1)))throw new Error('Ring must be closed');let area=0;for(let i=0;i<ring.length-1;i++){const a=ring[i],b=ring[i+1];if(Math.abs(a[0]-b[0])>180)throw new Error('Unsplit dateline edge');if(a[0]===b[0]&&a[1]===b[1])throw new Error('Degenerate edge');area+=a[0]*b[1]-b[0]*a[1];tick();}if(ringsIntersect(ring,undefined,tick))throw new Error('Self intersecting ring');if(Math.abs(area)<1e-10)throw new Error('Degenerate ring');}
 for(let i=1;i<rings.length;i++){
 const contacts=new Set<string>();if(ringsIntersect(rings[i],rings[0],tick,contacts))throw new Error('Intersecting rings');
 if(contacts.size){proveEdges([rings[i]],[rings[0]],1,contacts,tick);proveEdges([rings[0]],[rings[i]],0,contacts,tick);}
 else if(inside(rings[i][0],rings[0],tick)!==1)throw new Error('Hole outside exterior');
 for(let j=1;j<i;j++){if(ringsIntersect(rings[i],rings[j],tick))throw new Error('Intersecting rings');if(inside(rings[i][0],rings[j],tick)!==0||inside(rings[j][0],rings[i],tick)!==0)throw new Error('Nested holes');}}

 }validateMultipart(coords,tick);return {region:f.properties,polygons:coords};});
}

/** Disjoint padded boxes cannot touch, overlap or contain one another. */
export function validateMultipart(polygons:Polygon[],tick:()=>void){
 const boxes=polygons.map(polygon=>{let west=Infinity,east=-Infinity,south=Infinity,north=-Infinity;for(const ring of polygon)for(const [x,y] of ring){tick();west=Math.min(west,x);east=Math.max(east,x);south=Math.min(south,y);north=Math.max(north,y);}return {west,east,south,north};});
 for(let i=0;i<polygons.length;i++)for(let j=0;j<i;j++){
  tick();const box=boxes[i],other=boxes[j];if(box.east<other.west-1e-10||other.east<box.west-1e-10||box.north<other.south-1e-10||other.north<box.south-1e-10)continue;
  const a=polygons[i],b=polygons[j],contacts=new Set<string>();for(const ar of a)for(const br of b){tick();if(ringsIntersect(ar,br,tick,contacts))throw new Error('Unsupported touching/overlapping multipart geometry');}
  if(contacts.size){proveEdges(a,b,0,contacts,tick);proveEdges(b,a,0,contacts,tick);}
  else if(polygonInside(a[0][0],b,tick)!==0||polygonInside(b[0][0],a,tick)!==0)throw new Error('Unsupported nested multipart geometry');
 }
}
