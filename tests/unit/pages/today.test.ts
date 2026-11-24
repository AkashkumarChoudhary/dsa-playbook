import { describe, expect, it } from 'vitest';
import { contentInput } from '../../../content';
import { buildRegistry } from '../../../src/core/registry';
import { createStore, type Store } from '../../../src/core/store';
import { DAY_MS } from '../../../src/engine/days';
import { openLesson, openProblem, passSubmit } from '../../../src/engine/progress';
import { renderRoadmap } from '../../../src/pages/roadmap-page';
import { renderSheet } from '../../../src/pages/sheet-page';
import { renderToday } from '../../../src/pages/today';

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
    store.update((d) => openProblem(d, registry.problemIds[0]!, NOW));
    const el = view(renderToday({ registry, store, runner }, NOW));
    expect(el.querySelector('[data-testid="today-cards"]')!.textContent).toContain('No cards are due.');
    expect(el.querySelector('[data-testid="today-resolve"]')!.textContent).toContain('Nothing to solve again today.');
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
