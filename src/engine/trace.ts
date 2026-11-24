export type MarkColor = 'current' | 'discarded' | 'range' | 'answer' | 'conflict';

export interface ArrayView {
  kind: 'array';
  id: string;
  label: string;
  values: (number | string)[];
  pointers: { name: string; index: number }[];
  marks: { index: number; color: MarkColor }[];
}

export interface HashView {
  kind: 'hash';
  id: string;
  label: string;
  mode: 'set' | 'map';
  entries: { key: string; value?: string }[];
  highlightKey?: string;
  highlightColor?: MarkColor;
}

export type View = ArrayView | HashView;

export interface Snapshot {
  /** name of a `// @L:name` marker in the Java source */
  line: string;
  vars: Record<string, string>;
  /** names of vars whose value changed since the previous step */
  changed: string[];
  views: View[];
  /** one plain sentence for this step */
  note: string;
}

export interface Trace {
  steps: Snapshot[];
  result: unknown;
}

export type ParseResult<T> = { ok: true; value: T } | { ok: false; message: string };

export interface InputField {
  name: string;
  label: string;
  placeholder: string;
}

// eslint-style note: `any` lets the registry hold traces with different input types.
export interface TraceDef<I = any> {
  id: string;
  maxSteps: number;
  inputFields: InputField[];
  parseInput(fields: Record<string, string>): ParseResult<I>;
  formatInput(input: I): Record<string, string>;
  fromArgs(args: unknown[]): I;
  run(input: I): Trace;
}

export function createRecorder(): {
  step(s: Omit<Snapshot, 'changed'>): void;
  finish(result: unknown): Trace;
} {
  const steps: Snapshot[] = [];
  let prev: Record<string, string> | null = null;
  return {
    step(s) {
      const before = prev;
      const changed = before === null ? [] : Object.keys(s.vars).filter((k) => before[k] !== s.vars[k]);
      steps.push(structuredClone({ ...s, changed }));
      prev = { ...s.vars };
    },
    finish(result) {
      return { steps, result };
    },
  };
}

const fmt = (n: number) => n.toLocaleString('en-US');

export function parseIntList(
  text: string,
  opts: { min: number; max: number; minLength: number; maxLength: number },
): ParseResult<number[]> {
  const cleaned = text.trim().replace(/^\[/, '').replace(/\]$/, '').trim();
  const parts = cleaned === '' ? [] : cleaned.split(/[\s,]+/).filter((p) => p !== '');
  if (parts.length < opts.minLength || parts.length > opts.maxLength) {
    return { ok: false, message: `Use between ${opts.minLength} and ${opts.maxLength} numbers.` };
  }
  if (!parts.every((p) => /^-?\d+$/.test(p))) {
    return { ok: false, message: 'Use whole numbers separated by commas, like 3, 8, 1, 8.' };
  }
  const values = parts.map(Number);
  if (values.some((v) => v < opts.min || v > opts.max)) {
    return { ok: false, message: `Each number must be between ${fmt(opts.min)} and ${fmt(opts.max)}.` };
  }
  return { ok: true, value: values };
}
