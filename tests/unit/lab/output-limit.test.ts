import { describe, expect, it } from 'vitest';
import { createOutputLimit, MAX_OUTPUT_CHARS, MAX_OUTPUT_LINES, OUTPUT_HIDDEN } from '../../../src/lab/output-limit';
import { parseHarnessOutput } from '../../../src/lab/parse-output';

const end = (id: string) => `@@END {"id":"${id}","ok":true,"ms":1,"actual":false}`;

describe('createOutputLimit', () => {
  it('stops after 1,000 learner lines, says so once, and keeps every harness line', () => {
    expect(MAX_OUTPUT_LINES).toBe(1000);
    const limit = createOutputLimit();
    const out: string[] = [...limit('@@BEGIN speed')];
    for (let i = 0; i < 100_000; i++) out.push(...limit(String(i)));
    out.push(...limit(end('speed')));
    expect(out.filter((l) => !l.startsWith('@@'))).toHaveLength(1001);
    expect(out.filter((l) => l === OUTPUT_HIDDEN)).toHaveLength(1);
    expect(out[1000]).toBe('999');
    expect(out[1001]).toBe(OUTPUT_HIDDEN);
    expect(out[0]).toBe('@@BEGIN speed');
    expect(out.at(-1)).toBe(end('speed'));
    const parsed = parseHarnessOutput(out, ['speed']);
    expect(parsed.tests[0]).toMatchObject({ finished: true, ok: true, actual: false });
    expect(parsed.tests[0]!.stdout.endsWith(`999\n${OUTPUT_HIDDEN}`)).toBe(true);
  });

  it('stops after 64 KB, whichever comes first', () => {
    expect(MAX_OUTPUT_CHARS).toBe(64 * 1024);
    const limit = createOutputLimit();
    const big = 'x'.repeat(10_000);
    const out: string[] = [];
    for (let i = 0; i < 10; i++) out.push(...limit(big));
    expect(out.filter((l) => l === big)).toHaveLength(6);
    expect(out.filter((l) => l === OUTPUT_HIDDEN)).toHaveLength(1);
    expect(out).toHaveLength(7);
  });

  it('keeps a harness end line that is glued to learner text', () => {
    const limit = createOutputLimit(1, 100);
    expect(limit('a')).toEqual(['a']);
    expect(limit(`no newline${end('s1')}`)).toEqual([OUTPUT_HIDDEN, end('s1')]);
    expect(limit(`more${end('s2')}`)).toEqual([end('s2')]);
    const fresh = createOutputLimit(5, 100);
    expect(fresh(`hi${end('s1')}`)).toEqual([`hi${end('s1')}`]);
  });
});
