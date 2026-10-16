import { test, expect } from "@playwright/test";
test.beforeEach(async ({ page }) => { await page.addInitScript(() => sessionStorage.setItem("nightsky-entered", "true")); });
test("production-shaped routes, metadata and independent sitemap", async ({
  request,
  page,
}) => {
  for (const path of [
    "/",
    "/resources",
    "/community",
    "/about",
    "/contact",
    "/get-started",
    "/news",
    "/sky-events",
    "/sky-events/full-moon-2026-10-26",
    "/sources",
    "/privacy",
    "/terms",
    "/meteor-shower/perseids",
  ]) {
    const response = await request.get(path);
    expect(response.status(), path).toBe(200);
    expect(response.headers()["x-robots-tag"]).toContain("noindex");
  }
  const redirect = await request.get("/meteor-nights", { maxRedirects: 0 });
  expect(redirect.status()).toBe(301);
  expect(redirect.headers().location).toBe("/sky-events?category=meteor-showers");
  const oldIndex = await request.get("/meteor-showers", {maxRedirects:0});
  expect(oldIndex.status()).toBe(301);
  expect(oldIndex.headers().location).toBe("/sky-events?category=meteor-showers");
  expect((await request.get("/sky-events/not-a-record")).status()).toBe(404);
  expect((await request.get("/experiences")).status()).toBe(410);
  expect((await request.get("/unknown-page")).status()).toBe(404);
  expect((await request.get("/meteor-shower/invalid")).status()).toBe(404);
  expect(
    (await request.get("/api/unknown")).headers()["content-type"],
  ).toContain("json");
  const sitemap = await request.get("/sitemap.xml");
  expect(sitemap.status()).toBe(200);
  expect(await sitemap.text()).not.toContain("<loc>");
  await page.goto("/resources?q=moon");
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
    "href",
    "https://nightsky.earth/resources",
  );
  await page.goto("/meteor-shower/perseids");
  await expect(
    page.getByText("This archived record is awaiting factual review.", {
      exact: false,
    }),
  ).toBeVisible();
});
