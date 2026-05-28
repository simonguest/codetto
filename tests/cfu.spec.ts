import { test, expect } from "@playwright/test";

test.beforeEach(async ({ page }) => {
  await page.goto("/#/test/cfu.ipynb");
  // CFU cells don't need Pyodide — wait for the first card to be visible
  await expect(page.locator(".cfu-card").first()).toBeVisible();
});

test("renders all three question types", async ({ page }) => {
  await expect(
    page.getByText("In what year was Python created?")
  ).toBeVisible();
  await expect(
    page.getByText("Which of the following is not a Python package?")
  ).toBeVisible();
  await expect(
    page.getByText("Python source files are designated as .py")
  ).toBeVisible();
});

test("freeform: wrong answer shows incorrect feedback with correct answer", async ({
  page,
}) => {
  const card = page.locator(".cfu-card").first();
  await card.getByRole("textbox").fill("2001");
  await card.getByRole("button", { name: "Submit" }).click();
  await expect(card.getByText("Not quite.")).toBeVisible();
  await expect(card.getByText("1991")).toBeVisible();
});

test("freeform: correct answer shows success feedback", async ({ page }) => {
  const card = page.locator(".cfu-card").first();
  await card.getByRole("textbox").fill("1991");
  await card.getByRole("button", { name: "Submit" }).click();
  await expect(card.getByText("Correct!")).toBeVisible();
});

test("freeform: correct answer is case-insensitive", async ({ page }) => {
  const card = page.locator(".cfu-card").first();
  await card.getByRole("textbox").fill("  1991  ");
  await card.getByRole("button", { name: "Submit" }).click();
  await expect(card.getByText("Correct!")).toBeVisible();
});

test("freeform: reset clears submission and restores input", async ({
  page,
}) => {
  const card = page.locator(".cfu-card").first();
  await card.getByRole("textbox").fill("1991");
  await card.getByRole("button", { name: "Submit" }).click();
  await expect(card.getByText("Correct!")).toBeVisible();

  await card.getByRole("button", { name: "Try again" }).click();
  await expect(card.getByRole("textbox")).toBeVisible();
  await expect(card.getByRole("button", { name: "Submit" })).toBeVisible();
  await expect(card.getByText("Correct!")).not.toBeVisible();
});

test("multiple choice: correct option shows success feedback", async ({
  page,
}) => {
  const card = page.locator(".cfu-card").nth(1);
  await card.getByLabel("C. ubuntu").click();
  await card.getByRole("button", { name: "Submit" }).click();
  await expect(card.getByText("Correct!")).toBeVisible();
});

test("multiple choice: wrong option shows incorrect feedback with correct answer", async ({
  page,
}) => {
  const card = page.locator(".cfu-card").nth(1);
  await card.getByLabel("A. pandas").click();
  await card.getByRole("button", { name: "Submit" }).click();
  await expect(card.getByText("Not quite.")).toBeVisible();
  await expect(card.getByText("The correct answer is")).toBeVisible();
});

test("true/false: correct answer shows success feedback", async ({ page }) => {
  const card = page.locator(".cfu-card").nth(2);
  await card.getByLabel("True").click();
  await card.getByRole("button", { name: "Submit" }).click();
  await expect(card.getByText("Correct!")).toBeVisible();
});

test("true/false: wrong answer shows incorrect feedback", async ({ page }) => {
  const card = page.locator(".cfu-card").nth(2);
  await card.getByLabel("False").click();
  await card.getByRole("button", { name: "Submit" }).click();
  await expect(card.getByText("Not quite.")).toBeVisible();
  await expect(card.getByText("The correct answer is")).toBeVisible();
});

test("submit button is disabled until an answer is entered", async ({
  page,
}) => {
  const card = page.locator(".cfu-card").first();
  await expect(
    card.getByRole("button", { name: "Submit" })
  ).toBeDisabled();
  await card.getByRole("textbox").fill("anything");
  await expect(
    card.getByRole("button", { name: "Submit" })
  ).toBeEnabled();
});
