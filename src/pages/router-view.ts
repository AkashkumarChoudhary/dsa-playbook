import { render } from '../core/html';
import type { Registry } from '../core/registry';
import type { Route } from '../core/router';
import type { Store } from '../core/store';
import type { createEditor } from '../lab/editor';
import type { JavaRunner } from '../lab/runner';
import { renderHome } from './home';
import { renderModule } from './module-page';
import { renderNotFound } from './not-found';

export interface PageContext {
  registry: Registry;
  store: Store;
  runner: JavaRunner;
  makeEditor?: typeof createEditor;
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
      render(outlet, renderModule(m, ctx.registry));
      return { title: `${m.title} · DSA Playbook`, cleanup: noop };
    }
  }
  render(outlet, renderNotFound());
  return { title: 'Not found · DSA Playbook', cleanup: noop };
}
