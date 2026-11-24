import { describe, expect, it } from 'vitest';
import { DAY_MS } from '../../../src/engine/days';
import { allTestsPassed, baseLevel, emptyProblemProgress, firstSolveAt, isSolved, recordOpen, recordReveal, recordSolvedElsewhere, recordSubmitPass, resolveDue, toggleMark } from '../../../src/engine/tracker';

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
