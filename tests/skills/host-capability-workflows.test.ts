import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import test from "node:test";

const root = join(process.cwd(), "plugins/nightsky/skills");
const skills = readdirSync(root).map(name => ({name, text: readFileSync(join(root, name, "SKILL.md"), "utf8")}));
function section(text: string, title: string): string {
  const part = text.split(`## ${title}\n`)[1];
  assert.ok(part, `Missing ${title}`);
  return part.split("\n## ")[0]!;
}

function validateHostIntent(host: string): void {
  const sentences = host.replace(/\s+/g, " ").trim().split(/(?<=[.!?])\s+/);
  const required = [
    "Use optional host capabilities only when actually available in this conversation.",
    "For near me, obtain consent before using an approximate host location hint actually supplied by the host; resolve a named town and label distances from its centre.",
    "Create a reminder or calendar entry only if the host supports that action and the user requests it.",
    "Confirm the selected date, local time, timezone and reminder intent before using the actual exposed capability; report success only after confirmation from that capability.",
  ];
  for (const sentence of required) {
    assert.ok(sentences.includes(sentence), `Missing affirmative host contract: ${sentence}`);
  }
}

test("host intent validator rejects unsafe mutations rather than keyword presence", () => {
  const host = section(skills[0]!.text.replaceAll("\r\n", "\n"), "Optional host capabilities");
  validateHostIntent(host);
  const mutations = [
    host.replace("obtain consent before using", "do not obtain consent before using"),
    host.replace("only when actually available", "even when unavailable"),
    host.replace("local time, timezone and reminder intent", "local time and reminder intent"),
    host.replace("report success only after confirmation from that capability", "report success before confirmation from that capability"),
  ];
  for (const mutation of mutations) {
    assert.notEqual(mutation, host, "Mutation must exercise actual authored guidance");
    assert.throws(() => validateHostIntent(mutation));
  }
});

for (const {name, text} of skills) {
  test(`${name}: packaged guidance and referenced canonical workflow agree`, () => {
    const doc = readFileSync(join(process.cwd(), `docs/product/workflows/${name}.md`), "utf8");
    for (const heading of ["Optional host capabilities", "Discovery combinations and site planning"]) {
      assert.equal(section(doc.replaceAll("\r\n", "\n"), heading).trim(), section(text.replaceAll("\r\n", "\n"), heading).trim());
    }
    assert.doesNotMatch(doc, /are unsupported planner\/astronomy inputs|candidate IDs do not become supported planning coordinates/);
  });
  test(`${name}: optional host capabilities retain consent and failure paths`, () => {
    const host = section(text.replaceAll("\r\n", "\n"), "Optional host capabilities");
    validateHostIntent(host);
    assert.match(host, /consent.*actually supplied/s);
    assert.match(host, /absent.*town.*country/s);
    assert.match(host, /official.*links.*date/s);
    assert.match(host, /maps.*if available.*straight-line/s);
    assert.match(host, /reminder.*only.*supports.*user requests/s);
    assert.match(host, /failure.*continue.*supported/s);
  });
  test(`${name}: discovery and candidate planning have bounded, distinct contracts`, () => {
    const scope = section(text.replaceAll("\r\n", "\n"), "Discovery combinations and site planning");
    assert.match(scope, /only if.*available.*resolve_observing_region/s);
    assert.match(scope, /unavailable.*never substitute.*capital.*centroid/s);
    assert.match(scope, /any.*alternatives.*all.*overlap/s);
    assert.match(scope, /minimumDistanceKm.*six.*categories/s);
    assert.match(scope, /ten.*five.*compar/s);
    assert.match(scope, /planning comparisons.*not.*discovery filters/s);
    assert.match(scope, /catalogueRevision.*displayTimeZone/s);
    assert.match(scope, /stale.*re-search/s);
    assert.match(scope, /city centre.*exact selected site/s);
    assert.match(scope, /budget-limited.*no suitable/s);
    assert.doesNotMatch(text, /OSM candidate IDs are discovery features and unsupported planning inputs\./);
  });
}
