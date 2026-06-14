import { test, expect } from "@playwright/test";

// Browser smoke: the SORA list renders and is reachable from the safety sub-nav
// (degrades gracefully without a data layer).
//
// The determination itself (GRC/ARC → SAIL) is covered by
// packages/shared/src/safety/sora.test.ts and the DB isolation probe.
test("sora list is reachable and renders", async ({ page }) => {
  await page.goto("/safety/sora");
  await expect(page.getByRole("heading", { name: "SORA assessments" })).toBeVisible();
  await expect(page.getByRole("navigation", { name: "Primary" }).getByRole("link", { name: "Dashboard" })).toBeVisible();
});
