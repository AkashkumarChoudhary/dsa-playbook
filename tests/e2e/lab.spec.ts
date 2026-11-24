import { expect, test, type Page } from '@playwright/test';

async function setCode(page: Page, code: string) {
  await page.locator('.cm-content').fill(code);
}

test.beforeEach(async ({ page }) => {
  await page.goto('./#/p/contains-duplicate');
});

test('the optimal solution passes every test in the browser', async ({ page }) => {
  await page.locator('details.approach[data-level="optimal"] > summary').click();
  await page.getByTestId('load-into-lab-optimal').click();
  await page.getByTestId('lab-submit').click();
  await expect(page.getByTestId('lab-status')).toContainText('All tests passed', { timeout: 90_000 });
});

test('a compile error shows its line', async ({ page }) => {
  await setCode(page, 'class Solution {\n    public boolean containsDuplicate(int[] nums) {\n        int x = 1 +;\n        return false;\n    }\n}\n');
  await page.getByTestId('lab-run').click();
  await expect(page.getByTestId('lab-results')).toContainText('Line 3', { timeout: 90_000 });
});

test('an endless loop is stopped by the time limit', async ({ page }) => {
  await setCode(page, 'class Solution {\n    public boolean containsDuplicate(int[] nums) {\n        while (true) { }\n    }\n}\n');
  await page.getByTestId('lab-run').click();
  await expect(page.getByTestId('lab-status')).toContainText('ran too long', { timeout: 90_000 });
  await expect(page.getByTestId('lab-results')).toContainText('Did not finish in time');
});

test('a wrong answer shows expected and got', async ({ page }) => {
  await setCode(page, 'class Solution {\n    public boolean containsDuplicate(int[] nums) {\n        return false;\n    }\n}\n');
  await page.getByTestId('lab-run').click();
  const failing = page.locator('[data-testid="test-row"][data-pass="false"]').first();
  await expect(failing).toContainText('Expected', { timeout: 90_000 });
  await expect(failing).toContainText('true');
});
