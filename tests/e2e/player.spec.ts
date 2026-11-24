import { expect, test } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  // No autoplay, so only the learner moves the player.
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('./#/l/brute-better-optimal');
  await page.locator('.player').first().scrollIntoViewIfNeeded();
});

test('Space on a focused Step button steps once and does not start play', async ({ page }) => {
  const player = page.locator('.player').first();
  await expect(player.locator('.player-count')).toHaveText(/^Step 1 of/);
  await player.locator('[data-action="next"]').focus();
  await page.keyboard.press('Space');
  await expect(player.locator('.player-count')).toHaveText(/^Step 2 of/);
  await expect(player.locator('[data-action="play"]')).toHaveText('▶ Play');
  // One step lasts 1.4 s at 1×. If Space had started play, the count would move on.
  await page.waitForTimeout(2000);
  await expect(player.locator('.player-count')).toHaveText(/^Step 2 of/);
});

test('Space on the player itself still plays and pauses', async ({ page }) => {
  const player = page.locator('.player').first();
  await player.focus();
  await page.keyboard.press('Space');
  await expect(player.locator('[data-action="play"]')).toHaveText('⏸ Pause');
  await page.keyboard.press('Space');
  await expect(player.locator('[data-action="play"]')).toHaveText('▶ Play');
});

test('Enter in the own-input box runs it without reloading the page', async ({ page }) => {
  const player = page.locator('.player').first();
  await page.evaluate(() => { (window as unknown as { __stay?: boolean }).__stay = true; });
  const input = player.locator('.player-input input[name="nums"]');
  await input.fill('5, 5');
  await input.press('Enter');
  await expect(player.locator('.piece-array')).toHaveAttribute('aria-label', 'nums: 5, 5');
  await expect(player.locator('.player-count')).toHaveText(/^Step 1 of/);
  expect(await page.evaluate(() => (window as unknown as { __stay?: boolean }).__stay)).toBe(true);
});

test('long numbers fit in their boxes and the pointers stay lined up', async ({ page }) => {
  const player = page.locator('.player').first();
  const input = player.locator('.player-input input[name="nums"]');
  await input.fill('-1000000000, 1000000000, 7');
  await input.press('Enter');
  await player.locator('[data-action="next"]').click();
  const m = await player.evaluate((el) => {
    const box = (sel: string) => (el.querySelector(sel) as HTMLElement).getBoundingClientRect();
    const cells = [...el.querySelectorAll('.cell')].map((c) => ({ cell: c.getBoundingClientRect().width, text: (c.querySelector('.val') as HTMLElement).getBoundingClientRect().width }));
    return { cells, c0: box('.cell[data-index="0"]'), c1: box('.cell[data-index="1"]'), i: box('.ptr[data-name="i"]'), j: box('.ptr[data-name="j"]') };
  });
  expect(m.cells).toHaveLength(3);
  for (const c of m.cells) expect(c.text).toBeLessThan(c.cell - 2);
  expect(Math.abs(m.i.left - m.c0.left)).toBeLessThan(1);
  expect(Math.abs(m.j.left - m.c1.left)).toBeLessThan(1);
  expect(Math.abs(m.i.width - m.c0.width)).toBeLessThan(1);
});

test('the chosen dry-run tab looks chosen', async ({ page }) => {
  const tabs = page.locator('.viz-tabs button');
  await expect(tabs).toHaveCount(2);
  const bg = (i: number) => tabs.nth(i).evaluate((b) => getComputedStyle(b).backgroundColor);
  const pressedSpeed = await page.locator('.player-controls button[aria-pressed="true"]').first().evaluate((b) => getComputedStyle(b).backgroundColor);
  expect(await bg(0)).toBe(pressedSpeed);
  expect(await bg(1)).not.toBe(pressedSpeed);
  await tabs.nth(1).click();
  await expect(tabs.nth(1)).toHaveAttribute('aria-pressed', 'true');
  expect(await bg(1)).toBe(pressedSpeed);
  expect(await bg(0)).not.toBe(pressedSpeed);
});

test('on a phone the picture, the step sentence and the Step button fit on one screen', async ({ page }) => {
  await page.setViewportSize({ width: 360, height: 740 });
  const player = page.locator('.player').first();
  await player.evaluate((el) => el.scrollIntoView({ block: 'start' }));
  const pos = await player.evaluate((el) => {
    const top = (sel: string) => (el.querySelector(sel) as HTMLElement).getBoundingClientRect();
    return { stage: top('.player-stage'), note: top('.player-note'), next: top('[data-action="next"]'), side: top('.player-side'), h: window.innerHeight };
  });
  expect(pos.note.top).toBeGreaterThan(pos.stage.top);
  expect(pos.next.top).toBeGreaterThan(pos.note.top);
  expect(pos.side.top).toBeGreaterThan(pos.next.top);
  expect(pos.next.bottom).toBeLessThanOrEqual(pos.h);
});
