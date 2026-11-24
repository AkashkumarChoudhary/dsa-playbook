import { html, render } from '../core/html';
import type { Registry } from '../core/registry';
import { href, type Route } from '../core/router';
import type { Store, StoredState } from '../core/store';
import type { ThemeControl } from '../core/theme';
import { lessonDone } from '../engine/mastery';
import { startedModules } from '../engine/progress';
import { isSolved } from '../engine/tracker';

export interface Shell {
  outlet: HTMLElement;
  setActive(route: Route): void;
}

type DotState = 'none' | 'started' | 'done';
const DOT_LABEL: Record<DotState, string> = { none: 'Not started', started: 'Started', done: 'Done' };

const NAV: { route: Exclude<Route, { name: 'notFound' }>; icon: string; label: string }[] = [
  { route: { name: 'home' }, icon: '🏠', label: 'Today' },
  { route: { name: 'dashboard' }, icon: '📊', label: 'Dashboard' },
  { route: { name: 'cards' }, icon: '🃏', label: 'Cards' },
  { route: { name: 'drills' }, icon: '🎯', label: 'Drills' },
  { route: { name: 'roadmap' }, icon: '🗺️', label: 'Roadmap' },
];

/** Empty until a lesson of the module is opened. Full when every built lesson is done and every built problem is solved. */
function moduleDot(registry: Registry, state: Readonly<StoredState>, moduleId: string, started: ReadonlySet<string>): DotState {
  const m = registry.module(moduleId);
  if (!m) return 'none';
  const items = m.lessonIds.length + m.problemIds.length;
  const done = items > 0 && m.lessonIds.every((id) => lessonDone(state, id)) && m.problemIds.every((id) => isSolved(state.problems[id]));
  if (done) return 'done';
  return started.has(moduleId) ? 'started' : 'none';
}

export function mountShell(root: HTMLElement, registry: Registry, theme: ThemeControl, store?: Store): Shell {
  render(root, html`
    <a class="visually-hidden" href="#main">Skip to content</a>
    <header class="topbar">
      <div class="topbar-row">
        <button type="button" class="menu-btn" data-action="menu" aria-label="Open menu" aria-expanded="false">☰</button>
        <a class="brand" href="#/">🧩 DSA Playbook</a>
        <span class="spacer"></span>
        <button type="button" data-action="theme" aria-label="Switch dark or light theme">🌓</button>
      </div>
      <nav class="topnav" aria-label="Main">
        ${NAV.map((n) => html`<a href="${href(n.route)}"><span class="nav-icon" aria-hidden="true">${n.icon}</span><span>${n.label}</span></a>`)}
      </nav>
    </header>
    <div class="layout">
      <aside class="sidebar" aria-label="Modules">
        <nav>
          ${registry.modules.map((m) => html`
            <h2>${m.level}</h2>
            <ul>
              <li><a class="module-link" href="${href({ name: 'module', id: m.id })}"><span class="dot" data-module-dot="${m.id}" data-state="none" role="img" aria-label="${DOT_LABEL.none}"></span> ${m.icon} ${m.title}</a></li>
              ${m.lessonIds.map((id) => registry.lesson(id)).filter(Boolean).map((l) => html`<li><a href="${href({ name: 'lesson', id: l!.id })}">📖 ${l!.title}</a></li>`)}
              ${m.problemIds.map((id) => registry.problem(id)).filter(Boolean).map((p) => html`<li><a href="${href({ name: 'problem', id: p!.id })}">🧪 ${p!.title}</a></li>`)}
            </ul>`)}
        </nav>
      </aside>
      <main class="outlet" id="main" tabindex="-1"></main>
    </div>`);

  const menuBtn = root.querySelector('[data-action="menu"]') as HTMLButtonElement;
  const setMenu = (open: boolean) => {
    document.body.classList.toggle('nav-open', open);
    menuBtn.setAttribute('aria-expanded', String(open));
  };
  menuBtn.addEventListener('click', () => setMenu(!document.body.classList.contains('nav-open')));
  root.querySelector('a[href="#main"]')!.addEventListener('click', (e) => {
    e.preventDefault();
    (root.querySelector('main') as HTMLElement).focus();
  });
  root.addEventListener('keydown', (e) => {
    if ((e as KeyboardEvent).key === 'Escape' && document.body.classList.contains('nav-open')) {
      setMenu(false);
      menuBtn.focus();
    }
  });
  root.querySelector('[data-action="theme"]')!.addEventListener('click', () => theme.toggle());
  root.querySelector('.sidebar')!.addEventListener('click', (e) => {
    if ((e.target as HTMLElement).closest('a')) setMenu(false);
  });

  const drawDots = (state: Readonly<StoredState>) => {
    const started = startedModules(state, (id) => registry.roadmapLesson(id)?.moduleId);
    root.querySelectorAll<HTMLElement>('[data-module-dot]').forEach((dot) => {
      const s = moduleDot(registry, state, dot.dataset.moduleDot ?? '', started);
      dot.dataset.state = s;
      dot.setAttribute('aria-label', DOT_LABEL[s]);
    });
  };
  if (store) {
    drawDots(store.get());
    store.subscribe(drawDots);
  }

  return {
    outlet: root.querySelector('main') as HTMLElement,
    setActive(route) {
      const target = route.name === 'notFound' ? null : href(route);
      root.querySelectorAll('.sidebar a').forEach((a) => {
        if (a.getAttribute('href') === target) a.setAttribute('aria-current', 'page');
        else a.removeAttribute('aria-current');
      });
      // Top nav links match by page name, so #/cards/due still marks Cards.
      root.querySelectorAll('.topnav a').forEach((a, i) => {
        if (NAV[i]!.route.name === route.name) a.setAttribute('aria-current', 'page');
        else a.removeAttribute('aria-current');
      });
    },
  };
}
