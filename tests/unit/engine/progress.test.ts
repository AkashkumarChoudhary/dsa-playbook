import { describe, expect, it } from 'vitest';
import { defaultState } from '../../../src/core/store';
import { DAY_MS } from '../../../src/engine/days';
import { bumpDay, hasProgress, lastOpened, markSolvedElsewhere, newAttemptId, openLesson, openProblem, passSubmit, quizPassed, recordDrill, revealSolutions, reviewCard, saveQuizScore, startedModules, tickMark } from '../../../src/engine/progress';

const T0 = new Date(2026, 10, 24, 10).getTime();

describe('lessons', () => {
  it('opening sets openedAt, counts activity and starts the module', () => {
    const d = defaultState();
    openLesson(d, 'l1', T0);
    openLesson(d, 'l1', T0 + 5);
    expect(d.lessons.l1).toEqual({ openedAt: T0 + 5, bestScore: 0, total: 0, updatedAt: T0 + 5 });
    expect(d.days['2026-11-24']).toBe(2);
    expect([...startedModules(d, (id) => (id === 'l1' ? 'm1' : undefined))]).toEqual(['m1']);
  });
  it('passes at 2 of 3 and keeps the best score', () => {
    expect(quizPassed(2, 3)).toBe(true);
    expect(quizPassed(1, 3)).toBe(false);
    expect(quizPassed(0, 0)).toBe(false);
    const d = defaultState();
    openLesson(d, 'l1', T0);
    saveQuizScore(d, 'l1', 1, 3, T0 + 1);
    expect(d.lessons.l1).toMatchObject({ bestScore: 1, total: 3 });
    expect(d.lessons.l1?.passedAt).toBeUndefined();
    saveQuizScore(d, 'l1', 3, 3, T0 + 2);
    saveQuizScore(d, 'l1', 2, 3, T0 + 3);
    expect(d.lessons.l1).toMatchObject({ bestScore: 3, passedAt: T0 + 2 });
  });
});

describe('problems', () => {
  it('records open, reveal, submit, elsewhere and ticks', () => {
    const d = defaultState();
    openProblem(d, 'p', T0);
    expect(d.problems.p?.openedAt).toBe(T0);
    expect(d.days).toEqual({});
    revealSolutions(d, 'p', T0 + 1);
    passSubmit(d, 'p', T0 + 2);
    expect(d.problems.p).toMatchObject({ revealedAt: T0 + 1, solvedAt: T0 + 2, resolveSteps: 0 });
    expect(d.problems.p?.marks.solvedAlone).toBeUndefined();
    tickMark(d, 'p', 'canExplain', T0 + 3);
    expect(d.problems.p?.marks.canExplain).toBe(T0 + 3);
    markSolvedElsewhere(d, 'q', T0);
    expect(d.problems.q?.solvedElsewhere).toBe(T0);
    expect(d.days['2026-11-24']).toBe(3);
  });
});

describe('cards and drills', () => {
  it('rates a card on today\'s key', () => {
    const d = defaultState();
    reviewCard(d, 'p:hook', 'good', T0);
    expect(d.cards['p:hook']).toEqual({ box: 2, dueDay: '2026-11-27', again: 0, lastDay: '2026-11-24', updatedAt: T0 });
  });
  it('adds drill attempts and keeps the newest 1,000', () => {
    const d = defaultState();
    for (let i = 0; i < 1002; i++) recordDrill(d, `a${i}`, { itemId: 'i', patternIds: ['p'], correct: true, at: T0 + i });
    expect(Object.keys(d.drills)).toHaveLength(1000);
    expect(d.drills.a0).toBeUndefined();
    expect(d.days['2026-11-24']).toBe(1002);
  });
  it('makes different attempt ids', () => {
    expect(newAttemptId(T0, () => 0.1)).not.toBe(newAttemptId(T0, () => 0.2));
  });
});

describe('summary helpers', () => {
  it('knows a first-time visitor', () => {
    const d = defaultState();
    expect(hasProgress(d)).toBe(false);
    d.settings.theme = 'light';
    d.code.p = { source: 'x', updatedAt: 1 };
    expect(hasProgress(d)).toBe(false);
    openProblem(d, 'p', T0);
    expect(hasProgress(d)).toBe(true);
  });
  it('finds the last opened lesson or problem', () => {
    const d = defaultState();
    expect(lastOpened(d)).toBeNull();
    openLesson(d, 'l1', T0);
    openProblem(d, 'p', T0 + DAY_MS);
    expect(lastOpened(d)).toEqual({ kind: 'problem', id: 'p' });
    openLesson(d, 'l1', T0 + 2 * DAY_MS);
    expect(lastOpened(d)).toEqual({ kind: 'lesson', id: 'l1' });
  });
  it('counts activity per local day', () => {
    const d = defaultState();
    bumpDay(d, T0);
    bumpDay(d, T0 + DAY_MS);
    expect(d.days).toEqual({ '2026-11-24': 1, '2026-11-25': 1 });
  });
});
