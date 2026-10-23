import { test, expect } from "@playwright/test";

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() =>
    sessionStorage.setItem("nightsky-entered", "true"),
  );
});

test("pricing and rounded platform-neutral CTAs agree across home and setup", async ({
  page,
}) => {
  await page.goto("/");
  await expect(page.locator(".hero-free-badge")).toHaveText("Free to use");
  await expect(page.locator(".hero-copy .action-primary")).toHaveText(
    "Get NightSky Plugin",
  );
  await expect(
    page.locator(".hero-copy .action-primary svg.lucide-sparkles"),
  ).toHaveCount(1);
  await expect(
    page
      .locator(".hero-copy")
      .getByRole("link", { name: /Explore what’s possible/ }),
  ).toHaveCount(0);
  await expect(page.locator(".hero-copy .action-primary")).toHaveCSS(
    "border-radius",
    "999px",
  );
  await expect(page.locator(".home-closing .pricing-note")).toHaveText(
    "Start exploring for free.",
  );
  const note = (await page
    .locator(".home-closing .pricing-note")
    .boundingBox())!;
  const cta = (await page
    .locator(".home-closing .action-primary")
    .boundingBox())!;
  expect(note.y - cta.y - cta.height).toBeGreaterThanOrEqual(24);
  await expect(page.locator("#faq details")).toHaveCount(8);
  await expect(page.locator("body")).not.toContainText(/free forever/i);
  await expect(
    page.getByRole("contentinfo").locator('a[href^="mailto:"]'),
  ).toHaveCount(0);
  await page.locator(".hero-copy .action-primary").click();
  await expect(page).toHaveURL(/\/get-started$/);
  await expect(page.locator(".setup-free-badge")).toContainText("Free to use");
  await expect(page.locator("body")).not.toContainText(/free forever/i);
});

test.describe("word streaming", () => {
  test.use({ reducedMotion: "no-preference" });
  test("assistant words arrive gradually without changing the chat height and respect pause", async ({
    page,
  }) => {
    await page.clock.install();
    await page.goto("/");
    const demo = page.getByTestId("conversation-demo");
    await demo.locator(".journey-chat").scrollIntoViewIfNeeded();
    await expect(demo).toHaveAttribute("data-playback-state", "playing");
    const height = (await demo.locator(".journey-chat").boundingBox())!.height;
    await page.clock.runFor(4000);
    const answer = demo.locator('.demo-animation [data-message="answer"]');
    const visibleWords = () =>
      answer
        .locator(".demo-word")
        .evaluateAll(
          (words) =>
            words.filter(
              (word) => getComputedStyle(word).visibility === "visible",
            ).length,
        );
    const first = await visibleWords();
    expect(first).toBeGreaterThan(0);
    expect(first).toBeLessThan(await answer.locator(".demo-word").count());
    await page.clock.runFor(500);
    expect(await visibleWords()).toBeGreaterThan(first);
    await demo.getByRole("button", { name: "Pause demo" }).click();
    const paused = await visibleWords();
    await page.clock.runFor(10000);
    expect(await visibleWords()).toBe(paused);
    expect(
      Math.abs(
        (await demo.locator(".journey-chat").boundingBox())!.height - height,
      ),
    ).toBeLessThanOrEqual(1);
    await demo.getByRole("button", { name: "Resume demo" }).click();
    await page.clock.runFor(10000);
    await expect(demo).toHaveAttribute("data-playback-state", "complete");
    expect(await visibleWords()).toBe(
      await answer.locator(".demo-word").count(),
    );
    await expect(page.locator(".home-hero button")).toHaveCount(1);
  });
});
