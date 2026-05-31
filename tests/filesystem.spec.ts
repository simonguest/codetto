import { test, expect } from "@playwright/test";

test("sample_files are mounted and cat image displays on canvas", async ({ page }) => {
  await page.goto("/#/test/filesystem.ipynb");

  const runButtons = page.getByRole("button", { name: "Run code" });
  await expect(runButtons.first()).toBeEnabled({ timeout: 90_000 });

  // Cell 1: list files
  await runButtons.first().click();

  const stdoutTab = page.locator('[value="stdout"]').first();
  await stdoutTab.click();
  const console1 = page.locator("textarea.output-console").first();
  await expect(console1).toHaveValue(/Listing OK/, { timeout: 15_000 });

  // Cell 2: draw image onto canvas
  await expect(runButtons.nth(1)).toBeEnabled({ timeout: 10_000 });
  await runButtons.nth(1).click();

  const canvas = page.locator(".canvas-output canvas").first();
  await expect(canvas).toBeVisible({ timeout: 15_000 });

  // Wait for cell 2 to finish before checking stdout (canvas appears before draw_image completes)
  await expect(runButtons.nth(1)).toBeEnabled({ timeout: 15_000 });

  const stdoutTab2 = page.locator('[value="stdout"]').last();
  await stdoutTab2.click();
  const console2 = page.locator("textarea.output-console").last();
  await expect(console2).toHaveValue(/Image displayed OK/, { timeout: 15_000 });
});
