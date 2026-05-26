import { test, expect } from "@playwright/test";

test("pandas DataFrame is rendered as an HTML table", async ({ page }) => {
  await page.goto("/#/test/pandas.ipynb");

  await expect(page.getByText("Pandas Test")).toBeVisible();

  const runButton = page.getByRole("button", { name: "Run code" });
  await expect(runButton).toBeEnabled({ timeout: 90_000 });

  await runButton.click();

  // pandas is downloaded by Pyodide on first use — allow extra time.
  // A DataFrame displayed as the last expression in a cell is rendered as
  // an HTML table inside a .html-output div.
  const table = page.locator("div.html-output table");
  await expect(table).toBeVisible({ timeout: 120_000 });

  // Spot-check a few expected cell values from the fixture data.
  await expect(table).toContainText("Alice");
  await expect(table).toContainText("Los Angeles");
  await expect(table).toContainText("Chicago");
});
