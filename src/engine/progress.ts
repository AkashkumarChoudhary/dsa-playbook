import { trimDrills, type DrillAttempt, type StoredState } from '../core/store';
import { dayKey } from './days';
import { rateCard, type Rating } from './leitner';
import { recordOpen, recordReveal, recordSolvedElsewhere, recordSubmitPass, toggleMark, type TickMark } from './tracker';

/*
 * Changes to progress. Each one takes the draft from `store.update` and the time, so pages stay thin
 * and tests can pass any time. Learning actions also count toward today's activity.
 */

export function bumpDay(d: StoredState, now: number): void {
  const key = dayKey(now);
  d.days[key] = (d.days[key] ?? 0) + 1;
}

/** Spec §9: opening any lesson starts its module. */
export function openLesson(d: StoredState, lessonId: string, now: number): void {
  const prev = d.lessons[lessonId];
  d.lessons[lessonId] = prev ? { ...prev, openedAt: now, updatedAt: now } : { openedAt: now, bestScore: 0, total: 0, updatedAt: now };
  bumpDay(d, now);
}

/** True when the score is at least 2 of 3 (spec §9.3), or the same share of another total. */
export function quizPassed(score: number, total: number): boolean {
  return total > 0 && score * 3 >= total * 2;
}

export function saveQuizScore(d: StoredState, lessonId: string, score: number, total: number, now: number): void {
  const prev = d.lessons[lessonId] ?? { openedAt: now, bestScore: 0, total, updatedAt: now };
  const next = { ...prev, bestScore: Math.max(prev.bestScore, score), total, updatedAt: now };
  if (next.passedAt === undefined && quizPassed(score, total)) next.passedAt = now;
  d.lessons[lessonId] = next;
  bumpDay(d, now);
}

export function openProblem(d: StoredState, problemId: string, now: number): void {
  d.problems[problemId] = recordOpen(d.problems[problemId], now);
}

export function revealSolutions(d: StoredState, problemId: string, now: number): void {
  d.problems[problemId] = recordReveal(d.problems[problemId], now);
}

export function passSubmit(d: StoredState, problemId: string, now: number): void {
  d.problems[problemId] = recordSubmitPass(d.problems[problemId], now);
  bumpDay(d, now);
}

export function markSolvedElsewhere(d: StoredState, problemId: string, now: number): void {
  d.problems[problemId] = recordSolvedElsewhere(d.problems[problemId], now);
  bumpDay(d, now);
}

export function tickMark(d: StoredState, problemId: string, mark: TickMark, now: number): void {
  d.problems[problemId] = toggleMark(d.problems[problemId], mark, now);
  bumpDay(d, now);
}

export function reviewCard(d: StoredState, cardId: string, rating: Rating, now: number): void {
  d.cards[cardId] = rateCard(d.cards[cardId], rating, dayKey(now), now);
  bumpDay(d, now);
}

export function recordDrill(d: StoredState, attemptId: string, attempt: DrillAttempt): void {
  d.drills[attemptId] = attempt;
  d.drills = trimDrills(d.drills);
  bumpDay(d, attempt.at);
}

/** A new id for a drill attempt. Random, so two tabs never pick the same one. */
export function newAttemptId(now: number, rand: () => number = Math.random): string {
  return `${now.toString(36)}-${Math.floor(rand() * 1e9).toString(36)}`;
}

/** Modules with at least one opened lesson (spec §9 "started"). */
export function startedModules(state: Readonly<StoredState>, moduleOfLesson: (lessonId: string) => string | undefined): Set<string> {
  const out = new Set<string>();
  for (const id of Object.keys(state.lessons)) {
    const m = moduleOfLesson(id);
    if (m) out.add(m);
  }
  return out;
}

/** False for a first-time visitor. Settings and saved code do not count. */
export function hasProgress(state: Readonly<StoredState>): boolean {
  return [state.lessons, state.problems, state.cards, state.drills].some((r) => Object.keys(r).length > 0);
}

/** The lesson or problem opened most recently, for "continue where you left off". */
export function lastOpened(state: Readonly<StoredState>): { kind: 'lesson' | 'problem'; id: string } | null {
  let best: { kind: 'lesson' | 'problem'; id: string; at: number } | null = null;
  for (const [id, l] of Object.entries(state.lessons)) if (!best || l.openedAt > best.at) best = { kind: 'lesson', id, at: l.openedAt };
  for (const [id, p] of Object.entries(state.problems)) if (p.openedAt !== undefined && (!best || p.openedAt > best.at)) best = { kind: 'problem', id, at: p.openedAt };
  return best ? { kind: best.kind, id: best.id } : null;
}
