import { test, expect } from "@playwright/test";

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    sessionStorage.setItem("nightsky-entered", "true");
    localStorage.removeItem("nightsky-analytics-consent");
  });
});

function isAnalyticsRequest(url: string) {
  return (
    url.includes("googletagmanager.com/gtag/js") ||
    url.includes("google-analytics.com/g/collect")
  );
}

test("analytics is undecided by default and rejection loads no Google tag", async ({ page }) => {
  const analyticsRequests: string[] = [];
  page.on("request", request => {
    if (isAnalyticsRequest(request.url())) analyticsRequests.push(request.url());
  });

  await page.goto("/resources?q=nebula&source=all");
  await expect(page.getByTestId("analytics-consent")).toBeVisible();
  await page.getByRole("button", { name: "Reject analytics" }).click();
  await expect(page.getByTestId("analytics-consent")).toHaveCount(0);
  await expect.poll(() => page.evaluate(() => localStorage.getItem("nightsky-analytics-consent"))).toBe("rejected");
  await page.goto("/news?q=orion");
  expect(analyticsRequests).toEqual([]);
});

test("consenting on a local or preview host never sends production analytics", async ({ page }) => {
  const analyticsRequests: string[] = [];
  page.on("request", request => {
    if (isAnalyticsRequest(request.url())) analyticsRequests.push(request.url());
  });

  await page.goto("/resources?q=nebula&source=all#results");
  await page.getByRole("button", { name: "Allow analytics" }).click();
  await expect(page.getByTestId("analytics-consent")).toHaveCount(0);
  await expect.poll(() => page.evaluate(() => localStorage.getItem("nightsky-analytics-consent"))).toBe("accepted");
  expect(analyticsRequests).toEqual([]);
  expect(await page.locator("#nightsky-google-analytics").count()).toBe(0);
});

test("footer privacy choices let a visitor revoke their saved choice", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Allow analytics" }).click();
  await page.getByRole("button", { name: "Privacy choices" }).click();
  await expect(page.getByTestId("analytics-consent")).toBeVisible();
  await page.getByRole("button", { name: "Reject analytics" }).click();
  await expect.poll(() => page.evaluate(() => localStorage.getItem("nightsky-analytics-consent"))).toBe("rejected");
  await expect(page.getByTestId("analytics-consent")).toHaveCount(0);
});

test("mobile consent choices fit the viewport and remain easy to tap", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  const consent = page.getByTestId("analytics-consent");
  await expect(consent).toBeVisible();
  await expect(consent.getByRole("button", { name: "Reject analytics" })).toBeVisible();
  await expect(consent.getByRole("button", { name: "Allow analytics" })).toBeVisible();
  const bounds = await consent.boundingBox();
  expect(bounds).not.toBeNull();
  expect(bounds!.x).toBeGreaterThanOrEqual(0);
  expect(bounds!.x + bounds!.width).toBeLessThanOrEqual(390);
  await consent.getByRole("button", { name: "Reject analytics" }).click();
});
