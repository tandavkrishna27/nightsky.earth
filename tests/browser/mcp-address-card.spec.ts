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
