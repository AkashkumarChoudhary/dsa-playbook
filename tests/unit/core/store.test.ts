import { describe, expect, it, vi } from 'vitest';
import { browserStorage, createStore, defaultState, normalize, STORAGE_KEY, type KeyValueStorage, type StorageEventSource } from '../../../src/core/store';

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

describe('blocked storage', () => {
  it('still gives a working store when getItem throws', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const store = createStore({ getItem: () => { throw new Error('SecurityError'); }, setItem: () => { throw new Error('SecurityError'); } });
    expect(store.get()).toEqual(defaultState());
    const cb = vi.fn();
    store.subscribe(cb);
    store.update((s) => { s.settings.theme = 'light'; });
    expect(store.get().settings.theme).toBe('light');
    expect(cb).toHaveBeenCalledTimes(1);
    expect(warn).toHaveBeenCalled();
    warn.mockRestore();
  });

  it('falls back to memory when reading localStorage throws', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const blocked = { get localStorage(): Storage { throw new DOMException('blocked', 'SecurityError'); } };
    const storage = browserStorage(blocked);
    storage.setItem('k', 'v');
    expect(storage.getItem('k')).toBe('v');
    const store = createStore(storage);
    store.update((s) => { s.code.p = { source: 'x', updatedAt: 1 }; });
    expect(createStore(storage).get().code.p?.source).toBe('x');
    warn.mockRestore();
  });

  it('uses localStorage when it works', () => {
    expect(browserStorage(window)).toBe(window.localStorage);
  });
});

describe('two tabs and newer fields', () => {
  it('keeps code written by another store when this one toggles the theme', () => {
    const storage = memory();
    const a = createStore(storage);
    const b = createStore(storage);
    a.update((s) => { s.code.p = { source: 'class Solution { /* A */ }', updatedAt: 5 }; });
    b.update((s) => { s.settings.theme = 'light'; s.settings.updatedAt = 6; });
    const saved = JSON.parse(storage.data[STORAGE_KEY]!);
    expect(saved.code.p.source).toBe('class Solution { /* A */ }');
    expect(saved.settings.theme).toBe('light');
    expect(b.get().code.p?.source).toBe('class Solution { /* A */ }');
  });

  it('keeps unknown fields in storage when it saves', () => {
    const storage = memory({ [STORAGE_KEY]: JSON.stringify({
      version: 1, settings: { theme: 'dark', updatedAt: 1, fontSize: 'big' }, code: { p: { source: 'x', updatedAt: 1, cursor: 4 } }, progress: { done: ['a'] },
    }) });
    const store = createStore(storage);
    store.update((s) => { s.settings.theme = 'light'; s.code.q = { source: 'y', updatedAt: 2 }; });
    const saved = JSON.parse(storage.data[STORAGE_KEY]!);
    expect(saved.progress).toEqual({ done: ['a'] });
    expect(saved.settings).toEqual({ theme: 'light', updatedAt: 1, fontSize: 'big' });
    expect(saved.code.p).toEqual({ source: 'x', updatedAt: 1, cursor: 4 });
    expect(saved.code.q).toEqual({ source: 'y', updatedAt: 2 });
  });

  it('still removes a field the change deletes', () => {
    const storage = memory({ [STORAGE_KEY]: JSON.stringify({ version: 1, settings: { theme: 'dark', updatedAt: 1 }, code: { p: { source: 'x', updatedAt: 1 } } }) });
    const store = createStore(storage);
    store.update((s) => { delete s.code.p; });
    expect(JSON.parse(storage.data[STORAGE_KEY]!).code).toEqual({});
  });

  it('refreshes and notifies when another tab saves', () => {
    const storage = memory();
    const heard: ((e: { key: string | null }) => void)[] = [];
    const win: StorageEventSource = { addEventListener: (_type, listener) => { heard.push(listener); } };
    const fire = (key: string | null) => heard.forEach((l) => l({ key }));
    const store = createStore(storage, win);
    const cb = vi.fn();
    store.subscribe(cb);
    storage.data[STORAGE_KEY] = JSON.stringify({ version: 1, settings: { theme: 'light', updatedAt: 9 }, code: {} });
    fire('other-key');
    expect(cb).not.toHaveBeenCalled();
    fire(STORAGE_KEY);
    expect(store.get().settings.theme).toBe('light');
    expect(cb).toHaveBeenCalledTimes(1);
  });
});
