import { expect, test } from '@playwright/test';

const saved = (theme: string) => JSON.stringify({ version: 1, settings: { theme, updatedAt: 1 }, code: {} });

test('the site still works when the browser blocks storage', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await page.addInitScript(() => {
    Object.defineProperty(window, 'localStorage', { configurable: true, get() { throw new DOMException('The operation is insecure.', 'SecurityError'); } });
  });
  await page.goto('./#/l/brute-better-optimal');
  expect(await page.evaluate(() => { try { void window.localStorage; return 'open'; } catch { return 'blocked'; } })).toBe('blocked');
  await expect(page.locator('main h1')).toBeVisible();
  const before = await page.evaluate(() => document.documentElement.dataset.theme);
  await page.locator('[data-action="theme"]').click();
  await expect(page.locator('html')).not.toHaveAttribute('data-theme', before ?? '');
  await page.goto('./#/p/contains-duplicate');
  await expect(page.locator('main h1')).toBeVisible();
  expect(errors).toEqual([]);
});

test.describe('theme before the app runs', () => {
  // Block the app script, so only the small script in index.html can set the theme.
  test.beforeEach(async ({ page }) => {
    await page.route('**/assets/index-*.js', (r) => r.abort());
  });

  test('uses the saved light theme', async ({ page }) => {
    await page.addInitScript((v) => localStorage.setItem('dsa:v1', v), saved('light'));
    await page.goto('./');
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');
  });

  test('follows a light system setting when nothing is saved', async ({ page }) => {
    await page.emulateMedia({ colorScheme: 'light' });
    await page.goto('./');
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');
  });

  test('stays dark by default', async ({ page }) => {
    await page.emulateMedia({ colorScheme: 'dark' });
    await page.addInitScript((v) => localStorage.setItem('dsa:v1', v), saved('system'));
    await page.goto('./');
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
  });
});

test('two tabs do not erase each other', async ({ context }) => {
  const a = await context.newPage();
  const b = await context.newPage();
  await b.goto('./#/');
  await expect(b.locator('main h1')).toBeVisible();
  await a.goto('./#/p/contains-duplicate');
  await a.locator('.cm-content').fill('class Solution { /* written in tab A */ }');
  await expect.poll(() => a.evaluate(() => localStorage.getItem('dsa:v1') ?? '')).toContain('written in tab A');
  // Tab B loaded before tab A saved. Changing the theme in B must keep A's code.
  const themeA = await a.evaluate(() => document.documentElement.dataset.theme);
  await b.locator('[data-action="theme"]').click();
  const stored = await b.evaluate(() => JSON.parse(localStorage.getItem('dsa:v1') ?? '{}') as { code?: Record<string, { source: string }> });
  expect(stored.code?.['contains-duplicate']?.source).toBe('class Solution { /* written in tab A */ }');
  // Tab A hears about the change and follows the new theme.
  await expect(a.locator('html')).not.toHaveAttribute('data-theme', themeA ?? '');
});
