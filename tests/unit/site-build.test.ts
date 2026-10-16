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
    meteors: [],
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
      meteors: [],
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
    meteors: [],
    legacyMeteorIds: ["perseids"],
  });
  assert.ok(output.sitemap.includes("https://nightsky.earth/resources"));
  assert.ok(!output.headers.includes("/*\n  X-Robots-Tag"));
  assert.ok(!output.sitemap.includes("/meteor-nights"));
});
