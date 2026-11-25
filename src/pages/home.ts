import { html, type SafeHtml } from '../core/html';
import type { Registry } from '../core/registry';
import { href } from '../core/router';

/** The intro for a first-time visitor. Today (today.ts) shows it until there is progress. */
export function renderHome(registry: Registry): SafeHtml {
  const first = registry.modules[0];
  return html`
    <section class="hero">
      <h1>Learn DSA by spotting patterns</h1>
      <p>Watch each algorithm run step by step. Try first, then reveal. Write real Java in your browser.</p>
      ${first ? html`<p><a class="button primary" data-testid="start" href="${href({ name: 'module', id: first.id })}">Start with ${first.title}</a></p>` : null}
    </section>
    <h2>How this site teaches</h2>
    <ul class="how-list">
      <li>🔍 <b>Spot it first.</b> Every problem starts with "which pattern is this?"</li>
      <li>⚙️ <b>Dry run.</b> Step through the code and watch the values change.</li>
      <li>🐢 → 🚀 <b>Brute, better, optimal.</b> Learn to find the work a slow answer repeats.</li>
      <li>🧪 <b>Java lab.</b> Write your solution and run the tests right here.</li>
    </ul>
    <h2>Start here</h2>
    <div class="module-grid">
      ${registry.modules.map((m) => html`
        <article class="card module-card">
          <a href="${href({ name: 'module', id: m.id })}"><span aria-hidden="true">${m.icon}</span> <h3>${m.title}</h3></a>
          <p class="muted">${m.summary}</p>
          <p><span class="tag">${m.lessonIds.length} lesson${m.lessonIds.length === 1 ? '' : 's'}</span> <span class="tag">${m.problemIds.length} problem${m.problemIds.length === 1 ? '' : 's'}</span></p>
        </article>`)}
    </div>`;
}
