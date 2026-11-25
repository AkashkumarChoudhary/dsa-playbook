import { describe, expect, it } from 'vitest';
import { contentInput } from '../../../content';
import type { DrillItem, Pattern, Problem } from '../../../src/content-types';
import { buildRegistry } from '../../../src/core/registry';
import type { DrillAttempt } from '../../../src/core/store';
import { attemptsNewestFirst, buildSession, drillPool, isCorrect, mulberry32, patternAccuracy, problemDrillItem, shuffle } from '../../../src/engine/drills';

const patterns: Pattern[] = [
  { id: 'a', moduleId: 'm1', lessonId: 'la', title: 'Pattern A' },
  { id: 'b', moduleId: 'm1', lessonId: 'lb', title: 'Pattern B' },
  { id: 'c', moduleId: 'm2', lessonId: 'lc', title: 'Pattern C' },
  { id: 'd', moduleId: 'm2', lessonId: 'ld', title: 'Pattern D' },
  { id: 'e', moduleId: 'm3', lessonId: 'le', title: 'Pattern E' },
  { id: 'far', moduleId: 'm9', lessonId: 'lf', title: 'Far pattern' },
];
const order = (m: string) => Number(m.slice(1));
const item = (id: string, accepted: string[], moduleId = 'm1'): DrillItem => ({ id, kind: 'reallife', prompt: `<p>${id}</p>`, acceptedPatternIds: accepted, clueExplanation: 'Because.', moduleId });
const attempt = (patternId: string, correct: boolean, at: number): DrillAttempt => ({ itemId: 'x', patternIds: [patternId], correct, at });

describe('seeded helpers', () => {
  it('gives the same numbers for the same seed', () => {
    const a = mulberry32(42);
    const b = mulberry32(42);
    expect([a(), a(), a()]).toEqual([b(), b(), b()]);
    expect(a()).toBeGreaterThanOrEqual(0);
    expect(shuffle([1, 2, 3, 4, 5], mulberry32(7))).toEqual(shuffle([1, 2, 3, 4, 5], mulberry32(7)));
    expect(shuffle([1, 2, 3, 4, 5], mulberry32(7)).sort()).toEqual([1, 2, 3, 4, 5]);
  });
});

describe('items', () => {
  it('makes an interview item from a built problem, with the title hidden', () => {
    const p = {
      id: 'contains-x', moduleId: 'm1', title: 'Secret Title', patternIds: ['a'], statement: '<p>Find a repeat.</p>', limits: ['n ≤ 10'],
      spot: { prompt: 'Which idea fits <best>?', clues: [{ kind: 'size', text: 'Small n.' }, { kind: 'bottleneck', text: 'Repeated search.' }] },
    } as unknown as Problem;
    const made = problemDrillItem(p);
    expect(made).toEqual({
      id: 'contains-x-interview', kind: 'interview', prompt: '<p>Find a repeat.</p><p><b>Which idea fits &lt;best&gt;?</b></p>', limits: ['n ≤ 10'],
      acceptedPatternIds: ['a'], clueExplanation: 'Size: Small n. Bottleneck: Repeated search.', moduleId: 'm1',
    });
    expect(JSON.stringify(made)).not.toContain('Secret Title');
  });
  it('adds generated items after the hand-written ones in the registry', () => {
    const ids = buildRegistry({ ...contentInput, drills: [item('hand', ['hashing'], 'foundations')] }).drills.map((d) => d.id);
    expect(ids).toEqual(['hand', 'contains-duplicate-interview']);
  });
  it('uses started modules, or one module when scoped', () => {
    const items = [item('x', ['a'], 'm1'), item('y', ['c'], 'm2')];
    expect(drillPool(items, { started: new Set(['m1']) }).map((i) => i.id)).toEqual(['x']);
    expect(drillPool(items, { started: new Set(['m1']), moduleId: 'm2' }).map((i) => i.id)).toEqual(['y']);
    expect(drillPool(items, { started: new Set() })).toEqual([]);
  });
  it('accepts any of the accepted patterns', () => {
    expect(isCorrect(item('x', ['a', 'b']), 'b')).toBe(true);
    expect(isCorrect(item('x', ['a', 'b']), 'c')).toBe(false);
  });
});

describe('accuracy', () => {
  it('counts the last 10 attempts of a pattern, newest first', () => {
    const drills: Record<string, DrillAttempt> = {};
    for (let i = 0; i < 12; i++) drills[`t${i}`] = attempt('a', i >= 2, i);
    drills.other = attempt('b', false, 99);
    const newest = attemptsNewestFirst(drills);
    expect(newest[0]!.at).toBe(99);
    expect(patternAccuracy(newest, 'a')).toEqual({ right: 10, total: 10 });
    expect(patternAccuracy(newest, 'a', 12)).toEqual({ right: 10, total: 12 });
    expect(patternAccuracy(newest, 'zzz')).toEqual({ right: 0, total: 0 });
  });
});

describe('buildSession', () => {
  const items = ['i1', 'i2', 'i3', 'i4', 'i5', 'i6', 'i7', 'i8', 'i9', 'i10', 'i11', 'i12'].map((id, k) => item(id, [k % 2 ? 'a' : 'b']));

  it('picks 10 different items, or fewer when fewer exist', () => {
    const s = buildSession({ items, patterns, moduleOrder: order, attempts: [], seed: 1 });
    expect(s).toHaveLength(10);
    expect(new Set(s.map((q) => q.item.id)).size).toBe(10);
    expect(buildSession({ items: items.slice(0, 3), patterns, moduleOrder: order, attempts: [], seed: 1 })).toHaveLength(3);
    expect(buildSession({ items: [], patterns, moduleOrder: order, attempts: [], seed: 1 })).toEqual([]);
  });

  it('is the same for the same seed', () => {
    const a = buildSession({ items, patterns, moduleOrder: order, attempts: [], seed: 5 });
    const b = buildSession({ items, patterns, moduleOrder: order, attempts: [], seed: 5 });
    expect(a).toEqual(b);
  });

  it('shows the accepted patterns plus near distractors, at least 4 options', () => {
    const [q] = buildSession({ items: [item('x', ['a'])], patterns, moduleOrder: order, attempts: [], seed: 3 });
    expect(q!.options).toHaveLength(4);
    expect(q!.options.map((o) => o.patternId)).toContain('a');
    expect(q!.options.map((o) => o.patternId)).not.toContain('far');
    expect(new Set(q!.options.map((o) => o.patternId)).size).toBe(4);
    const [two] = buildSession({ items: [item('y', ['a', 'c'])], patterns, moduleOrder: order, attempts: [], seed: 3 });
    expect(two!.options).toHaveLength(4);
    expect(two!.options.map((o) => o.title)).toEqual(expect.arrayContaining(['Pattern A', 'Pattern C']));
  });

  it('picks weak patterns more often', () => {
    const attempts: DrillAttempt[] = [];
    for (let i = 0; i < 10; i++) attempts.push(attempt('a', false, 100 - i), attempt('b', true, 50 - i));
    const pool = [...Array.from({ length: 10 }, (_, k) => item(`weak${k}`, ['a'])), ...Array.from({ length: 10 }, (_, k) => item(`strong${k}`, ['b']))];
    let weak = 0;
    for (let seed = 1; seed <= 40; seed++) {
      weak += buildSession({ items: pool, patterns, moduleOrder: order, attempts, seed, size: 5 }).filter((q) => q.item.id.startsWith('weak')).length;
    }
    // Weights are 3 (always wrong) against 1 (always right), so most of the 200 picks are weak items.
    expect(weak).toBeGreaterThan(120);
  });
});
