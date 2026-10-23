import { test, expect } from "@playwright/test";

test("homepage identifies NightSky as free to use without changing its destination", async ({ page }) => {
  await page.goto("/");
  await expect(page.locator(".hero-copy > .eyebrow")).toHaveText("Free to use");
  await expect(page.locator(".hero-description")).toContainText("Plan a night under the stars with NightSky in your AI assistant");
  await expect(page.locator(".closing-section .pricing-note")).toHaveText("Start exploring for free.");
  await expect(page.locator(".hero-copy .action-primary")).toHaveAttribute("href", "/get-started");
});

test("reduced motion shows the complete conversation without animation controls", async ({ page }) => {
  await page.goto("/");
  const demo = page.getByTestId("conversation-demo");
  await expect(demo).toHaveAttribute("data-playback-state", "static");
  await expect(demo.getByText("Where will you be, and when would you like to go?", { exact: true })).toBeVisible();
  await expect(demo.getByText("Near Bengaluru this Saturday. It’s my first time.", { exact: true })).toBeVisible();
  await expect(demo.getByTestId("example-response")).toContainText("Moonlight, darkness and weather");
  await expect(demo.getByRole("button", { name: /Pause demo|Resume demo|Replay demo/ })).toHaveCount(0);
  await expect(demo.locator("[aria-live]")).toHaveCount(0);
});

test.describe("conversation playback", () => {
  test.use({ reducedMotion: "no-preference" });

  test("Ask a question completes its explanation and follow-up", async ({ page }) => {
    await page.clock.install();
    await page.goto("/");
    const demo = page.getByTestId("conversation-demo");
    await demo.getByRole("button", { name: "Ask a question", exact: true }).click();
    await demo.scrollIntoViewIfNeeded();
    await expect(demo).toHaveAttribute("data-playback-state", "playing");
    await page.clock.runFor(12500);
    await expect(demo).toHaveAttribute("data-playback-state", "complete");
    await expect(demo.locator('.demo-animation .demo-visible-text')).toContainText("A bright Moon washes out fainter meteors");
    await expect(demo.locator('.demo-animation [data-message="clarification"]')).toContainText('Moonlight changes');
  });

  test("missing observer APIs fall back to a readable static example", async ({ page }) => {
    await page.addInitScript(() => Object.defineProperty(window, "IntersectionObserver", { value: undefined }));
    await page.goto("/");
    const demo = page.getByTestId("conversation-demo");
    await expect(demo).toHaveAttribute("data-playback-state", "static");
    await expect(demo.getByTestId("example-response")).toBeVisible();
    await expect(demo.getByRole("button", { name: /Pause demo|Resume demo|Replay demo/ })).toHaveCount(0);
  });

  test("mobile conversation keeps a stable footprint while typing and sending", async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 900 });
    await page.clock.install();
    await page.goto("/");
    await page.evaluate(() => document.fonts.ready);
    const demo = page.getByTestId("conversation-demo");
    for (const name of ["Ask a question", "Plan a night", "Capture the sky", "Explore an event"]) {
      await demo.getByRole("button", { name, exact: true }).click();
      await demo.scrollIntoViewIfNeeded();
      await expect(demo).toHaveAttribute("data-playback-state", "playing");
      const initial = (await demo.boundingBox())!.height;
      const composerHeight = (await demo.locator(".demo-composer").boundingBox())!.height;
      await page.clock.runFor(2300);
      expect(Math.abs((await demo.boundingBox())!.height - initial), `${name}: composer ${composerHeight} -> ${(await demo.locator(".demo-composer").boundingBox())!.height}`).toBeLessThanOrEqual(1);
      await page.clock.runFor(300);
      expect(Math.abs((await demo.boundingBox())!.height - initial)).toBeLessThanOrEqual(1);
      await page.clock.runFor(15500);
      await expect(demo).toHaveAttribute("data-playback-state", "complete");
      expect(Math.abs((await demo.boundingBox())!.height - initial)).toBeLessThanOrEqual(1);
    }
  });

  test("plays a full clarification flow once and replays the selected mode", async ({ page }) => {
    await page.clock.install();
    await page.goto("/");
    const demo = page.getByTestId("conversation-demo");
    await demo.scrollIntoViewIfNeeded();
    await expect(demo).toHaveAttribute("data-playback-state", "playing");
    await page.clock.runFor(8100);
    await expect(demo.locator('.demo-animation [data-message="reply"]')).toBeVisible();
    await expect(demo.locator(".demo-animation .demo-activity")).toBeVisible();
    await page.clock.runFor(10000);
    await expect(demo).toHaveAttribute("data-playback-state", "complete");
    await expect(demo.locator('.demo-animation .demo-visible-text')).toContainText("Moonlight, darkness and weather");
    await page.clock.runFor(25000);
    await expect(demo).toHaveAttribute("data-playback-state", "complete");
    await demo.getByRole("button", { name: "Capture the sky", exact: true }).click();
    await page.clock.runFor(18000);
    await expect(demo).toHaveAttribute("data-playback-state", "complete");
    await demo.getByRole("button", { name: "Replay demo" }).click();
    await expect(demo).toHaveAttribute("data-playback-state", "playing");
    await expect(demo.locator('.demo-animation [data-message="question"]')).toHaveCSS("visibility", "hidden");
    await page.clock.runFor(18000);
    await expect(demo.locator('.demo-animation .demo-visible-text')).toContainText("interval between frames");
  });

  test("manual pause survives mode changes and visibility interruptions", async ({ page }) => {
    await page.clock.install();
    await page.goto("/");
    const demo = page.getByTestId("conversation-demo");
    await demo.scrollIntoViewIfNeeded();
    await expect(demo).toHaveAttribute("data-playback-state", "playing");
    await page.clock.runFor(1000);
    await demo.getByRole("button", { name: "Pause demo" }).click();
    const frozen = await demo.locator(".demo-animation").innerText();
    await page.clock.runFor(30000);
    expect(await demo.locator(".demo-animation").innerText()).toBe(frozen);
    await demo.getByRole("button", { name: "Capture the sky", exact: true }).click();
    await demo.getByRole("button", { name: "Explore an event", exact: true }).click();
    await expect(demo).toHaveAttribute("data-playback-state", "paused");
    await page.evaluate(() => { Object.defineProperty(document, "hidden", { configurable: true, value: true }); document.dispatchEvent(new Event("visibilitychange")); });
    await page.clock.runFor(20000);
    await page.evaluate(() => { Object.defineProperty(document, "hidden", { configurable: true, value: false }); document.dispatchEvent(new Event("visibilitychange")); });
    await expect(demo).toHaveAttribute("data-playback-state", "paused");
    await demo.getByRole("button", { name: "Resume demo" }).click();
    await page.clock.runFor(18000);
    await expect(demo.locator('.demo-animation .demo-visible-text')).toContainText("The peak date is a starting point");
    await expect(demo.locator('.demo-animation .demo-visible-text')).not.toContainText("kit lens");
  });

  test("offscreen and hidden document freeze elapsed time instead of completing", async ({ page }) => {
    await page.clock.install();
    await page.goto("/");
    const demo = page.getByTestId("conversation-demo");
    await demo.scrollIntoViewIfNeeded();
    await expect(demo).toHaveAttribute("data-playback-state", "playing");
    await page.clock.runFor(1000);
    await page.evaluate(() => window.scrollTo(0, 0));
    await expect(demo).toHaveAttribute("data-playback-state", "paused");
    await page.clock.runFor(30000);
    await demo.scrollIntoViewIfNeeded();
    await expect(demo).toHaveAttribute("data-playback-state", "playing");
    await expect(demo.locator('.demo-animation [data-message="answer"]')).toHaveCSS("visibility", "hidden");
    await page.evaluate(() => { Object.defineProperty(document, "hidden", { configurable: true, value: true }); document.dispatchEvent(new Event("visibilitychange")); });
    await expect(demo).toHaveAttribute("data-playback-state", "paused");
    await page.clock.runFor(30000);
    await page.evaluate(() => { Object.defineProperty(document, "hidden", { configurable: true, value: false }); document.dispatchEvent(new Event("visibilitychange")); });
    await expect(demo).toHaveAttribute("data-playback-state", "playing");
    await expect(demo.locator('.demo-animation [data-message="answer"]')).toHaveCSS("visibility", "hidden");
    await page.clock.runFor(15000);
    await expect(demo).toHaveAttribute("data-playback-state", "complete");
  });

  test("changing motion preference finishes accessibly and does not restart", async ({ page }) => {
    await page.clock.install();
    await page.goto("/");
    const demo = page.getByTestId("conversation-demo");
    await demo.scrollIntoViewIfNeeded();
    await expect(demo).toHaveAttribute("data-playback-state", "playing");
    await page.emulateMedia({ reducedMotion: "reduce" });
    await expect(demo).toHaveAttribute("data-playback-state", "static");
    await expect(demo.getByTestId("example-response")).toBeVisible();
    await page.emulateMedia({ reducedMotion: "no-preference" });
    await expect(demo).toHaveAttribute("data-playback-state", "complete");
    await expect(demo.locator(".demo-animation")).toHaveAttribute("aria-hidden", "true");
    await expect(demo.getByRole("button", { name: "Replay demo" })).toBeVisible();
  });

  test("entrance keeps the demo idle and route remount starts cleanly", async ({ page }) => {
    await page.addInitScript(() => {
      const getItem = Storage.prototype.getItem;
      Storage.prototype.getItem = function (key) {
        return key === "nightsky-entered" ? null : getItem.call(this, key);
      };
    });
    await page.clock.install();
    await page.goto("/");
    const demo = page.getByTestId("conversation-demo");
    await demo.evaluate((element) => element.scrollIntoView());
    await page.clock.runFor(20000);
    await expect(demo).toHaveAttribute("data-playback-state", "idle");
    await page.getByRole("button", { name: "Enter without sound" }).click();
    await demo.scrollIntoViewIfNeeded();
    await expect(demo).toHaveAttribute("data-playback-state", "playing");
    await page.clock.runFor(18000);
    await expect(demo).toHaveAttribute("data-playback-state", "complete");
    await page.getByRole("banner").getByRole("link", { name: "About", exact: true }).click();
    await expect(demo).toHaveCount(0);
    await page.goBack();
    await demo.scrollIntoViewIfNeeded();
    await expect(demo).toHaveAttribute("data-playback-state", "playing");
    await expect(demo.locator('.demo-animation [data-message="answer"]')).toHaveCSS("visibility", "hidden");
  });
});

test("all demo modes reflow with keyboard access and preserve Get Started examples", async ({ page }) => {
  await page.goto("/");
  const demo = page.getByTestId("conversation-demo");
  for (const width of [320, 390, 768, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    for (const name of ["Ask a question", "Plan a night", "Capture the sky", "Explore an event"]) {
      const mode = demo.getByRole("button", { name, exact: true });
      await mode.focus();
      await page.keyboard.press("Enter");
      await expect(mode).toHaveAttribute("aria-pressed", "true");
      await expect(demo.getByTestId("example-response")).toBeVisible();
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    }
  }
  // Enlarge every relevant text size, including pixel-sized controls and labels.
  // Snapshot first so inherited sizes are not accidentally doubled twice.
  await page.locator('.question-explorer, .question-explorer *, .music-control').evaluateAll((elements) => {
    const sizes = elements.map((element) => ({
      element: element as HTMLElement,
      font: parseFloat(getComputedStyle(element).fontSize),
      line: parseFloat(getComputedStyle(element).lineHeight),
    }));
    for (const { element, font, line } of sizes) {
      element.style.setProperty('font-size', `${font * 2}px`, 'important');
      if (Number.isFinite(line)) element.style.setProperty('line-height', `${line * 2}px`, 'important');
    }
  });
  for (const width of [320, 640]) {
    await page.setViewportSize({ width, height: 900 });
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    expect(await demo.evaluate((element) => element.scrollWidth <= element.clientWidth)).toBe(true);
    for (const button of await demo.getByRole('button').all()) {
      const box = (await button.boundingBox())!;
      expect(box.x).toBeGreaterThanOrEqual(0);
      expect(box.x + box.width).toBeLessThanOrEqual(width);
    }
  }
  await page.goto("/get-started");
  await expect(page.locator(".question-list li")).toHaveCount(3);
  await expect(page.locator(".question-list")).toContainText("Why does the Moon matter");
  await expect(page.locator(".question-list")).toContainText("first night-sky time-lapse");
});
test.beforeEach(async ({ page }) => {
  await page.addInitScript(() =>
    sessionStorage.setItem("nightsky-entered", "true"),
  );
});
test.beforeEach(async ({ page }) => {
  await page.route("**/api/news**", (r) =>
    r.fulfill({ json: { count: 0, results: [] } }),
  );
});
test("shell, product story and examples", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(
    "Know when, where, and how to look up.",
  );
  await expect(page.getByRole("banner")).toHaveCount(1);
  await expect(page.getByRole("main")).toHaveCount(1);
  await expect(page.getByRole("contentinfo")).toHaveCount(1);
  await expect(page.getByText("Our Story", { exact: true })).toHaveCount(0);
  await expect(
    page.getByRole("link", { name: "Book Now", exact: true }),
  ).toHaveCount(0);
  await page.getByRole("button", { name: "Capture the sky", exact: true }).click();
  await expect(page.getByTestId("example-question")).toHaveText(
    "I want to make my first night-sky time-lapse. Where do I begin?",
  );
  await expect(
    page.getByText("Illustrative conversations. Your place, date and conditions shape the guidance.", { exact: true }),
  ).toBeVisible();
  await expect(page.getByTestId("example-response")).toContainText("interval");
  await expect(page.locator(".assistant-brands svg, .assistant-brands img")).toHaveCount(4);
  await expect(page.locator(".hero-platforms svg, .hero-platforms img")).toHaveCount(4);
  const section = page.locator("#possibilities");
  await expect(
    section.getByRole("link", { name: "What goes into an answer" }),
  ).toHaveCount(0);
  await expect(
    section.getByRole("button", { name: "Copy question" }),
  ).toHaveCount(0);
  await expect(
    section.locator(".example-followup, .getting-started-strip, .example-note"),
  ).toHaveCount(0);
  await expect(
    section.getByText("A place, an idea, a question. Choose a beginning and see how the conversation unfolds."),
  ).toBeVisible();
  for (const name of ["Ask a question", "Plan a night", "Capture the sky", "Explore an event"]) {
    await section.getByRole("button", { name, exact: true }).click();
    const words = (
      await page.getByTestId("example-response").innerText()
    ).split(/\s+/).length;
    expect(words).toBeLessThanOrEqual(65);
    expect(words).toBeGreaterThan(25);
  }
  expect(await page.locator("audio").count()).toBe(1);
  expect(await page.locator("video").count()).toBe(0);
});
test("resources filtering and history", async ({ page }) => {
  await page.goto("/resources?topic=photography&ref=home");
  await expect(page.getByRole("button", { name: "Photography", exact: true })).toHaveAttribute("aria-pressed", "true");
  await page.getByRole("button", { name: "Stargazing", exact: true }).click();
  await expect(page.getByTestId("resource-card").first()).toBeVisible();
  await page.goBack();
  await expect(page.getByRole("button", { name: "Photography", exact: true })).toHaveAttribute("aria-pressed", "true");
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
    "The Collective",
  );
  await expect(page.locator("form")).toHaveCount(0);
  await page.goto("/contact");
  await expect(
    page.getByRole("link", { name: "Email NightSky" }),
  ).toHaveAttribute("href", "mailto:NightSky.earth2026@gmail.com?subject=NightSky%20%E2%80%94%20Something%20else");
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
  const trigger = page.locator("button[aria-controls=mobile-navigation]");
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
  await expect(page.getByRole("button", { name: "Photography", exact: true })).toHaveAttribute("aria-pressed", "true");
  await page
    .getByRole("banner")
    .getByRole("link", { name: "Resources", exact: true })
    .click();
  await expect(page).toHaveURL(/\/resources$/);
  await expect(page.getByRole("button", { name: "All topics", exact: true })).toHaveAttribute("aria-pressed", "true");
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
  await page.goto("/");
  await expect(page.locator('meta[name="description"]')).toHaveAttribute(
    "content",
    /Plan a night under the stars with NightSky in your AI assistant/,
  );
  const websiteSchema = page.locator('script[type="application/ld+json"]');
  await expect(websiteSchema).toHaveCount(1);
  const websiteSchemaText = await websiteSchema.textContent();
  expect(websiteSchemaText).toContain('"@type":"WebSite"');
  expect(websiteSchemaText).toContain('"name":"NightSky.earth"');
  await page.goto("/resources");
  await expect(page.locator('meta[name="description"]')).toHaveCount(1);
  await expect(page.locator('meta[property="og:title"]')).toHaveCount(1);
  const pageSchema = page.locator('script[type="application/ld+json"]');
  await expect(pageSchema).toHaveCount(1);
  expect(JSON.parse((await pageSchema.textContent()) || "{}")).toMatchObject({
    "@type": "WebPage",
    url: "https://nightsky.earth/resources/",
  });
  await page.goto("/meteor-shower/perseids");
  await expect(
    page.getByRole("link", { name: "Explore sky events →", exact: true }),
  ).toBeVisible();
});
