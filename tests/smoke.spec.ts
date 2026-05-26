import { test, expect } from "@playwright/test";

test("Pyodide initialises and executes a print statement", async ({ page }) => {
  await page.goto("/#/test/smoke.ipynb");

  // Notebook title should be visible once the JSON is fetched and rendered
  await expect(page.getByText("Smoke Test")).toBeVisible();

  // The run button is disabled while Pyodide is loading; wait for it to become enabled.
  // This implicitly waits for the worker to reach "ready" status.
  const runButton = page.getByRole("button", { name: "Run code" });
  await expect(runButton).toBeEnabled({ timeout: 90_000 });

  // Execute the cell
  await runButton.click();

  // The code cell outputs to the console tab (textarea.output-console).
  // Wait for the expected output to appear.
  const consoleOutput = page.locator("textarea.output-console");
  await expect(consoleOutput).toContainText("hello from pyodide");
});
