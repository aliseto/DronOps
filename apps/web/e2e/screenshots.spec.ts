import { test } from "@playwright/test";

// Produces both-theme screenshots of the standing review surface as CI
// artifacts (local capture is blocked in the dev sandbox). Attached to each PR.
test("capture /dev/ui in both themes", async ({ page }) => {
  await page.goto("/dev/ui");
  await page.waitForLoadState("networkidle");
  await page.screenshot({ path: "test-results/dev-ui-dark.png", fullPage: true });
  await page.getByRole("button", { name: /switch to light theme/i }).click();
  await page.screenshot({ path: "test-results/dev-ui-light.png", fullPage: true });
});
