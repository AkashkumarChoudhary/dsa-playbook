import type { Box, CardProgress } from '../core/store';
import { addDays } from './days';

/** Days until a card in box 1..5 is due again (spec §9.5). */
export const BOX_DAYS = [1, 3, 7, 14, 30] as const;

export type Rating = 'again' | 'hard' | 'good' | 'easy';
export const RATINGS: Rating[] = ['again', 'hard', 'good', 'easy'];

const clampBox = (n: number): Box => Math.min(5, Math.max(1, n)) as Box;

/**
 * Spec §9.5. A new card starts in box 1 the first time it is seen.
 * Again → box 1. Hard → same box. Good → next box. Easy → two boxes up. Box 5 is the top.
 * The card is then due after its new box's interval.
 */
export function rateCard(prev: CardProgress | undefined, rating: Rating, today: string, now: number): CardProgress {
  const box = prev?.box ?? 1;
  const next = rating === 'again' ? 1 : rating === 'hard' ? box : rating === 'good' ? clampBox(box + 1) : clampBox(box + 2);
  return {
    box: next,
    dueDay: addDays(today, BOX_DAYS[next - 1] ?? 1),
    again: (prev?.again ?? 0) + (rating === 'again' ? 1 : 0),
    lastDay: today,
    updatedAt: now,
  };
}

/** New cards are due right away. */
export function isDue(p: CardProgress | undefined, today: string): boolean {
  return p === undefined || p.dueDay <= today;
}
