import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const names=['find-observing-place','plan-stargazing-night','plan-sky-event','plan-astrophotography','prepare-outing'];

test('every packaged and canonical workflow preserves WeatherAPI end-user notice',()=>{
 for(const name of names){
  for(const path of [`plugins/nightsky/skills/${name}/SKILL.md`,`docs/product/workflows/${name}.md`]){
   const text=readFileSync(path,'utf8');
   assert.match(text,/When using WeatherAPI\.com forecast data, keep its returned end-user notice visible beside the forecast or immediately below it/,path);
   assert.match(text,/copy the returned notice in full, including the safety-critical-use limit and instruction to consult official meteorological services/,path);
  }
 }
});
