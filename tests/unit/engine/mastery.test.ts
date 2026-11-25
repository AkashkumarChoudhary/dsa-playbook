import { describe, expect, it } from 'vitest';
import { defaultState, type StoredState } from '../../../src/core/store';
import { DAY_MS } from '../../../src/engine/days';
import { isMastered, lastActivity, lessonDone, patternStatus, problemLevel, type MasteryData } from '../../../src/engine/mastery';

const NOW = new Date(2026, 10, 24, 10).getTime();

const data: MasteryData = {
  patterns: [{ id: 'hashing', moduleId: 'm', lessonId: 'set-lesson', title: 'HashSet' }],
  allProblems: [
    { id: 'core1', patternIds: ['hashing'], core: true },
    { id: 'core2', patternIds: ['hashing'], core: true },
    { id: 'extra', patternIds: ['hashing'], core: false },
  ],
  cards: [1, 2, 3, 4, 5].map((n) => ({ id: `c${n}`, patternIds: ['hashing'] })),
};

/** Both core problems at level 3, 8 of the last 10 drills right (d0 and d1 wrong), 4 of 5 cards in box 3. */
function masteredState(at = NOW): StoredState {
  const s = defaultState();
  for (const id of ['core1', 'core2']) s.problems[id] = { marks: { canExplain: at }, solvedAt: at, resolveSteps: 0, updatedAt: at };
  for (let i = 0; i < 10; i++) s.drills[`d${i}`] = { itemId: 'x', patternIds: ['hashing'], correct: i >= 2, at: at - i };
  for (let n = 1; n <= 4; n++) s.cards[`c${n}`] = { box: 3, dueDay: '2026-12-01', again: 0, lastDay: '2026-11-24', updatedAt: at };
  return s;
}

describe('lessonDone and problemLevel', () => {
  it('needs a passed quiz', () => {
    const s = defaultState();
    s.lessons.a = { openedAt: 1, bestScore: 1, total: 3, updatedAt: 1 };
    s.lessons.b = { openedAt: 1, bestScore: 2, total: 3, passedAt: 2, updatedAt: 2 };
    expect(lessonDone(s, 'a')).toBe(false);
    expect(lessonDone(s, 'b')).toBe(true);
    expect(lessonDone(s, 'zzz')).toBe(false);
  });
  it('computes level 5 only at level 4 with the pattern mastered', () => {
    const s = masteredState();
    s.problems.core1!.marks.fromMemory = NOW;
    expect(problemLevel('core1', s, data)).toBe(5);
    expect(problemLevel('core2', s, data)).toBe(3);
    s.drills.d2!.correct = false;
    expect(problemLevel('core1', s, data)).toBe(4);
    expect(problemLevel('none', s, data)).toBe(0);
  });
});

describe('isMastered (spec §9.3)', () => {
  it('holds when all three parts hold', () => {
    expect(isMastered('hashing', masteredState(), data)).toBe(true);
  });
  it('needs every core problem at level 3', () => {
    const s = masteredState();
    s.problems.core2!.marks = { understood: NOW };
    expect(isMastered('hashing', s, data)).toBe(false);
  });
  it('needs 10 drills with 8 right', () => {
    const s = masteredState();
    delete s.drills.d9;
    expect(isMastered('hashing', s, data)).toBe(false);
    const t = masteredState();
    t.drills.d2!.correct = false;
    expect(isMastered('hashing', t, data)).toBe(false);
  });
  it('needs 80% of the cards in box 3 or higher', () => {
    const s = masteredState();
    s.cards.c4!.box = 2;
    expect(isMastered('hashing', s, data)).toBe(false);
  });
  it('is false for a pattern with no core problem', () => {
    expect(isMastered('hashing', masteredState(), { ...data, allProblems: [] })).toBe(false);
  });
});

describe('patternStatus (spec §9.4)', () => {
  it('goes not started → learning → practicing → mastered', () => {
    const s = defaultState();
    expect(patternStatus('hashing', s, data, NOW)).toBe('not-started');
    s.lessons['set-lesson'] = { openedAt: NOW, bestScore: 0, total: 0, updatedAt: NOW };
    expect(patternStatus('hashing', s, data, NOW)).toBe('learning');
    s.problems.extra = { marks: {}, solvedElsewhere: NOW, resolveSteps: 0, updatedAt: NOW };
    expect(patternStatus('hashing', s, data, NOW)).toBe('practicing');
    expect(patternStatus('hashing', masteredState(), data, NOW)).toBe('mastered');
  });
  it('fades after 30 days with no activity', () => {
    const s = masteredState(NOW - 31 * DAY_MS);
    expect(lastActivity('hashing', s, data)).toBe(NOW - 31 * DAY_MS);
    expect(patternStatus('hashing', s, data, NOW)).toBe('fading');
    expect(patternStatus('hashing', s, data, NOW - 2 * DAY_MS)).toBe('mastered');
  });
  it('fades when the last 10 drills drop below 80%', () => {
    const s = masteredState();
    for (let i = 0; i < 3; i++) s.drills[`late${i}`] = { itemId: 'x', patternIds: ['hashing'], correct: false, at: NOW + 1 + i };
    expect(patternStatus('hashing', s, data, NOW + 10)).toBe('fading');
  });
  it('is mastered again after a good run', () => {
    const s = masteredState();
    for (let i = 0; i < 3; i++) s.drills[`late${i}`] = { itemId: 'x', patternIds: ['hashing'], correct: false, at: NOW + 1 + i };
    for (let i = 0; i < 10; i++) s.drills[`again${i}`] = { itemId: 'x', patternIds: ['hashing'], correct: true, at: NOW + 10 + i };
    expect(patternStatus('hashing', s, data, NOW + 30)).toBe('mastered');
  });
});
