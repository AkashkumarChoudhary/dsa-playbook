import { html, type SafeHtml } from '../core/html';
import { href } from '../core/router';
import { LEVELS } from '../engine/dashboard';
import { lessonDone } from '../engine/mastery';
import { isSolved } from '../engine/tracker';
import { comingTag, lessonTag, problemTag } from './progress-tags';
import type { PageContext } from './router-view';

/** `#/roadmap`: every module by level, built and planned, with progress (spec §7.1). */
export function renderRoadmap(ctx: PageContext): SafeHtml {
  const { registry } = ctx;
  const state = ctx.store.get();
  return html`
    <h1>Roadmap</h1>
    <p class="muted">All ${registry.roadmap.length} modules, built and planned. Built parts link to their pages.</p>
    ${LEVELS.map(({ level, title }) => {
      const modules = registry.roadmap.filter((m) => m.level === level);
      if (!modules.length) return null;
      return html`<h2>${title}</h2>
        <div class="roadmap-level">${modules.map((m) => {
          const done = m.lessons.filter((l) => lessonDone(state, l.id)).length;
          const solved = m.problems.filter((p) => isSolved(state.problems[p.id])).length;
          return html`<details class="card roadmap-module" data-testid="roadmap-module">
            <summary><span aria-hidden="true">${m.icon}</span> ${m.order}. ${m.title} ${m.built ? null : comingTag(m.part)}
              <span class="muted roadmap-count">${done} of ${m.lessons.length} lessons done, ${solved} of ${m.problems.length} problems solved</span></summary>
            ${m.built ? html`<p><a class="button" href="${href({ name: 'module', id: m.id })}">Open the module</a></p>` : null}
            <h3>Lessons</h3>
            <ul class="plain-list">${m.lessons.map((l) => (l.built
              ? html`<li><a href="${href({ name: 'lesson', id: l.id })}">📖 ${l.title}</a> ${lessonTag(state, l.id)}</li>`
              : html`<li>📖 ${l.title} ${comingTag(l.part)}</li>`))}</ul>
            ${m.problems.length ? html`<h3>Problems</h3>
            <ul class="plain-list">${m.problems.map((p) => (p.built
              ? html`<li><a href="${href({ name: 'problem', id: p.id })}">🧪 ${p.title}</a> <span class="tag">${p.difficulty}</span> ${problemTag(state, p.id, registry)}</li>`
              : html`<li>🧪 ${p.title} <span class="tag">${p.difficulty}</span> ${comingTag(p.part)}</li>`))}</ul>` : null}
          </details>`;
        })}</div>`;
    })}`;
}
