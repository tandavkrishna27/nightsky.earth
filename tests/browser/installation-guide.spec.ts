import { test, expect } from "@playwright/test";

test("assistant setup links select a guide, preserve history and expose only real installation methods", async ({
  page,
}) => {
  await page.goto("/get-started?ref=footer");
  await expect(page.locator(".setup-account-note")).toContainText(
    "No separate NightSky account required",
  );
  await page
    .locator(".setup-assistant-card")
    .filter({ hasText: "Claude" })
    .getByRole("link", { name: "Setup guide", exact: true })
    .click();
  await expect(page.locator("#setup-heading")).toBeFocused();
  const guide = page.getByRole("region", {
    name: "Set up NightSky.",
    exact: true,
  });
  await expect(
    guide.getByRole("button", { name: "Claude", exact: true }),
  ).toHaveAttribute("aria-pressed", "true");
  expect(new URL(page.url()).searchParams.get("ref")).toBe("footer");
  await guide
    .getByRole("button", { name: "Manual setup", exact: true })
    .click();
  await expect(guide).toContainText("Customize");
  await expect(
    guide.getByRole("button", {
      name: "Copy NightSky connection address",
      exact: true,
    }),
  ).toBeDisabled();
  await expect(
    guide.getByRole("button", { name: "Download Claude package", exact: true }),
  ).toBeDisabled();
  await guide.getByRole("button", { name: "Gemini", exact: true }).click();
  await expect(
    guide.getByRole("button", { name: "Marketplace", exact: true }),
  ).toHaveCount(0);
  await expect(guide).toContainText("US");
  await expect(guide).toContainText("web");
  await page.goBack();
  await expect(
    guide.getByRole("button", { name: "Claude", exact: true }),
  ).toHaveAttribute("aria-pressed", "true");
  await page.goto("/get-started?assistant=invalid&mode=invalid");
  await expect(
    guide.getByRole("button", { name: "ChatGPT", exact: true }),
  ).toHaveAttribute("aria-pressed", "true");
  await expect(
    guide.getByRole("button", { name: "Marketplace", exact: true }),
  ).toHaveAttribute("aria-pressed", "true");
  await expect(
    guide.locator('a[href*="example.com"],a[href*="127.0.0.1"],a[href="#"]'),
  ).toHaveCount(0);
});

test("setup FAQ is exclusive, keyboard accessible and keeps a stable footprint", async ({
  page,
}) => {
  await page.goto("/get-started");
  const faq = page.locator(".setup-faq");
  await expect(faq.locator("details")).toHaveCount(6);
  await page.evaluate(() => document.fonts.ready);
  await expect
    .poll(async () =>
      faq
        .locator(".stable-faq-list")
        .evaluate((e) => parseFloat((e as HTMLElement).style.minHeight)),
    )
    .toBeGreaterThan(0);
  const initial = (await faq.boundingBox())!.height;
  const summaries = faq.locator("summary");
  await summaries.nth(0).focus();
  await page.keyboard.press("Enter");
  await expect(faq.locator("details[open]")).toHaveCount(1);
  await expect(faq).toContainText("No separate NightSky account");
  await summaries.nth(3).click();
  await expect(faq.locator("details[open]")).toHaveCount(1);
  expect(
    Math.abs((await faq.boundingBox())!.height - initial),
  ).toBeLessThanOrEqual(3);
});

test("guide copy has honest failure feedback and mobile enlarged content stays inside the viewport", async ({
  page,
}) => {
  await page.addInitScript(() =>
    Object.defineProperty(navigator, "clipboard", {
      value: { writeText: () => Promise.reject(new Error("denied")) },
    }),
  );
  await page.goto("/get-started?assistant=grok&mode=manual");
  const guide = page.locator(".installation-guide");
  await guide
    .getByRole("button", { name: "Copy setup question", exact: true })
    .click();
  await expect(guide.getByRole("status")).toHaveText(
    "Select the question to copy it.",
  );
  await expect(guide.locator(".setup-check-prompt")).toHaveCSS(
    "user-select",
    "text",
  );
  for (const width of [320, 390, 768, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    await page.goto("/get-started?assistant=claude&mode=manual");
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
  }
  await page.setViewportSize({ width: 320, height: 900 });
  await page
    .locator(
      ".installation-guide, .installation-guide *, .setup-faq, .setup-faq *",
    )
    .evaluateAll((elements) => {
      const metrics = elements.map((e) => ({
        e: e as HTMLElement,
        font: parseFloat(getComputedStyle(e).fontSize),
        line: parseFloat(getComputedStyle(e).lineHeight),
      }));
      for (const { e, font, line } of metrics) {
        e.style.setProperty("font-size", `${font * 2}px`, "important");
        if (Number.isFinite(line))
          e.style.setProperty("line-height", `${line * 2}px`, "important");
      }
    });
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await page.locator(".setup-faq summary").last().click();
  await expect(page.locator(".setup-faq details[open]")).toHaveCount(1);
});

test("a direct setup link focuses the guide after the page mounts", async ({
  page,
}) => {
  await page.goto("/get-started?assistant=gemini&mode=directory#setup-heading");
  await expect(page.locator("#setup-heading")).toBeFocused();
  const guide = page.locator(".installation-guide");
  await expect(
    guide.getByRole("button", { name: "Manual setup", exact: true }),
  ).toHaveAttribute("aria-pressed", "true");
  await expect
    .poll(async () => (await page.locator("#setup-heading").boundingBox())!.y)
    .toBeLessThan(160);
});

test("modified setup link clicks retain the browser open-in-new-tab behavior", async ({
  page,
  context,
}) => {
  await page.goto("/get-started");
  const link = page
    .locator(".setup-assistant-card")
    .filter({ hasText: "Claude" })
    .getByRole("link", { name: "Setup guide", exact: true });
  const opened = context.waitForEvent("page", { timeout: 5000 });
  await link.click({ modifiers: ["Control"] });
  const other = await opened;
  await other.waitForLoadState();
  expect(new URL(other.url()).searchParams.get("assistant")).toBe("claude");
  await other.close();
});
