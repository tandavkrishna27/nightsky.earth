import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {test} from 'node:test';
import {buildPluginPackage} from '../../scripts/build-plugin-package';

test('all workflows keep beginner values and mandatory credits without catalogue-wide bibliographies',()=>{
 for(const name of ['find-observing-place','plan-stargazing-night','plan-sky-event','plan-astrophotography','prepare-outing']){
  for(const path of [`plugins/nightsky/skills/${name}/SKILL.md`,`docs/product/workflows/${name}.md`]){
   const text=readFileSync(path,'utf8');
   assert.match(text,/## Clear answers and compact credits/);
   assert.match(text,/Do not reproduce a catalogue-wide bibliography/);
   assert.match(text,/Keep mandatory provider attribution visible/);
   assert.match(text,/Higher comparable SQM means darker sky/);
   assert.match(text,/Do not invent a credits-page URL/);
   assert.doesNotMatch(text,/Include the complete source links returned for every source used/);
  }
 }
});

test('place workflow evaluates a bounded shortlist before claiming a requested darkness range',()=>{
 for(const path of ['plugins/nightsky/skills/find-observing-place/SKILL.md','docs/product/workflows/find-observing-place.md']){
  const text=readFileSync(path,'utf8');
  for(const phrase of ['## Finding places by darkness','one to five candidate points','reported Bortle label is a lead','not the globally closest qualifying site','partially overlaps','Do not silently restore a removed driving-time limit'])assert.ok(text.includes(phrase),`${path}: ${phrase}`);
 }
});
for(const name of ['find-observing-place','plan-stargazing-night','plan-sky-event','plan-astrophotography'])test(`${name}: light pollution evidence stays bounded and separate from travel`,()=>{for(const path of [`plugins/nightsky/skills/${name}/SKILL.md`,`docs/product/workflows/${name}.md`]){const text=readFileSync(path,'utf8');for(const token of ['compare_light_pollution','mag/arcsec2','rounded','independent corroboration','unverified_zero','80%','artificial','dataset vintage','evaluated candidates','401','night access'])assert.ok(text.includes(token),`${path}: ${token}`);}});
test('package inventories optional light pollution tool',()=>assert.ok(buildPluginPackage().optionalToolNames.includes('compare_light_pollution')));

test('final answer guidance retains downstream OSM credit and ranks sparse evidence only by sample', () => {
 for (const name of ['find-observing-place','plan-stargazing-night','plan-sky-event','plan-astrophotography','prepare-outing']) for (const path of [`plugins/nightsky/skills/${name}/SKILL.md`, `docs/product/workflows/${name}.md`]) {
  const text = readFileSync(path, 'utf8');
  const credits = text.split('## Clear answers and compact credits')[1].split('## ')[0];
  const audit = text.split('## Final answer audit')[1];
  assert.match(credits, /© OpenStreetMap contributors \(ODbL\).*https:\/\/www\.openstreetmap\.org\/copyright/, path);
  assert.match(credits, /Geoapify link alone does not credit OpenStreetMap/, path);
  assert.match(audit, /required source names.*downstream credits.*survive compression/, path);
  assert.match(audit, /lowest-cloud returned sample.*timestamp and value/, path);
  assert.match(audit, /earlier hours look more promising.*continuous weather coverage/, path);
 }
 const contract = readFileSync('docs/product/outdoor-conversation-contract.md', 'utf8');
 assert.match(contract, /OpenStreetMap contributors/);
 assert.match(contract, /lowest-cloud returned sample/);
});
