import { test, expect } from "@playwright/test";

test("the larger library reveals more resources without losing keyboard position", async ({ page }) => {
  await page.goto("/resources");
  const cards = page.getByTestId("resource-card");
  await expect(cards).toHaveCount(12);
  const initial = await cards.locator("h2").allTextContents();
  const more = page.getByRole("button", { name: "Show more resources", exact: true });
  await more.focus();
  await page.keyboard.press("Enter");
  await expect(cards).toHaveCount(24);
  await expect(cards.nth(12).getByRole("link")).toBeFocused();
  expect((await cards.locator("h2").allTextContents()).slice(0, 12)).toEqual(initial);
  while (await more.isVisible()) {
    const before = await cards.count();
    await more.click();
    expect(await cards.count()).toBeGreaterThan(before);
    await expect(cards.nth(before).getByRole("link")).toBeFocused();
  }
  await expect(more).toHaveCount(0);
  const allTitles = await cards.locator("h2").allTextContents();
  expect(new Set(allTitles).size).toBe(allTitles.length);
  await expect(page.locator(".resource-pagination")).toContainText(`Showing ${allTitles.length} of ${allTitles.length} resources`);
  await page.getByRole("button", { name: "Learning", exact: true }).click();
  await expect(page.getByRole("button", { name: "Learning", exact: true })).toHaveAttribute("aria-pressed", "true");
  await expect(page.locator(".resource-provider").first()).toBeVisible();
  expect(await cards.count()).toBeGreaterThan(0);
  expect(await cards.count()).toBeLessThanOrEqual(12);
});

test("search covers resources beyond the initial page and deep topic links reload correctly", async ({ page }) => {
  await page.goto("/resources?topic=conservation&ref=home");
  await expect(page.getByRole("button", { name: "Dark-sky conservation", exact: true })).toHaveAttribute("aria-pressed", "true");
  await expect(page.getByTestId("resource-card").first()).toBeVisible();
  await page.reload();
  await expect(page.getByRole("button", { name: "Dark-sky conservation", exact: true })).toHaveAttribute("aria-pressed", "true");
  await page.getByRole("button", { name: "Clear filters", exact: true }).click();
  await page.getByLabel("Search resources", { exact: true }).fill("Siril");
  await expect(page.getByTestId("resource-card")).toHaveCount(1);
  await expect(page.getByRole("heading", { name: "Siril", exact: true })).toBeVisible();
  expect(new URL(page.url()).searchParams.get("ref")).toBe("home");
});
