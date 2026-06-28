import { test, expect } from "@playwright/test";

test.beforeEach(async ({ page }) => {
  await page.goto("/#/test/autorun.ipynb", { waitUntil: "networkidle" });
  await expect(page.getByRole("button", { name: "Run code" }).first()).toBeEnabled({ timeout: 90_000 });
});

test("hidden autorun cell is absent from the DOM", async ({ page }) => {
  // 3 cells in notebook; the one tagged hidden must not appear — only 2 Run buttons
  await expect(page.getByRole("button", { name: "Run code" })).toHaveCount(2);
});

test("visible autorun cell runs automatically before user interaction", async ({ page }) => {
  // stdout tab auto-activates, so the textarea is already in the DOM with the output
  await expect(page.locator("textarea.output-console").first()).toHaveValue(/visible autorun ran/, { timeout: 15_000 });
});

test("hidden autorun cell sets state accessible to later cells", async ({ page }) => {
  // Run the normal cell (second Run button); it uses `greeting` set by the hidden autorun cell
  await page.getByRole("button", { name: "Run code" }).nth(1).click();
  // Wait for a second output console to appear (normal cell's stdout joins visible autorun's)
  await expect(page.locator("textarea.output-console")).toHaveCount(2, { timeout: 15_000 });
  await expect(page.locator("textarea.output-console").last()).toHaveValue(/hello from autorun/);
});
