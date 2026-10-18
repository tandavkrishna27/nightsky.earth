import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {buildLocalPluginPackage} from '../../scripts/build-local-plugin-package';

test('reviewed local artifact freeze matches both portable packages without public acceptance claims',()=>{
 const receipt=JSON.parse(readFileSync('docs/operations/v1-local-artifact-freeze-20261019.json','utf8'));
 assert.equal(receipt.pluginVersion,JSON.parse(readFileSync('plugins/nightsky/plugin.json','utf8')).version);
 assert.equal(receipt.deploymentReady,false);
 assert.equal(receipt.publicSourceAdmissionGranted,false);
 assert.equal(receipt.claudeNativeAccepted,false);
 assert.equal(receipt.installedCodexFilesMatchAtReview,true);
 for(const host of ['codex','claude'] as const){
  const built=buildLocalPluginPackage({host,endpoint:'http://127.0.0.1:8765/mcp'});
  const row=receipt.packages.find((entry:{host:string})=>entry.host===host);
  assert.equal(row.sha256,built.sha256);
  assert.deepEqual(row.inventory,built.inventory);
 }
});
