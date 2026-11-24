import type { Module, QuizQuestion, ScenarioQuestion } from '../content-types';
import { html, render, type SafeHtml } from '../core/html';
import type { Registry } from '../core/registry';
import { href } from '../core/router';
import type { StoredState } from '../core/store';
import { lessonDone } from '../engine/mastery';
import { mountQuiz, mountScenarios } from '../engine/quiz';
import { isSolved } from '../engine/tracker';
import { comingTag, lessonTag, problemTag } from './progress-tags';
import type { PageContext } from './router-view';

/** The module page. With `state`, each lesson and problem shows its progress. */
export function renderModule(m: Module, registry: Registry, state?: Readonly<StoredState>): SafeHtml {
  const road = registry.roadmapModule(m.id);
  const lessons = road?.lessons ?? [];
  const problems = road?.problems ?? [];
  const doneLessons = state ? lessons.filter((l) => lessonDone(state, l.id)).length : 0;
  const solved = state ? problems.filter((p) => isSolved(state.problems[p.id])).length : 0;
  const hasQuiz = m.quiz.length > 0;
  return html`
    <h1><span aria-hidden="true">${m.icon}</span> ${m.title}</h1>
    <p class="muted">${m.summary}</p>
    ${state ? html`<p class="module-progress" data-testid="module-progress">${doneLessons} of ${lessons.length} lessons done. ${solved} of ${problems.length} problems solved.</p>` : null}
    <p class="module-actions"><a class="button" data-testid="module-drill" href="${href({ name: 'drills', moduleId: m.id })}">🎯 Mixed drill for this module</a></p>
    <h2>After this module you can</h2>
    <ul>${m.outcomes.map((o) => html`<li>${o}</li>`)}</ul>
    <h2>Lessons</h2>
    <ul class="item-list">${lessons.map((l) => {
      const real = registry.lesson(l.id);
      return real
        ? html`<li class="card"><a href="${href({ name: 'lesson', id: l.id })}">📖 ${l.title}</a> <span class="muted">${l.minutes} min</span> ${state ? lessonTag(state, l.id) : null}<br /><span class="muted">${real.summary}</span></li>`
        : html`<li class="card planned">📖 ${l.title} <span class="muted">${l.minutes} min</span> ${comingTag(l.part)}</li>`;
    })}</ul>
    <h2>Problems</h2>
    <ul class="item-list">${problems.map((p) => (p.built
      ? html`<li class="card"><a href="${href({ name: 'problem', id: p.id })}">🧪 ${p.title}</a> <span class="tag">${p.difficulty}</span> ${state ? problemTag(state, p.id, registry) : null}</li>`
      : html`<li class="card planned">🧪 ${p.title} <span class="tag">${p.difficulty}</span> ${comingTag(p.part)}</li>`))}</ul>
    ${hasQuiz ? html`<section id="module-quiz"><h2>🧪 Module quiz</h2><div class="mcq-host"></div><div class="scenario-host"></div><p class="scenario-score" aria-live="polite"></p></section>` : null}`;
}

export function mountModulePage(host: HTMLElement, m: Module, ctx: PageContext): () => void {
  render(host, renderModule(m, ctx.registry, ctx.store.get()));
  const mcq = m.quiz.filter((q): q is QuizQuestion => !('type' in q));
  const scenarios = m.quiz.filter((q): q is ScenarioQuestion => 'type' in q && q.type === 'scenario');
  const disposers: (() => void)[] = [];
  const mcqHost = host.querySelector<HTMLElement>('.mcq-host');
  const scenarioHost = host.querySelector<HTMLElement>('.scenario-host');
  if (mcqHost && mcq.length) disposers.push(mountQuiz(mcqHost, mcq));
  if (scenarioHost && scenarios.length) {
    const score = host.querySelector('.scenario-score') as HTMLElement;
    disposers.push(mountScenarios(scenarioHost, scenarios, (right, marked) => { score.textContent = `Scenarios: ${right} of ${marked} marked right.`; }));
  }
  return () => {
    for (const d of disposers) d();
    host.innerHTML = '';
  };
}
