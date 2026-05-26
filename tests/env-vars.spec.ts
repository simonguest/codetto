import { test, expect } from "@playwright/test";

test("env var set in Settings is visible in os.environ", async ({ page }) => {
  // 1. Navigate to Settings and add the test variable.
  await page.goto("/#/settings");
  await expect(page.getByRole("heading", { name: "Settings" })).toBeVisible();

  await page.getByRole("button", { name: "Add Variable" }).click();
  await page.getByLabel("Name").fill("PLAYWRIGHT_TEST_VAR");
  await page.getByLabel("Value").fill("hello_from_settings");

  // The confirm button also reads "Add Variable" and appears once the form is open.
  await page.getByRole("button", { name: "Add Variable" }).click();

  // 2. Navigate to the test notebook and wait for Pyodide.
  //    PyodideProvider is persistent (lives in BaseLayout); on initialisation it
  //    calls sendEnvVars(), which picks up the var we just stored.
  await page.goto("/#/test/env-vars.ipynb");
  await expect(page.getByText("Env Vars Test")).toBeVisible();

  const runButton = page.getByRole("button", { name: "Run code" });
  await expect(runButton).toBeEnabled({ timeout: 90_000 });

  await runButton.click();

  const consoleOutput = page.locator("textarea.output-console");
  await expect(consoleOutput).toContainText("hello_from_settings", {
    timeout: 15_000,
  });

  // 3. Cleanup: go back to Settings and delete the var.
  await page.goto("/#/settings");
  const varItem = page
    .locator(".v-list-item")
    .filter({ hasText: "PLAYWRIGHT_TEST_VAR" });
  await varItem.getByText("Delete").click();

  // Confirm the variable no longer appears in the list.
  await expect(varItem).not.toBeVisible();
});
