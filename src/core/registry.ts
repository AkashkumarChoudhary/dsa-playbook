import type { Approach, Catalog, CatalogModule, CatalogProblem, DrillItem, Lesson, Module, Pattern, Problem, Sheet } from '../content-types';
import type { TraceDef } from '../engine/trace';

export interface ContentInput {
  modules: Module[];
  lessons: Lesson[];
  problems: Problem[];
  traces: TraceDef[];
  /** planned content for the whole course. Small test fixtures leave it out. */
  catalog?: Catalog;
  /** hand-written drill items */
  drills?: DrillItem[];
}

/** A catalog lesson merged with the built one. A `built` lesson has a page. */
export interface RoadmapLesson {
  id: string;
  moduleId: string;
  title: string;
  minutes: number;
  patternId?: string;
  built: boolean;
  /** the part that builds it, for "coming in Part N" */
  part: string;
}

export interface RoadmapProblem extends CatalogProblem {
  built: boolean;
  part: string;
}

export interface RoadmapModule extends CatalogModule {
  built: boolean;
  lessons: RoadmapLesson[];
  problems: RoadmapProblem[];
}

export interface Registry {
  /** built modules, by order */
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
  /** every catalog module merged with built content, by order */
  roadmap: RoadmapModule[];
  allLessons: RoadmapLesson[];
  allProblems: RoadmapProblem[];
  patterns: Pattern[];
  sheets: Sheet[];
  roadmapModule(id: string): RoadmapModule | undefined;
  roadmapLesson(id: string): RoadmapLesson | undefined;
  roadmapProblem(id: string): RoadmapProblem | undefined;
  pattern(id: string): Pattern | undefined;
  sheet(id: string): Sheet | undefined;
}

export const EMPTY_CATALOG: Catalog = { modules: [], lessons: [], patterns: [], problems: [], sheets: [] };

function indexById<T extends { id: string }>(kind: string, items: T[]): Map<string, T> {
  const map = new Map<string, T>();
  for (const item of items) {
    if (map.has(item.id)) throw new Error(`Duplicate ${kind} id: ${item.id}`);
    map.set(item.id, item);
  }
  return map;
}

/**
 * Merges the catalog with built content. A catalog item whose id is built is marked `built`.
 * A built item missing from the catalog is still listed, at the end of its module, so the site keeps
 * working. The content check reports it as an error.
 */
function mergeRoadmap(catalog: Catalog, modules: Map<string, Module>, lessons: Map<string, Lesson>, problems: Map<string, Problem>): RoadmapModule[] {
  const catalogModules: CatalogModule[] = [...catalog.modules];
  for (const m of modules.values()) {
    if (!catalogModules.some((c) => c.id === m.id)) catalogModules.push({ id: m.id, order: m.order, level: m.level, icon: m.icon, title: m.title, part: '' });
  }
  catalogModules.sort((a, b) => a.order - b.order);
  return catalogModules.map((cm) => {
    const plannedLessons: RoadmapLesson[] = catalog.lessons
      .filter((l) => l.moduleId === cm.id)
      .map((l) => {
        const real = lessons.get(l.id);
        return { ...l, title: real?.title ?? l.title, minutes: real?.minutes ?? l.minutes, built: !!real, part: cm.part };
      });
    const extraLessons: RoadmapLesson[] = [...lessons.values()]
      .filter((l) => l.moduleId === cm.id && !catalog.lessons.some((c) => c.id === l.id))
      .map((l) => ({ id: l.id, moduleId: l.moduleId, title: l.title, minutes: l.minutes, built: true, part: cm.part }));
    const plannedProblems: RoadmapProblem[] = catalog.problems
      .filter((p) => p.moduleId === cm.id)
      .map((p) => ({ ...p, built: problems.has(p.id), part: cm.part }));
    const extraProblems: RoadmapProblem[] = [...problems.values()]
      .filter((p) => p.moduleId === cm.id && !catalog.problems.some((c) => c.id === p.id))
      // Small test fixtures may leave fields out, so read them with care.
      .map((p) => ({ id: p.id, title: p.title, moduleId: p.moduleId, difficulty: p.difficulty, patternIds: p.patternIds ?? [], sheets: [], url: p.source?.url ?? '', core: !!p.core, built: true, part: cm.part }));
    return { ...cm, built: modules.has(cm.id), lessons: [...plannedLessons, ...extraLessons], problems: [...plannedProblems, ...extraProblems] };
  });
}

export function buildRegistry(input: ContentInput): Registry {
  const catalog = input.catalog ?? EMPTY_CATALOG;
  const modules = indexById('module', input.modules);
  const lessons = indexById('lesson', input.lessons);
  const problems = indexById('problem', input.problems);
  const traces = indexById('trace', input.traces);
  const approachByTrace = new Map<string, Approach>();
  for (const p of input.problems) {
    for (const a of p.approaches) if (a.traceId) approachByTrace.set(a.traceId, a);
  }
  const roadmap = mergeRoadmap(catalog, modules, lessons, problems);
  const allLessons = roadmap.flatMap((m) => m.lessons);
  const allProblems = roadmap.flatMap((m) => m.problems);
  const roadmapById = new Map(roadmap.map((m) => [m.id, m]));
  const lessonById = new Map(allLessons.map((l) => [l.id, l]));
  const problemById = new Map(allProblems.map((p) => [p.id, p]));
  const patternById = new Map(catalog.patterns.map((p) => [p.id, p]));
  const sheetById = new Map(catalog.sheets.map((s) => [s.id as string, s]));
  return {
    modules: [...modules.values()].sort((a, b) => a.order - b.order),
    lessonIds: [...lessons.keys()],
    problemIds: [...problems.keys()],
    module: (id) => modules.get(id),
    lesson: (id) => lessons.get(id),
    problem: (id) => problems.get(id),
    trace: (id) => traces.get(id),
    approachForTrace: (id) => approachByTrace.get(id),
    roadmap,
    allLessons,
    allProblems,
    patterns: catalog.patterns,
    sheets: catalog.sheets,
    roadmapModule: (id) => roadmapById.get(id),
    roadmapLesson: (id) => lessonById.get(id),
    roadmapProblem: (id) => problemById.get(id),
    pattern: (id) => patternById.get(id),
    sheet: (id) => sheetById.get(id),
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
