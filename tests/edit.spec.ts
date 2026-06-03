import { test, expect } from "@playwright/test";

// 3 cells in the fixture: 2 markdown + 1 CFU
const CELL_COUNT = 3;
const MARKDOWN_COUNT = 2;

test.beforeEach(async ({ page }) => {
  await page.goto("/#/test/edit.ipynb?edit=true", { waitUntil: "networkidle" });
  // Edit mode is active when cell toolbars are visible
  await expect(page.locator(".cell-toolbar").first()).toBeVisible();
});

test("cell controls and insert bars are visible in edit mode", async ({ page }) => {
  await expect(page.locator(".cell-toolbar")).toHaveCount(CELL_COUNT);
  // 1 insert bar before all cells + 1 after each cell
  await expect(page.locator(".insert-bar")).toHaveCount(CELL_COUNT + 1);
});

test("edit mode is off by default (no edit=true param)", async ({ page }) => {
  await page.goto("/#/test/edit.ipynb", { waitUntil: "networkidle" });
  await expect(page.locator(".cell-toolbar")).toHaveCount(0);
  await expect(page.locator(".insert-bar")).toHaveCount(0);
});

test("insert markdown cell via top insert bar", async ({ page }) => {
  // Click the very first insert bar (inserts before all cells)
  await page.locator(".insert-bar").first().getByRole("button").click();
  await page.getByText("Markdown").click();
  await expect(page.locator(".markdown-content")).toHaveCount(MARKDOWN_COUNT + 1);
  await expect(page.locator(".cell-toolbar")).toHaveCount(CELL_COUNT + 1);
});

test("insert code cell via bottom insert bar", async ({ page }) => {
  // Click the last insert bar (after all cells)
  await page.locator(".insert-bar").last().getByRole("button").click();
  await page.getByText("Code").click();
  await expect(page.locator(".cell-toolbar")).toHaveCount(CELL_COUNT + 1);
});

test("insert CFU cell", async ({ page }) => {
  await page.locator(".insert-bar").last().getByRole("button").click();
  await page.getByText("Check for Understanding").click();
  await expect(page.locator(".cfu-card")).toHaveCount(2);
});

test("delete: cancel keeps the cell", async ({ page }) => {
  // Click delete on the first cell's toolbar
  await page.locator(".cell-toolbar").first().locator("button").last().click();
  await expect(page.getByText("Delete cell?")).toBeVisible();
  await page.getByRole("button", { name: "Cancel" }).click();
  await expect(page.getByText("Delete cell?")).not.toBeVisible();
  await expect(page.locator(".cell-toolbar")).toHaveCount(CELL_COUNT);
});

test("delete: confirm removes the cell", async ({ page }) => {
  // Delete the CFU cell (last toolbar)
  await page.locator(".cell-toolbar").last().locator("button").last().click();
  await page.getByRole("button", { name: "Delete" }).click();
  await expect(page.locator(".cfu-card")).toHaveCount(0);
  await expect(page.locator(".cell-toolbar")).toHaveCount(CELL_COUNT - 1);
});

test("move cell down reorders cells", async ({ page }) => {
  // Initially: cell 0 = "Edit Mode Test" (h1), cell 1 = "Second cell."
  await expect(page.locator(".markdown-content").first()).toContainText("Edit Mode Test");

  // Click the down arrow (second button) in the first cell's toolbar
  await page.locator(".cell-toolbar").first().locator("button").nth(1).click();

  // Cell 0 should now be "Second cell."
  await expect(page.locator(".markdown-content").first()).toContainText("Second cell.");
  await expect(page.locator(".markdown-content").nth(1)).toContainText("Edit Mode Test");
});

test("move cell up reorders cells", async ({ page }) => {
  // Initially: cell 1 = "Second cell."
  await expect(page.locator(".markdown-content").nth(1)).toContainText("Second cell.");

  // Click the up arrow (first button) in the second cell's toolbar
  await page.locator(".cell-toolbar").nth(1).locator("button").first().click();

  // "Second cell." should now be first
  await expect(page.locator(".markdown-content").first()).toContainText("Second cell.");
});

test("up button is disabled for the first cell", async ({ page }) => {
  const upBtn = page.locator(".cell-toolbar").first().locator("button").first();
  await expect(upBtn).toBeDisabled();
});

test("down button is disabled for the last cell", async ({ page }) => {
  const downBtn = page.locator(".cell-toolbar").last().locator("button").nth(1);
  await expect(downBtn).toBeDisabled();
});

test("double-click markdown cell opens editor and saves on close", async ({ page }) => {
  // Double-click the second markdown cell ("Second cell.")
  await page.locator(".markdown-editable").nth(1).dblclick();

  // Textarea should appear (Vuetify renders two textareas; target the interactive one)
  const textarea = page.locator("textarea:not([aria-hidden])").first();
  await expect(textarea).toBeVisible();

  // Replace content
  await textarea.fill("Updated content.");
  await page.getByRole("button", { name: "Close" }).click();

  // Updated text should be rendered as markdown
  await expect(page.locator(".markdown-content").nth(1)).toContainText("Updated content.");
});

test("pencil icon on markdown cell opens editor", async ({ page }) => {
  // Hover to reveal the pencil icon, then click it
  await page.locator(".markdown-editable").first().hover();
  await page.locator(".markdown-edit-icon").first().click();

  const textarea = page.locator("textarea:not([aria-hidden])").first();
  await expect(textarea).toBeVisible();

  await page.getByRole("button", { name: "Close" }).click();
  await expect(textarea).not.toBeVisible();
});

test("CFU pencil icon opens JSON editor and closes cleanly", async ({ page }) => {
  // Hover to reveal the edit icon on the CFU card
  await page.locator(".cfu-card").hover();
  await page.locator(".cfu-edit-icon").click();

  // JSON textarea should appear
  const jsonTextarea = page.locator(".cfu-json-editor textarea:not([aria-hidden])");
  await expect(jsonTextarea).toBeVisible();
  await expect(jsonTextarea).toHaveValue(/What is 2\+2\?/);

  // Close and verify the CFU widget re-renders with no error
  await page.getByRole("button", { name: "Close" }).click();
  await expect(jsonTextarea).not.toBeVisible();
  await expect(page.locator(".cfu-card")).toBeVisible();
  await expect(page.getByText("What is 2+2?")).toBeVisible();
});

test("editing CFU JSON updates the rendered question", async ({ page }) => {
  await page.locator(".cfu-card").hover();
  await page.locator(".cfu-edit-icon").click();

  const jsonTextarea = page.locator(".cfu-json-editor textarea:not([aria-hidden])");
  await jsonTextarea.fill(
    JSON.stringify({ question_type: "freeform", question: "What is 3+3?", answer: "6" }, null, 2)
  );

  await page.getByRole("button", { name: "Close" }).click();
  await expect(page.getByText("What is 3+3?")).toBeVisible();
});
