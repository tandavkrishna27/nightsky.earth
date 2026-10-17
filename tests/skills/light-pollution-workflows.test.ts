import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {test} from 'node:test';
import {buildPluginPackage} from '../../scripts/build-plugin-package';
for(const name of ['find-observing-place','plan-stargazing-night','plan-sky-event','plan-astrophotography'])test(`${name}: light pollution evidence stays bounded and separate from travel`,()=>{for(const path of [`plugins/nightsky/skills/${name}/SKILL.md`,`docs/product/workflows/${name}.md`]){const text=readFileSync(path,'utf8');for(const token of ['compare_light_pollution','mag/arcsec2','rounded','independent corroboration','unverified_zero','80%','artificial','dataset vintage','evaluated candidates','401','night access'])assert.ok(text.includes(token),`${path}: ${token}`);}});
test('package inventories optional light pollution tool',()=>assert.ok(buildPluginPackage().optionalToolNames.includes('compare_light_pollution')));
