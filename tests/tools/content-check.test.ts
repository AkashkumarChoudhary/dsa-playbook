import { describe, expect, it } from 'vitest';
import { contentInput } from '../../content';
import type { Lesson, Module, Problem } from '../../src/content-types';
import { createRecorder, type TraceDef } from '../../src/engine/trace';
import { checkContent, formatIssues } from '../../tools/content-check';
import { countWords, sentences, stripHtml } from '../../tools/text';

describe('text helpers', () => {
  it('strips tags, code and entities', () => {
    expect(stripHtml('<p>Hi <b>there</b> &amp; you</p><pre>int a;</pre><p>Next <code>x;</code> line</p>')).toBe('Hi there & you\nNext line');
    expect(countWords('One two, three 100,000.')).toBe(4);
    expect(sentences('<p>First one. Second one!</p><ul><li>Item</li></ul>')).toEqual(['First one.', 'Second one!', 'Item']);
  });
});

const trace: TraceDef = {
  id: 'p/optimal', maxSteps: 10, inputFields: [], parseInput: () => ({ ok: true, value: {} }), formatInput: () => ({}), fromArgs: () => ({}),
  run: () => { const r = createRecorder(); r.step({ line: 'a', vars: {}, views: [], note: 'n' }); return r.finish(true); },
};

const mod: Module = { id: 'm', order: 1, level: 'basics', icon: '🧱', title: 'M', summary: 'S.', status: 'building', outcomes: ['o'], lessonIds: ['l'], problemIds: ['p'], quiz: [], cheatsheet: [], glossary: [] };

const lesson: Lesson = {
  id: 'l', moduleId: 'm', title: 'L', minutes: 5, summary: 'A short summary.', example: '<p>An example.</p>', everyday: '<p>A picture.</p>',
  steps: [1, 2, 3].map((n) => ({ icon: '🔢', title: `Step ${n}`, text: 'Do one thing.' })),
  viz: [{ label: 'Run', traceId: 'p/optimal', input: {} }], deep: '<p>More detail.</p>',
  spot: { size: 'Size clue.', words: 'Word clue.', shape: 'Shape clue.', bottleneck: 'Bottleneck clue.' },
  traps: [{ looksLike: 'A thing.', butIs: 'Another thing.', why: 'Because.' }],
  template: { title: 'T', java: 'int x = 0;' }, complexityFacts: [{ q: 'Q?', a: 'O(1)', why: 'Fast.' }],
  realLife: [{ text: 'Used here.', tier: 'educational' }], mistakes: ['One.', 'Two.'], interview: ['One.', 'Two.'],
  quiz: [0, 1, 2].map(() => ({ q: 'Q?', options: ['a', 'b'], answer: 1, why: 'Because.' })), problemIds: ['p'],
};

const problem = {
  id: 'p', moduleId: 'm', title: 'P', patternIds: ['hashing'], difficulty: 'easy', core: true, sheets: [], source: { name: 'LeetCode 1', url: 'https://leetcode.com/problems/x/' },
  statement: '<p>Do the thing.</p>', limits: ['1 ≤ n ≤ 10'], examples: [{ input: 'x', output: 'y' }],
  spot: { prompt: 'Which?', options: ['a', 'b'], answer: 0, clues: [{ kind: 'size', text: 'Small.' }, { kind: 'words', text: 'Words.' }] },
  hints: ['One.', 'Two.', 'Three.'],
  approaches: [
    { level: 'brute', title: 'B', idea: 'Slow.', java: 'class Solution { public boolean f(int[] nums) { return false; } }', time: 'O(n²)', space: 'O(1)', nextStepRemoves: 'Removes the search.' },
    { level: 'optimal', title: 'O', idea: 'Fast.', java: 'class Solution { public boolean f(int[] nums) { return false; } // @L:a\n}', time: 'O(n)', space: 'O(n)', traceId: 'p/optimal' },
  ],
  edgeCases: ['One.', 'Two.'], mistakes: ['One.', 'Two.'], explain30: 'Say it.', hook: 'Hook.', related: [], lookAlikes: [],
  spec: { className: 'Solution', method: 'f', params: [{ name: 'nums', type: 'int[]' }], returns: 'boolean', compare: 'exact', samples: [{ id: 's1', args: [[1]], expected: false }, { id: 's2', args: [[1, 1]], expected: true }], hidden: [{ id: 'h1', args: [[2]], expected: false }, { id: 'h2', args: [[2, 2]], expected: true }, { id: 'h3', args: [[3]], expected: false }] },
  starter: 'class Solution { public boolean f(int[] nums) { return false; } }',
} as Problem;

const fixture = () => ({ modules: [structuredClone(mod)], lessons: [structuredClone(lesson)], problems: [structuredClone(problem)], traces: [trace] });
const errors = (input: ReturnType<typeof fixture>) => checkContent(input).filter((i) => i.level === 'error');

describe('checkContent', () => {
  it('accepts a valid fixture', () => {
    expect(formatIssues(errors(fixture()))).toBe('');
  });
  it('catches style problems', () => {
    const f = fixture();
    f.lessons[0]!.summary = 'It is fast — very fast; truly.';
    const msgs = errors(f).map((i) => i.message).join('\n');
    expect(msgs).toContain('em dash');
    expect(msgs).toContain('semicolon');
  });
  it('catches structure problems', () => {
    const f = fixture();
    f.lessons[0]!.quiz.pop();
    f.lessons[0]!.viz[0]!.traceId = 'missing';
    f.problems[0]!.spec.samples[0]!.args = [[1.5]];
    f.problems[0]!.approaches = f.problems[0]!.approaches.filter((a) => a.level !== 'brute');
    const msgs = errors(f).map((i) => i.message).join('\n');
    expect(msgs).toContain('exactly 3 quiz questions');
    expect(msgs).toContain('unknown trace "missing"');
    expect(msgs).toContain('Expected an int');
    expect(msgs).toContain('needs a brute force approach');
  });
  it('catches later topics without a preview', () => {
    const f = fixture();
    f.lessons[0]!.everyday = '<p>Use a sliding window here.</p>';
    expect(errors(f).map((i) => i.message).join('\n')).toContain('sliding window');
    f.lessons[0]!.everyday = '<p>Use a sliding window here (you will learn it in Module 5).</p>';
    expect(errors(f).map((i) => i.message).join('\n')).not.toContain('sliding window');
  });
  it('catches too many words in the simple part', () => {
    const f = fixture();
    f.lessons[0]!.example = `<p>${'word '.repeat(420)}</p>`;
    expect(errors(f).map((i) => i.message).join('\n')).toContain('simple part');
  });
});

describe('real content', () => {
  it('has no content errors', () => {
    const issues = checkContent(contentInput);
    const warnings = issues.filter((i) => i.level === 'warn');
    if (warnings.length) console.warn(formatIssues(warnings));
    expect(formatIssues(issues.filter((i) => i.level === 'error'))).toBe('');
  });
});
