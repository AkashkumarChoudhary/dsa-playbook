import { html, render } from '../core/html';
import type { Registry } from '../core/registry';
import { href, type Route } from '../core/router';
import type { ThemeControl } from '../core/theme';

export interface Shell {
  outlet: HTMLElement;
  setActive(route: Route): void;
}

export function mountShell(root: HTMLElement, registry: Registry, theme: ThemeControl): Shell {
  render(root, html`
    <a class="visually-hidden" href="#main">Skip to content</a>
    <header class="topbar">
      <button type="button" class="menu-btn" data-action="menu" aria-label="Open menu" aria-expanded="false">☰</button>
      <a class="brand" href="#/">🧩 DSA Playbook</a>
      <span class="spacer"></span>
      <button type="button" data-action="theme" aria-label="Switch dark or light theme">🌓</button>
    </header>
    <div class="layout">
      <aside class="sidebar" aria-label="Modules">
        <nav>
          ${registry.modules.map((m) => html`
            <h2>${m.level}</h2>
            <ul>
              <li><a class="module-link" href="${href({ name: 'module', id: m.id })}">${m.icon} ${m.title}</a></li>
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

  return {
    outlet: root.querySelector('main') as HTMLElement,
    setActive(route) {
      const target = route.name === 'notFound' ? null : href(route);
      root.querySelectorAll('.sidebar a').forEach((a) => {
        if (a.getAttribute('href') === target) a.setAttribute('aria-current', 'page');
        else a.removeAttribute('aria-current');
      });
    },
  };
}
