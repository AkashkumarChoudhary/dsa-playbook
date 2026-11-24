import { describe, expect, it } from 'vitest';
import { allRoutes, buildRegistry, type ContentInput } from '../../../src/core/registry';
import type { Lesson, Module, Problem } from '../../../src/content-types';
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
