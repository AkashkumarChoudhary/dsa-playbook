import { describe, expect, it } from 'vitest';
import { createStore } from '../../../src/core/store';
import { initTheme, resolveTheme } from '../../../src/core/theme';

describe('resolveTheme', () => {
  it('uses the system only for "system"', () => {
    expect(resolveTheme('system', true)).toBe('light');
    expect(resolveTheme('system', false)).toBe('dark');
    expect(resolveTheme('dark', true)).toBe('dark');
    expect(resolveTheme('light', false)).toBe('light');
  });
});

describe('initTheme', () => {
  it('applies the theme and toggles it', () => {
    const data: Record<string, string> = {};
    const store = createStore({ getItem: (k) => data[k] ?? null, setItem: (k, v) => { data[k] = v; } });
    const theme = initTheme(window, store);
    const first = theme.current();
    expect(document.documentElement.dataset.theme).toBe(first);
    theme.toggle();
    const second = theme.current();
    expect(second).not.toBe(first);
    expect(document.documentElement.dataset.theme).toBe(second);
    expect(store.get().settings.theme).toBe(second);
  });
});
