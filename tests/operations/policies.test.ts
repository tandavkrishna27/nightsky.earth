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

test("rendered privacy discloses configured API destinations and durable quota records", () => {
  const html = renderToStaticMarkup(React.createElement(Router, { ssrPath: "/privacy" }, React.createElement(Privacy)));
  for (const provider of [/Geoapify/, /GeoNames/, /WeatherAPI/, /OpenWeather/]) assert.match(html, provider);
  assert.match(html, /Named-place queries/);
  assert.match(html, /region queries are sent to configured Geoapify/);
  assert.match(html, /selected destination coordinates without additional rounding/);
  assert.match(html, /bounded in-memory caches/);
  assert.match(html, /persistent quota ledger/);
  assert.match(html, /provider account labels/);
  assert.doesNotMatch(html, /their query processing does not contact those source services/);
  assert.match(html, /Tandav Krishna \(TK\)/);
  assert.doesNotMatch(html, /Verified publisher legal name.*pending/);
  assert.match(html, /support-message retention.*pending/i);
});

test("rendered privacy distinguishes operator history acquisition and durable location evidence", () => {
  const html = renderToStaticMarkup(React.createElement(Router, { ssrPath: "/privacy" }, React.createElement(Privacy)));
  assert.match(html, /disabled by default/);
  assert.match(html, /Open-Meteo receives canonical grid-cell coordinates and requested date ranges/);
  assert.match(html, /runtime lookup only reads completed summaries/);
  assert.match(html, /original requested destination coordinates/);
  assert.match(html, /request URLs containing grid-cell coordinates and dates/);
  assert.match(html, /no automatic eviction or deletion/);
  assert.match(html, /For baseline preparation, raw response bodies are transient/);
  assert.match(html, /retention and maintenance require operator review/);
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

test("operator accounting and diagnostic history retention are disclosed separately", () => {
  const text = JSON.stringify(POLICY_PAGES.privacy);
  assert.match(text, /operator verification notes/);
  assert.match(text, /diagnostic probes can retain bounded raw responses/);
});


test('privacy describes optional configured API sharing without activating providers',()=>{
 const text=JSON.stringify(POLICY_PAGES.privacy);
 for(const provider of ['7Timer','DarkSkySites','Dark Sky Planner','AstronomyAPI','Public Universe','NASA DONKI','JPL'])assert.ok(text.includes(provider),provider);
 for(const phrase of ['only when selected and admitted','equipment filters','rounded to two decimals','not observing coordinates','does not enable any source'])assert.ok(text.includes(phrase),phrase);
});

test('privacy discloses generated per-request diagnostic correlation without user tracking claims',()=>{
 const text=JSON.stringify(POLICY_PAGES.privacy);
 for(const phrase of ['generated per-request correlation ID','allowlisted protocol method and tool name','ingress/completion','not a user or session identifier','Docker container logs are capped by size, not age','no configured age limit'])assert.ok(text.includes(phrase),phrase);
 assert.match(text,/exclude request or response bodies/);
 assert.match(text,/raw subjects/);
});
