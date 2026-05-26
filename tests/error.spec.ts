import { test, expect } from "@playwright/test";

test("Python error is captured and displayed in the cell output", async ({
  page,
}) => {
  await page.goto("/#/test/error.ipynb");

  await expect(page.getByText("Error Test")).toBeVisible();

  const runButton = page.getByRole("button", { name: "Run code" });
  await expect(runButton).toBeEnabled({ timeout: 90_000 });

  await runButton.click();

  // The worker catches the exception, serialises it as a string, and the
  // main thread stores it via notebookStore.setError(). Error.vue renders
  // it in a <pre class="output-error"> coloured red.
  const errorOutput = page.locator("pre.output-error");
  await expect(errorOutput).toBeVisible({ timeout: 15_000 });
  await expect(errorOutput).toContainText("ZeroDivisionError");
});
