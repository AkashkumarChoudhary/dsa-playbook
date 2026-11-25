import { describe, expect, it, vi } from 'vitest';
import { href, parseRoute, startRouter } from '../../../src/core/router';

describe('parseRoute', () => {
  it.each([
    ['', { name: 'home' }],
    ['#', { name: 'home' }],
    ['#/', { name: 'home' }],
    ['#/m/foundations', { name: 'module', id: 'foundations' }],
    ['#/l/brute-better-optimal', { name: 'lesson', id: 'brute-better-optimal' }],
    ['#/p/contains-duplicate/', { name: 'problem', id: 'contains-duplicate' }],
    ['#/x/y', { name: 'notFound', path: '/x/y' }],
    ['#/l/Bad_Id', { name: 'notFound', path: '/l/Bad_Id' }],
    ['#/dashboard', { name: 'dashboard' }],
    ['#/roadmap/', { name: 'roadmap' }],
    ['#/settings', { name: 'settings' }],
    ['#/drills', { name: 'drills' }],
    ['#/drills/foundations', { name: 'drills', moduleId: 'foundations' }],
    ['#/drills/Bad_Id', { name: 'notFound', path: '/drills/Bad_Id' }],
    ['#/cards', { name: 'cards' }],
    ['#/cards/due', { name: 'cards', deck: 'due' }],
    ['#/cards/module-foundations', { name: 'cards', deck: 'module-foundations' }],
    ['#/sheets/neetcode150', { name: 'sheet', id: 'neetcode150' }],
    ['#/sheets/', { name: 'notFound', path: '/sheets/' }],
    ['#/m/a?x=1', { name: 'notFound', path: '/m/a?x=1' }],
  ])('%s', (hash, route) => {
    expect(parseRoute(hash)).toEqual(route);
  });
});

describe('href', () => {
  it('builds hashes', () => {
    expect(href({ name: 'home' })).toBe('#/');
    expect(href({ name: 'module', id: 'a' })).toBe('#/m/a');
    expect(href({ name: 'lesson', id: 'b' })).toBe('#/l/b');
    expect(href({ name: 'problem', id: 'c' })).toBe('#/p/c');
    expect(href({ name: 'dashboard' })).toBe('#/dashboard');
    expect(href({ name: 'roadmap' })).toBe('#/roadmap');
    expect(href({ name: 'settings' })).toBe('#/settings');
    expect(href({ name: 'drills' })).toBe('#/drills');
    expect(href({ name: 'drills', moduleId: 'm1' })).toBe('#/drills/m1');
    expect(href({ name: 'cards' })).toBe('#/cards');
    expect(href({ name: 'cards', deck: 'due' })).toBe('#/cards/due');
    expect(href({ name: 'sheet', id: 'striver-bs' })).toBe('#/sheets/striver-bs');
  });
  it('round-trips every route', () => {
    for (const h of ['#/', '#/dashboard', '#/roadmap', '#/settings', '#/drills', '#/drills/m1', '#/cards', '#/cards/weak', '#/sheets/neetcode150', '#/m/a', '#/l/b', '#/p/c']) {
      const r = parseRoute(h);
      expect(r.name, h).not.toBe('notFound');
      expect(href(r as Exclude<typeof r, { name: 'notFound' }>)).toBe(h);
    }
  });
});

describe('startRouter', () => {
  it('fires now and on hashchange, and can stop', () => {
    window.location.hash = '#/m/a';
    const seen = vi.fn();
    const stop = startRouter(window, seen);
    expect(seen).toHaveBeenLastCalledWith({ name: 'module', id: 'a' });
    window.location.hash = '#/l/b';
    window.dispatchEvent(new HashChangeEvent('hashchange'));
    expect(seen).toHaveBeenLastCalledWith({ name: 'lesson', id: 'b' });
    stop();
    window.location.hash = '#/p/c';
    window.dispatchEvent(new HashChangeEvent('hashchange'));
    expect(seen).not.toHaveBeenLastCalledWith({ name: 'problem', id: 'c' });
  });
});
