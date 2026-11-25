import type { Level, Pattern, Sheet, SheetId } from '../content-types';
import type { RoadmapLesson, RoadmapModule, RoadmapProblem } from '../core/registry';
import type { StoredState } from '../core/store';
import { deckCards, type Card } from './cards';
import { addDays, DAY_MS, dayKey, lastNDays, streak } from './days';
import { attemptsNewestFirst, patternAccuracy } from './drills';
import { lessonDone, patternStatus, type PatternStatus } from './mastery';
import { startedModules } from './progress';
import { baseLevel, dueResolves, firstSolveAt, isSolved } from './tracker';

/** What the dashboard reads from the course. A Registry fits this shape. */
export interface DashboardSource {
  roadmap: RoadmapModule[];
  allLessons: RoadmapLesson[];
  allProblems: RoadmapProblem[];
  patterns: Pattern[];
  sheets: Sheet[];
  cards: Card[];
}

export const LEVELS: { level: Level; title: string }[] = [
  { level: 'basics', title: 'Basics' },
  { level: 'core', title: 'Core' },
  { level: 'hard', title: 'Hard' },
  { level: 'advanced', title: 'Advanced' },
  { level: 'interview', title: 'Interview' },
];

/** Minutes per problem by difficulty (spec §9.4). */
export const PROBLEM_MINUTES = { easy: 20, medium: 40, hard: 60 } as const;
export const ACTIVITY_DAYS = 84;
export const PACE_WINDOW_DAYS = 14;
export const PACE_MIN_ACTIVE_DAYS = 3;
export const INTERVIEW_SHEET: SheetId = 'neetcode150';

export interface Counter {
  done: number;
  total: number;
  left: number;
}

export interface PatternBox {
  id: string;
  title: string;
  status: PatternStatus;
  lessonId: string;
  lessonBuilt: boolean;
}

export interface DashboardData {
  headline: { masteredPct: number; streak: number; dueToday: number };
  lessons: Counter;
  problems: Counter;
  patterns: Counter;
  /** whole hours */
  hours: Counter;
  levels: { level: Level; title: string; done: number; total: number; pct: number }[];
  patternMap: { moduleId: string; moduleTitle: string; icon: string; patterns: PatternBox[] }[];
  sheets: { id: SheetId; title: string; solved: number; total: number }[];
  /** whole percents */
  interviewReady: { sheetShare: number; drillAccuracy: number; drillsCounted: number; score: number };
  weakest: { id: string; title: string; accuracy: number | null; attempts: number; fading: boolean }[];
  activity: { day: string; count: number }[];
  /** null means "Not enough data yet" */
  pace: { level: Level; title: string; left: number; finishDay: string | null }[] | null;
  milestones: { level: Level; title: string; unlocked: boolean }[];
}

const counter = (done: number, total: number): Counter => ({ done, total, left: total - done });
const pct = (part: number, whole: number) => (whole === 0 ? 0 : Math.round((part / whole) * 100));

/** Every number on the dashboard. It only reads tracker data and stores nothing (spec §9.4). */
export function computeDashboard(state: Readonly<StoredState>, src: DashboardSource, now: number): DashboardData {
  const today = dayKey(now);
  const levelOf = new Map(src.roadmap.map((m) => [m.id, m.level]));
  const moduleOfLesson = new Map(src.allLessons.map((l) => [l.id, l.moduleId]));
  const masteryData = { patterns: src.patterns, allProblems: src.allProblems, cards: src.cards };

  const doneLessons = src.allLessons.filter((l) => lessonDone(state, l.id));
  const solvedProblems = src.allProblems.filter((p) => isSolved(state.problems[p.id]));
  const status = new Map(src.patterns.map((p) => [p.id, patternStatus(p.id, state, masteryData, now)]));
  const mastered = src.patterns.filter((p) => status.get(p.id) === 'mastered').length;

  const minutes = (lessons: RoadmapLesson[], problems: RoadmapProblem[]) =>
    lessons.reduce((s, l) => s + l.minutes, 0) + problems.reduce((s, p) => s + PROBLEM_MINUTES[p.difficulty], 0);
  const totalHours = Math.round(minutes(src.allLessons, src.allProblems) / 60);
  const doneHours = Math.round(minutes(doneLessons, solvedProblems) / 60);

  const started = startedModules(state, (id) => moduleOfLesson.get(id));
  const dueCards = deckCards('due', src.cards, state.cards, started, today)?.length ?? 0;
  const resolvesDue = dueResolves(src.allProblems, state.problems, now).length;

  const levels = LEVELS.map(({ level, title }) => {
    const lessons = src.allLessons.filter((l) => levelOf.get(l.moduleId) === level);
    const problems = src.allProblems.filter((p) => levelOf.get(p.moduleId) === level);
    const done = lessons.filter((l) => lessonDone(state, l.id)).length + problems.filter((p) => isSolved(state.problems[p.id])).length;
    const total = lessons.length + problems.length;
    return { level, title, done, total, pct: pct(done, total) };
  });

  const builtLessons = new Set(src.allLessons.filter((l) => l.built).map((l) => l.id));
  const patternMap = src.roadmap
    .map((m) => ({
      moduleId: m.id,
      moduleTitle: m.title,
      icon: m.icon,
      patterns: src.patterns
        .filter((p) => p.moduleId === m.id)
        .map((p): PatternBox => ({ id: p.id, title: p.title, status: status.get(p.id) ?? 'not-started', lessonId: p.lessonId, lessonBuilt: builtLessons.has(p.lessonId) })),
    }))
    .filter((m) => m.patterns.length > 0);

  const sheets = src.sheets.map((s) => ({ id: s.id, title: s.title, solved: s.problemIds.filter((id) => isSolved(state.problems[id])).length, total: s.problemIds.length }));

  const newest = attemptsNewestFirst(state.drills);
  const last50 = newest.slice(0, 50);
  const interviewIds = src.sheets.find((s) => s.id === INTERVIEW_SHEET)?.problemIds ?? [];
  const sheetShare = pct(interviewIds.filter((id) => baseLevel(state.problems[id]) >= 3).length, interviewIds.length);
  const drillAccuracy = pct(last50.filter((a) => a.correct).length, last50.length);

  const weakest = src.patterns
    .map((p) => {
      const { right, total } = patternAccuracy(newest, p.id);
      return { id: p.id, title: p.title, accuracy: total ? pct(right, total) : null, attempts: total, fading: status.get(p.id) === 'fading' };
    })
    .filter((w) => w.attempts > 0 || w.fading)
    .sort((a, b) => Number(b.fading) - Number(a.fading) || (a.accuracy ?? 101) - (b.accuracy ?? 101) || b.attempts - a.attempts)
    .slice(0, 5);

  const activity = lastNDays(today, ACTIVITY_DAYS).map((day) => ({ day, count: state.days[day] ?? 0 }));

  const since = now - PACE_WINDOW_DAYS * DAY_MS;
  const activeDays = lastNDays(today, PACE_WINDOW_DAYS).filter((d) => (state.days[d] ?? 0) > 0).length;
  const recent =
    doneLessons.filter((l) => (state.lessons[l.id]?.passedAt ?? 0) >= since).length +
    solvedProblems.filter((p) => (firstSolveAt(state.problems[p.id]) ?? 0) >= since).length;
  let pace: DashboardData['pace'] = null;
  if (activeDays >= PACE_MIN_ACTIVE_DAYS && recent > 0) {
    // Items per day = recent ÷ 14. Days needed = items ahead ÷ that rate, kept in whole numbers to avoid rounding drift.
    let ahead = 0;
    pace = levels.map(({ level, title, done, total }) => {
      const left = total - done;
      ahead += left;
      return { level, title, left, finishDay: left === 0 ? null : addDays(today, Math.ceil((ahead * PACE_WINDOW_DAYS) / recent)) };
    });
  }

  const milestones = LEVELS.map(({ level, title }) => {
    const pats = src.patterns.filter((p) => levelOf.get(p.moduleId) === level);
    const lessons = src.allLessons.filter((l) => levelOf.get(l.moduleId) === level);
    const unlocked = pats.length > 0
      ? pats.every((p) => status.get(p.id) === 'mastered')
      : lessons.length > 0 && lessons.every((l) => lessonDone(state, l.id));
    return { level, title: `${title} complete`, unlocked };
  });

  return {
    headline: { masteredPct: pct(mastered, src.patterns.length), streak: streak(state.days, today), dueToday: dueCards + resolvesDue },
    lessons: counter(doneLessons.length, src.allLessons.length),
    problems: counter(solvedProblems.length, src.allProblems.length),
    patterns: counter(mastered, src.patterns.length),
    hours: counter(doneHours, totalHours),
    levels,
    patternMap,
    sheets,
    interviewReady: { sheetShare, drillAccuracy, drillsCounted: last50.length, score: Math.round((sheetShare + drillAccuracy) / 2) },
    weakest,
    activity,
    pace,
    milestones,
  };
}
