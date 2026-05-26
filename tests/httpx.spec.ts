import { test, expect } from "@playwright/test";

test("httpx can make an HTTP GET request from within Pyodide", async ({
  page,
}) => {
  await page.goto("/#/test/httpx.ipynb");

  await expect(page.getByText("httpx Test")).toBeVisible();

  const runButton = page.getByRole("button", { name: "Run code" });
  await expect(runButton).toBeEnabled({ timeout: 90_000 });

  await runButton.click();

  // httpx must be downloaded and installed by Pyodide before first use,
  // so allow extra time for the network round-trip as well.
  const consoleOutput = page.locator("textarea.output-console");

  // The cell prints type(response).__name__ — should be "Response"
  await expect(consoleOutput).toContainText("Response", { timeout: 60_000 });

  // And the HTTP status code — GitHub's /zen endpoint reliably returns 200
  await expect(consoleOutput).toContainText("200");
});
