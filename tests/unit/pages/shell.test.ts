import { describe, expect, it } from 'vitest';
import { buildRegistry } from '../../../src/core/registry';
import type { Module } from '../../../src/content-types';
import { mountShell } from '../../../src/pages/shell';
import { renderHome } from '../../../src/pages/home';
import { renderModule } from '../../../src/pages/module-page';

const m: Module = { id: 'foundations', order: 1, level: 'basics', icon: '🧱', title: 'Foundations', summary: 'The basics.', status: 'building', outcomes: ['Say a Big-O.'], lessonIds: [], problemIds: [], quiz: [], cheatsheet: [], glossary: [] };
const registry = buildRegistry({ modules: [m], lessons: [], problems: [], traces: [] });

describe('shell', () => {
  it('renders nav, toggles theme and marks the active link', () => {
    const root = document.createElement('div');
    let toggled = 0;
    const shell = mountShell(root, registry, { current: () => 'dark', toggle: () => { toggled++; } });
    expect(root.querySelector('a.module-link')!.getAttribute('href')).toBe('#/m/foundations');
    (root.querySelector('[data-action="theme"]') as HTMLButtonElement).click();
    expect(toggled).toBe(1);
    shell.setActive({ name: 'module', id: 'foundations' });
    expect(root.querySelector('a[aria-current="page"]')!.getAttribute('href')).toBe('#/m/foundations');
    (root.querySelector('[data-action="menu"]') as HTMLButtonElement).click();
    expect(document.body.classList.contains('nav-open')).toBe(true);
    expect(shell.outlet.tagName).toBe('MAIN');
  });
  it('home and module pages list modules and outcomes', () => {
    expect(renderHome(registry).__html).toContain('Foundations');
    expect(renderModule(m, registry).__html).toContain('Say a Big-O.');
  });
});
