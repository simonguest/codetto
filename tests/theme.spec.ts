import { test, expect } from "@playwright/test";

test("switching between light and dark themes is reflected in the UI", async ({
  page,
}) => {
  await page.goto("/#/settings");
  await expect(page.getByRole("heading", { name: "Settings" })).toBeVisible();

  // Scope to the Appearance card so we don't accidentally target another select.
  const appearanceCard = page.locator(".v-card").filter({ hasText: "Appearance" });
  const themeInput = appearanceCard.locator('input[role="combobox"]');

  // The app ships with dark as the default theme — check via input value.
  await expect(themeInput).toHaveValue("Dark");

  // Vuetify v-select: clicking the inner <input> is intercepted by the field
  // overlay; click the outer .v-field container to open the dropdown instead.
  await appearanceCard.locator(".v-field").click();
  await page.getByRole("option", { name: "Light" }).click();

  await expect(themeInput).toHaveValue("Light");
  const savedTheme = await page.evaluate(() => localStorage.getItem("theme"));
  expect(savedTheme).toBe("light");

  // Switch back to dark.
  await appearanceCard.locator(".v-field").click();
  await page.getByRole("option", { name: "Dark" }).click();

  await expect(themeInput).toHaveValue("Dark");
  const restoredTheme = await page.evaluate(() => localStorage.getItem("theme"));
  expect(restoredTheme).toBe("dark");
});
