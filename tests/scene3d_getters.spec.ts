import { test, expect } from "@playwright/test";

test("scene3d getters: position, rotation, scale, color before and after add", async ({ page }) => {
  await page.goto("/#/test/scene3d_getters.ipynb");

  await expect(page.getByRole("button", { name: "Run code" })).toBeEnabled({
    timeout: 90_000,
  });

  await page.getByRole("button", { name: "Run code" }).click();

  // Canvas output should appear when the scene is created
  const canvas = page.locator(".canvas-output canvas").first();
  await expect(canvas).toBeVisible({ timeout: 30_000 });

  // Switch to stdout and verify every assertion passed
  await page.locator('[value="stdout"]').last().click();
  const console_ = page.locator("textarea.output-console");
  await expect(console_).toBeVisible({ timeout: 5_000 });

  await expect(console_).toHaveValue(/ok: get_position before add/);
  await expect(console_).toHaveValue(/ok: get_rotation before add/);
  await expect(console_).toHaveValue(/ok: get_scale before add/);
  await expect(console_).toHaveValue(/ok: get_color before add/);
  await expect(console_).toHaveValue(/ok: get_position after add/);
  await expect(console_).toHaveValue(/ok: get_rotation after add/);
  await expect(console_).toHaveValue(/ok: get_position after set post-add/);
  await expect(console_).toHaveValue(/ok: get_rotation after set post-add/);
  await expect(console_).toHaveValue(/ok: get_scale after set post-add/);
  await expect(console_).toHaveValue(/ok: get_color after set post-add/);
  await expect(console_).toHaveValue(/scene3d getters: all ok/);
});
