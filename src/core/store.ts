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

/** Anything that sends the browser "storage" event, which fires when another tab writes. */
export interface StorageEventSource {
  addEventListener(type: 'storage', listener: (e: { key: string | null }) => void): void;
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

/**
 * Three-way merge used when writing. `stored` is the JSON in storage, `before` is its normalized
 * copy and `after` is that copy after the change. Only what the change touched is written.
 * Fields this version does not know (from a newer version or another tab) are kept.
 */
function merge(stored: unknown, before: unknown, after: unknown): unknown {
  if (isObj(stored) && isObj(before) && isObj(after)) {
    const out: Record<string, unknown> = { ...stored };
    for (const k of Object.keys(before)) if (!(k in after)) delete out[k];
    for (const [k, v] of Object.entries(after)) out[k] = merge(stored[k], before[k], v);
    return out;
  }
  const unchanged = JSON.stringify(before) === JSON.stringify(after);
  return unchanged && stored !== undefined ? stored : after;
}

/** A store-shaped map in memory, used when the browser blocks storage. */
export function memoryStorage(): KeyValueStorage {
  const data = new Map<string, string>();
  return { getItem: (k) => data.get(k) ?? null, setItem: (k, v) => { data.set(k, v); } };
}

/** localStorage when the browser allows it. Reading `localStorage` itself throws when cookies are blocked. */
export function browserStorage(win: Pick<Window, 'localStorage'>): KeyValueStorage {
  try {
    const s = win.localStorage;
    s.getItem(STORAGE_KEY);
    return s;
  } catch (err) {
    console.warn('DSA Playbook cannot use browser storage here. Your progress lasts until you close this page.', err);
    return memoryStorage();
  }
}

interface Loaded {
  raw: unknown;
  state: StoredState;
}

export function createStore(storage: KeyValueStorage, win?: StorageEventSource): Store {
  let warnedRead = false;

  /** Reads and normalizes storage. Null means it could not be read or was corrupt. */
  function load(): Loaded | null {
    let text: string | null;
    try {
      text = storage.getItem(STORAGE_KEY);
    } catch (err) {
      if (!warnedRead) console.warn('DSA Playbook could not read saved progress in this browser.', err);
      warnedRead = true;
      return null;
    }
    if (!text) return { raw: undefined, state: defaultState() };
    try {
      const raw: unknown = JSON.parse(text);
      return { raw, state: normalize(raw) };
    } catch {
      try {
        storage.setItem(`dsa:corrupt:${Date.now()}`, text);
      } catch {
        /* nothing else we can do */
      }
      return null;
    }
  }

  const first = load() ?? { raw: undefined, state: defaultState() };
  let state: StoredState = first.state;
  let lastRaw: unknown = first.raw;
  const listeners = new Set<(s: Readonly<StoredState>) => void>();
  const notify = () => {
    for (const cb of listeners) cb(state);
  };

  function save(value: unknown) {
    try {
      storage.setItem(STORAGE_KEY, JSON.stringify(value));
    } catch (err) {
      console.warn('DSA Playbook could not save progress in this browser.', err);
    }
  }

  win?.addEventListener('storage', (e) => {
    if (e.key !== null && e.key !== STORAGE_KEY) return;
    const fresh = load();
    if (!fresh) return;
    state = fresh.state;
    lastRaw = fresh.raw;
    notify();
  });

  return {
    get: () => state,
    update(mutator) {
      // Read again first: another tab may have saved since we last looked.
      const fresh = load() ?? { raw: lastRaw, state };
      const draft = structuredClone(fresh.state);
      mutator(draft);
      const out = isObj(fresh.raw) ? merge(fresh.raw, fresh.state, draft) : draft;
      state = draft;
      lastRaw = structuredClone(out);
      save(out);
      notify();
    },
    subscribe(cb) {
      listeners.add(cb);
      return () => listeners.delete(cb);
    },
  };
}
