import { render } from '../core/html';
import type { Registry } from '../core/registry';
import type { Route } from '../core/router';
import type { Store } from '../core/store';
import type { createEditor } from '../lab/editor';
import type { JavaRunner } from '../lab/runner';
import { renderHome } from './home';
import { mountLessonPage } from './lesson-page';
import { mountModulePage } from './module-page';
import { renderNotFound } from './not-found';
import { mountProblemPage } from './problem-page';

export interface PageContext {
  registry: Registry;
  store: Store;
  runner: JavaRunner;
  makeEditor?: typeof createEditor;
  /** the clock, so tests can pick the time. Defaults to Date.now. */
  now?: () => number;
}

const noop = () => {};

export function renderRoute(route: Route, outlet: HTMLElement, ctx: PageContext): { title: string; cleanup: () => void } {
  outlet.innerHTML = '';
  if (route.name === 'home') {
    render(outlet, renderHome(ctx.registry));
    return { title: 'DSA Playbook', cleanup: noop };
  }
  if (route.name === 'module') {
    const m = ctx.registry.module(route.id);
    if (m) {
      const cleanup = mountModulePage(outlet, m, ctx);
      return { title: `${m.title} · DSA Playbook`, cleanup };
    }
  }
  if (route.name === 'lesson') {
    const lesson = ctx.registry.lesson(route.id);
    if (lesson) {
      const cleanup = mountLessonPage(outlet, lesson, ctx);
      return { title: `${lesson.title} · DSA Playbook`, cleanup };
    }
  }
  if (route.name === 'problem') {
    const problem = ctx.registry.problem(route.id);
    if (problem) {
      const cleanup = mountProblemPage(outlet, problem, ctx);
      return { title: `${problem.title} · DSA Playbook`, cleanup };
    }
  }
  render(outlet, renderNotFound());
  return { title: 'Not found · DSA Playbook', cleanup: noop };
}
