import { test, expect } from "@playwright/test";

test("direct links open immediately and stay entered when returning home", async ({ page }) => {
  await page.goto("/get-started");
  await expect(page.getByRole("dialog", { name: "Enter NightSky" })).toHaveCount(0);
  await expect(page.locator("[data-experience-content]")).not.toHaveAttribute("inert");
  await page.getByRole("link", { name: "NightSky.earth home", exact: true }).click();
  await expect(page.getByRole("dialog", { name: "Enter NightSky" })).toHaveCount(0);
  await page.reload();
  await expect(page.getByRole("dialog", { name: "Enter NightSky" })).toHaveCount(0);
});

test("reduced motion uses the matching still without requesting splash video", async ({ page }) => {
  const requests: string[] = [];
  page.on("request", request => { if (request.url().includes("splash-night-sky.mp4")) requests.push(request.url()); });
  await page.goto("/");
  const welcome = page.getByRole("dialog", { name: "Enter NightSky" });
  await expect(welcome).toContainText("A night-sky plugin for ChatGPT, Claude, Gemini & Grok.");
  await welcome.locator(".entrance-logo").evaluate((image: HTMLImageElement) => image.decode());
  await welcome.locator(".splash-poster").evaluate((image: HTMLImageElement) => image.decode());
  await expect(welcome.locator("video")).toHaveCount(0);
  await expect(welcome.getByRole("button", { name: /background video/ })).toHaveCount(0);
  await expect(welcome.getByRole("button", { name: "Ambient sound", exact: true })).toHaveCount(0);
  expect(requests).toEqual([]);
  await expect(page.locator("audio")).toHaveJSProperty("paused", true);
  await welcome.getByRole("button", { name: "Enter without sound", exact: true }).click();
  await expect(welcome).toHaveCount(0);
  await expect(page.getByRole("main")).toBeFocused();
  await expect(page.locator("audio")).toHaveJSProperty("paused", true);
});

test("sound entry starts real music and the floating control can mute it", async ({ page }) => {
  await page.goto("/");
  await expect(page.locator("audio")).toHaveJSProperty("paused", true);
  await page.getByRole("button", { name: "Enter the Night", exact: true }).click();
  await expect(page.getByRole("button", { name: "Mute music", exact: true })).toBeVisible();
  await expect(page.locator("audio")).toHaveJSProperty("paused", false);
  await page.getByRole("button", { name: "Mute music", exact: true }).click();
  await expect(page.locator("audio")).toHaveJSProperty("paused", true);
  await expect(page.getByRole("button", { name: "Unmute music", exact: true })).toBeVisible();
});

test("footer replay preserves the page, restores focus, and works repeatedly without changing refresh behavior", async ({ page }) => {
  await page.goto("/resources?topic=photography");
  await page.evaluate(() => document.fonts.ready);
  const replay = page.getByRole("contentinfo").getByRole("button", { name: "Replay welcome", exact: true });
  const welcome = page.getByRole("dialog", { name: "Enter NightSky" });
  await replay.scrollIntoViewIfNeeded();
  const scroll = await page.evaluate(() => window.scrollY);
  for (const close of ["silent", "escape"] as const) {
    await replay.click();
    await expect(welcome).toBeVisible();
    await expect(page).toHaveURL(/\/resources\?topic=photography$/);
    await expect(page.locator("[data-experience-content]")).toHaveAttribute("inert", "");
    if (close === "silent") await welcome.getByRole("button", { name: "Enter without sound", exact: true }).click();
    else await page.keyboard.press("Escape");
    await expect(welcome).toHaveCount(0);
    await expect(replay).toBeFocused();
    expect(Math.abs((await page.evaluate(() => window.scrollY)) - scroll)).toBeLessThan(3);
    await expect(page.locator("audio")).toHaveJSProperty("paused", true);
  }
  await page.reload();
  await expect(welcome).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Photography", exact: true })).toHaveAttribute("aria-pressed", "true");
});

test("replay pauses existing music and honors the next sound choice", async ({ page }) => {
  await page.addInitScript(() => sessionStorage.setItem("nightsky-entered", "true"));
  await page.goto("/");
  await page.getByRole("button", { name: "Unmute music", exact: true }).click();
  await expect(page.locator("audio")).toHaveJSProperty("paused", false);
  const replay = page.getByRole("contentinfo").getByRole("button", { name: "Replay welcome", exact: true });
  const welcome = page.getByRole("dialog", { name: "Enter NightSky" });
  for (const sound of [true, false]) {
    await replay.click();
    await expect(welcome).toBeVisible();
    await expect(page.locator("audio")).toHaveJSProperty("paused", true);
    await welcome.getByRole("button", { name: sound ? "Enter the Night" : "Enter without sound", exact: true }).click();
    await expect(welcome).toHaveCount(0);
    await expect(page.locator("audio")).toHaveJSProperty("paused", !sound);
    await expect(replay).toBeFocused();
  }
});

test("replay cancels pending music so a late completion cannot unmute silent entry", async ({ page }) => {
  await page.addInitScript(() => {
    HTMLAudioElement.prototype.play = function () {
      return new Promise<void>(resolve => { (window as unknown as { finishReplayAudio: () => void }).finishReplayAudio = resolve; });
    };
  });
  await page.goto("/");
  await page.getByRole("button", { name: "Enter the Night", exact: true }).click();
  await expect(page.getByRole("button", { name: "Cancel music playback", exact: true })).toBeVisible();
  await page.getByRole("contentinfo").getByRole("button", { name: "Replay welcome", exact: true }).click();
  await page.getByRole("button", { name: "Enter without sound", exact: true }).click();
  await page.evaluate(() => (window as unknown as { finishReplayAudio: () => void }).finishReplayAudio());
  await expect(page.getByRole("button", { name: "Unmute music", exact: true })).toBeVisible();
  await expect(page.locator("audio")).toHaveJSProperty("muted", true);
});

test.describe("moving splash", () => {
  test.use({ reducedMotion: "no-preference" });

  test("video plays silently at the selected speed and supports pause and looping", async ({ page }) => {
    await page.goto("/");
    const welcome = page.getByRole("dialog", { name: "Enter NightSky" });
    const video = welcome.locator("video");
    await expect.poll(() => video.evaluate((v: HTMLVideoElement) => v.currentTime)).toBeGreaterThan(0.1);
    await expect(video).toHaveJSProperty("muted", true);
    await expect(video).toHaveJSProperty("playsInline", true);
    await expect(video).toHaveJSProperty("playbackRate", 0.7);
    await expect(page.locator("audio")).toHaveJSProperty("paused", true);
    await welcome.getByRole("button", { name: "Pause background video", exact: true }).click();
    await expect(video).toHaveJSProperty("paused", true);
    await welcome.getByRole("button", { name: "Play background video", exact: true }).click();
    await expect(video).toHaveJSProperty("paused", false);
    await video.evaluate((v: HTMLVideoElement) => { v.currentTime = v.duration - 0.3; });
    await expect.poll(() => video.evaluate((v: HTMLVideoElement) => v.currentTime)).toBeLessThan(2);
    await expect(video).toHaveJSProperty("paused", false);
  });

  test("hidden tabs pause motion and a manual pause survives preference changes", async ({ page }) => {
    await page.goto("/");
    const welcome = page.getByRole("dialog", { name: "Enter NightSky" });
    const video = welcome.locator("video");
    await expect(video).toHaveJSProperty("paused", false);
    await page.evaluate(() => { Object.defineProperty(document, "hidden", { configurable: true, value: true }); document.dispatchEvent(new Event("visibilitychange")); });
    await expect(video).toHaveJSProperty("paused", true);
    await page.evaluate(() => { Object.defineProperty(document, "hidden", { configurable: true, value: false }); document.dispatchEvent(new Event("visibilitychange")); });
    await expect(video).toHaveJSProperty("paused", false);
    await welcome.getByRole("button", { name: "Pause background video", exact: true }).click();
    await page.emulateMedia({ reducedMotion: "reduce" });
    await expect(video).toHaveCount(0);
    await page.emulateMedia({ reducedMotion: "no-preference" });
    await expect(video).toHaveJSProperty("paused", true);
    await expect(welcome.getByRole("button", { name: "Play background video", exact: true })).toBeVisible();
  });

  test("keyboard cycles through all controls and Escape enters silently", async ({ page }) => {
    await page.goto("/");
    const welcome = page.getByRole("dialog", { name: "Enter NightSky" });
    const enter = welcome.getByRole("button", { name: "Enter the Night", exact: true });
    const silent = welcome.getByRole("button", { name: "Enter without sound", exact: true });
    const pause = welcome.getByRole("button", { name: "Pause background video", exact: true });
    await expect(enter).toBeFocused();
    await page.keyboard.press("Tab");
    await expect(silent).toBeFocused();
    await page.keyboard.press("Tab");
    await expect(pause).toBeFocused();
    await page.keyboard.press("Shift+Tab");
    await expect(silent).toBeFocused();
    await page.keyboard.press("Escape");
    await expect(welcome).toHaveCount(0);
    await expect(page.getByRole("main")).toBeFocused();
    await expect(page.locator("audio")).toHaveJSProperty("paused", true);
  });

  for (const removal of ["motion", "data-saving", "media-error"] as const) {
    test(`${removal} removal of a focused video control preserves silent keyboard entry`, async ({ page }) => {
      if (removal === "data-saving") await page.addInitScript(() => {
        const connection = Object.assign(new EventTarget(), { saveData: false });
        Object.defineProperty(navigator, "connection", { configurable: true, value: connection });
      });
      await page.goto("/");
      const welcome = page.getByRole("dialog", { name: "Enter NightSky" });
      await welcome.getByRole("button", { name: "Pause background video", exact: true }).focus();
      if (removal === "motion") await page.emulateMedia({ reducedMotion: "reduce" });
      if (removal === "data-saving") await page.evaluate(() => {
        const connection = (navigator as Navigator & { connection: EventTarget & { saveData: boolean } }).connection;
        connection.saveData = true;
        connection.dispatchEvent(new Event("change"));
      });
      if (removal === "media-error") await welcome.locator("video").evaluate(video => video.dispatchEvent(new Event("error")));
      await expect(welcome.getByRole("button", { name: /background video/ })).toHaveCount(0);
      await expect(welcome.getByRole("button", { name: "Enter the Night", exact: true })).toBeFocused();
      await page.keyboard.press("Escape");
      await expect(welcome).toHaveCount(0);
      await expect(page.getByRole("main")).toBeFocused();
      await expect(page.locator("audio")).toHaveJSProperty("paused", true);
    });
  }

  test("a pending video request advertises pause and honors the visitor's choice", async ({ page }) => {
    let release!: () => void;
    const pending = new Promise<void>(resolve => { release = resolve; });
    await page.route("**/splash-night-sky.mp4", async route => { await pending; await route.continue(); });
    await page.goto("/", { waitUntil: "domcontentloaded" });
    const welcome = page.getByRole("dialog", { name: "Enter NightSky" });
    const pause = welcome.getByRole("button", { name: "Pause background video", exact: true });
    try {
      await expect(pause).toBeVisible();
      await pause.click();
    } finally {
      release();
    }
    await expect(welcome.getByRole("button", { name: "Play background video", exact: true })).toBeVisible();
    await expect(welcome.locator("video")).toHaveJSProperty("paused", true);
    await welcome.getByRole("button", { name: "Play background video", exact: true }).click();
    await expect.poll(() => welcome.locator("video").evaluate((v: HTMLVideoElement) => v.currentTime)).toBeGreaterThan(0.1);
  });

  test("entry pauses the video during the fade and removes it afterwards", async ({ page }) => {
    await page.goto("/");
    const welcome = page.getByRole("dialog", { name: "Enter NightSky" });
    await expect(welcome.locator("video")).toHaveJSProperty("paused", false);
    await welcome.getByRole("button", { name: "Enter without sound", exact: true }).click();
    await expect(welcome).toHaveClass(/is-exiting/);
    await expect(welcome.locator("video")).toHaveJSProperty("paused", true);
    await expect(welcome).toHaveCount(0);
    await expect(page.locator("[data-experience-content]")).not.toHaveAttribute("inert");
    await page.reload();
    await expect(welcome).toHaveCount(0);
  });

  for (const failure of ["network", "autoplay"] as const) {
    test(`${failure} failure leaves the poster and entry usable`, async ({ page }) => {
      if (failure === "network") await page.route("**/splash-night-sky.mp4", route => route.abort());
      else await page.addInitScript(() => { HTMLVideoElement.prototype.play = () => Promise.reject(new DOMException("Blocked", "NotAllowedError")); });
      await page.goto("/");
      const welcome = page.getByRole("dialog", { name: "Enter NightSky" });
      await expect(welcome.locator("video")).toHaveCount(0);
      await welcome.locator(".splash-poster").evaluate((image: HTMLImageElement) => image.decode());
      await welcome.getByRole("button", { name: "Enter without sound", exact: true }).click();
      await expect(welcome).toHaveCount(0);
    });
  }

  test("data saving avoids requesting or playing the splash video", async ({ page }) => {
    await page.addInitScript(() => Object.defineProperty(navigator, "connection", { configurable: true, value: { saveData: true } }));
    const requests: string[] = [];
    page.on("request", request => { if (request.url().includes("splash-night-sky.mp4")) requests.push(request.url()); });
    await page.goto("/");
    const welcome = page.getByRole("dialog", { name: "Enter NightSky" });
    await expect(welcome.locator("video")).toHaveCount(0);
    await welcome.locator(".splash-poster").evaluate((image: HTMLImageElement) => image.decode());
    expect(requests).toEqual([]);
  });
});
