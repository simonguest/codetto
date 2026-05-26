import { test, expect } from "@playwright/test";

// Parameter widgets are rendered from the cell source as soon as the notebook
// loads — no need to wait for Pyodide or run the cell.
test("#@param annotations render as interactive widgets", async ({ page }) => {
  await page.goto("/#/test/parameters.ipynb");

  await expect(page.getByText("Parameters Test")).toBeVisible();

  const controls = page.locator(".parameter-controls");
  await expect(controls).toBeVisible();

  // Plain-value params render as labelled text fields.
  await expect(controls.getByLabel("Age")).toBeVisible();
  await expect(controls.getByLabel("Name")).toBeVisible();

  // Slider params render as a v-slider inside a labelled container.
  await expect(controls.locator(".v-slider")).toBeVisible();

  // Dropdown params render as a v-select.
  await expect(controls.getByLabel("Size")).toBeVisible();

  // Boolean params render as a v-switch.
  await expect(controls.locator(".v-switch")).toBeVisible();
});
