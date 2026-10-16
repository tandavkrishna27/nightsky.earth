import { test, expect } from "@playwright/test";
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
    "/meteor-showers",
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
  expect(redirect.headers().location).toBe("/meteor-showers");
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
