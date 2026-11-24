import { describe, expect, it } from 'vitest';
import type { CardProgress } from '../../../src/core/store';
import { BOX_DAYS, isDue, rateCard } from '../../../src/engine/leitner';

const today = '2026-11-24';
const at = (box: CardProgress['box'], again = 0): CardProgress => ({ box, dueDay: today, again, lastDay: '2026-11-20', updatedAt: 1 });

describe('rateCard (Leitner, 5 boxes)', () => {
  it('uses the intervals 1, 3, 7, 14 and 30 days', () => {
    expect(BOX_DAYS).toEqual([1, 3, 7, 14, 30]);
  });
  it('starts a new card in box 1', () => {
    expect(rateCard(undefined, 'again', today, 5)).toEqual({ box: 1, dueDay: '2026-11-25', again: 1, lastDay: today, updatedAt: 5 });
    expect(rateCard(undefined, 'hard', today, 5)).toMatchObject({ box: 1, dueDay: '2026-11-25', again: 0 });
    expect(rateCard(undefined, 'good', today, 5)).toMatchObject({ box: 2, dueDay: '2026-11-27' });
    expect(rateCard(undefined, 'easy', today, 5)).toMatchObject({ box: 3, dueDay: '2026-12-01' });
  });
  it('Again sends the card to box 1 and counts it', () => {
    expect(rateCard(at(4, 2), 'again', today, 5)).toMatchObject({ box: 1, dueDay: '2026-11-25', again: 3 });
  });
  it('Hard keeps the box and waits that box\'s interval', () => {
    expect(rateCard(at(3), 'hard', today, 5)).toMatchObject({ box: 3, dueDay: '2026-12-01' });
  });
  it('Good moves up one box, Easy moves up two', () => {
    expect(rateCard(at(2), 'good', today, 5)).toMatchObject({ box: 3, dueDay: '2026-12-01' });
    expect(rateCard(at(2), 'easy', today, 5)).toMatchObject({ box: 4, dueDay: '2026-12-08' });
  });
  it('never goes past box 5', () => {
    expect(rateCard(at(4), 'easy', today, 5)).toMatchObject({ box: 5, dueDay: '2026-12-24' });
    expect(rateCard(at(5), 'good', today, 5)).toMatchObject({ box: 5 });
  });
});

describe('isDue', () => {
  it('treats new cards and past due days as due', () => {
    expect(isDue(undefined, today)).toBe(true);
    expect(isDue({ ...at(2), dueDay: '2026-11-23' }, today)).toBe(true);
    expect(isDue({ ...at(2), dueDay: today }, today)).toBe(true);
    expect(isDue({ ...at(2), dueDay: '2026-11-25' }, today)).toBe(false);
  });
});
