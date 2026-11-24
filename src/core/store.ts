export type ThemeSetting = 'system' | 'dark' | 'light';

export interface SavedCode {
  source: string;
  updatedAt: number;
}

export interface StoredState {
  version: 1;
  settings: { theme: ThemeSetting; updatedAt: number };
  code: Record<string, SavedCode>;
}

export const STORAGE_KEY = 'dsa:v1';

export interface KeyValueStorage {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
}

export interface Store {
  get(): Readonly<StoredState>;
  update(mutator: (draft: StoredState) => void): void;
  subscribe(cb: (s: Readonly<StoredState>) => void): () => void;
}

export function defaultState(): StoredState {
  return { version: 1, settings: { theme: 'system', updatedAt: 0 }, code: {} };
}

const isObj = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null && !Array.isArray(v);
const THEMES: ThemeSetting[] = ['system', 'dark', 'light'];

export function normalize(raw: unknown): StoredState {
  const state = defaultState();
  if (!isObj(raw)) return state;
  if (isObj(raw.settings)) {
    const t = raw.settings.theme;
    if (typeof t === 'string' && (THEMES as string[]).includes(t)) state.settings.theme = t as ThemeSetting;
    if (typeof raw.settings.updatedAt === 'number') state.settings.updatedAt = raw.settings.updatedAt;
  }
  if (isObj(raw.code)) {
    for (const [id, v] of Object.entries(raw.code)) {
      if (isObj(v) && typeof v.source === 'string' && typeof v.updatedAt === 'number') {
        state.code[id] = { source: v.source, updatedAt: v.updatedAt };
      }
    }
  }
  return state;
}

export function createStore(storage: KeyValueStorage): Store {
  let state: StoredState;
  const text = storage.getItem(STORAGE_KEY);
  try {
    state = normalize(text ? JSON.parse(text) : null);
  } catch {
    if (text) {
      try {
        storage.setItem(`dsa:corrupt:${Date.now()}`, text);
      } catch {
        /* nothing else we can do */
      }
    }
    state = defaultState();
  }
  const listeners = new Set<(s: Readonly<StoredState>) => void>();

  function save() {
    try {
      storage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch (err) {
      console.warn('DSA Playbook could not save progress in this browser.', err);
    }
  }

  return {
    get: () => state,
    update(mutator) {
      const draft = structuredClone(state);
      mutator(draft);
      state = draft;
      save();
      for (const cb of listeners) cb(state);
    },
    subscribe(cb) {
      listeners.add(cb);
      return () => listeners.delete(cb);
    },
  };
}
