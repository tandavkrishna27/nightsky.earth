import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,readFile,writeFile} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {createHash} from 'node:crypto';
import {buildLineageTree,verifyLineageUnion} from '../../../scripts/era5/build-lineage';
import {createLineageReader,createLineageCache,type SourceRow,type MembershipRow} from '../../../server/providers/climate/lineageRadix';

const budgets={maxInputBytes:16*1024*1024,maxMemoryBytes:32*1024*1024,maxScratchBytes:64*1024*1024,maxOutputBytes:64*1024*1024,maxDurationMs:60_000};
async function* stream(rows:(SourceRow|MembershipRow)[]){yield* rows;}
async function destination(){return join(await mkdtemp(join(tmpdir(),'era5-radix-')),'tree');}
const row=(revision:string,sha256='a'.repeat(64)):SourceRow=>({kind:'raw',revision,sha256});

test('lineage union retains over 10,000 pins, deduplicates and reads five bounded objects',async()=>{
 const rows=Array.from({length:10001},(_,i)=>row(`revision-${i}`));const outputDirectory=await destination();
 const {descriptor,metrics}=await buildLineageTree({rows:stream([...rows,rows[3]]),kind:'source',outputDirectory,budgets});
 assert.equal(descriptor.count,10001);assert.equal(descriptor.rawCount,10001);assert.equal(metrics.inputRows,10002);
 let reads=0;const cache=createLineageCache(2*1024*1024);const reader=createLineageReader({baseDirectory:outputDirectory,cache,onRead:()=>{reads++;}});
 assert.deepEqual(await reader.lookup(descriptor,'raw|revision-10000'),rows[10000]);assert.ok(reads<=5);assert.ok(cache.inspect().bytes<=2*1024*1024);
 let count=0;for await(const item of reader.walk(descriptor)){assert.equal(item.sha256,'a'.repeat(64));count++;}assert.equal(count,10001);
});
test('lineage rejects same-key conflicting pins and leaves failed scratch for review',async()=>{
 await assert.rejects(buildLineageTree({rows:stream([row('same'),row('same','b'.repeat(64))]),kind:'source',outputDirectory:await destination(),budgets}),/conflict/i);
});
test('membership round trips its identity and source totals and detects a changed root',async()=>{
 const entry:MembershipRow={edge:'release-shard',parent:'release',child:'shard',sha256:'c'.repeat(64),count:3,rawCount:1,decodedCount:1,manifestCount:1};
 const outputDirectory=await destination();const {descriptor}=await buildLineageTree({rows:stream([entry]),kind:'membership',outputDirectory,budgets});
 const reader=createLineageReader({baseDirectory:outputDirectory});assert.deepEqual(await reader.lookup(descriptor,'release-shard|release|shard'),entry);
 assert.equal(await reader.lookup(descriptor,'release-shard|release|absent'),undefined);
 const path=join(outputDirectory,descriptor.rootPath);await writeFile(path,Buffer.alloc(descriptor.rootBytes,32));
 await assert.rejects(createLineageReader({baseDirectory:outputDirectory}).verifyRoot(descriptor),/digest|checksum/i);
});
test('root rejects extra fields, count tampering, and unsafe paths',async()=>{
 const outputDirectory=await destination();const {descriptor}=await buildLineageTree({rows:stream([row('one')]),kind:'source',outputDirectory,budgets});
 const reader=createLineageReader({baseDirectory:outputDirectory});
 await assert.rejects(reader.verifyRoot({...descriptor,count:2}),/count/i);
 await assert.rejects(reader.verifyRoot({...descriptor,rootPath:'../escape'}),/path/i);
 const path=join(outputDirectory,descriptor.rootPath);const data=JSON.parse(await readFile(path,'utf8'));data.extra=true;const bytes=Buffer.from(JSON.stringify(data));await writeFile(path,bytes);
 await assert.rejects(reader.verifyRoot({...descriptor,rootBytes:bytes.length,rootSha256:createHash('sha256').update(bytes).digest('hex')}),/key|canonical/i);
});
test('budgets fail before publication and an existing output directory is never reused',async()=>{
 const outputDirectory=await destination();
 await assert.rejects(buildLineageTree({rows:stream([row('one')]),kind:'source',outputDirectory,budgets:{...budgets,maxInputBytes:1}}),/input.*budget/i);
 await assert.rejects(buildLineageTree({rows:stream([row('one')]),kind:'source',outputDirectory,budgets}),/exist/i);
});
test('independent source union audit rejects omissions, additions and changed pins without writing another tree',async()=>{
 const rows=[row('first'),row('second')];const outputDirectory=await destination();const {descriptor}=await buildLineageTree({rows:stream(rows),kind:'source',outputDirectory,budgets});
 const audit=(expected:SourceRow[])=>destination().then(scratchDirectory=>verifyLineageUnion({rows:stream(expected),descriptor,baseDirectory:outputDirectory,scratchDirectory,budgets}));
 const result=await audit([...rows,rows[0]]);assert.equal(result.outputBytes,0);assert.equal(result.uniqueRows,2);
 await assert.rejects(audit([rows[0]]),/union/i);await assert.rejects(audit([...rows,row('third')]),/union/i);await assert.rejects(audit([row('first','b'.repeat(64)),rows[1]]),/union/i);
});

test('radix root rejects invalid UTF-8 even when its replacement text is canonical JSON',async()=>{
 const {canonicalLineage}=await import('../../../server/providers/climate/lineageRadix');
 const outputDirectory=await destination(),{descriptor}=await buildLineageTree({rows:stream([row('one')]),kind:'source',outputDirectory,budgets});
 const path=join(outputDirectory,descriptor.rootPath),data=JSON.parse(await readFile(path,'utf8'));data.children[0].firstKey='�';data.children[0].lastKey='�';
 const text=canonicalLineage(data),valid=Buffer.from(text),at=valid.indexOf(Buffer.from('�'));const invalid=Buffer.concat([valid.subarray(0,at),Buffer.from([255]),valid.subarray(at+3)]);await writeFile(path,invalid);
 await assert.rejects(createLineageReader({baseDirectory:outputDirectory}).verifyRoot({...descriptor,rootBytes:invalid.length,rootSha256:createHash('sha256').update(invalid).digest('hex')}));
});

test('repinned malformed leaves reject wrong radix prefixes, reordered or duplicate keys and 2001 rows',async()=>{
 const {lineagePrefix,lineageKey,canonicalLineage,lineageSha}=await import('../../../server/providers/climate/lineageRadix');const buckets=new Map<string,SourceRow>();let pair:SourceRow[]=[];
 for(let i=0;!pair.length;i++){const candidate=row('collision-'+i),prefix=lineagePrefix(lineageKey(candidate)),prior=buckets.get(prefix);if(prior)pair=[prior,candidate];else buckets.set(prefix,candidate);}
 for(const mutation of ['prefix','reordered','duplicate','2001']){const outputDirectory=await destination(),{descriptor}=await buildLineageTree({rows:stream(pair),kind:'source',outputDirectory,budgets}),prefix=lineagePrefix(lineageKey(pair[0]));const leafPath=join(outputDirectory,'objects',prefix+'.json'),leaf=JSON.parse(await readFile(leafPath,'utf8'));
 if(mutation==='prefix')leaf.prefix=prefix==='0000'?'1111':'0000';if(mutation==='reordered')leaf.rows.reverse();if(mutation==='duplicate')leaf.rows[1]=leaf.rows[0];if(mutation==='2001')leaf.rows=Array.from({length:2001},()=>leaf.rows[0]);
 let bytes=Buffer.from(canonicalLineage(leaf));await writeFile(leafPath,bytes);let ref={sha256:lineageSha(bytes),bytes:bytes.length};for(let depth=3;depth>=0;depth--){const nodePrefix=prefix.slice(0,depth),path=join(outputDirectory,'objects',(nodePrefix||'root')+'.json'),node=JSON.parse(await readFile(path,'utf8'));Object.assign(node.children.find((c:any)=>c.nibble===prefix[depth]),ref);bytes=Buffer.from(canonicalLineage(node));await writeFile(path,bytes);ref={sha256:lineageSha(bytes),bytes:bytes.length};}
 await assert.rejects(async()=>{for await(const _ of createLineageReader({baseDirectory:outputDirectory}).walk({...descriptor,rootSha256:ref.sha256,rootBytes:ref.bytes})){}},undefined,mutation);
 }
});
