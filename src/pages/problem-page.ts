import type { Problem } from '../content-types';
import { html, raw, render } from '../core/html';
import { href } from '../core/router';
import { codeBlock } from '../engine/highlight';
import { parseMarkers } from '../engine/markers';
import { mountVizGroup } from '../engine/player-view';
import { mountLab } from '../lab/lab-view';
import type { PageContext } from './router-view';
import { mountSpotFirst } from './spot-first';

const LEVEL_LABEL = { brute: '🐢 Brute force', better: '🚶 Better', optimal: '🚀 Optimal' } as const;

export function mountProblemPage(host: HTMLElement, problem: Problem, ctx: PageContext): () => void {
  const link = (l: { title: string; why: string; id?: string }) =>
    html`<li>${l.id ? html`<a href="${href({ name: 'problem', id: l.id })}">${l.title}</a>` : html`<b>${l.title}</b> <span class="tag">coming later</span>`} <span class="muted">${l.why}</span></li>`;
  render(host, html`
    <article class="problem">
      <p class="muted"><a href="${href({ name: 'module', id: problem.moduleId })}">← ${ctx.registry.module(problem.moduleId)?.title ?? 'Module'}</a></p>
      <h1>${problem.title} <span class="tag">${problem.difficulty}</span></h1>

      <section id="problem"><h2>📝 The problem</h2>${raw(problem.statement)}
        <h3>Limits</h3><ul>${problem.limits.map((l) => html`<li><code>${l}</code></li>`)}</ul>
        <h3>Examples</h3><ul>${problem.examples.map((e) => html`<li><code>${e.input}</code> → <code>${e.output}</code>${e.note ? html` <span class="muted">${e.note}</span>` : null}</li>`)}</ul>
        <p><a href="${problem.source.url}" target="_blank" rel="noopener">Open on ${problem.source.name}</a></p>
      </section>

      <section id="spot"><h2>🔍 Spot it first</h2><div class="spot-host"></div></section>

      <section id="hints"><h2>💬 Hints</h2>
        <ol class="hints">${problem.hints.map((h) => html`<li class="hint" hidden>${h}</li>`)}</ol>
        <button type="button" data-testid="hint-next">Show a hint (0 of ${problem.hints.length})</button>
      </section>

      <section id="lab"><h2>🧪 Try it yourself</h2><div class="lab-host"></div></section>

      <section id="edge-cases"><h2>⚠️ Edge cases</h2><ul>${problem.edgeCases.map((e) => html`<li>${e}</li>`)}</ul></section>

      <section id="reveal" class="reveal-gate">
        <p>Try it yourself first. Opening the solutions counts as a peek.</p>
        <button type="button" data-testid="show-solutions">Show solutions</button>
      </section>

      <div id="solutions" hidden>
      <section id="approaches"><h2 tabindex="-1">🐢 → 🚀 Approaches</h2>
        ${problem.approaches.map((a) => html`
          <details class="approach card" data-level="${a.level}">
            <summary>${LEVEL_LABEL[a.level]}: ${a.title} <span class="muted">${a.time} time, ${a.space} space</span></summary>
            <p>${a.idea}</p>
            ${codeBlock(parseMarkers(a.java).code, { label: `${a.level} solution in Java` })}
            <p><button type="button" data-testid="load-into-lab-${a.level}">Load into lab</button></p>
            ${a.nextStepRemoves ? html`<p class="callout"><b>What the next step removes:</b> ${a.nextStepRemoves}</p>` : null}
          </details>`)}
      </section>

      <section id="dry-run"><h2>⚙️ Dry run of the optimal solution</h2><div class="viz-host"></div></section>

      <section id="compare"><h2>📊 Compare the approaches</h2>
        <div class="simple-table"><table><thead><tr><th>Approach</th><th>Time</th><th>Space</th><th>Why move on?</th></tr></thead>
          <tbody>${problem.approaches.map((a) => html`<tr><td>${LEVEL_LABEL[a.level]}</td><td>${a.time}</td><td>${a.space}</td><td>${a.nextStepRemoves ?? 'This is the goal.'}</td></tr>`)}</tbody></table></div>
      </section>

      <section id="mistakes"><h2>🚧 Common mistakes</h2><ul>${problem.mistakes.map((m) => html`<li>${m}</li>`)}</ul></section>

      <section id="explain"><h2>🗣️ The 30-second explanation</h2>
        <details class="card"><summary>Say it out loud first, then reveal</summary><p>${problem.explain30}</p></details>
      </section>

      <section id="hook"><h2>🪝 Memory hook</h2><p class="callout"><b>${problem.hook}</b></p></section>

      <section id="related"><h2>🔗 Related problems</h2>
        <ul>${problem.related.map(link)}</ul>
        ${problem.lookAlikes.length ? html`<h3>Look-alikes</h3><ul>${problem.lookAlikes.map(link)}</ul>` : null}
      </section>
      </div>
    </article>`);

  const disposeSpot = mountSpotFirst(host.querySelector('.spot-host') as HTMLElement, problem.spot);
  const lab = mountLab(host.querySelector('.lab-host') as HTMLElement, problem, { runner: ctx.runner, store: ctx.store, makeEditor: ctx.makeEditor });

  const hints = [...host.querySelectorAll<HTMLElement>('.hint')];
  const hintBtn = host.querySelector<HTMLButtonElement>('[data-testid="hint-next"]') as HTMLButtonElement;
  let shown = 0;
  hintBtn.addEventListener('click', () => {
    const next = hints[shown];
    if (!next) return;
    next.hidden = false;
    shown++;
    hintBtn.textContent = `Show a hint (${shown} of ${hints.length})`;
    if (shown >= hints.length) {
      hintBtn.disabled = true;
      next.tabIndex = -1;
      next.focus();
    }
  });

  for (const a of problem.approaches) {
    host.querySelector(`[data-testid="load-into-lab-${a.level}"]`)?.addEventListener('click', () => lab.loadCode(parseMarkers(a.java).code));
  }

  const optimal = problem.approaches.find((a) => a.level === 'optimal' && a.traceId);
  const trace = optimal?.traceId ? ctx.registry.trace(optimal.traceId) : undefined;
  const sample = problem.spec.samples[0];
  const vizHost = host.querySelector('.viz-host') as HTMLElement;
  let disposeViz = () => {};
  const solutions = host.querySelector<HTMLElement>('#solutions') as HTMLElement;
  const gateBtn = host.querySelector<HTMLButtonElement>('[data-testid="show-solutions"]') as HTMLButtonElement;
  gateBtn.addEventListener('click', () => {
    solutions.hidden = false;
    if (optimal && trace && sample) disposeViz = mountVizGroup(vizHost, [{ label: optimal.title, trace, java: optimal.java, input: trace.fromArgs(sample.args) }]);
    else vizHost.textContent = 'No dry run for this problem yet.';
    gateBtn.disabled = true;
    gateBtn.textContent = 'Solutions shown';
    host.querySelector<HTMLElement>('#approaches > h2')?.focus();
  }, { once: true });

  return () => {
    disposeSpot();
    disposeViz();
    lab.dispose();
    host.innerHTML = '';
  };
}
