import { describe, expect, it } from 'vitest';
import type { Catalog, Lesson, Module, Problem } from '../../../src/content-types';
import { buildRegistry } from '../../../src/core/registry';
import { createStore } from '../../../src/core/store';
import { mountScenarios } from '../../../src/engine/quiz';
import { mountModulePage, renderModule } from '../../../src/pages/module-page';

const memStore = () => { const d: Record<string, string> = {}; return createStore({ getItem: (k) => d[k] ?? null, setItem: (k, v) => { d[k] = v; } }); };
const runner = { ready: async () => {}, run: async () => ({ kind: 'runnerUnavailable' as const, reason: '' }), stop() {} };

const mod: Module = {
  id: 'm', order: 1, level: 'basics', icon: '🧱', title: 'Mod', summary: 'Sum.', status: 'building', outcomes: ['Do it.'], lessonIds: ['l1'], problemIds: ['p1'],
  quiz: [
    { q: 'Pick b', options: ['a', 'b'], answer: 1, why: 'Because.' },
    { type: 'scenario', q: 'A work task.', answer: 'Use a set.' },
  ],
  cheatsheet: [], glossary: [],
};
const catalog: Catalog = {
  modules: [{ id: 'm', order: 1, level: 'basics', icon: '🧱', title: 'Mod', part: '1c' }],
  lessons: [{ id: 'l1', moduleId: 'm', title: 'L1', minutes: 10 }, { id: 'l2', moduleId: 'm', title: 'Planned lesson', minutes: 15 }],
  patterns: [],
  problems: [
    { id: 'p1', title: 'P1', moduleId: 'm', difficulty: 'easy', patternIds: [], sheets: [], url: 'https://x/', core: false },
    { id: 'p2', title: 'Planned problem', moduleId: 'm', difficulty: 'hard', patternIds: [], sheets: [], url: 'https://y/', core: false },
  ],
  sheets: [],
};
const l1 = { id: 'l1', moduleId: 'm', title: 'L1', minutes: 10, summary: 'Lesson summary.' } as unknown as Lesson;
const p1 = { id: 'p1', moduleId: 'm', title: 'P1', difficulty: 'easy', approaches: [] } as unknown as Problem;
const registry = buildRegistry({ modules: [mod], lessons: [l1], problems: [p1], traces: [], catalog });

describe('module page', () => {
  it('lists built and planned items with progress', () => {
    const store = memStore();
    store.update((s) => {
      s.lessons.l1 = { openedAt: 1, bestScore: 3, total: 3, passedAt: 2, updatedAt: 2 };
      s.problems.p1 = { marks: { understood: 1 }, solvedElsewhere: 1, resolveSteps: 0, updatedAt: 1 };
    });
    const host = document.createElement('div');
    const dispose = mountModulePage(host, mod, { registry, store, runner });
    expect(host.querySelector('[data-testid="module-progress"]')!.textContent).toBe('1 of 2 lessons done. 1 of 2 problems solved.');
    const items = [...host.querySelectorAll('.item-list li')].map((li) => li.textContent!.replace(/\s+/g, ' ').trim());
    expect(items[0]).toContain('L1');
    expect(items[0]).toContain('✅ Done');
    expect(items[1]).toContain('Planned lesson');
    expect(items[1]).toContain('coming in Part 1c');
    expect(items[2]).toContain('✅ Solved');
    expect(items[2]).toContain('Level 1: Understood');
    expect(items[3]).toContain('coming in Part 1c');
    expect(host.querySelector('[data-testid="module-drill"]')!.getAttribute('href')).toBe('#/drills/m');
    expect(host.querySelectorAll('.quiz-question')).toHaveLength(1);
    expect(host.querySelectorAll('.scenario')).toHaveLength(1);
    dispose();
    expect(host.innerHTML).toBe('');
  });

  it('hides an empty module quiz', () => {
    const empty = { ...mod, quiz: [] };
    expect(renderModule(empty, registry).__html).not.toContain('module-quiz');
  });
});

describe('mountScenarios', () => {
  it('shows the answer, then lets the learner mark it once', () => {
    const host = document.createElement('div');
    const marks: [number, number][] = [];
    mountScenarios(host, [{ type: 'scenario', q: 'Q1', answer: 'A1' }, { type: 'scenario', q: 'Q2', answer: 'A2' }], (r, m) => marks.push([r, m]));
    const answers = host.querySelectorAll<HTMLElement>('.scenario-answer');
    expect(answers[0]!.hidden).toBe(true);
    host.querySelectorAll<HTMLButtonElement>('[data-testid="scenario-show"]')[0]!.click();
    expect(answers[0]!.hidden).toBe(false);
    host.querySelectorAll<HTMLButtonElement>('[data-testid="scenario-right"]')[0]!.click();
    host.querySelectorAll<HTMLButtonElement>('[data-testid="scenario-wrong"]')[0]!.click();
    host.querySelectorAll<HTMLButtonElement>('[data-testid="scenario-wrong"]')[1]!.click();
    expect(marks).toEqual([[1, 1], [1, 2]]);
    expect(host.querySelectorAll('.scenario-result')[0]!.textContent).toBe('Marked right.');
  });
});
