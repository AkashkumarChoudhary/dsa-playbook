import { describe, expect, it } from 'vitest';
import { argExpression, isGenerator, LiteralError, toJavaLiteral } from '../../../src/lab/java-literals';

describe('toJavaLiteral', () => {
  it.each([
    [5, 'int', '5'],
    [-2147483648, 'int', '-2147483648'],
    [9007199254740991, 'long', '9007199254740991L'],
    [2, 'double', '2.0'],
    [2.5, 'double', '2.5'],
    [true, 'boolean', 'true'],
    ['a', 'char', "'a'"],
    ["'", 'char', "'\\''"],
    ['hi "x"\n', 'String', '"hi \\"x\\"\\n"'],
    ['é', 'String', '"\\u00e9"'],
    [[1, 2], 'int[]', 'new int[]{1, 2}'],
    [[], 'int[]', 'new int[]{}'],
    [[[1], [2, 3]], 'int[][]', 'new int[][]{{1}, {2, 3}}'],
    [[['a', 'b']], 'char[][]', "new char[][]{{'a', 'b'}}"],
    [['x'], 'String[]', 'new String[]{"x"}'],
    [[1, 2], 'List<Integer>', 'new ArrayList<Integer>(Arrays.<Integer>asList(1, 2))'],
    [[], 'List<String>', 'new ArrayList<String>()'],
    [[[1], []], 'List<List<Integer>>', 'new ArrayList<List<Integer>>(Arrays.<List<Integer>>asList(new ArrayList<Integer>(Arrays.<Integer>asList(1)), new ArrayList<Integer>()))'],
  ] as const)('%j as %s', (value, type, out) => {
    expect(toJavaLiteral(value, type)).toBe(out);
  });

  it('rejects wrong values with plain messages', () => {
    expect(() => toJavaLiteral(1.5, 'int')).toThrow(LiteralError);
    expect(() => toJavaLiteral(2147483648, 'int')).toThrow('Expected an int');
    expect(() => toJavaLiteral('ab', 'char')).toThrow('Expected one character');
    expect(() => toJavaLiteral([1, 'x'], 'int[]')).toThrow('Expected an int');
    expect(() => toJavaLiteral({}, 'String')).toThrow('Expected a string');
  });
});

describe('generators', () => {
  it('detects and expands generators', () => {
    expect(isGenerator({ gen: 'intRange', n: 3 })).toBe(true);
    expect(isGenerator([1, 2])).toBe(false);
    expect(argExpression({ gen: 'intRange', n: 100000 }, 'int[]')).toBe('HarnessGen.intRange(100000)');
    expect(argExpression({ gen: 'intConst', n: 5, value: -1 }, 'int[]')).toBe('HarnessGen.intConst(5, -1)');
    expect(() => argExpression({ gen: 'intRange', n: 3 }, 'String')).toThrow('only make int[]');
    expect(argExpression([1], 'int[]')).toBe('new int[]{1}');
  });
});
