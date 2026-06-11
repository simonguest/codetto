import { test, expect } from "@playwright/test";

test("scene3d on_key: dispatches key events to registered handlers", async ({ page }) => {
  await page.goto("/#/test/scene3d_key.ipynb");

  await expect(page.getByRole("button", { name: "Run code" })).toBeEnabled({
    timeout: 90_000,
  });

  await page.getByRole("button", { name: "Run code" }).click();

  // Wait for the scene canvas to appear
  await expect(page.locator(".canvas-output canvas").first()).toBeVisible({
    timeout: 30_000,
  });

  // Switch to stdout tab — the notebook prints "starting" before scene.run()
  // blocks, which ensures the tab is rendered by the time we click it.
  await page.locator('[value="stdout"]').last().click();
  const console_ = page.locator("textarea.output-console");
  await expect(console_).toHaveValue(/starting/, { timeout: 10_000 });

  // Wait until register_keys has completed — provider sets data-keys-ready on
  // the canvas after attaching the listener, giving us a precise sync point.
  await page.waitForFunction(
    () => (document.querySelector('canvas[tabindex="1"]') as HTMLElement)?.dataset?.keysReady === "true",
    { timeout: 10_000 }
  );

  // Dispatch keydown events directly on the canvas element. dispatchEvent fires
  // the listener regardless of element visibility, so the hidden canvas (behind
  // the stdout tab) still receives events correctly.
  const dispatch = (key: string) =>
    page.evaluate((k) => {
      const canvas = document.querySelector('canvas[tabindex="1"]') as HTMLElement;
      canvas?.dispatchEvent(new KeyboardEvent("keydown", { key: k, bubbles: true }));
    }, key);

  await dispatch("ArrowLeft");
  await expect(console_).toHaveValue(/key: left/, { timeout: 5_000 });

  await dispatch("ArrowRight");
  await expect(console_).toHaveValue(/key: right/, { timeout: 5_000 });

  await dispatch("ArrowUp");
  await expect(console_).toHaveValue(/key: up/, { timeout: 5_000 });

  await dispatch("ArrowDown");
  await expect(console_).toHaveValue(/key: down/, { timeout: 5_000 });

  await dispatch(" ");
  await expect(console_).toHaveValue(/key: space/, { timeout: 5_000 });

  await dispatch("w");
  await expect(console_).toHaveValue(/key: w/, { timeout: 5_000 });
});
