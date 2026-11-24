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
