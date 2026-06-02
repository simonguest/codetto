import { test, expect } from "@playwright/test";

test("scene3d: creates scene with canvas output", async ({ page }) => {
  await page.goto("/#/test/scene3d.ipynb");

  // Wait for Pyodide to be ready
  await expect(page.getByRole("button", { name: "Run code" })).toBeEnabled({
    timeout: 90_000,
  });

  await page.getByRole("button", { name: "Run code" }).click();

  // Canvas output should appear (create_scene sets the result immediately)
  const canvas = page.locator(".canvas-output canvas").first();
  await expect(canvas).toBeVisible({ timeout: 30_000 });

  // Switch to stdout tab and confirm the scene was created
  await page.locator('[value="stdout"]').last().click();
  const console_ = page.locator("textarea.output-console");
  await expect(console_).toBeVisible({ timeout: 5_000 });
  await expect(console_).toHaveValue("scene3d: scene created\n");
});
