import { describe, expect, it, vi } from 'vitest';
import { createStore, defaultState, normalize, STORAGE_KEY, type KeyValueStorage } from '../../../src/core/store';

function memory(initial: Record<string, string> = {}): KeyValueStorage & { data: Record<string, string> } {
  const data = { ...initial };
  return { data, getItem: (k) => data[k] ?? null, setItem: (k, v) => { data[k] = v; } };
}

describe('normalize', () => {
  it('returns defaults for junk', () => {
    expect(normalize(null)).toEqual(defaultState());
    expect(normalize(42)).toEqual(defaultState());
  });
  it('keeps valid fields and drops bad ones', () => {
    const s = normalize({ version: 1, settings: { theme: 'light', updatedAt: 5 }, code: { a: { source: 'x', updatedAt: 1 }, b: { source: 3 } } });
    expect(s.settings).toEqual({ theme: 'light', updatedAt: 5 });
    expect(s.code).toEqual({ a: { source: 'x', updatedAt: 1 } });
  });
  it('rejects an unknown theme', () => {
    expect(normalize({ settings: { theme: 'pink', updatedAt: 1 } }).settings.theme).toBe('system');
  });
});

describe('createStore', () => {
  it('loads, updates, saves and notifies', () => {
    const storage = memory({ [STORAGE_KEY]: JSON.stringify({ version: 1, settings: { theme: 'dark', updatedAt: 1 }, code: {} }) });
    const store = createStore(storage);
    expect(store.get().settings.theme).toBe('dark');
    const cb = vi.fn();
    const off = store.subscribe(cb);
    store.update((s) => { s.code.p = { source: 'class Solution {}', updatedAt: 2 }; });
    expect(cb).toHaveBeenCalledTimes(1);
    expect(JSON.parse(storage.data[STORAGE_KEY]!).code.p.source).toBe('class Solution {}');
    off();
    store.update((s) => { s.settings.theme = 'light'; });
    expect(cb).toHaveBeenCalledTimes(1);
  });
  it('backs up corrupt data and starts fresh', () => {
    const storage = memory({ [STORAGE_KEY]: '{not json' });
    const store = createStore(storage);
    expect(store.get()).toEqual(defaultState());
    expect(Object.keys(storage.data).some((k) => k.startsWith('dsa:corrupt:'))).toBe(true);
  });
  it('keeps working when saving fails', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const store = createStore({ getItem: () => null, setItem: () => { throw new Error('full'); } });
    store.update((s) => { s.settings.theme = 'light'; });
    expect(store.get().settings.theme).toBe('light');
    expect(warn).toHaveBeenCalled();
    warn.mockRestore();
  });
});
