import type { Pattern } from '../content-types';
import type { DrillAttempt, StoredState } from '../core/store';
import { DAY_MS } from './days';
import { attemptsNewestFirst, patternAccuracy } from './drills';
import { baseLevel, isSolved } from './tracker';

export type PatternStatus = 'not-started' | 'learning' | 'practicing' | 'mastered' | 'fading';

/** What mastery needs to know about the course. A Registry fits this shape. */
export interface MasteryData {
  patterns: Pattern[];
  allProblems: { id: string; patternIds: string[]; core: boolean }[];
  cards: { id: string; patternIds: string[] }[];
}

export const FADE_AFTER_DAYS = 30;

/** Spec §9.3: a lesson is done when its quiz was passed with at least 2 of 3 right. */
export function lessonDone(state: Readonly<StoredState>, lessonId: string): boolean {
  return state.lessons[lessonId]?.passedAt !== undefined;
}

function corePassed(patternId: string, state: Readonly<StoredState>, data: MasteryData): boolean {
  const core = data.allProblems.filter((p) => p.core && p.patternIds.includes(patternId));
  return core.length > 0 && core.every((p) => baseLevel(state.problems[p.id]) >= 3);
}

/** At least 8 of the last 10 drills right, with at least 10 attempts. `newest` is newest first. */
function drillsPassed(patternId: string, newest: DrillAttempt[]): boolean {
  const { right, total } = patternAccuracy(newest, patternId);
  return total >= 10 && right >= 8;
}

/** At least 80% of the pattern's cards in box 3 or higher. A pattern with no cards passes. */
function cardsPassed(patternId: string, state: Readonly<StoredState>, data: MasteryData): boolean {
  const cards = data.cards.filter((c) => c.patternIds.includes(patternId));
  if (cards.length === 0) return true;
  const high = cards.filter((c) => (state.cards[c.id]?.box ?? 0) >= 3).length;
  return high / cards.length >= 0.8;
}

/** Spec §9.3: all three must hold. */
export function isMastered(patternId: string, state: Readonly<StoredState>, data: MasteryData): boolean {
  return corePassed(patternId, state, data) && drillsPassed(patternId, attemptsNewestFirst(state.drills)) && cardsPassed(patternId, state, data);
}

/** Level 0 to 5 (spec §9.1). Level 5 is never stored: level 4 plus every pattern of the problem mastered. */
export function problemLevel(problemId: string, state: Readonly<StoredState>, data: MasteryData): 0 | 1 | 2 | 3 | 4 | 5 {
  const level = baseLevel(state.problems[problemId]);
  if (level < 4) return level;
  const patternIds = data.allProblems.find((p) => p.id === problemId)?.patternIds ?? [];
  return patternIds.length > 0 && patternIds.every((id) => isMastered(id, state, data)) ? 5 : 4;
}

/** The newest drill, flashcard review or solve for a pattern, in ms. */
export function lastActivity(patternId: string, state: Readonly<StoredState>, data: MasteryData): number | undefined {
  const times: number[] = [];
  for (const a of Object.values(state.drills)) if (a.patternIds.includes(patternId)) times.push(a.at);
  for (const c of data.cards) {
    const p = state.cards[c.id];
    if (p && c.patternIds.includes(patternId)) times.push(p.updatedAt);
  }
  for (const pr of data.allProblems) {
    const p = state.problems[pr.id];
    if (p && pr.patternIds.includes(patternId) && isSolved(p)) times.push(p.updatedAt);
  }
  return times.length ? Math.max(...times) : undefined;
}

/** True when some run of 10 drills in a row for the pattern had 8 or more right. */
function hadGoodRun(patternId: string, newest: DrillAttempt[]): boolean {
  const list = newest.filter((a) => a.patternIds.includes(patternId));
  for (let i = 0; i + 10 <= list.length; i++) {
    if (list.slice(i, i + 10).filter((a) => a.correct).length >= 8) return true;
  }
  return false;
}

/**
 * Spec §9.4 statuses. "Fading" needs to know the pattern was mastered before. The dashboard stores
 * nothing, so this reads it from the drill log: a run of 10 drills with 8 or more right, while the
 * core problems and the cards still pass.
 */
export function patternStatus(patternId: string, state: Readonly<StoredState>, data: MasteryData, now: number): PatternStatus {
  const newest = attemptsNewestFirst(state.drills);
  const core = corePassed(patternId, state, data);
  const cards = cardsPassed(patternId, state, data);
  const drills = drillsPassed(patternId, newest);
  const wasMastered = core && cards && hadGoodRun(patternId, newest);
  const last = lastActivity(patternId, state, data);
  const stale = last === undefined || now - last > FADE_AFTER_DAYS * DAY_MS;
  if (wasMastered && (stale || !drills)) return 'fading';
  if (core && drills && cards) return 'mastered';
  if (data.allProblems.some((p) => p.patternIds.includes(patternId) && isSolved(state.problems[p.id]))) return 'practicing';
  const lessonId = data.patterns.find((p) => p.id === patternId)?.lessonId;
  if (lessonId && state.lessons[lessonId]) return 'learning';
  return 'not-started';
}
