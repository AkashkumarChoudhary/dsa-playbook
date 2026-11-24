import type { CompareMode } from '../content-types';

const json = (v: unknown) => JSON.stringify(v);

function sortedCopy(a: unknown[]): unknown[] {
  return [...a].sort((x, y) => {
    const sx = json(x);
    const sy = json(y);
    return sx < sy ? -1 : sx > sy ? 1 : 0;
  });
}

function floatEqual(a: unknown, b: unknown): boolean {
  if (typeof a === 'number' && typeof b === 'number') {
    return Math.abs(a - b) <= 1e-5 * Math.max(1, Math.abs(a), Math.abs(b));
  }
  if (Array.isArray(a) && Array.isArray(b)) return a.length === b.length && a.every((x, i) => floatEqual(x, b[i]));
  return json(a) === json(b);
}

export function compareValues(mode: CompareMode, expected: unknown, actual: unknown): boolean {
  switch (mode) {
    case 'exact':
      return json(expected) === json(actual);
    case 'float':
      return floatEqual(expected, actual);
    case 'unorderedList':
      return Array.isArray(expected) && Array.isArray(actual) && json(sortedCopy(expected)) === json(sortedCopy(actual));
    case 'unorderedNested': {
      if (!Array.isArray(expected) || !Array.isArray(actual)) return false;
      const norm = (a: unknown[]) => sortedCopy(a.map((x) => (Array.isArray(x) ? sortedCopy(x) : x)));
      return json(norm(expected)) === json(norm(actual));
    }
  }
}
