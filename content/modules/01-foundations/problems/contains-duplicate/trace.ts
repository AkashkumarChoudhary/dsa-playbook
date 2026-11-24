import { createRecorder, parseIntList, type ArrayView, type HashView, type MarkColor, type ParseResult, type TraceDef } from '../../../../../src/engine/trace';

interface Input {
  nums: number[];
}

const fields = [{ name: 'nums', label: 'nums', placeholder: '3, 8, 1, 8' }];
const LIMITS = { min: -1_000_000_000, max: 1_000_000_000, minLength: 1, maxLength: 20 };

function parse(f: Record<string, string>): ParseResult<Input> {
  const r = parseIntList(f.nums ?? '', LIMITS);
  return r.ok ? { ok: true, value: { nums: r.value } } : r;
}

const plural = (n: number, word: string) => `${n} ${word}${n === 1 ? '' : 's'}`;

export const containsDuplicateBrute: TraceDef<Input> = {
  id: 'contains-duplicate/brute',
  maxSteps: 400,
  inputFields: fields,
  parseInput: parse,
  formatInput: (i) => ({ nums: i.nums.join(', ') }),
  fromArgs: (args) => ({ nums: args[0] as number[] }),
  run({ nums }) {
    const rec = createRecorder();
    const arr = (pointers: ArrayView['pointers'], marks: ArrayView['marks']): ArrayView => ({ kind: 'array', id: 'nums', label: 'nums', values: nums, pointers, marks });
    let checks = 0;
    const pairs = (nums.length * (nums.length - 1)) / 2;
    rec.step({ line: 'outer', vars: { i: '-', j: '-', checks: '0' }, views: [arr([], [])], note: `We will compare every pair. There ${nums.length === 1 ? 'is' : 'are'} ${plural(nums.length, 'number')}.` });
    for (let i = 0; i < nums.length; i++) {
      for (let j = i + 1; j < nums.length; j++) {
        checks++;
        const same = nums[i] === nums[j];
        const color: MarkColor = same ? 'answer' : 'current';
        const vars = { i: String(i), j: String(j), checks: String(checks) };
        const view = arr([{ name: 'i', index: i }, { name: 'j', index: j }], [{ index: i, color }, { index: j, color }]);
        const start = j === i + 1 ? `i moved to ${i}. j starts right after it, so a number is never compared with itself. ` : '';
        rec.step({
          line: 'compare',
          vars,
          views: [view],
          note: same
            ? `${start}nums[${i}] = ${nums[i]} and nums[${j}] = ${nums[j]}. They are equal, so we found a repeat.`
            : `${start}nums[${i}] = ${nums[i]} and nums[${j}] = ${nums[j]}. They are different, so we try the next j.`,
        });
        if (same) {
          rec.step({ line: 'found', vars, views: [view], note: `We found a repeat. Return true after ${plural(checks, 'check')}.` });
          return rec.finish(true);
        }
      }
    }
    rec.step({ line: 'none', vars: { i: '-', j: '-', checks: String(checks) }, views: [arr([], [])], note: `No pair matched. ${plural(nums.length, 'number')} ${nums.length === 1 ? 'makes' : 'make'} ${plural(pairs, 'pair')}. The work grows fast as the list grows. Return false.` });
    return rec.finish(false);
  },
};

export const containsDuplicateOptimal: TraceDef<Input> = {
  id: 'contains-duplicate/optimal',
  maxSteps: 100,
  inputFields: fields,
  parseInput: parse,
  formatInput: (i) => ({ nums: i.nums.join(', ') }),
  fromArgs: (args) => ({ nums: args[0] as number[] }),
  run({ nums }) {
    const rec = createRecorder();
    const seen: number[] = [];
    const set = (key?: string, color?: MarkColor): HashView => ({ kind: 'hash', id: 'seen', label: 'seen', mode: 'set', entries: seen.map((v) => ({ key: String(v) })), highlightKey: key, highlightColor: color });
    const arr = (index: number | null, color: MarkColor): ArrayView => ({ kind: 'array', id: 'nums', label: 'nums', values: nums, pointers: index === null ? [] : [{ name: 'num', index }], marks: index === null ? [] : [{ index, color }] });
    rec.step({ line: 'init', vars: { num: '-', 'seen size': '0' }, views: [arr(null, 'current'), set()], note: 'Start with an empty set called seen.' });
    for (let k = 0; k < nums.length; k++) {
      const v = nums[k] as number;
      if (seen.includes(v)) {
        const vars = { num: String(v), 'seen size': String(seen.length) };
        rec.step({ line: 'check', vars, views: [arr(k, 'answer'), set(String(v), 'answer')], note: `${v} is already in seen, so add() returns false. We found a repeat.` });
        rec.step({ line: 'found', vars, views: [arr(k, 'answer'), set(String(v), 'answer')], note: 'Return true. We never had to look back at the list.' });
        return rec.finish(true);
      }
      seen.push(v);
      rec.step({ line: 'check', vars: { num: String(v), 'seen size': String(seen.length) }, views: [arr(k, 'current'), set(String(v), 'current')], note: `${v} was not in seen. add() puts it in and returns true, so we keep going.` });
    }
    rec.step({ line: 'none', vars: { num: '-', 'seen size': String(seen.length) }, views: [arr(null, 'current'), set()], note: 'We reached the end with no repeat. Return false.' });
    return rec.finish(false);
  },
};
