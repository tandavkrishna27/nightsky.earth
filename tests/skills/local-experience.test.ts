import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const names = ["find-observing-place", "plan-stargazing-night", "plan-astrophotography", "plan-sky-event", "prepare-outing"];
const documents = names.flatMap((name) => [
  `plugins/nightsky/skills/${name}/SKILL.md`,
  `docs/product/workflows/${name}.md`,
]);

// Static authoring guards only: these catch omitted interpretation instructions.
// They do not establish that a host loaded a skill or that a model follows it.
const rules: [string, RegExp[]][] = [
  ["nested clipped darkness must not become exclusive twilight or polar night", [
    /nested.*below.*(?:threshold|Sun)|below.*(?:threshold|Sun).*nested/i,
    /civil.*-6.*nautical.*-12.*astronomical.*-18/i,
    /clipped.*requested.*window/i,
    /not.*exclusive.*twilight/i,
    /matching.*intervals.*(?:not|never).*polar night/i,
    /matching.*intervals.*(?:not|never).*(?:fake|mock)/i,
  ]],
  ["opportunity must preserve conditional Milky Way and equipment limits", [
    /Milky Way.*conditional.*(?:cloud|dark)/i,
    /Saturn.*naked.eye.*point.*rings.*telescope/i,
    /direction.*maximum altitude.*not.*whole.*window/i,
  ]],
  ["missing evidence must retain distinct causes and unknown conditions", [
    /weather.*access.*unknown/i,
    /provider.*unavailable/i,
    /(?:unconfigured|not configured).*(?:fixture|artifact|index)/i,
    /unsupported.*seeing.*catalog.*global coverage/i,
    /(?:permits|restrictions).*(?:returned|official).*source/i,
  ]],
  ["beginner answer must lead with a short useful summary", [
    /(?:lead|start|begin).*outcome/i,
    /(?:three|3).*bullets/i,
    /local times.*timezone/i,
    /source links/i,
    /one.*next step/i,
  ]],
];

for (const [scenario, requirements] of rules) {
  test(`local workflow authoring: ${scenario}`, () => {
    for (const path of documents) {
      const text = readFileSync(path, "utf8");
      for (const requirement of requirements) assert.match(text, requirement, `${path}: missing ${requirement}`);
    }
  });
}

test("canonical skill source references remain paired with their workflow", () => {
  for (const name of names) {
    const path = `docs/product/workflows/${name}.md`;
    assert.ok(readFileSync(`plugins/nightsky/skills/${name}/SKILL.md`, "utf8").includes(path));
    assert.ok(readFileSync(path, "utf8").length > 0);
  }
});

test("window classification contract and installed skill behavior remain pending", () => {
  const text = readFileSync("docs/product/workflows/plan-stargazing-night.md", "utf8");
  assert.match(text, /polarState.*window.*classification/i);
  assert.match(text, /contract.*pending|pending.*contract/i);
  assert.match(text, /installed.*skill.*(?:deferred|pending)/i);
});
