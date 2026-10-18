import { skyEvents, coverageMonths } from "../../shared/skyEventCatalog";
import { test } from "node:test";
import assert from "node:assert/strict";
import { buildWebsiteOutputs, classifyPath } from "../../shared/websiteBuild";
import { siteRoutes } from "../../shared/website";
import { releaseFacts } from "../../client/src/content/releaseFacts";
test("preview output is isolated from news and publication", () => {
  const output = buildWebsiteOutputs({
    release: false,
    facts: releaseFacts,
    listing: { published: false, url: null },
    routes: siteRoutes,
    events: [],
    coverageMonths,
    now: new Date("2026-10-16"),
    legacyMeteorIds: ["perseids"],
  });
  assert.ok(output.robots.includes("Disallow: /"));
  assert.ok(!output.sitemap.includes("<loc>"));
  assert.ok(output.headers.includes("noindex"));
  assert.ok(output.redirects.includes("/meteor-nights"));
  assert.equal(classifyPath("/meteor-shower/perseids").status, 200);
  assert.equal(classifyPath("/meteor-shower/not-a-record").status, 404);
  assert.equal(classifyPath("/experiences").status, 410);
});
test("release rejects incomplete factual approvals", () => {
  assert.throws(() =>
    buildWebsiteOutputs({
      release: true,
      facts: releaseFacts,
      listing: { published: false, url: null },
      routes: siteRoutes,
      events: [],
      coverageMonths,
      now: new Date("2026-10-16"),
      legacyMeteorIds: [],
    }),
  );
});

test("a complete synthetic release has an indexable sitemap without preview headers", () => {
  const facts = {
    ...releaseFacts,
    operator: "Synthetic operator",
    hosting: "Synthetic host",
    recipients: [],
    loggedFields: [],
    retention: "Synthetic retention",
    deletionProcess: "Synthetic process",
    analytics: "None",
    sources: [
      {
        name: "Synthetic source",
        url: "https://example.org",
        coverage: "Synthetic coverage",
        reviewedAt: "2026-10-16",
      },
    ],
    sourcesApprovedAt: "2026-10-16",
    hostingVerifiedAt: "2026-10-16",
    contentRightsApprovedAt: "2026-10-16",
    policiesApprovedAt: "2026-10-16",
  };
  const output = buildWebsiteOutputs({
    release: true,
    facts,
    listing: { published: false, url: null },
    routes: siteRoutes,
    events: [
      skyEvents[0],
      { ...skyEvents[0], id: "draft-2026", reviewStatus: "draft" },
      { ...skyEvents[0], id: "withdrawn-2026", reviewStatus: "withdrawn" },
    ],
    coverageMonths,
    now: new Date("2026-10-16"),
    legacyMeteorIds: ["perseids"],
  });
  assert.ok(output.sitemap.includes("https://nightsky.earth/resources"));
  assert.ok(!output.headers.includes("/*\n  X-Robots-Tag"));
  assert.ok(!output.sitemap.includes("/meteor-nights"));
  assert.ok(output.sitemap.includes("/sky-events/" + skyEvents[0].id));
  assert.ok(!output.sitemap.includes("draft-2026"));
  assert.ok(!output.sitemap.includes("withdrawn-2026"));
  for (const agent of [
    "Googlebot",
    "Bingbot",
    "OAI-SearchBot",
    "ChatGPT-User",
    "Claude-SearchBot",
    "Claude-User",
    "GPTBot",
    "ClaudeBot",
    "CCBot",
    "Google-Extended",
  ]) {
    const group = output.robots.split("User-agent: " + agent)[1]?.split("\n\n")[0];
    assert.ok(group, `${agent} has an explicit robots group`);
    assert.ok(group.includes("Allow: /"), `${agent} can crawl public pages`);
    assert.ok(group.includes("Disallow: /api/"), `${agent} cannot crawl APIs`);
    assert.ok(group.includes("Disallow: /admin/"), `${agent} cannot crawl admin pages`);
    assert.ok(group.includes("Disallow: /*.json$"), `${agent} cannot crawl JSON endpoints`);
  }
  assert.ok(output.robots.includes("User-agent: *\nAllow: /"));
  assert.ok(output.robots.includes("Sitemap: https://nightsky.earth/sitemap.xml"));
  assert.ok(!output.redirects.includes("/sky-events/draft-2026"));
  assert.ok(output.redirects.includes("/sky-events/withdrawn-2026"));
  assert.throws(
    () =>
      buildWebsiteOutputs({
        release: true,
        facts,
        listing: { published: false, url: null },
        routes: siteRoutes,
        events: [],
        coverageMonths: [],
        now: new Date("2026-10-16"),
        legacyMeteorIds: [],
      }),
    /unreviewed sky-event months/,
  );
});
