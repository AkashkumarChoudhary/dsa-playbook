import { describe, expect, it } from 'vitest';
import { contentInput } from '../../../content';
import { buildRegistry } from '../../../src/core/registry';
import { createStore, type Store } from '../../../src/core/store';
import { computeDashboard } from '../../../src/engine/dashboard';
import { addDays, DAY_MS, dayKey } from '../../../src/engine/days';
import { openLesson, openProblem, passSubmit } from '../../../src/engine/progress';
import { renderRoadmap } from '../../../src/pages/roadmap-page';
import { renderSheet } from '../../../src/pages/sheet-page';
import { renderToday } from '../../../src/pages/today';
import { mountTracker } from '../../../src/pages/tracker';

const NOW = new Date(2026, 10, 24, 10).getTime();
const registry = buildRegistry(contentInput);
const runner = { ready: async () => {}, run: async () => ({ kind: 'runnerUnavailable' as const, reason: '' }), stop() {} };
const memStore = (): Store => { const d: Record<string, string> = {}; return createStore({ getItem: (k) => d[k] ?? null, setItem: (k, v) => { d[k] = v; } }); };
const view = (html: { __html: string }) => { const el = document.createElement('div'); el.innerHTML = html.__html; return el; };

describe('Today', () => {
  it('shows the intro and a start button to a first-time visitor', () => {
    const el = view(renderToday({ registry, store: memStore(), runner }, NOW));
    expect(el.querySelector('h1')!.textContent).toBe('Learn DSA by spotting patterns');
    const start = el.querySelector('[data-testid="start"]')!;
    expect(start.textContent).toBe(`Start with ${registry.modules[0]!.title}`);
    expect(start.getAttribute('href')).toBe(`#/m/${registry.modules[0]!.id}`);
  });

  it('shows cards due, problems to solve again, a drill and where to continue', () => {
    const store = memStore();
    const lessonId = registry.lessonIds[0]!;
    const problemId = registry.problemIds[0]!;
    store.update((d) => {
      openLesson(d, lessonId, NOW - 5 * DAY_MS);
      passSubmit(d, problemId, NOW - 4 * DAY_MS);
      openProblem(d, problemId, NOW - 4 * DAY_MS);
    });
    const el = view(renderToday({ registry, store, runner }, NOW));
    expect(el.querySelector('h1')!.textContent).toBe('Today');
    const cards = registry.cards.length;
    expect(el.querySelector('[data-testid="today-cards"]')!.textContent).toContain(`${cards} cards are due today.`);
    expect(el.querySelector('[data-testid="today-resolve"] a')!.getAttribute('href')).toBe(`#/p/${problemId}`);
    expect(el.querySelector('[data-testid="today-drill"] a')!.getAttribute('href')).toBe('#/drills');
    expect(el.querySelector('[data-testid="today-continue"] a')!.getAttribute('href')).toBe(`#/p/${problemId}`);
  });

  it('says when nothing is due', () => {
    const store = memStore();
    store.update((d) => {
      openLesson(d, registry.lessonIds[0]!, NOW);
      for (const c of registry.cards) d.cards[c.id] = { box: 2, dueDay: addDays(dayKey(NOW), 3), again: 0, lastDay: dayKey(NOW), updatedAt: NOW };
    });
    const el = view(renderToday({ registry, store, runner }, NOW));
    expect(el.querySelector('[data-testid="today-cards"]')!.textContent).toContain('No cards are due. Come back tomorrow.');
    expect(el.querySelector('[data-testid="today-resolve"]')!.textContent).toContain('Nothing to solve again today.');
  });

  it('asks for a lesson first when no module is started yet', () => {
    const store = memStore();
    store.update((d) => openProblem(d, registry.problemIds[0]!, NOW));
    const el = view(renderToday({ registry, store, runner }, NOW));
    expect(el.querySelector('[data-testid="today-cards"]')!.textContent).toContain('Open a lesson to start your cards.');
    expect(el.querySelector('[data-testid="today-cards"]')!.textContent).not.toContain('Come back tomorrow');
    expect(el.querySelector('[data-testid="today-resolve"]')!.textContent).toContain('Nothing to solve again today.');
  });
});

describe('a re-solve on its due day (solved Friday 23:00, back Monday 09:00)', () => {
  const FRI_23 = new Date(2026, 10, 20, 23).getTime();
  const MON_09 = new Date(2026, 10, 23, 9).getTime();

  it('is due on Today, the tracker and the dashboard, and a morning Submit completes it', () => {
    const store = memStore();
    const problem = registry.problem(registry.problemIds[0]!)!;
    const unbuilt = registry.allProblems.find((p) => !p.built)!;
    store.update((d) => {
      openLesson(d, registry.lessonIds[0]!, FRI_23);
      passSubmit(d, problem.id, FRI_23);
      // Old progress on a problem with no page must not count anywhere.
      passSubmit(d, unbuilt.id, FRI_23);
    });
    const cards = registry.cards.length;

    const today = view(renderToday({ registry, store, runner }, MON_09));
    expect([...today.querySelectorAll('[data-testid="today-resolve"] a')].map((a) => a.getAttribute('href'))).toEqual([`#/p/${problem.id}`]);
    expect(today.querySelector('[data-testid="today-cards"]')!.textContent).toContain(`${cards} cards are due today.`);

    const host = document.createElement('div');
    document.body.append(host);
    const dispose = mountTracker(host, problem, { registry, store, runner, now: () => MON_09 });
    expect(host.querySelector('[data-testid="track-resolve"]')!.textContent).toBe('A re-solve is due. Solve it again from scratch, then press Submit.');
    expect(host.querySelector<HTMLButtonElement>('[data-testid="track-elsewhere"]')!.disabled).toBe(false);
    dispose();
    host.remove();

    expect(computeDashboard(store.get(), registry, MON_09).headline.dueToday).toBe(cards + 1);

    store.update((d) => passSubmit(d, problem.id, MON_09));
    expect(store.get().problems[problem.id]!.resolveSteps).toBe(1);
    const later = MON_09 + 60_000;
    expect(view(renderToday({ registry, store, runner }, later)).querySelector('[data-testid="today-resolve"]')!.textContent).toContain('Nothing to solve again today.');
    expect(computeDashboard(store.get(), registry, later).headline.dueToday).toBe(cards);
  });
});

describe('Roadmap and sheets', () => {
  it('lists every module by level, built and planned', () => {
    const el = view(renderRoadmap({ registry, store: memStore(), runner }));
    expect(el.querySelectorAll('[data-testid="roadmap-module"]')).toHaveLength(26);
    expect([...el.querySelectorAll('h2')].map((h) => h.textContent)).toEqual(['Basics', 'Core', 'Hard', 'Advanced', 'Interview']);
    expect(el.textContent).toContain('coming in Part 2');
    expect(el.querySelector(`a[href="#/l/${registry.lessonIds[0]}"]`)).not.toBeNull();
  });

  it('shows a sheet in its own order with progress', () => {
    const store = memStore();
    store.update((d) => passSubmit(d, registry.problemIds[0]!, NOW));
    const sheet = registry.sheet('neetcode150')!;
    const el = view(renderSheet(sheet, { registry, store, runner }));
    expect(el.querySelector('h1')!.textContent).toBe('NeetCode 150');
    expect(el.querySelector('[data-testid="sheet-progress"]')!.textContent).toBe('1 of 150 solved.');
    const rows = el.querySelectorAll('[data-testid="sheet-row"]');
    expect(rows).toHaveLength(150);
    expect(rows[0]!.textContent).toContain('✅ Solved');
    expect(rows[1]!.textContent).toContain('coming in Part 2');
  });
});
