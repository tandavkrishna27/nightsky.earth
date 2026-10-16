import { test } from 'node:test';
import assert from 'node:assert/strict';
import { resolvePluginAction, canonicalUrl } from '../../shared/website';
test('listing must be public and a specific safe official destination', () => {
  assert.deepEqual(resolvePluginAction({published:false,url:null}), {label:'Get started',href:'/get-started',external:false});
  for (const url of ['', 'http://chatgpt.com/x', 'javascript:alert(1)', 'https://example.com/x', 'https://chatgpt.com.evil.test/x', 'https://u:p@chatgpt.com/x', 'https://chatgpt.com/apps']) assert.equal(resolvePluginAction({published:true,url}).external,false);
  assert.equal(resolvePluginAction({published:true,url:'https://chatgpt.com/example'}).label,'Get NightSky for ChatGPT');
  assert.equal(resolvePluginAction({published:false,url:'https://chatgpt.com/example'}).external,false);
});
test('canonical never inherits preview host or query', () => {
  assert.equal(canonicalUrl('/resources?q=moon#results'),'https://nightsky.earth/resources');
  assert.equal(canonicalUrl('https://preview.invalid/about?q=x'),'https://nightsky.earth/about');
});
