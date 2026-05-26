import { test, expect } from "@playwright/test";

test("variable set in cell 1 is accessible in cell 2", async ({ page }) => {
  await page.goto("/#/test/variables.ipynb");

  await expect(page.getByText("Variables Test")).toBeVisible();

  // All run buttons share the same disabled state while Pyodide initialises.
  const runButtons = page.getByRole("button", { name: "Run code" });
  await expect(runButtons.first()).toBeEnabled({ timeout: 90_000 });

  // Run cell 1 — sets `greeting`; no stdout output expected.
  await runButtons.nth(0).click();

  // Wait for Pyodide to return to idle before running the next cell.
  await expect(runButtons.nth(0)).toBeEnabled({ timeout: 15_000 });

  // Run cell 2 — prints `greeting`.
  await runButtons.nth(1).click();

  // The variable defined in cell 1 should be visible in cell 2's output.
  const consoleOutputs = page.locator("textarea.output-console");
  await expect(consoleOutputs.last()).toContainText("hello from cell one", {
    timeout: 15_000,
  });
});
