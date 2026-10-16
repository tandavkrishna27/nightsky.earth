import { test, expect } from "@playwright/test";
test.beforeEach(async ({ page }) => { await page.addInitScript(() => sessionStorage.setItem("nightsky-entered", "true")); });
test("home mounts", async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto("/");
  await expect(page.locator("body")).not.toBeEmpty();
  expect(errors).toEqual([]);
});
