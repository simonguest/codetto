import { test, expect } from "@playwright/test";

test("matplotlib renders a PNG image in the cell output", async ({ page }) => {
  await page.goto("/#/test/matplotlib.ipynb");

  await expect(page.getByText("Matplotlib Test")).toBeVisible();

  const runButton = page.getByRole("button", { name: "Run code" });
  await expect(runButton).toBeEnabled({ timeout: 90_000 });

  await runButton.click();

  // matplotlib (and numpy) are downloaded by Pyodide on first use — allow extra time.
  // plt.show() serialises the figure as a PNG and posts it back to the main thread,
  // which renders it as an <img> with a data:image/png base64 src.
  const plotImage = page.locator('img[src^="data:image/png"]');
  await expect(plotImage).toBeVisible({ timeout: 120_000 });
});
