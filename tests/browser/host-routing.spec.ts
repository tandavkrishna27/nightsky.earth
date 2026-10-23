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
    "/sky-map",
    "/privacy",
    "/terms",
    "/meteor-shower/perseids",
  ]) {
    const response = await request.get(path);
    expect(response.status(), path).toBe(200);
    expect(response.headers()["x-robots-tag"]).toContain("noindex");
    if (path === "/resources") {
      const html = await response.text();
      expect(html).toContain('<title data-rh="true">Find what helps you look up. | NightSky.earth</title>');
      expect(html).toContain('property="og:url" content="https://nightsky.earth/resources/"');
      expect(html).toContain('name="twitter:card" content="summary_large_image"');
      expect(html).toContain("<noscript><main><h1>Find what helps you look up.</h1>");
      expect(html).toContain('name="robots" content="noindex, nofollow"');
    }
    if (path === "/sky-map") {
      const html = await response.text();
      expect(html).toContain('<title data-rh="true">Explore the sky. | NightSky.earth</title>');
      expect(html).toContain('property="og:url" content="https://nightsky.earth/sky-map/"');
      expect(html).toContain("<noscript><main><h1>Explore the sky.</h1>");
    }
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
    "https://nightsky.earth/resources/",
  );
  await page.goto("/resources/");
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
    "href",
    "https://nightsky.earth/resources/",
  );
  await page.goto("/meteor-shower/perseids");
  await expect(
    page.getByText("This archived record is awaiting factual review.", {
      exact: false,
    }),
  ).toBeVisible();
});

test("production route modules load separately and render on direct URLs", async ({
  page,
}) => {
  const scripts = new Set<string>();
  page.on("request", (request) => {
    if (request.resourceType() === "script" && request.url().includes("/assets/"))
      scripts.add(request.url());
  });

  await page.goto("/sky-events?month=2026-10&category=all&view=month&tz=UTC");
  await expect(
    page.getByRole("heading", { name: /Something worth looking up for/ }),
  ).toBeVisible();
  const initialScriptCount = scripts.size;
  expect(initialScriptCount).toBeGreaterThan(1);

  await page.goto("/get-started");
  await expect(page.getByRole("heading", { name: "Get NightSky." })).toBeVisible();
  expect(scripts.size).toBeGreaterThan(initialScriptCount);
  await page.route("https://stellarium-web.org/**", (route) =>
    route.fulfill({ status: 200, contentType: "text/html", body: "<main>Mock Stellarium</main>" }),
  );
  await page.goto("/sky-map");
  await expect(page.getByRole("heading", { name: "Explore the sky." })).toBeVisible();
  await expect(page.getByRole("navigation", { name: "Main navigation" }).getByRole("link", { name: "Sky Map" })).toHaveAttribute("href", "/sky-map");
  await expect(page.getByTitle("Interactive sky map by Stellarium Web")).toHaveCount(0);
  await expect(page.getByRole("link", { name: "Open Stellarium Web directly" })).toBeVisible();
  await expect(page.getByText(/Stellarium estimates your location from your IP address/)).toBeVisible();
  await page.getByRole("button", { name: "Load map without device location" }).click();
  const map = page.getByTitle("Interactive sky map by Stellarium Web");
  await expect(map).toHaveAttribute("src", "https://stellarium-web.org/");
  await expect(map).toHaveAttribute("allow", "fullscreen");
  await expect(page.getByRole("link", { name: "Open Stellarium Web directly" })).toHaveAttribute("href", "https://stellarium-web.org/");
  for (const width of [320, 390, 768, 1440]) {
    await page.setViewportSize({ width, height: 844 });
    await expect(page.getByRole("heading", { name: "Explore the sky." })).toBeVisible();
    expect(await page.locator("html").evaluate((element) => element.scrollWidth <= element.clientWidth)).toBe(true);
  }
  await page.setViewportSize({ width: 390, height: 844 });
  await page.getByRole("button", { name: "Open navigation" }).click();
  await expect(page.getByRole("navigation", { name: "Mobile navigation" }).getByRole("link", { name: "Sky Map" })).toBeVisible();
  await page.goto("/privacy");
  await expect(page.getByRole("heading", { name: "Interactive sky map" })).toBeVisible();
  await expect(page.getByText(/browser directly to Stellarium and Nominatim/)).toBeVisible();
  await expect(page.getByText(/approximate IP-based estimate/)).toBeVisible();
});

test("sky map enables embedded geolocation only after an explicit choice", async ({ page }) => {
  await page.route("https://stellarium-web.org/**", (route) =>
    route.fulfill({ status: 200, contentType: "text/html", body: "<main>Mock Stellarium</main>" }),
  );
  await page.goto("/sky-map");
  await expect(page.getByTitle("Interactive sky map by Stellarium Web")).toHaveCount(0);
  await page.getByRole("button", { name: "Load map with device location" }).click();
  const map = page.getByTitle("Interactive sky map by Stellarium Web");
  await expect(map).toHaveAttribute("allow", "fullscreen; geolocation");
  await expect(map).toHaveAttribute("src", "https://stellarium-web.org/");
});

test("sky map can expand to the viewport and restore on mobile browsers without fullscreen support", async ({ page }) => {
  await page.addInitScript(() => {
    Object.defineProperty(Element.prototype, "requestFullscreen", { configurable: true, value: undefined });
  });
  await page.route("https://stellarium-web.org/**", (route) =>
    route.fulfill({ status: 200, contentType: "text/html", body: "<main>Mock Stellarium</main>" }),
  );
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/sky-map");
  await page.getByRole("button", { name: "Load map without device location" }).click();

  const frame = page.locator(".sky-map-frame");
  const expand = page.getByRole("button", { name: "View sky map fullscreen" });
  await expand.click();
  await expect(frame).toHaveClass(/is-expanded/);
  await expect(page.getByRole("button", { name: "Exit fullscreen sky map" })).toHaveAttribute("aria-pressed", "true");
  expect(await frame.evaluate((element) => getComputedStyle(element).position)).toBe("fixed");

  await page.keyboard.press("Escape");
  await expect(frame).not.toHaveClass(/is-expanded/);
  await expect(page.getByRole("button", { name: "View sky map fullscreen" })).toHaveAttribute("aria-pressed", "false");
});

test("sky map fullscreen control enters and exits native fullscreen when available", async ({ page }) => {
  await page.route("https://stellarium-web.org/**", (route) =>
    route.fulfill({ status: 200, contentType: "text/html", body: "<main>Mock Stellarium</main>" }),
  );
  await page.goto("/sky-map");
  await page.getByRole("button", { name: "Load map without device location" }).click();
  await page.getByRole("button", { name: "View sky map fullscreen" }).click();
  const frame = page.locator(".sky-map-frame");
  await expect.poll(() => frame.evaluate((element) => document.fullscreenElement === element || element.classList.contains("is-expanded"))).toBe(true);
  await page.getByRole("button", { name: "Exit fullscreen sky map" }).click();
  await expect.poll(() => frame.evaluate((element) => !document.fullscreenElement && !element.classList.contains("is-expanded"))).toBe(true);
});
