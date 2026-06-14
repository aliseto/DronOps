import { test, expect } from "@playwright/test";

// §15 release hook: offline queue visibility. An occurrence filed offline
// queues on the device (visible + inspectable, capture time shown) instead of
// failing; reconnecting flips the banner to syncing. The sync itself needs the
// data layer, so this smoke asserts the queue UX, not the server write.
test("occurrence filed offline is queued and visible", async ({ page, context }) => {
  await page.goto("/safety");
  await page.getByRole("button", { name: "+ File occurrence" }).click();

  await context.setOffline(true);
  await page.fill('input[name="occurredAt"]', "2026-06-11T09:14");
  await page.fill('input[name="title"]', "Offline prop strike");
  await page.getByRole("button", { name: "File", exact: true }).click();

  const banner = page.getByTestId("offline-banner");
  await expect(banner).toContainText("Offline — 1 item queued");
  await banner.getByRole("button", { name: "View queue" }).click();
  const queue = page.getByTestId("offline-queue");
  await expect(queue).toContainText("Offline prop strike");
  await expect(queue).toContainText("captured");

  await context.setOffline(false);
  // Replay fires on reconnect; without a DB the item stays queued (retry
  // pending) — visible either way, never silently dropped.
  await expect(page.getByTestId("offline-banner")).toBeVisible();
});
