import { test, expect } from "@playwright/test";

test("graphics canvas renders and drawing methods run without error", async ({ page }) => {
  await page.goto("/#/test/graphics_canvas.ipynb");

  const runButton = page.getByRole("button", { name: "Run code" });
  await expect(runButton).toBeEnabled({ timeout: 90_000 });

  await runButton.click();

  // Canvas element should appear in the result area
  const canvas = page.locator(".canvas-output canvas");
  await expect(canvas).toBeVisible({ timeout: 15_000 });

  // Stdout tab should show the confirmation print
  const stdoutTab = page.locator('[value="stdout"]').last();
  await stdoutTab.click();

  const console_ = page.locator("textarea.output-console");
  await expect(console_).toBeVisible({ timeout: 5_000 });
  await expect(console_).toHaveValue("Canvas drawing OK\n");
});
