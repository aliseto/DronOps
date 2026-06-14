import { test, expect } from "@playwright/test";

// Browser smoke: the M3 safety dashboard renders and is reachable from the
// safety sub-nav (degrades gracefully without a data layer).
//
// The substantive aggregation (occurrence rate per 100 flights, leading
// indicators, trend) is covered by packages/shared/src/safety/dashboard.test.ts.
test("safety dashboard is reachable and renders", async ({ page }) => {
  await page.goto("/safety/dashboard");
  await expect(page.getByRole("navigation").getByRole("link", { name: "Hazard register" })).toBeVisible();
});
