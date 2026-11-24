import type { Approach, Lesson, Module, Problem } from '../content-types';
import type { TraceDef } from '../engine/trace';

export interface ContentInput {
  modules: Module[];
  lessons: Lesson[];
  problems: Problem[];
  traces: TraceDef[];
}

export interface Registry {
  modules: Module[];
  /** every lesson id, including lessons not yet listed by a module */
  lessonIds: string[];
  /** every problem id, including problems not yet listed by a module */
  problemIds: string[];
  module(id: string): Module | undefined;
  lesson(id: string): Lesson | undefined;
  problem(id: string): Problem | undefined;
  trace(id: string): TraceDef | undefined;
  approachForTrace(traceId: string): Approach | undefined;
}

function indexById<T extends { id: string }>(kind: string, items: T[]): Map<string, T> {
  const map = new Map<string, T>();
  for (const item of items) {
    if (map.has(item.id)) throw new Error(`Duplicate ${kind} id: ${item.id}`);
    map.set(item.id, item);
  }
  return map;
}

export function buildRegistry(input: ContentInput): Registry {
  const modules = indexById('module', input.modules);
  const lessons = indexById('lesson', input.lessons);
  const problems = indexById('problem', input.problems);
  const traces = indexById('trace', input.traces);
  const approachByTrace = new Map<string, Approach>();
  for (const p of input.problems) {
    for (const a of p.approaches) if (a.traceId) approachByTrace.set(a.traceId, a);
  }
  return {
    modules: [...modules.values()].sort((a, b) => a.order - b.order),
    lessonIds: [...lessons.keys()],
    problemIds: [...problems.keys()],
    module: (id) => modules.get(id),
    lesson: (id) => lessons.get(id),
    problem: (id) => problems.get(id),
    trace: (id) => traces.get(id),
    approachForTrace: (id) => approachByTrace.get(id),
  };
}

export function allRoutes(registry: Registry): string[] {
  return [
    '#/',
    ...registry.modules.map((m) => `#/m/${m.id}`),
    ...registry.lessonIds.map((id) => `#/l/${id}`),
    ...registry.problemIds.map((id) => `#/p/${id}`),
  ];
}
