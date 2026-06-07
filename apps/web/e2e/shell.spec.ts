import { test, expect } from "@playwright/test";

test("app shell renders nav and navigates between modules", async ({ page }) => {
  await page.goto("/dashboard");

  const nav = page.getByRole("navigation", { name: "Primary" });
  await expect(nav).toBeVisible();
  await expect(page.getByRole("heading", { name: "Dashboard" })).toBeVisible();

  // StatusPill showcase renders (single status source).
  await expect(page.getByText("Sealed")).toBeVisible();

  // Navigate to a module via the rail.
  await nav.getByRole("link", { name: "Fleet" }).click();
  await expect(page).toHaveURL(/\/fleet$/);
  await expect(page.getByRole("heading", { name: "Fleet" })).toBeVisible();
});

test("nav rail collapse persists across reloads", async ({ page }) => {
  await page.goto("/dashboard");
  await page.getByRole("button", { name: "Collapse navigation" }).click();
  await page.reload();
  await expect(page.getByRole("button", { name: "Expand navigation" })).toBeVisible();
});
