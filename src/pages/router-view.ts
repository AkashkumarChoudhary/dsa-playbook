import { render } from '../core/html';
import type { Registry } from '../core/registry';
import type { Route } from '../core/router';
import type { Store } from '../core/store';
import type { createEditor } from '../lab/editor';
import type { JavaRunner } from '../lab/runner';
import { mountCardsPage } from './cards-page';
import { clockOf } from './clock';
import { renderDashboard } from './dashboard-page';
import { mountDrillsPage } from './drills-page';
import { mountLessonPage } from './lesson-page';
import { mountModulePage } from './module-page';
import { renderNotFound } from './not-found';
import { mountProblemPage } from './problem-page';
import { renderRoadmap } from './roadmap-page';
import { mountSettings } from './settings-page';
import { renderSheet } from './sheet-page';
import { renderToday } from './today';

export interface PageContext {
  registry: Registry;
  store: Store;
  runner: JavaRunner;
  makeEditor?: typeof createEditor;
  /** the clock, so tests can pick the time. Defaults to Date.now. */
  now?: () => number;
}

const noop = () => {};
const titled = (title: string, cleanup: () => void = noop) => ({ title: `${title} · DSA Playbook`, cleanup });

export function renderRoute(route: Route, outlet: HTMLElement, ctx: PageContext): { title: string; cleanup: () => void } {
  outlet.innerHTML = '';
  const now = clockOf(ctx);
  switch (route.name) {
    case 'home':
      render(outlet, renderToday(ctx, now()));
      return { title: 'DSA Playbook', cleanup: noop };
    case 'dashboard':
      render(outlet, renderDashboard(ctx, now()));
      return titled('Dashboard');
    case 'roadmap':
      render(outlet, renderRoadmap(ctx));
      return titled('Roadmap');
    case 'settings':
      return titled('Settings', mountSettings(outlet, ctx));
    case 'drills':
      return titled('Spot-It drill', mountDrillsPage(outlet, ctx, { moduleId: route.moduleId }));
    case 'cards':
      return titled('Flashcards', mountCardsPage(outlet, ctx, route.deck));
    case 'sheet': {
      const sheet = ctx.registry.sheet(route.id);
      if (!sheet) break;
      render(outlet, renderSheet(sheet, ctx));
      return titled(sheet.title);
    }
    case 'module': {
      const m = ctx.registry.module(route.id);
      if (!m) break;
      return titled(m.title, mountModulePage(outlet, m, ctx));
    }
    case 'lesson': {
      const lesson = ctx.registry.lesson(route.id);
      if (!lesson) break;
      return titled(lesson.title, mountLessonPage(outlet, lesson, ctx));
    }
    case 'problem': {
      const problem = ctx.registry.problem(route.id);
      if (!problem) break;
      return titled(problem.title, mountProblemPage(outlet, problem, ctx));
    }
    case 'notFound':
      break;
  }
  render(outlet, renderNotFound());
  return { title: 'Not found · DSA Playbook', cleanup: noop };
}
