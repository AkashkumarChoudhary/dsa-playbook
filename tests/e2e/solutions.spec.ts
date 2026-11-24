import { expect, test } from '@playwright/test';

test('every reference approach passes in the browser runner', async ({ page }) => {
  // Loading a second approach asks confirm() because the editor holds earlier code. Accept it.
  page.on('dialog', (d) => void d.accept());
  await page.goto('./');
  const problemRoutes = (await page.evaluate(() => window.__dsa?.routes ?? [])).filter((r) => r.startsWith('#/p/'));
  for (const r of problemRoutes) {
    await page.goto(`./${r}`);
    const levels = await page.locator('details.approach').evaluateAll((els) => els.map((e) => (e as HTMLElement).dataset.level as string));
    for (const level of levels) {
      await page.locator(`details.approach[data-level="${level}"] > summary`).click();
      await page.getByTestId(`load-into-lab-${level}`).click();
      await page.getByTestId('lab-submit').click();
      await expect(page.getByTestId('lab-submit')).toBeEnabled({ timeout: 90_000 });
      const failing = await page.locator('[data-testid="test-row"][data-pass="false"]').evaluateAll((els) => els.map((e) => (e as HTMLElement).dataset.kind));
      if (level === 'optimal') expect(failing, `${r} ${level}`).toEqual([]);
      else expect(failing.filter((k) => k !== 'speed'), `${r} ${level}`).toEqual([]);
    }
  }
});
