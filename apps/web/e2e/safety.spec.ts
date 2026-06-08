import { test, expect } from "@playwright/test";

// Browser smoke: the M3 safety occurrences screen renders and is reachable
// (degrades gracefully without a data layer).
//
// The substantive paths — the jurisdiction deadline-status engine and the
// file → investigate → close (immutable) → escalate-to-finding flow — are
// covered by packages/shared/src/safety/occurrence.test.ts and the DB
// immutability/isolation probes; the role-gated mutations need seeded data, so
// they're not a no-DB browser run.
test("safety occurrences screen is reachable and renders", async ({ page }) => {
  await page.goto("/safety");
  await expect(page.getByRole("heading", { name: "Safety occurrences" })).toBeVisible();
  await expect(page.getByRole("button", { name: "+ File occurrence" })).toBeVisible();
});
