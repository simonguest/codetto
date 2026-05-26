import { test, expect } from "@playwright/test";

test("switching locale to Japanese re-renders the notebooks index in Japanese", async ({
  page,
}) => {
  // 1. Verify the default English heading on the notebooks index.
  await page.goto("/#/notebooks");
  await expect(page.locator("h1")).toContainText("Notebooks");

  // 2. Switch locale to Japanese via the Settings page.
  await page.goto("/#/settings");
  await expect(page.getByRole("heading", { name: "Settings" })).toBeVisible();

  // Scope to the Language card and click the outer .v-field — clicking the
  // inner <input> is intercepted by Vuetify's field overlay.
  const languageCard = page.locator(".v-card").filter({ hasText: "Language" });
  await languageCard.locator(".v-field").click();
  await page.getByRole("option", { name: "日本語" }).click();

  // 3. Navigate to the notebooks index and verify Japanese labels.
  await page.goto("/#/notebooks");
  await expect(page.locator("h1")).toContainText("ノートブック");

  // The bottom-nav tab label should also be in Japanese.
  await expect(page.locator(".v-bottom-navigation")).toContainText(
    "ノートブック"
  );

  // 4. Cleanup: reset locale to English.
  //    Settings labels are now in Japanese, so the Language card title → 言語.
  await page.goto("/#/settings");
  const langCardJa = page.locator(".v-card").filter({ hasText: "言語" });
  await langCardJa.locator(".v-field").click();
  await page.getByRole("option", { name: "English (US)" }).click();

  // Confirm we're back to English.
  await page.goto("/#/notebooks");
  await expect(page.locator("h1")).toContainText("Notebooks");
});
