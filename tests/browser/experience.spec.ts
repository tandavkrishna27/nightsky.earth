import { test, expect } from "@playwright/test";

test("sound control is icon-only and keeps an accessible touch target", async ({ page }) => {
  await page.addInitScript(() => sessionStorage.setItem("nightsky-entered", "true"));
  await page.goto("/");
  const button = page.getByRole("button", { name: "Unmute music", exact: true });
  await expect(button).toHaveText("");
  await expect(button).toHaveAttribute("aria-pressed", "false");
  for (const width of [390, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    const box = await button.boundingBox();
    expect(box!.width).toBeGreaterThanOrEqual(46);
    expect(box!.height).toBe(box!.width);
  }
});

test("pending music can be cancelled before playback resolves", async ({
  page,
}) => {
  await page.addInitScript(() => {
    HTMLMediaElement.prototype.play = function () {
      return new Promise<void>((resolve) => {
        (window as any).finishMusic = resolve;
      });
    };
  });
  await page.goto("/");
  await page
    .getByRole("button", { name: "Enter the Night", exact: true })
    .click();
  await page.getByRole("button", { name: "Cancel music playback" }).click();
  await page.evaluate(() => (window as any).finishMusic());
  await expect(
    page.getByRole("button", { name: "Unmute music" }),
  ).toBeVisible();
  expect(
    await page
      .locator("audio")
      .evaluate((a: HTMLAudioElement) => a.muted && a.paused),
  ).toBe(true);
});

test("footer How it works reaches the section from home and another route", async ({
  page,
}) => {
  await page.addInitScript(() =>
    sessionStorage.setItem("nightsky-entered", "true"),
  );
  for (const path of ["/community", "/"]) {
    await page.goto(path);
    await page
      .getByRole("contentinfo")
      .getByRole("link", { name: "How it works" })
      .click();
    await expect
      .poll(() =>
        page
          .locator("#how-it-works")
          .evaluate((e) => Math.round(e.getBoundingClientRect().top)),
      )
      .toBeGreaterThanOrEqual(0);
    await expect
      .poll(() =>
        page
          .locator("#how-it-works")
          .evaluate((e) => Math.round(e.getBoundingClientRect().top)),
      )
      .toBeLessThan(250);
  }
});

test("entrance offers sound and silence, focuses content, and remembers entry", async ({
  page,
}) => {
  await page.goto("/");
  await expect(
    page.getByRole("dialog", { name: "Enter NightSky" }),
  ).toBeVisible();
  await expect(page.locator("[data-experience-content]")).toHaveAttribute(
    "inert",
    "",
  );
  await page.getByRole("button", { name: "Enter without sound" }).click();
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await expect(page.getByRole("main")).toBeFocused();
  await expect(
    page.getByRole("button", { name: "Unmute music" }),
  ).toBeVisible();
  expect(
    await page.locator("audio").evaluate((a: HTMLAudioElement) => a.paused),
  ).toBe(true);
  await page
    .getByRole("navigation", { name: "Main navigation", exact: true })
    .getByRole("link", { name: "The Collective" })
    .click();
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(
    "The Collective",
  );
  await expect(page.locator("audio")).toHaveCount(1);
  await page.reload();
  await expect(page.getByRole("dialog")).toHaveCount(0);
  expect(
    await page.locator("audio").evaluate((a: HTMLAudioElement) => a.paused),
  ).toBe(true);
});

test("platform story, navigation and creative scope", async ({ page }) => {
  await page.addInitScript(() =>
    sessionStorage.setItem("nightsky-entered", "true"),
  );
  await page.goto("/");
  const nav = page.getByRole("navigation", {
    name: "Main navigation",
    exact: true,
  });
  await expect(nav.getByRole("link")).toHaveText([
    "About",
    "The Collective",
    "Resources",
    "News",
    "Sky Map",
  ]);
  await expect(page.locator(".hero-copy")).toContainText(
    "NightSky in your AI assistant",
  );
  await expect(page.locator(".platform-availability")).not.toContainText(
    /Coming soon|Planned/,
  );
  await expect(page.locator(".home-hero .platform-availability")).toHaveCount(
    1,
  );
  await expect(page.locator(".platform-availability .hero-platform")).toHaveCount(4);
  await expect(page.locator(".platform-availability")).toContainText("Claude");
  await expect(page.locator(".platform-availability")).toContainText("Gemini");
  await expect(page.locator(".platform-availability")).toContainText("Grok");
  await page.getByRole("button", { name: "Capture the sky", exact: true }).click();
  await expect(page.getByTestId("example-question")).toContainText("time-lapse");
  await expect(page.locator("#faq")).toContainText("photograph, time-lapse or video");
  await expect(page.locator(".brand i")).toHaveCount(0);
  await page.setViewportSize({ width: 390, height: 844 });
  await expect(
    page.getByRole("button", { name: "Open navigation" }),
  ).toHaveText("");
  await page.setViewportSize({ width: 1280, height: 900 });
  await expect(
    page
      .getByRole("banner")
      .getByRole("link", { name: "Get NightSky Plugin", exact: true }),
  ).toHaveAttribute("href", "/get-started");
});

test("Collective is a coming-soon invitation with email contributions and mobile reflow", async ({
  page,
}) => {
  await page.addInitScript(() =>
    sessionStorage.setItem("nightsky-entered", "true"),
  );
  await page.goto("/community");
  await expect(page.locator(".collective-hero")).toContainText(
    "For the dreamers",
  );
  await expect(page.locator(".collective-audience")).toContainText("Astrophotographers & filmmakers");
  await expect(page.locator(".collective-contribute")).toContainText(
    "coming soon",
  );
  await expect(page.locator("form")).toHaveCount(0);
  await expect(
    page.getByRole("link", { name: /Join|WhatsApp|Sign up/i }),
  ).toHaveCount(0);
  for (const width of [320, 375, 640, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
  }
});

test("playback failure stays silent and can be retried, audio survives routing", async ({
  page,
}) => {
  await page.addInitScript(() => {
    let calls = 0;
    HTMLMediaElement.prototype.play = function () {
      calls++;
      if (calls === 1) return Promise.reject(new Error("blocked"));
      this.dispatchEvent(new Event("play"));
      return Promise.resolve();
    };
  });
  await page.goto("/");
  await page
    .getByRole("button", { name: "Enter the Night", exact: true })
    .click();
  await expect(
    page.getByRole("button", { name: "Unmute music" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Unmute music" }).click();
  await expect(
    page.getByRole("button", { name: "Mute music", exact: true }),
  ).toBeVisible();
  await page
    .locator("audio")
    .evaluate((a) => a.setAttribute("data-persistent", "yes"));
  await page
    .getByRole("navigation", { name: "Main navigation", exact: true })
    .getByRole("link", { name: "About", exact: true })
    .click();
  await expect(page.locator("audio")).toHaveAttribute("data-persistent", "yes");
  await page.getByRole("button", { name: "Mute music", exact: true }).click();
  await expect(
    page.getByRole("button", { name: "Unmute music" }),
  ).toBeVisible();
});

test("Get NightSky Plugin keeps music playing across the route", async ({
  page,
}) => {
  await page.addInitScript(() => {
    HTMLMediaElement.prototype.play = function () {
      return Promise.resolve();
    };
  });
  await page.goto("/");
  await page
    .getByRole("button", { name: "Enter the Night", exact: true })
    .click();
  await expect(
    page.getByRole("button", { name: "Mute music", exact: true }),
  ).toBeVisible();
  await page
    .locator("audio")
    .evaluate((audio) => audio.setAttribute("data-persistent", "yes"));
  await page
    .getByRole("banner")
    .getByRole("link", { name: "Get NightSky Plugin" })
    .click();
  await expect(page).toHaveURL(/\/get-started\/?$/);
  await expect(page.locator("audio")).toHaveAttribute("data-persistent", "yes");
  await expect(
    page.getByRole("button", { name: "Mute music", exact: true }),
  ).toBeVisible();
});

test("blocked session storage does not prevent keyboard entry", async ({
  page,
}) => {
  await page.addInitScript(() => {
    Storage.prototype.getItem = () => {
      throw new Error("blocked");
    };
    Storage.prototype.setItem = () => {
      throw new Error("blocked");
    };
  });
  await page.goto("/");
  await page.getByRole("button", { name: "Enter without sound" }).focus();
  await page.keyboard.press("Enter");
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await page.goto("/resources?topic=photography");
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Photography", exact: true })).toHaveAttribute("aria-pressed", "true");
});

test("navigation compacts on scroll and mobile icon opens and closes accessibly", async ({
  page,
}) => {
  await page.addInitScript(() =>
    sessionStorage.setItem("nightsky-entered", "true"),
  );
  await page.goto("/");
  const header = page.getByRole("banner");
  const initial = await header.boundingBox();
  await page.evaluate(() => window.scrollTo(0, 800));
  await expect(header).toHaveClass(/is-scrolled/);
  const compact = await header.boundingBox();
  expect(compact!.y).toBe(initial!.y);
  expect(compact!.width).toBe(initial!.width);
  expect(compact!.height).toBeLessThan(initial!.height);
  await page.evaluate(() => window.scrollTo(0, 0));
  await expect(header).not.toHaveClass(/is-scrolled/);
  await page.setViewportSize({ width: 390, height: 844 });
  const trigger = page.locator(".menu-trigger");
  await expect(trigger).toHaveText("");
  await expect(trigger.locator(".menu-icon")).toHaveCount(1);
  await trigger.click();
  await expect(trigger).toHaveAccessibleName("Close navigation");
  await page.keyboard.press("Escape");
  await expect(trigger).toBeFocused();
  await expect(trigger).toHaveAccessibleName("Open navigation");
  await trigger.click();
  await page
    .getByRole("navigation", { name: "Mobile navigation" })
    .getByRole("link", { name: "About", exact: true })
    .click();
  await expect(trigger).toHaveAttribute("aria-expanded", "false");
  await expect(
    page.getByRole("navigation", { name: "Mobile navigation" }),
  ).toHaveCount(0);
});
