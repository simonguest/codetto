import { test, expect } from "@playwright/test";

// Note: This test relies on SharedArrayBuffer being available in the browser
// (required for Pyodide interrupt support). The dev server sets the necessary
// COOP/COEP headers, so interrupts should work in both local and CI runs.
test("running cell can be interrupted with the Stop button", async ({
  page,
}) => {
  await page.goto("/#/test/interrupt.ipynb");

  await expect(page.getByText("Interrupt Test")).toBeVisible();

  const runButton = page.getByRole("button", { name: "Run code" });
  await expect(runButton).toBeEnabled({ timeout: 90_000 });

  await runButton.click();

  // Wait for at least the first iteration to print so we know the cell is running.
  const consoleOutput = page.locator("textarea.output-console");
  await expect(consoleOutput).toContainText("1", { timeout: 15_000 });

  // Click the Stop button to interrupt the running cell.
  const stopButton = page.getByRole("button", { name: "Stop code" });
  await expect(stopButton).toBeEnabled();
  await stopButton.click();

  // After the interrupt the run button should become enabled again,
  // indicating Pyodide has returned to idle.
  await expect(runButton).toBeEnabled({ timeout: 15_000 });

  // The loop printed at most a few numbers — "done" should NOT appear because
  // the cell was interrupted before completing all 10 iterations.
  await expect(consoleOutput).not.toContainText("done");
});
