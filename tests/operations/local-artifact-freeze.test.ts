import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
test('historical local artifact freeze retains its reviewed receipt without claiming current package identity',()=>{
 const receipt=JSON.parse(readFileSync('docs/operations/v1-local-artifact-freeze-20261019.json','utf8'));
 assert.equal(receipt.pluginVersion,JSON.parse(readFileSync('plugins/nightsky/plugin.json','utf8')).version);
 assert.equal(receipt.deploymentReady,false);
 assert.equal(receipt.publicSourceAdmissionGranted,false);
 assert.equal(receipt.claudeNativeAccepted,false);
 assert.equal(receipt.installedCodexFilesMatchAtReview,true);
 for(const host of ['codex','claude'] as const){
  const row=receipt.packages.find((entry:{host:string})=>entry.host===host);
  assert.match(row.sha256,/^[a-f0-9]{64}$/);
  const paths=row.inventory.map((entry:{path:string})=>entry.path);
  assert.deepEqual(paths,row.canonicalTextInventory.map((entry:{path:string})=>entry.path));
  assert.deepEqual(paths,[...paths].sort());
  for(const entry of [...row.inventory,...row.canonicalTextInventory]){
   assert.ok(entry.bytes>0);
   assert.match(entry.sha256,/^[a-f0-9]{64}$/);
  }
 }
});

test('artifact normalization retains BOM and content distinctions while accepting only CRLF differences',()=>{
 const canonical=(value:Uint8Array)=>Buffer.from(new TextDecoder('utf-8',{fatal:true,ignoreBOM:true}).decode(value).replace(/\r\n/g,'\n'),'utf8');
 assert.deepEqual(canonical(Buffer.from('a\r\nb')),canonical(Buffer.from('a\nb')));
 const plain=Buffer.from('ab');
 assert.notDeepEqual(canonical(Buffer.concat([Buffer.from([0xef,0xbb,0xbf]),plain])),canonical(plain));
 assert.notDeepEqual(canonical(Buffer.from('ac')),canonical(plain));
 assert.throws(()=>canonical(Uint8Array.from([0xff])));
});
