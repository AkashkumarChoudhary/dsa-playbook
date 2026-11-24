import { expect, test } from '@playwright/test';

test('every route opens with no console errors', async ({ page }) => {
  const errors: string[] = [];
  page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
  page.on('pageerror', (e) => errors.push(e.message));
  await page.goto('./');
  const routes = await page.evaluate(() => window.__dsa?.routes ?? []);
  expect(routes.length).toBeGreaterThan(3);
  for (const r of routes) {
    await page.goto(`./${r}`);
    await expect(page.locator('main h1')).toBeVisible();
  }
  expect(errors).toEqual([]);
});
