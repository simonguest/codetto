import { test, expect } from "@playwright/test";

test("scene3d materials: sky env, ground material, mesh PBR, glossiness, tiling", async ({ page }) => {
  await page.goto("/#/test/scene3d_materials.ipynb");

  await expect(page.getByRole("button", { name: "Run code" })).toBeEnabled({
    timeout: 90_000,
  });

  await page.getByRole("button", { name: "Run code" }).click();

  // Canvas output should appear when the scene is created
  const canvas = page.locator(".canvas-output canvas").first();
  await expect(canvas).toBeVisible({ timeout: 30_000 });

  // Switch to stdout and verify every step completed without error.
  // If any bridge call threw, Python would have raised before the final print.
  await page.locator('[value="stdout"]').last().click();
  const console_ = page.locator("textarea.output-console");
  await expect(console_).toBeVisible({ timeout: 5_000 });
  await expect(console_).toHaveValue(/ok: sky env/);
  await expect(console_).toHaveValue(/ok: ground material \+ tiling/);
  await expect(console_).toHaveValue(/ok: box pbr pre-add/);
  await expect(console_).toHaveValue(/ok: sphere simple material post-add/);
  await expect(console_).toHaveValue(/ok: cylinder material \+ glossiness \+ tiling/);
  await expect(console_).toHaveValue(/ok: material replacement post-add/);
  await expect(console_).toHaveValue(/ok: tiling persists across material replacement/);
  await expect(console_).toHaveValue(/ok: sky switched to flat colour/);
  await expect(console_).toHaveValue(/scene3d materials: all ok/);
});
