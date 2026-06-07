import { test, expect } from "@playwright/test";

// Run these without the stored session.
test.use({ storageState: { cookies: [], origins: [] } });

test("unauthenticated access to the app redirects to sign in", async ({ page }) => {
  await page.goto("/dashboard");
  await expect(page).toHaveURL(/\/signin/);
  await expect(page.getByRole("heading", { name: "Sign in" })).toBeVisible();
});

test("sign in via credentials reaches the dashboard", async ({ page }) => {
  await page.goto("/signin");
  await page.fill('input[name="email"]', "e2e@dronops.test");
  await page.fill('input[name="password"]', "e2e-password");
  await page.getByRole("button", { name: "Sign in" }).click();
  await expect(page).toHaveURL(/\/dashboard/);
  await expect(page.getByRole("heading", { name: "Dashboard" })).toBeVisible();
});
