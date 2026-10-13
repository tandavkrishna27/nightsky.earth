import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import Privacy from "../../client/src/pages/Privacy";
import Terms from "../../client/src/pages/Terms";
import Support from "../../client/src/pages/Support";
import { Router } from "wouter";
import { POLICY_PAGES, SUPPORT_EMAIL, isPolicyPath } from "../../shared/nightsky/policies";

test("draft policy copy describes actual hint/provider/retention boundaries", () => {
  assert.equal(SUPPORT_EMAIL, "nightsky.earth2026@gmail.com");
  const text = JSON.stringify(POLICY_PAGES);
  for (const expected of [/two decimal/, /salted/, /IP address/, /bounded/i, /retention.*pending/i, /MET Norway/, /NOAA/, /GeoNames/, /OpenStreetMap/, /ERA5/, /13/, /draft/i]) assert.match(text, expected);
  assert.doesNotMatch(text, /GDPR compliant|DPDP compliant|deleted within|never collect|guaranteed privacy|guarantee a clear/);
});

test("standalone draft pages render readable content and a genuine support mail link", () => {
  for (const Page of [Privacy, Terms, Support]) {
    const html = renderToStaticMarkup(React.createElement(Router, { ssrPath: "/privacy" }, React.createElement(Page)));
    assert.match(html, /<main/);
    assert.match(html, /Draft updated/);
    assert.doesNotMatch(html, /<audio|<form|Enter Experience/);
  }
  const support = renderToStaticMarkup(React.createElement(Router, { ssrPath: "/support" }, React.createElement(Support)));
  assert.match(support, /href="mailto:nightsky.earth2026@gmail.com"/);
});

test("privacy terms and support paths bypass mounted audio and entry gates", async () => {
  for (const path of ["/privacy", "/terms", "/support"]) assert.equal(isPolicyPath(path), true);
  assert.equal(isPolicyPath("/"), false);
  const app = await readFile(new URL("../../client/src/App.tsx", import.meta.url), "utf8");
  assert.match(app, /if \(isPolicyPath\(location\)\) return/);
  assert.ok(app.indexOf("if (isPolicyPath(location)) return") < app.indexOf("<BackgroundMusic"));
  for (const route of ["privacy", "terms", "support"]) assert.match(app, new RegExp(`path="/${route}"`));
  const footer = await readFile(new URL("../../client/src/components/Footer.tsx", import.meta.url), "utf8");
  for (const route of ["privacy", "terms", "support"]) assert.match(footer, new RegExp(`href="/${route}"`));
});

test("support provides real mail link without a pretend message form", async () => {
  const page = await readFile(new URL("../../client/src/pages/Support.tsx", import.meta.url), "utf8");
  assert.match(page, /mailto:/);
  assert.doesNotMatch(page, /<form|Message Sent|handleSubmit/);
});
