import { describe, expect, it } from 'vitest';
import { allRoutes, buildRegistry, type ContentInput } from '../../../src/core/registry';
import type { Catalog, Lesson, Module, Problem } from '../../../src/content-types';
import type { TraceDef } from '../../../src/engine/trace';

const mod = (id: string, order: number): Module => ({
  id, order, level: 'basics', icon: '🧱', title: id, summary: 's', status: 'building',
  outcomes: [], lessonIds: [], problemIds: [], quiz: [], cheatsheet: [], glossary: [],
});

const trace: TraceDef = {
  id: 'p1/optimal', maxSteps: 10, inputFields: [],
  parseInput: () => ({ ok: true, value: {} }), formatInput: () => ({}), fromArgs: () => ({}),
  run: () => ({ steps: [], result: null }),
};

const problem = {
  id: 'p1', moduleId: 'b', title: 'P1',
  approaches: [{ level: 'optimal', title: 'o', idea: 'i', java: 'class Solution {}', time: 'O(n)', space: 'O(1)', traceId: 'p1/optimal' }],
} as unknown as Problem;

const lesson = { id: 'l1', moduleId: 'b', title: 'L1' } as unknown as Lesson;

const input = (): ContentInput => ({ modules: [mod('b', 2), mod('a', 1)], lessons: [lesson], problems: [problem], traces: [trace] });

describe('buildRegistry', () => {
  it('sorts modules by order and finds items by id', () => {
    const r = buildRegistry(input());
    expect(r.modules.map((m) => m.id)).toEqual(['a', 'b']);
    expect(r.module('b')?.order).toBe(2);
    expect(r.lesson('l1')?.title).toBe('L1');
    expect(r.problem('p1')?.title).toBe('P1');
    expect(r.trace('p1/optimal')?.maxSteps).toBe(10);
    expect(r.approachForTrace('p1/optimal')?.level).toBe('optimal');
    expect(r.lesson('missing')).toBeUndefined();
  });
  it('throws on duplicate ids', () => {
    const i = input();
    i.lessons.push({ ...lesson });
    expect(() => buildRegistry(i)).toThrow('Duplicate lesson id: l1');
  });
  it('lists every route', () => {
    expect(allRoutes(buildRegistry(input()))).toEqual(['#/', '#/m/a', '#/m/b', '#/l/l1', '#/p/p1']);
  });
});

describe('catalog merge', () => {
  const catalog: Catalog = {
    modules: [
      { id: 'b', order: 2, level: 'basics', icon: '📦', title: 'B planned', part: '2' },
      { id: 'a', order: 1, level: 'basics', icon: '🧱', title: 'A planned', part: '1c' },
    ],
    lessons: [
      { id: 'l0', moduleId: 'b', title: 'Planned L0', minutes: 20 },
      { id: 'l1', moduleId: 'b', title: 'Old title', minutes: 99, patternId: 'pat' },
    ],
    patterns: [{ id: 'pat', moduleId: 'b', lessonId: 'l1', title: 'A pattern' }],
    problems: [
      { id: 'p1', title: 'P1', moduleId: 'b', difficulty: 'easy', patternIds: ['pat'], sheets: ['neetcode150'], url: 'https://x/', core: true },
      { id: 'p2', title: 'P2', moduleId: 'b', difficulty: 'hard', patternIds: ['pat'], sheets: [], url: 'https://y/', core: false },
    ],
    sheets: [{ id: 'neetcode150', title: 'NeetCode 150', credit: 'c', problemIds: ['p1'] }],
  };
  const realLesson = { id: 'l1', moduleId: 'b', title: 'L1', minutes: 15 } as unknown as Lesson;
  const r = buildRegistry({ ...input(), lessons: [realLesson], catalog });

  it('lists every catalog module in order and marks what is built', () => {
    expect(r.roadmap.map((m) => [m.id, m.built])).toEqual([['a', true], ['b', true]]);
    expect(r.roadmapModule('a')?.part).toBe('1c');
  });
  it('marks built lessons and problems, and uses the built title and minutes', () => {
    expect(r.roadmapModule('b')!.lessons.map((l) => [l.id, l.built, l.title, l.minutes])).toEqual([['l0', false, 'Planned L0', 20], ['l1', true, 'L1', 15]]);
    expect(r.roadmapProblem('p1')).toMatchObject({ built: true, part: '2', core: true });
    expect(r.roadmapProblem('p2')).toMatchObject({ built: false, part: '2' });
    expect(r.allLessons).toHaveLength(2);
    expect(r.allProblems.map((p) => p.id)).toEqual(['p1', 'p2']);
  });
  it('finds patterns and sheets', () => {
    expect(r.pattern('pat')?.lessonId).toBe('l1');
    expect(r.sheet('neetcode150')?.problemIds).toEqual(['p1']);
    expect(r.sheet('nope')).toBeUndefined();
    expect(r.roadmapLesson('l0')?.built).toBe(false);
  });
  it('still lists a built item that the catalog misses', () => {
    const extra = { id: 'p9', moduleId: 'b', title: 'P9', difficulty: 'medium', patternIds: [], core: false, source: { name: 'x', url: 'https://z/' }, approaches: [] } as unknown as Problem;
    const r2 = buildRegistry({ ...input(), problems: [...input().problems, extra], catalog });
    expect(r2.roadmapModule('b')!.problems.at(-1)).toMatchObject({ id: 'p9', built: true });
  });
  it('works with no catalog', () => {
    const plain = buildRegistry(input());
    expect(plain.roadmap.map((m) => m.id)).toEqual(['a', 'b']);
    expect(plain.allLessons.map((l) => l.id)).toEqual(['l1']);
    expect(plain.patterns).toEqual([]);
  });
  it('merges the real catalog with the real content', async () => {
    const { contentInput } = await import('../../../content');
    const real = buildRegistry(contentInput);
    expect(real.roadmap).toHaveLength(26);
    expect(real.allProblems).toHaveLength(319);
    expect(real.allLessons.filter((l) => l.built).map((l) => l.id)).toEqual(['brute-better-optimal']);
    expect(real.roadmapProblem('contains-duplicate')?.built).toBe(true);
    expect(real.roadmapModule('hashing')).toMatchObject({ built: false, part: '2' });
  });
});
