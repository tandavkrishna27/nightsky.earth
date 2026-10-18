import { test, expect } from "@playwright/test";
import { SUPPORT_EMAIL } from "../../shared/website";

test("Get Started has one equal four-assistant choice and concise help", async ({ page }) => {
  await page.goto("/get-started");
  const cards = page.locator(".setup-assistant-card");
  await expect(cards).toHaveCount(4);
  await expect(cards.locator("h3")).toHaveText(["ChatGPT", "Claude", "Gemini", "Grok"]);
  for (const card of await cards.all()) {
    const action = card.getByRole("button", { name: /Get NightSky Plugin/ });
    await expect(action).toBeDisabled();
  }
  await expect(page.locator(".setup-preview, .setup-other-section")).toHaveCount(0);
  await expect(page.locator("main")).not.toContainText("Open NightSky in Grok");
  await expect(page.locator(".setup-step")).toHaveCount(3);
  await expect(page.locator(".starter-question")).toHaveCount(3);
  await expect(page.getByRole("link", { name: "Contact NightSky", exact: true })).toHaveAttribute("href", "/contact?topic=setup");
});

test("Contact routes four topics into one correctly encoded email action and supports history", async ({ page }) => {
  await page.goto("/contact?topic=collective&ref=footer");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Contact NightSky.");
  await expect(page.getByRole("radio", { name: "The Collective", exact: true })).toBeChecked();
  const action = page.getByRole("link", { name: "Email NightSky", exact: true });
  const mail = new URL((await action.getAttribute("href"))!);
  expect(mail.protocol).toBe("mailto:");
  expect(mail.pathname).toBe(SUPPORT_EMAIL);
  expect(mail.searchParams.get("subject")).toBe("NightSky — The Collective");
  await page.getByRole("radio", { name: "Bugs & corrections", exact: true }).check();
  await expect(page.locator(".contact-context")).toContainText("what you expected");
  expect(new URL((await action.getAttribute("href"))!).searchParams.get("subject")).toBe("NightSky — Bugs & corrections");
  expect(new URL(page.url()).searchParams.get("ref")).toBe("footer");
  await page.goBack();
  await expect(page.getByRole("radio", { name: "The Collective", exact: true })).toBeChecked();
  await page.goto("/contact?topic=invalid");
  await expect(page.getByRole("radio", { name: "Something else", exact: true })).toBeChecked();
  await expect(page.locator("main form")).toHaveCount(0);
});

test("Sources explains source scope and exposes details through keyboard disclosures", async ({ page }) => {
  await page.goto("/sources");
  await expect(page.locator(".coverage-card")).toHaveCount(5);
  await expect(page.locator("main")).not.toContainText(/awaiting confirmation|will be added|Preview information/);
  await expect(page.locator("main .eyebrow")).toHaveCount(0);
  const first = page.locator(".coverage-card").first();
  await first.getByText("View source details", { exact: true }).focus();
  await page.keyboard.press("Enter");
  await expect(first.locator("details")).toHaveAttribute("open", "");
  await expect(first.getByRole("link", { name: /^Astronomy Engine/ })).toHaveAttribute("href", "https://github.com/cosinekitty/astronomy");
  await expect(page.locator(".coverage-reading")).toContainText("Historical");
  await expect(page.getByRole("link", { name: "Suggest a correction", exact: true })).toHaveAttribute("href", "/contact?topic=bugs");
});

test("Contact supports keyboard topic selection and copying without opening email", async ({ page, context }) => {
  await context.grantPermissions(["clipboard-read", "clipboard-write"]);
  await page.goto("/contact?topic=setup");
  await page.getByRole("radio", { name: "Help & setup", exact: true }).focus();
  await page.keyboard.press("ArrowRight");
  await expect(page.getByRole("radio", { name: "Bugs & corrections", exact: true })).toBeChecked();
  const copy = page.getByRole("button", { name: "Copy email address", exact: true });
  await copy.focus();
  await page.keyboard.press("Enter");
  await expect(page.getByRole("status")).toHaveText("Email address copied.");
  expect(await page.evaluate(() => navigator.clipboard.readText())).toBe(SUPPORT_EMAIL);
  await expect(copy).toBeFocused();
});

test("Contact provides a selectable address when clipboard permission is denied", async ({ page }) => {
  await page.addInitScript(() => Object.defineProperty(navigator, "clipboard", { value: { writeText: () => Promise.reject(new Error("denied")) } }));
  await page.goto("/contact");
  const copy = page.getByRole("button", { name: "Copy email address", exact: true });
  await copy.click();
  await expect(page.getByRole("status")).toHaveText("Select the email address to copy it.");
  await expect(page.locator(".contact-address span")).toHaveCSS("user-select", "text");
  await expect(copy).toBeFocused();
});

test("all three pages reflow at narrow widths and enlarged text", async ({ page }) => {
  for (const path of ["/get-started", "/contact", "/sources"]) {
    for (const width of [320, 390, 768, 1440]) {
      await page.setViewportSize({ width, height: 900 });
      await page.goto(path);
      await page.evaluate(() => document.fonts.ready);
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    }
    await page.setViewportSize({ width: 320, height: 900 });
    await page.locator("main, main *").evaluateAll(elements => {
      const sizes = elements.map(element => ({ element: element as HTMLElement, font: parseFloat(getComputedStyle(element).fontSize), line: parseFloat(getComputedStyle(element).lineHeight) }));
      for (const { element, font, line } of sizes) {
        element.style.setProperty("font-size", `${font * 2}px`, "important");
        if (Number.isFinite(line)) element.style.setProperty("line-height", `${line * 2}px`, "important");
      }
    });
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  }
});
