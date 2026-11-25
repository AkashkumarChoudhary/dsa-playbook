import { describe, expect, it } from 'vitest';
import { contentInput } from '../../content';
import type { Catalog, DrillItem, Lesson, Module, Problem } from '../../src/content-types';
import { buildRegistry } from '../../src/core/registry';
import { createRecorder, type TraceDef } from '../../src/engine/trace';
import { cardFingerprints, readCardLock } from '../../tools/card-lock';
import { checkCardIds, checkContent, formatIssues } from '../../tools/content-check';
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

describe('checkContent fixes', () => {
  const msgs = (f: ReturnType<typeof fixture>) => errors(f).map((i) => `${i.where}: ${i.message}`).join('\n');
  it('checks module prose', () => {
    const f = fixture();
    f.modules[0]!.summary = 'Fast; very fast.';
    expect(msgs(f)).toContain('module m summary: uses a semicolon');
  });
  it('checks complexity facts', () => {
    const f = fixture();
    f.lessons[0]!.complexityFacts[0]!.why = 'Fast; truly.';
    expect(msgs(f)).toContain('complexity fact 1');
  });
  it('flags recursively in module 1', () => {
    const f = fixture();
    f.lessons[0]!.everyday = '<p>Solve it recursively.</p>';
    expect(msgs(f)).toContain('recursion');
  });
  it('exempts previews per term only', () => {
    const f = fixture();
    f.lessons[0]!.everyday = '<p>Later you will learn sorting in Module 7.</p><p>Here we use recursion.</p>';
    const m = msgs(f);
    expect(m).toContain('recursion');
    expect(m).not.toContain('sorting');
  });
  it('flags placeholders in approach java', () => {
    const f = fixture();
    f.problems[0]!.approaches[0]!.java = 'class Solution { // TODO\n}';
    expect(msgs(f)).toContain('placeholder');
  });
  it('does not flag unknown entities as semicolons', () => {
    const f = fixture();
    f.lessons[0]!.everyday = '<p>n &le; 10 &rarr; fine.</p>';
    expect(msgs(f)).not.toContain('semicolon');
    expect(stripHtml('a &#65; &#x42; &hellip; b')).toBe('a A B b');
  });
});

describe('checkContent raw HTML', () => {
  const msgs = (f: ReturnType<typeof fixture>) => errors(f).map((i) => `${i.where}: ${i.message}`).join('\n');
  it('flags script, iframe, event attributes and javascript: links in raw HTML fields', () => {
    const f = fixture();
    f.lessons[0]!.example = '<p>Hi</p><script>alert(1)</script>';
    f.lessons[0]!.everyday = '<p><IFRAME src="https://example.com"></iframe></p>';
    f.lessons[0]!.deep = '<p><img src="x" onerror="alert(1)"></p>';
    f.problems[0]!.statement = '<p><a href="JavaScript:alert(1)">Click</a></p>';
    const m = msgs(f);
    expect(m).toContain('lesson l example: HTML has a <script> tag');
    expect(m).toContain('lesson l everyday: HTML has an <iframe> tag');
    expect(m).toContain('lesson l deep: HTML has an on…= event attribute');
    expect(m).toContain('problem p statement: HTML has a javascript: link');
  });
  it('does not flag plain words that look a bit similar', () => {
    const f = fixture();
    f.lessons[0]!.example = '<p>Turn it on = start. A script is a plan.</p>';
    f.problems[0]!.statement = '<p class="lead" data-on="x">Do the thing.</p>';
    expect(msgs(f)).not.toContain('HTML has');
  });
});

describe('catalog, drill and card checks (Part 1b)', () => {
  const catalog = (): Catalog => ({
    modules: [{ id: 'm', order: 1, level: 'basics', icon: '🧱', title: 'M', part: '1c' }],
    lessons: [{ id: 'l', moduleId: 'm', title: 'L', minutes: 5, patternId: 'hashing' }],
    patterns: [{ id: 'hashing', moduleId: 'm', lessonId: 'l', title: 'HashSet' }],
    problems: [{ id: 'p', title: 'P', moduleId: 'm', difficulty: 'easy', patternIds: ['hashing'], sheets: [], url: 'https://leetcode.com/problems/x/', core: true }],
    sheets: [],
  });
  const drill = (): DrillItem => ({ id: 'd1', kind: 'reallife', prompt: '<p>A plain work task.</p>', acceptedPatternIds: ['hashing'], clueExplanation: 'Words: seen before.', moduleId: 'm' });
  const full = () => ({ ...fixture(), catalog: catalog(), drills: [drill()] });
  const msgs = (f: ReturnType<typeof full>) => checkContent(f).filter((i) => i.level === 'error').map((i) => `${i.where}: ${i.message}`).join('\n');

  it('accepts a matching catalog', () => {
    expect(msgs(full())).toBe('');
  });
  it('needs every built item in the catalog, with the same facts', () => {
    const f = full();
    f.catalog.lessons = [];
    f.catalog.patterns = [];
    f.catalog.problems[0]!.patternIds = [];
    expect(msgs(f)).toContain('lesson l: is not in the catalog');
    const g = full();
    g.problems[0]!.patternIds = ['other'];
    g.problems[0]!.sheets = ['neetcode150'];
    g.problems[0]!.core = false;
    const m = msgs(g);
    expect(m).toContain('problem p: patternIds must match the catalog (hashing)');
    expect(m).toContain('problem p: sheets must match the catalog (none)');
    expect(m).toContain('problem p: core must match the catalog (true)');
    const h = full();
    h.problems[0]!.id = 'q';
    h.modules[0]!.problemIds = ['q'];
    h.lessons[0]!.problemIds = ['q'];
    expect(msgs(h)).toContain('problem q: is not in the catalog');
  });
  it('needs a core problem for every pattern', () => {
    const f = full();
    f.catalog.problems[0]!.core = false;
    f.problems[0]!.core = false;
    expect(msgs(f)).toContain('catalog pattern hashing: needs at least 1 core problem.');
  });
  it('checks sheets', () => {
    const f = full();
    f.catalog.sheets = [{ id: 'neetcode150', title: 'NeetCode 150', credit: 'c', problemIds: ['p', 'ghost'] }];
    const m = msgs(f);
    expect(m).toContain('sheet neetcode150: lists unknown problem "ghost".');
    expect(m).toContain('sheet neetcode150: lists "p", but that problem does not name this sheet.');
    expect(m).toContain('sheet neetcode150: must have exactly 150 problems, has 2.');
  });
  it('checks drill items', () => {
    const f = full();
    f.drills[0]!.clueExplanation = 'Use it — always; trust me.';
    f.drills[0]!.acceptedPatternIds = ['ghost'];
    f.drills.push({ ...drill(), prompt: '<p>Use a sliding window here.</p>' });
    const m = msgs(f);
    expect(m).toContain('drill d1 clueExplanation: uses an em dash');
    expect(m).toContain('drill d1 clueExplanation: uses a semicolon');
    expect(m).toContain('drill d1: accepts unknown pattern "ghost".');
    expect(m).toContain('drill d1: duplicate id.');
    expect(m).toContain('drill d1 prompt: uses "sliding window" (taught in Module 5)');
  });
  it('warns when card ids change', () => {
    const cards = buildRegistry(full()).cards;
    const lock: Record<string, string> = { ...cardFingerprints(cards), 'l:trap-9': 'Gone.' };
    lock['l:trap-0'] = 'Something else.';
    delete lock['p:hook'];
    const warns = checkCardIds(cards, lock).map((i) => `${i.level} ${i.where}: ${i.message}`).join('\n');
    expect(warns).toContain('warn card l:trap-9: is gone');
    expect(warns).toContain('warn card l:trap-0: now shows a different item');
    expect(warns).toContain('warn card p:hook: is new');
    expect(checkCardIds(cards, cardFingerprints(cards))).toEqual([]);
  });
});

describe('real content', () => {
  it('has no content errors', () => {
    const issues = checkContent(contentInput, { cardLock: readCardLock() });
    const warnings = issues.filter((i) => i.level === 'warn');
    if (warnings.length) console.warn(formatIssues(warnings));
    expect(formatIssues(issues.filter((i) => i.level === 'error'))).toBe('');
  });
});
