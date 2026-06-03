import { test, expect } from "@playwright/test";

test.beforeEach(async ({ page }) => {
  await page.goto("/#/notebooks", { waitUntil: "networkidle" });
  await page.getByRole("button", { name: "Add" }).click();
  await page.getByText("New Notebook").click();
  await expect(page.getByLabel("Notebook name")).toBeVisible();
});

test("create button is disabled when name is empty", async ({ page }) => {
  await expect(page.getByRole("button", { name: "Create" })).toBeDisabled();
});

test("creates notebook and opens it in edit mode with title as heading", async ({ page }) => {
  await page.getByLabel("Notebook name").fill("My Test Notebook");
  await page.getByRole("button", { name: "Create" }).click();

  // Should navigate to the notebook view in edit mode
  await expect(page).toHaveURL(/\/notebooks\/.+/);
  await expect(page).toHaveURL(/edit=true/);

  // The starter markdown cell should render the title as an h1
  await expect(page.locator(".markdown-content h1")).toContainText("My Test Notebook");

  // Edit mode controls should be active
  await expect(page.locator(".cell-toolbar")).toBeVisible();
  await expect(page.locator(".insert-bar").first()).toBeVisible();
});

test("enter key in name field submits the dialog", async ({ page }) => {
  await page.getByLabel("Notebook name").fill("Keyboard Notebook");
  await page.getByLabel("Notebook name").press("Enter");

  await expect(page).toHaveURL(/\/notebooks\/.+/);
  await expect(page).toHaveURL(/edit=true/);
  await expect(page.locator(".markdown-content h1")).toContainText("Keyboard Notebook");
});
