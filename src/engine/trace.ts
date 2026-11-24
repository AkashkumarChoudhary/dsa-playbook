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
