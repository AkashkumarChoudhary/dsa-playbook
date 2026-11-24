import type { ProblemSpec, TestCase } from '../content-types';
import { compareValues } from './compare';
import { formatArgs, formatValue } from './format';
import type { RawTestOutput } from './parse-output';
import type { TestKind, TestResult } from './runner';

export interface PlannedTest {
  id: string;
  kind: TestKind;
  args: unknown[];
  expected: unknown;
  timeLimitMs?: number;
}

export const TOO_SLOW = (ms: number, limit: number) =>
  `Looks too slow for these limits. It took ${ms} ms and the limit is ${limit} ms.`;

export function planTests(spec: ProblemSpec, mode: 'samples' | 'all', extra: TestCase[] = []): PlannedTest[] {
  const plan: PlannedTest[] = spec.samples.map((t) => ({ ...t, kind: 'sample' as const }));
  plan.push(...extra.map((t) => ({ ...t, kind: 'custom' as const })));
  if (mode === 'all') {
    plan.push(...spec.hidden.map((t) => ({ ...t, kind: 'hidden' as const })));
    if (spec.speed) plan.push({ ...spec.speed, kind: 'speed' });
  }
  return plan;
}

export function buildResults(spec: ProblemSpec, planned: PlannedTest[], raw: RawTestOutput[], notFinished: string): TestResult[] {
  return planned.map((p, i) => {
    const r = raw[i];
    const base = { id: p.id, kind: p.kind, input: formatArgs(spec, p.args), expected: formatValue(p.expected), stdout: r?.stdout ?? '', timeMs: r?.ms ?? 0 };
    if (!r || !r.finished) return { ...base, pass: false, actual: '', error: notFinished };
    if (!r.ok) return { ...base, pass: false, actual: '', error: r.error ?? 'The code threw an error.' };
    const correct = compareValues(spec.compare, p.expected, r.actual);
    if (correct && p.kind === 'speed' && p.timeLimitMs !== undefined && r.ms > p.timeLimitMs) {
      return { ...base, pass: false, actual: formatValue(r.actual), error: TOO_SLOW(r.ms, p.timeLimitMs) };
    }
    return { ...base, pass: correct, actual: formatValue(r.actual) };
  });
}
