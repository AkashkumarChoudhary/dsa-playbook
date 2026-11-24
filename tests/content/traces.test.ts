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
