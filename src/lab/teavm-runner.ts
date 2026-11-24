import type { ProblemSpec } from '../content-types';
import { generateHarness } from './harness';
import { parseHarnessOutput } from './parse-output';
import { buildResults, planTests, type PlannedTest } from './results';
import type { JavaRunner, RunRequest, RunResult } from './runner';
import type { CompileWorkerRequest, CompileWorkerResponse, RunWorkerMessage, RunWorkerRequest, TeaVMDiagnostic } from './teavm-protocol';

export interface WorkerLike {
  postMessage(msg: unknown, transfer?: Transferable[]): void;
  terminate(): void;
  onmessage: ((ev: MessageEvent) => void) | null;
  onerror: ((ev: Event) => void) | null;
}

export interface TeaVMRunnerDeps {
  createCompileWorker(): WorkerLike;
  createRunWorker(): WorkerLike;
  supportsWasmGC(): boolean;
  assetBase: string;
  setTimeout(fn: () => void, ms: number): number;
  clearTimeout(id: number): void;
}

export const UNSUPPORTED_BROWSER = 'This browser cannot run Java here yet. Update your browser, or copy your code to LeetCode.';
export const NOT_FINISHED_TIMEOUT = 'Did not finish in time. Check for an endless loop, or a solution that is too slow.';
export const NOT_FINISHED_STOPPED = 'Stopped before it finished.';
const COMPILE_TIMEOUT_MS = 60_000;

export function supportsWasmGC(): boolean {
  try {
    return typeof WebAssembly === 'object' && WebAssembly.validate(new Uint8Array([0, 97, 115, 109, 1, 0, 0, 0, 1, 5, 1, 95, 1, 120, 0]));
  } catch {
    return false;
  }
}

export function defaultTeaVMDeps(): TeaVMRunnerDeps {
  return {
    createCompileWorker: () => new Worker(new URL('./teavm-compile-worker.ts', import.meta.url), { type: 'module' }) as unknown as WorkerLike,
    createRunWorker: () => new Worker(new URL('./teavm-run-worker.ts', import.meta.url), { type: 'module' }) as unknown as WorkerLike,
    supportsWasmGC,
    assetBase: new URL(`${import.meta.env.BASE_URL}runner/teavm/`, window.location.origin).href,
    setTimeout: (fn, ms) => window.setTimeout(fn, ms),
    clearTimeout: (id) => window.clearTimeout(id),
  };
}

export function signature(spec: ProblemSpec): string {
  return `public ${spec.returns} ${spec.method}(${spec.params.map((p) => `${p.type} ${p.name}`).join(', ')})`;
}

export function mapCompileErrors(diags: TeaVMDiagnostic[], spec: ProblemSpec): { line: number; message: string }[] {
  if (diags.length === 0) return [{ line: 0, message: 'The code could not be built. Check that it is valid Java.' }];
  const fromSolution = diags
    .filter((d) => !d.fileName.endsWith('Main.java'))
    .map((d) => ({ line: d.type === 'javac' ? d.lineNumber : 0, message: d.message }));
  if (fromSolution.length > 0) return fromSolution;
  return [{ line: 0, message: `Keep this method in class Solution: ${signature(spec)}` }];
}

type Compiled = Extract<CompileWorkerResponse, { type: 'compiled' }>;

export class TeaVMRunner implements JavaRunner {
  private compileWorker: WorkerLike | null = null;
  private readyPromise: Promise<void> | null = null;
  private unavailable: string | null = null;
  private nextId = 1;
  private pending = new Map<number, (m: Compiled) => void>();
  private stopActive: (() => void) | null = null;
  private readonly deps: TeaVMRunnerDeps;

  constructor(deps?: TeaVMRunnerDeps) {
    this.deps = deps ?? defaultTeaVMDeps();
  }

  ready(onProgress?: (message: string) => void): Promise<void> {
    if (!this.readyPromise) this.readyPromise = this.load(onProgress);
    return this.readyPromise;
  }

  private load(onProgress?: (message: string) => void): Promise<void> {
    if (!this.deps.supportsWasmGC()) {
      this.unavailable = UNSUPPORTED_BROWSER;
      return Promise.resolve();
    }
    onProgress?.('Loading Java for the first time. This is about 7.5 MB and happens once.');
    return new Promise((resolve) => {
      const w = this.deps.createCompileWorker();
      this.compileWorker = w;
      w.onmessage = (ev) => {
        const m = ev.data as CompileWorkerResponse;
        if (m.type === 'ready') resolve();
        else if (m.type === 'loadError') {
          this.unavailable = `Java could not load: ${m.message}`;
          resolve();
        } else {
          const cb = this.pending.get(m.id);
          if (cb) {
            this.pending.delete(m.id);
            cb(m);
          }
        }
      };
      w.onerror = () => {
        this.unavailable = 'Java could not load. Check your connection and reload the page.';
        resolve();
      };
      w.postMessage({ type: 'init', assetBase: this.deps.assetBase } satisfies CompileWorkerRequest);
    });
  }

  async run(req: RunRequest): Promise<RunResult> {
    await this.ready();
    if (this.unavailable || !this.compileWorker) return { kind: 'runnerUnavailable', reason: this.unavailable ?? UNSUPPORTED_BROWSER };
    const planned = planTests(req.spec, req.mode, req.extraTests);
    const harness = generateHarness(req.spec, planned);
    const compiled = await this.compile([
      { name: 'Solution.java', content: req.code },
      { name: 'Main.java', content: harness },
    ]);
    if (compiled === 'timeout') {
      this.compileWorker?.terminate();
      this.compileWorker = null;
      this.readyPromise = null;
      return { kind: 'runnerUnavailable', reason: 'The Java compiler stopped responding. Reload the page and try again.' };
    }
    if (!compiled.ok || !compiled.wasm) {
      return { kind: 'compileError', errors: mapCompileErrors(compiled.diagnostics.filter((d) => d.severity === 'error'), req.spec) };
    }
    return this.execute(compiled.wasm, req, planned);
  }

  stop(): void {
    this.stopActive?.();
  }

  private compile(files: { name: string; content: string }[]): Promise<Compiled | 'timeout'> {
    const id = this.nextId++;
    return new Promise((resolve) => {
      const timer = this.deps.setTimeout(() => {
        this.pending.delete(id);
        resolve('timeout');
      }, COMPILE_TIMEOUT_MS);
      this.pending.set(id, (m) => {
        this.deps.clearTimeout(timer);
        resolve(m);
      });
      this.compileWorker?.postMessage({ type: 'compile', id, files } satisfies CompileWorkerRequest);
    });
  }

  private execute(wasm: Int8Array, req: RunRequest, planned: PlannedTest[]): Promise<RunResult> {
    return new Promise((resolve) => {
      const worker = this.deps.createRunWorker();
      const lines: string[] = [];
      let settled = false;
      let timer = 0;
      const finish = (kind: 'tests' | 'timeout' | 'stopped', crash?: string) => {
        if (settled) return;
        settled = true;
        this.deps.clearTimeout(timer);
        worker.terminate();
        this.stopActive = null;
        const parsed = parseHarnessOutput(lines, planned.map((p) => p.id));
        const reason = kind === 'timeout' ? NOT_FINISHED_TIMEOUT : kind === 'stopped' ? NOT_FINISHED_STOPPED : (crash ?? 'The program stopped before this test.');
        resolve({ kind, results: buildResults(req.spec, planned, parsed.tests, reason), stdout: parsed.stray });
      };
      timer = this.deps.setTimeout(() => finish('timeout'), req.timeLimitMs);
      worker.onmessage = (ev) => {
        const m = ev.data as RunWorkerMessage;
        if (m.type === 'line') lines.push(m.text);
        else if (m.type === 'done') finish('tests');
        else finish('tests', `The program crashed: ${m.message}`);
      };
      worker.onerror = () => finish('tests', 'The program crashed before it finished.');
      this.stopActive = () => finish('stopped');
      const msg: RunWorkerRequest = { type: 'run', wasm, runtimeUrl: `${this.deps.assetBase}compiler.wasm-runtime.js` };
      worker.postMessage(msg, [wasm.buffer as ArrayBuffer]);
    });
  }
}
