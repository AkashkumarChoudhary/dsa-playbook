import type { MarkKey, ProblemProgress } from '../core/store';
import type { RunResult } from '../lab/runner';
import { DAY_MS, dayKey } from './days';

/** Re-solve reminders come 3, 7 and 21 days after the first solve (spec §9.2). */
export const RESOLVE_GAPS_DAYS = [3, 7, 21] as const;

/** The marks a learner may tick. `solvedAlone` is set by Submit only. */
export type TickMark = Exclude<MarkKey, 'solvedAlone'>;

export type BaseLevel = 0 | 1 | 2 | 3 | 4;

export const LEVEL_LABELS = ['Not started', 'Understood', 'Solved alone', 'Can explain', 'Code from memory', 'Spots it elsewhere'] as const;

export function emptyProblemProgress(now: number): ProblemProgress {
  return { marks: {}, resolveSteps: 0, updatedAt: now };
}

function copy(p: ProblemProgress | undefined, now: number): ProblemProgress {
  return p ? { ...p, marks: { ...p.marks } } : emptyProblemProgress(now);
}

/** Spec §9.1: solved when Submit passed every test, or when self-marked as solved elsewhere. */
export function isSolved(p: ProblemProgress | undefined): boolean {
  return p !== undefined && (p.solvedAt !== undefined || p.solvedElsewhere !== undefined);
}

/** The first solve, by either way. */
export function firstSolveAt(p: ProblemProgress | undefined): number | undefined {
  if (!p) return undefined;
  const times = [p.solvedAt, p.solvedElsewhere].filter((t): t is number => t !== undefined);
  return times.length ? Math.min(...times) : undefined;
}

/**
 * A re-solve is due once its calendar day has come, so a re-solve done that morning counts.
 * Today, the tracker and the dashboard all use this.
 */
export function resolveDue(p: Readonly<ProblemProgress> | undefined, now: number): boolean {
  return p !== undefined && isSolved(p) && p.resolveSteps < 3 && p.nextResolveAt !== undefined && dayKey(now) >= dayKey(p.nextResolveAt);
}

/** The built problems with a re-solve due today. Today and the dashboard count this same list. */
export function dueResolves<T extends { id: string; built: boolean }>(problems: readonly T[], progress: Readonly<Record<string, ProblemProgress>>, now: number): T[] {
  return problems.filter((p) => p.built && resolveDue(progress[p.id], now));
}

/**
 * Step `step` (0, 1 or 2) is due 3, 7 or 21 days after the first solve. It is never sooner than
 * the next calendar day, so a learner who comes back late does not get two re-solves on one day.
 */
function nextResolveAt(first: number, step: number, now: number): number {
  const at = Math.max(first + (RESOLVE_GAPS_DAYS[step] ?? 0) * DAY_MS, now + DAY_MS);
  // On the day the clocks go back, 24 hours after a time just past midnight is still the same day.
  return dayKey(at) > dayKey(now) ? at : at + DAY_MS / 24;
}

/** Starts the re-solve schedule on the first solve, or completes the next step when it is due. */
function startOrAdvance(p: ProblemProgress, now: number): void {
  const first = firstSolveAt(p);
  if (first === undefined || p.resolveSteps >= 3) return;
  if (p.nextResolveAt === undefined) {
    p.nextResolveAt = nextResolveAt(first, 0, now);
    return;
  }
  if (!resolveDue(p, now)) return;
  p.resolveSteps += 1;
  if (p.resolveSteps < 3) p.nextResolveAt = nextResolveAt(first, p.resolveSteps, now);
  else delete p.nextResolveAt;
}

/** True when a run passed every test. */
export function allTestsPassed(result: RunResult): boolean {
  return result.kind === 'tests' && result.results.length > 0 && result.results.every((t) => t.pass);
}

/** Submit passed every test (spec §9.1, §9.2). */
export function recordSubmitPass(prev: ProblemProgress | undefined, now: number): ProblemProgress {
  const p = copy(prev, now);
  if (p.solvedAt === undefined) {
    p.solvedAt = now;
    if (p.revealedAt === undefined && p.marks.solvedAlone === undefined) p.marks.solvedAlone = now;
  }
  startOrAdvance(p, now);
  p.updatedAt = now;
  return p;
}

/** "I solved this elsewhere". Counts as a solve. Pressed again while a re-solve is due, it completes that step. */
export function recordSolvedElsewhere(prev: ProblemProgress | undefined, now: number): ProblemProgress {
  const p = copy(prev, now);
  if (p.solvedElsewhere === undefined) p.solvedElsewhere = now;
  startOrAdvance(p, now);
  p.updatedAt = now;
  return p;
}

/** The first press of Show solutions counts as a peek. */
export function recordReveal(prev: ProblemProgress | undefined, now: number): ProblemProgress {
  const p = copy(prev, now);
  if (p.revealedAt === undefined) p.revealedAt = now;
  p.updatedAt = now;
  return p;
}

export function recordOpen(prev: ProblemProgress | undefined, now: number): ProblemProgress {
  const p = copy(prev, now);
  p.openedAt = now;
  p.updatedAt = now;
  return p;
}

export function toggleMark(prev: ProblemProgress | undefined, mark: TickMark, now: number): ProblemProgress {
  const p = copy(prev, now);
  if (p.marks[mark] === undefined) p.marks[mark] = now;
  else delete p.marks[mark];
  p.updatedAt = now;
  return p;
}

/** Levels 1 to 4 from the marks. The highest mark wins. Level 5 needs mastery, see mastery.ts. */
export function baseLevel(p: ProblemProgress | undefined): BaseLevel {
  if (!p) return 0;
  const m = p.marks;
  if (m.fromMemory !== undefined) return 4;
  if (m.canExplain !== undefined) return 3;
  if (m.solvedAlone !== undefined || m.selfMarkedAlone !== undefined) return 2;
  if (m.understood !== undefined) return 1;
  return 0;
}
