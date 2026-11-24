import type { ArgGenerator, ProblemSpec } from '../content-types';
import { isGenerator } from './java-literals';

const n = (x: number) => x.toLocaleString('en-US');

export function formatValue(v: unknown): string {
  return JSON.stringify(v) ?? 'null';
}

function describeGenerator(g: ArgGenerator): string {
  if (g.gen === 'intRange') return `${n(g.n)} numbers: 0, 1, 2, … ${n(g.n - 1)}`;
  return `${n(g.n)} copies of ${g.value}`;
}

export function formatArgs(spec: ProblemSpec, args: unknown[]): string {
  return spec.params
    .map((p, i) => {
      const a = args[i];
      return `${p.name} = ${isGenerator(a) ? describeGenerator(a) : formatValue(a)}`;
    })
    .join(', ');
}
