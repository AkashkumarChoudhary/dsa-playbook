import { mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { contentInput } from '../../content';
import { verifyProblemOnJdk } from '../../tools/verify-java';

describe('every reference solution passes on the JDK', () => {
  for (const problem of contentInput.problems) {
    it(problem.id, () => {
      const issues = verifyProblemOnJdk(problem, mkdtempSync(join(tmpdir(), 'dsa-verify-')));
      expect(issues.map((i) => `${i.approach} ${i.testId ?? ''}: ${i.message}`)).toEqual([]);
    });
  }
});
