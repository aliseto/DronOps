import { test, expect } from "@playwright/test";

// Browser smoke: the ISO 9.3 management-review list renders and is reachable from
// the Compliance sub-nav (degrades gracefully without a data layer).
//
// The substantive paths — the §9.3 input summarizer and the Tier-3 sign →
// immutable freeze — are covered by packages/shared/src/compliance/review.test.ts
// and the DB trigger probe (signed_immutable / delete_blocked) in PR-027; the
// sign ceremony needs seeded data + re-auth, so it's not a no-DB browser run.
test("management-review list is reachable and renders", async ({ page }) => {
  await page.goto("/compliance/reviews");
  await expect(page.getByRole("heading", { name: "Management review" })).toBeVisible();
  await expect(page.getByRole("navigation").getByRole("link", { name: "Coverage" })).toBeVisible();
});
