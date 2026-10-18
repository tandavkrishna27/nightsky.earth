import { test, expect } from "@playwright/test";

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => sessionStorage.setItem("nightsky-entered", "true"));
});

test("Grok appears with the other launch assistants and has no invented setup destination", async ({ page }) => {
  await page.goto("/");
  for (const region of [page.locator(".hero-platforms"), page.locator(".assistant-brands")]) {
    await expect(region).toContainText("Grok");
    await expect(region.locator('img[src*="grok"]')).toHaveCount(1);
  }
  await page.goto("/get-started");
  await expect(page.locator(".setup-intro")).toContainText("ChatGPT, Claude, Gemini, or Grok");
  await expect(page.getByRole("heading", { name: "Grok", exact: true })).toBeVisible();
  await expect(page.getByRole("button", { name: "Get NightSky Plugin for Grok", exact: true })).toBeDisabled();
  await expect(page.locator('a[href="#"], a[href^="mailto:"]')).toHaveCount(0);
});

test("topic pills support keyboard filtering, history and useful focus after clearing", async ({ page }) => {
  await page.goto("/resources?topic=photography&ref=home");
  const photography = page.getByRole("button", { name: "Photography", exact: true });
  await expect(photography).toHaveAttribute("aria-pressed", "true");
  expect(await page.getByTestId("resource-card").count()).toBeGreaterThan(0);
  for (const card of await page.getByTestId("resource-card").all()) await expect(card.locator(".resource-meta")).toContainText("Photography");
  const stargazing = page.getByRole("button", { name: "Stargazing", exact: true });
  await stargazing.focus();
  await page.keyboard.press("Enter");
  await expect(stargazing).toHaveAttribute("aria-pressed", "true");
  for (const card of await page.getByTestId("resource-card").all()) await expect(card.locator(".resource-meta")).toContainText("Stargazing");
  await page.goBack();
  await expect(photography).toHaveAttribute("aria-pressed", "true");
  await page.getByLabel("Format", { exact: true }).selectOption("guides");
  await page.getByLabel("Search resources", { exact: true }).fill("no matching resource q17");
  await expect(page.getByRole("heading", { name: "No resources match this search." })).toBeVisible();
  await page.getByRole("button", { name: "Clear filters", exact: true }).click();
  await expect(page.getByLabel("Search resources", { exact: true })).toBeFocused();
  await expect(page.getByRole("button", { name: "Clear filters", exact: true })).toHaveCount(0);
  await expect(page.getByTestId("resource-card")).toHaveCount(12);
  expect(new URL(page.url()).searchParams.get("ref")).toBe("home");
  await expect(page.locator(".resource-review-note")).toContainText("18 October 2026");
  await expect(page.locator(".resource-card").first()).toHaveCSS("border-radius", "20px");
  await expect(page.locator("main .eyebrow")).toHaveCount(0);
  for (const link of await page.locator(".resource-card a").all()) {
    await expect(link).toHaveAttribute("target", "_blank");
    await expect(link).toHaveAttribute("rel", "noopener noreferrer");
  }
});

test("Resources and four assistants reflow at mobile widths and enlarged type", async ({ page }) => {
  for (const path of ["/resources", "/", "/get-started"]) {
    for (const width of [320, 390, 768, 1440]) {
      await page.setViewportSize({ width, height: 900 });
      await page.goto(path);
      await page.evaluate(() => document.fonts.ready);
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    }
  }
  await page.setViewportSize({ width: 320, height: 900 });
  await page.goto("/resources");
  await page.locator(".resources-page, .resources-page *").evaluateAll(elements => {
    const sizes = elements.map(element => ({ element: element as HTMLElement, size: parseFloat(getComputedStyle(element).fontSize), line: parseFloat(getComputedStyle(element).lineHeight) }));
    for (const { element, size, line } of sizes) {
      element.style.setProperty("font-size", `${size * 2}px`, "important");
      if (Number.isFinite(line)) element.style.setProperty("line-height", `${line * 2}px`, "important");
    }
  });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  const topic = page.getByRole("button", { name: "Photography", exact: true });
  await topic.focus();
  await expect(topic).toBeFocused();
  expect((await topic.boundingBox())!.height).toBeGreaterThanOrEqual(44);
  await page.keyboard.press("Space");
  expect(await page.getByTestId("resource-card").count()).toBeGreaterThan(0);
  for (const card of await page.getByTestId("resource-card").all()) await expect(card.locator(".resource-meta")).toContainText("Photography");
});

test("desktop setup presents all four assistants together in one row", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto("/get-started");
  const cards = await page.locator(".setup-assistant-card").all();
  const boxes = await Promise.all(cards.map(card => card.boundingBox()));
  expect(boxes).toHaveLength(4);
  expect(Math.max(...boxes.map(box => box!.y)) - Math.min(...boxes.map(box => box!.y))).toBeLessThanOrEqual(1);
});
