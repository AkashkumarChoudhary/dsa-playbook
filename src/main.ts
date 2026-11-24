import { contentInput } from '../content';
import { allRoutes, buildRegistry } from './core/registry';
import { startRouter } from './core/router';
import { createStore } from './core/store';
import { initTheme } from './core/theme';
import { TeaVMRunner } from './lab/teavm-runner';
import { mountShell } from './pages/shell';
import { renderRoute } from './pages/router-view';
import './styles/index.css';

const store = createStore(window.localStorage);
const theme = initTheme(window, store);
const registry = buildRegistry(contentInput);
const shell = mountShell(document.getElementById('app') as HTMLElement, registry, theme);
const runner = new TeaVMRunner();
window.__dsa = { routes: allRoutes(registry) };

let cleanup: () => void = () => {};
startRouter(window, (route) => {
  cleanup();
  shell.setActive(route);
  const page = renderRoute(route, shell.outlet, { registry, store, runner });
  cleanup = page.cleanup;
  document.title = page.title;
  window.scrollTo(0, 0);
  shell.outlet.focus({ preventScroll: true });
});
