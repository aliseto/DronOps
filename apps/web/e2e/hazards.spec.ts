import { test, expect } from "@playwright/test";

// Browser smoke: the M3 hazard register renders and is reachable from the safety
// sub-nav (degrades gracefully without a data layer).
//
// The substantive paths — the 5×5 matrix scoring, review cycles, and the
// recurring-deviation→hazard link — are covered by
// packages/shared/src/safety/risk-matrix.test.ts and the DB isolation probe.
test("hazard register is reachable and renders", async ({ page }) => {
  await page.goto("/safety/hazards");
  await expect(page.getByRole("heading", { name: "Hazard register" })).toBeVisible();
  await expect(page.getByRole("navigation").getByRole("link", { name: "Occurrences" })).toBeVisible();
});
