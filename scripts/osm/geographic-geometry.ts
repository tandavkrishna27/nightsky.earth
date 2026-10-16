import * as z from 'zod4';
import {regionRefSchema,type RegionRef} from '../../shared/nightsky/discovery';
export type Point=[number,number];type Ring=Point[];export type Polygon=Ring[];
interface Boundary {region:RegionRef;polygons:Polygon[]}
const cross=(a:Point,b:Point,c:Point)=>(b[0]-a[0])*(c[1]-a[1])-(b[1]-a[1])*(c[0]-a[0]);
const on=(a:Point,b:Point,p:Point)=>Math.abs(cross(a,b,p))<=1e-10&&p[0]>=Math.min(a[0],b[0])-1e-10&&p[0]<=Math.max(a[0],b[0])+1e-10&&p[1]>=Math.min(a[1],b[1])-1e-10&&p[1]<=Math.max(a[1],b[1])+1e-10;
export function intersects(a:Point,b:Point,c:Point,d:Point){return on(a,b,c)||on(a,b,d)||on(c,d,a)||on(c,d,b)||(cross(a,b,c)>0)!==(cross(a,b,d)>0)&&(cross(c,d,a)>0)!==(cross(c,d,b)>0);}
/** Bounding-box sweep: every active-pair inspection consumes the caller's work budget.
 * Worst-case overlap remains bounded by that budget; no topology predicate is relaxed. */
export function ringsIntersect(a:Ring,b:Ring|undefined,tick:()=>void):boolean {
 const segments=[...a.slice(0,-1).map((p,i)=>({a:p,b:a[i+1],i,group:0})),...(b?b.slice(0,-1).map((p,i)=>({a:p,b:b[i+1],i,group:1})):[])].map(s=>({...s,minX:Math.min(s.a[0],s.b[0]),maxX:Math.max(s.a[0],s.b[0]),minY:Math.min(s.a[1],s.b[1]),maxY:Math.max(s.a[1],s.b[1])}));
 segments.sort((a,b)=>{tick();return a.minX-b.minX||a.i-b.i;});
 let active:typeof segments=[];
 for(const segment of segments){tick();const retained:typeof segments=[];for(const other of active){tick();if(other.maxX<segment.minX-1e-10)continue;retained.push(other);if(b&&segment.group===other.group)continue;if(!b&&(Math.abs(segment.i-other.i)===1||Math.abs(segment.i-other.i)===a.length-2))continue;if(other.maxY<segment.minY-1e-10||segment.maxY<other.minY-1e-10)continue;if(intersects(segment.a,segment.b,other.a,other.b))return true;}retained.push(segment);active=retained;}
 return false;
}
/** -1 border, 0 outside, 1 strict interior. */
export function inside(p:Point,r:Ring,tick:()=>void){let hit=false;for(let i=0;i<r.length-1;i++){tick();const a=r[i],b=r[i+1];if(on(a,b,p))return -1;if((a[1]>p[1])!==(b[1]>p[1])&&p[0]<(b[0]-a[0])*(p[1]-a[1])/(b[1]-a[1])+a[0])hit=!hit;}return hit?1:0;}
export function contains(p:Point,b:Boundary,tick:()=>void){let hit=false;for(const rings of b.polygons){const exterior=inside(p,rings[0],tick);if(exterior===-1)return -1;if(!exterior)continue;let hole=false;for(const ring of rings.slice(1)){const result=inside(p,ring,tick);if(result===-1)return -1;if(result===1)hole=true;}if(!hole)hit=true;}return hit?1:0;}
export function boundaries(raw:unknown,maxVertices:number,tick:()=>void):Boundary[]{
 const root=z.strictObject({type:z.literal('FeatureCollection'),features:z.array(z.unknown()).max(10000)}).parse(raw);let vertices=0;const ids=new Set<string>();
 return root.features.map(value=>{const f=z.strictObject({type:z.literal('Feature'),properties:regionRefSchema,geometry:z.strictObject({type:z.enum(['Polygon','MultiPolygon']),coordinates:z.unknown()})}).parse(value);if(ids.has(f.properties.regionId))throw new Error('Duplicate region');ids.add(f.properties.regionId);
 const coords=z.array(z.array(z.array(z.tuple([z.number().finite().min(-180).max(180),z.number().finite().min(-90).max(90)])))).parse(f.geometry.type==='Polygon'?[f.geometry.coordinates]:f.geometry.coordinates) as Polygon[];
 if(!coords.length)throw new Error('Empty polygon');
 for(const rings of coords){if(!rings.length)throw new Error('Empty rings');for(const ring of rings){vertices+=ring.length;if(vertices>maxVertices)throw new RangeError('Vertex budget');if(ring.length<4||JSON.stringify(ring[0])!==JSON.stringify(ring.at(-1)))throw new Error('Ring must be closed');let area=0;for(let i=0;i<ring.length-1;i++){const a=ring[i],b=ring[i+1];if(Math.abs(a[0]-b[0])>180)throw new Error('Unsplit dateline edge');if(a[0]===b[0]&&a[1]===b[1])throw new Error('Degenerate edge');area+=a[0]*b[1]-b[0]*a[1];tick();}if(ringsIntersect(ring,undefined,tick))throw new Error('Self intersecting ring');if(Math.abs(area)<1e-10)throw new Error('Degenerate ring');}
 for(let i=1;i<rings.length;i++){if(inside(rings[i][0],rings[0],tick)!==1)throw new Error('Hole outside exterior');for(let j=0;j<i;j++){if(ringsIntersect(rings[i],rings[j],tick))throw new Error('Intersecting rings');if(j>0&&(inside(rings[i][0],rings[j],tick)!==0||inside(rings[j][0],rings[i],tick)!==0))throw new Error('Nested holes');}}
 }return {region:f.properties,polygons:coords};});
}
