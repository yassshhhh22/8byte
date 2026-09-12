import { expect, test } from "@playwright/test";
import { fundamentalsFixture, portfolioFixture } from "../src/test/fixtures";

test.beforeEach(async ({ page }) => {
  await page.route("**/api/portfolio", (route) => route.fulfill({ json: portfolioFixture }));
  await page.route("**/api/fundamentals*", (route) => route.fulfill({ json: fundamentalsFixture }));
});

test("renders stable desktop, tablet, and mobile dashboard layouts", async ({ page }, testInfo) => {
  const sizes = [
    { name: "desktop", width: 1440, height: 900 },
    { name: "tablet", width: 768, height: 1024 },
    { name: "mobile", width: 390, height: 844 },
  ];

  for (const size of sizes) {
    await page.setViewportSize(size);
    await page.goto("/", { waitUntil: "domcontentloaded" });
    await expect(page.getByRole("heading", { name: "Performance at a glance" })).toBeVisible();
    await expect(page.getByRole("img", { name: "Capital allocation by sector donut chart" })).toBeVisible();
    await page.waitForTimeout(950);

    const viewport = await page.evaluate(() => ({
      width: window.innerWidth,
      scrollWidth: document.documentElement.scrollWidth,
      chartPaths: document.querySelectorAll(".recharts-wrapper svg path").length,
    }));
    expect(viewport.scrollWidth).toBeLessThanOrEqual(viewport.width);
    expect(viewport.chartPaths).toBeGreaterThan(0);

    if (size.name === "mobile") {
      await expect(page.getByRole("table")).toBeHidden();
      const holding = page.getByRole("button", { name: /HDFC Bank/ });
      await holding.click();
      await expect(page.getByText("Latest Earnings (EPS)").last()).toBeVisible();
    } else {
      await expect(page.getByRole("table")).toBeVisible();
    }

    const screenshot = await page.screenshot({ fullPage: false });
    expect(screenshot.byteLength).toBeGreaterThan(10_000);
    await testInfo.attach(`dashboard-${size.name}`, { body: screenshot, contentType: "image/png" });
  }
});

test("changes theme and filters holdings without losing data", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/", { waitUntil: "domcontentloaded" });
  await page.getByRole("button", { name: "Switch to light theme" }).click();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "light");
  await expect.poll(() => page.evaluate(() => localStorage.getItem("portfolio-theme"))).toBe('"light"');

  await page.getByRole("searchbox", { name: "Search holdings" }).fill("missing company");
  await expect(page.getByText("No holdings match these filters.")).toBeVisible();
  await page.getByRole("button", { name: "Reset filters" }).click();
  await expect(page.getByRole("rowheader", { name: "HDFC Bank" })).toBeVisible();
});
