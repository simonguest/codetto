import { test, expect } from "@playwright/test";

test("word2vec trains and renders a PCA plot", async ({ page }) => {
  await page.goto("/#/test/word2vec.ipynb");

  await expect(page.getByRole("heading", { name: "Word2Vec" })).toBeVisible();

  const runButton = page.getByRole("button", { name: "Run code" });
  await expect(runButton).toBeEnabled({ timeout: 90_000 });

  await runButton.click();

  // numpy, scikit-learn, and matplotlib are downloaded by Pyodide on first use.
  // Training 300 epochs also takes a moment — allow generous time.
  const plotImage = page.locator('img[src^="data:image/png"]');
  await expect(plotImage).toBeVisible({ timeout: 120_000 });
});
