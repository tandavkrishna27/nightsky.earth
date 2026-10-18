import { test, expect } from "@playwright/test";
import { SUPPORT_EMAIL } from "../../shared/website";

test("Collective welcomes six audiences, explains four purposes and offers an honest email invitation", async ({
  page,
}) => {
  await page.goto("/community");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(
    "The Collective",
  );
  await expect(page.locator("main h2")).toHaveText([
    "Different places. The same wonder.",
    "Curiosity travels further when it is shared.",
    "Bring your perspective.",
  ]);
  await expect(page.locator(".collective-status")).toHaveText("Coming soon");
  await expect(page.locator(".collective-audience-grid h3")).toHaveText([
    "Stargazers & skywatchers",
    "Astronomers & researchers",
    "Astrophotographers & filmmakers",
    "Educators & science communicators",
    "Astronomy clubs & observatories",
    "Dark-sky advocates & nature lovers",
  ]);
  await expect(page.locator(".collective-welcome-note")).toContainText(
    "No title, equipment or experience required",
  );
  await expect(page.locator(".collective-purpose-grid h3")).toHaveText([
    "Observe",
    "Create",
    "Learn",
    "Conserve",
  ]);
  await expect(page.locator("main .eyebrow")).toHaveCount(0);
  await expect(page.locator("main form")).toHaveCount(0);
  const action = page.getByRole("link", {
    name: "Email to contribute",
    exact: true,
  });
  const href = new URL((await action.getAttribute("href"))!);
  expect(href.protocol).toBe("mailto:");
  expect(href.pathname).toBe(SUPPORT_EMAIL);
  expect(href.searchParams.get("subject")).toBe(
    "Contributing to the NightSky Collective",
  );
  await expect(action).toHaveCSS("border-radius", "999px");
});

test("Collective reflows and keeps the email action accessible with enlarged mobile text", async ({
  page,
}) => {
  await page.goto("/community");
  await page.evaluate(() => document.fonts.ready);
  for (const width of [320, 390, 768, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
  }
  await page.setViewportSize({ width: 320, height: 900 });
  await page
    .locator(".collective-page, .collective-page *")
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
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  const action = page.getByRole("link", {
    name: "Email to contribute",
    exact: true,
  });
  await action.focus();
  await expect(action).toBeFocused();
  const box = (await action.boundingBox())!;
  expect(box.width).toBeLessThanOrEqual(320);
  expect(box.height).toBeGreaterThanOrEqual(44);
});
