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

test("cv headless camera runs without canvas", async ({ page }) => {
  await page.goto("/#/test/cv_camera.ipynb");

  const runButtons = page.getByRole("button", { name: "Run code" });
  await expect(runButtons.first()).toBeEnabled({ timeout: 90_000 });

  await runButtons.first().click();

  // Headless camera prints confirmation and stops cleanly
  const stdoutTab = page.locator('[value="stdout"]').first();
  await stdoutTab.click();
  const console_ = page.locator("textarea.output-console").first();
  await expect(console_).toHaveValue(/Headless camera OK/, { timeout: 15_000 });
});

test("cv camera streams to canvas", async ({ page }) => {
  await page.goto("/#/test/cv_camera.ipynb");

  const runButtons = page.getByRole("button", { name: "Run code" });
  await expect(runButtons.nth(1)).toBeEnabled({ timeout: 90_000 });

  await runButtons.nth(1).click();

  // Camera stream renders into a canvas in the result area
  const canvas = page.locator(".canvas-output canvas");
  await expect(canvas).toBeVisible({ timeout: 30_000 });
});

test("cv face detection prints detection counts", async ({ page }) => {
  await page.goto("/#/test/cv_face.ipynb");

  const runButton = page.getByRole("button", { name: "Run code" });
  await expect(runButton).toBeEnabled({ timeout: 90_000 });

  await runButton.click();

  // Canvas appears once camera starts
  const canvas = page.locator(".canvas-output canvas");
  await expect(canvas).toBeVisible({ timeout: 30_000 });

  // Allow time for the MediaPipe model to load and run a few detections
  await page.waitForTimeout(8_000);

  // Switch to the stdout tab to see detection counts
  const stdoutTab = page.locator('[value="stdout"]').last();
  await stdoutTab.click();

  const console_ = page.locator("textarea.output-console");
  await expect(console_).toBeVisible({ timeout: 5_000 });
  const text = await console_.inputValue();
  expect(text).toContain("Faces detected:");

  const stopButton = page.getByRole("button", { name: "Stop code" });
  await stopButton.click();
  await expect(runButton).toBeEnabled({ timeout: 10_000 });
});
