import { describe, expect, it } from 'vitest';
import { contentInput } from '../../../content';
import { buildRegistry } from '../../../src/core/registry';
import { createStore, type Store } from '../../../src/core/store';
import { openLesson, passSubmit, recordDrill, saveQuizScore } from '../../../src/engine/progress';
import { renderDashboard } from '../../../src/pages/dashboard-page';

const NOW = new Date(2026, 10, 24, 10).getTime();
const registry = buildRegistry(contentInput);
const runner = { ready: async () => {}, run: async () => ({ kind: 'runnerUnavailable' as const, reason: '' }), stop() {} };
const memStore = (): Store => { const d: Record<string, string> = {}; return createStore({ getItem: (k) => d[k] ?? null, setItem: (k, v) => { d[k] = v; } }); };
const view = (store: Store) => { const el = document.createElement('div'); el.innerHTML = renderDashboard({ registry, store, runner }, NOW).__html; return el; };
const text = (el: Element, id: string) => el.querySelector(`[data-testid="${id}"]`)!.textContent!.replace(/\s+/g, ' ').trim();
const value = (el: Element, id: string) => el.querySelector(`[data-testid="${id}"] .counter-value`)!.textContent;

describe('dashboard page', () => {
  it('shows zeros against the whole course for a new learner', () => {
    const el = view(memStore());
    const lessons = registry.allLessons.length;
    expect(el.querySelector('h1')!.textContent).toBe('Dashboard');
    expect(value(el, 'counter-lessons')).toBe(`0 of ${lessons}, ${lessons} left`);
    expect(value(el, 'counter-problems')).toBe('0 of 319, 319 left');
    expect(value(el, 'counter-patterns')).toBe(`0 of ${registry.patterns.length}, ${registry.patterns.length} left`);
    expect(text(el, 'dash-headline')).toBe('🏅 0% of patterns mastered 🔥 0 days in a row 📌 0 due today');
    expect(el.querySelectorAll('[data-testid="pattern-box"]')).toHaveLength(registry.patterns.length);
    expect(el.querySelectorAll('[data-testid="activity"] span')).toHaveLength(84);
    expect(text(el, 'pace')).toContain('Not enough data yet.');
    expect(text(el, 'weakest')).toContain('No drills yet.');
    expect(el.querySelectorAll('[data-testid="milestones"] li[data-unlocked="false"]')).toHaveLength(5);
  });

  it('shows the numbers after a short session', () => {
    const store = memStore();
    const lessonId = registry.lessonIds[0]!;
    const problemId = registry.problemIds[0]!;
    store.update((d) => {
      openLesson(d, lessonId, NOW);
      saveQuizScore(d, lessonId, 3, 3, NOW);
      passSubmit(d, problemId, NOW);
      recordDrill(d, 'a1', { itemId: 'x', patternIds: registry.problem(problemId)!.patternIds, correct: true, at: NOW });
      recordDrill(d, 'a2', { itemId: 'y', patternIds: registry.problem(problemId)!.patternIds, correct: false, at: NOW + 1 });
    });
    const el = view(store);
    const lessons = registry.allLessons.length;
    expect(value(el, 'counter-lessons')).toBe(`1 of ${lessons}, ${lessons - 1} left`);
    expect(value(el, 'counter-problems')).toBe('1 of 319, 318 left');
    expect(text(el, 'dash-headline')).toContain('🔥 1 day in a row');
    expect(text(el, 'sheet-neetcode150')).toBe('NeetCode 150: 1 of 150 solved');
    expect(text(el, 'interview-ready')).toContain('Spot-It drills right, over your last 2 of up to 50: 50%');
    const box = el.querySelector(`[data-testid="pattern-box"][data-status="practicing"]`)!;
    expect(box.getAttribute('href')).toBe('#/roadmap');
    expect(text(el, 'weakest')).toContain('50% right in the last 2');
  });

  it('explains a missing drill part and labels every activity square', () => {
    const el = view(memStore());
    const ready = text(el, 'interview-ready');
    expect(ready).toContain('No drills yet');
    expect(ready).not.toContain('Spot-It drills right, over your last 0');
    expect(ready).toContain('Until you do a drill, this part counts as 0%. So your score is half of the sheet part.');
    const squares = [...el.querySelectorAll('[data-testid="activity"] span')];
    expect(squares).toHaveLength(84);
    for (const s of squares) {
      expect(s.getAttribute('role')).toBe('img');
      expect(s.getAttribute('aria-label')).toBeTruthy();
    }
  });
});
