import { test, expect } from "@playwright/test";

test("pygame renders a static frame as a PNG image", async ({ page }) => {
  await page.goto("/#/test/pygame.ipynb");

  await expect(page.getByText("pygame Test")).toBeVisible();

  const runButton = page.getByRole("button", { name: "Run code" });
  await expect(runButton).toBeEnabled({ timeout: 90_000 });

  await runButton.click();

  // pygame-ce (and pillow, which the override depends on) are downloaded by
  // Pyodide on first use. pygame.display.flip() calls js.imageBase64() via
  // the custom display override, which posts the frame back as a PNG.
  const frameImage = page.locator('img[src^="data:image/png"]');
  await expect(frameImage).toBeVisible({ timeout: 120_000 });
});
