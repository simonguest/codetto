import { test, expect } from "@playwright/test";

test("sklearn dataset renders as a matplotlib PNG image", async ({ page }) => {
  await page.goto("/#/test/sklearn.ipynb");

  await expect(page.getByText("sklearn Test")).toBeVisible();

  const runButton = page.getByRole("button", { name: "Run code" });
  await expect(runButton).toBeEnabled({ timeout: 90_000 });

  await runButton.click();

  // sklearn and matplotlib are both downloaded by Pyodide on first use.
  // Allow generous time for package loading + execution.
  const plotImage = page.locator('img[src^="data:image/png"]');
  await expect(plotImage).toBeVisible({ timeout: 120_000 });
});
