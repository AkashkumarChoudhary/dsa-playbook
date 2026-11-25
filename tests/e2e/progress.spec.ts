import { expect, test, type Page } from '@playwright/test';
import { catalogLessons } from '../../content/catalog/lessons';
import { catalogProblems } from '../../content/catalog/problems';

const stored = (page: Page) => page.evaluate(() => JSON.parse(localStorage.getItem('dsa:v1') ?? '{}') as { cards?: object; drills?: object });
const firstRoute = async (page: Page, prefix: string) => {
  await page.goto('./');
  const routes = await page.evaluate(() => window.__dsa?.routes ?? []);
  return routes.find((r) => r.startsWith(prefix)) as string;
};
/** Opening a lesson starts its module, so its cards and drills show up. */
async function startFirstModule(page: Page) {
  await page.goto(`./${await firstRoute(page, '#/l/')}`);
  await expect(page.locator('main h1')).toBeVisible();
}
const overflow = (page: Page) => page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);

test('the top nav opens the new pages', async ({ page }) => {
  await page.goto('./');
  const pages: [string, string][] = [['Dashboard', 'Dashboard'], ['Cards', 'Flashcards'], ['Drills', 'Spot-It drill'], ['Roadmap', 'Roadmap'], ['Today', 'Learn DSA by spotting patterns']];
  for (const [label, h1] of pages) {
    await page.locator('.topnav a', { hasText: label }).click();
    await expect(page.locator('main h1')).toHaveText(h1);
    await expect(page.locator('.topnav a[aria-current="page"]')).toHaveText(new RegExp(label));
  }
});

test('a full flashcard review with the keyboard', async ({ page }) => {
  await startFirstModule(page);
  await page.goto('./#/cards/due');
  const left = page.getByTestId('cards-left');
  const total = Number(/^(\d+) left today$/.exec((await left.textContent()) ?? '')?.[1]);
  expect(total).toBeGreaterThan(0);
  for (let i = 0; i < total; i++) {
    await expect(left).toHaveText(`${total - i} left today`);
    await page.keyboard.press('Space');
    await expect(page.locator('.card-back')).toBeVisible();
    await page.keyboard.press('3');
  }
  await expect(page.getByTestId('cards-done')).toBeVisible();
  expect(Object.keys((await stored(page)).cards ?? {})).toHaveLength(total);
  // Good moves every card to box 2, so nothing is due again today.
  await page.goto('./#/cards/due');
  await expect(page.getByTestId('cards-done')).toBeVisible();
});

test('a Spot-It drill session', async ({ page }) => {
  await startFirstModule(page);
  await page.goto('./#/drills');
  await page.getByTestId('drill-start').click();
  const count = page.getByTestId('drill-count');
  const n = Number(/of (\d+)$/.exec((await count.textContent()) ?? '')?.[1]);
  expect(n).toBeGreaterThan(0);
  for (let i = 1; i <= n; i++) {
    await expect(count).toHaveText(`Question ${i} of ${n}`);
    await page.getByTestId('drill-option').first().click();
    await expect(page.getByTestId('drill-feedback')).toContainText('The answer:');
    await page.getByTestId('drill-next').click();
  }
  await expect(page.getByTestId('drill-summary')).toHaveText(new RegExp(`^You got \\d+ of ${n} right\\.$`));
  expect(Object.keys((await stored(page)).drills ?? {})).toHaveLength(n);
});

test('Submit passing before any peek sets level 2 by itself', async ({ page }) => {
  await page.goto('./#/p/contains-duplicate');
  await expect(page.getByTestId('track-level')).toHaveText('Level 0 of 5: Not started');
  await page.locator('.cm-content').fill('import java.util.*;\n\nclass Solution {\n    public boolean containsDuplicate(int[] nums) {\n        Set<Integer> seen = new HashSet<>();\n        for (int x : nums) {\n            if (!seen.add(x)) return true;\n        }\n        return false;\n    }\n}\n');
  await page.getByTestId('lab-submit').click();
  await expect(page.getByTestId('lab-status')).toContainText('All tests passed', { timeout: 90_000 });
  await expect(page.getByTestId('track-level')).toHaveText('Level 2 of 5: Solved alone');
  await expect(page.getByTestId('track-alone')).toBeDisabled();
  await expect(page.getByTestId('track-resolve')).toContainText('Next re-solve:');
});

test('dashboard numbers after a scripted session', async ({ page }) => {
  // 1. Pass the first lesson's quiz. Answer once to learn the right options, then retry with them.
  await startFirstModule(page);
  const questions = page.locator('.quiz-question');
  const q = await questions.count();
  for (let i = 0; i < q; i++) await questions.nth(i).locator('.quiz-option').first().click();
  const right = await questions.evaluateAll((els) => els.map((fs) => [...fs.querySelectorAll('.quiz-option')].findIndex((b) => b.classList.contains('right'))));
  await page.getByTestId('quiz-retry').click();
  for (let i = 0; i < q; i++) await page.locator('.quiz-question').nth(i).locator('.quiz-option').nth(right[i]!).click();
  await expect(page.getByTestId('lesson-status')).toContainText('Lesson done');
  // 2. Mark the first problem as solved elsewhere and understood.
  await page.goto(`./${await firstRoute(page, '#/p/')}`);
  await page.getByTestId('track-elsewhere').click();
  await page.getByTestId('track-understood').click();
  await expect(page.getByTestId('track-level')).toHaveText('Level 1 of 5: Understood');
  // 3. Check the dashboard against the whole catalog.
  await page.goto('./#/dashboard');
  const value = (id: string) => page.locator(`[data-testid="${id}"] .counter-value`);
  const lessons = catalogLessons.length;
  const problems = catalogProblems.length;
  await expect(value('counter-lessons')).toHaveText(`1 of ${lessons}, ${lessons - 1} left`);
  await expect(value('counter-problems')).toHaveText(`1 of ${problems}, ${problems - 1} left`);
  await expect(page.getByTestId('dash-headline')).toContainText('1 day in a row');
  await expect(page.locator('[data-testid="pattern-box"][data-status="practicing"]')).toHaveCount(1);
  await expect(page.locator('[data-testid="activity"] span:not([data-level="0"])')).toHaveCount(1);
  await expect(page.getByTestId('pace')).toContainText('Not enough data yet.');
  await expect(page.locator('[data-testid="milestones"] li[data-unlocked="true"]')).toHaveCount(0);
});

test('review and drill pages fit a 360 px phone', async ({ page }) => {
  await page.setViewportSize({ width: 360, height: 800 });
  await startFirstModule(page);
  await page.goto('./#/cards/due');
  await page.getByTestId('card-flip').click();
  await expect(page.locator('.card-back')).toBeVisible();
  expect(await overflow(page)).toBeLessThanOrEqual(0);
  await page.goto('./#/drills');
  await page.getByTestId('drill-start').click();
  expect(await overflow(page)).toBeLessThanOrEqual(0);
  await page.getByTestId('drill-option').first().click();
  expect(await overflow(page)).toBeLessThanOrEqual(0);
});

test('reduced motion: the card flip does not animate', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await startFirstModule(page);
  await page.goto('./#/cards/due');
  await page.keyboard.press('Space');
  await expect(page.locator('.card-back')).toBeVisible();
  expect(await page.locator('.card-back').evaluate((el) => getComputedStyle(el).animationName)).toBe('none');
});
