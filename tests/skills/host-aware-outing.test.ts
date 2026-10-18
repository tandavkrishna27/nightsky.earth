import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const names=['find-observing-place','plan-stargazing-night','plan-sky-event','plan-astrophotography','prepare-outing'];
for(const name of names)test(`${name}: complete host-aware outing contract`,()=>{
 const skill=readFileSync(`plugins/nightsky/skills/${name}/SKILL.md`,'utf8');
 const workflow=readFileSync(`docs/product/workflows/${name}.md`,'utf8');
 for(const text of [skill,workflow]){
  for(const phrase of ['one or two','independent preferences','scouting point','When you get there','permission is declined','same candidate','returned timestamps','quota','navigation light']) assert.ok(text.includes(phrase),`${name}: missing ${phrase}`);
  assert.ok(!text.includes('Do not give compass-direction setup advice in a planning answer.'));
 }
});
