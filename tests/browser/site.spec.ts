import { test, expect } from "@playwright/test";
test.beforeEach(async ({ page }) => {
  await page.route("**/api/news**", (r) =>
    r.fulfill({ json: { count: 0, results: [] } }),
  );
});
test("shell, product story and examples", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(
    "Where Earth meets the stars.",
  );
  await expect(page.getByRole("banner")).toHaveCount(1);
  await expect(page.getByRole("main")).toHaveCount(1);
  await expect(page.getByRole("contentinfo")).toHaveCount(1);
  await expect(page.getByText("Our Story", { exact: true })).toHaveCount(0);
  await expect(
    page.getByRole("link", { name: "Book Now", exact: true }),
  ).toHaveCount(0);
  await page.getByRole("button", { name: "Compare", exact: true }).click();
  await expect(page.getByTestId("example-question")).toHaveText(
    "How do these two nights differ for observing?",
  );
  await page.evaluate(() => {
    Object.defineProperty(navigator, "clipboard", {
      value: { writeText: () => Promise.reject(new Error("denied")) },
      configurable: true,
    });
  });
  await page
    .getByRole("button", { name: "Copy question", exact: true })
    .click();
  await expect(page.getByRole("status")).toContainText("Couldn’t copy");
  expect(await page.locator("audio").count()).toBe(0);
  expect(await page.locator("video").count()).toBe(0);
});
test("resources filtering and history", async ({ page }) => {
  await page.goto("/resources?topic=photography&ref=home");
  await expect(page.getByLabel("Topic")).toHaveValue("photography");
  await page.getByLabel("Topic").selectOption("stargazing");
  await expect(page.getByTestId("resource-card").first()).toBeVisible();
  await page.goBack();
  await expect(page.getByLabel("Topic")).toHaveValue("photography");
  await page.getByLabel("Search resources").fill("nonsense resource");
  await expect(page.getByText("No resources match this search.")).toBeVisible();
  await page.getByRole("button", { name: "Clear filters" }).click();
  await expect(page.getByTestId("resource-card").first()).toBeVisible();
  expect(page.url()).toContain("ref=home");
});
test("editorial routes do not invent membership or form success", async ({
  page,
}) => {
  await page.goto("/community");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(
    "For everyone who looks up.",
  );
  await expect(page.locator("form")).toHaveCount(0);
  await page.goto("/contact");
  await expect(
    page.getByRole("link", { name: "Email NightSky" }),
  ).toHaveAttribute("href", "mailto:NightSky.earth2026@gmail.com");
  await expect(page.locator("form")).toHaveCount(0);
  for (const path of ["/privacy", "/terms", "/sources"]) {
    await page.goto(path);
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    await expect(page.locator('meta[name="robots"]')).toHaveAttribute(
      "content",
      /noindex/,
    );
  }
});
test("mobile menu, reflow and keyboard", async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 812 });
  await page.goto("/");
  const trigger = page.getByRole("button", { name: "Open navigation" });
  await trigger.click();
  await expect(trigger).toHaveAttribute("aria-expanded", "true");
  await page.keyboard.press("Escape");
  await expect(trigger).toBeFocused();
  await expect(trigger).toHaveAttribute("aria-expanded", "false");
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
});

test("header navigation resets same-page Resources state", async ({ page }) => {
  await page.goto("/resources?topic=photography&q=moon");
  await expect(page.getByLabel("Topic")).toHaveValue("photography");
  await page
    .getByRole("banner")
    .getByRole("link", { name: "Resources", exact: true })
    .click();
  await expect(page).toHaveURL(/\/resources$/);
  await expect(page.getByLabel("Topic")).toHaveValue("all");
  await expect(page.getByLabel("Search resources")).toHaveValue("");
});
test("page reflows at 320 and 640 CSS pixels with media failure", async ({
  page,
}) => {
  await page.setViewportSize({ width: 320, height: 800 });
  await page.route("**/*.mp4", (r) => r.abort());
  await page.goto("/");
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  await page.setViewportSize({ width: 640, height: 900 });
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
});

test("route metadata is singular and archive copy is clean UTF-8", async ({
  page,
}) => {
  await page.goto("/resources");
  await expect(page.locator('meta[name="description"]')).toHaveCount(1);
  await expect(page.locator('meta[property="og:title"]')).toHaveCount(1);
  await page.goto("/meteor-shower/perseids");
  await expect(
    page.getByRole("link", { name: "Explore meteor showers →", exact: true }),
  ).toBeVisible();
});
