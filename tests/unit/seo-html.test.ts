import { test } from "node:test";
import assert from "node:assert/strict";
import { renderRouteHtml } from "../../shared/seoHtml";

const shell = `<!doctype html><html><head><title>Old title</title>
<meta name="description" content="Old description">
<meta name="robots" content="noindex" data-preview-robots>
<meta property="og:title" content="Old title"><link rel="canonical" href="https://old.example/">
</head><body><div id="root"></div><script src="/assets/main.js"></script></body></html>`;

test("route HTML has route-specific crawl and sharing metadata before scripts run", () => {
  const html = renderRouteHtml(shell, {
    path: "/resources",
    title: "Resources for looking up",
    description: "Find reviewed astronomy tools, guides and learning resources.",
  }, true);

  assert.match(html, /<title data-rh="true">Resources for looking up \| NightSky\.earth<\/title>/);
  assert.match(html, /<link data-rh="true" rel="canonical" href="https:\/\/nightsky\.earth\/resources">/);
  assert.match(html, /property="og:title" content="Resources for looking up"/);
  assert.match(html, /name="twitter:card" content="summary_large_image"/);
  assert.match(html, /name="robots" content="index, follow"/);
  assert.match(html, /<noscript><main><h1>Resources for looking up<\/h1>/);
  assert.match(html, /<script src="\/assets\/main\.js"><\/script>/);
  assert.equal((html.match(/property="og:title"/g) || []).length, 1);
  assert.match(html, /<title data-rh="true">/);
  assert.doesNotMatch(html, /data-preview-robots/);
  assert.doesNotMatch(html, /Old title|Old description/);
});

test("preview and intentionally hidden routes stay noindex", () => {
  for (const [release, noindex] of [[false, false], [true, true]] as const) {
    const html = renderRouteHtml(shell, {
      path: "/sky-events/withdrawn-record",
      title: "Withdrawn record",
      description: "This entry is under review.",
      noindex,
    }, release);
    assert.match(html, /name="robots" content="noindex, nofollow"/);
    assert.match(html, /property="og:url" content="https:\/\/nightsky\.earth\/sky-events\/withdrawn-record"/);
  }
});

test("metadata text is safely escaped in HTML and JSON-LD", () => {
  const html = renderRouteHtml(shell, {
    path: "/about",
    title: `Night & <Stars> "Together"`,
    description: `Look up & learn <safely>.`,
  }, true);
  assert.match(html, /Night &amp; &lt;Stars&gt; &quot;Together&quot;/);
  assert.match(html, /Look up &amp; learn &lt;safely&gt;\./);
  assert.doesNotMatch(html, /<safely>/);
  assert.match(html, /"@type":"WebPage"/);
});
