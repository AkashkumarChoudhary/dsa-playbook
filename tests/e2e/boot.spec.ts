import { expect, test } from '@playwright/test';

test('the site boots', async ({ page }) => {
  await page.goto('./');
  await expect(page.locator('h1').first()).toBeVisible();
  await expect(page).toHaveTitle(/DSA Playbook/);
});
