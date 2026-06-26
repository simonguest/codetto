import { test, expect } from '@playwright/test';

test('notebook files: add file, verify in Python, remove, verify gone', async ({ page }) => {
  await page.goto('/#/test/resources.ipynb?resources=true');

  const runButton = page.getByRole('button', { name: 'Run code' });
  await expect(runButton).toBeEnabled({ timeout: 90_000 });

  // Attach a plain-text file via the hidden file input
  await page.locator('input[type="file"]').setInputFiles({
    name: 'hello.txt',
    mimeType: 'text/plain',
    buffer: Buffer.from('hello world'),
  });

  // File should appear in the panel list
  await expect(page.locator('.resources-file-item')).toHaveCount(1);

  // Run the cell — /notebook_files should contain hello.txt
  await runButton.click();
  const stdout = page.locator('textarea.output-console');
  await expect(stdout).toBeVisible({ timeout: 15_000 });
  await expect(stdout).toHaveValue(/hello\.txt/);

  // Remove the file (close button inside the file item row)
  await page.locator('.resources-file-item button').click();
  await expect(page.locator('.resources-file-item')).toHaveCount(0);

  // Run again — /notebook_files should now be empty
  await runButton.click();
  await expect(stdout).toHaveValue(/\[\]/);
});
