import { test, expect } from "@playwright/test";
test("About tells the product story without invented services", async ({
  page,
}) => {
  await page.addInitScript(() =>
    sessionStorage.setItem("nightsky-entered", "true"),
  );
  await page.goto("/about");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(
    "Where Earth Looks Up",
  );
  await expect(page.getByRole("main")).toContainText(
    "plugin for your AI assistant",
  );
  await expect(
    page.getByRole("main").getByRole("link", { name: /Explore sources/ }),
  ).toHaveAttribute("href", "/sources");
  await expect(page.locator("form")).toHaveCount(0);
  for (const width of [320, 640, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
  }
});
