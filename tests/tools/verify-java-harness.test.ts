import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterAll, describe, expect, it } from 'vitest';
import type { Problem } from '../../src/content-types';
import { verifyProblemOnJdk } from '../../tools/verify-java';

const good = `import java.util.*;
class Solution {
    public boolean containsDuplicate(int[] nums) {
        Set<Integer> seen = new HashSet<>(); // @L:init
        for (int n : nums) if (!seen.add(n)) return true;
        return false;
    }
}`;
const slow = `class Solution {
    public boolean containsDuplicate(int[] nums) {
        for (int i = 0; i < nums.length; i++) for (int j = i + 1; j < nums.length; j++) if (nums[i] == nums[j]) return true;
        return false;
    }
}`;
const wrong = `class Solution { public boolean containsDuplicate(int[] nums) { return false; } }`;

function fixture(approaches: Problem['approaches']): Problem {
  return {
    id: 'fixture', starter: 'import java.util.*;\nclass Solution {\n    public boolean containsDuplicate(int[] nums) {\n        return false;\n    }\n}\n',
    approaches,
    spec: {
      className: 'Solution', method: 'containsDuplicate', params: [{ name: 'nums', type: 'int[]' }], returns: 'boolean', compare: 'exact',
      samples: [{ id: 's1', args: [[1, 2, 3, 1]], expected: true }, { id: 's2', args: [[1, 2, 3]], expected: false }],
      hidden: [{ id: 'h1', args: [[7]], expected: false }],
      // 200,000 numbers: about 2 × 10^10 pair checks for the slow version, so it clearly misses 2 s.
      speed: { id: 'speed', args: [{ gen: 'intRange', n: 200000 }], expected: false, timeLimitMs: 2000 },
    },
  } as unknown as Problem;
}

const dirs: string[] = [];
const work = () => {
  const d = mkdtempSync(join(tmpdir(), 'dsa-verify-'));
  dirs.push(d);
  return d;
};
afterAll(() => {
  for (const d of dirs) rmSync(d, { recursive: true, force: true });
});

describe('verifyProblemOnJdk', () => {
  it('passes a correct optimal and a slow brute force', () => {
    const issues = verifyProblemOnJdk(fixture([
      { level: 'brute', title: 'b', idea: 'i', java: slow, time: 'O(n^2)', space: 'O(1)', nextStepRemoves: 'x' },
      { level: 'optimal', title: 'o', idea: 'i', java: good, time: 'O(n)', space: 'O(n)' },
    ]), work());
    expect(issues).toEqual([]);
  });
  it('reports a wrong answer and a compile error', () => {
    const issues = verifyProblemOnJdk(fixture([
      { level: 'brute', title: 'b', idea: 'i', java: 'class Solution { oops }', time: 'O(1)', space: 'O(1)', nextStepRemoves: 'x' },
      { level: 'optimal', title: 'o', idea: 'i', java: wrong, time: 'O(1)', space: 'O(1)' },
    ]), work());
    expect(issues.some((i) => i.approach === 'brute' && i.message.startsWith('javac failed'))).toBe(true);
    expect(issues.some((i) => i.approach === 'optimal' && i.testId === 's1')).toBe(true);
  });
  it('reports an optimal that is too slow for the speed test', () => {
    const issues = verifyProblemOnJdk(fixture([{ level: 'optimal', title: 'o', idea: 'i', java: slow, time: 'O(n)', space: 'O(1)' }]), work());
    expect(issues.some((i) => i.testId === 'speed')).toBe(true);
  });
});
