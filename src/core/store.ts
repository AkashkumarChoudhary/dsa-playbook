export type ThemeSetting = 'system' | 'dark' | 'light';

export interface SavedCode {
  source: string;
  updatedAt: number;
}

/** One lesson's progress. `openedAt` is the last time it was opened. Spec §9.3: done means `passedAt` is set. */
export interface LessonProgress {
  openedAt: number;
  bestScore: number;
  total: number;
  passedAt?: number;
  updatedAt: number;
}

/** Ticks and automatic levels on the problem page (spec §9.1). Each value is the time it was set. */
export type MarkKey = 'understood' | 'solvedAlone' | 'selfMarkedAlone' | 'canExplain' | 'fromMemory';
export const MARK_KEYS: MarkKey[] = ['understood', 'solvedAlone', 'selfMarkedAlone', 'canExplain', 'fromMemory'];

export interface ProblemProgress {
  marks: Partial<Record<MarkKey, number>>;
  /** first time Submit passed every test */
  solvedAt?: number;
  /** first time the learner said they solved it elsewhere */
  solvedElsewhere?: number;
  /** first time Show solutions was pressed */
  revealedAt?: number;
  /** last time the page was opened, for "continue where you left off" */
  openedAt?: number;
  /** re-solves done, 0 to 3 (spec §9.2) */
  resolveSteps: number;
  nextResolveAt?: number;
  updatedAt: number;
}

export type Box = 1 | 2 | 3 | 4 | 5;

/** Leitner state of one flashcard (spec §9.5). Days are local "YYYY-MM-DD" keys. */
export interface CardProgress {
  box: Box;
  dueDay: string;
  again: number;
  lastDay: string;
  updatedAt: number;
}

export interface DrillAttempt {
  itemId: string;
  patternIds: string[];
  correct: boolean;
  at: number;
}

/** Drill attempts kept in storage. Older ones are dropped. */
export const MAX_DRILLS = 1000;

export interface StoredState {
  version: 1;
  settings: { theme: ThemeSetting; updatedAt: number };
  code: Record<string, SavedCode>;
  lessons: Record<string, LessonProgress>;
  problems: Record<string, ProblemProgress>;
  cards: Record<string, CardProgress>;
  /** keyed by attempt id, so two tabs can add attempts without losing each other's */
  drills: Record<string, DrillAttempt>;
  /** activity count per local day, for the streak and the activity grid */
  days: Record<string, number>;
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
  return { version: 1, settings: { theme: 'system', updatedAt: 0 }, code: {}, lessons: {}, problems: {}, cards: {}, drills: {}, days: {} };
}

const isObj = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null && !Array.isArray(v);
const isNum = (v: unknown): v is number => typeof v === 'number' && Number.isFinite(v);
const isDay = (v: unknown): v is string => typeof v === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(v);
const THEMES: ThemeSetting[] = ['system', 'dark', 'light'];

/** Own entries of a stored record. Skips "__proto__", which would change the object's prototype. */
function entries(v: unknown): [string, unknown][] {
  return isObj(v) ? Object.entries(v).filter(([k]) => k !== '__proto__') : [];
}

function lessonProgress(v: unknown): LessonProgress | null {
  if (!isObj(v) || !isNum(v.openedAt) || !isNum(v.bestScore) || !isNum(v.total) || !isNum(v.updatedAt)) return null;
  const out: LessonProgress = { openedAt: v.openedAt, bestScore: v.bestScore, total: v.total, updatedAt: v.updatedAt };
  if (isNum(v.passedAt)) out.passedAt = v.passedAt;
  return out;
}

function problemProgress(v: unknown): ProblemProgress | null {
  if (!isObj(v) || !isNum(v.updatedAt)) return null;
  const marks: ProblemProgress['marks'] = {};
  for (const k of MARK_KEYS) {
    const t = isObj(v.marks) ? v.marks[k] : undefined;
    if (isNum(t)) marks[k] = t;
  }
  const steps = v.resolveSteps;
  const out: ProblemProgress = { marks, resolveSteps: Number.isInteger(steps) && (steps as number) >= 0 && (steps as number) <= 3 ? (steps as number) : 0, updatedAt: v.updatedAt };
  for (const k of ['solvedAt', 'solvedElsewhere', 'revealedAt', 'openedAt', 'nextResolveAt'] as const) {
    const t = v[k];
    if (isNum(t)) out[k] = t;
  }
  return out;
}

function cardProgress(v: unknown): CardProgress | null {
  if (!isObj(v) || !isDay(v.dueDay) || !isDay(v.lastDay) || !isNum(v.again) || v.again < 0 || !isNum(v.updatedAt)) return null;
  if (![1, 2, 3, 4, 5].includes(v.box as number)) return null;
  return { box: v.box as Box, dueDay: v.dueDay, again: v.again, lastDay: v.lastDay, updatedAt: v.updatedAt };
}

function drillAttempt(v: unknown): DrillAttempt | null {
  if (!isObj(v) || typeof v.itemId !== 'string' || typeof v.correct !== 'boolean' || !isNum(v.at)) return null;
  if (!Array.isArray(v.patternIds) || !v.patternIds.every((p) => typeof p === 'string')) return null;
  return { itemId: v.itemId, patternIds: [...(v.patternIds as string[])], correct: v.correct, at: v.at };
}

/** Keeps the newest `max` attempts. */
export function trimDrills(drills: Record<string, DrillAttempt>, max = MAX_DRILLS): Record<string, DrillAttempt> {
  const list = Object.entries(drills);
  if (list.length <= max) return drills;
  list.sort((a, b) => b[1].at - a[1].at || (a[0] < b[0] ? -1 : 1));
  return Object.fromEntries(list.slice(0, max));
}

export function normalize(raw: unknown): StoredState {
  const state = defaultState();
  if (!isObj(raw)) return state;
  if (isObj(raw.settings)) {
    const t = raw.settings.theme;
    if (typeof t === 'string' && (THEMES as string[]).includes(t)) state.settings.theme = t as ThemeSetting;
    if (typeof raw.settings.updatedAt === 'number') state.settings.updatedAt = raw.settings.updatedAt;
  }
  for (const [id, v] of entries(raw.code)) {
    if (isObj(v) && typeof v.source === 'string' && typeof v.updatedAt === 'number') {
      state.code[id] = { source: v.source, updatedAt: v.updatedAt };
    }
  }
  for (const [id, v] of entries(raw.lessons)) {
    const p = lessonProgress(v);
    if (p) state.lessons[id] = p;
  }
  for (const [id, v] of entries(raw.problems)) {
    const p = problemProgress(v);
    if (p) state.problems[id] = p;
  }
  for (const [id, v] of entries(raw.cards)) {
    const p = cardProgress(v);
    if (p) state.cards[id] = p;
  }
  for (const [id, v] of entries(raw.drills)) {
    const a = drillAttempt(v);
    if (a) state.drills[id] = a;
  }
  state.drills = trimDrills(state.drills);
  for (const [day, n] of entries(raw.days)) {
    if (isDay(day) && isNum(n) && n > 0) state.days[day] = n;
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
  /** The corrupt text already copied, so the same bad value is backed up only once. */
  let backedUp: string | null = null;

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
      if (text !== backedUp) {
        backedUp = text;
        try {
          storage.setItem(`dsa:corrupt:${Date.now()}`, text);
        } catch {
          /* nothing else we can do */
        }
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
