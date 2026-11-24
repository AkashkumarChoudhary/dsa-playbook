import type { Problem, TestCase } from '../content-types';
import { html, render } from '../core/html';
import type { Store } from '../core/store';
import { createEditor } from './editor';
import { LiteralError, toJavaLiteral } from './java-literals';
import type { JavaRunner, RunResult, TestResult } from './runner';

export interface LabDeps {
  runner: JavaRunner;
  store: Store;
  makeEditor?: typeof createEditor;
  confirm?: (msg: string) => boolean;
}

export interface LabHandle {
  loadCode(src: string): void;
  dispose(): void;
}

const NOTICES_URL = 'https://github.com/AkashkumarChoudhary/dsa-playbook/blob/main/THIRD_PARTY_NOTICES.md';

function row(t: TestResult) {
  const label = t.kind === 'sample' ? 'Example' : t.kind === 'custom' ? 'Your test' : t.kind === 'speed' ? 'Speed test' : 'Hidden test';
  return html`<li data-testid="test-row" data-pass="${String(t.pass)}" data-kind="${t.kind}" class="${t.pass ? 'pass' : 'fail'}">
    <div class="test-head"><span aria-hidden="true">${t.pass ? '✅' : '❌'}</span> <b>${label} ${t.id}</b> <span class="muted">${t.timeMs} ms</span></div>
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
        ${problem.spec.params.map((p) => html`<label>${p.name} (${p.type}) <input name="custom-${p.name}" placeholder="JSON, for example [1, 2, 3]" /></label>`)}
        <label>expected (${problem.spec.returns}) <input name="custom-expected" placeholder="JSON, for example true" /></label>
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
    saveTimer = setTimeout(() => {
      deps.store.update((st) => { st.code[problem.id] = { source: value, updatedAt: Date.now() }; });
    }, 400);
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
    const shown = result.results.filter((t) => !(t.kind === 'hidden' && t.pass));
    render(results, html`<ul class="test-list">${shown.map(row)}</ul>${hiddenPassed.length ? html`<p class="muted">🔒 ${hiddenPassed.length} hidden test${hiddenPassed.length === 1 ? '' : 's'} passed.</p>` : null}`);
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
        try { value = JSON.parse(input.value); } catch { throw new LiteralError(`${p.name}: write it as JSON, for example [1, 2, 3].`); }
        toJavaLiteral(value, p.type);
        args.push(value);
      }
      let expected: unknown;
      const expInput = $<HTMLInputElement>('input[name="custom-expected"]');
      try { expected = JSON.parse(expInput.value); } catch { throw new LiteralError('expected: write it as JSON, for example true.'); }
      toJavaLiteral(expected, problem.spec.returns);
      const test: TestCase = { id: `c${custom.length + 1}`, args, expected };
      custom.push(test);
      customError.textContent = '';
      const li = document.createElement('li');
      li.textContent = `${test.id}: ${problem.spec.params.map((p, i) => `${p.name} = ${JSON.stringify(args[i])}`).join(', ')} → ${JSON.stringify(expected)}`;
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
      el.scrollIntoView?.({ behavior: 'smooth', block: 'start' });
    },
    dispose() {
      if (saveTimer) clearTimeout(saveTimer);
      if (clockTimer) clearInterval(clockTimer);
      deps.runner.stop();
      editor.destroy();
      el.remove();
    },
  };
}
