import type { JavaType, Problem, TestCase } from '../content-types';
import { html, render } from '../core/html';
import type { Store } from '../core/store';
import { createEditor } from './editor';
import { LiteralError, toJavaLiteral } from './java-literals';
import type { JavaRunner, RunResult, TestKind, TestResult } from './runner';

export interface LabDeps {
  runner: JavaRunner;
  store: Store;
  makeEditor?: typeof createEditor;
  confirm?: (msg: string) => boolean;
  /** called after every Submit run, so the tracker can record a full pass */
  onSubmitResult?: (result: RunResult) => void;
}

export interface LabHandle {
  loadCode(src: string): void;
  dispose(): void;
}

const NOTICES_URL = 'https://github.com/AkashkumarChoudhary/dsa-playbook/blob/main/THIRD_PARTY_NOTICES.md';

/** How to type a value of each Java type in the "Add your own test" boxes. */
const TYPED_EXAMPLE: Record<JavaType, string> = {
  int: '5', long: '5', double: '2.5', boolean: 'true', char: '"a"', String: '"abc"',
  'int[]': '[1, 2, 3]', 'int[][]': '[[1, 2], [3, 4]]', 'char[][]': '[["a", "b"], ["c", "d"]]', 'String[]': '["a", "b"]',
  'List<Integer>': '[1, 2, 3]', 'List<String>': '["a", "b"]', 'List<List<Integer>>': '[[1, 2], [3]]', 'List<List<String>>': '[["a"], ["b", "c"]]',
};

const KIND_LABEL: Record<TestKind, string> = { sample: 'Example', custom: 'Your test', hidden: 'Hidden test', speed: 'Speed test' };

/** n is the test's place among tests of its kind, so learners see "Example 1", not an internal id. */
function row(t: TestResult, n: number) {
  const label = t.kind === 'speed' ? KIND_LABEL.speed : `${KIND_LABEL[t.kind]} ${n}`;
  return html`<li data-testid="test-row" data-pass="${String(t.pass)}" data-kind="${t.kind}" class="${t.pass ? 'pass' : 'fail'}">
    <div class="test-head"><span aria-hidden="true">${t.pass ? '✅' : '❌'}</span> <b>${label}</b> <span class="muted">${t.timeMs} ms</span></div>
    <div class="test-io"><span>Input</span><code>${t.input}</code><span>Expected</span><code>${t.expected}</code>${t.actual ? html`<span>Got</span><code>${t.actual}</code>` : null}</div>
    ${t.error ? html`<p class="test-error">${t.error}</p>` : null}
    ${t.stdout ? html`<pre class="test-stdout">${t.stdout}</pre>` : null}
  </li>`;
}

export function mountLab(host: HTMLElement, problem: Problem, deps: LabDeps): LabHandle {
  const makeEditor = deps.makeEditor ?? createEditor;
  const confirmFn = deps.confirm ?? ((m: string) => window.confirm(m));
  const el = document.createElement('section');
  el.className = 'lab';
  el.setAttribute('aria-label', 'Java lab');
  render(el, html`
    <div class="lab-head"><h3>🧪 Java lab</h3><span class="lab-clock" aria-label="Time spent">⏱ 00:00</span></div>
    <div class="lab-editor"></div>
    <div class="lab-buttons">
      <button type="button" data-testid="lab-run">▶ Run examples</button>
      <button type="button" data-testid="lab-submit" class="primary">✅ Submit all tests</button>
      <button type="button" data-testid="lab-stop" disabled>■ Stop</button>
      <button type="button" data-testid="lab-reset">↺ Reset</button>
    </div>
    <p class="lab-status" data-testid="lab-status" aria-live="polite">Write your code, then run the examples.</p>
    <div class="lab-results" data-testid="lab-results"></div>
    <details class="lab-custom"><summary>➕ Add your own test</summary>
      <div class="custom-fields">
        ${problem.spec.params.map((p) => html`<label>${p.name} (${p.type}) <input name="custom-${p.name}" placeholder="Write it like ${TYPED_EXAMPLE[p.type]}" /></label>`)}
        <label>expected (${problem.spec.returns}) <input name="custom-expected" placeholder="Write it like ${TYPED_EXAMPLE[problem.spec.returns]}" /></label>
        <button type="button" data-testid="lab-add-test">Add test</button>
      </div>
      <p class="custom-error" role="status"></p>
      <ul class="custom-list"></ul>
    </details>
    <details class="lab-console-wrap"><summary>Console output</summary><pre data-testid="lab-console"></pre></details>
    <p class="lab-credit muted">Java runs in your browser with TeaVM and OpenJDK javac. <a href="${NOTICES_URL}" target="_blank" rel="noopener">Notices</a></p>
  `);
  host.append(el);

  const $ = <T extends HTMLElement>(sel: string) => el.querySelector(sel) as T;
  const runBtn = $<HTMLButtonElement>('[data-testid="lab-run"]');
  const submitBtn = $<HTMLButtonElement>('[data-testid="lab-submit"]');
  const stopBtn = $<HTMLButtonElement>('[data-testid="lab-stop"]');
  const resetBtn = $<HTMLButtonElement>('[data-testid="lab-reset"]');
  const status = $('[data-testid="lab-status"]');
  const results = $('[data-testid="lab-results"]');
  const consoleEl = $('[data-testid="lab-console"]');
  const clock = $('.lab-clock');
  const customError = $('.custom-error');
  const customList = $('.custom-list');

  const saved = deps.store.get().code[problem.id]?.source;
  let saveTimer: ReturnType<typeof setTimeout> | null = null;
  let pendingCode: string | null = null;
  const saveCode = (source: string) => deps.store.update((st) => { st.code[problem.id] = { source, updatedAt: Date.now() }; });
  /** Saves an edit that is still waiting for its timer, for example when the learner leaves the page. */
  const flushSave = () => {
    if (saveTimer) clearTimeout(saveTimer);
    saveTimer = null;
    if (pendingCode !== null) saveCode(pendingCode);
    pendingCode = null;
  };
  // A tab can close before the save timer fires. pagehide is the last safe moment to save.
  window.addEventListener('pagehide', flushSave);
  let startedAt: number | null = null;
  let clockTimer: ReturnType<typeof setInterval> | null = null;
  const custom: TestCase[] = [];

  const editor = makeEditor($('.lab-editor'), saved ?? problem.starter, (value) => {
    if (startedAt === null) {
      startedAt = Date.now();
      clockTimer = setInterval(() => {
        const s = Math.floor((Date.now() - (startedAt ?? Date.now())) / 1000);
        clock.textContent = `⏱ ${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;
      }, 1000);
    }
    if (saveTimer) clearTimeout(saveTimer);
    pendingCode = value;
    saveTimer = setTimeout(flushSave, 400);
  });

  function busy(on: boolean) {
    runBtn.disabled = on;
    submitBtn.disabled = on;
    stopBtn.disabled = !on;
  }

  function show(result: RunResult) {
    consoleEl.textContent = '';
    if (result.kind === 'runnerUnavailable') {
      status.textContent = 'Java cannot run in this browser.';
      render(results, html`<div class="lab-fallback" data-testid="lab-fallback"><p>${result.reason}</p>
        <p><button type="button" class="copy-code">📋 Copy code</button> <a href="${problem.source.url}" target="_blank" rel="noopener">Open on ${problem.source.name}</a></p></div>`);
      results.querySelector('.copy-code')?.addEventListener('click', () => void navigator.clipboard?.writeText(editor.getValue()));
      return;
    }
    if (result.kind === 'compileError') {
      status.textContent = 'The code did not compile.';
      render(results, html`<ul class="compile-errors">${result.errors.map((e) => html`<li>${e.line > 0 ? `Line ${e.line}: ` : ''}${e.message}</li>`)}</ul>`);
      return;
    }
    const passed = result.results.filter((t) => t.pass).length;
    const total = result.results.length;
    const prefix = result.kind === 'timeout' ? 'Stopped: it ran too long. ' : result.kind === 'stopped' ? 'Stopped. ' : '';
    status.textContent = `${prefix}${passed} of ${total} passed.${passed === total && total > 0 && result.kind === 'tests' ? ' 🎉 All tests passed.' : ''}`;
    const hiddenPassed = result.results.filter((t) => t.kind === 'hidden' && t.pass);
    const count: Partial<Record<TestKind, number>> = {};
    const numbered = result.results.map((t) => ({ t, n: (count[t.kind] = (count[t.kind] ?? 0) + 1) }));
    const shown = numbered.filter(({ t }) => !(t.kind === 'hidden' && t.pass));
    render(results, html`<ul class="test-list">${shown.map(({ t, n }) => row(t, n))}</ul>${hiddenPassed.length ? html`<p class="muted">🔒 ${hiddenPassed.length} hidden test${hiddenPassed.length === 1 ? '' : 's'} passed.</p>` : null}`);
    consoleEl.textContent = result.stdout;
  }

  let cancelled = false;

  async function run(mode: 'samples' | 'all') {
    cancelled = false;
    busy(true);
    status.textContent = 'Getting Java ready…';
    try {
      await deps.runner.ready((msg) => { status.textContent = msg; });
      if (cancelled) {
        status.textContent = 'Stopped.';
        return;
      }
      status.textContent = mode === 'all' ? 'Running all tests…' : 'Running the examples…';
      const result = await deps.runner.run({ code: editor.getValue(), spec: problem.spec, mode, extraTests: [...custom], timeLimitMs: mode === 'all' ? 10_000 : 5_000 });
      show(result);
      if (mode === 'all') deps.onSubmitResult?.(result);
    } catch (err) {
      status.textContent = `Something went wrong: ${err instanceof Error ? err.message : String(err)}`;
    } finally {
      busy(false);
    }
  }

  runBtn.addEventListener('click', () => void run('samples'));
  submitBtn.addEventListener('click', () => void run('all'));
  stopBtn.addEventListener('click', () => {
    cancelled = true;
    deps.runner.stop();
  });
  resetBtn.addEventListener('click', () => {
    if (confirmFn('Reset to the starter code? Your code will be replaced.')) editor.setValue(problem.starter);
  });

  $<HTMLButtonElement>('[data-testid="lab-add-test"]').addEventListener('click', () => {
    const args: unknown[] = [];
    try {
      for (const p of problem.spec.params) {
        const input = $<HTMLInputElement>(`input[name="custom-${p.name}"]`);
        let value: unknown;
        try { value = JSON.parse(input.value); } catch { throw new LiteralError(`${p.name}: write it like ${TYPED_EXAMPLE[p.type]}.`); }
        toJavaLiteral(value, p.type);
        args.push(value);
      }
      let expected: unknown;
      const expInput = $<HTMLInputElement>('input[name="custom-expected"]');
      try { expected = JSON.parse(expInput.value); } catch { throw new LiteralError(`expected: write it like ${TYPED_EXAMPLE[problem.spec.returns]}.`); }
      toJavaLiteral(expected, problem.spec.returns);
      const test: TestCase = { id: `c${custom.length + 1}`, args, expected };
      custom.push(test);
      customError.textContent = '';
      const li = document.createElement('li');
      li.textContent = `Your test ${custom.length}: ${problem.spec.params.map((p, i) => `${p.name} = ${JSON.stringify(args[i])}`).join(', ')} → ${JSON.stringify(expected)}`;
      customList.append(li);
    } catch (err) {
      customError.textContent = err instanceof Error ? err.message : String(err);
    }
  });

  return {
    loadCode(src) {
      const current = editor.getValue().trim();
      const safe = current === '' || current === problem.starter.trim() || current === src.trim();
      if (!safe && !confirmFn('Replace your code with this solution? Your code will be lost.')) return;
      editor.setValue(src);
      const reduce = typeof window.matchMedia === 'function' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      el.scrollIntoView?.({ behavior: reduce ? 'auto' : 'smooth', block: 'start' });
    },
    dispose() {
      // A run still waiting for Java to load must not start after the learner leaves.
      cancelled = true;
      window.removeEventListener('pagehide', flushSave);
      flushSave();
      if (clockTimer) clearInterval(clockTimer);
      deps.runner.stop();
      editor.destroy();
      el.remove();
    },
  };
}
