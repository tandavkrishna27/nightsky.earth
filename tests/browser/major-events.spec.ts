import { test, expect } from "@playwright/test";
test.beforeEach(async ({ page }) => {
  await page.addInitScript(() =>
    sessionStorage.setItem("nightsky-entered", "true"),
  );
  await page.clock.setFixedTime(new Date("2026-10-16T12:00Z"));
});
test("coverage is visible and seasons convert dates correctly", async ({
  page,
}) => {
  await page.goto("/sky-events?month=2026-12&tz=Asia%2FCalcutta&view=list");
  await expect(
    page.getByText("Major-event coverage", { exact: true }),
  ).toBeVisible();
  await page.getByLabel("Event category").selectOption("seasons");
  const card = page.locator(
    '.event-list [data-event-id="december-solstice-2026-12-21"]',
  );
  await expect(card).toContainText("22 Dec 2026");
  await expect(card).toContainText("02:20");
  await card.getByRole("link", { name: /Explore event/ }).click();
  await expect(page.getByRole("main")).toContainText("Southern Hemisphere");
  await expect(page.getByRole("main")).toContainText("Northern Hemisphere");
});
test("specialist meteor dates and detailed guidance remain source dates across timezones", async ({
  page,
}) => {
  await page.goto(
    "/sky-events/leonid-meteor-shower-2026-11-18?tz=Pacific%2FKiritimati",
  );
  await expect(page.locator(".event-detail-timing")).toContainText(
    "16 Nov 2026",
  );
  await expect(page.locator(".event-detail-timing")).toContainText(
    "17 Nov 2026",
  );
  await expect(
    page.getByRole("heading", { name: "Activity beyond the peak" }),
  ).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "The Moon for this return" }),
  ).toBeVisible();
  await expect(page.getByRole("main")).toContainText("55P/Tempel-Tuttle");
});
