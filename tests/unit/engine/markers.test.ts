import { describe, expect, it } from 'vitest';
import { parseMarkers } from '../../../src/engine/markers';

describe('parseMarkers', () => {
  it('strips markers and records 1-based lines', () => {
    const src = 'class A {\n  int x = 1; // @L:init\n  void f() {} //   @L:call-f\n}\n';
    const m = parseMarkers(src);
    expect(m.lines).toEqual({ init: 2, 'call-f': 3 });
    expect(m.code).toBe('class A {\n  int x = 1;\n  void f() {}\n}\n');
  });
  it('keeps normal comments', () => {
    expect(parseMarkers('int a; // count\n').code).toBe('int a; // count\n');
  });
  it('throws on duplicates', () => {
    expect(() => parseMarkers('a // @L:x\nb // @L:x')).toThrow('Duplicate line marker "x" on line 2');
  });
  it('normalizes Windows line endings', () => {
    expect(parseMarkers('a // @L:x\r\nb').code).toBe('a\nb');
  });
});
