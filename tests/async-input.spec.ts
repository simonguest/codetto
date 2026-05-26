import { test, expect } from "@playwright/test";

test("input() suspends execution and resumes with user-provided value", async ({
  page,
}) => {
  await page.goto("/#/test/async-input.ipynb");

  await expect(page.getByText("Async Input Test")).toBeVisible();

  const runButton = page.getByRole("button", { name: "Run code" });
  await expect(runButton).toBeEnabled({ timeout: 90_000 });

  await runButton.click();

  // The input() call should open a dialog whose title reflects the prompt string.
  // Pyodide's async input shim suspends execution and raises a dialog.
  const dialog = page.locator(".v-dialog:visible");
  await expect(dialog).toBeVisible({ timeout: 15_000 });

  // The card title shows the prompt text passed to input()
  await expect(dialog.getByText("What is your age?")).toBeVisible();

  // Type a value into the text field and submit
  await dialog.getByLabel("Input").fill("25");
  await dialog.getByRole("button", { name: "Submit" }).click();

  // Execution resumes and prints the result
  const consoleOutput = page.locator("textarea.output-console");
  await expect(consoleOutput).toContainText("You are 25 years old.", {
    timeout: 15_000,
  });
});
