import { describe, expect, it } from 'vitest';
import { mountQuiz } from '../../../src/engine/quiz';
import { mountLessonPage } from '../../../src/pages/lesson-page';
import { buildRegistry } from '../../../src/core/registry';
import { createStore } from '../../../src/core/store';
import { createRecorder, type TraceDef } from '../../../src/engine/trace';
import type { Lesson } from '../../../src/content-types';

const q = [
  { q: 'Pick b', options: ['a', 'b'], answer: 1, why: 'Because b.' },
  { q: 'Pick a', options: ['a', 'b'], answer: 0, why: 'Because a.' },
];

describe('mountQuiz', () => {
  it('locks each question and counts the score', () => {
    const host = document.createElement('div');
    let final = -1;
    mountQuiz(host, q, (s) => { final = s; });
    const opts = host.querySelectorAll<HTMLButtonElement>('.quiz-option');
    opts[1]!.click();
    expect(host.querySelectorAll('.quiz-feedback')[0]!.textContent).toContain('Right');
    opts[0]!.click();
    expect(opts[0]!.disabled).toBe(true);
    opts[3]!.click();
    expect(host.querySelectorAll('.quiz-feedback')[1]!.textContent).toContain('Not quite');
    expect(host.querySelector('.quiz-score')!.textContent).toBe('1 of 2 right');
    expect(final).toBe(1);
  });
});

describe('mountQuiz focus', () => {
  it('moves focus to the feedback after an answer', () => {
    const host = document.createElement('div');
    document.body.append(host);
    const dispose = mountQuiz(host, q);
    host.querySelectorAll<HTMLButtonElement>('.quiz-option')[1]!.click();
    expect(document.activeElement).toBe(host.querySelectorAll('.quiz-feedback')[0]);
    dispose();
    host.remove();
  });
});

const trace: TraceDef = {
  id: 'p/optimal', maxSteps: 10, inputFields: [], parseInput: () => ({ ok: true, value: {} }), formatInput: () => ({}), fromArgs: () => ({}),
  run: () => { const r = createRecorder(); r.step({ line: 'a', vars: { x: '1' }, views: [], note: 'Hello step.' }); return r.finish(1); },
};

const lesson: Lesson = {
  id: 'l', moduleId: 'm', title: 'My lesson', minutes: 5, summary: 'Short summary.', example: '<p>Example text.</p>', everyday: '<p>Everyday text.</p>',
  steps: [{ icon: '🐢', title: 'Slow', text: 'Go slow.' }, { icon: '🚀', title: 'Fast', text: 'Go fast.' }, { icon: '✅', title: 'Check', text: 'Check it.' }],
  viz: [{ label: 'Run it', traceId: 'p/optimal', input: {} }], deep: '<p>Deep text.</p>',
  spot: { size: 'Size.', words: 'Words.', shape: 'Shape.', bottleneck: 'Bottleneck.' },
  traps: [{ looksLike: 'Looks.', butIs: 'Is.', why: 'Why.' }], template: { title: 'Template', java: 'int x = 1;' },
  complexityFacts: [{ q: 'Fast?', a: 'O(1)', why: 'Yes.' }], realLife: [{ text: 'Real.', tier: 'confirmed', source: 'Docs' }],
  mistakes: ['M1.', 'M2.'], interview: ['I1.', 'I2.'], quiz: q.concat([{ q: 'Pick a', options: ['a', 'b'], answer: 0, why: 'A.' }]), problemIds: [],
};

describe('mountLessonPage', () => {
  it('renders all parts and mounts the viz', () => {
    const registry = buildRegistry({ modules: [], lessons: [lesson], problems: [{ id: 'p', moduleId: 'm', title: 'P', approaches: [{ level: 'optimal', title: 'o', idea: 'i', java: 'int a; // @L:a', time: 'O(1)', space: 'O(1)', traceId: 'p/optimal' }] } as never], traces: [trace] });
    const host = document.createElement('div');
    const d: Record<string, string> = {};
    const dispose = mountLessonPage(host, lesson, { registry, store: createStore({ getItem: (k) => d[k] ?? null, setItem: (k, v) => { d[k] = v; } }), runner: { ready: async () => {}, run: async () => ({ kind: 'runnerUnavailable', reason: '' }), stop() {} } });
    expect(host.querySelector('h1')!.textContent).toBe('My lesson');
    for (const id of ['example', 'everyday', 'steps', 'spot', 'template', 'real-life', 'mistakes', 'try-it']) expect(host.querySelector(`#${id}`)).not.toBeNull();
    expect(host.querySelector('.player-note')!.textContent).toBe('Hello step.');
    expect(host.querySelector('details.deep')!.textContent).toContain('Deep text.');
    expect(host.textContent).toContain('Confirmed');
    expect(host.querySelectorAll('.quiz-question')).toHaveLength(3);
    dispose();
  });
});

describe('lesson progress (Part 1b)', () => {
  function mount(now = 1000) {
    const registry = buildRegistry({ modules: [], lessons: [lesson], problems: [], traces: [] });
    const d: Record<string, string> = {};
    const store = createStore({ getItem: (k) => d[k] ?? null, setItem: (k, v) => { d[k] = v; } });
    const host = document.createElement('div');
    const dispose = mountLessonPage(host, { ...lesson, viz: [] }, { registry, store, runner: { ready: async () => {}, run: async () => ({ kind: 'runnerUnavailable', reason: '' }), stop() {} }, now: () => now });
    return { host, store, dispose };
  }
  const answer = (host: HTMLElement, picks: number[]) => {
    picks.forEach((k, qi) => host.querySelectorAll<HTMLButtonElement>(`.quiz-option[data-q="${qi}"]`)[k]!.click());
  };

  it('marks the lesson opened and asks for 2 of 3', () => {
    const { host, store, dispose } = mount();
    expect(store.get().lessons.l).toEqual({ openedAt: 1000, bestScore: 0, total: 0, updatedAt: 1000 });
    expect(host.querySelector('[data-testid="lesson-status"]')!.textContent).toBe('Get 2 of 3 right to finish this lesson.');
    dispose();
  });

  it('saves the best score, passes at 2 of 3, and can retry', () => {
    const { host, store, dispose } = mount();
    const retry = host.querySelector<HTMLButtonElement>('[data-testid="quiz-retry"]')!;
    expect(retry.hidden).toBe(true);
    answer(host, [0, 1, 1]);
    expect(store.get().lessons.l).toMatchObject({ bestScore: 0, total: 3 });
    expect(host.querySelector('[data-testid="lesson-status"]')!.textContent).toBe('Your best score is 0 of 3. Get 2 of 3 right to finish this lesson.');
    expect(retry.hidden).toBe(false);
    retry.click();
    expect(host.querySelectorAll('.quiz-question')).toHaveLength(3);
    answer(host, [1, 0, 0]);
    expect(store.get().lessons.l).toMatchObject({ bestScore: 3, passedAt: 1000 });
    expect(host.querySelector('[data-testid="lesson-status"]')!.textContent).toBe('✅ Lesson done. Your best score is 3 of 3.');
    dispose();
  });

  it('moves focus to the first answer after "Try the quiz again"', () => {
    const { host, dispose } = mount();
    document.body.append(host);
    answer(host, [0, 1, 1]);
    const retry = host.querySelector<HTMLButtonElement>('[data-testid="quiz-retry"]')!;
    retry.focus();
    retry.click();
    expect(retry.hidden).toBe(true);
    expect(document.activeElement).toBe(host.querySelector('.quiz-option'));
    dispose();
    host.remove();
  });
});
