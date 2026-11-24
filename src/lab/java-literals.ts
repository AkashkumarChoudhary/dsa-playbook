import type { ArgGenerator, JavaType } from '../content-types';

export class LiteralError extends Error {}

const INT_MIN = -2147483648;
const INT_MAX = 2147483647;

function show(v: unknown): string {
  return JSON.stringify(v) ?? String(v);
}

function escapeJavaChar(ch: string): string {
  const code = ch.charCodeAt(0);
  if (ch === '\\') return '\\\\';
  if (ch === '"') return '\\"';
  if (ch === "'") return "\\'";
  if (ch === '\n') return '\\n';
  if (ch === '\r') return '\\r';
  if (ch === '\t') return '\\t';
  if (code < 0x20 || code > 0x7e) return `\\u${code.toString(16).padStart(4, '0')}`;
  return ch;
}

function escapeJavaString(s: string): string {
  let out = '';
  for (let i = 0; i < s.length; i++) {
    const ch = s[i] as string;
    out += ch === "'" ? "'" : escapeJavaChar(ch);
  }
  return out;
}

function intLit(v: unknown): string {
  if (typeof v !== 'number' || !Number.isInteger(v) || v < INT_MIN || v > INT_MAX) {
    throw new LiteralError(`Expected an int, got ${show(v)}`);
  }
  return String(v);
}

function stringLit(v: unknown): string {
  if (typeof v !== 'string') throw new LiteralError(`Expected a string, got ${show(v)}`);
  return `"${escapeJavaString(v)}"`;
}

function charLit(v: unknown): string {
  if (typeof v !== 'string' || v.length !== 1) throw new LiteralError(`Expected one character, got ${show(v)}`);
  return `'${escapeJavaChar(v)}'`;
}

function arr(v: unknown, what: string): unknown[] {
  if (!Array.isArray(v)) throw new LiteralError(`Expected ${what}, got ${show(v)}`);
  return v;
}

function list(elemType: string, items: string[]): string {
  if (items.length === 0) return `new ArrayList<${elemType}>()`;
  return `new ArrayList<${elemType}>(Arrays.<${elemType}>asList(${items.join(', ')}))`;
}

export function toJavaLiteral(value: unknown, type: JavaType): string {
  switch (type) {
    case 'int':
      return intLit(value);
    case 'long':
      if (typeof value !== 'number' || !Number.isSafeInteger(value)) throw new LiteralError(`Expected a long, got ${show(value)}`);
      return `${value}L`;
    case 'double': {
      if (typeof value !== 'number' || !Number.isFinite(value)) throw new LiteralError(`Expected a double, got ${show(value)}`);
      const s = String(value);
      return /[.eE]/.test(s) ? s : `${s}.0`;
    }
    case 'boolean':
      if (typeof value !== 'boolean') throw new LiteralError(`Expected true or false, got ${show(value)}`);
      return String(value);
    case 'char':
      return charLit(value);
    case 'String':
      return stringLit(value);
    case 'int[]':
      return `new int[]{${arr(value, 'an array of ints').map(intLit).join(', ')}}`;
    case 'int[][]':
      return `new int[][]{${arr(value, 'an array of int arrays').map((row) => `{${arr(row, 'an array of ints').map(intLit).join(', ')}}`).join(', ')}}`;
    case 'char[][]':
      return `new char[][]{${arr(value, 'a grid of characters').map((row) => `{${arr(row, 'a row of characters').map(charLit).join(', ')}}`).join(', ')}}`;
    case 'String[]':
      return `new String[]{${arr(value, 'an array of strings').map(stringLit).join(', ')}}`;
    case 'List<Integer>':
      return list('Integer', arr(value, 'a list of ints').map(intLit));
    case 'List<String>':
      return list('String', arr(value, 'a list of strings').map(stringLit));
    case 'List<List<Integer>>':
      return list('List<Integer>', arr(value, 'a list of int lists').map((row) => list('Integer', arr(row, 'a list of ints').map(intLit))));
    case 'List<List<String>>':
      return list('List<String>', arr(value, 'a list of string lists').map((row) => list('String', arr(row, 'a list of strings').map(stringLit))));
  }
}

export function isGenerator(v: unknown): v is ArgGenerator {
  return typeof v === 'object' && v !== null && !Array.isArray(v) && 'gen' in v;
}

export function argExpression(value: unknown, type: JavaType): string {
  if (!isGenerator(value)) return toJavaLiteral(value, type);
  if (type !== 'int[]') throw new LiteralError(`Generators can only make int[] values, not ${type}`);
  if (!Number.isInteger(value.n) || value.n < 0) throw new LiteralError(`Generator size must be a whole number, got ${show(value.n)}`);
  if (value.gen === 'intRange') return `HarnessGen.intRange(${value.n})`;
  return `HarnessGen.intConst(${value.n}, ${intLit(value.value)})`;
}
