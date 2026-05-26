import { test, expect } from "@playwright/test";

test("student can enter and save a journal note", async ({ page }) => {
  await page.goto("/#/test/journal.ipynb");

  await expect(page.getByText("Journal Test")).toBeVisible();

  // The empty journal cell shows a placeholder until the student clicks in.
  const journalCard = page.locator(".journal-card");
  await expect(journalCard).toBeVisible();
  await expect(
    page.getByText("Double-click to write your thoughts...")
  ).toBeVisible();

  // Double-clicking the card enters edit mode and auto-focuses the textarea.
  await journalCard.dblclick();

  // Type a note into the now-visible textarea.
  // Vuetify's v-textarea renders two <textarea> elements: the real editable
  // one and a hidden auto-grow sizer (aria-hidden="true"). Filter to the
  // interactive one only.
  const journalTextarea = page.locator(
    ".journal-textarea textarea:not([aria-hidden])"
  );
  await expect(journalTextarea).toBeVisible();
  await journalTextarea.fill("My test journal entry");

  // Clicking Close saves the content back to the store and exits edit mode.
  await page.getByRole("button", { name: "Close" }).click();

  // The typed text should now be rendered as markdown in the journal body.
  await expect(
    page.locator(".journal-text.markdown-content")
  ).toContainText("My test journal entry");
});
