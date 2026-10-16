import { test } from 'node:test';
import assert from 'node:assert/strict';
import { filterResources, parseResourceState, serializeResourceState } from '../../client/src/lib/resourceSearch';
import type { Resource } from '../../client/src/content/resources';
const items:Resource[] = [
 {id:'moon',name:'Moon photography',description:'A field guide',topics:['photography'],format:'guides',url:'https://example.org',reviewedAt:'2026-10-16'},
 {id:'map',name:'Sky map',description:'Stargazing',topics:['stargazing'],format:'tools',url:'https://example.org',reviewedAt:'2026-10-16'}
];
test('resource matching ANDs words and filters without mutating',()=>{
 assert.deepEqual(filterResources(items,{q:'  MOON guide ',topic:'photography',format:'guides'}).map(x=>x.id),['moon']);
 assert.equal(filterResources(items,{q:'moon map',topic:'all',format:'all'}).length,0);
 assert.equal(filterResources(items,{q:'',topic:'stargazing',format:'guides'}).length,0);
 assert.equal(items.length,2);
});
test('URL state normalizes invalid values and preserves unrelated parameters',()=>{
 assert.deepEqual(parseResourceState('?topic=wrong&format=wrong'),{q:'',topic:'all',format:'all'});
 const value={q:'Moon & sky',topic:'photography',format:'guides'} as const;
 const query=serializeResourceState(value,'?ref=home');
 assert.equal(new URLSearchParams(query).get('ref'),'home');
 assert.deepEqual(parseResourceState(query),value);
});
