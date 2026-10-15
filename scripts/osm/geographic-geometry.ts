import * as z from 'zod4';
import {regionRefSchema,type RegionRef} from '../../shared/nightsky/discovery';
export type Point=[number,number];type Ring=Point[];export type Polygon=Ring[];
interface Boundary {region:RegionRef;polygons:Polygon[]}
const cross=(a:Point,b:Point,c:Point)=>(b[0]-a[0])*(c[1]-a[1])-(b[1]-a[1])*(c[0]-a[0]);
const on=(a:Point,b:Point,p:Point)=>Math.abs(cross(a,b,p))<=1e-10&&p[0]>=Math.min(a[0],b[0])-1e-10&&p[0]<=Math.max(a[0],b[0])+1e-10&&p[1]>=Math.min(a[1],b[1])-1e-10&&p[1]<=Math.max(a[1],b[1])+1e-10;
export function intersects(a:Point,b:Point,c:Point,d:Point){return on(a,b,c)||on(a,b,d)||on(c,d,a)||on(c,d,b)||(cross(a,b,c)>0)!==(cross(a,b,d)>0)&&(cross(c,d,a)>0)!==(cross(c,d,b)>0);}
/** -1 border, 0 outside, 1 strict interior. */
export function inside(p:Point,r:Ring,tick:()=>void){let hit=false;for(let i=0;i<r.length-1;i++){tick();const a=r[i],b=r[i+1];if(on(a,b,p))return -1;if((a[1]>p[1])!==(b[1]>p[1])&&p[0]<(b[0]-a[0])*(p[1]-a[1])/(b[1]-a[1])+a[0])hit=!hit;}return hit?1:0;}
export function contains(p:Point,b:Boundary,tick:()=>void){let hit=false;for(const rings of b.polygons){const exterior=inside(p,rings[0],tick);if(exterior===-1)return -1;if(!exterior)continue;let hole=false;for(const ring of rings.slice(1)){const result=inside(p,ring,tick);if(result===-1)return -1;if(result===1)hole=true;}if(!hole)hit=true;}return hit?1:0;}
export function boundaries(raw:unknown,maxVertices:number,tick:()=>void):Boundary[]{
 const root=z.strictObject({type:z.literal('FeatureCollection'),features:z.array(z.unknown()).max(10000)}).parse(raw);let vertices=0;const ids=new Set<string>();
 return root.features.map(value=>{const f=z.strictObject({type:z.literal('Feature'),properties:regionRefSchema,geometry:z.strictObject({type:z.enum(['Polygon','MultiPolygon']),coordinates:z.unknown()})}).parse(value);if(ids.has(f.properties.regionId))throw new Error('Duplicate region');ids.add(f.properties.regionId);
 const coords=z.array(z.array(z.array(z.tuple([z.number().finite().min(-180).max(180),z.number().finite().min(-90).max(90)])))).parse(f.geometry.type==='Polygon'?[f.geometry.coordinates]:f.geometry.coordinates) as Polygon[];
 if(!coords.length)throw new Error('Empty polygon');
 for(const rings of coords){if(!rings.length)throw new Error('Empty rings');for(const ring of rings){vertices+=ring.length;if(vertices>maxVertices)throw new RangeError('Vertex budget');if(ring.length<4||JSON.stringify(ring[0])!==JSON.stringify(ring.at(-1)))throw new Error('Ring must be closed');let area=0;for(let i=0;i<ring.length-1;i++){const a=ring[i],b=ring[i+1];if(Math.abs(a[0]-b[0])>180)throw new Error('Unsplit dateline edge');if(a[0]===b[0]&&a[1]===b[1])throw new Error('Degenerate edge');area+=a[0]*b[1]-b[0]*a[1];for(let j=i+2;j<ring.length-1;j++){tick();if(i===0&&j===ring.length-2)continue;if(intersects(a,b,ring[j],ring[j+1]))throw new Error('Self intersecting ring');}}if(Math.abs(area)<1e-10)throw new Error('Degenerate ring');}
 for(let i=1;i<rings.length;i++){if(inside(rings[i][0],rings[0],tick)!==1)throw new Error('Hole outside exterior');for(let j=0;j<i;j++){for(let a=0;a<rings[i].length-1;a++)for(let b=0;b<rings[j].length-1;b++){tick();if(intersects(rings[i][a],rings[i][a+1],rings[j][b],rings[j][b+1]))throw new Error('Intersecting rings');}if(j>0&&(inside(rings[i][0],rings[j],tick)!==0||inside(rings[j][0],rings[i],tick)!==0))throw new Error('Nested holes');}}
 }return {region:f.properties,polygons:coords};});
}
