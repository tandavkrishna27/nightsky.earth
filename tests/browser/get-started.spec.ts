import { test, expect } from "@playwright/test";

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => sessionStorage.setItem("nightsky-entered", "true"));
});

test("Get Started is a direct launch page with a real acquisition button", async ({ page }) => {
  await page.goto("/get-started");
  const main = page.getByRole("main");
  await expect(main.getByRole("heading", { level: 1 })).toHaveText("Get NightSky.");
  await expect(main).toContainText("Free to use");
  await expect(main).not.toContainText(/coming soon|not live yet|not available yet|when (?:it becomes|NightSky becomes|NightSky is) available|planned/i);
  await expect(main.getByRole("heading", { name: "ChatGPT", exact: true })).toBeVisible();
  if (test.info().config.metadata.listingLive) {
    const action = main.getByRole("link", { name: "Get NightSky Plugin for ChatGPT", exact: true });
    await expect(action).toHaveAttribute("href", "https://chatgpt.com/apps/nightsky-browser-fixture");
    await expect(action).toHaveAttribute("target", "_blank");
    await expect(action).toHaveAttribute("rel", "noopener noreferrer");
  } else {
    await expect(main.getByRole("button", { name: "Get NightSky Plugin for ChatGPT", exact: true })).toBeDisabled();
    await expect(main.getByRole("link", { name: "Get setup help", exact: true })).toHaveCount(0);
  }
  await expect(main.locator('a[href="/get-started"]')).toHaveCount(0);
  await expect(main.getByRole("heading", { name: "Your first steps.", exact: true })).toBeVisible();
  await expect(main.locator(".setup-step")).toHaveCount(3);
  await expect(main.locator(".setup-intro")).toContainText("ChatGPT, Claude, Gemini, or Grok");
  await expect(main.locator(".eyebrow")).toHaveCount(0);
  await expect(main.getByRole("link", { name: "Contact NightSky", exact: true })).toHaveAttribute("href", "/contact?topic=setup");
});

test("other assistants remain visible without email actions and general navigation stays on the hub", async ({ page }) => {
  await page.goto("/get-started");
  const main = page.getByRole("main");
  for (const name of ["ChatGPT", "Claude", "Gemini", "Grok"]) {
    await expect(main.getByRole("heading", { name, exact: true })).toBeVisible();
    await expect(main.getByRole("link", { name: `Ask about ${name}`, exact: true })).toHaveCount(0);
  }
  await expect(main.locator('a[href^="mailto:"]')).toHaveCount(0);
  await expect(page.getByRole("banner").getByRole("link", { name: "Get NightSky Plugin", exact: true })).toHaveAttribute("href", "/get-started");
  await expect(main.getByRole("link", { name: /download/i })).toHaveCount(0);
});

test("starter questions copy the selected text and keep focus on the button", async ({ page, context }) => {
  await context.grantPermissions(["clipboard-read", "clipboard-write"]);
  await page.goto("/get-started");
  const card = page.locator(".starter-question").first();
  const question = "Why does the Moon matter when watching meteors?";
  const button = card.getByRole("button");
  await button.click();
  await expect(page.locator(".setup-copy-status")).toHaveText("Question copied.");
  expect(await page.evaluate(() => navigator.clipboard.readText())).toBe(question);
  await expect(button).toBeFocused();
  await expect(card).toContainText("Copied");
});

test("clipboard rejection offers selectable text without false success", async ({ page }) => {
  await page.addInitScript(() => Object.defineProperty(navigator, "clipboard", { value: { writeText: () => Promise.reject(new Error("denied")) } }));
  await page.goto("/get-started");
  const card = page.locator(".starter-question").first();
  await card.getByRole("button").click();
  await expect(page.locator(".setup-copy-status")).toHaveText("Select the question to copy it.");
  await expect(card).not.toContainText("Copied");
  await expect(card.locator(".starter-question-text")).toHaveCSS("user-select", "text");
  await expect(card.getByRole("button")).toBeFocused();
});

test("a later clipboard request wins if writes finish out of order", async ({ page }) => {
  await page.addInitScript(() => {
    const writes: (() => void)[] = [];
    (window as any).finishCopy = (index: number) => writes[index]();
    Object.defineProperty(navigator, "clipboard", { value: { writeText: () => new Promise<void>((resolve) => writes.push(resolve)) } });
  });
  await page.goto("/get-started");
  const cards = page.locator(".starter-question");
  await cards.nth(0).getByRole("button").click();
  await expect(page.locator(".setup-copy-status")).not.toHaveText("Question copied.");
  await cards.nth(1).getByRole("button").click();
  await page.evaluate(() => (window as any).finishCopy(1));
  await expect(cards.nth(1)).toContainText("Copied");
  await page.evaluate(() => (window as any).finishCopy(0));
  await expect(cards.nth(0)).not.toContainText("Copied");
  await expect(cards.nth(1)).toContainText("Copied");
});

test("page reflows and its main action remains early on desktop and mobile", async ({ page }) => {
  await page.route("**/*.jpg", route => route.abort());
  for (const width of [320, 390, 768, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    await page.goto("/get-started");
    await page.evaluate(() => document.fonts.ready);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    const action = page.getByTestId("chatgpt-listing-action");
    const box = (await action.boundingBox())!;
    expect(box.y + box.height).toBeLessThan(900);
    expect(box.height).toBeGreaterThanOrEqual(44);
    const contact = (await page.getByRole("main").getByRole("link", { name: "Contact NightSky", exact: true }).boundingBox())!;
    expect(contact.height).toBeGreaterThanOrEqual(44);
    await expect(page.getByRole("heading", { name: "ChatGPT", exact: true })).toBeVisible();
  }
});

test("help, copy buttons and enlarged text remain keyboard accessible", async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 900 });
  await page.goto("/get-started");
  await expect(page.locator(".setup-faq details")).toHaveCount(6);
  await expect(page.locator(".setup-plan-note")).toContainText("usage limits apply");
  await page.locator('.get-started-page, .get-started-page *').evaluateAll(elements => {
    const sizes = elements.map(element => ({ element: element as HTMLElement, font: parseFloat(getComputedStyle(element).fontSize), line: parseFloat(getComputedStyle(element).lineHeight) }));
    for (const { element, font, line } of sizes) {
      element.style.setProperty("font-size", `${font * 2}px`, "important");
      if (Number.isFinite(line)) element.style.setProperty("line-height", `${line * 2}px`, "important");
    }
  });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  for (const button of await page.locator(".starter-question button").all()) {
    await button.focus();
    await expect(button).toBeFocused();
    const box = (await button.boundingBox())!;
    expect(box.x).toBeGreaterThanOrEqual(0);
    expect(box.x + box.width).toBeLessThanOrEqual(320);
  }
});
