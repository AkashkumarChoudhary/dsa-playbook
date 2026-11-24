import { describe, expect, it, vi } from 'vitest';
import { browserStorage, createStore, defaultState, normalize, STORAGE_KEY, trimDrills, type KeyValueStorage, type StorageEventSource } from '../../../src/core/store';

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

describe('progress fields (Part 1b)', () => {
  it('starts empty', () => {
    expect(defaultState()).toMatchObject({ lessons: {}, problems: {}, cards: {}, drills: {}, days: {} });
  });

  it('keeps valid progress and drops bad entries', () => {
    const s = normalize({
      lessons: { a: { openedAt: 1, bestScore: 2, total: 3, passedAt: 4, updatedAt: 4 }, b: { openedAt: 'x', bestScore: 0, total: 3, updatedAt: 1 } },
      problems: {
        p: { marks: { understood: 5, canExplain: 'no', wat: 1 }, solvedAt: 6, resolveSteps: 2, nextResolveAt: 9, revealedAt: 3, updatedAt: 6 },
        q: { marks: {}, resolveSteps: 7, updatedAt: 1 },
        r: { marks: {} },
      },
      cards: {
        'c:hook': { box: 3, dueDay: '2026-11-30', again: 1, lastDay: '2026-11-24', updatedAt: 2 },
        'c:spot': { box: 6, dueDay: '2026-11-30', again: 0, lastDay: '2026-11-24', updatedAt: 2 },
        'c:edges': { box: 1, dueDay: 'tomorrow', again: 0, lastDay: '2026-11-24', updatedAt: 2 },
      },
      drills: { a1: { itemId: 'i', patternIds: ['hashing'], correct: true, at: 10 }, a2: { itemId: 'i', patternIds: [1], correct: true, at: 11 } },
      days: { '2026-11-24': 3, '2026-11-25': 0, 'not-a-day': 2 },
    });
    expect(s.lessons).toEqual({ a: { openedAt: 1, bestScore: 2, total: 3, passedAt: 4, updatedAt: 4 } });
    expect(s.problems.p).toEqual({ marks: { understood: 5 }, solvedAt: 6, resolveSteps: 2, nextResolveAt: 9, revealedAt: 3, updatedAt: 6 });
    expect(s.problems.q?.resolveSteps).toBe(0);
    expect(s.problems.r).toBeUndefined();
    expect(Object.keys(s.cards)).toEqual(['c:hook']);
    expect(Object.keys(s.drills)).toEqual(['a1']);
    expect(s.days).toEqual({ '2026-11-24': 3 });
  });

  it('never lets a stored "__proto__" key change the prototype', () => {
    const s = normalize(JSON.parse('{"code":{"__proto__":{"source":"x","updatedAt":1}},"lessons":{"__proto__":{"openedAt":1,"bestScore":0,"total":3,"updatedAt":1}}}'));
    expect(Object.getPrototypeOf(s.code)).toBe(Object.prototype);
    expect(Object.keys(s.code)).toEqual([]);
    expect(Object.keys(s.lessons)).toEqual([]);
  });

  it('keeps only the newest 1,000 drill attempts', () => {
    const drills: Record<string, unknown> = {};
    for (let i = 0; i < 1005; i++) drills[`a${i}`] = { itemId: 'i', patternIds: [], correct: true, at: i };
    const s = normalize({ drills });
    expect(Object.keys(s.drills)).toHaveLength(1000);
    expect(s.drills.a4).toBeUndefined();
    expect(s.drills.a5).toBeDefined();
    const one = { x: { itemId: 'i', patternIds: [], correct: false, at: 1 } };
    expect(trimDrills(one, 5)).toBe(one);
  });

  it('keeps drill attempts written by two tabs', () => {
    const storage = memory();
    const a = createStore(storage);
    const b = createStore(storage);
    a.update((s) => { s.drills.x = { itemId: 'i', patternIds: ['p'], correct: true, at: 1 }; });
    b.update((s) => { s.drills.y = { itemId: 'j', patternIds: ['p'], correct: false, at: 2 }; });
    expect(Object.keys(JSON.parse(storage.data[STORAGE_KEY]!).drills).sort()).toEqual(['x', 'y']);
  });
});

describe('corrupt data (Part 1a follow-up)', () => {
  it('backs up the same corrupt value only once', () => {
    // Each backup key holds the time. A new time per call makes a second backup visible.
    let t = 0;
    const clock = vi.spyOn(Date, 'now').mockImplementation(() => ++t);
    const storage = memory({ [STORAGE_KEY]: '{not json' });
    const store = createStore(storage);
    store.update((s) => { s.settings.theme = 'light'; });
    clock.mockRestore();
    const backups = Object.keys(storage.data).filter((k) => k.startsWith('dsa:corrupt:'));
    expect(backups).toHaveLength(1);
    expect(storage.data[backups[0]!]).toBe('{not json');
  });
});
