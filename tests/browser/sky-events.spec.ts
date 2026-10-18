import { skyEvents, coverageMonths } from "../../shared/skyEventCatalog";
import { test, expect } from "@playwright/test";
test.beforeEach(async ({ page }) => {
  await page.addInitScript(() =>
    sessionStorage.setItem("nightsky-entered", "true"),
  );
  await page.clock.setFixedTime(new Date("2026-10-16T12:00:00Z"));
});
test("calendar filters, URL history, timezone and empty research state", async ({
  page,
}) => {
  await page.goto("/sky-events?month=2026-10&tz=UTC&view=month");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(
    "Something worth looking up for.",
  );
  await expect(page.getByRole("table")).toBeVisible();
  await page.getByLabel("Event category").selectOption("meteor-showers");
  await expect(page.locator(".month-calendar")).toContainText("Orionid");
  await page.getByRole("button", { name: "Next month", exact: true }).click();
  await expect(page.getByLabel("Calendar month")).toHaveValue("2026-11");
  await page.goBack();
  await expect(page.getByLabel("Calendar month")).toHaveValue("2026-10");
  await page.getByLabel("Display time zone").selectOption("Asia/Kolkata");
  await expect(page).toHaveURL(/tz=Asia%2FKolkata/);
  await page.getByRole("button", { name: "List", exact: true }).click();
  await expect(page.locator(".event-list")).toContainText("Approx.");
  await page.getByLabel("Calendar month").fill("2028-01");
  await expect(
    page.getByText("This month has not been reviewed yet.", { exact: true }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Today", exact: true }).click();
  await expect(page.getByLabel("Calendar month")).toHaveValue("2026-10");
});
test("actual UTC phase changes calendar date across timezone boundary", async ({
  page,
}) => {
  await page.goto(
    "/sky-events?month=2027-09&category=moon&view=list&tz=Pacific%2FKiritimati",
  );
  const card = page.locator(
    '.event-list [data-event-id="new-moon-2027-08-31"]',
  );
  await expect(card).toContainText("1 Sept 2027");
  await page.getByLabel("Display time zone").selectOption("UTC");
  await expect(card).toHaveCount(0);
});
test("guides show timing basis, sources and copy failure; mobile stays usable", async ({
  page,
}) => {
  await page.goto("/sky-events/full-moon-2026-10-26?tz=Asia%2FKolkata");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Full Moon");
  await expect(page.locator(".event-detail-timing")).toContainText("09:42");
  await expect(
    page.getByRole("link", { name: /2026 Sky Event Almanac/ }),
  ).toHaveAttribute("href", /astropixels/);
  await page.evaluate(() =>
    Object.defineProperty(navigator, "clipboard", {
      value: { writeText: () => Promise.reject(new Error("blocked")) },
      configurable: true,
    }),
  );
  await page
    .getByRole("button", { name: "Copy question", exact: true })
    .click();
  await expect(page.getByRole("status")).toContainText("Couldn’t copy");
  await page.goto("/sky-events?month=2026-10&view=list&tz=UTC");
  for (const width of [320, 640, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
  }
});
test("blocked preference storage, invalid URL and timezone reset do not break calendar", async ({
  page,
}) => {
  await page.addInitScript(() => {
    Storage.prototype.getItem = () => {
      throw Error("blocked");
    };
    Storage.prototype.setItem = () => {
      throw Error("blocked");
    };
    Storage.prototype.removeItem = () => {
      throw Error("blocked");
    };
  });
  await page.goto("/sky-events?month=bad&tz=bad&view=bad");
  await expect(page.getByRole("dialog", { name: "Enter NightSky" })).toHaveCount(0);
  await expect(page.getByLabel("Calendar month")).toHaveValue("2026-10");
  await page.getByRole("button", { name: "Use browser time zone" }).click();
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
});

test("preferences persist, reset removes only zone override, mobile default is list", async ({
  page,
}) => {
  await page.setViewportSize({ width: 375, height: 812 });
  await page.goto("/sky-events?month=2026-10&tz=UTC");
  await expect(
    page.getByRole("button", { name: "List", exact: true }),
  ).toHaveAttribute("aria-pressed", "true");
  await page.getByLabel("Display time zone").selectOption("Asia/Kolkata");
  expect(
    await page.evaluate(() => localStorage.getItem("nightsky-timezone")),
  ).toBe("Asia/Kolkata");
  await page
    .getByRole("banner")
    .getByRole("link", { name: "NightSky.earth home" })
    .click();
  await expect(
    page.locator(
      '.upcoming-grid [data-event-id="first-quarter-moon-2026-10-18"]',
    ),
  ).toContainText("21:43");
  await page.goto("/sky-events?month=2026-10");
  await page.evaluate(() => localStorage.setItem("unrelated", "keep"));
  await page.getByRole("button", { name: "Use browser time zone" }).click();
  expect(
    await page.evaluate(() => localStorage.getItem("nightsky-timezone")),
  ).toBeNull();
  expect(await page.evaluate(() => localStorage.getItem("unrelated"))).toBe(
    "keep",
  );
});
test("timezone choices work without supportedValuesOf and current day refreshes on focus", async ({
  page,
}) => {
  await page.addInitScript(() =>
    Object.defineProperty(Intl, "supportedValuesOf", {
      value: undefined,
      configurable: true,
    }),
  );
  await page.clock.setFixedTime(new Date("2026-10-31T23:59:00Z"));
  await page.goto("/sky-events?month=2026-10&tz=UTC&view=month");
  await expect(page.locator("time[aria-current=date]")).toHaveAttribute(
    "datetime",
    "2026-10-31",
  );
  await page.clock.setFixedTime(new Date("2026-11-01T00:01:00Z"));
  await page.evaluate(() => window.dispatchEvent(new Event("focus")));
  await expect(page.locator("time[aria-current=date]")).toHaveAttribute(
    "datetime",
    "2026-11-01",
  );
  await page.getByRole("button", { name: "Today", exact: true }).click();
  await expect(page.getByLabel("Calendar month")).toHaveValue("2026-11");
  await page.getByLabel("Display time zone").selectOption("Asia/Kathmandu");
  await expect(page).toHaveURL(/tz=Asia%2FKathmandu/);
});

test("top event guide returns to the selected calendar state", async ({
  page,
}) => {
  await page.goto("/sky-events?month=2027-09&category=moon&view=list&tz=UTC");
  await page
    .locator(".upcoming-grid")
    .getByRole("link", { name: /Explore event/ })
    .first()
    .click();
  await page.getByRole("link", { name: /Back to the calendar/ }).click();
  await expect(page.getByLabel("Calendar month")).toHaveValue("2027-09");
  await expect(page.getByLabel("Event category")).toHaveValue("moon");
  await expect(
    page.getByRole("button", { name: "List", exact: true }),
  ).toHaveAttribute("aria-pressed", "true");
});
test("ongoing peak date is labelled rather than called an unqualified next peak", async ({
  page,
}) => {
  await page.clock.setFixedTime(new Date("2026-10-21T12:00:00Z"));
  await page.goto("/sky-events?tz=UTC");
  await expect(
    page.locator(
      '.upcoming-grid [data-event-id="orionid-meteor-shower-2026-10-21"]',
    ),
  ).toContainText("Ongoing");
});
test("dense calendar days expand and restore keyboard focus on close", async ({
  page,
}) => {
  const base = skyEvents.find((e) => e.id === "full-moon-2026-10-26")!;
  const fixtures = Array.from({ length: 4 }, (_, i) => ({
    ...base,
    id: "dense-" + i,
    title: "A long event title for keyboard and reflow testing " + i,
  }));
  await page.route("**/shared/skyEventCatalog.ts*", (r) =>
    r.fulfill({
      contentType: "text/javascript",
      body:
        "export const skyEvents=" +
        JSON.stringify(fixtures) +
        ";export const coverageMonths=" +
        JSON.stringify(coverageMonths) +
        ";",
    }),
  );
  await page.goto("/sky-events?month=2026-10&view=month&tz=UTC");
  const more = page.getByRole("button", {
    name: "Show 4 events on 2026-10-26",
  });
  await more.focus();
  await page.keyboard.press("Enter");
  await expect(
    page.getByRole("heading", { name: "Events on 2026-10-26" }),
  ).toBeFocused();
  await expect(page.locator(".expanded-day .sky-event-card")).toHaveCount(4);
  await page.getByRole("button", { name: "Close day list" }).click();
  await expect(more).toBeFocused();
  await page.setViewportSize({ width: 320, height: 800 });
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
});
