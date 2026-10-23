import { test, expect } from "@playwright/test";

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() =>
    sessionStorage.setItem("nightsky-entered", "true"),
  );
});

test("FAQ keeps a steady section height with one answer open at a time", async ({
  page,
}) => {
  for (const width of [1440, 390, 320]) {
    await page.setViewportSize({ width, height: 1000 });
    await page.goto("/");
    await page.evaluate(() => document.fonts.ready);
    const faq = page.locator("#faq");
    await faq.scrollIntoViewIfNeeded();
    const initialHeight = (await faq.boundingBox())!.height;
    const initialHeadingTop = (await faq.locator("h2").boundingBox())!.y;
    for (const index of [0, 1, 2]) {
      await faq.locator("summary").nth(index).click();
      await expect(faq.locator("details[open]")).toHaveCount(1);
      expect(
        Math.abs((await faq.boundingBox())!.height - initialHeight),
      ).toBeLessThanOrEqual(1);
      expect(
        Math.abs(
          (await faq.locator("h2").boundingBox())!.y - initialHeadingTop,
        ),
      ).toBeLessThanOrEqual(1);
    }
    await faq.locator("summary").nth(2).focus();
    await page.keyboard.press("Enter");
    await expect(faq.locator("details[open]")).toHaveCount(0);
    expect(
      Math.abs((await faq.boundingBox())!.height - initialHeight),
    ).toBeLessThanOrEqual(1);
  }
});

test("primary CTAs name the plugin and use the splash star style", async ({
  page,
}) => {
  await page.goto("/");
  const ctas = page.locator("a.action-primary");
  for (const cta of await ctas.all()) {
    await expect(cta).toHaveAccessibleName("Get NightSky Plugin");
    await expect(cta.locator("svg.lucide-sparkles")).toHaveCount(1);
    await expect(cta).not.toContainText("↗");
    await expect(cta).toHaveAttribute("href", "/get-started");
  }
});

test("FAQ reserve adapts to enlarged text without clipping the answer", async ({
  page,
}) => {
  await page.setViewportSize({ width: 320, height: 900 });
  await page.goto("/");
  await page.evaluate(() => document.fonts.ready);
  const list = page.locator(".home-faq-list");
  const before = await list.evaluate((element) =>
    parseFloat((element as HTMLElement).style.minHeight),
  );
  await page
    .locator("#faq summary, #faq .faq-answer")
    .evaluateAll((elements) => {
      const sizes = elements.map((element) => ({
        element: element as HTMLElement,
        font: parseFloat(getComputedStyle(element).fontSize),
        line: parseFloat(getComputedStyle(element).lineHeight),
      }));
      for (const { element, font, line } of sizes) {
        element.style.fontSize = `${font * 2}px`;
        element.style.lineHeight = `${line * 2}px`;
      }
    });
  await expect
    .poll(() =>
      list.evaluate((element) =>
        parseFloat((element as HTMLElement).style.minHeight),
      ),
    )
    .toBeGreaterThan(before);
  const height = (await list.boundingBox())!.height;
  for (const index of [0, 7, 1, 4]) {
    await list.locator("summary").nth(index).focus();
    await page.keyboard.press("Space");
    await expect(list.locator("details[open]")).toHaveCount(1);
    expect(
      Math.abs((await list.boundingBox())!.height - height),
    ).toBeLessThanOrEqual(1);
    expect(
      await list.evaluate(
        (element) => element.scrollHeight <= element.clientHeight + 1,
      ),
    ).toBe(true);
  }
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
});

test("rapid FAQ selections keep the latest answer open exclusively", async ({
  page,
}) => {
  await page.goto("/");
  await expect(page.locator("#faq summary")).toHaveCount(8);
  await page.locator("#faq summary").evaluateAll((summaries) => {
    for (const index of [0, 1, 2]) (summaries[index] as HTMLElement).click();
  });
  await expect(page.locator("#faq details[open]")).toHaveCount(1);
  await expect(page.locator("#faq details").nth(2)).toHaveAttribute("open");
});
