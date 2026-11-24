import { beforeEach, describe, expect, it } from 'vitest';
import { buildRegistry } from '../../../src/core/registry';
import type { Lesson, Module } from '../../../src/content-types';
import { createStore } from '../../../src/core/store';
import { mountShell } from '../../../src/pages/shell';
import { renderHome } from '../../../src/pages/home';
import { renderModule } from '../../../src/pages/module-page';

const m: Module = { id: 'foundations', order: 1, level: 'basics', icon: '🧱', title: 'Foundations', summary: 'The basics.', status: 'building', outcomes: ['Say a Big-O.'], lessonIds: [], problemIds: [], quiz: [], cheatsheet: [], glossary: [] };
const registry = buildRegistry({ modules: [m], lessons: [], problems: [], traces: [] });

describe('shell', () => {
  beforeEach(() => document.body.classList.remove('nav-open'));
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
  it('skip link keeps the hash and focuses the outlet', () => {
    const root = document.createElement('div');
    document.body.appendChild(root);
    const shell = mountShell(root, registry, { current: () => 'dark', toggle: () => {} });
    const before = location.hash;
    (root.querySelector('a[href="#main"]') as HTMLAnchorElement).click();
    expect(location.hash).toBe(before);
    expect(document.activeElement).toBe(shell.outlet);
    root.remove();
  });
  it('Escape closes the menu and syncs aria-expanded', () => {
    const root = document.createElement('div');
    document.body.appendChild(root);
    mountShell(root, registry, { current: () => 'dark', toggle: () => {} });
    const btn = root.querySelector('[data-action="menu"]') as HTMLButtonElement;
    btn.click();
    expect(btn.getAttribute('aria-expanded')).toBe('true');
    root.querySelector('.sidebar')!.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    expect(document.body.classList.contains('nav-open')).toBe(false);
    expect(btn.getAttribute('aria-expanded')).toBe('false');
    expect(document.activeElement).toBe(btn);
    root.remove();
  });
  it('home and module pages list modules and outcomes', () => {
    expect(renderHome(registry).__html).toContain('Foundations');
    expect(renderModule(m, registry).__html).toContain('Say a Big-O.');
  });
});

describe('top nav and module dots (Part 1b)', () => {
  const memStore = () => { const d: Record<string, string> = {}; return createStore({ getItem: (k) => d[k] ?? null, setItem: (k, v) => { d[k] = v; } }); };
  const lesson = { id: 'l1', moduleId: 'foundations', title: 'L1' } as unknown as Lesson;
  const withLesson = buildRegistry({ modules: [{ ...m, lessonIds: ['l1'] }], lessons: [lesson], problems: [], traces: [] });

  it('has a compact top nav and marks the current page', () => {
    const root = document.createElement('div');
    const shell = mountShell(root, registry, { current: () => 'dark', toggle: () => {} });
    const links = [...root.querySelectorAll('.topnav a')];
    expect(links.map((a) => [a.textContent, a.getAttribute('href')])).toEqual([
      ['🏠Today', '#/'], ['📊Dashboard', '#/dashboard'], ['🃏Cards', '#/cards'], ['🎯Drills', '#/drills'], ['🗺️Roadmap', '#/roadmap'],
    ]);
    shell.setActive({ name: 'dashboard' });
    expect(root.querySelector('.topnav a[aria-current="page"]')!.getAttribute('href')).toBe('#/dashboard');
  });

  it('marks the top nav link by page name, also on sub-routes', () => {
    const root = document.createElement('div');
    const shell = mountShell(root, registry, { current: () => 'dark', toggle: () => {} });
    const current = () => [...root.querySelectorAll('.topnav a[aria-current="page"]')].map((a) => a.getAttribute('href'));
    shell.setActive({ name: 'cards', deck: 'due' });
    expect(current()).toEqual(['#/cards']);
    shell.setActive({ name: 'drills', moduleId: registry.modules[0]!.id });
    expect(current()).toEqual(['#/drills']);
    shell.setActive({ name: 'home' });
    expect(current()).toEqual(['#/']);
    shell.setActive({ name: 'module', id: 'foundations' });
    expect(current()).toEqual([]);
  });

  it('links to Settings from the header, outside the top nav', () => {
    const root = document.createElement('div');
    const shell = mountShell(root, registry, { current: () => 'dark', toggle: () => {} });
    const gear = root.querySelector<HTMLAnchorElement>('.topbar-row a[aria-label="Settings"]')!;
    expect(gear.getAttribute('href')).toBe('#/settings');
    expect(gear.nextElementSibling).toBe(root.querySelector('[data-action="theme"]'));
    expect(root.querySelectorAll('.topnav a')).toHaveLength(5);
    expect(root.querySelector('.topnav a[href="#/settings"]')).toBeNull();
    const current = () => [...root.querySelectorAll('.topnav a[aria-current="page"]')].map((a) => a.getAttribute('href'));
    shell.setActive({ name: 'settings' });
    expect(current()).toEqual([]);
    shell.setActive({ name: 'roadmap' });
    expect(current()).toEqual(['#/roadmap']);
  });

  it('fills the module dot as progress grows', () => {
    const root = document.createElement('div');
    const store = memStore();
    mountShell(root, withLesson, { current: () => 'dark', toggle: () => {} }, store);
    const dot = root.querySelector<HTMLElement>('[data-module-dot="foundations"]')!;
    expect(dot.dataset.state).toBe('none');
    expect(dot.getAttribute('aria-label')).toBe('Not started');
    store.update((s) => { s.lessons.l1 = { openedAt: 1, bestScore: 0, total: 0, updatedAt: 1 }; });
    expect(dot.dataset.state).toBe('started');
    store.update((s) => { s.lessons.l1 = { openedAt: 1, bestScore: 3, total: 3, passedAt: 2, updatedAt: 2 }; });
    expect(dot.dataset.state).toBe('done');
    expect(dot.getAttribute('aria-label')).toBe('Done');
  });
});
