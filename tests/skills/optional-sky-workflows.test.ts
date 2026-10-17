import assert from 'node:assert/strict';
import {readFileSync,readdirSync} from 'node:fs';
import {test} from 'node:test';
for(const name of readdirSync('plugins/nightsky/skills')) test(`${name}: optional sky sources preserve evidence limits`,()=>{
 for(const path of [`plugins/nightsky/skills/${name}/SKILL.md`,`docs/product/workflows/${name}.md`]){
  const text=readFileSync(path,'utf8');
  for(const token of ['## Optional sky sources','category bands','full-window','DONKI','get_small_body_ephemeris','never claim the API was called'])assert.ok(text.includes(token),`${path}: ${token}`);
 }
});
