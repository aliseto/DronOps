import { test, expect } from "@playwright/test";

test("home page renders the foundation badge", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  await expect(page.getByTestId("foundation-badge")).toBeVisible();
});

test("defaults to dark theme and toggles to light", async ({ page }) => {
  await page.goto("/");
  const html = page.locator("html");
  await expect(html).toHaveAttribute("data-theme", "dark");
  await expect(html).toHaveAttribute("lang", "en");

  await page.screenshot({ path: "test-results/home-dark.png", fullPage: true });

  await page.getByRole("button", { name: /switch to light theme/i }).click();
  await expect(html).toHaveAttribute("data-theme", "light");

  await page.screenshot({ path: "test-results/home-light.png", fullPage: true });
});
