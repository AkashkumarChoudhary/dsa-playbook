import { expect, test } from '@playwright/test';

const pages: [string, string][] = [['home', '#/'], ['lesson', '#/l/brute-better-optimal'], ['problem', '#/p/contains-duplicate']];

for (const theme of ['dark', 'light'] as const) {
  for (const width of [360, 1280]) {
    test(`screens ${theme} ${width}px have no sideways scroll`, async ({ page }) => {
      await page.setViewportSize({ width, height: 900 });
      await page.addInitScript((t) => {
        localStorage.setItem('dsa:v1', JSON.stringify({ version: 1, settings: { theme: t, updatedAt: 1 }, code: {} }));
      }, theme);
      for (const [name, route] of pages) {
        await page.goto(`./${route}`);
        await expect(page.locator('main h1')).toBeVisible();
        await page.evaluate(() => document.fonts.ready);
        expect(await page.evaluate(() => document.documentElement.dataset.theme), `${name} theme`).toBe(theme);
        if (name === 'problem') {
          // CodeMirror measures its lines only when it is on screen. Scroll to it like a learner would.
          await page.locator('.lab').scrollIntoViewIfNeeded();
          await expect(page.locator('.cm-lineNumbers .cm-gutterElement').nth(1)).toHaveCSS('height', /^(19|20|21)\./);
          await page.evaluate(() => window.scrollTo(0, 0));
        }
        const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
        expect(overflow, `${name} ${theme} ${width}`).toBeLessThanOrEqual(0);
        await page.screenshot({ path: `test-results/screens/${name}-${theme}-${width}.png`, fullPage: true });
      }
    });
  }
}

test('reduced motion: the dry run does not play by itself', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('./#/l/brute-better-optimal');
  const count = page.locator('.player-count').first();
  await count.scrollIntoViewIfNeeded();
  await expect(count).toHaveText(/^Step 1 of/);
  await page.waitForTimeout(3500);
  await expect(count).toHaveText(/^Step 1 of/);
});

test('normal motion: the dry run plays when in view', async ({ page }) => {
  await page.goto('./#/l/brute-better-optimal');
  const count = page.locator('.player-count').first();
  await count.scrollIntoViewIfNeeded();
  await expect(count).not.toHaveText(/^Step 1 of/, { timeout: 5000 });
});
