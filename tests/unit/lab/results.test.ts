import { describe, expect, it } from 'vitest';
import type { ProblemSpec } from '../../../src/content-types';
import { compareValues } from '../../../src/lab/compare';
import { formatArgs, formatValue } from '../../../src/lab/format';
import { parseHarnessOutput } from '../../../src/lab/parse-output';
import { buildResults, planTests } from '../../../src/lab/results';

const spec: ProblemSpec = {
  className: 'Solution', method: 'f', params: [{ name: 'nums', type: 'int[]' }], returns: 'boolean', compare: 'exact',
  samples: [{ id: 's1', args: [[1, 1]], expected: true }],
  hidden: [{ id: 'h1', args: [[1]], expected: false }],
  speed: { id: 'speed', args: [{ gen: 'intRange', n: 100000 }], expected: false, timeLimitMs: 50 },
};

describe('parseHarnessOutput', () => {
  it('reads results, stdout per test and stray lines', () => {
    const out = parseHarnessOutput([
      'hello before', '@@BEGIN s1', 'debug 1', '@@END {"id":"s1","ok":true,"ms":3,"actual":true}',
      '@@BEGIN h1', '@@END {"id":"h1","ok":false,"ms":0,"error":"java.lang.RuntimeException: boom"}', '@@BEGIN speed',
    ], ['s1', 'h1', 'speed', 'never']);
    expect(out.stray).toBe('hello before');
    expect(out.tests[0]).toEqual({ id: 's1', finished: true, ok: true, ms: 3, actual: true, error: undefined, stdout: 'debug 1' });
    expect(out.tests[1]!.error).toBe('java.lang.RuntimeException: boom');
    expect(out.tests[2]!.finished).toBe(false);
    expect(out.tests[3]!.finished).toBe(false);
  });
  it('keeps a test when print without newline glues the end line on', () => {
    const out = parseHarnessOutput(['@@BEGIN s1', 'x@@END {"id":"s1","ok":true,"ms":1,"actual":true}'], ['s1']);
    expect(out.tests[0]).toMatchObject({ id: 's1', finished: true, ok: true, actual: true });
    expect(out.tests[0]!.stdout).toContain('x');
    expect(out.stray).toBe('');
  });
});

describe('compareValues', () => {
  it('compares by mode', () => {
    expect(compareValues('exact', [1, 2], [1, 2])).toBe(true);
    expect(compareValues('exact', [1, 2], [2, 1])).toBe(false);
    expect(compareValues('unorderedList', [1, 2], [2, 1])).toBe(true);
    expect(compareValues('unorderedNested', [[1, 2], [3]], [[3], [2, 1]])).toBe(true);
    expect(compareValues('unorderedList', [[1, 2]], [[2, 1]])).toBe(false);
    expect(compareValues('float', 0.1 + 0.2, 0.3)).toBe(true);
    expect(compareValues('float', [1.000001], [1])).toBe(true);
    expect(compareValues('float', 1.1, 1)).toBe(false);
    expect(compareValues('unorderedList', 1, 1)).toBe(false);
  });
});

describe('format', () => {
  it('formats values and arguments', () => {
    expect(formatValue([1, 2])).toBe('[1,2]');
    expect(formatValue(null)).toBe('null');
    expect(formatArgs(spec, [[1, 2]])).toBe('nums = [1,2]');
    expect(formatArgs(spec, [{ gen: 'intRange', n: 100000 }])).toBe('nums = 100,000 numbers: 0, 1, 2, … 99,999');
    expect(formatArgs(spec, [{ gen: 'intConst', n: 5, value: 7 }])).toBe('nums = 5 copies of 7');
  });
});

describe('planTests and buildResults', () => {
  it('orders tests by kind', () => {
    expect(planTests(spec, 'samples').map((t) => t.id)).toEqual(['s1']);
    expect(planTests(spec, 'all', [{ id: 'c1', args: [[2]], expected: false }]).map((t) => `${t.kind}:${t.id}`))
      .toEqual(['sample:s1', 'custom:c1', 'hidden:h1', 'speed:speed']);
  });
  it('marks wrong, crashed, slow and unfinished tests', () => {
    const planned = planTests(spec, 'all');
    const raw = parseHarnessOutput([
      '@@BEGIN s1', '@@END {"id":"s1","ok":true,"ms":1,"actual":false}',
      '@@BEGIN h1', '@@END {"id":"h1","ok":false,"ms":0,"error":"java.lang.NullPointerException"}',
      '@@BEGIN speed', '@@END {"id":"speed","ok":true,"ms":900,"actual":false}',
    ], planned.map((p) => p.id)).tests;
    const r = buildResults(spec, planned, raw, 'Did not finish.');
    expect(r[0]).toMatchObject({ id: 's1', pass: false, expected: 'true', actual: 'false', input: 'nums = [1,1]' });
    expect(r[1]).toMatchObject({ id: 'h1', pass: false, error: 'java.lang.NullPointerException' });
    expect(r[2]).toMatchObject({ id: 'speed', pass: false });
    expect(r[2]!.error).toContain('Looks too slow for these limits');
    const unfinished = buildResults(spec, planned, parseHarnessOutput([], planned.map((p) => p.id)).tests, 'Did not finish.');
    expect(unfinished.every((t) => !t.pass && t.error === 'Did not finish.')).toBe(true);
  });
});
