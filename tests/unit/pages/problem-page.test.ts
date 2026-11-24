import { describe, expect, it } from 'vitest';
import { mountSpotFirst } from '../../../src/pages/spot-first';
import { mountProblemPage } from '../../../src/pages/problem-page';
import { buildRegistry } from '../../../src/core/registry';
import { createStore } from '../../../src/core/store';
import { createRecorder, type TraceDef } from '../../../src/engine/trace';
import type { Problem } from '../../../src/content-types';
import type { RunResult } from '../../../src/lab/runner';

const spot = { prompt: 'Which idea fits?', options: ['Check pairs', 'Remember seen'], answer: 1, clues: [{ kind: 'size' as const, text: 'Big n.' }, { kind: 'bottleneck' as const, text: 'Repeated search.' }] };

describe('mountSpotFirst', () => {
  it('asks first, then reveals clues', () => {
    const host = document.createElement('div');
    mountSpotFirst(host, spot);
    const check = host.querySelector<HTMLButtonElement>('[data-testid="spot-check"]')!;
    check.click();
    expect(host.querySelector('[data-testid="spot-result"]')!.textContent).toContain('Pick an answer first');
    host.querySelectorAll<HTMLInputElement>('input[name="spot-option"]')[1]!.click();
    host.querySelector<HTMLButtonElement>('.clue-chip')!.click();
    check.click();
    const result = host.querySelector('[data-testid="spot-result"]')!.textContent!;
    expect(result).toContain('Right');
    expect(result).toContain('Repeated search.');
    expect(result).toContain('You used: size');
  });
});

const trace: TraceDef = {
  id: 'p/optimal', maxSteps: 10, inputFields: [], parseInput: () => ({ ok: true, value: {} }), formatInput: () => ({}), fromArgs: () => ({ nums: [1, 1] }),
  run: () => { const r = createRecorder(); r.step({ line: 'a', vars: {}, views: [], note: 'Optimal step.' }); return r.finish(true); },
};

const problem = {
  id: 'p', moduleId: 'm', title: 'Problem P', patternIds: ['hashing'], difficulty: 'easy', core: true, sheets: ['neetcode150'], source: { name: 'LeetCode 1', url: 'https://leetcode.com/problems/x/' },
  statement: '<p>Do it.</p>', limits: ['1 ≤ n ≤ 10'], examples: [{ input: 'nums = [1, 1]', output: 'true', note: 'Repeat.' }],
  spot, hints: ['Hint one.', 'Hint two.', 'Hint three.'],
  approaches: [
    { level: 'brute', title: 'Pairs', idea: 'Check pairs.', java: 'class Solution { /* brute */ }', time: 'O(n²)', space: 'O(1)', nextStepRemoves: 'Removes the search.' },
    { level: 'optimal', title: 'Set', idea: 'Use a set.', java: 'class Solution { /* optimal */ } // @L:a', time: 'O(n)', space: 'O(n)', traceId: 'p/optimal' },
  ],
  edgeCases: ['One item.', 'All same.'], mistakes: ['M1.', 'M2.'], explain30: 'Thirty seconds.', hook: 'Seen it? Set.',
  related: [{ title: 'Two Sum', why: 'Same lookup idea.' }], lookAlikes: [],
  spec: { className: 'Solution', method: 'f', params: [{ name: 'nums', type: 'int[]' }], returns: 'boolean', compare: 'exact', samples: [{ id: 's1', args: [[1, 1]], expected: true }], hidden: [] },
  starter: 'class Solution {}',
} as unknown as Problem;

describe('mountProblemPage', () => {
  it('renders parts, reveals hints one at a time and loads code into the lab', () => {
    const registry = buildRegistry({ modules: [], lessons: [], problems: [problem], traces: [trace] });
    const d: Record<string, string> = {};
    const host = document.createElement('div');
    document.body.append(host);
    let editorValue = '';
    const makeEditor = (_p: HTMLElement, doc: string) => {
      editorValue = doc;
      return { getValue: () => editorValue, setValue: (v: string) => { editorValue = v; }, focus() {}, destroy() {} };
    };
    const dispose = mountProblemPage(host, problem, { registry, makeEditor, store: createStore({ getItem: (k) => d[k] ?? null, setItem: (k, v) => { d[k] = v; } }), runner: { ready: async () => {}, run: async () => ({ kind: 'tests', results: [], stdout: '' }), stop() {} } });
    for (const id of ['problem', 'spot', 'hints', 'lab', 'approaches', 'dry-run', 'compare', 'edge-cases', 'reveal', 'mistakes', 'explain', 'hook', 'related']) expect(host.querySelector(`#${id}`)).not.toBeNull();
    const next = host.querySelector<HTMLButtonElement>('[data-testid="hint-next"]')!;
    expect(host.querySelectorAll('.hint:not([hidden])')).toHaveLength(0);
    next.click();
    expect(host.querySelectorAll('.hint:not([hidden])')).toHaveLength(1);
    next.click(); next.click();
    expect(next.disabled).toBe(true);
    expect(host.querySelector('.player')).toBeNull();
    expect(host.querySelector('#approaches')!.closest('[hidden]')).not.toBeNull();
    (host.querySelector('[data-testid="show-solutions"]') as HTMLButtonElement).click();
    expect(host.querySelector('#approaches')!.closest('[hidden]')).toBeNull();
    expect(host.querySelectorAll('.player')).toHaveLength(1);
    expect(document.activeElement).toBe(host.querySelector('#approaches h2'));
    expect(host.querySelector('.player-note')!.textContent).toBe('Optimal step.');
    (host.querySelector('[data-testid="load-into-lab-optimal"]') as HTMLButtonElement).click();
    expect(editorValue).toContain('/* optimal */');
    expect(editorValue).not.toContain('@L:');
    dispose();
    host.remove();
  });

  function mount() {
    const registry = buildRegistry({ modules: [], lessons: [], problems: [problem], traces: [trace] });
    const d: Record<string, string> = {};
    const host = document.createElement('div');
    document.body.append(host);
    const makeEditor = () => ({ getValue: () => '', setValue() {}, focus() {}, destroy() {} });
    const dispose = mountProblemPage(host, problem, { registry, makeEditor, store: createStore({ getItem: (k) => d[k] ?? null, setItem: (k, v) => { d[k] = v; } }), runner: { ready: async () => {}, run: async () => ({ kind: 'tests', results: [], stdout: '' }), stop() {} } });
    return { host, dispose };
  }

  it('cleans up after a reveal', () => {
    const { host, dispose } = mount();
    (host.querySelector('[data-testid="show-solutions"]') as HTMLButtonElement).click();
    expect(host.querySelector('.player')).not.toBeNull();
    expect(() => dispose()).not.toThrow();
    expect(host.innerHTML).toBe('');
    host.remove();
  });

  it('cleans up without a reveal', () => {
    const { host, dispose } = mount();
    expect(host.querySelector('[data-testid="show-solutions"]')).not.toBeNull();
    expect(() => dispose()).not.toThrow();
    host.remove();
  });
});


describe('problem progress (Part 1b)', () => {
  const pass = { id: 'h', kind: 'hidden' as const, pass: true, input: '', expected: '', actual: '', stdout: '', timeMs: 1 };
  function mountWith(result: RunResult) {
    const registry = buildRegistry({ modules: [], lessons: [], problems: [problem], traces: [trace] });
    const d: Record<string, string> = {};
    const store = createStore({ getItem: (k) => d[k] ?? null, setItem: (k, v) => { d[k] = v; } });
    const host = document.createElement('div');
    document.body.append(host);
    const makeEditor = () => ({ getValue: () => 'class Solution {}', setValue() {}, focus() {}, destroy() {} });
    const dispose = mountProblemPage(host, problem, { registry, makeEditor, store, runner: { ready: async () => {}, run: async () => result, stop() {} }, now: () => 5000 });
    return { host, store, dispose };
  }
  const flush = () => new Promise((r) => setTimeout(r, 0));

  it('records the open and the first peek, and has a progress box', () => {
    const { host, store, dispose } = mountWith({ kind: 'tests', results: [pass], stdout: '' });
    expect(store.get().problems.p?.openedAt).toBe(5000);
    expect(host.querySelector('#progress [data-testid="track-level"]')).not.toBeNull();
    (host.querySelector('[data-testid="show-solutions"]') as HTMLButtonElement).click();
    expect(store.get().problems.p?.revealedAt).toBe(5000);
    dispose();
    host.remove();
  });

  it('sets level 2 when Submit passes before a peek', async () => {
    const { host, store, dispose } = mountWith({ kind: 'tests', results: [pass], stdout: '' });
    (host.querySelector('[data-testid="lab-run"]') as HTMLButtonElement).click();
    await flush();
    expect(store.get().problems.p?.solvedAt).toBeUndefined();
    (host.querySelector('[data-testid="lab-submit"]') as HTMLButtonElement).click();
    await flush();
    expect(store.get().problems.p).toMatchObject({ solvedAt: 5000, marks: { solvedAlone: 5000 } });
    expect(host.querySelector('[data-testid="track-level"]')!.textContent).toBe('Level 2 of 5: Solved alone');
    dispose();
    host.remove();
  });

  it('does not solve on a failing Submit', async () => {
    const { host, store, dispose } = mountWith({ kind: 'tests', results: [{ ...pass, pass: false }], stdout: '' });
    (host.querySelector('[data-testid="lab-submit"]') as HTMLButtonElement).click();
    await flush();
    expect(store.get().problems.p?.solvedAt).toBeUndefined();
    dispose();
    host.remove();
  });
});
