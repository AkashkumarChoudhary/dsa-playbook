import { describe, expect, it } from 'vitest';
import type { ProblemSpec } from '../../../src/content-types';
import { generateHarness } from '../../../src/lab/harness';

const spec: ProblemSpec = {
  className: 'Solution', method: 'containsDuplicate',
  params: [{ name: 'nums', type: 'int[]' }], returns: 'boolean', compare: 'exact',
  samples: [], hidden: [],
};

describe('generateHarness', () => {
  it('makes one method per test with typed arguments', () => {
    const java = generateHarness(spec, [{ id: 's1', args: [[1, 2, 1]] }, { id: 'speed', args: [{ gen: 'intRange', n: 10 }] }]);
    expect(java).toContain('public class Main');
    expect(java).toContain('t0();');
    expect(java).toContain('t1();');
    expect(java).toContain('int[] a0 = new int[]{1, 2, 1};');
    expect(java).toContain('int[] a0 = HarnessGen.intRange(10);');
    expect(java).toContain('new Solution().containsDuplicate(a0)');
    expect(java).toContain('System.out.println("@@BEGIN s1");');
    expect(java).toContain('catch (Throwable e)');
    expect(java).toContain('final class HarnessJson');
  });
  it('rejects bad ids and wrong argument counts', () => {
    expect(() => generateHarness(spec, [{ id: 'Bad Id', args: [[1]] }])).toThrow('Test id');
    expect(() => generateHarness(spec, [{ id: 's1', args: [] }])).toThrow('expected 1 argument');
  });
});
