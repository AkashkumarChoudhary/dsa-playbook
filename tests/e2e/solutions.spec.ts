import { expect, test } from '@playwright/test';

test('every reference approach passes in the browser runner', async ({ page }) => {
  // Loading a second approach asks confirm() because the editor holds earlier code. Accept it.
  page.on('dialog', (d) => void d.accept());
  await page.goto('./');
  const problemRoutes = (await page.evaluate(() => window.__dsa?.routes ?? [])).filter((r) => r.startsWith('#/p/'));
  expect(problemRoutes.length).toBeGreaterThan(0);
  for (const r of problemRoutes) {
    await page.goto(`./${r}`);
    await page.getByTestId('show-solutions').click();
    const levels = await page.locator('details.approach').evaluateAll((els) => els.map((e) => (e as HTMLElement).dataset.level as string));
    expect(levels.length, r).toBeGreaterThan(0);
    expect(levels, r).toContain('optimal');
    for (const level of levels) {
      await page.locator(`details.approach[data-level="${level}"] > summary`).click();
      await page.getByTestId(`load-into-lab-${level}`).click();
      await page.getByTestId('lab-submit').click();
      // Wait for THIS run: Stop is enabled while it runs, then the status shows the final count.
      await expect(page.getByTestId('lab-stop')).toBeEnabled();
      await expect(page.getByTestId('lab-submit')).toBeEnabled({ timeout: 90_000 });
      await expect(page.getByTestId('lab-status')).toContainText(/\d+ of \d+ passed/);
      const total = Number(/of (\d+) passed/.exec((await page.getByTestId('lab-status').textContent()) ?? '')?.[1]);
      expect(total, `${r} ${level}`).toBeGreaterThan(0);
      const rows = await page.locator('[data-testid="test-row"]').evaluateAll((els) => els.map((e) => ({ pass: (e as HTMLElement).dataset.pass === 'true', kind: (e as HTMLElement).dataset.kind })));
      const hidden = Number(/(\d+) hidden tests? passed/.exec((await page.getByTestId('lab-results').textContent()) ?? '')?.[1] ?? 0);
      // Passing hidden tests are folded into one note, so rows + that note must equal the total.
      expect(rows.length + hidden, `${r} ${level} rows`).toBe(total);
      const failing = rows.filter((x) => !x.pass).map((x) => x.kind);
      if (level === 'optimal') expect(failing, `${r} ${level}`).toEqual([]);
      else expect(failing.filter((k) => k !== 'speed'), `${r} ${level}`).toEqual([]);
    }
  }
});
