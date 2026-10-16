import { test, expect } from "@playwright/test";

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
  ]);
  await expect(page.locator(".hero-description")).toContainText(
    "plugin for your AI assistant",
  );
  await expect(page.locator(".platform-availability")).toContainText(
    "Not available yet",
  );
  await expect(page.locator(".platform-availability")).toContainText("Claude");
  await expect(page.locator(".platform-availability")).toContainText("Gemini");
  await expect(page.locator(".activity-grid")).toContainText("time-lapses");
  await expect(page.locator(".activity-grid")).toContainText("video");
  await expect(
    page
      .getByRole("banner")
      .getByRole("link", { name: /Get NightSky for ChatGPT/ }),
  ).toHaveAttribute("href", "/get-started");
});

test("Collective is an invitation with honest future status and mobile reflow", async ({
  page,
}) => {
  await page.addInitScript(() =>
    sessionStorage.setItem("nightsky-entered", "true"),
  );
  await page.goto("/community");
  await expect(page.locator(".collective-hero")).toContainText(
    "For the dreamers",
  );
  await expect(page.locator(".collective-people")).toContainText("Filmmakers");
  await expect(page.locator(".collective-future")).toContainText(
    "taking shape",
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
  await page.goto("/resources?topic=photography");
  await page.getByRole("button", { name: "Enter without sound" }).focus();
  await page.keyboard.press("Enter");
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await expect(page.getByLabel("Topic")).toHaveValue("photography");
});
