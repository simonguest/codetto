import { test, expect } from "@playwright/test";

test("scene3d import_meshes: dicts, model_dump(), bad material, unknown type", async ({ page }) => {
  await page.goto("/#/test/scene3d_import.ipynb");

  await expect(page.getByRole("button", { name: "Run code" })).toBeEnabled({
    timeout: 90_000,
  });

  await page.getByRole("button", { name: "Run code" }).click();

  // Canvas output should appear when the scene is created
  const canvas = page.locator(".canvas-output canvas").first();
  await expect(canvas).toBeVisible({ timeout: 30_000 });

  // Verify each step completed — any bridge or import failure would stop
  // Python before the next print, making the assertion fail with a clear signal.
  await page.locator('[value="stdout"]').last().click();
  const console_ = page.locator("textarea.output-console");
  await expect(console_).toBeVisible({ timeout: 5_000 });
  await expect(console_).toHaveValue(/ok: dict meshes imported/);
  await expect(console_).toHaveValue(/ok: model_dump\(\) path works/);
  await expect(console_).toHaveValue(/ok: bad material string skipped gracefully/);
  await expect(console_).toHaveValue(/scene3d import_meshes: all ok/);
});
