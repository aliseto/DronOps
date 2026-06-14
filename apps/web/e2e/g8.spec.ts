import { test, expect } from "@playwright/test";

/**
 * G8 — the end-to-end story release gate (BUILD_PLAN §5 / UX_SYSTEM §15).
 * Runs only against a seeded database (CI Postgres job); the signed-in e2e
 * operator walks the compliance spine: the dashboard resolves their org and
 * surfaces real obligations, the Documents register shows the seeded
 * controlled document, and filing an occurrence persists and reads back.
 *
 * This asserts the full request path end to end — auth → org/person/role
 * resolution → cross-module reads → a domain write — so a regression in any
 * link fails the gate. Skipped without a data layer (the no-DB suites cover
 * the degrade-to-empty path instead).
 */
test.describe("G8 end-to-end story", () => {
  // Release gate runs only against the seeded CI Postgres job.
  test.skip(process.env.E2E_SEEDED !== "1", "requires the seeded database (CI Postgres job)");

  test("signed-in operator works the compliance spine on seeded data", async ({ page }) => {
    // 1) Dashboard resolves the seeded org and surfaces obligations — the
    //    in-review document is an approval obligation for the QM/AM operator,
    //    so the inbox is NOT the good-empty state.
    await page.goto("/dashboard");
    await expect(page.getByRole("heading", { name: "Dashboard" })).toBeVisible();
    await expect(page.getByRole("link", { name: /Approve SOP-001/ })).toBeVisible();
    await expect(page.getByText("Nothing needs your attention")).toHaveCount(0);

    // 2) The Documents register shows the seeded controlled document.
    await page.goto("/documents");
    await expect(page.getByText("E2E Operations Manual")).toBeVisible();
    await expect(page.getByText("SOP-001")).toBeVisible();

    // 3) File an occurrence (anyone may; no signature ceremony). The single
    //    seeded jurisdiction is auto-applied; the write persists and the
    //    detail page reads it back.
    await page.goto("/safety");
    await page.getByRole("button", { name: "+ File occurrence" }).click();
    await page.fill('input[name="occurredAt"]', "2026-06-13T09:14");
    await page.fill('input[name="title"]', "G8 story occurrence");
    await page.getByRole("button", { name: "File", exact: true }).click();
    await expect(page.getByText("G8 story occurrence")).toBeVisible();
    await expect(page).toHaveURL(/\/safety\/[0-9a-f-]+$/);
  });
});
