import { expect, test } from "@playwright/test";

const address = "https://mcp.nightsky.earth/mcp";

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() =>
    sessionStorage.setItem("nightsky-entered", "true"),
  );
});

test.describe("manual MCP address", () => {
  test.use({ reducedMotion: "no-preference" });

  for (const path of ["/", "/get-started"]) {
    test(`${path} copies the public address without growing the card`, async ({
      page,
      context,
    }) => {
      await context.grantPermissions(["clipboard-read", "clipboard-write"]);
      await page.goto(path);
      const card = page.locator(".mcp-address-card");
      await expect(card.locator("code")).toHaveText(address);
      const before = (await card.boundingBox())!;
      const button = card.locator(".mcp-address-card__copy");
      await expect(button).toHaveText("Copy");
      await button.click();
      await expect(button).toHaveText("Copied");
      await expect(button).toBeFocused();
      await expect(card.locator("[role=status]")).toHaveText(
        "Connection address copied.",
      );
      await expect(card.locator(".mcp-address-card__star")).toHaveCount(5);
      await expect(card.locator(".mcp-address-card__star").first()).toHaveCSS(
        "animation-name",
        "mcp-card-star",
      );
      expect((await card.boundingBox())!.height).toBe(before.height);
      expect(await page.evaluate(() => navigator.clipboard.readText())).toBe(
        address,
      );
      await expect(button).toHaveText("Copy", { timeout: 3000 });
    });
  }

  test("mobile star shimmer stays inside the viewport", async ({
    page,
    context,
  }) => {
    await context.grantPermissions(["clipboard-read", "clipboard-write"]);
    await page.setViewportSize({ width: 320, height: 900 });
    await page.goto("/get-started");
    const card = page.locator(".mcp-address-card");
    await card.locator(".mcp-address-card__copy").click();
    await expect(card.locator(".mcp-address-card__star")).toHaveCount(5);
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
  });
});

test("mobile copy feedback stays within the viewport with reduced motion", async ({
  page,
  context,
}) => {
  await context.grantPermissions(["clipboard-read", "clipboard-write"]);
  await page.setViewportSize({ width: 320, height: 900 });
  await page.goto("/get-started");
  const card = page.locator(".mcp-address-card");
  const before = (await card.boundingBox())!;
  await card.locator(".mcp-address-card__copy").click();
  await expect(card.locator(".mcp-address-card__copy")).toHaveText("Copied");
  await expect(card.locator(".mcp-address-card__stars")).toHaveCSS(
    "display",
    "none",
  );
  expect((await card.boundingBox())!.height).toBe(before.height);
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
});

test("mobile hero shows the full connection card and centered copy button early", async ({
  page,
}) => {
  for (const width of [320, 360, 390]) {
    await page.setViewportSize({ width, height: 800 });
    await page.goto("/");
    const card = page.locator(".home-hero .mcp-address-card");
    const button = card.getByRole("button", { name: "Copy" });
    await expect(page.locator(".home-hero .hero-free-badge")).toBeHidden();
    await expect(page.locator(".home-hero .action-free-label")).toBeVisible();
    const cardBox = (await card.boundingBox())!;
    const buttonBox = (await button.boundingBox())!;
    expect(cardBox.y + cardBox.height).toBeLessThan(800);
    expect(Math.abs(buttonBox.x + buttonBox.width / 2 - (cardBox.x + cardBox.width / 2))).toBeLessThan(2);
    expect(buttonBox.width).toBeGreaterThan(cardBox.width - 60);
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(width);
  }
});

test("desktop hero retains its free badge", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto("/");
  await expect(page.locator(".home-hero .hero-free-badge")).toBeVisible();
  await expect(page.locator(".home-hero .action-free-label")).toBeHidden();
});

test("clipboard failure keeps the address selectable and offers retry", async ({
  page,
}) => {
  await page.addInitScript(() =>
    Object.defineProperty(navigator, "clipboard", {
      value: { writeText: () => Promise.reject(new Error("denied")) },
    }),
  );
  await page.goto("/get-started");
  const card = page.locator(".mcp-address-card");
  await card.getByRole("button", { name: "Copy", exact: true }).click();
  await expect(
    card.getByRole("button", { name: "Retry", exact: true }),
  ).toBeVisible();
  await expect(card.locator("[role=status]")).toHaveText(
    "Select and copy the connection address above.",
  );
  await expect(card.locator("code")).toHaveCSS("user-select", "text");
  await expect(card.locator(".mcp-address-card__star")).toHaveCount(0);
});
