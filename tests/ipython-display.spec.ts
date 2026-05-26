import { test, expect } from "@playwright/test";

test("IPython.display.display() renders a PIL image as a PNG", async ({
  page,
}) => {
  await page.goto("/#/test/ipython-display.ipynb");

  await expect(page.getByText("IPython Display Test")).toBeVisible();

  const runButton = page.getByRole("button", { name: "Run code" });
  await expect(runButton).toBeEnabled({ timeout: 90_000 });

  await runButton.click();

  // pillow (PIL) is downloaded by Pyodide on first use.
  // The IPython.display stub in python_init.py detects _repr_png_() and
  // forwards the base64-encoded PNG to the main thread via js.imageBase64().
  const displayedImage = page.locator('img[src^="data:image/png"]');
  await expect(displayedImage).toBeVisible({ timeout: 60_000 });
});
