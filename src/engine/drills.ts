import type { ClueKind, DrillItem, Pattern, Problem } from '../content-types';
import { html, raw } from '../core/html';
import type { DrillAttempt } from '../core/store';

/** Spec §6.2: 10 items a session, 60 seconds each. */
export const DRILL_SIZE = 10;
export const DRILL_SECONDS = 60;
export const MIN_OPTIONS = 4;

const CLUE_WORD: Record<ClueKind, string> = { size: 'Size', words: 'Words', shape: 'Shape', bottleneck: 'Bottleneck' };

/** A small seeded random number generator, so tests get the same session every time. */
export function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function shuffle<T>(items: readonly T[], rand: () => number): T[] {
  const out = [...items];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [out[i], out[j]] = [out[j] as T, out[i] as T];
  }
  return out;
}

/** An "interview" item made from a built problem: its statement, spot prompt and limits, with the title hidden. */
export function problemDrillItem(p: Problem): DrillItem {
  return {
    id: `${p.id}-interview`,
    kind: 'interview',
    prompt: html`${raw(p.statement)}<p><b>${p.spot.prompt}</b></p>`.__html,
    limits: [...p.limits],
    acceptedPatternIds: [...p.patternIds],
    clueExplanation: p.spot.clues.map((c) => `${CLUE_WORD[c.kind]}: ${c.text}`).join(' '),
    moduleId: p.moduleId,
  };
}

/** Items from started modules, or from one module when the drill is scoped to it. */
export function drillPool(items: DrillItem[], opts: { started: ReadonlySet<string>; moduleId?: string }): DrillItem[] {
  return items.filter((i) => (opts.moduleId ? i.moduleId === opts.moduleId : opts.started.has(i.moduleId)));
}

export function attemptsNewestFirst(drills: Readonly<Record<string, DrillAttempt>>): DrillAttempt[] {
  return Object.values(drills).sort((a, b) => b.at - a.at);
}

/** Right answers among the last `last` attempts for a pattern. `attempts` must be newest first. */
export function patternAccuracy(attempts: DrillAttempt[], patternId: string, last = 10): { right: number; total: number } {
  const recent = attempts.filter((a) => a.patternIds.includes(patternId)).slice(0, last);
  return { right: recent.filter((a) => a.correct).length, total: recent.length };
}

export function isCorrect(item: DrillItem, patternId: string): boolean {
  return item.acceptedPatternIds.includes(patternId);
}

export interface DrillOption {
  patternId: string;
  title: string;
}

export interface DrillQuestion {
  item: DrillItem;
  options: DrillOption[];
}

export interface SessionInput {
  items: DrillItem[];
  patterns: Pattern[];
  moduleOrder: (moduleId: string) => number | undefined;
  /** newest first */
  attempts: DrillAttempt[];
  seed: number;
  size?: number;
}

/** 0 for a pattern you always get right, 1 for one you always miss, 0.5 when there is no data yet. */
function weakness(attempts: DrillAttempt[], patternId: string): number {
  const { right, total } = patternAccuracy(attempts, patternId);
  return total === 0 ? 0.5 : 1 - right / total;
}

/**
 * Picks up to `size` items, weighted toward weak patterns. Each question shows the accepted patterns
 * plus distractors from other patterns, at least 4 options in all, in a shuffled order.
 */
export function buildSession(input: SessionInput): DrillQuestion[] {
  const rand = mulberry32(input.seed);
  const size = Math.min(input.size ?? DRILL_SIZE, input.items.length);
  const left = input.items.map((item) => ({ item, weight: 1 + 2 * Math.max(0, ...item.acceptedPatternIds.map((id) => weakness(input.attempts, id))) }));
  const picked: DrillItem[] = [];
  while (picked.length < size) {
    const total = left.reduce((s, x) => s + x.weight, 0);
    let r = rand() * total;
    let index = left.findIndex((x) => (r -= x.weight) < 0);
    if (index < 0) index = left.length - 1;
    picked.push(left[index]!.item);
    left.splice(index, 1);
  }
  const byId = new Map(input.patterns.map((p) => [p.id, p]));
  return picked.map((item) => {
    const accepted = item.acceptedPatternIds.map((id) => byId.get(id)).filter((p): p is Pattern => p !== undefined);
    const limit = Math.max(...[item.moduleId, ...accepted.map((p) => p.moduleId)].map((m) => input.moduleOrder(m) ?? 0)) + 3;
    const others = input.patterns.filter((p) => !item.acceptedPatternIds.includes(p.id));
    const near = others.filter((p) => (input.moduleOrder(p.moduleId) ?? Infinity) <= limit);
    const need = Math.max(MIN_OPTIONS, accepted.length + 2) - accepted.length;
    const distractors = shuffle(near.length >= need ? near : others, rand).slice(0, need);
    const options = shuffle([...accepted, ...distractors], rand).map((p) => ({ patternId: p.id, title: p.title }));
    return { item, options };
  });
}
