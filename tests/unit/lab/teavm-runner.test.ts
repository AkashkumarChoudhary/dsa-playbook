import { describe, expect, it } from 'vitest';
import type { ProblemSpec } from '../../../src/content-types';
import type { CompileWorkerRequest, RunWorkerRequest } from '../../../src/lab/teavm-protocol';
import { mapCompileErrors, NOT_FINISHED_TIMEOUT, signature, TeaVMRunner, UNSUPPORTED_BROWSER, type TeaVMRunnerDeps, type WorkerLike } from '../../../src/lab/teavm-runner';

const spec: ProblemSpec = {
  className: 'Solution', method: 'containsDuplicate', params: [{ name: 'nums', type: 'int[]' }], returns: 'boolean', compare: 'exact',
  samples: [{ id: 's1', args: [[1, 1]], expected: true }], hidden: [],
};

class FakeWorker implements WorkerLike {
  onmessage: ((ev: MessageEvent) => void) | null = null;
  onerror: ((ev: Event) => void) | null = null;
  sent: unknown[] = [];
  terminated = false;
  constructor(private reply: (msg: any, w: FakeWorker) => void) {}
  postMessage(msg: unknown) { this.sent.push(msg); queueMicrotask(() => this.reply(msg, this)); }
  terminate() { this.terminated = true; }
  emit(data: unknown) { this.onmessage?.({ data } as MessageEvent); }
}

function deps(over: Partial<TeaVMRunnerDeps> & { compile?: (m: CompileWorkerRequest, w: FakeWorker) => void; run?: (m: RunWorkerRequest, w: FakeWorker) => void } = {}) {
  const timers: (() => void)[] = [];
  const runWorkers: FakeWorker[] = [];
  const d: TeaVMRunnerDeps = {
    supportsWasmGC: () => true,
    assetBase: '/x/',
    createCompileWorker: () => new FakeWorker(over.compile ?? ((m, w) => {
      if (m.type === 'init') w.emit({ type: 'ready' });
      else w.emit({ type: 'compiled', id: m.id, ok: true, diagnostics: [], wasm: new Int8Array([1]) });
    })),
    createRunWorker: () => { const w = new FakeWorker(over.run ?? ((_m, w) => { w.emit({ type: 'line', text: '@@BEGIN s1' }); w.emit({ type: 'line', text: '@@END {"id":"s1","ok":true,"ms":1,"actual":true}' }); w.emit({ type: 'done' }); })); runWorkers.push(w); return w; },
    setTimeout: (fn) => { timers.push(fn); return timers.length; },
    clearTimeout: () => {},
    ...over,
  };
  return { d, timers, runWorkers };
}

const req = { code: 'class Solution {}', spec, mode: 'samples' as const, timeLimitMs: 5000 };

describe('TeaVMRunner', () => {
  it('compiles, runs and returns test results', async () => {
    const { d, runWorkers } = deps();
    const r = await new TeaVMRunner(d).run(req);
    expect(r.kind).toBe('tests');
    if (r.kind === 'tests') expect(r.results[0]).toMatchObject({ id: 's1', pass: true, actual: 'true' });
    expect(runWorkers[0]!.terminated).toBe(true);
  });

  it('reports compile errors with lines from Solution.java', async () => {
    const { d } = deps({ compile: (m, w) => {
      if (m.type === 'init') w.emit({ type: 'ready' });
      else w.emit({ type: 'compiled', id: m.id, ok: false, diagnostics: [{ type: 'javac', severity: 'error', fileName: 'Solution.java', lineNumber: 4, message: 'illegal start of expression' }] });
    } });
    const r = await new TeaVMRunner(d).run(req);
    expect(r).toEqual({ kind: 'compileError', errors: [{ line: 4, message: 'illegal start of expression' }] });
  });

  it('times out an endless program and keeps finished results', async () => {
    const { d, timers } = deps({ run: (_m, w) => { w.emit({ type: 'line', text: '@@BEGIN s1' }); } });
    const p = new TeaVMRunner(d).run(req);
    await new Promise((r) => setTimeout(r, 0));
    timers.forEach((fn) => fn());
    const r = await p;
    expect(r.kind).toBe('timeout');
    if (r.kind === 'timeout') expect(r.results[0]!.error).toBe(NOT_FINISHED_TIMEOUT);
  });

  it('can be stopped', async () => {
    const { d } = deps({ run: () => {} });
    const runner = new TeaVMRunner(d);
    const p = runner.run(req);
    await new Promise((r) => setTimeout(r, 0));
    runner.stop();
    expect((await p).kind).toBe('stopped');
  });

  it('says when the browser cannot run Java', async () => {
    const { d } = deps({ supportsWasmGC: () => false });
    expect(await new TeaVMRunner(d).run(req)).toEqual({ kind: 'runnerUnavailable', reason: UNSUPPORTED_BROWSER });
  });
});

describe('mapCompileErrors', () => {
  it('explains a missing method when only the harness fails', () => {
    expect(signature(spec)).toBe('public boolean containsDuplicate(int[] nums)');
    expect(mapCompileErrors([{ type: 'javac', severity: 'error', fileName: 'Main.java', lineNumber: 9, message: 'cannot find symbol' }], spec))
      .toEqual([{ line: 0, message: 'Keep this method in class Solution: public boolean containsDuplicate(int[] nums)' }]);
    expect(mapCompileErrors([], spec)[0]!.message).toContain('could not be built');
  });
});
