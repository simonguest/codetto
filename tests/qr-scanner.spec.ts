import { test, expect } from "@playwright/test";

test.use({
  launchOptions: {
    args: [
      "--use-fake-device-for-media-stream",
      "--use-fake-ui-for-media-stream",
    ],
  },
  permissions: ["camera"],
});

test("QR scanner dialog opens, activates camera, and closes on cancel", async ({
  page,
}) => {
  await page.goto("/#/settings");
  await expect(page.getByRole("heading", { name: "Settings" })).toBeVisible();

  await page.getByRole("button", { name: "Scan QR Code" }).click();

  // Hint text is unique to the dialog — confirms it opened
  await expect(
    page.getByText("Point your camera at a QR code containing KEY=VALUE")
  ).toBeVisible();

  // Video element visible and camera streaming
  const video = page.locator(".v-overlay--active video");
  await expect(video).toBeVisible({ timeout: 5_000 });

  // Dismiss the dialog
  await page.getByRole("button", { name: "Cancel" }).click();
  await expect(page.locator(".v-overlay--active video")).not.toBeVisible();
});
