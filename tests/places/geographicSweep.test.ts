import {test} from 'node:test';
import assert from 'node:assert/strict';
import {boundaries,ringsIntersect,intersects,type Point} from '../../scripts/osm/geographic-geometry';
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
