import { test, expect } from "@playwright/test";

// Browser smoke: the Coverage matrix renders and is reachable from the Compliance
// sub-nav (degrades gracefully without a data layer in the no-DB e2e environment).
//
// The substantive paths — coverage rollup math and the gap→audit-finding
// escalation — are covered deterministically in
// packages/shared/src/compliance/coverage.test.ts and the finding engine tests;
// the DB-backed assess/escalate journey needs seeded requirement + document data,
// so it lives as an integration test rather than a no-DB browser run.
test("coverage matrix is reachable and renders", async ({ page }) => {
  await page.goto("/compliance/coverage");
  await expect(page.getByRole("heading", { name: "Coverage" })).toBeVisible();
  await expect(page.getByRole("navigation").getByRole("link", { name: "Findings" })).toBeVisible();
});
