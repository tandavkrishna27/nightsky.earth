import {test} from 'node:test';
import assert from 'node:assert/strict';
import {boundaries,ringsIntersect,intersects,validateMultipart,type Point} from '../../scripts/osm/geographic-geometry';
const region={regionId:'region:v1:test',name:'Test',countryCode:'IND',adminLevel:0,boundaryRevision:'synthetic',sources:[{name:'Fixture',url:'https://example.org',attribution:'Fixture',dataClass:'catalog'}]};
function validate(ring:number[][]){let work=0;boundaries({type:'FeatureCollection',features:[{type:'Feature',properties:region,geometry:{type:'Polygon',coordinates:[ring]}}]},10000,()=>{if(++work>100000)throw new Error('Work budget');});return work;}
test('spatially sparse ring validation avoids quadratic pair enumeration',()=>{
 const ring=Array.from({length:2000},(_,i)=>[30*Math.cos(i*Math.PI/1000),30*Math.sin(i*Math.PI/1000)]);ring.push(ring[0]);assert.ok(validate(ring)<100000);
});
test('sweep still refuses crossings, repeated nonadjacent vertices and collinear overlap',()=>{
 for(const ring of [[[0,0],[4,4],[0,4],[4,0],[0,0]],[[0,0],[4,0],[4,4],[0,0],[0,4],[0,0]],[[0,0],[4,0],[2,0],[2,4],[0,4],[0,0]]])assert.throws(()=>validate(ring),/intersect|overlap/i);
});
test('sweep matches exhaustive predicate on deterministic arbitrary rings and ring pairs',()=>{
 let seed=27;const random=()=>((seed=(Math.imul(seed,1664525)+1013904223)>>>0)/4294967296)*10;
 const ring=()=>{const points=Array.from({length:12},()=>[random(),random()] as Point);return [...points,points[0]];};
 const brute=(a:Point[],b?:Point[])=>{for(let i=0;i<a.length-1;i++)for(let j=b?0:i+2;j<(b??a).length-1;j++){if(!b&&i===0&&j===a.length-2)continue;const c=b??a;if(intersects(a[i],a[i+1],c[j],c[j+1]))return true;}return false;};
 for(let i=0;i<100;i++){const a=ring(),b=ring();assert.equal(ringsIntersect(a,undefined,()=>{}),brute(a));assert.equal(ringsIntersect(a,b,()=>{}),brute(a,b));}
});
test('bbox tolerance preserves near-touching predicate and overlapping active scans consume budget',()=>{
 const a:Point[]=[[0,0],[1,0],[0,0]],b:Point[]=[[1+5e-11,0],[2,0],[1+5e-11,0]];assert.equal(ringsIntersect(a,b,()=>{}),true);
 const points=Array.from({length:500},(_,i)=>[i%2?10:0,i/100] as Point);points.push(points[0]);let work=0;
 assert.throws(()=>ringsIntersect(points,undefined,()=>{if(++work>3000)throw new Error('Work budget');}),/budget/);
});

test('cross-ring pruning agrees with exhaustive shifted and near-touching rings and bounds surrounding rings',()=>{
 const brute=(a:Point[],b:Point[])=>a.slice(0,-1).some((p,i)=>b.slice(0,-1).some((q,j)=>intersects(p,a[i+1],q,b[j+1])));
 let seed=101;const random=()=>((seed=(Math.imul(seed,1664525)+1013904223)>>>0)/4294967296);
 const make=(shift:number)=>{const points=Array.from({length:10},()=>[random()+shift,random()] as Point);return [...points,points[0]];};
 for(let i=0;i<100;i++){const a=make(0),b=make(i%4===0?2:i%4===1?1+5e-11:i%4===2?1-5e-11:0.5);assert.equal(ringsIntersect(a,b,()=>{}),brute(a,b));}
 const outer=Array.from({length:2000},(_,i)=>[30*Math.cos(i*Math.PI/1000),30*Math.sin(i*Math.PI/1000)] as Point);outer.push(outer[0]);const inner:Point[]=[[0,0],[1,0],[1,1],[0,1],[0,0]];let work=0;assert.equal(ringsIntersect(outer,inner,()=>{if(++work>5000)throw new Error('Pruned surrounding ring budget');}),false);assert.ok(work<5000);
});

const square=(a:number,b:number,c:number,d:number):Point[]=>[[a,b],[c,b],[c,d],[a,d],[a,b]];
function polygons(parts:Point[][][]){validateMultipart(parts,()=>{});return boundaries({type:'FeatureCollection',features:[{type:'Feature',properties:region,geometry:{type:'MultiPolygon',coordinates:parts}}]},10000,()=>{});}
test('canonical multipart permits isolated corners and islands inside holes',()=>{
 assert.doesNotThrow(()=>polygons([[square(0,0,2,2)],[square(2,2,4,4)]]));
 assert.doesNotThrow(()=>polygons([[square(0,0,10,10),square(2,2,8,8)],[square(3,3,4,4)]]));
});
test('canonical topology rejects shared edges, T contacts, near contacts and filled nesting',()=>{
 for(const other of [square(2,0,4,2),[[2,1],[3,0],[3,2],[2,1]] as Point[],square(2+5e-11,2,4,4),square(.5,.5,1,1),square(1,1,3,3)])assert.throws(()=>polygons([[square(0,0,2,2)],[other]]));
});
test('tangent hole is canonical but crossing and touching holes remain unsupported',()=>{
 const shell:Point[]=[[0,0],[4,0],[4,4],[0,4],[0,0]],hole:Point[]=[[0,0],[1,2],[2,1],[0,0]];
 assert.doesNotThrow(()=>polygons([[shell,hole]]));
 assert.throws(()=>polygons([[shell,[[0,0],[-1,2],[2,1],[0,0]]]]));
 assert.throws(()=>polygons([[shell,hole,[[0,0],[.2,.6],[.4,.4],[0,0]]]]));
});

test('contact proof rejects interior edge intervals and preserves winding/start invariance',()=>{
 const outer=square(0,0,4,4),inner:Point[]=[[0,0],[2,1],[1,2],[0,0]];
 assert.throws(()=>polygons([[outer],[inner]]),/contact/i);
 const rotate=(r:Point[])=>[...r.slice(2,-1),...r.slice(0,2),r[2]];
 for(const change of [(r:Point[])=>r,(r:Point[])=>[...r].reverse(),rotate])assert.doesNotThrow(()=>polygons([[change(square(0,0,2,2))],[change(square(2,2,4,4))]]));
});
test('contact interval proof charges every scan to caller work and propagates abort',()=>{
 let work=0;assert.throws(()=>validateMultipart([[square(0,0,2,2)],[square(2,2,4,4)]],()=>{if(++work>70)throw new Error('contact work budget');}),/budget/);
 const controller=new AbortController();controller.abort();assert.throws(()=>validateMultipart([[square(0,0,2,2)]],()=>controller.signal.throwIfAborted()),/abort/i);
});

test('sparse large tangent components prove disjointness within bounded work',()=>{
 const left=Array.from({length:2000},(_,i)=>[-30+30*Math.cos(i*Math.PI/1000),30*Math.sin(i*Math.PI/1000)] as Point),right=Array.from({length:2000},(_,i)=>[30+30*Math.cos(i*Math.PI/1000),30*Math.sin(i*Math.PI/1000)] as Point);left[0]=[0,0];right[1000]=[0,0];left.push(left[0]);right.push(right[0]);let work=0;
 assert.doesNotThrow(()=>validateMultipart([[left],[right]],()=>{if(++work>100000)throw new Error('Sparse contact work budget');}));assert.ok(work<100000);
});

test('indexed contact classifier matches conservative ring membership including borders and near edges',async()=>{
 const module=await import('../../scripts/osm/geographic-geometry');assert.equal(typeof (module as any).indexRingInside,'function');
 const rings:Point[][]=[square(0,0,4,4),[[0,0],[4,0],[4,1],[1,1],[1,4],[0,4],[0,0]],[[0,0],[2,2],[4,0],[4,4],[0,4],[0,0]]];
 for(const ring of rings){const classify=(module as any).indexRingInside(ring,()=>{});for(let x=-1;x<=5;x+=.25)for(let y=-1;y<=5;y+=.25)assert.equal(classify([x,y]),module.inside([x,y],ring,()=>{}));for(const p of ring)for(const delta of [-2e-10,-5e-11,0,5e-11,2e-10]){const point:Point=[p[0]+delta,p[1]+delta];assert.equal(classify(point),module.inside(point,ring,()=>{}));}}
});

test('indexed ring proof meters construction and queries while pruning irrelevant edges',async()=>{
 const {indexRingInside,inside}=await import('../../scripts/osm/geographic-geometry');
 const ring=Array.from({length:2000},(_,i)=>[30*Math.cos(i*Math.PI/1000),30*Math.sin(i*Math.PI/1000)] as Point);ring.push(ring[0]);let work=0;const classify=indexRingInside(ring,()=>{if(++work>50000)throw new Error('Indexed work budget');});
 for(let i=0;i<300;i++){const p:Point=[i%2?0:29,-30+i*.2];assert.equal(classify(p),inside(p,ring,()=>{}));}assert.ok(work<50000);
 let construction=0;assert.throws(()=>indexRingInside(ring,()=>{if(++construction>3000)throw new Error('Construction budget');}),/budget/);
 const controller=new AbortController(),abortable=indexRingInside(ring,()=>controller.signal.throwIfAborted());controller.abort();assert.throws(()=>abortable([0,0]),/abort/i);
});
test('indexed classification agrees on bucket endpoints, thin rings and deterministic arbitrary points',async()=>{
 const {indexRingInside,inside}=await import('../../scripts/osm/geographic-geometry');let seed=17;const random=()=>((seed=(Math.imul(seed,1664525)+1013904223)>>>0)/4294967296);
 for(const height of [1e-12,1e-8,1,80]){
  const ring=Array.from({length:128},(_,i)=>[15*Math.cos(i*Math.PI/64),height*Math.sin(i*Math.PI/64)] as Point);ring.push(ring[0]);const classify=indexRingInside(ring,()=>{});
  for(let i=0;i<1000;i++){const p:Point=[(random()-.5)*40,(random()-.5)*height*3];assert.equal(classify(p),inside(p,ring,()=>{}));}
  for(let i=0;i<=12;i++)for(const epsilon of [-1e-10,0,1e-10]){const p:Point=[0,-height+i*height/6+epsilon];assert.equal(classify(p),inside(p,ring,()=>{}));}
 }
});
