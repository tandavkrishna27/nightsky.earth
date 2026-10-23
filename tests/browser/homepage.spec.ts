import { test, expect } from "@playwright/test";

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() =>
    sessionStorage.setItem("nightsky-entered", "true"),
  );
  await page.clock.setFixedTime(new Date("2026-10-16T12:00:00Z"));
});

test("approved homepage combines the journey and conversation, then events, Collective and FAQs", async ({
  page,
}) => {
  await page.goto("/");
  await expect(page.locator("main h2")).toHaveText([
    "Connect manually",
    "Journeys Under the Infinite.",
    "What’s Happening in the Sky.",
    "Moments Beneath the Infinite.",
    "A few things, before you begin.",
    "Ready to look up?",
  ]);
  const journey = page.locator("#possibilities");
  await expect(
    journey.getByRole("button", { name: "Plan a night", exact: true }),
  ).toHaveAttribute("aria-pressed", "true");
  await journey
    .getByRole("button", { name: "Capture the sky", exact: true })
    .click();
  await expect(journey.getByTestId("example-question")).toContainText(
    "time-lapse",
  );
  await expect(journey.locator(".journey-scene img")).toHaveAttribute(
    "alt",
    "The Milky Way above a dark landscape",
  );
  await journey
    .getByRole("button", { name: "Explore an event", exact: true })
    .click();
  await expect(journey.getByTestId("example-question")).toContainText(
    "meteor shower",
  );
  await expect(journey.locator(".assistant-brands")).toContainText("ChatGPT");
  await expect(journey.locator(".assistant-brands")).toContainText("Claude");
  await expect(journey.locator(".assistant-brands")).toContainText("Gemini");
  await expect(journey.locator(".plugin-brand")).toContainText(
    "NightSky.earth plugin",
  );
  await expect(page.locator("#collective .collective-values h3")).toHaveText([
    "Observe",
    "Create",
    "Learn",
    "Conserve",
  ]);
  await expect(page.locator("#faq details")).toHaveCount(8);
  await expect(page.locator("#faq .faq-intro a")).toHaveCount(0);
  await page
    .locator("#faq")
    .getByText("Is NightSky free?", { exact: true })
    .click();
  await expect(page.locator("#faq details[open]")).toContainText(
    "usage limits still apply",
  );
});

test("mobile events expose dates, snap horizontally and retain individual guide destinations", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  const events = page.locator("#home-events");
  await expect(events.locator(".home-event-card")).toHaveCount(3);
  await expect(events.locator(".home-event-date").first()).toContainText("18");
  await expect(
    events.getByText("Visibility & equipment", { exact: true }),
  ).toHaveCount(0);
  await expect(events.locator(".home-event-card").first()).toHaveAttribute(
    "href",
    /\/sky-events\/first-quarter-moon-2026-10-18/,
  );
  await events.getByRole("button", { name: "Next event", exact: true }).click();
  await expect(events.locator(".event-position")).toHaveText("2 / 3");
  await events.getByRole("button", { name: "Next event", exact: true }).click();
  await expect(events.locator(".event-position")).toHaveText("3 / 3");
  await expect(
    events.getByRole("button", { name: "Next event", exact: true }),
  ).toBeDisabled();
  await events.locator(".home-event-grid").focus();
  await page.keyboard.press("ArrowLeft");
  await expect(events.locator(".event-position")).toHaveText("2 / 3");
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
});

test.describe("hero motion", () => {
  test.use({ reducedMotion: "no-preference" });
  test("pausing during thinking also stops the decorative dots", async ({
    page,
  }) => {
    await page.clock.install();
    await page.goto("/");
    const demo = page.getByTestId("conversation-demo");
    await demo.locator(".journey-chat").scrollIntoViewIfNeeded();
    await expect(demo).toHaveAttribute("data-playback-state", "playing");
    await page.clock.runFor(3000);
    const dot = demo
      .locator(".demo-animation .is-thinking .thinking-dots i")
      .first();
    await expect(dot).toHaveCSS("animation-play-state", "running");
    await demo.getByRole("button", { name: "Pause demo", exact: true }).click();
    await expect(dot).toHaveCSS("animation-play-state", "paused");
    await demo
      .getByRole("button", { name: "Resume demo", exact: true })
      .click();
    await expect(dot).toHaveCSS("animation-play-state", "running");
  });
  test("hero stays decorative and pauses when welcome is replayed", async ({
    page,
  }) => {
    await page.goto("/");
    const hero = page.locator(".home-hero");
    await expect(hero.getByRole("button", { name: "Copy", exact: true })).toHaveCount(1);
    await expect(hero.locator("video")).toHaveJSProperty("paused", false);
    await page
      .getByRole("contentinfo")
      .getByRole("button", { name: "Replay welcome" })
      .click();
    await expect(hero.locator("video")).toHaveJSProperty("paused", true);
  });
  test("failed hero video keeps the still and removes the motion control", async ({
    page,
  }) => {
    await page.route("**/Nightskyearth.mp4", (route) => route.abort());
    await page.goto("/");
    await expect(page.locator(".home-hero .sky-media img")).toBeVisible();
    await expect(page.locator(".home-hero video")).toHaveCount(0);
    await expect(page.getByRole("button", { name: /sky video/ })).toHaveCount(
      0,
    );
  });
});

test("enlarged mobile text stays inside the journey image and redesigned sections", async ({
  page,
}) => {
  await page.setViewportSize({ width: 320, height: 900 });
  await page.goto("/");
  await page.evaluate(() => document.fonts.ready);
  await page
    .locator(
      ".home-journey, .home-journey *, .home-events, .home-events *, .home-collective, .home-collective *, .home-faq, .home-faq *",
    )
    .evaluateAll((elements) => {
      const sizes = elements.map((element) => ({
        element: element as HTMLElement,
        font: parseFloat(getComputedStyle(element).fontSize),
        line: parseFloat(getComputedStyle(element).lineHeight),
      }));
      for (const { element, font, line } of sizes) {
        element.style.setProperty("font-size", `${font * 2}px`, "important");
        if (Number.isFinite(line))
          element.style.setProperty(
            "line-height",
            `${line * 2}px`,
            "important",
          );
      }
    });
  const scene = (await page.locator(".journey-scene").boundingBox())!;
  const caption = (await page
    .locator(".journey-scene figcaption")
    .boundingBox())!;
  expect(caption.y).toBeGreaterThanOrEqual(scene.y);
  expect(caption.y + caption.height).toBeLessThanOrEqual(
    scene.y + scene.height + 1,
  );
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
});
