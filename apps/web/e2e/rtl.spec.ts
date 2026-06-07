import { test, expect } from "@playwright/test";

const baseURL = "http://localhost:3000";

// Arabic locale → RTL. Asserts dir switching on the standing review surface.
test("/dev/ui renders RTL under the Arabic locale", async ({ page, context }) => {
  await context.addCookies([{ name: "NEXT_LOCALE", value: "ar", url: baseURL }]);
  await page.goto("/dev/ui");
  await expect(page.locator("html")).toHaveAttribute("dir", "rtl");
  await expect(page.locator("html")).toHaveAttribute("lang", "ar");
  await expect(page.getByRole("heading", { name: "UI review surface" })).toBeVisible();
});

test("/dev/ui defaults to LTR English", async ({ page, context }) => {
  await context.clearCookies();
  await page.goto("/dev/ui");
  await expect(page.locator("html")).toHaveAttribute("dir", "ltr");
});
