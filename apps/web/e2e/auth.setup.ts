import { test as setup, expect } from "@playwright/test";

const authFile = "apps/web/e2e/.auth/user.json";

// Signs in once (via the dev-only e2e bypass) and saves the session so the
// authenticated projects can reuse it.
setup("authenticate", async ({ page }) => {
  await page.goto("/signin");
  await page.fill('input[name="email"]', "e2e@dronops.test");
  await page.fill('input[name="password"]', "e2e-password");
  await page.getByRole("button", { name: "Sign in" }).click();
  await page.waitForURL(/\/dashboard/);
  await expect(page.getByRole("heading", { name: "Dashboard" })).toBeVisible();
  await page.context().storageState({ path: authFile });
});
