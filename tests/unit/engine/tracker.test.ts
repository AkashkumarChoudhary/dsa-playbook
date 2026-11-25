import { describe, expect, it } from 'vitest';
import { DAY_MS, dayKey } from '../../../src/engine/days';
import { allTestsPassed, baseLevel, dueResolves, emptyProblemProgress, firstSolveAt, isSolved, recordOpen, recordReveal, recordSolvedElsewhere, recordSubmitPass, resolveDue, toggleMark } from '../../../src/engine/tracker';

const T0 = new Date(2026, 10, 24, 10).getTime();
const day = (n: number) => T0 + n * DAY_MS;

describe('Submit pass', () => {
  it('sets solvedAt and solved alone when nothing was revealed', () => {
    const p = recordSubmitPass(undefined, T0);
    expect(p.solvedAt).toBe(T0);
    expect(p.marks.solvedAlone).toBe(T0);
    expect(baseLevel(p)).toBe(2);
    expect(isSolved(p)).toBe(true);
  });
  it('does not set solved alone after a peek', () => {
    const p = recordSubmitPass(recordReveal(undefined, T0), day(1));
    expect(p.solvedAt).toBe(day(1));
    expect(p.marks.solvedAlone).toBeUndefined();
    expect(baseLevel(p)).toBe(0);
  });
  it('keeps the first solve time', () => {
    const p = recordSubmitPass(recordSubmitPass(undefined, T0), day(1));
    expect(p.solvedAt).toBe(T0);
  });
  it('does not change the input', () => {
    const before = emptyProblemProgress(T0);
    recordSubmitPass(before, T0);
    expect(before).toEqual(emptyProblemProgress(T0));
  });
});

describe('re-solve schedule (+3, +7, +21 days)', () => {
  it('runs three steps from the first solve', () => {
    let p = recordSubmitPass(undefined, T0);
    expect(p.nextResolveAt).toBe(day(3));
    expect(resolveDue(p, day(2))).toBe(false);
    p = recordSubmitPass(p, day(2));
    expect(p.resolveSteps).toBe(0);
    expect(resolveDue(p, day(3))).toBe(true);
    p = recordSubmitPass(p, day(3));
    expect(p.resolveSteps).toBe(1);
    expect(p.nextResolveAt).toBe(day(7));
    p = recordSubmitPass(p, day(7));
    expect(p.resolveSteps).toBe(2);
    expect(p.nextResolveAt).toBe(day(21));
    p = recordSubmitPass(p, day(22));
    expect(p.resolveSteps).toBe(3);
    expect(p.nextResolveAt).toBeUndefined();
    expect(resolveDue(p, day(100))).toBe(false);
    expect(recordSubmitPass(p, day(101)).resolveSteps).toBe(3);
  });
  it('never makes the next step due sooner than a day later', () => {
    let p = recordSubmitPass(undefined, T0);
    p = recordSubmitPass(p, day(10));
    expect(p.resolveSteps).toBe(1);
    expect(p.nextResolveAt).toBe(day(11));
  });
  it('counts "solved elsewhere" as a solve and starts the schedule', () => {
    let p = recordSolvedElsewhere(undefined, T0);
    expect(isSolved(p)).toBe(true);
    expect(p.solvedAt).toBeUndefined();
    expect(p.nextResolveAt).toBe(day(3));
    expect(baseLevel(p)).toBe(0);
    p = recordSolvedElsewhere(p, day(4));
    expect(p.resolveSteps).toBe(1);
    expect(p.solvedElsewhere).toBe(T0);
    p = recordSubmitPass(p, day(5));
    expect(p.solvedAt).toBe(day(5));
    expect(p.marks.solvedAlone).toBe(day(5));
    expect(p.resolveSteps).toBe(1);
    expect(firstSolveAt(p)).toBe(T0);
  });
});

describe('re-solve due by calendar day', () => {
  // Solved on Friday at 23:00, so the first re-solve is due on Monday. The learner comes back on Monday at 09:00.
  const FRI_23 = new Date(2026, 10, 20, 23).getTime();
  const MON_09 = new Date(2026, 10, 23, 9).getTime();

  it('is due from the morning of the due day, and a morning re-solve counts', () => {
    const p = recordSubmitPass(undefined, FRI_23);
    expect(dayKey(p.nextResolveAt!)).toBe('2026-11-23');
    expect(resolveDue(p, MON_09 - DAY_MS)).toBe(false);
    expect(resolveDue(p, MON_09)).toBe(true);
    const submitted = recordSubmitPass(p, MON_09);
    expect(submitted.resolveSteps).toBe(1);
    expect(resolveDue(submitted, MON_09 + 60_000)).toBe(false);
    expect(recordSolvedElsewhere(p, MON_09).resolveSteps).toBe(1);
  });

  it('lists only built problems whose re-solve is due', () => {
    const due = recordSubmitPass(undefined, FRI_23);
    const problems = [{ id: 'a', built: true }, { id: 'b', built: false }, { id: 'c', built: true }, { id: 'd', built: true }];
    const progress = { a: due, b: due, c: recordSubmitPass(undefined, MON_09) };
    expect(dueResolves(problems, progress, MON_09).map((p) => p.id)).toEqual(['a']);
  });

  it('never makes the next step due on the same day, even on the day the clocks go back', () => {
    const tz = process.env.TZ;
    process.env.TZ = 'Europe/London';
    try {
      // 25 Oct 2026 has 25 hours in London, so 24 hours after 00:30 is 23:30 on the same day.
      const first = new Date(2026, 9, 10, 10).getTime();
      const lateNight = new Date(2026, 9, 25, 0, 30).getTime();
      // Prove the time zone switch took effect, or this test would pass without the guard.
      expect(dayKey(lateNight + DAY_MS)).toBe('2026-10-25');
      const p = recordSubmitPass(recordSubmitPass(undefined, first), lateNight);
      expect(p.resolveSteps).toBe(1);
      expect(dayKey(p.nextResolveAt!)).toBe('2026-10-26');
      expect(resolveDue(p, lateNight + 23 * 3_600_000)).toBe(false);
    } finally {
      if (tz === undefined) delete process.env.TZ;
      else process.env.TZ = tz;
    }
  });
});

describe('marks and levels', () => {
  it('toggles ticks, and the highest tick wins', () => {
    let p = toggleMark(undefined, 'understood', T0);
    expect(baseLevel(p)).toBe(1);
    p = toggleMark(p, 'canExplain', T0);
    expect(baseLevel(p)).toBe(3);
    p = toggleMark(p, 'canExplain', T0);
    expect(baseLevel(p)).toBe(1);
    p = toggleMark(p, 'selfMarkedAlone', T0);
    expect(baseLevel(p)).toBe(2);
    p = toggleMark(p, 'fromMemory', T0);
    expect(baseLevel(p)).toBe(4);
  });
  it('records the first peek and the last open', () => {
    let p = recordReveal(undefined, T0);
    p = recordReveal(p, day(1));
    expect(p.revealedAt).toBe(T0);
    p = recordOpen(p, day(2));
    expect(p.openedAt).toBe(day(2));
    expect(p.updatedAt).toBe(day(2));
    expect(baseLevel(undefined)).toBe(0);
  });
});

describe('allTestsPassed', () => {
  const row = (pass: boolean) => ({ id: 'a', kind: 'hidden' as const, pass, input: '', expected: '', actual: '', stdout: '', timeMs: 1 });
  it('needs a full, passing test run', () => {
    expect(allTestsPassed({ kind: 'tests', stdout: '', results: [row(true), row(true)] })).toBe(true);
    expect(allTestsPassed({ kind: 'tests', stdout: '', results: [row(true), row(false)] })).toBe(false);
    expect(allTestsPassed({ kind: 'tests', stdout: '', results: [] })).toBe(false);
    expect(allTestsPassed({ kind: 'timeout', stdout: '', results: [row(true)] })).toBe(false);
    expect(allTestsPassed({ kind: 'compileError', errors: [] })).toBe(false);
  });
});
