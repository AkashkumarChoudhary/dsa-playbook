import { describe, expect, it } from 'vitest';
import { createRecorder, parseIntList, type ArrayView } from '../../../src/engine/trace';

const view = (values: number[]): ArrayView => ({ kind: 'array', id: 'a', label: 'a', values, pointers: [], marks: [] });

describe('createRecorder', () => {
  it('tracks changed vars and copies steps', () => {
    const rec = createRecorder();
    const values = [1, 2];
    rec.step({ line: 'a', vars: { i: '0', x: '1' }, views: [view(values)], note: 'one' });
    values[0] = 99;
    rec.step({ line: 'b', vars: { i: '1', x: '1' }, views: [view(values)], note: 'two' });
    const t = rec.finish(true);
    expect(t.result).toBe(true);
    expect(t.steps[0]!.changed).toEqual([]);
    expect(t.steps[1]!.changed).toEqual(['i']);
    expect((t.steps[0]!.views[0] as ArrayView).values[0]).toBe(1);
  });
});

describe('parseIntList', () => {
  const opts = { min: -10, max: 10, minLength: 1, maxLength: 4 };
  it('accepts common formats', () => {
    expect(parseIntList('3, 8, 1', opts)).toEqual({ ok: true, value: [3, 8, 1] });
    expect(parseIntList('[3,8,-1]', opts)).toEqual({ ok: true, value: [3, 8, -1] });
    expect(parseIntList('3 8 1', opts)).toEqual({ ok: true, value: [3, 8, 1] });
  });
  it('rejects bad input with a plain message', () => {
    expect(parseIntList('3, x', opts)).toEqual({ ok: false, message: 'Use whole numbers separated by commas, like 3, 8, 1, 8.' });
    expect(parseIntList('', opts)).toEqual({ ok: false, message: 'Use between 1 and 4 numbers.' });
    expect(parseIntList('1,2,3,4,5', opts)).toEqual({ ok: false, message: 'Use between 1 and 4 numbers.' });
    expect(parseIntList('11', opts)).toEqual({ ok: false, message: 'Each number must be between -10 and 10.' });
  });
});
