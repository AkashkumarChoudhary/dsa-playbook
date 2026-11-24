import { describe, expect, it } from 'vitest';
import { addDays, dayKey, daysBetween, formatDay, isDayKey, lastNDays, streak } from '../../../src/engine/days';

describe('day keys', () => {
  it('uses the local calendar day', () => {
    expect(dayKey(new Date(2026, 10, 24, 0, 5).getTime())).toBe('2026-11-24');
    expect(dayKey(new Date(2026, 10, 24, 23, 55).getTime())).toBe('2026-11-24');
    expect(dayKey(new Date(2026, 0, 3, 12).getTime())).toBe('2026-01-03');
  });
  it('checks the shape', () => {
    expect(isDayKey('2026-11-24')).toBe(true);
    expect(isDayKey('2026-1-24')).toBe(false);
    expect(isDayKey('today')).toBe(false);
  });
  it('adds days across months, years and leap days', () => {
    expect(addDays('2026-11-24', 1)).toBe('2026-11-25');
    expect(addDays('2026-11-30', 1)).toBe('2026-12-01');
    expect(addDays('2026-12-31', 1)).toBe('2027-01-01');
    expect(addDays('2028-02-28', 1)).toBe('2028-02-29');
    expect(addDays('2026-03-01', -1)).toBe('2026-02-28');
    expect(addDays('2026-11-24', 30)).toBe('2026-12-24');
  });
  it('counts days between', () => {
    expect(daysBetween('2026-11-24', '2026-11-24')).toBe(0);
    expect(daysBetween('2026-11-24', '2026-12-01')).toBe(7);
    expect(daysBetween('2026-12-01', '2026-11-24')).toBe(-7);
    expect(daysBetween('2026-03-28', '2026-03-30')).toBe(2);
  });
  it('lists the last n days, oldest first', () => {
    expect(lastNDays('2026-11-24', 3)).toEqual(['2026-11-22', '2026-11-23', '2026-11-24']);
    expect(lastNDays('2026-11-24', 84)).toHaveLength(84);
  });
  it('formats a day for people', () => {
    expect(formatDay('2026-11-24')).toBe('24 Nov 2026');
  });
});

describe('streak', () => {
  const today = '2026-11-24';
  it('is 0 with no activity', () => {
    expect(streak({}, today)).toBe(0);
  });
  it('counts days in a row up to today', () => {
    expect(streak({ '2026-11-22': 1, '2026-11-23': 2, '2026-11-24': 1 }, today)).toBe(3);
  });
  it('keeps yesterday\'s streak while today is still empty', () => {
    expect(streak({ '2026-11-22': 1, '2026-11-23': 2 }, today)).toBe(2);
  });
  it('stops at a gap', () => {
    expect(streak({ '2026-11-20': 1, '2026-11-22': 1, '2026-11-23': 1, '2026-11-24': 1 }, today)).toBe(3);
    expect(streak({ '2026-11-21': 4 }, today)).toBe(0);
  });
});
