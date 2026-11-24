import type { Module } from '../content-types';
import { html, type SafeHtml } from '../core/html';
import type { Registry } from '../core/registry';
import { href } from '../core/router';

export function renderModule(m: Module, registry: Registry): SafeHtml {
  const lessons = m.lessonIds.map((id) => registry.lesson(id)).filter((l) => l !== undefined);
  const problems = m.problemIds.map((id) => registry.problem(id)).filter((p) => p !== undefined);
  return html`
    <h1><span aria-hidden="true">${m.icon}</span> ${m.title}</h1>
    <p class="muted">${m.summary}</p>
    <h2>After this module you can</h2>
    <ul>${m.outcomes.map((o) => html`<li>${o}</li>`)}</ul>
    <h2>Lessons</h2>
    <ul class="item-list">${lessons.map((l) => html`<li class="card"><a href="${href({ name: 'lesson', id: l.id })}">📖 ${l.title}</a> <span class="muted">${l.minutes} min</span><br /><span class="muted">${l.summary}</span></li>`)}</ul>
    <h2>Problems</h2>
    <ul class="item-list">${problems.map((p) => html`<li class="card"><a href="${href({ name: 'problem', id: p.id })}">🧪 ${p.title}</a> <span class="tag">${p.difficulty}</span></li>`)}</ul>`;
}
