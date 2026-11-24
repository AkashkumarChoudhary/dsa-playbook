import { describe, expect, it } from 'vitest';
import type { Catalog, Lesson, Problem } from '../../../src/content-types';
import { buildRegistry } from '../../../src/core/registry';
import { defaultState, type StoredState } from '../../../src/core/store';
import { computeDashboard } from '../../../src/engine/dashboard';
import { addDays, DAY_MS, dayKey } from '../../../src/engine/days';

const NOW = new Date(2026, 10, 24, 10).getTime();
const TODAY = dayKey(NOW);

const catalog: Catalog = {
  modules: [
    { id: 'm1', order: 1, level: 'basics', icon: '🧱', title: 'One', part: '1c' },
    { id: 'm2', order: 2, level: 'core', icon: '📦', title: 'Two', part: '2' },
    { id: 'm3', order: 3, level: 'interview', icon: '🎤', title: 'Three', part: '14' },
  ],
  lessons: [
    { id: 'l1', moduleId: 'm1', title: 'L1', minutes: 20, patternId: 'pa' },
    { id: 'l2', moduleId: 'm1', title: 'L2', minutes: 10 },
    { id: 'l3', moduleId: 'm2', title: 'L3', minutes: 30, patternId: 'pb' },
    { id: 'l4', moduleId: 'm3', title: 'L4', minutes: 15 },
  ],
  patterns: [
    { id: 'pa', moduleId: 'm1', lessonId: 'l1', title: 'Pattern A' },
    { id: 'pb', moduleId: 'm2', lessonId: 'l3', title: 'Pattern B' },
  ],
  problems: [
    { id: 'p1', title: 'P1', moduleId: 'm1', difficulty: 'easy', patternIds: ['pa'], sheets: ['neetcode150'], url: 'https://x/', core: true },
    { id: 'p2', title: 'P2', moduleId: 'm1', difficulty: 'medium', patternIds: ['pa'], sheets: [], url: 'https://x/', core: false },
    { id: 'p3', title: 'P3', moduleId: 'm2', difficulty: 'hard', patternIds: ['pb'], sheets: ['neetcode150', 'striver-bs'], url: 'https://x/', core: true },
  ],
  sheets: [
    { id: 'neetcode150', title: 'NeetCode 150', credit: 'c', problemIds: ['p1', 'p3'] },
    { id: 'striver-bs', title: 'Striver Binary Search', credit: 'c', problemIds: ['p3'] },
  ],
};

const l1 = {
  id: 'l1', moduleId: 'm1', title: 'L1', minutes: 20, summary: 'S.', template: { title: 'T', java: 'x' },
  complexityFacts: [{ q: 'Q', a: 'O(1)', why: 'W' }], traps: [{ looksLike: 'A', butIs: 'B', why: 'C' }], realLife: [{ text: 'R', tier: 'educational' }],
} as unknown as Lesson;
const p1 = {
  id: 'p1', moduleId: 'm1', title: 'P1', patternIds: ['pa'], difficulty: 'easy', core: true, statement: '<p>S</p>', limits: ['n'],
  spot: { prompt: 'Which?', options: ['a'], answer: 0, clues: [] }, approaches: [], hook: 'H', explain30: 'E', edgeCases: ['e'], source: { name: 'x', url: 'https://x/' },
} as unknown as Problem;
const registry = buildRegistry({ modules: [], lessons: [l1], problems: [p1], traces: [], catalog });

function session(): StoredState {
  const s = defaultState();
  s.lessons.l1 = { openedAt: NOW - 3 * DAY_MS, bestScore: 3, total: 3, passedAt: NOW - DAY_MS, updatedAt: NOW - DAY_MS };
  s.lessons.l2 = { openedAt: NOW - 2 * DAY_MS, bestScore: 0, total: 0, updatedAt: NOW - 2 * DAY_MS };
  s.problems.p1 = { marks: { canExplain: NOW - DAY_MS }, solvedAt: NOW - 2 * DAY_MS, resolveSteps: 0, nextResolveAt: NOW + DAY_MS, updatedAt: NOW - DAY_MS };
  for (const n of [0, 1, 2]) s.days[addDays(TODAY, -n)] = 2;
  [true, true, false, true].forEach((correct, i) => { s.drills[`d${i}`] = { itemId: 'i', patternIds: ['pa'], correct, at: NOW - i }; });
  return s;
}

describe('computeDashboard', () => {
  const d = computeDashboard(session(), registry, NOW);

  it('counts "X of Y, Z left" against the whole catalog', () => {
    expect(d.lessons).toEqual({ done: 1, total: 4, left: 3 });
    expect(d.problems).toEqual({ done: 1, total: 3, left: 2 });
    expect(d.patterns).toEqual({ done: 0, total: 2, left: 2 });
    // Total: lessons 20 + 10 + 30 + 15 = 75 min, problems 20 + 40 + 60 = 120 min, so 195 min ≈ 3 h.
    // Done: lesson 20 min + easy problem 20 min = 40 min ≈ 1 h.
    expect(d.hours).toEqual({ done: 1, total: 3, left: 2 });
  });

  it('shows the headline', () => {
    // Module m1 is started. Lesson l1 makes 4 new cards and problem p1 makes 4. No re-solve is due yet.
    expect(d.headline).toEqual({ masteredPct: 0, streak: 3, dueToday: 8 });
  });

  it('shows progress per level', () => {
    expect(d.levels.map((l) => [l.level, l.done, l.total, l.pct])).toEqual([
      ['basics', 2, 4, 50], ['core', 0, 2, 0], ['hard', 0, 0, 0], ['advanced', 0, 0, 0], ['interview', 0, 1, 0],
    ]);
  });

  it('colors the pattern map', () => {
    expect(d.patternMap.map((m) => [m.moduleId, m.patterns.map((p) => [p.id, p.status, p.lessonBuilt])])).toEqual([
      ['m1', [['pa', 'practicing', true]]],
      ['m2', [['pb', 'not-started', false]]],
    ]);
  });

  it('shows sheet progress and both parts of the interview-ready score', () => {
    expect(d.sheets).toEqual([
      { id: 'neetcode150', title: 'NeetCode 150', solved: 1, total: 2 },
      { id: 'striver-bs', title: 'Striver Binary Search', solved: 0, total: 1 },
    ]);
    // NeetCode 150 at level 3 or higher: 1 of 2 = 50%. Last drills: 3 of 4 = 75%. Average: 62.5, shown as 63.
    expect(d.interviewReady).toEqual({ sheetShare: 50, drillAccuracy: 75, drillsCounted: 4, score: 63 });
  });

  it('lists the weakest patterns and the activity grid', () => {
    expect(d.weakest).toEqual([{ id: 'pa', title: 'Pattern A', accuracy: 75, attempts: 4, fading: false }]);
    expect(d.activity).toHaveLength(84);
    expect(d.activity.at(-1)).toEqual({ day: TODAY, count: 2 });
    expect(d.activity[0]!.day).toBe(addDays(TODAY, -83));
  });

  it('estimates a finish day per level from the last 14 days', () => {
    // 2 items done in 14 days. Basics has 2 left: 2 × 14 ÷ 2 = 14 days. Core adds 2 more: 28 days. Interview adds 1: 35 days.
    expect(d.pace).toEqual([
      { level: 'basics', title: 'Basics', left: 2, finishDay: addDays(TODAY, 14) },
      { level: 'core', title: 'Core', left: 2, finishDay: addDays(TODAY, 28) },
      { level: 'hard', title: 'Hard', left: 0, finishDay: null },
      { level: 'advanced', title: 'Advanced', left: 0, finishDay: null },
      { level: 'interview', title: 'Interview', left: 1, finishDay: addDays(TODAY, 35) },
    ]);
  });

  it('says there is not enough data with fewer than 3 active days', () => {
    const s = session();
    delete s.days[addDays(TODAY, -2)];
    expect(computeDashboard(s, registry, NOW).pace).toBeNull();
  });

  it('unlocks a milestone only when every pattern in the level is mastered', () => {
    expect(d.milestones.every((m) => !m.unlocked)).toBe(true);
    const s = session();
    for (let i = 0; i < 10; i++) s.drills[`m${i}`] = { itemId: 'i', patternIds: ['pa'], correct: true, at: NOW + i };
    for (const c of registry.cards) s.cards[c.id] = { box: 3, dueDay: addDays(TODAY, 7), again: 0, lastDay: TODAY, updatedAt: NOW };
    const m = computeDashboard(s, registry, NOW + 20);
    expect(m.milestones.map((x) => [x.title, x.unlocked])).toEqual([
      ['Basics complete', true], ['Core complete', false], ['Hard complete', false], ['Advanced complete', false], ['Interview complete', false],
    ]);
    expect(m.patterns).toEqual({ done: 1, total: 2, left: 1 });
    expect(m.headline.masteredPct).toBe(50);
  });

  it('is all zero for a new learner', () => {
    const z = computeDashboard(defaultState(), registry, NOW);
    expect(z.headline).toEqual({ masteredPct: 0, streak: 0, dueToday: 0 });
    expect(z.interviewReady).toEqual({ sheetShare: 0, drillAccuracy: 0, drillsCounted: 0, score: 0 });
    expect(z.weakest).toEqual([]);
    expect(z.pace).toBeNull();
  });
});
