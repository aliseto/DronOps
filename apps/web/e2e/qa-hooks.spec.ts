import { test, expect } from "@playwright/test";

// §15 release hooks that run without a data layer (the DB-backed hooks — G8
// story, gate-block + override-reason, row-level import errors — need the
// seeded e2e environment, flagged in BUILD_PLAN).

test("ceremony order: the meaning statement is shown before re-auth", async ({ page }) => {
  await page.goto("/dev/ui");
  await page.getByRole("button", { name: "Sign ceremony" }).click();
  // Meaning is visible immediately; signing stays disabled until re-auth input.
  const meaning = page.getByText("I approve revision 3 of the Operations Manual", { exact: false });
  await expect(meaning).toBeVisible();
  const password = page.getByLabel("Confirm your password");
  await expect(password).toBeVisible();
  // DOM order: the meaning statement precedes the re-auth field.
  const meaningBox = await meaning.boundingBox();
  const passwordBox = await password.boundingBox();
  expect(meaningBox!.y).toBeLessThan(passwordBox!.y);
  await expect(page.getByRole("button", { name: "Sign", exact: true })).toBeDisabled();
});

test("focus returns to the originating element on drawer close", async ({ page }) => {
  await page.goto("/dev/ui");
  const trigger = page.getByRole("button", { name: "Open drawer" });
  await trigger.click();
  await page.keyboard.press("Escape");
  await expect(trigger).toBeFocused();
});

test("documents filter persists in the URL across reload", async ({ page }) => {
  await page.goto("/documents");
  await page.getByRole("button", { name: "Manual", exact: true }).click();
  await expect(page).toHaveURL(/cat=manual/);
  await page.reload();
  // The pill stays selected after reload (filter state lives in the URL).
  await expect(page.getByRole("button", { name: "Manual", exact: true })).toHaveClass(/bg-selected/);
});

test("empty-state variants: filtered-empty offers clear filter", async ({ page }) => {
  await page.goto("/documents?cat=training");
  await expect(page.getByText("No results for this filter")).toBeVisible();
  await page.getByRole("button", { name: "Clear filter" }).click();
  await expect(page).not.toHaveURL(/cat=/);
  await expect(page.getByText("No documents yet")).toBeVisible();
});
