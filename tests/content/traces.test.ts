import { describe, expect, it } from 'vitest';
import { contentInput } from '../../content';
import { buildRegistry } from '../../src/core/registry';
import { parseMarkers } from '../../src/engine/markers';
import { compareValues } from '../../src/lab/compare';

const registry = buildRegistry(contentInput);

for (const problem of contentInput.problems) {
  for (const approach of problem.approaches) {
    if (!approach.traceId) continue;
    describe(`${problem.id} / ${approach.traceId}`, () => {
      const def = registry.trace(approach.traceId as string);
      const markers = parseMarkers(approach.java).lines;
      it('exists', () => expect(def).toBeDefined());
      for (const t of [...problem.spec.samples, ...problem.spec.hidden]) {
        it(`gives the expected answer for ${t.id}`, () => {
          const trace = def!.run(def!.fromArgs(t.args));
          expect(compareValues(problem.spec.compare, t.expected, trace.result)).toBe(true);
          expect(trace.steps.length).toBeLessThanOrEqual(def!.maxSteps);
          for (const s of trace.steps) expect(Object.keys(markers)).toContain(s.line);
        });
      }
    });
  }
}

describe('contains-duplicate notes read well for one number', () => {
  it('uses "is" and "makes" for n = 1, and "are" and "make" for more', () => {
    const brute = registry.trace('contains-duplicate/brute')!;
    const one = brute.run({ nums: [7] }).steps.map((s) => s.note);
    expect(one[0]).toBe('We will compare every pair. There is 1 number.');
    expect(one.at(-1)).toContain('1 number makes 0 pairs.');
    const three = brute.run({ nums: [1, 2, 3] }).steps.map((s) => s.note);
    expect(three[0]).toBe('We will compare every pair. There are 3 numbers.');
    expect(three.at(-1)).toContain('3 numbers make 3 pairs.');
    for (const note of [...one, ...registry.trace('contains-duplicate/optimal')!.run({ nums: [7] }).steps.map((s) => s.note)]) {
      expect(note).not.toMatch(/\b1 numbers\b|\bThere are 1\b|\b1 number make\b/);
    }
  });
});
