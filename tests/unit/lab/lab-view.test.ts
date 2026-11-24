import { describe, expect, it, vi } from 'vitest';
import type { Problem } from '../../../src/content-types';
import { createStore } from '../../../src/core/store';
import { mountLab } from '../../../src/lab/lab-view';
import type { JavaRunner, RunRequest, RunResult } from '../../../src/lab/runner';

const problem = {
  id: 'contains-duplicate', title: 'Contains Duplicate', source: { name: 'LeetCode 217', url: 'https://leetcode.com/problems/contains-duplicate/' },
  starter: 'class Solution {}',
  spec: { className: 'Solution', method: 'containsDuplicate', params: [{ name: 'nums', type: 'int[]' }], returns: 'boolean', compare: 'exact', samples: [{ id: 's1', args: [[1, 1]], expected: true }], hidden: [{ id: 'h1', args: [[1]], expected: false }] },
} as unknown as Problem;

function fakeEditor() {
  let value = '';
  let change: (v: string) => void = () => {};
  const api = {
    make: (_p: HTMLElement, doc: string, onChange: (v: string) => void) => { value = doc; change = onChange; return { getValue: () => value, setValue: (v: string) => { value = v; change(v); }, focus() {}, destroy() {} }; },
    type: (v: string) => { value = v; change(v); },
    get value() { return value; },
  };
  return api;
}

function fakeRunner(result: RunResult): JavaRunner & { last?: RunRequest } {
  const r: JavaRunner & { last?: RunRequest } = { ready: async () => {}, run: async (req) => { r.last = req; return result; }, stop: vi.fn() };
  return r;
}

const memStore = () => { const d: Record<string, string> = {}; return createStore({ getItem: (k) => d[k] ?? null, setItem: (k, v) => { d[k] = v; } }); };
const flush = () => new Promise((r) => setTimeout(r, 0));

describe('mountLab', () => {
  it('runs samples and shows pass and fail rows', async () => {
    const host = document.createElement('div');
    const ed = fakeEditor();
    const runner = fakeRunner({ kind: 'tests', stdout: 'hi', results: [
      { id: 's1', kind: 'sample', pass: true, input: 'nums = [1,1]', expected: 'true', actual: 'true', stdout: '', timeMs: 1 },
      { id: 'h1', kind: 'hidden', pass: false, input: 'nums = [1]', expected: 'false', actual: 'true', stdout: '', timeMs: 1 },
    ] });
    mountLab(host, problem, { runner, store: memStore(), makeEditor: ed.make });
    (host.querySelector('[data-testid="lab-run"]') as HTMLButtonElement).click();
    await flush();
    expect(runner.last?.mode).toBe('samples');
    const rows = host.querySelectorAll('[data-testid="test-row"]');
    expect(rows).toHaveLength(2);
    expect(rows[0]!.getAttribute('data-pass')).toBe('true');
    expect(rows[1]!.getAttribute('data-pass')).toBe('false');
    expect(host.querySelector('[data-testid="lab-status"]')!.textContent).toContain('1 of 2 passed');
    expect(host.querySelector('[data-testid="lab-console"]')!.textContent).toBe('hi');
  });

  it('shows compile errors with line numbers', async () => {
    const host = document.createElement('div');
    mountLab(host, problem, { runner: fakeRunner({ kind: 'compileError', errors: [{ line: 4, message: 'illegal start of expression' }] }), store: memStore(), makeEditor: fakeEditor().make });
    (host.querySelector('[data-testid="lab-submit"]') as HTMLButtonElement).click();
    await flush();
    expect(host.querySelector('[data-testid="lab-results"]')!.textContent).toContain('Line 4: illegal start of expression');
  });

  it('shows the fallback when Java cannot run', async () => {
    const host = document.createElement('div');
    mountLab(host, problem, { runner: fakeRunner({ kind: 'runnerUnavailable', reason: 'No WasmGC' }), store: memStore(), makeEditor: fakeEditor().make });
    (host.querySelector('[data-testid="lab-run"]') as HTMLButtonElement).click();
    await flush();
    const fb = host.querySelector('[data-testid="lab-fallback"]')!;
    expect(fb.textContent).toContain('No WasmGC');
    expect(fb.querySelector('a')!.getAttribute('href')).toBe('https://leetcode.com/problems/contains-duplicate/');
  });

  it('saves code, loads code and resets', async () => {
    vi.useFakeTimers();
    const store = memStore();
    const ed = fakeEditor();
    const host = document.createElement('div');
    const lab = mountLab(host, problem, { runner: fakeRunner({ kind: 'tests', results: [], stdout: '' }), store, makeEditor: ed.make, confirm: () => true });
    ed.type('class Solution { int x; }');
    vi.advanceTimersByTime(500);
    expect(store.get().code['contains-duplicate']?.source).toBe('class Solution { int x; }');
    lab.loadCode('class Solution { /* optimal */ }');
    expect(ed.value).toBe('class Solution { /* optimal */ }');
    (host.querySelector('[data-testid="lab-reset"]') as HTMLButtonElement).click();
    expect(ed.value).toBe('class Solution {}');
    vi.useRealTimers();
  });

  it('adds a custom test and rejects a bad one', async () => {
    const host = document.createElement('div');
    const runner = fakeRunner({ kind: 'tests', results: [], stdout: '' });
    mountLab(host, problem, { runner, store: memStore(), makeEditor: fakeEditor().make });
    const nums = host.querySelector<HTMLInputElement>('input[name="custom-nums"]')!;
    const expected = host.querySelector<HTMLInputElement>('input[name="custom-expected"]')!;
    nums.value = '[1, 2'; expected.value = 'false';
    (host.querySelector('[data-testid="lab-add-test"]') as HTMLButtonElement).click();
    expect(host.querySelector('.custom-error')!.textContent).toContain('nums');
    nums.value = '[1, 2]';
    (host.querySelector('[data-testid="lab-add-test"]') as HTMLButtonElement).click();
    (host.querySelector('[data-testid="lab-run"]') as HTMLButtonElement).click();
    await flush();
    expect(runner.last?.extraTests).toEqual([{ id: 'c1', args: [[1, 2]], expected: false }]);
  });

  it('recovers when ready() rejects', async () => {
    const host = document.createElement('div');
    const runner: JavaRunner = { ready: async () => { throw new Error('download failed'); }, run: vi.fn(), stop: vi.fn() };
    mountLab(host, problem, { runner, store: memStore(), makeEditor: fakeEditor().make });
    (host.querySelector('[data-testid="lab-run"]') as HTMLButtonElement).click();
    await flush();
    expect((host.querySelector('[data-testid="lab-run"]') as HTMLButtonElement).disabled).toBe(false);
    expect(host.querySelector('[data-testid="lab-status"]')!.textContent).toContain('download failed');
  });

  it('does not run if Stop is clicked while Java loads', async () => {
    const host = document.createElement('div');
    let release: () => void = () => {};
    const gate = new Promise<void>((r) => { release = r; });
    const run = vi.fn();
    const runner: JavaRunner = { ready: () => gate, run, stop: vi.fn() };
    mountLab(host, problem, { runner, store: memStore(), makeEditor: fakeEditor().make });
    (host.querySelector('[data-testid="lab-run"]') as HTMLButtonElement).click();
    (host.querySelector('[data-testid="lab-stop"]') as HTMLButtonElement).click();
    release();
    await flush();
    expect(run).not.toHaveBeenCalled();
    expect(runner.stop).toHaveBeenCalled();
    expect(host.querySelector('[data-testid="lab-status"]')!.textContent).toContain('Stopped');
    expect((host.querySelector('[data-testid="lab-run"]') as HTMLButtonElement).disabled).toBe(false);
  });
});
