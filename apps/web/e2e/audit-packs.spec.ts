import { test, expect } from "@playwright/test";

// Browser smoke: the audit-packs list renders and is reachable from the
// Compliance sub-nav (degrades gracefully without a data layer).
//
// The substantive paths — the free-selection assembler + evidence index and the
// Tier-3 seal → immutable freeze — are covered by
// packages/shared/src/compliance/audit-pack.test.ts and the DB
// immutability/isolation probes; sealing needs seeded data + re-auth, so it's
// not a no-DB browser run.
test("audit-packs list is reachable and renders", async ({ page }) => {
  await page.goto("/compliance/packs");
  await expect(page.getByRole("heading", { name: "Audit packs" })).toBeVisible();
  await expect(page.getByRole("navigation").getByRole("link", { name: "Reviews" })).toBeVisible();
});
