import { test } from "node:test";
import assert from "node:assert/strict";

const analytics = await import("../../client/src/lib/analytics").catch(() => null);

test("analytics page paths never include query strings or fragments", () => {
  assert.equal(typeof analytics?.sanitizeAnalyticsPath, "function");
  assert.equal(
    analytics!.sanitizeAnalyticsPath("/news?q=nebula&source=all#results"),
    "/news",
  );
  assert.equal(analytics!.sanitizeAnalyticsPath("/sky-events?tz=Asia/Kolkata"), "/sky-events");
});

test("analytics loads only after consent on the exact secure production host", () => {
  assert.equal(typeof analytics?.mayLoadAnalytics, "function");
  assert.equal(analytics!.mayLoadAnalytics("nightsky.earth", "accepted", "https:"), true);
  assert.equal(analytics!.mayLoadAnalytics("nightsky.earth", "rejected", "https:"), false);
  assert.equal(analytics!.mayLoadAnalytics("localhost", "accepted", "http:"), false);
  assert.equal(analytics!.mayLoadAnalytics("deploy-preview-2--nightskyearth.netlify.app", "accepted", "https:"), false);
  assert.equal(analytics!.mayLoadAnalytics("www.nightsky.earth", "accepted", "https:"), false);
});

test("analytics consent defaults to undecided and persists an explicit choice", () => {
  assert.equal(typeof analytics?.readAnalyticsConsent, "function");
  const values = new Map<string, string>();
  const storage = {
    getItem: (key: string) => values.get(key) ?? null,
    setItem: (key: string, value: string) => values.set(key, value),
  };
  assert.equal(analytics!.readAnalyticsConsent(storage), "undecided");
  analytics!.saveAnalyticsConsent("rejected", storage);
  assert.equal(analytics!.readAnalyticsConsent(storage), "rejected");
  analytics!.saveAnalyticsConsent("accepted", storage);
  assert.equal(analytics!.readAnalyticsConsent(storage), "accepted");
});

test("page-view payload contains only a clean path, title and canonical location", () => {
  assert.equal(typeof analytics?.buildPageViewPayload, "function");
  assert.deepEqual(
    analytics!.buildPageViewPayload("/resources?q=moon#results", "Resources", "https://nightsky.earth"),
    {
      page_location: "https://nightsky.earth/resources",
      page_path: "/resources",
      page_title: "NightSky.earth",
      page_referrer: "",
    },
  );
});
