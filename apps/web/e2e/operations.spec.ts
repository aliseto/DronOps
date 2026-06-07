import { test, expect } from "@playwright/test";

// Browser smoke: the Operations route renders its shell/heading (the page
// degrades gracefully without a data layer in the no-DB e2e environment).
//
// The substantive cross-module journey — a specific-category mission with a
// non-current / over-duty pilot is BLOCKED, then cleared by a logged override —
// is covered deterministically at the engine level in
// packages/shared/src/operations/engine.test.ts (it needs seeded currency +
// duty data, so it lives as an integration test rather than a no-DB browser run).
test("operations route renders the missions surface", async ({ page }) => {
  await page.goto("/operations");
  await expect(page.getByRole("heading", { name: "Missions" })).toBeVisible();
});
