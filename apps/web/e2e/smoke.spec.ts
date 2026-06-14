import { test, expect } from "@playwright/test";

// The chromium project is authenticated by default (storageState from setup).
// These smoke tests cover the PUBLIC entry, so run them signed-out.
test.describe("public entry", () => {
  test.use({ storageState: { cookies: [], origins: [] } });

  test("home redirects unauthenticated visitors to sign in", async ({ page }) => {
    await page.goto("/");
    await expect(page).toHaveURL(/\/signin$/);
    await expect(page.getByRole("heading", { name: "Sign in" })).toBeVisible();
  });

  test("public pages default to dark theme", async ({ page }) => {
    await page.goto("/signin");
    const html = page.locator("html");
    await expect(html).toHaveAttribute("data-theme", "dark");
    await expect(html).toHaveAttribute("lang", "en");
    await page.screenshot({ path: "test-results/signin-dark.png", fullPage: true });
  });
});

// Signed-in (default project state): the home route lands in the app.
test("home sends authenticated users to the dashboard", async ({ page }) => {
  await page.goto("/");
  await expect(page).toHaveURL(/\/dashboard$/);
});
