import { test, expect } from "@playwright/test";

test("python-chess board is rendered as an SVG image", async ({ page }) => {
  await page.goto("/#/test/chess.ipynb");

  await expect(page.getByText("Chess Test")).toBeVisible();

  // chess is loaded from a bundled .whl file — wait for Pyodide to be ready.
  const runButton = page.getByRole("button", { name: "Run code" });
  await expect(runButton).toBeEnabled({ timeout: 90_000 });

  await runButton.click();

  // chess.Board().__repr_svg_() returns an SVG string, which is posted back
  // from the worker as { "image/svg+xml": svg } and rendered via ImageSvg.vue
  // as an <img> with a data:image/svg+xml src.
  const boardImage = page.locator('img[src^="data:image/svg+xml"]');
  await expect(boardImage).toBeVisible({ timeout: 30_000 });
});
