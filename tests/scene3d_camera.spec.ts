import { test, expect } from "@playwright/test";

test("scene3d camera: set_position, move, look_at, set_distance, follow, reset", async ({ page }) => {
  await page.goto("/#/test/scene3d_camera.ipynb");

  await expect(page.getByRole("button", { name: "Run code" })).toBeEnabled({
    timeout: 90_000,
  });

  await page.getByRole("button", { name: "Run code" }).click();

  // Canvas output should appear when the scene is created
  const canvas = page.locator(".canvas-output canvas").first();
  await expect(canvas).toBeVisible({ timeout: 30_000 });

  // Switch to stdout and verify every method completed without error
  await page.locator('[value="stdout"]').last().click();
  const console_ = page.locator("textarea.output-console");
  await expect(console_).toBeVisible({ timeout: 5_000 });

  await expect(console_).toHaveValue(/ok: camera property exists/);
  await expect(console_).toHaveValue(/ok: set_position/);
  await expect(console_).toHaveValue(/ok: move/);
  await expect(console_).toHaveValue(/ok: look_at coordinates/);
  await expect(console_).toHaveValue(/ok: look_at mesh/);
  await expect(console_).toHaveValue(/ok: set_distance/);
  await expect(console_).toHaveValue(/ok: follow/);
  await expect(console_).toHaveValue(/ok: follow None \(stop\)/);
  await expect(console_).toHaveValue(/ok: reset/);
  await expect(console_).toHaveValue(/ok: method chaining/);
  await expect(console_).toHaveValue(/scene3d camera: all ok/);
});
