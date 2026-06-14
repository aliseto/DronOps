import { test, expect } from "@playwright/test";

// Browser smoke: the Compliance/Findings route renders its shell (the page
// degrades gracefully without a data layer in the no-DB e2e environment).
//
// The substantive journey — sealed-flight deviation → auto-raised finding →
// triage-accept → CAPA → SoD-blocked self-close → audit — is covered
// deterministically in packages/shared/src/compliance/journey.test.ts, and the
// data-layer guarantees (auto-raise at seal, the SoD + terminal-immutability
// triggers) are verified via SQL probes (it needs seeded flight + finding data,
// so it lives as an integration test rather than a no-DB browser run).
test("compliance route renders the findings surface", async ({ page }) => {
  await page.goto("/compliance");
  await expect(page.getByRole("heading", { name: "Findings" })).toBeVisible();
});
