import { test, expect } from "@playwright/test";
test.beforeEach(async ({ page }) => { await page.addInitScript(() => sessionStorage.setItem("nightsky-entered", "true")); });
const article = {
  id: 42,
  title: "A telescope looks further",
  url: "https://example.org/story",
  publisher: "Example Observatory",
  summary: "External summary",
  publishedAt: "2026-10-16T00:00:00Z",
  imageUrl: null,
};
test("news submits search, uses sources, handles empty results and retry", async ({
  page,
}) => {
  let calls = 0;
  let fail = false;
  await page.route("**/api/news?**", async (route) => {
    calls++;
    if (fail)
      return route.fulfill({ status: 502, json: { error: "Unavailable" } });
    const url = new URL(route.request().url());
    return route.fulfill({
      json: {
        count: url.searchParams.has("search") ? 0 : 1,
        results: url.searchParams.has("search") ? [] : [article],
      },
    });
  });
  await page.goto("/news");
  await expect(
    page.getByRole("heading", { name: article.title }),
  ).toBeVisible();
  const before = calls;
  await page.getByLabel("Search news").fill("nothing");
  expect(calls).toBe(before);
  await page.getByRole("button", { name: "Search", exact: true }).click();
  await expect(page.getByText("No stories match this search.")).toBeVisible();
  fail = true;
  await page.getByRole("button", { name: "Clear search" }).click();
  await page.getByRole("button", { name: "Search", exact: true }).click();
  await page.goto("/news?q=failed");
  await expect(
    page.getByText("We couldn’t load the news right now."),
  ).toBeVisible();
  fail = false;
  await page.getByRole("button", { name: "Retry", exact: true }).click();
  await expect(page.getByText("No stories match this search.")).toBeVisible();
});
test("latest query wins and old query results never appear as new", async ({
  page,
}) => {
  await page.route("**/api/news?**", async (route) => {
    const url = new URL(route.request().url());
    if (url.searchParams.get("search") === "slow") {
      await new Promise((r) => setTimeout(r, 800));
      return route.fulfill({
        json: { count: 1, results: [{ ...article, title: "Old slow story" }] },
      });
    }
    return route.fulfill({
      json: {
        count: 1,
        results: [
          {
            ...article,
            title:
              url.searchParams.get("search") === "fast"
                ? "New fast story"
                : article.title,
          },
        ],
      },
    });
  });
  await page.goto("/news");
  await page.getByLabel("Search news").fill("slow");
  await page.getByRole("button", { name: "Search", exact: true }).click();
  await page.getByLabel("Search news").fill("fast");
  await page.getByRole("button", { name: "Search", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "New fast story" }),
  ).toBeVisible();
  await page.waitForTimeout(900);
  await expect(page.getByText("Old slow story")).toHaveCount(0);
});
test("missing article differs from provider failure", async ({ page }) => {
  await page.route("**/api/news/999", (route) =>
    route.fulfill({ status: 404, json: { error: "Article not found" } }),
  );
  await page.goto("/news/999");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(
    "Story not found.",
  );
  await expect(page.getByRole("button", { name: "Retry" })).toHaveCount(0);
});

test("header navigation resets same-page News state", async ({ page }) => {
  await page.route("**/api/news?**", (r) =>
    r.fulfill({ json: { count: 0, results: [] } }),
  );
  await page.goto("/news?q=moon&source=NASA");
  await expect(page.getByLabel("Search news")).toHaveValue("moon");
  await page
    .getByRole("banner")
    .getByRole("link", { name: "News", exact: true })
    .click();
  await expect(page).toHaveURL(/\/news$/);
  await expect(page.getByLabel("Search news")).toHaveValue("");
  await expect(page.getByLabel("Publisher")).toHaveValue("");
});
