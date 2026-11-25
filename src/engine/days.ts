/** Local-time day keys ("YYYY-MM-DD"). Engines take `now` or a day key, never Date.now(), so tests can pick any time. */

export const DAY_MS = 86_400_000;

const pad = (n: number) => String(n).padStart(2, '0');

/** The learner's local calendar day for a time in ms. */
export function dayKey(ms: number): string {
  const d = new Date(ms);
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export function isDayKey(s: string): boolean {
  return /^\d{4}-\d{2}-\d{2}$/.test(s);
}

function parts(key: string): [number, number, number] {
  const [y, m, d] = key.split('-').map(Number);
  return [y ?? 1970, m ?? 1, d ?? 1];
}

/** The day `n` days after `key` (n may be negative). Works on the calendar, so clock changes do not matter. */
export function addDays(key: string, n: number): string {
  const [y, m, d] = parts(key);
  const t = new Date(Date.UTC(y, m - 1, d + n));
  return `${t.getUTCFullYear()}-${pad(t.getUTCMonth() + 1)}-${pad(t.getUTCDate())}`;
}

/** Whole days from `a` to `b`. Positive when b is later. */
export function daysBetween(a: string, b: string): number {
  const [ya, ma, da] = parts(a);
  const [yb, mb, db] = parts(b);
  return Math.round((Date.UTC(yb, mb - 1, db) - Date.UTC(ya, ma - 1, da)) / DAY_MS);
}

/** The last `n` days ending with `today`, oldest first. */
export function lastNDays(today: string, n: number): string[] {
  return Array.from({ length: n }, (_, i) => addDays(today, i - n + 1));
}

/**
 * Days in a row with activity. Today counts when it has activity. When today has none yet,
 * the streak still runs up to yesterday, so it does not reset in the morning.
 */
export function streak(days: Readonly<Record<string, number>>, today: string): number {
  let day = (days[today] ?? 0) > 0 ? today : addDays(today, -1);
  let n = 0;
  while ((days[day] ?? 0) > 0) {
    n++;
    day = addDays(day, -1);
  }
  return n;
}

/** Shows a day key as "24 Nov 2026". */
export function formatDay(key: string): string {
  const [y, m, d] = parts(key);
  return new Date(y, m - 1, d).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}
