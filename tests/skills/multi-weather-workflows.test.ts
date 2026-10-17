import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";
import test from "node:test";

const root = "plugins/nightsky/skills";
const required = [
  "For each returned weather source, report its identity, status/reason, native cadence, valid times and forecast horizon",
  "Preserve disagreements between sources; never average forecasts or create a blended weather score.",
  "Keep missing fields unknown",
  "Never interpolate three-hour samples into hourly certainty",
  "Use the exact selected point and its revision for every weather source",
  "Forecast agreement alone does not support a go/no-go recommendation",
];
function validate(text: string) {
  for (const sentence of required) assert.ok(text.includes(sentence), `Missing weather contract: ${sentence}`);
}
for (const name of readdirSync(root)) test(`${name}: multi-source weather contract matches canonical workflow`, () => {
  const skill = readFileSync(`${root}/${name}/SKILL.md`, "utf8").replaceAll("\r\n", "\n");
  const doc = readFileSync(`docs/product/workflows/${name}.md`, "utf8").replaceAll("\r\n", "\n");
  validate(skill); validate(doc);
  const section = (s: string) => s.split("## Multiple weather sources\n")[1]?.split("\n## ")[0]?.trim();
  assert.ok(section(skill)); assert.equal(section(skill), section(doc));
  for (const sentence of required) assert.throws(() => validate(skill.replace(sentence, "")));
});
